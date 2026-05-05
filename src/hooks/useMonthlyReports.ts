import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  achievement_status: string;
  notes: string;
  created_by: string | null;
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

export const TARGET_TAHFIZH = 3;
export const TARGET_TAHSIN = 15;
export const TARGET_IQRA = 15;

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
    return `Siswa mengalami penurunan dari Jilid ${startLevel} ke Jilid ${endLevel} dengan selisih ${total} halaman. Disarankan untuk mengulang materi sebelumnya guna memperkuat pemahaman dan kelancaran membaca sebelum melanjutkan ke jilid berikutnya.`;
  }
  return `Siswa mengalami penurunan progres pada Jilid ${startLevel} (selisih ${total} halaman). Disarankan untuk murojaah dan memperkuat pemahaman halaman sebelumnya.`;
};

export const buildTahfizhDeclineNote = (
  startJuz: number, startPage: number, endJuz: number, endPage: number,
): string => `Hafalan akhir (Juz ${endJuz} hal.${endPage}) lebih rendah dari hafalan awal (Juz ${startJuz} hal.${startPage}). Disarankan memperkuat murojaah sebelum melanjutkan ke target berikutnya.`;

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
  "⚠️ Siswa mengalami penurunan progres bacaan. Disarankan meningkatkan murojaah dan latihan membaca di rumah dengan pendampingan orang tua.";

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const useMonthlyReports = (studentId?: string) =>
  useQuery({
    queryKey: ["monthly_reports", studentId ?? "all"],
    queryFn: async () => {
      let query = (supabase as any).from("monthly_reports").select("*").order("year", { ascending: false }).order("month", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MonthlyReport[];
    },
  });

export const useAllMonthlyReports = () =>
  useQuery({
    queryKey: ["monthly_reports", "all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("monthly_reports")
        .select("*, students(nama, kelas, rombel, level)")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (MonthlyReport & { students: { nama: string; kelas: number; rombel: string; level: string } })[];
    },
  });

export const useAddMonthlyReport = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (report: Omit<MonthlyReport, "id" | "created_at" | "created_by">) => {
      const { data, error } = await (supabase as any)
        .from("monthly_reports")
        .insert({ ...report, created_by: user?.id ?? null })
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
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MonthlyReport> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("monthly_reports")
        .update(updates)
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
      const { error } = await (supabase as any).from("monthly_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monthly_reports"] });
    },
  });
};
