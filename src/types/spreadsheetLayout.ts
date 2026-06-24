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

export interface SpreadsheetLayoutSettings {
  version: number;
  tableFont: SpreadsheetFont;
  tableFontSize: number;
  headerFontSize: number;
  defaultRowHeight: number;
  columnWidths: Partial<Record<SpreadsheetColumnKey, number>>;
  rowHeights: Record<string, number>;
  columnStyles: Partial<Record<SpreadsheetColumnKey, SpreadsheetCellStyle>>;
  rowStyles: Record<string, SpreadsheetCellStyle>;
  cellStyles: Record<string, SpreadsheetCellStyle>;
}

export type SpreadsheetLayoutSelection =
  | { type: "table" }
  | { type: "column"; columnKey: SpreadsheetColumnKey }
  | { type: "row"; studentId: string }
  | { type: "cell"; studentId: string; columnKey: SpreadsheetColumnKey };

export interface SpreadsheetColumnConfig {
  key: SpreadsheetColumnKey;
  label: string;
  group: "identity" | "monthlyProgress" | "progressiveAssessment" | "result";
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  sticky?: boolean;
}
