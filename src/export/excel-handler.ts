import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { ExportColumn, ExportData, ExportOptions } from './interfaces/export.interface';
import { DataFormatter } from './data-formatter';

export class ExcelHandler {
  static async exportToExcel(
    data: ExportData,
    options: ExportOptions,
    res: Response,
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    }
  ): Promise<void> {
    const { columns, rows } = data;
    const { filename } = options;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.xlsx"`
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Create workbook with streaming writer
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
    });

    const worksheet = workbook.addWorksheet('Data');

    // Set column headers and widths
    const excelColumns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));
    worksheet.columns = excelColumns as any;

    // Add data rows with formatting
    for (const row of rows) {
      const formattedRow = DataFormatter.formatRowData(
        row,
        columns.map(col => ({ key: col.key, type: col.type })),
        formatterOptions
      );

      const excelRow = worksheet.addRow(formattedRow);
      excelRow.commit();
    }

    // Commit worksheet and workbook
    worksheet.commit();
    await workbook.commit();
  }

  static createExportData(
    columns: ExportColumn[],
    rows: Record<string, any>[]
  ): ExportData {
    return {
      columns,
      rows,
    };
  }
}
