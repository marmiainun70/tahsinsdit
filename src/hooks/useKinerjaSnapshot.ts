import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export type RiwayatKinerjaGuru = Database["public"]["Tables"]["riwayat_kinerja_guru"]["Row"];

export function useKinerjaSnapshot() {
  const [historySnapshots, setHistorySnapshots] = useState<RiwayatKinerjaGuru[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('riwayat_kinerja_guru')
        .select('*')
        .order('bulan', { ascending: false });

      if (error) throw error;
      setHistorySnapshots(data || []);
    } catch (error) {
      console.error('Error fetching riwayat kinerja:', error);
      toast({
        title: "Gagal memuat riwayat",
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSnapshot = async (
    bulan: string, // YYYY-MM
    sepData: {
      teacherId: string;
      sessionId: string;
      totalIBP: number;
      statusBeban: string;
      totalIPP: number;
      statusIPP: string;
      statusSEP: string;
      activeStudents: number;
    }[]
  ) => {
    setSaving(true);
    try {
      if (sepData.length === 0) {
        throw new Error("Tidak ada data kinerja untuk disimpan.");
      }

      const inserts = sepData.map(t => ({
        guru_id: t.teacherId,
        sesi: t.sessionId,
        bulan: bulan,
        ibp_raw: t.totalIBP,
        ibp_status: t.statusBeban,
        ipp_score: t.totalIPP,
        ipp_status: t.statusIPP,
        sep_status: t.statusSEP,
        active_students: t.activeStudents,
        versi_formula: '1.0'
      }));

      const { error } = await supabase
        .from('riwayat_kinerja_guru')
        .upsert(inserts, { onConflict: 'guru_id,sesi,bulan' });

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Snapshot kinerja bulan ${bulan} berhasil disimpan.`,
      });
      
      fetchHistory(); // Refresh data
    } catch (error) {
      console.error('Error saving snapshot:', error);
      toast({
        title: "Gagal menyimpan snapshot",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    historySnapshots,
    loading,
    saving,
    saveSnapshot,
    refreshHistory: fetchHistory
  };
}
