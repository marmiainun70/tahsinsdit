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
        // @ts-expect-error evaluasi_awal_semester is dynamic in the DB now
        .select("*, evaluasi_awal_semester(final_predicate, evaluator_id)", { count: "exact" });

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
};

export const useSubmitDiagnosticWizard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: FullDiagnosticData) => {
      if (!user?.id) throw new Error("Tidak ada user login");

      // We use a custom RPC or batch insert since Supabase JS Client does not support multi-statement transactions directly
      // However, since we're using the standard JS client, we can insert into the parent table and then promise.all the child tables.
      // 1. Insert Core evaluasi_awal_semester
      // @ts-expect-error Types not fully regenerated
      const { data: evalResult, error: evalError } = await supabase
        .from("evaluasi_awal_semester")
        .insert({
          student_id: data.student_id,
          evaluator_id: user.id,
          academic_year_id: data.academic_year_id,
          final_score: data.final_score,
          final_predicate: data.final_predicate,
          selected_level_id: data.selected_level_id
        })
        .select()
        .single();

      if (evalError) throw evalError;
      
      const evaluasi_id = evalResult.id;

      // 2. Batch insert children
      const promises = [
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_profil_awal").insert({ evaluasi_id, jawaban: data.jawaban_profil }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_kelancaran").insert({ evaluasi_id, score: data.fluency_score }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_kesalahan_bacaan").insert({ evaluasi_id, lahn_jali_count: data.lahn_jali_count, lahn_khofi_count: data.lahn_khofi_count }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_makharij").insert({ evaluasi_id, checklist: data.checklist_makharij }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_tajwid").insert({ evaluasi_id, checklist: data.checklist_tajwid }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_waqaf").insert({ evaluasi_id, error_count: data.waqaf_error_count }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_tahfizh").insert({ evaluasi_id, salah_sambung_ayat_count: data.salah_sambung_ayat_count }),
        // @ts-expect-error Types not regenerated yet
        supabase.from("evaluasi_rekomendasi").insert({ evaluasi_id, fokus_pembinaan: data.fokus_pembinaan, recommended_level_id: data.recommended_level_id })
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
