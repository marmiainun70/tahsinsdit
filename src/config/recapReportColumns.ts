import type { SpreadsheetColumnConfig } from "@/types/spreadsheetLayout";

export const RECAP_REPORT_SPREADSHEET_PAGE_KEY = "recap-report-spreadsheet";

export type RecapReportColumnKey =
  | "number"
  | "studentName"
  | "program"
  | "level"
  | "start"
  | "end"
  | "totalProgress"
  | "target"
  | "present"
  | "sick"
  | "permission"
  | "absent"
  | "totalAttendance"
  | "attendancePercentage"
  | "attendanceStatus"
  | "attendanceReadiness"
  | "readingQuality"
  | "readingImprovement"
  | "monthlyAchievement"
  | "progressCategory"
  | "finalScore"
  | "teacher"
  | "notes";

export const RECAP_REPORT_COLUMNS: SpreadsheetColumnConfig<RecapReportColumnKey>[] = [
  { key: "number", label: "No.", group: "identity", defaultWidth: 44, minWidth: 28, maxWidth: 80, sticky: true },
  { key: "studentName", label: "Nama Siswa", group: "identity", defaultWidth: 188, minWidth: 96, maxWidth: 320, sticky: true },
  { key: "program", label: "Program", group: "identity", defaultWidth: 138, minWidth: 90, maxWidth: 220 },
  { key: "level", label: "Level", group: "identity", defaultWidth: 98, minWidth: 76, maxWidth: 150 },
  { key: "start", label: "Awal", group: "monthlyProgress", defaultWidth: 92, minWidth: 70, maxWidth: 150 },
  { key: "end", label: "Akhir", group: "monthlyProgress", defaultWidth: 92, minWidth: 70, maxWidth: 150 },
  { key: "totalProgress", label: "Total", group: "monthlyProgress", defaultWidth: 78, minWidth: 58, maxWidth: 120 },
  { key: "target", label: "Target", group: "monthlyProgress", defaultWidth: 78, minWidth: 58, maxWidth: 120 },
  { key: "present", label: "Hadir", group: "attendance", defaultWidth: 70, minWidth: 52, maxWidth: 110 },
  { key: "sick", label: "Sakit", group: "attendance", defaultWidth: 70, minWidth: 52, maxWidth: 110 },
  { key: "permission", label: "Izin", group: "attendance", defaultWidth: 70, minWidth: 52, maxWidth: 110 },
  { key: "absent", label: "Alfa", group: "attendance", defaultWidth: 70, minWidth: 52, maxWidth: 110 },
  { key: "totalAttendance", label: "Total", group: "attendance", defaultWidth: 74, minWidth: 56, maxWidth: 120 },
  { key: "attendancePercentage", label: "% Hadir", group: "attendance", defaultWidth: 82, minWidth: 60, maxWidth: 130 },
  { key: "attendanceStatus", label: "Status Absensi", group: "attendance", defaultWidth: 136, minWidth: 96, maxWidth: 220 },
  { key: "attendanceReadiness", label: "Kehadiran & Kesiapan Belajar", group: "progressiveAssessment", defaultWidth: 166, minWidth: 118, maxWidth: 260 },
  { key: "readingQuality", label: "Kualitas Bacaan Harian", group: "progressiveAssessment", defaultWidth: 150, minWidth: 108, maxWidth: 240 },
  { key: "readingImprovement", label: "Perbaikan Bacaan Harian", group: "progressiveAssessment", defaultWidth: 156, minWidth: 112, maxWidth: 250 },
  { key: "monthlyAchievement", label: "Pencapaian Bulanan", group: "progressiveAssessment", defaultWidth: 118, minWidth: 86, maxWidth: 180 },
  { key: "progressCategory", label: "Kategori Progres", group: "progressiveAssessment", defaultWidth: 148, minWidth: 110, maxWidth: 230 },
  { key: "finalScore", label: "Nilai", group: "progressiveAssessment", defaultWidth: 78, minWidth: 56, maxWidth: 120 },
  { key: "teacher", label: "Guru", group: "result", defaultWidth: 126, minWidth: 86, maxWidth: 220 },
  { key: "notes", label: "Catatan", group: "result", defaultWidth: 220, minWidth: 132, maxWidth: 420 },
];
