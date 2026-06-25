import type { SpreadsheetColumnConfig } from "@/types/spreadsheetLayout";

export const ATTENDANCE_SPREADSHEET_PAGE_KEY = "attendance-monthly-spreadsheet";

export type AttendanceColumnKey =
  | "number"
  | "studentName"
  | "studentLevel"
  | "present"
  | "sick"
  | "permission"
  | "absent"
  | "total"
  | "percentage"
  | "attendanceStatus"
  | "saveStatus";

export const ATTENDANCE_COLUMNS: SpreadsheetColumnConfig<AttendanceColumnKey>[] = [
  { key: "number", label: "No.", group: "identity", defaultWidth: 36, minWidth: 20, maxWidth: 70, sticky: true },
  { key: "studentName", label: "Nama Siswa", group: "identity", defaultWidth: 160, minWidth: 50, maxWidth: 300, sticky: true },
  { key: "studentLevel", label: "Level", group: "identity", defaultWidth: 100, minWidth: 35, maxWidth: 180 },
  { key: "present", label: "Hadir", group: "monthlyProgress", defaultWidth: 62, minWidth: 30, maxWidth: 110 },
  { key: "sick", label: "Sakit", group: "monthlyProgress", defaultWidth: 62, minWidth: 30, maxWidth: 110 },
  { key: "permission", label: "Izin", group: "monthlyProgress", defaultWidth: 62, minWidth: 30, maxWidth: 110 },
  { key: "absent", label: "Alfa", group: "monthlyProgress", defaultWidth: 62, minWidth: 30, maxWidth: 110 },
  { key: "total", label: "Total", group: "result", defaultWidth: 62, minWidth: 30, maxWidth: 110 },
  { key: "percentage", label: "Persentase", group: "result", defaultWidth: 90, minWidth: 45, maxWidth: 140 },
  { key: "attendanceStatus", label: "Status", group: "result", defaultWidth: 120, minWidth: 55, maxWidth: 190 },
  { key: "saveStatus", label: "Status Simpan", group: "result", defaultWidth: 110, minWidth: 55, maxWidth: 170 },
];

export const ATTENDANCE_MOBILE_COLUMNS: SpreadsheetColumnConfig<AttendanceColumnKey>[] = [
  { key: "number", label: "No.", group: "identity", defaultWidth: 28, minWidth: 24, maxWidth: 42, sticky: true },
  { key: "studentName", label: "Nama Siswa", group: "identity", defaultWidth: 112, minWidth: 78, maxWidth: 170, sticky: true },
  { key: "present", label: "H", group: "monthlyProgress", defaultWidth: 42, minWidth: 32, maxWidth: 62 },
  { key: "sick", label: "S", group: "monthlyProgress", defaultWidth: 42, minWidth: 32, maxWidth: 62 },
  { key: "permission", label: "I", group: "monthlyProgress", defaultWidth: 42, minWidth: 32, maxWidth: 62 },
  { key: "absent", label: "A", group: "monthlyProgress", defaultWidth: 42, minWidth: 32, maxWidth: 62 },
  { key: "attendanceStatus", label: "Status", group: "result", defaultWidth: 78, minWidth: 58, maxWidth: 120 },
];
