import archiver from 'archiver';
import { Response } from 'express';
import {
  ExportColumn,
  ExportData,
  ExportOptions,
} from './interfaces/export.interface';

export class ZipHandler {
  static async exportToZip(
    data: ExportData,
    options: ExportOptions,
    res: Response,
    formatterOptions?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
    },
  ): Promise<void> {
    const { filename } = options;

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.zip"`,
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const archive = archiver('zip', {
      zlib: { level: 6 }, // Compression level
    });

    // Handle errors
    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // For ZIP export, we expect the rows to contain file information
    // Each row should have: fileName and fileBuffer
    for (const row of data.rows) {
      const fileName = row.fileName as string;
      const fileBuffer = row.fileBuffer as Buffer;

      if (fileBuffer && fileName) {
        // Add file buffer to archive
        archive.append(fileBuffer, { name: fileName });
      } else {
        throw new Error(
          'File buffer and fileName must be provided for ZIP export',
        );
      }
    }

    // Finalize the archive
    await archive.finalize();
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
