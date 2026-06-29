import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchApprovedManagedStudentIds } from "@/hooks/useSupabaseData";

export interface MonthlyReport {
  id: string;
  student_id: string;
  month: number;
  year: number;
  program_type: string;
  iqra_level: string | null;
  end_iqra_level: string | null;
  start_page: number;
  end_page: number;
  pages_read: number;
  target_pages: number;
  attendance_percentage: number;
  poin_kehadiran_kesiapan?: number | null;
  poin_kualitas_bacaan?: number | null;
  poin_perbaikan_bacaan?: number | null;
  poin_konsistensi?: number | null;
  pencapaian_target_bulan?: number | null;
  poin_pencapaian?: number | null;
  nilai_dasar?: number | null;
  nilai_akhir_progresif?: number | null;
  kategori_progres?: string | null;
  achievement_status: string;
  notes: string;
  created_by: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  student_name_snapshot?: string | null;
  kelas_snapshot?: number | null;
  rombel_snapshot?: string | null;
  level_snapshot?: string | null;
  teacher_id_snapshot?: string | null;
  teacher_name_snapshot?: string | null;
  created_at: string;
}

// Calculate pages read across Iqra levels
export const IQRA_PAGES_LIST = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 30 valid pages per level

export const calcIqraPagesRead = (
  startLevel: number, startPage: number,
  endLevel: number, endPage: number
): number => {
  const startIdx = IQRA_PAGES_LIST.indexOf(getValidIqraPage(startPage));
  const endIdx = IQRA_PAGES_LIST.indexOf(getValidIqraPage(endPage));
  if (startLevel === endLevel) {
    return Math.max(0, endIdx - startIdx);
  }
  // Cross-level: remaining in start level + full levels in between + pages in end level
  const remainingInStart = (IQRA_PAGES_LIST.length - 1) - startIdx; // pages left in start level
  const fullLevelsBetween = Math.max(0, endLevel - startLevel - 1);
  const pagesInEnd = endIdx + 1; // pages read in end level (from page index 0)
  return remainingInStart + (fullLevelsBetween * IQRA_PAGES_LIST.length) + pagesInEnd;
};

// Iqra: halaman 1, 4-32 (skip 2 & 3)
export const IQRA_VALID_PAGES = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 1, 4..32

export const getValidIqraPage = (page: number): number => {
  if (page <= 1) return 1;
  if (page <= 3) return 4; // skip 2,3
  return Math.min(page, 32);
};

/** Rumus baru Tahsin Dasar (Iqra) — signed: total bisa negatif (TURUN) */
export const IQRA_PAGES_PER_LEVEL = 30;
export const calcIqraPagesSigned = (
  startLevel: number, startPage: number,
  endLevel: number, endPage: number,
): number => (endLevel - startLevel) * IQRA_PAGES_PER_LEVEL + (endPage - startPage);

/** Deteksi TURUN khusus Tahsin Dasar (Iqra) */
export const isIqraDecline = (
  startLevel: number, startPage: number, endLevel: number, endPage: number,
): boolean => {
  if (endLevel < startLevel) return true;
  if (endLevel === startLevel && endPage < startPage) return true;
  return false;
};

/** Notif: siswa selesai Tahsin Dasar (Jilid 6 hal 32) */
export const isIqraGraduated = (endLevel: number, endPage: number): boolean =>
  endLevel === 6 && endPage >= 32;

export const TARGET_TAHFIZH = 1;
export const TARGET_TAHSIN = 4;
export const TARGET_IQRA = 4;

export const getTarget = (programType: string): number => {
  if (programType === "tahfizh") return TARGET_TAHFIZH;
  if (programType === "tahsin") return TARGET_TAHSIN;
  return TARGET_IQRA;
};

/** Status 4-state berbasis nilai signed */
export type ProgressStatus = "achieved" | "not_achieved" | "stagnant" | "decline";
export const getProgressStatus = (pagesSigned: number, target: number): ProgressStatus => {
  if (pagesSigned < 0) return "decline";
  if (pagesSigned === 0) return "stagnant";
  if (pagesSigned >= target) return "achieved";
  return "not_achieved";
};

export const getAchievementStatus = (pagesRead: number, target: number): string => {
  return pagesRead >= target ? "achieved" : "not_achieved";
};

export const buildIqraDeclineNote = (
  startLevel: number, startPage: number, endLevel: number, endPage: number,
): string => {
  const total = calcIqraPagesSigned(startLevel, startPage, endLevel, endPage);
  if (endLevel < startLevel) {
    return `Bacaan siswa perlu kembali dikuatkan dari Jilid ${startLevel} ke Jilid ${endLevel}. Selisih progres tercatat ${Math.abs(total)} halaman. Sebaiknya siswa mengulang materi sebelumnya dengan pendampingan agar bacaan lebih mantap sebelum melanjutkan.`;
  }
  return `Progres bacaan siswa pada Jilid ${startLevel} menurun ${Math.abs(total)} halaman. Siswa perlu mengulang halaman sebelumnya secara bertahap agar kelancaran dan ketepatan bacaannya kembali stabil.`;
};

export const buildTahfizhDeclineNote = (
  startJuz: number, startPage: number, endJuz: number, endPage: number,
): string => `Hafalan siswa perlu dikuatkan kembali. Catatan akhir berada di Juz ${endJuz} hal.${endPage}, sedangkan awal laporan berada di Juz ${startJuz} hal.${startPage}. Sebaiknya siswa fokus murojaah terlebih dahulu sebelum mengejar target berikutnya.`;

/**
 * Deteksi penurunan progres antara laporan bulan lalu & laporan saat ini.
 * Iqra/Tahsin: level + halaman. Tahfizh: juz + halaman (semakin tinggi juz = semakin awal mushaf).
 */
export const detectDecline = (
  prev: { program_type: string; iqra_level?: string | null; end_iqra_level?: string | null; end_page: number } | null,
  curr: { program_type: string; iqra_level?: string | null; end_iqra_level?: string | null; end_page: number },
): boolean => {
  if (!prev) return false;
  if (prev.program_type !== curr.program_type) return false;

  const levelOrder = ["Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6", "Tahsin Dasar", "Tahsin Lanjutan", "Tahfizh"];
  const prevLvl = prev.end_iqra_level || prev.iqra_level || "";
  const currLvl = curr.end_iqra_level || curr.iqra_level || "";
  const pIdx = levelOrder.indexOf(prevLvl);
  const cIdx = levelOrder.indexOf(currLvl);

  if (pIdx >= 0 && cIdx >= 0) {
    if (cIdx < pIdx) return true;
    if (cIdx === pIdx && curr.end_page < prev.end_page) return true;
  }
  return false;
};

export const DECLINE_AUTO_NOTE =
  "Progres bacaan siswa menurun dibanding laporan sebelumnya. Siswa perlu lebih sering murojaah dan berlatih membaca di rumah dengan pendampingan orang tua.";

type AutoNoteProgram = "iqra" | "tahsin" | "tahfizh";

export interface AutoNoteOption {
  key: "very_weak" | "weak" | "developing" | "good" | "excellent";
  label: string;
  note: string;
}

export const AUTO_NOTE_OPTIONS: Record<AutoNoteProgram, AutoNoteOption[]> = {
  iqra: [
    {
      key: "very_weak",
      label: "Sangat lemah",
      note: "Bacaan Iqra masih sangat perlu dibimbing dari dasar.\nSiswa perlu lebih sering mengenal huruf, harakat, dan sambungan kata.\nLatihan pendek setiap hari akan sangat membantu.\nBarakallah fiik.",
    },
    {
      key: "weak",
      label: "Lemah",
      note: "Bacaan Iqra sudah mulai berjalan, tetapi masih sering terbata-bata.\nSiswa perlu mengulang halaman yang sulit dan memperjelas bunyi huruf.\nMohon latihan rutin di rumah dengan pendampingan.\nBarakallah fiik.",
    },
    {
      key: "developing",
      label: "Mulai berkembang",
      note: "Bacaan Iqra mulai menunjukkan perkembangan yang baik.\nKelancaran dan ketepatan huruf masih perlu terus dikuatkan.\nPertahankan latihan agar lebih percaya diri saat membaca.\nBarakallah fiik.",
    },
    {
      key: "good",
      label: "Baik",
      note: "Bacaan Iqra sudah cukup baik dan semakin lancar.\nSiswa mulai mampu membaca dengan lebih tertib dan percaya diri.\nTetap jaga latihan agar bacaan semakin matang.\nBarakallah fiik.",
    },
    {
      key: "excellent",
      label: "Berprestasi",
      note: "Bacaan Iqra sangat baik dan progresnya menonjol.\nSiswa membaca dengan lancar, teliti, dan semangat belajar yang kuat.\nSemoga terus istiqamah hingga tahap berikutnya.\nBarakallah fiik.",
    },
  ],
  tahsin: [
    {
      key: "very_weak",
      label: "Sangat lemah",
      note: "Bacaan Al-Qur'an masih sangat perlu dibimbing secara perlahan.\nSiswa perlu menguatkan makhraj, panjang pendek, dan ketepatan tajwid dasar.\nLatihan rutin dengan contoh bacaan guru sangat dianjurkan.\nBarakallah fiik.",
    },
    {
      key: "weak",
      label: "Lemah",
      note: "Bacaan Al-Qur'an sudah mulai terbentuk, tetapi masih kurang stabil.\nPerlu perhatian pada mad, qalqalah, makhraj, dan hukum tajwid yang sering terlewat.\nMohon terus dilatih dengan sabar dan konsisten.\nBarakallah fiik.",
    },
    {
      key: "developing",
      label: "Mulai berkembang",
      note: "Bacaan Al-Qur'an mulai berkembang dan lebih terarah.\nPraktik tajwid, mad, qalqalah, dan makhraj sudah mulai terlihat, namun perlu dirapikan.\nTeruskan latihan agar bacaan semakin tartil.\nBarakallah fiik.",
    },
    {
      key: "good",
      label: "Baik",
      note: "Bacaan Al-Qur'an sudah baik dan cukup lancar.\nPenerapan tajwid, mad, qalqalah, dan makhraj mulai terjaga dengan rapi.\nPertahankan ketelitian agar bacaan semakin indah.\nBarakallah fiik.",
    },
    {
      key: "excellent",
      label: "Berprestasi",
      note: "Bacaan Al-Qur'an sangat baik, tartil, dan percaya diri.\nPenerapan tajwid, mad, qalqalah, serta makhraj terlihat kuat dan stabil.\nSemoga terus menjadi teladan dalam membaca Al-Qur'an.\nBarakallah fiik.",
    },
  ],
  tahfizh: [
    {
      key: "very_weak",
      label: "Sangat lemah",
      note: "Hafalan siswa masih sangat perlu dikuatkan kembali.\nKelancaran, ketepatan ayat, dan bacaan masih membutuhkan pendampingan dekat.\nFokuskan pada murojaah pendek tetapi rutin setiap hari.\nBarakallah fiik.",
    },
    {
      key: "weak",
      label: "Lemah",
      note: "Hafalan siswa mulai terbentuk, tetapi masih sering ragu dan terhenti.\nBacaan serta urutan ayat perlu lebih sering dimurojaah.\nMohon menjaga jadwal hafalan dan pengulangan di rumah.\nBarakallah fiik.",
    },
    {
      key: "developing",
      label: "Mulai berkembang",
      note: "Hafalan siswa mulai berkembang dengan cukup baik.\nKelancaran dan ketepatan bacaan sudah meningkat, namun masih perlu penguatan.\nTeruskan murojaah agar hafalan lebih melekat.\nBarakallah fiik.",
    },
    {
      key: "good",
      label: "Baik",
      note: "Hafalan siswa sudah baik dan cukup lancar.\nBacaan, urutan ayat, dan ketenangan saat menyetor semakin terjaga.\nPertahankan murojaah agar hafalan tetap kuat.\nBarakallah fiik.",
    },
    {
      key: "excellent",
      label: "Berprestasi",
      note: "Hafalan siswa sangat baik, lancar, dan kuat.\nBacaan saat menyetor terdengar rapi, tenang, dan penuh percaya diri.\nSemoga terus istiqamah menjaga hafalan Al-Qur'an.\nBarakallah fiik.",
    },
  ],
};

export const getAutoNoteOptions = (programType: string): AutoNoteOption[] => {
  if (programType === "tahfizh") return AUTO_NOTE_OPTIONS.tahfizh;
  if (programType === "tahsin") return AUTO_NOTE_OPTIONS.tahsin;
  return AUTO_NOTE_OPTIONS.iqra;
};

export const getAutoNoteByProgress = (programType: string, pagesSigned: number, target: number): string => {
  const options = getAutoNoteOptions(programType);
  if (pagesSigned < 0) return options[0].note;
  if (pagesSigned === 0) return options[1].note;
  if (pagesSigned < target) return options[2].note;
  if (pagesSigned < target * 2) return options[3].note;
  return options[4].note;
};

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MONTHLY_REPORTS_PAGE_SIZE = 1000;

export const useMonthlyReports = (studentId?: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["monthly_reports", studentId ?? "all", user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];

      const allReports: MonthlyReport[] = [];
      let from = 0;

      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from("monthly_reports")
          .select("*")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + MONTHLY_REPORTS_PAGE_SIZE - 1);

        if (studentId) {
          query = query.eq("student_id", studentId);
        }
        if (managedStudentIds) {
          query = query.in("student_id", managedStudentIds);
        }

        const { data, error } = await query;

        if (error) throw error;

        const batch = (data ?? []) as MonthlyReport[];
        allReports.push(...batch);

        if (batch.length < MONTHLY_REPORTS_PAGE_SIZE) break;
        from += MONTHLY_REPORTS_PAGE_SIZE;
      }

      return allReports;
    },
  });
};

export const useAllMonthlyReports = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["monthly_reports", "all", user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];

      const allReports: (MonthlyReport & {
        students: {
          nama: string;
          kelas: number;
          rombel: string;
          level: string;
        };
      })[] = [];
      let from = 0;

      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from("monthly_reports")
          .select("*, students(nama, kelas, rombel, level)")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + MONTHLY_REPORTS_PAGE_SIZE - 1);

        if (managedStudentIds) {
          query = query.in("student_id", managedStudentIds);
        }

        const { data, error } = await query;

        if (error) throw error;

        const batch = (data ?? []) as unknown as (MonthlyReport & {
          students: {
            nama: string;
            kelas: number;
            rombel: string;
            level: string;
          };
        })[];
        allReports.push(...batch);

        if (batch.length < MONTHLY_REPORTS_PAGE_SIZE) break;
        from += MONTHLY_REPORTS_PAGE_SIZE;
      }

      return allReports;
    },
  });
};

export const useMonthlyReportsForPeriod = ({
  month,
  year,
  enabled = true,
}: {
  month?: number;
  year?: number;
  enabled?: boolean;
}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["monthly_reports", "period", { month, year, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    enabled: enabled && !!month && !!year,
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];

      const allReports: (MonthlyReport & {
        students: {
          nama: string;
          kelas: number;
          rombel: string;
          level: string;
        };
      })[] = [];
      let from = 0;

      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from("monthly_reports")
          .select("*, students(nama, kelas, rombel, level)")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + MONTHLY_REPORTS_PAGE_SIZE - 1);

        if (month) {
          query = query.eq("month", month);
        }
        if (year) {
          query = query.eq("year", year);
        }
        if (managedStudentIds) {
          query = query.in("student_id", managedStudentIds);
        }

        const { data, error } = await query;

        if (error) throw error;

        const batch = (data ?? []) as unknown as (MonthlyReport & {
          students: {
            nama: string;
            kelas: number;
            rombel: string;
            level: string;
          };
        })[];
        allReports.push(...batch);

        if (batch.length < MONTHLY_REPORTS_PAGE_SIZE) break;
        from += MONTHLY_REPORTS_PAGE_SIZE;
      }

      return allReports;
    },
  });
};
  
export const useAddMonthlyReport = () => {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const teacherName =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user?.email?.trim() ||
    "Belum ditentukan";

  return useMutation({
    mutationFn: async (
      report: Omit<
        MonthlyReport,
        | "id"
        | "created_at"
        | "created_by"
        | "teacher_id"
        | "teacher_name"
        | "teacher_id_snapshot"
        | "teacher_name_snapshot"
      >,
    ) => {
      const { data: studentSnapshot, error: studentSnapshotError } = await supabase
        .from("students")
        .select("nama, kelas, rombel, level")
        .eq("id", report.student_id)
        .maybeSingle();

      if (studentSnapshotError) throw studentSnapshotError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("monthly_reports")
        .insert({
          ...report,
          created_by: user?.id ?? null,
          teacher_id: user?.id ?? null,
          teacher_name: teacherName,
          student_name_snapshot: report.student_name_snapshot ?? studentSnapshot?.nama ?? null,
          kelas_snapshot: report.kelas_snapshot ?? studentSnapshot?.kelas ?? null,
          rombel_snapshot: report.rombel_snapshot ?? studentSnapshot?.rombel ?? null,
          level_snapshot: report.level_snapshot ?? studentSnapshot?.level ?? null,
          teacher_id_snapshot: user?.id ?? null,
          teacher_name_snapshot: teacherName,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MonthlyReport;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["monthly_reports"] });
    },
  });
};

export const useUpdateMonthlyReport = () => {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const teacherName =
    profile?.full_name?.trim() ||
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user?.email?.trim() ||
    "Belum ditentukan";

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<MonthlyReport> & { id: string }) => {
      const { data: existingReport, error: existingReportError } = await supabase
        .from("monthly_reports")
        .select("student_id, student_name_snapshot, kelas_snapshot, rombel_snapshot, level_snapshot, teacher_id_snapshot, teacher_name_snapshot")
        .eq("id", id)
        .maybeSingle();

      if (existingReportError) throw existingReportError;

      const studentId = updates.student_id ?? existingReport?.student_id ?? null;
      const needsStudentSnapshot =
        studentId &&
        (updates.student_name_snapshot === undefined ||
          updates.kelas_snapshot === undefined ||
          updates.rombel_snapshot === undefined ||
          updates.level_snapshot === undefined);

      const { data: studentSnapshot, error: studentSnapshotError } = needsStudentSnapshot
        ? await supabase
            .from("students")
            .select("nama, kelas, rombel, level")
            .eq("id", studentId)
            .maybeSingle()
        : { data: null, error: null };

      if (studentSnapshotError) throw studentSnapshotError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("monthly_reports")
        .update({
          ...updates,
          teacher_id: user?.id ?? updates.teacher_id ?? null,
          teacher_name: teacherName,
          student_name_snapshot:
            updates.student_name_snapshot ??
            existingReport?.student_name_snapshot ??
            studentSnapshot?.nama ??
            null,
          kelas_snapshot:
            updates.kelas_snapshot ??
            existingReport?.kelas_snapshot ??
            studentSnapshot?.kelas ??
            null,
          rombel_snapshot:
            updates.rombel_snapshot ??
            existingReport?.rombel_snapshot ??
            studentSnapshot?.rombel ??
            null,
          level_snapshot:
            updates.level_snapshot ??
            existingReport?.level_snapshot ??
            studentSnapshot?.level ??
            null,
          teacher_id_snapshot:
            updates.teacher_id_snapshot ??
            existingReport?.teacher_id_snapshot ??
            user?.id ??
            updates.teacher_id ??
            null,
          teacher_name_snapshot:
            updates.teacher_name_snapshot ??
            existingReport?.teacher_name_snapshot ??
            teacherName,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MonthlyReport;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monthly_reports"] });
    },
  });
};

export const useDeleteMonthlyReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("monthly_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monthly_reports"] });
    },
  });
};
