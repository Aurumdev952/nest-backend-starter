import { Response } from 'express';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

import { DataFormatter } from './data-formatter';
import {
  ExportColumn,
  ExportData,
  ExportOptions,
} from './interfaces/export.interface';

(pdfMake as any).vfs = pdfFonts;


export class PDFHandler {
  static async exportToPDF(
    data: ExportData,
    options: ExportOptions,
    res: Response,
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    },
  ): Promise<void> {
    const { columns, rows } = data;
    const { filename, title } = options;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.pdf"`,
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Create document definition
    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [50, 50, 50, 70],
      content: [],
      footer: this.createFooter(),
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
        },
      },
    };

    // Add title if provided
    if (title) {
      docDefinition.content.push({
        text: title,
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20],
      });
    }

    // Generate table
    const table = this.generateTable(columns, rows, formatterOptions);
    if (table) {
      docDefinition.content.push(table);
    } else {
      docDefinition.content.push({
        text: 'No data available',
        fontSize: 12,
        alignment: 'center',
      });
    }

    // Create PDF and pipe to response
    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer: Buffer) => {
      res.send(buffer);
    });
  }

  private static generateTable(
    columns: ExportColumn[],
    rows: Record<string, any>[],
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    },
  ): any {
    if (!columns.length || !rows.length) {
      return null;
    }

    // Format rows for pdfmake table (expects array of arrays of values)
    const formattedRows = rows.map((row) =>
      columns.map((col) =>
        DataFormatter.formatValue(row[col.key], col.type, formatterOptions),
      ),
    );

    const headers = columns.map((col) => col.header);

    // Calculate column widths proportional to provided widths (default = 100 each)
    const totalWidth = columns.reduce((sum, c) => sum + (c.width || 100), 0);
    const columnWidths = columns.map((col) => `${((col.width || 100) / totalWidth) * 100}%`);

    // Create table body with headers
    const tableBody = [
      headers.map((header) => ({ text: header, style: 'tableHeader' })),
      ...formattedRows.map((row) => row),
    ];

    return {
      table: {
        headerRows: 1,
        widths: columnWidths,
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f5f5f5' : null),
      },
    };
  }

  private static createFooter(): any {
    return (currentPage: number, pageCount: number) => {
      const exportTimestamp = DataFormatter.getExportTimestamp();
      return {
        text: `Exported on: ${exportTimestamp} - Page ${currentPage} of ${pageCount}`,
        fontSize: 8,
        color: 'gray',
        alignment: 'center',
        margin: [50, 20, 50, 0],
      };
    };
  }

  static createExportData(
    columns: ExportColumn[],
    rows: Record<string, any>[],
  ): ExportData {
    return {
      columns,
      rows,
    };
  }
}
