import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useParentStudents = (userId?: string) => {
  return useQuery({
    queryKey: ["parent_students", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("parents")
        .select("student_id")
        .eq("user_id", userId);

      if (error) throw error;

      return Array.from(new Set((data ?? []).map((item: { student_id: string }) => item.student_id)));
    },
    enabled: !!userId,
  });
};

export const useChildrenTeachers = (studentIds: string[]) => {
  return useQuery({
    queryKey: ["children_teachers", studentIds],
    queryFn: async () => {
      if (!studentIds.length) return {};

      // 1. Get assigned teachers for students
      const { data: tsData, error: tsError } = await supabase
        .from("teacher_students")
        .select("student_id, teacher_id")
        .in("student_id", studentIds)
        .eq("status", "approved");

      if (tsError) throw tsError;
      if (!tsData || tsData.length === 0) return {};

      const teacherIds = Array.from(new Set(tsData.map(t => t.teacher_id)));

      // 2. Get profile names for those teachers
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", teacherIds);

      if (profError) throw profError;

      const profileMap: Record<string, string> = {};
      profData?.forEach(p => {
        profileMap[p.user_id] = p.full_name;
      });

      const resultMap: Record<string, string> = {};
      tsData.forEach(t => {
        resultMap[t.student_id] = profileMap[t.teacher_id] || "Guru Tidak Diketahui";
      });

      return resultMap;
    },
    enabled: studentIds.length > 0,
  });
};
