import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ExportColumn, ExportData, ExportOptions, ExportResult } from './interfaces/export.interface';
import { ExcelHandler } from './excel-handler';
import { PDFHandler } from './pdf-handler';
import { ZipHandler } from './zip-handler';
import { DataFormatter } from './data-formatter';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  async exportData(
    columns: ExportColumn[],
    rows: Record<string, any>[],
    options: ExportOptions,
    res: Response,
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    }
  ): Promise<ExportResult> {
    try {
      const exportData: ExportData = {
        columns,
        rows,
      };

      if (options.type === 'excel') {
        await ExcelHandler.exportToExcel(exportData, options, res, formatterOptions);
      } else if (options.type === 'pdf') {
        await PDFHandler.exportToPDF(exportData, options, res, formatterOptions);
      } else if (options.type === 'zip') {
        await ZipHandler.exportToZip(exportData, options, res, formatterOptions);
      } else {
        throw new Error(`Unsupported export type: ${options.type}`);
      }

      this.logger.log(`Successfully exported ${rows.length} rows as ${options.type}`);
      return {
        success: true,
        message: `Successfully exported ${rows.length} rows as ${options.type}`,
      };
    } catch (error) {
      this.logger.error('Export failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  // Helper method to create formatted export data
  createFormattedExportData(
    columns: ExportColumn[],
    rawRows: Record<string, any>[],
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    }
  ): ExportData {
    const formattedRows = rawRows.map(row =>
      DataFormatter.formatRowData(
        row,
        columns.map(col => ({ key: col.key, type: col.type })),
        formatterOptions
      )
    );

    return {
      columns,
      rows: formattedRows,
    };
  }

  // Helper method to validate export data
  validateExportData(columns: ExportColumn[], rows: Record<string, any>[]): boolean {
    if (!columns || columns.length === 0) {
      throw new Error('At least one column must be defined');
    }

    if (!rows || rows.length === 0) {
      this.logger.warn('Export data contains no rows');
    }

    // Validate that all rows have the required column keys
    const columnKeys = columns.map(col => col.key);
    for (const row of rows) {
      for (const key of columnKeys) {
        if (!(key in row)) {
          this.logger.warn(`Row missing key: ${key}`);
        }
      }
    }

    return true;
  }
}
