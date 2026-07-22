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

      // 1. Get student details (to know their kelas & rombel)
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, kelas, rombel")
        .in("id", studentIds);

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) return {};

      // 2. Get individual assigned teachers for students
      const { data: tsData, error: tsError } = await supabase
        .from("teacher_students")
        .select("student_id, teacher_id")
        .in("student_id", studentIds)
        .eq("status", "approved");

      if (tsError) throw tsError;

      // 3. Get class assigned teachers
      // To optimize, we just fetch all teacher_classes, usually it's small
      const { data: tcData, error: tcError } = await supabase
        .from("teacher_classes")
        .select("teacher_id, kelas, rombel");

      if (tcError) throw tcError;

      // Collect all teacher IDs to fetch names
      const teacherIds = new Set<string>();
      tsData?.forEach(t => teacherIds.add(t.teacher_id));
      tcData?.forEach(t => teacherIds.add(t.teacher_id));

      if (teacherIds.size === 0) return {};

      // 4. Get profile names for those teachers
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(teacherIds));

      if (profError) throw profError;

      const profileMap: Record<string, string> = {};
      profData?.forEach(p => {
        profileMap[p.user_id] = p.full_name;
      });

      const resultMap: Record<string, string> = {};

      // Map class assignments first
      studentsData.forEach(student => {
        const classAssignment = tcData?.find(tc => 
          tc.kelas === student.kelas && 
          (!tc.rombel || tc.rombel === student.rombel)
        );
        if (classAssignment) {
          resultMap[student.id] = profileMap[classAssignment.teacher_id] || "Guru Tidak Diketahui";
        }
      });

      // Override with individual assignments (higher priority)
      tsData?.forEach(t => {
        resultMap[t.student_id] = profileMap[t.teacher_id] || "Guru Tidak Diketahui";
      });

      return resultMap;
    },
    enabled: studentIds.length > 0,
  });
};
