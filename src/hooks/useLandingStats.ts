import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingStats {
  siswa_aktif: number;
  guru: number;
  rombel: number;
  kehadiran: number;
  kehadiran_bulan: number | null;
  kehadiran_tahun: number | null;
  progres: number;
  progres_bulan: number | null;
  progres_tahun: number | null;
  catatan_aktivitas: number;
  laporan: number;
}

export const useLandingStats = () =>
  useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_landing_stats");
      if (error) throw error;
      return data as LandingStats;
    },
  });

export const formatCount = (n?: number) => {
  if (n === undefined || n === null) return "…";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")}K`;
  return n.toLocaleString("id-ID");
};
