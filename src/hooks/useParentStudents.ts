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
