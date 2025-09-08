import { format } from 'date-fns';

export class DataFormatter {
  private static readonly DEFAULT_DATE_FORMAT = 'MMM dd, yyyy';
  private static readonly DEFAULT_FLOAT_PRECISION = 2;
  private static readonly DEFAULT_MAX_CELL_LENGTH = 32767; // Excel cell limit

  static formatValue(
    value: any,
    type?: 'string' | 'number' | 'date' | 'boolean',
    options?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
      timezone?: string;
    }
  ): string {
    const {
      dateFormat = this.DEFAULT_DATE_FORMAT,
      floatPrecision = this.DEFAULT_FLOAT_PRECISION,
      maxCellLength = this.DEFAULT_MAX_CELL_LENGTH,
    } = options || {};

    if (value === null || value === undefined) {
      return '';
    }

    let formattedValue: string;

    switch (type) {
      case 'date':
        formattedValue = this.formatDate(value, dateFormat);
        break;
      case 'number':
        formattedValue = this.formatNumber(value, floatPrecision);
        break;
      case 'boolean':
        formattedValue = value ? 'Yes' : 'No';
        break;
      case 'string':
      default:
        formattedValue = String(value);
        break;
    }

    // Prevent overflow by truncating if too long
    if (formattedValue.length > maxCellLength) {
      formattedValue = formattedValue.substring(0, maxCellLength - 3) + '...';
    }

    return formattedValue;
  }

  private static formatDate(value: any, dateFormat: string): string {
    try {
      let date: Date;

      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string') {
        date = new Date(value);
        if (isNaN(date.getTime())) {
          return String(value);
        }
      } else if (typeof value === 'number') {
        date = new Date(value);
        if (isNaN(date.getTime())) {
          return String(value);
        }
      } else {
        return String(value);
      }

      // Check if it's a datetime (has time component) or just date
      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

      if (hasTime) {
        // Include time for datetime values
        return format(date, `${dateFormat} HH:mm:ss`);
      } else {
        // Just date for date-only values
        return format(date, dateFormat);
      }
    } catch (error) {
      return String(value);
    }
  }

  private static formatNumber(value: any, precision: number): string {
    try {
      const num = Number(value);
      if (isNaN(num)) {
        return String(value);
      }

      // Round to specified precision
      const rounded = Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
      return rounded.toFixed(precision);
    } catch (error) {
      return String(value);
    }
  }

  static formatRowData(
    row: Record<string, any>,
    columns: Array<{ key: string; type?: string }>,
    options?: {
      dateFormat?: string;
      floatPrecision?: number;
      maxCellLength?: number;
      timezone?: string;
    }
  ): Record<string, string> {
    const formattedRow: Record<string, string> = {};

    for (const column of columns) {
      const value = row[column.key];
      formattedRow[column.key] = this.formatValue(
        value,
        column.type as any,
        options
      );
    }

    return formattedRow;
  }

  static getExportTimestamp(): string {
    return format(new Date(), 'MMM dd, yyyy HH:mm:ss');
  }
}
