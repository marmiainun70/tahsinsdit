import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchApprovedManagedStudentIds } from "@/hooks/useSupabaseData";

export interface Attendance {
  id: string;
  student_id: string;
  month: number;
  year: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  created_by: string | null;
  created_at: string;
}

const sb = supabase as any;

export const useAttendance = (studentId?: string) =>
  {
    const { user, profile } = useAuth();
    return useQuery({
    queryKey: ["attendance", studentId ?? "all", user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      let query = sb.from("attendance").select("*").order("year", { ascending: false }).order("month", { ascending: false });
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) query = query.in("student_id", managedStudentIds);
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Attendance[];
    },
  });
};

export const useAllAttendance = () =>
  {
    const { user, profile } = useAuth();
    return useQuery({
    queryKey: ["attendance", "all", user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      let query = sb
        .from("attendance")
        .select("*, students(nama, kelas, rombel)")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) query = query.in("student_id", managedStudentIds);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as (Attendance & { students: { nama: string; kelas: number; rombel: string } })[];
    },
  });
};

export const useUpsertAttendance = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (att: Omit<Attendance, "id" | "created_at" | "created_by">) => {
      const { data, error } = await sb
        .from("attendance")
        .upsert(
          { ...att, created_by: user?.id ?? null },
          { onConflict: "student_id,month,year" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Attendance;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};
