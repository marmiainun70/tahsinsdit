import { describe, expect, it } from "vitest";
import type { Attendance, AttendancePeriodSettings } from "@/hooks/useAttendance";
import type { MonthlyReport } from "@/hooks/useMonthlyReports";
import {
  buildRecapJoinedGroups,
  buildRecapPeriodKey,
  formatProgressivePoint,
} from "@/utils/recapMonthlyReportRows";

const report = (overrides: Partial<MonthlyReport> = {}): MonthlyReport => ({
  id: "report-1",
  student_id: "student-1",
  month: 6,
  year: 2026,
  program_type: "tahsin",
  iqra_level: "Tahsin Lanjutan",
  end_iqra_level: "Tahsin Lanjutan",
  start_page: 1,
  end_page: 6,
  pages_read: 5,
  target_pages: 4,
  attendance_percentage: 99,
  poin_kehadiran_kesiapan: 2,
  poin_kualitas_bacaan: 1,
  poin_perbaikan_bacaan: 0,
  poin_konsistensi: 3,
  pencapaian_target_bulan: 2,
  poin_pencapaian: 2,
  nilai_dasar: 80,
  nilai_akhir_progresif: 85,
  kategori_progres: "Ada Progres",
  achievement_status: "achieved",
  notes: "Catatan guru",
  created_by: "teacher-1",
  teacher_id: "teacher-1",
  teacher_name: "Ustadzah A",
  created_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

const attendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  id: "attendance-1",
  student_id: "student-1",
  month: 6,
  year: 2026,
  present: 18,
  sick: 1,
  permission: 1,
  absent: 0,
  created_by: "teacher-1",
  created_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

const setting = (overrides: Partial<AttendancePeriodSettings> = {}): AttendancePeriodSettings => ({
  id: "setting-1",
  month: 6,
  year: 2026,
  kelas: 4,
  rombel: "A",
  effective_days: 20,
  is_locked: false,
  locked_by: null,
  locked_at: null,
  created_by: "teacher-1",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

const students = [
  { id: "student-1", nama: "Ahmad", kelas: 4, rombel: "A", level: "Tahsin Lanjutan" },
  { id: "student-2", nama: "Fatimah", kelas: 4, rombel: "A", level: "Iqro 3" },
  { id: "student-3", nama: "Hasan", kelas: 4, rombel: "A", level: "Tahfizh" },
  { id: "student-4", nama: "Maryam", kelas: 4, rombel: "A", level: "Tahsin Lanjutan" },
];

describe("recapMonthlyReportRows", () => {
  it("joins reports and attendance by student, month, and year", () => {
    expect(buildRecapPeriodKey("student-1", 2026, 6)).toBe("student-1:2026:6");

    const groups = buildRecapJoinedGroups({
      students,
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [
        report(),
        report({ id: "other-month", month: 5, pages_read: 99 }),
      ],
      attendance: [
        attendance(),
        attendance({ id: "other-year", year: 2025, present: 99 }),
      ],
      attendanceSettings: [setting()],
    });

    const row = groups[0].rows[0];
    expect(row.reportStatus).toBe("filled");
    expect(row.total).toBe(5);
    expect(row.present).toBe(18);
    expect(row.totalAbsensi).toBe(20);
    expect(row.persentaseHadir).toBe(90);
    expect(row.attendanceStatus).toBe("Lengkap");
    expect(row.nilaiAkhirProgresif).toBe(85);
    expect(row.kategoriProgres).toBe("Ada Progres");
  });

  it("keeps attendance visible when report is missing", () => {
    const groups = buildRecapJoinedGroups({
      students: [students[0]],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [],
      attendance: [attendance({ present: 10, sick: 0, permission: 0, absent: 0 })],
      attendanceSettings: [setting()],
    });

    const row = groups[0].rows[0];
    expect(row.reportStatus).toBe("empty");
    expect(row.awal).toBe("-");
    expect(row.present).toBe(10);
    expect(row.attendanceStatus).toBe("Belum Lengkap");
  });

  it("keeps report visible when attendance is missing", () => {
    const groups = buildRecapJoinedGroups({
      students: [students[0]],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [report()],
      attendance: [],
      attendanceSettings: [setting()],
    });

    const row = groups[0].rows[0];
    expect(row.reportStatus).toBe("filled");
    expect(row.total).toBe(5);
    expect(row.present).toBeNull();
    expect(row.attendanceStatus).toBe("Belum Diisi");
  });

  it("marks missing report and missing attendance independently", () => {
    const groups = buildRecapJoinedGroups({
      students: [students[1]],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [],
      attendance: [],
      attendanceSettings: [setting()],
    });

    const row = groups[0].rows[0];
    expect(row.reportStatus).toBe("empty");
    expect(row.awal).toBe("-");
    expect(row.present).toBeNull();
    expect(row.attendanceStatus).toBe("Belum Diisi");
  });

  it("uses monthly report snapshots for historical student identity and grouping", () => {
    const groups = buildRecapJoinedGroups({
      students: [{ id: "student-1", nama: "Ahmad Baru", kelas: 5, rombel: "B", level: "Tahfizh" }],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [
        report({
          student_name_snapshot: "Ahmad Lama",
          kelas_snapshot: 4,
          rombel_snapshot: "A",
          level_snapshot: "Tahsin Lanjutan",
          teacher_name_snapshot: "Ustadzah Snapshot",
        }),
      ],
      attendance: [],
      attendanceSettings: [setting({ kelas: 4, rombel: "A" })],
    });

    expect(groups[0].kelas).toBe(4);
    expect(groups[0].rombel).toBe("A");
    expect(groups[0].rows[0].nama).toBe("Ahmad Lama");
    expect(groups[0].rows[0].level).toBe("Tahsin Lanjutan");
    expect(groups[0].rows[0].guru).toBe("Ustadzah Snapshot");
  });

  it("detects complete, incomplete, excessive, and unset effective-day attendance", () => {
    const base = {
      students: [students[0]],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [],
    };

    expect(buildRecapJoinedGroups({
      ...base,
      attendance: [attendance({ present: 20, sick: 0, permission: 0, absent: 0 })],
      attendanceSettings: [setting({ effective_days: 20 })],
    })[0].rows[0].attendanceStatus).toBe("Lengkap");

    expect(buildRecapJoinedGroups({
      ...base,
      attendance: [attendance({ present: 18, sick: 0, permission: 0, absent: 0 })],
      attendanceSettings: [setting({ effective_days: 20 })],
    })[0].rows[0].attendanceStatus).toBe("Belum Lengkap");

    expect(buildRecapJoinedGroups({
      ...base,
      attendance: [attendance({ present: 21, sick: 0, permission: 0, absent: 0 })],
      attendanceSettings: [setting({ effective_days: 20 })],
    })[0].rows[0].attendanceStatus).toBe("Melebihi Hari Efektif");

    expect(buildRecapJoinedGroups({
      ...base,
      attendance: [attendance({ present: 1, sick: 0, permission: 0, absent: 0 })],
      attendanceSettings: [],
    })[0].rows[0].attendanceStatus).toBe("Hari Efektif Belum Diatur");
  });

  it("shows monthly achievement only for Tahsin Lanjutan and Tahfizh", () => {
    const groups = buildRecapJoinedGroups({
      students: [students[1], students[2]],
      month: 6,
      year: 2026,
      monthName: "Juni",
      reports: [
        report({ id: "iqra", student_id: "student-2", program_type: "iqra", iqra_level: "Iqro 3", end_iqra_level: "Iqro 3", pencapaian_target_bulan: 4 }),
        report({ id: "tahfizh", student_id: "student-3", program_type: "tahfizh", iqra_level: "Juz 30", end_iqra_level: "Juz 30", pencapaian_target_bulan: 3 }),
      ],
      attendance: [],
      attendanceSettings: [setting()],
    });

    expect(groups[0].rows[0].pencapaianTargetBulan).toBeNull();
    expect(groups[0].rows[1].pencapaianTargetBulan).toBe(3);
    expect(formatProgressivePoint(groups[0].rows[1].poinKehadiranKesiapan)).toBe("+2");
  });
});
