import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeacherStudent {
  id: string;
  teacher_id: string;
  student_id: string;
  created_at: string;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  kelas: number;
  rombel: string;
}

export const useTeacherStudents = (teacherId?: string) =>
  useQuery({
    queryKey: ["teacher_students", teacherId ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from("teacher_students").select("*");
      if (teacherId) q = q.eq("teacher_id", teacherId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TeacherStudent[];
    },
  });

export const useTeacherClasses = (teacherId?: string) =>
  useQuery({
    queryKey: ["teacher_classes", teacherId ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from("teacher_classes").select("*");
      if (teacherId) q = q.eq("teacher_id", teacherId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TeacherClass[];
    },
  });

/** Otomatis tambahkan relasi guru–siswa & guru–kelas saat guru membuat laporan untuk siswa baru */
export const useEnsureTeacherStudent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, kelas, rombel }: { studentId: string; kelas?: number; rombel?: string }) => {
      if (!user?.id) return;
      await (supabase as any)
        .from("teacher_students")
        .upsert({ teacher_id: user.id, student_id: studentId }, { onConflict: "teacher_id,student_id", ignoreDuplicates: true });
      if (kelas != null && rombel) {
        await (supabase as any)
          .from("teacher_classes")
          .upsert({ teacher_id: user.id, kelas, rombel }, { onConflict: "teacher_id,kelas,rombel", ignoreDuplicates: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher_students"] });
      qc.invalidateQueries({ queryKey: ["teacher_classes"] });
    },
  });
};
