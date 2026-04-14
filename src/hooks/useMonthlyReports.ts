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

export const getTarget = (programType: string): number => {
  return programType === "tahsin" ? 100 : 15;
};

export const getAchievementStatus = (pagesRead: number, target: number): string => {
  return pagesRead >= target ? "achieved" : "not_achieved";
};

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
