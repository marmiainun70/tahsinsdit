import type { SpreadsheetColumnConfig, SpreadsheetColumnKey } from "@/types/spreadsheetLayout";

export const MONTHLY_REPORT_COLUMNS: SpreadsheetColumnConfig[] = [
  { key: "number", label: "No.", group: "identity", defaultWidth: 36, minWidth: 20, maxWidth: 70, sticky: true },
  { key: "studentName", label: "Nama Siswa", group: "identity", defaultWidth: 160, minWidth: 32, maxWidth: 280, sticky: true },
  { key: "program", label: "Program", group: "identity", defaultWidth: 112, minWidth: 24, maxWidth: 180 },
  { key: "startLevel", label: "Awal", group: "monthlyProgress", defaultWidth: 82, minWidth: 24, maxWidth: 140 },
  { key: "startPage", label: "Hal. Awal", group: "monthlyProgress", defaultWidth: 88, minWidth: 24, maxWidth: 130 },
  { key: "endLevel", label: "Akhir", group: "monthlyProgress", defaultWidth: 82, minWidth: 24, maxWidth: 140 },
  { key: "endPage", label: "Hal. Akhir", group: "monthlyProgress", defaultWidth: 88, minWidth: 24, maxWidth: 130 },
  { key: "totalProgress", label: "Total", group: "monthlyProgress", defaultWidth: 62, minWidth: 20, maxWidth: 110 },
  { key: "target", label: "Target", group: "monthlyProgress", defaultWidth: 62, minWidth: 20, maxWidth: 110 },
  { key: "attendanceReadiness", label: "Kehadiran & Kesiapan Belajar", group: "progressiveAssessment", defaultWidth: 178, minWidth: 28, maxWidth: 260 },
  { key: "readingQuality", label: "Kualitas Bacaan Harian", group: "progressiveAssessment", defaultWidth: 178, minWidth: 28, maxWidth: 260 },
  { key: "readingImprovement", label: "Perbaikan Bacaan Harian", group: "progressiveAssessment", defaultWidth: 178, minWidth: 28, maxWidth: 260 },
  { key: "monthlyAchievement", label: "Pencapaian Bulanan", group: "progressiveAssessment", defaultWidth: 150, minWidth: 28, maxWidth: 220 },
  { key: "progressCategory", label: "Kategori Progres", group: "progressiveAssessment", defaultWidth: 165, minWidth: 28, maxWidth: 230 },
  { key: "finalScore", label: "Nilai", group: "result", defaultWidth: 76, minWidth: 20, maxWidth: 120 },
  { key: "notes", label: "Catatan", group: "result", defaultWidth: 230, minWidth: 32, maxWidth: 420 },
  { key: "saveStatus", label: "Status Simpan", group: "result", defaultWidth: 116, minWidth: 28, maxWidth: 170 },
  { key: "tahfizhJuz", label: "Juz (Setoran)", group: "monthlyProgress", defaultWidth: 82, minWidth: 24, maxWidth: 140 },
  { key: "tahfizhStartPage", label: "Hal Awal (Setoran)", group: "monthlyProgress", defaultWidth: 88, minWidth: 24, maxWidth: 130 },
  { key: "tahfizhEndPage", label: "Hal Akhir (Setoran)", group: "monthlyProgress", defaultWidth: 88, minWidth: 24, maxWidth: 130 },
  { key: "tahfizhPagesRead", label: "Jml Hal (Setoran)", group: "monthlyProgress", defaultWidth: 70, minWidth: 24, maxWidth: 120 },
  { key: "tahfizhTarget", label: "Target (Setoran)", group: "monthlyProgress", defaultWidth: 70, minWidth: 24, maxWidth: 120 },
];

export const MONTHLY_REPORT_COLUMN_KEYS = MONTHLY_REPORT_COLUMNS.map((column) => column.key) as SpreadsheetColumnKey[];

export const MONTHLY_REPORT_COLUMN_BY_KEY = MONTHLY_REPORT_COLUMNS.reduce(
  (acc, column) => {
    acc[column.key] = column;
    return acc;
  },
  {} as Record<SpreadsheetColumnKey, SpreadsheetColumnConfig>,
);

export const getDefaultColumnWidth = (key: SpreadsheetColumnKey) => MONTHLY_REPORT_COLUMN_BY_KEY[key].defaultWidth;

export const getColumnBounds = (key: SpreadsheetColumnKey) => {
  const column = MONTHLY_REPORT_COLUMN_BY_KEY[key];
  return { min: column.minWidth, max: column.maxWidth };
};
