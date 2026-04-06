import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const useAttendance = (studentId?: string) =>
  useQuery({
    queryKey: ["attendance", studentId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("attendance" as any).select("*").order("year", { ascending: false }).order("month", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Attendance[];
    },
  });

export const useAllAttendance = () =>
  useQuery({
    queryKey: ["attendance", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance" as any)
        .select("*, students(nama, kelas, rombel)")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as (Attendance & { students: { nama: string; kelas: number; rombel: string } })[];
    },
  });

export const useUpsertAttendance = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (att: Omit<Attendance, "id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("attendance" as any)
        .upsert(
          { ...att, created_by: user?.id ?? null } as any,
          { onConflict: "student_id,month,year" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as Attendance;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};
