export const MONTHLY_REPORT_SPREADSHEET_PAGE_KEY = "monthly-report-spreadsheet";

export const SPREADSHEET_LAYOUT_VERSION = 1;

export const SPREADSHEET_FONTS = [
  "Plus Jakarta Sans",
  "Inter",
  "Poppins",
  "Roboto",
  "Arial",
  "system-ui",
] as const;

export type SpreadsheetFont = (typeof SPREADSHEET_FONTS)[number];

export type SpreadsheetAlign = "left" | "center" | "right";

export type SpreadsheetLayoutScope = "global" | "personal";

export type SpreadsheetColumnKey =
  | "number"
  | "studentName"
  | "program"
  | "startLevel"
  | "startPage"
  | "endLevel"
  | "endPage"
  | "totalProgress"
  | "target"
  | "attendanceReadiness"
  | "readingQuality"
  | "readingImprovement"
  | "monthlyAchievement"
  | "progressCategory"
  | "finalScore"
  | "notes"
  | "saveStatus";

export interface SpreadsheetCellStyle {
  fontFamily?: SpreadsheetFont;
  fontSize?: number;
  bold?: boolean;
  align?: SpreadsheetAlign;
  wrap?: boolean;
}

export interface SpreadsheetLayoutSettings<ColumnKey extends string = SpreadsheetColumnKey> {
  version: number;
  tableFont: SpreadsheetFont;
  tableFontSize: number;
  headerFontSize: number;
  defaultRowHeight: number;
  columnWidths: Partial<Record<ColumnKey, number>>;
  rowHeights: Record<string, number>;
  columnStyles: Partial<Record<ColumnKey, SpreadsheetCellStyle>>;
  rowStyles: Record<string, SpreadsheetCellStyle>;
  cellStyles: Record<string, SpreadsheetCellStyle>;
}

export type SpreadsheetLayoutSelection<ColumnKey extends string = SpreadsheetColumnKey> =
  | { type: "table" }
  | { type: "column"; columnKey: ColumnKey }
  | { type: "row"; studentId: string }
  | { type: "cell"; studentId: string; columnKey: ColumnKey };

export interface SpreadsheetColumnConfig<ColumnKey extends string = SpreadsheetColumnKey> {
  key: ColumnKey;
  label: string;
  group: "identity" | "monthlyProgress" | "attendance" | "progressiveAssessment" | "result";
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  sticky?: boolean;
}
