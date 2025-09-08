import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ExportColumnDto {
  @ApiProperty({ description: 'Column header text' })
  @IsString()
  header: string;

  @ApiProperty({ description: 'Column key for data mapping' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Column width' })
  @IsOptional()
  @IsString()
  width?: number;

  @ApiPropertyOptional({
    description: 'Column data type',
    enum: ['string', 'number', 'date', 'boolean'],
  })
  @IsOptional()
  @IsEnum(['string', 'number', 'date', 'boolean'])
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export class ExportRequestDto {
  @ApiProperty({
    description: 'Export type',
    enum: ['excel', 'pdf', 'zip'],
  })
  @IsEnum(['excel', 'pdf', 'zip'])
  type: 'excel' | 'pdf' | 'zip';

  @ApiProperty({ description: 'Export filename (without extension)' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ description: 'PDF title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Column definitions', type: [ExportColumnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportColumnDto)
  columns: ExportColumnDto[];

  @ApiProperty({ description: 'Data rows to export', type: [Object] })
  @IsArray()
  @IsObject({ each: true })
  rows: Record<string, any>[];
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Success message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  error?: string;
}
