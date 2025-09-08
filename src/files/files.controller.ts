import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { File } from 'db/client';
import type { Response } from 'express';
import type { AuthenticatedUser } from 'src/auth/decorators/get-user.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description: 'New file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        private: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1 * 100 * 1024 * 1024, // 100 MB limit
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() { private: isPrivate }: { private: string },
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.filesService.uploadFile(
      file,
      isPrivate !== undefined ? (isPrivate === 'true' ? true : false) : false,
      user.id,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'File ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own this File.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  deleteFile(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.filesService.deleteFile(id, user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific File by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'File ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own this File.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<File> {
    return this.filesService.findOne(id, user.id, user);
  }

  @Get('serve/by-id/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Serve a file directly using its ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the file to serve.',
  })
  @ApiResponse({
    status: 200,
    description: 'File content served directly.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User not authorized to access this private File.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async serveFileById(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser | undefined,
    @Res() res: Response,
  ) {
    const { file, stream } = await this.filesService.getFileById(
      id,
      user?.id,
      user,
    );

    const headers = {
      'Content-Type': file.fileType,
      'Content-Disposition': `inline; filename="${file.title}"`,
      'Content-Length': file.size.toString(),
    };

    if (file.fileType.startsWith('image/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    res.set(headers);

    stream.pipe(res);
  }

  @Get('presigned-url/by-id/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a presigned URL for a file by its ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'File ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async getPresignedUrlById(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getPresignedUrlById(id);
  }

  @Get('presigned-url/by-url/*fileUrl')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get a presigned URL for a file by its fileUrl (key)',
  })
  @ApiParam({
    name: 'fileUrl',
    type: 'string',
    description: 'The S3 key/path of the file (e.g., thumbnails/image.jpg).',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async getPresignedUrlByFileUrl(@Param('fileUrl') fileUrl: string[]) {
    const decodedFileUrl = decodeURIComponent(fileUrl.join('/'));
    return this.filesService.getPresignedUrlByFileUrl(decodedFileUrl);
  }

  @Get('serve/signed/:id')
  @ApiOperation({ summary: 'Serve a file using a signed URL' })
  @ApiParam({ name: 'id', type: 'string', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File content served.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired URL.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async serveSignedFile(
    @Param('id') id: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: Response,
  ) {
    const { file, stream } = await this.filesService.getStreamForSignedFile(
      id,
      parseInt(expires, 10),
      signature,
    );

    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': file.fileType,
      'Content-Length': file.size.toString(),
    });

    stream.pipe(res);
  }

  @Get('serve/*fileUrl')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Serve a file directly using its S3 fileUrl (key)' })
  @ApiParam({
    name: 'fileUrl',
    type: 'string',
    description:
      'The S3 key/path of the file to serve (e.g., thumbnails/image.jpg).',
  })
  @ApiResponse({
    status: 200,
    description: 'File content served directly.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User not authorized to access this private File.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async serveFile(
    @Param('fileUrl') fileUrl: string[],
    @GetUser() user: AuthenticatedUser | undefined,
    @Res() res: Response,
  ) {
    const decodedFileUrl = decodeURIComponent(fileUrl.join('/'));
    const { file, stream } = await this.filesService.getFileByFileUrl(
      decodedFileUrl,
      user?.id,
      user,
    );
    const headers = {
      'Content-Type': file.fileType,
      'Content-Disposition': `inline; filename="${file.title}"`,
      'Content-Length': file.size.toString(),
    };

    if (file.fileType.startsWith('image/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    res.set(headers);

    stream.pipe(res);
  }
}
