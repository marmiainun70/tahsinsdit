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
        .select("*", { count: "exact" });

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

export type DiagnosticEvaluationData = {
  student_id: string;
  makhraj_score: number;
  sifat_score: number;
  tajwid_score: number;
  fluency_score: number;
  notes?: string;
  recommended_level?: string;
};

export const useSubmitDiagnostic = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: DiagnosticEvaluationData) => {
      if (!user?.id) throw new Error("Tidak ada user login");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as any)
        .from("diagnostic_evaluations")
        .insert({
          student_id: data.student_id,
          evaluator_id: user.id,
          makhraj_score: data.makhraj_score,
          sifat_score: data.sifat_score,
          tajwid_score: data.tajwid_score,
          fluency_score: data.fluency_score,
          notes: data.notes || null,
          recommended_level: data.recommended_level || null,
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
