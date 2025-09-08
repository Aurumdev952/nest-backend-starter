import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ZodValidationPipe } from 'nestjs-zod';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of audit logs (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: 'Filter by action',
  })
  @ApiQuery({
    name: 'resource',
    required: false,
    type: String,
    description: 'Filter by resource',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['SUCCESS', 'FAILURE'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter logs from this date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter logs up to this date',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'General search term',
  })
  @ApiResponse({ status: 200, description: 'List of audit logs retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource (User is not an Admin).',
  })
  findAll(
    @Query(new ZodValidationPipe(AuditLogQueryDto))
    queryDto: AuditLogQueryDto,
  ) {
    return this.auditLogService.findAllPaginated(queryDto);
  }

  @Get('/types')
  @ApiOperation({ summary: 'Get all audit log types' })
  @ApiResponse({
    status: 200,
    description: 'List of audit log types retrieved.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource (User is not an Admin).',
  })
  async getAuditLogTypes() {
    return this.auditLogService.getAuditLogTypes();
  }
}
