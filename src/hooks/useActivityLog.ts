import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useRecentLevelUpsByClass = (kelas: number) =>
  useQuery({
    queryKey: ["activity_logs", "naik_level", "class", kelas],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("activity_logs" as never)
        .select("student_id, metadata, created_at")
        .eq("activity_type", "naik_level")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Return a map: studentId → most recent naik_level metadata
      const map: Record<string, { new_level: string; created_at: string }> = {};
      (data as Array<{ student_id: string; metadata: Record<string, unknown>; created_at: string }>).forEach(row => {
        if (!map[row.student_id]) {
          map[row.student_id] = {
            new_level: String(row.metadata?.new_level ?? ""),
            created_at: row.created_at,
          };
        }
      });
      return map;
    },
    staleTime: 60_000,
  });

export type ActivityType =
  | "pindah_rombel"
  | "lulus_ujian"
  | "tidak_lulus_ujian"
  | "nilai_rendah"
  | "catatan_progres"
  | "naik_level";

export interface ActivityLog {
  id: string;
  student_id: string;
  created_by: string | null;
  activity_type: ActivityType;
  judul: string;
  deskripsi: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const ACTIVITY_META: Record<
  ActivityType,
  { icon: string; color: string; bgColor: string; borderColor: string }
> = {
  naik_level:      { icon: "🎓", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  lulus_ujian:     { icon: "🏆", color: "text-amber-700",   bgColor: "bg-amber-50",   borderColor: "border-amber-200"  },
  tidak_lulus_ujian:{ icon: "📋", color: "text-yellow-700", bgColor: "bg-yellow-50",  borderColor: "border-yellow-200" },
  pindah_rombel:   { icon: "🔄", color: "text-blue-700",    bgColor: "bg-blue-50",    borderColor: "border-blue-200"   },
  nilai_rendah:    { icon: "⚠️",  color: "text-red-700",    bgColor: "bg-red-50",     borderColor: "border-red-200"    },
  catatan_progres: { icon: "📝", color: "text-violet-700",  bgColor: "bg-violet-50",  borderColor: "border-violet-200" },
};

export const useActivityLogs = (studentId: string) =>
  useQuery({
    queryKey: ["activity_logs", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs" as never)
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!studentId,
  });

export const useAddActivityLog = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (log: {
      student_id: string;
      activity_type: ActivityType;
      judul: string;
      deskripsi?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("activity_logs" as never)
        .insert({
          ...log,
          created_by: user?.id ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as ActivityLog;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["activity_logs", (data as ActivityLog).student_id] });
    },
  });
};
