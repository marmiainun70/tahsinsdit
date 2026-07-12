import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/useSupabaseData";

export const useDiagnosticStudents = ({
  page,
  pageSize,
  search,
  kelas,
  rombel,
}: {
  page: number;
  pageSize: number;
  search: string;
  kelas: string;
  rombel: string;
}) => {
  const { user, profile } = useAuth();
  const { data: permissions } = useRolePermissions();

  const isEvaluator = profile?.role === "admin" || 
    permissions?.find(p => p.feature_key === "evaluasi_diagnostik")?.teacher_access === true;

  return useQuery({
    queryKey: ["diagnostic-students", { page, pageSize, search, kelas, rombel, userId: user?.id, isEvaluator }],
    queryFn: async () => {
      // If not evaluator, they shouldn't access this
      if (!isEvaluator) {
        return { students: [], totalCount: 0 };
      }

      let query = supabase
        .from("students")
        .select("*, diagnostic_evaluations(status)", { count: "exact" });

      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(`nama.ilike.${searchTerm},nis.ilike.${searchTerm},nisn.ilike.${searchTerm}`);
      }

      if (kelas && kelas !== "all") {
        query = query.eq("kelas", kelas);
      }

      if (rombel && rombel !== "all") {
        query = query.eq("rombel", rombel);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order("kelas", { ascending: true })
        .order("rombel", { ascending: true })
        .order("nama", { ascending: true })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error("Error fetching diagnostic students:", error);
        throw error;
      }

      return {
        students: data || [],
        totalCount: count || 0,
      };
    },
    enabled: !!user?.id && isEvaluator !== undefined,
  });
};

export type TajwidMateri = {
  mad_thabii: boolean;
  qalqalah: boolean;
  nun_mati_tanwin: boolean;
  mim_mati: boolean;
  ghunnah: boolean;
  lam_tarif: boolean;
};

export type DiagnosticEvaluationData = {
  student_id: string;
  academic_year_id: string;
  level_awal: string;
  kelancaran_membaca?: number;
  makharijul_huruf?: number;
  tajwid_dasar_materi?: TajwidMateri;
  tajwid_dasar_skor?: string;
  hasil_kemampuan?: string;
  rekomendasi?: string;
  catatan_penguji?: string;
};

export const useSubmitDiagnostic = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: DiagnosticEvaluationData) => {
      if (!user?.id) throw new Error("Tidak ada user login");

      // Calculate hasil_kemampuan automatically if not Tahfizh
      let hasil_kemampuan = data.hasil_kemampuan;
      if (data.level_awal !== "tahfizh" && data.level_awal !== "belum_bisa_baca") {
        const k = data.kelancaran_membaca || 0;
        const m = data.makharijul_huruf || 0;
        const t = data.tajwid_dasar_skor || "belum";
        
        if (k < 3 || m < 3) {
          hasil_kemampuan = "Kurang Lancar";
        } else if (k >= 4 && m >= 4 && (t === "baik" || t === "menguasai")) {
          hasil_kemampuan = "Sangat Lancar";
        } else {
          hasil_kemampuan = "Cukup Lancar";
        }
      }

      // Upsert into diagnostic_evaluations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as any)
        .from("diagnostic_evaluations")
        .upsert({
          student_id: data.student_id,
          academic_year_id: data.academic_year_id,
          evaluator_id: user.id,
          evaluated_at: new Date().toISOString(),
          status: "sudah_dievaluasi",
          level_awal: data.level_awal,
          kelancaran_membaca: data.kelancaran_membaca,
          makharijul_huruf: data.makharijul_huruf,
          tajwid_dasar_materi: data.tajwid_dasar_materi,
          tajwid_dasar_skor: data.tajwid_dasar_skor,
          hasil_kemampuan: hasil_kemampuan,
          rekomendasi: data.rekomendasi,
          catatan_penguji: data.catatan_penguji,
        }, {
          onConflict: 'student_id, academic_year_id'
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Evaluasi Berhasil",
        description: "Data evaluasi diagnostik telah disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: ["diagnostic-students"] });
    },
    onError: (error) => {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
