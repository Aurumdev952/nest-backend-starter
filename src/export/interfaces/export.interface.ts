export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export interface ExportData {
  columns: ExportColumn[];
  rows: Record<string, any>[];
}

export interface ExportOptions {
  filename: string;
  title?: string; // For PDF title
  type: 'excel' | 'pdf' | 'zip';
}

export interface ExportResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface DataFormatterOptions {
  dateFormat?: string;
  floatPrecision?: number;
  maxCellLength?: number;
  timezone?: string;
}
