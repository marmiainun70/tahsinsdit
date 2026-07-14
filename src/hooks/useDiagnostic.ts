import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/useSupabaseData";

import { fetchApprovedManagedStudentIds } from "@/hooks/useSupabaseData";

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

  return useQuery({
    queryKey: ["diagnostic-students", { page, pageSize, search, kelas, rombel, userId: user?.id, role: profile?.role }],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*, evaluasi_awal_semester(final_predicate, evaluator_id)", { count: "exact" });



      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(`nama.ilike.${searchTerm},nis.ilike.${searchTerm},nisn.ilike.${searchTerm}`);
      }

      if (kelas && kelas !== "all") {
        query = query.eq("kelas", parseInt(kelas));
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
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return {
        students: data || [],
        totalCount: count || 0,
      };
    },
    enabled: !!user?.id,
  });
};

export type FullDiagnosticData = {
  student_id: string;
  academic_year_id: string;
  final_score: number;
  final_predicate: string;
  selected_level_id?: string;
  
  // Profil Awal
  jawaban_profil: Record<string, unknown>;
  
  // Core
  fluency_score: number;
  lahn_jali_count: number;
  lahn_khofi_count: number;
  checklist_makharij: Record<string, "Baik" | "Perlu Latihan">;
  
  // Advanced (Lanjutan)
  checklist_tajwid: Record<string, "Baik" | "Perlu Latihan">;
  waqaf_error_count: number;
  
  // Advanced (Tahfizh)
  salah_sambung_ayat_count: number;
  
  // Recommendation
  fokus_pembinaan: string[];
  recommended_level_id?: string;
  selectedKodeLevel?: string;
};

export const useSubmitDiagnosticWizard = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: FullDiagnosticData) => {
      if (!user?.id) throw new Error("Tidak ada user login");

      let final_selected_level_id = data.selected_level_id;
      
      if (!final_selected_level_id && data.selectedKodeLevel) {
        const { data: levelData } = await supabase
          .from("master_level_kemampuan")
          .select("id")
          .eq("kode_level", data.selectedKodeLevel)
          .single();
        if (levelData) {
          final_selected_level_id = levelData.id;
        }
      }

      // Hapus data lama jika ada untuk menghindari duplikasi saat fitur "Ubah Evaluasi" digunakan.
      // Relasi ON DELETE CASCADE di database akan otomatis menghapus data di tabel-tabel child.
      await supabase
        .from("evaluasi_awal_semester")
        .delete()
        .eq("student_id", data.student_id)
        .eq("academic_year_id", data.academic_year_id);

      // We use a custom RPC or batch insert since Supabase JS Client does not support multi-statement transactions directly
      // However, since we're using the standard JS client, we can insert into the parent table and then promise.all the child tables.
      // 1. Insert Core evaluasi_awal_semester
      const { data: evalResult, error: evalError } = await supabase
        .from("evaluasi_awal_semester")
        .insert({
          student_id: data.student_id,
          evaluator_id: user.id,
          academic_year_id: data.academic_year_id,
          final_score: data.final_score,
          final_predicate: data.final_predicate,
          selected_level_id: final_selected_level_id
        } as never)
        .select()
        .single();

      if (evalError) throw evalError;
      
      const evaluasi_id = evalResult.id;

      // 2. Batch insert children
      const promises = [
        supabase.from("evaluasi_profil_awal").insert({ evaluasi_id, jawaban: data.jawaban_profil } as never),
        supabase.from("evaluasi_kelancaran").insert({ evaluasi_id, score: data.fluency_score } as never),
        supabase.from("evaluasi_kesalahan_bacaan").insert({ evaluasi_id, lahn_jali_count: data.lahn_jali_count, lahn_khofi_count: data.lahn_khofi_count } as never),
        supabase.from("evaluasi_makharij").insert({ evaluasi_id, checklist: data.checklist_makharij } as never),
        supabase.from("evaluasi_tajwid").insert({ evaluasi_id, checklist: data.checklist_tajwid } as never),
        supabase.from("evaluasi_waqaf").insert({ evaluasi_id, error_count: data.waqaf_error_count } as never),
        supabase.from("evaluasi_tahfizh").insert({ evaluasi_id, salah_sambung_ayat_count: data.salah_sambung_ayat_count } as never),
        supabase.from("evaluasi_rekomendasi").insert({ evaluasi_id, fokus_pembinaan: data.fokus_pembinaan, recommended_level_id: final_selected_level_id } as never)
      ];

      const results = await Promise.allSettled(promises);
      
      const errors = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));
      if (errors.length > 0) {
        // Since we lack a strict SQL transaction block from JS client without RPC,
        // we might leave orphaned rows if something fails.
        // As a safeguard, delete the parent if child insert fails
        await supabase.from("evaluasi_awal_semester").delete().eq("id", evaluasi_id);
        throw new Error("Gagal menyimpan detail evaluasi. Silakan coba lagi.");
      }

      return evalResult;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Evaluasi Berhasil",
        description: "Data evaluasi diagnostik telah disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: ["diagnostic-students"] });
      queryClient.invalidateQueries({ queryKey: ["diagnostic-detail", variables.student_id] });
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

export const useDiagnosticDetail = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["diagnostic-detail", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("evaluasi_awal_semester")
        .select(`
          *,
          evaluasi_profil_awal(jawaban),
          evaluasi_kelancaran(score),
          evaluasi_kesalahan_bacaan(lahn_jali_count, lahn_khofi_count),
          evaluasi_makharij(checklist),
          evaluasi_tajwid(checklist),
          evaluasi_waqaf(error_count),
          evaluasi_tahfizh(salah_sambung_ayat_count),
          evaluasi_rekomendasi(fokus_pembinaan, recommended_level_id),
          master_level_kemampuan(kode_level, nama_level)
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching diagnostic detail:", error);
        throw error;
      }
      
      return data || null;
    },
    enabled: !!studentId,
  });
};
