import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useParentStudents = (userId?: string) => {
  return useQuery({
    queryKey: ["parent_students", userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from("parents")
          .select("student_id")
          .eq("user_id", userId);

        if (error) {
          console.warn("Error querying parents table:", error);
          return [];
        }

        return Array.from(new Set((data ?? []).map((item: { student_id: string }) => item.student_id)));
      } catch (err) {
        console.warn("Exception querying parents table:", err);
        return [];
      }
    },
    enabled: !!userId,
  });
};

export const useChildrenTeachers = (studentIds: string[]) => {
  return useQuery({
    queryKey: ["children_teachers", studentIds],
    queryFn: async () => {
      if (!studentIds.length) return {};

      try {
        // 1. Get student details (to know their kelas & rombel)
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, kelas, rombel")
          .in("id", studentIds);

        if (studentsError || !studentsData || studentsData.length === 0) return {};

        // 2. Get individual assigned teachers for students
        const { data: tsData } = await supabase
          .from("teacher_students")
          .select("student_id, teacher_id")
          .in("student_id", studentIds)
          .eq("status", "approved")
          .then(res => res)
          .catch(() => ({ data: [] }));

        // 3. Get class assigned teachers
        const { data: tcData } = await supabase
          .from("teacher_classes")
          .select("teacher_id, kelas, rombel")
          .then(res => res)
          .catch(() => ({ data: [] }));

        // 3.5 Get evaluator from evaluasi_awal_semester as fallback
        const { data: evalData } = await supabase
          .from("evaluasi_awal_semester")
          .select("student_id, evaluator_id")
          .in("student_id", studentIds)
          .then(res => res)
          .catch(() => ({ data: [] }));

      } catch (err) {
        console.warn("Exception in useChildrenTeachers:", err);
        return {};
      }

      // Collect all teacher IDs to fetch names
      const teacherIds = new Set<string>();
      tsData?.forEach(t => teacherIds.add(t.teacher_id));
      tcData?.forEach(t => teacherIds.add(t.teacher_id));
      evalData?.forEach(e => {
        if (e.evaluator_id) teacherIds.add(e.evaluator_id);
      });

      if (teacherIds.size === 0) return {};

      // 4. Get profile names for those teachers
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("user_id, full_name, whatsapp")
        .in("user_id", Array.from(teacherIds));

      if (profError) throw profError;

      const profileMap: Record<string, { name: string, whatsapp: string | null }> = {};
      profData?.forEach(p => {
        profileMap[p.user_id] = { name: p.full_name, whatsapp: p.whatsapp };
      });

      const resultMap: Record<string, { name: string, whatsapp: string | null }> = {};

      // Map fallback evaluator first (lowest priority)
      evalData?.forEach(e => {
        if (e.evaluator_id) {
          resultMap[e.student_id] = profileMap[e.evaluator_id] || { name: "Guru Tidak Diketahui", whatsapp: null };
        }
      });

      // Map class assignments (medium priority)
      studentsData.forEach(student => {
        const classAssignment = tcData?.find(tc => {
          if (String(tc.kelas) !== String(student.kelas)) return false;
          if (!tc.rombel) return true; // Matches any rombel if teacher_classes has no rombel specified
          
          const tRombel = tc.rombel.toUpperCase().trim();
          const sRombel = (student.rombel || "").toUpperCase().trim();
          
          // Match exactly, or if student rombel includes the letter (e.g. "1B" includes "B")
          return sRombel === tRombel || sRombel.includes(tRombel) || tRombel.includes(sRombel);
        });
        if (classAssignment) {
          resultMap[student.id] = profileMap[classAssignment.teacher_id] || { name: "Guru Tidak Diketahui", whatsapp: null };
        }
      });

      // Override with individual assignments (highest priority)
      tsData?.forEach(t => {
        resultMap[t.student_id] = profileMap[t.teacher_id] || { name: "Guru Tidak Diketahui", whatsapp: null };
      });

      // For any student that STILL has no teacher, set to unknown
      studentsData.forEach(student => {
        if (!resultMap[student.id]) {
          resultMap[student.id] = { name: "Guru Tidak Diketahui", whatsapp: null };
        }
      });

      return resultMap;
    },
    enabled: studentIds.length > 0,
  });
};

export const useAddParentStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      // 1. Find the student by NIS or NISN
      const { data: students, error: studentError } = await supabase
        .from("students")
        .select("id")
        .or(`nis.eq.${code},nisn.eq.${code}`);

      if (studentError) throw studentError;
      if (!students || students.length === 0) {
        throw new Error("Siswa dengan NIS atau NISN tersebut tidak ditemukan.");
      }

      const studentId = students[0].id;

      // 2. Check if already linked
      const { data: existing, error: existingError } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", userId)
        .eq("student_id", studentId);

      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        throw new Error("Siswa tersebut sudah terhubung dengan akun Anda.");
      }

      // 3. Link student
      const { error: insertError } = await supabase
        .from("parents")
        .insert({ user_id: userId, student_id: studentId });

      if (insertError) throw insertError;
      
      return studentId;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["parent_students", userId] });
    },
  });
};

export const useRemoveParentStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, studentId }: { userId: string; studentId: string }) => {
      const { error } = await supabase
        .from("parents")
        .delete()
        .eq("user_id", userId)
        .eq("student_id", studentId);

      if (error) throw error;
      return studentId;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["parent_students", userId] });
    },
  });
};
