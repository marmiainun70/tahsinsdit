import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeacherStudent {
  id: string;
  teacher_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected" | "conflict" | "released";
  created_at: string;
  requested_at?: string;
  requested_by?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_note?: string | null;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  kelas: number;
  rombel: string;
}

export const useTeacherStudents = (teacherId?: string, status = "approved") =>
  useQuery({
    queryKey: ["teacher_students", teacherId ?? "all", status],
    queryFn: async () => {
      let q = (supabase as any).from("teacher_students").select("*");
      if (teacherId) q = q.eq("teacher_id", teacherId);
      if (status !== "all") q = q.eq("status", status);
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
      const { error } = await (supabase as any).rpc("request_teacher_student", { p_student_id: studentId });
      if (error) throw error;
      if (kelas != null && rombel) {
        await (supabase as any)
          .from("teacher_classes")
          .upsert({ teacher_id: user.id, kelas, rombel }, { onConflict: "teacher_id,kelas,rombel", ignoreDuplicates: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher_students"] });
      qc.invalidateQueries({ queryKey: ["teacher_classes"] });
      qc.invalidateQueries({ queryKey: ["teacher-student-assignments"] });
    },
  });
};
