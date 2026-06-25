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

export interface AttendanceStudent {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
}

export interface AttendanceWithStudent extends Attendance {
  students: {
    nama: string;
    kelas: number;
    rombel: string;
  } | null;
}

export interface AttendancePeriodSettings {
  id: string;
  month: number;
  year: number;
  kelas: number;
  rombel: string;
  effective_days: number;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const sb = supabase;
const ATTENDANCE_PAGE_SIZE = 1000;

const fetchAttendanceRows = async ({
  userId,
  role,
  month,
  year,
  months,
}: {
  userId?: string;
  role?: string;
  month?: number;
  year?: number;
  months?: number[];
}) => {
  const managedStudentIds = await fetchApprovedManagedStudentIds(userId, role);
  if (managedStudentIds && managedStudentIds.length === 0) return [];

  const allRows: Attendance[] = [];
  let from = 0;

  while (true) {
    let query = sb
      .from("attendance")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .range(from, from + ATTENDANCE_PAGE_SIZE - 1);

    if (managedStudentIds) query = query.in("student_id", managedStudentIds);
    if (year) query = query.eq("year", year);
    if (month) query = query.eq("month", month);
    if (months && months.length > 0) query = query.in("month", months);

    const { data, error } = await query;
    if (error) throw error;

    const batch = (data ?? []) as unknown as Attendance[];
    allRows.push(...batch);

    if (batch.length < ATTENDANCE_PAGE_SIZE) break;
    from += ATTENDANCE_PAGE_SIZE;
  }

  return allRows;
};

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

export const useAttendanceForRecapPeriod = ({
  month,
  year,
  enabled,
}: {
  month: number;
  year: number;
  enabled: boolean;
}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["attendance", "recap-period", { month, year, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    enabled: enabled && !!month && !!year,
    queryFn: () => fetchAttendanceRows({ userId: user?.id, role: profile?.role, month, year }),
  });
};

export const useAttendanceForRecapPeriods = ({
  months,
  year,
  enabled,
}: {
  months: number[];
  year: number;
  enabled: boolean;
}) => {
  const { user, profile } = useAuth();
  const uniqueMonths = Array.from(new Set(months)).sort((a, b) => a - b);

  return useQuery({
    queryKey: ["attendance", "recap-periods", { months: uniqueMonths, year, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    enabled: enabled && uniqueMonths.length > 0 && !!year,
    queryFn: () => fetchAttendanceRows({ userId: user?.id, role: profile?.role, months: uniqueMonths, year }),
  });
};

export const useStudentsForAttendance = ({
  kelas,
  rombel,
  search,
  enabled,
}: {
  kelas: string;
  rombel: string;
  search: string;
  enabled: boolean;
}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["attendance", "students", { kelas, rombel, search, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    enabled,
    queryFn: async () => {
      let query = sb
        .from("students")
        .select("id, nama, kelas, rombel, level")
        .order("kelas", { ascending: true })
        .order("nama", { ascending: true });

      if (kelas) query = query.eq("kelas", Number(kelas));
      if (rombel) query = query.eq("rombel", rombel);

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) query = query.in("id", managedStudentIds);

      const keyword = search.trim();
      if (keyword) query = query.ilike("nama", `%${keyword}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AttendanceStudent[];
    },
  });
};

export const useAttendanceByPeriod = ({
  month,
  year,
  kelas,
  rombel,
  enabled,
}: {
  month: number;
  year: number;
  kelas: string;
  rombel: string;
  enabled: boolean;
}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["attendance", "period", { month, year, kelas, rombel, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    enabled: enabled && !!month && !!year,
    queryFn: async () => {
      let studentQuery = sb
        .from("students")
        .select("id")
        .order("kelas", { ascending: true })
        .order("nama", { ascending: true });

      if (kelas) studentQuery = studentQuery.eq("kelas", Number(kelas));
      if (rombel) studentQuery = studentQuery.eq("rombel", rombel);

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) studentQuery = studentQuery.in("id", managedStudentIds);

      const { data: studentRows, error: studentError } = await studentQuery;
      if (studentError) throw studentError;

      const studentIds = (studentRows ?? []).map((student: { id: string }) => student.id);
      if (studentIds.length === 0) return [];

      const { data, error } = await sb
        .from("attendance")
        .select("id, student_id, month, year, present, sick, permission, absent, created_by, created_at, students(nama, kelas, rombel)")
        .eq("month", month)
        .eq("year", year)
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AttendanceWithStudent[];
    },
  });
};

export const useAttendancePeriodSettings = ({
  month,
  year,
  kelas,
  rombel,
  enabled,
}: {
  month: number;
  year: number;
  kelas: string;
  rombel: string;
  enabled: boolean;
}) =>
  useQuery({
    queryKey: ["attendance-period-settings", { month, year, kelas, rombel }],
    enabled: enabled && !!month && !!year && !!kelas && !!rombel,
    queryFn: async () => {
      const { data, error } = await sb
        .from("attendance_period_settings")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .eq("kelas", Number(kelas))
        .eq("rombel", rombel)
        .maybeSingle();

      if (error) throw error;
      return data as AttendancePeriodSettings | null;
    },
  });

export const useAttendancePeriodSettingsByGroups = ({
  month,
  year,
  groups,
  enabled,
}: {
  month: number;
  year: number;
  groups: { kelas: number; rombel: string }[];
  enabled: boolean;
}) =>
  useQuery({
    queryKey: ["attendance-period-settings", "groups", { month, year, groups }],
    enabled: enabled && !!month && !!year && groups.length > 0,
    queryFn: async () => {
      const kelasList = Array.from(new Set(groups.map((group) => group.kelas)));
      const { data, error } = await sb
        .from("attendance_period_settings")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .in("kelas", kelasList);

      if (error) throw error;

      const groupKeys = new Set(groups.map((group) => `${group.kelas}-${group.rombel}`));
      return ((data ?? []) as AttendancePeriodSettings[]).filter((setting) =>
        groupKeys.has(`${setting.kelas}-${setting.rombel}`)
      );
    },
  });

export const useAttendancePeriodSettingsByPeriods = ({
  months,
  year,
  groups,
  enabled,
}: {
  months: number[];
  year: number;
  groups: { kelas: number; rombel: string }[];
  enabled: boolean;
}) => {
  const uniqueMonths = Array.from(new Set(months)).sort((a, b) => a - b);

  return useQuery({
    queryKey: ["attendance-period-settings", "periods", { months: uniqueMonths, year, groups }],
    enabled: enabled && uniqueMonths.length > 0 && !!year && groups.length > 0,
    queryFn: async () => {
      const kelasList = Array.from(new Set(groups.map((group) => group.kelas)));
      const { data, error } = await sb
        .from("attendance_period_settings")
        .select("*")
        .eq("year", year)
        .in("month", uniqueMonths)
        .in("kelas", kelasList);

      if (error) throw error;

      const groupKeys = new Set(groups.map((group) => `${group.kelas}-${group.rombel}`));
      return ((data ?? []) as AttendancePeriodSettings[]).filter((setting) =>
        groupKeys.has(`${setting.kelas}-${setting.rombel}`)
      );
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

export const useBulkUpsertAttendance = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: Omit<Attendance, "id" | "created_at" | "created_by">[]) => {
      const payload = rows.map((row) => ({ ...row, created_by: user?.id ?? null }));
      const { data, error } = await sb
        .from("attendance")
        .upsert(payload, { onConflict: "student_id,month,year" })
        .select();
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useUpsertAttendancePeriodSettings = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: {
      month: number;
      year: number;
      kelas: number;
      rombel: string;
      effective_days: number;
      is_locked?: boolean;
      locked_by?: string | null;
      locked_at?: string | null;
    }) => {
      const { data, error } = await sb
        .from("attendance_period_settings")
        .upsert(
          {
            ...settings,
            created_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "month,year,kelas,rombel" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as AttendancePeriodSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-period-settings"] });
    },
  });
};
