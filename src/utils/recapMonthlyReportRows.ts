import type { Attendance, AttendancePeriodSettings } from "@/hooks/useAttendance";
import type { MonthlyReport } from "@/hooks/useMonthlyReports";
import type { ProgressCategory, ProgressivePoint } from "@/utils/calculateProgressiveReportScore";

export type ReportFillStatus = "filled" | "empty";
export type RecapAttendanceStatus =
  | "Belum Diisi"
  | "Lengkap"
  | "Belum Lengkap"
  | "Melebihi Hari Efektif"
  | "Hari Efektif Belum Diatur";

export interface RecapStudent {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
}

export interface RecapJoinedRow {
  no: number;
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  program: string;
  level: string;
  month: number;
  year: number;
  periode: string;
  reportStatus: ReportFillStatus;
  awal: string;
  akhir: string;
  total: number | null;
  target: number | null;
  poinKehadiranKesiapan: ProgressivePoint | null;
  poinKualitasBacaan: ProgressivePoint | null;
  poinPerbaikanBacaan: ProgressivePoint | null;
  pencapaianTargetBulan: number | null;
  kategoriProgres: ProgressCategory | null;
  nilaiAkhirProgresif: number | null;
  guru: string;
  catatan: string;
  hasAttendance: boolean;
  present: number | null;
  sick: number | null;
  permission: number | null;
  absent: number | null;
  totalAbsensi: number | null;
  persentaseHadir: number | null;
  attendanceStatus: RecapAttendanceStatus;
  effectiveDays: number | null;
}

export interface RecapJoinedGroup {
  kelas: number;
  rombel: string;
  rows: RecapJoinedRow[];
}

export const PROGRESS_CATEGORIES: ProgressCategory[] = [
  "Konsisten & Progresif",
  "Ada Progres",
  "Stagnan",
  "Kurang Konsisten",
  "Tidak Konsisten",
];

export const buildRecapPeriodKey = (studentId: string, year: number, month: number) =>
  `${studentId}:${year}:${month}`;

export const buildAttendanceSettingKey = (year: number, month: number, kelas: number, rombel: string) =>
  `${year}:${month}:${kelas}:${rombel}`;

export const buildRecapMap = <T extends { student_id: string; year: number; month: number }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(buildRecapPeriodKey(item.student_id, item.year, item.month), item);
  });
  return map;
};

export const buildAttendanceSettingsMap = (settings: AttendancePeriodSettings[]) => {
  const map = new Map<string, AttendancePeriodSettings>();
  settings.forEach((setting) => {
    map.set(buildAttendanceSettingKey(setting.year, setting.month, setting.kelas, setting.rombel), setting);
  });
  return map;
};

export const isReportMeaningfullyFilled = (report: {
  achievement_status?: string | null;
  pages_read?: number | null;
  start_page?: number | null;
  end_page?: number | null;
  notes?: string | null;
  created_by?: string | null;
  teacher_name?: string | null;
}) => {
  const status = String(report.achievement_status ?? "");
  const notes = String(report.notes ?? "").trim();
  const hasProgress =
    Number(report.pages_read ?? 0) !== 0 ||
    Number(report.start_page ?? 0) !== Number(report.end_page ?? 0);
  const hasTeacherInput =
    notes.length > 0 ||
    Boolean(report.teacher_name) ||
    Boolean(report.created_by);

  if (status === "achieved" || status === "stagnant" || status === "decline") return true;
  if (hasProgress) return true;
  if ((status === "not_achieved" || status === "partial") && hasTeacherInput) return true;
  return false;
};

const normalizePoint = (value: number | null | undefined): ProgressivePoint | null => {
  if (value === 2 || value === 1 || value === 0 || value === -1) return value;
  return null;
};

const normalizeCategory = (value: string | null | undefined): ProgressCategory | null => {
  return PROGRESS_CATEGORIES.includes(value as ProgressCategory) ? (value as ProgressCategory) : null;
};

const formatTahfizhLevel = (level: string | null | undefined, page: number) => {
  if (!level) return `hal.${page}`;
  const juz = Number(String(level).replace(/\D/g, "")) || null;
  return juz ? `Juz ${juz} hal.${page}` : `hal.${page}`;
};

export const formatReportProgressPoint = (report: MonthlyReport, field: "start" | "end") => {
  const level = field === "start" ? report.iqra_level : report.end_iqra_level;
  const page = field === "start" ? report.start_page : report.end_page;
  if (!level) return String(page);
  if (report.program_type === "tahfizh") return formatTahfizhLevel(level, page);
  return `${level} hal.${page}`;
};

export const getProgramLabelFromLevel = (level: string) => {
  if (/^Iqro\s+[1-6]$/i.test(level)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level || "-";
};

export const shouldShowMonthlyAchievement = (level: string, programType?: string | null) => {
  const normalizedProgram = String(programType ?? "").toLowerCase();
  if (normalizedProgram === "tahsin" || normalizedProgram === "tahfizh") return true;
  return level === "Tahsin Lanjutan" || level === "Tahfizh";
};

export const getAttendanceStatus = ({
  hasAttendance,
  totalAbsensi,
  effectiveDays,
}: {
  hasAttendance: boolean;
  totalAbsensi: number;
  effectiveDays: number | null;
}): RecapAttendanceStatus => {
  if (!hasAttendance && totalAbsensi === 0) return "Belum Diisi";
  if (effectiveDays === null || effectiveDays <= 0) return "Hari Efektif Belum Diatur";
  if (totalAbsensi === effectiveDays) return "Lengkap";
  if (totalAbsensi < effectiveDays) return "Belum Lengkap";
  return "Melebihi Hari Efektif";
};

export const buildRecapJoinedRow = ({
  student,
  month,
  year,
  monthName,
  report,
  attendance,
  attendanceSetting,
  teacherName,
  no,
}: {
  student: RecapStudent;
  month: number;
  year: number;
  monthName: string;
  report?: MonthlyReport;
  attendance?: Attendance;
  attendanceSetting?: AttendancePeriodSettings;
  teacherName?: string;
  no: number;
}): RecapJoinedRow => {
  const hasReport = Boolean(report && isReportMeaningfullyFilled(report));
  const hasAttendance = Boolean(attendance);
  const present = attendance?.present ?? 0;
  const sick = attendance?.sick ?? 0;
  const permission = attendance?.permission ?? 0;
  const absent = attendance?.absent ?? 0;
  const totalAbsensi = present + sick + permission + absent;
  const effectiveDays = attendanceSetting?.effective_days ?? null;
  const attendanceStatus = getAttendanceStatus({ hasAttendance, totalAbsensi, effectiveDays });
  const reportProgramType = report?.program_type ?? null;
  const studentName = report?.student_name_snapshot?.trim() || student.nama;
  const studentClass = report?.kelas_snapshot ?? student.kelas;
  const studentRombel = report?.rombel_snapshot?.trim() || student.rombel;
  const studentLevel = report?.level_snapshot?.trim() || student.level;
  const teacherSnapshot =
    report?.teacher_name_snapshot?.trim() ||
    report?.teacher_name?.trim() ||
    teacherName ||
    "-";

  return {
    no,
    studentId: student.id,
    nama: studentName,
    kelas: studentClass,
    rombel: studentRombel,
    program: getProgramLabelFromLevel(studentLevel),
    level: studentLevel,
    month,
    year,
    periode: `${monthName} ${year}`,
    reportStatus: hasReport ? "filled" : "empty",
    awal: hasReport && report ? formatReportProgressPoint(report, "start") : "-",
    akhir: hasReport && report ? formatReportProgressPoint(report, "end") : "-",
    total: hasReport && report ? report.pages_read : null,
    target: hasReport && report ? report.target_pages : null,
    poinKehadiranKesiapan: hasReport && report ? normalizePoint(report.poin_kehadiran_kesiapan) : null,
    poinKualitasBacaan: hasReport && report ? normalizePoint(report.poin_kualitas_bacaan) : null,
    poinPerbaikanBacaan: hasReport && report ? normalizePoint(report.poin_perbaikan_bacaan) : null,
    pencapaianTargetBulan:
      hasReport && report && shouldShowMonthlyAchievement(studentLevel, reportProgramType)
        ? report.pencapaian_target_bulan ?? 0
        : null,
    kategoriProgres: hasReport && report ? normalizeCategory(report.kategori_progres) : null,
    nilaiAkhirProgresif: hasReport && report ? report.nilai_akhir_progresif ?? null : null,
    guru: hasReport && report ? teacherSnapshot : "-",
    catatan: hasReport && report ? report.notes || "" : "",
    hasAttendance,
    present: hasAttendance ? present : null,
    sick: hasAttendance ? sick : null,
    permission: hasAttendance ? permission : null,
    absent: hasAttendance ? absent : null,
    totalAbsensi: hasAttendance ? totalAbsensi : null,
    persentaseHadir: hasAttendance ? (totalAbsensi > 0 ? Math.round((present / totalAbsensi) * 100) : 0) : null,
    attendanceStatus,
    effectiveDays,
  };
};

export const buildRecapJoinedGroups = ({
  students,
  month,
  year,
  monthName,
  reports,
  attendance,
  attendanceSettings,
  getTeacherName,
}: {
  students: RecapStudent[];
  month: number;
  year: number;
  monthName: string;
  reports: MonthlyReport[];
  attendance: Attendance[];
  attendanceSettings: AttendancePeriodSettings[];
  getTeacherName?: (userId: string | null) => string | undefined;
}): RecapJoinedGroup[] => {
  const reportMap = buildRecapMap(reports);
  const attendanceMap = buildRecapMap(attendance);
  const settingsMap = buildAttendanceSettingsMap(attendanceSettings);
  const groupMap = new Map<string, RecapJoinedGroup>();

  students.forEach((student) => {
    const periodKey = buildRecapPeriodKey(student.id, year, month);
    const report = reportMap.get(periodKey);
    const groupKelas = report?.kelas_snapshot ?? student.kelas;
    const groupRombel = report?.rombel_snapshot?.trim() || student.rombel;
    const groupKey = `${groupKelas}-${groupRombel}`;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { kelas: groupKelas, rombel: groupRombel, rows: [] });
    }

    const group = groupMap.get(groupKey)!;
    const row = buildRecapJoinedRow({
      student,
      month,
      year,
      monthName,
      report,
      attendance: attendanceMap.get(periodKey),
      attendanceSetting: settingsMap.get(buildAttendanceSettingKey(year, month, groupKelas, groupRombel)),
      teacherName: getTeacherName?.(report?.created_by ?? null),
      no: group.rows.length + 1,
    });

    group.rows.push(row);
  });

  return Array.from(groupMap.values()).sort(
    (a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel),
  );
};

export const formatRecapValue = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

export const formatProgressivePoint = (value: ProgressivePoint | null) =>
  value === null ? "-" : value > 0 ? `+${value}` : String(value);

export const formatAttendanceCompact = (row: RecapJoinedRow) =>
  row.hasAttendance
    ? `H:${row.present ?? 0} S:${row.sick ?? 0} I:${row.permission ?? 0} A:${row.absent ?? 0}`
    : "-";
