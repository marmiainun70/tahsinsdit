import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthlyReportPeriodSettings {
  id: string;
  month: number;
  year: number;
  target_iqra: number;
  target_tahsin_lanjutan: number;
  target_tahfizh: number;
  effective_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

type PeriodSettingsInput = {
  month: number;
  year: number;
  target_iqra: number;
  target_tahsin_lanjutan: number;
  target_tahfizh: number;
  effective_days: number;
};

const CLASS_GROUPS = [1, 2, 3, 4, 5, 6].flatMap((kelas) =>
  ["A", "B", "C", "D"].map((rombel) => ({ kelas, rombel })),
);

export const MONTHLY_REPORT_PERIOD_SETTINGS_QUERY_KEY = "monthly-report-period-settings";

export const useMonthlyReportPeriodSettings = ({
  month,
  year,
  enabled = true,
}: {
  month: number;
  year: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [MONTHLY_REPORT_PERIOD_SETTINGS_QUERY_KEY, { month, year }],
    enabled: enabled && !!month && !!year,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("monthly_report_period_settings")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyReportPeriodSettings | null;
    },
  });

export const useUpsertMonthlyReportPeriodSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      syncAttendanceSettings = false,
      ...settings
    }: PeriodSettingsInput & { syncAttendanceSettings?: boolean }) => {
      const now = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("monthly_report_period_settings")
        .upsert(
          {
            ...settings,
            created_by: user?.id ?? null,
            updated_at: now,
          },
          { onConflict: "month,year" },
        )
        .select()
        .single();

      if (error) throw error;

      if (syncAttendanceSettings) {
        const attendancePayload = CLASS_GROUPS.map((group) => ({
          month: settings.month,
          year: settings.year,
          kelas: group.kelas,
          rombel: group.rombel,
          effective_days: settings.effective_days,
          is_locked: true,
          locked_by: user?.id ?? null,
          locked_at: now,
          created_by: user?.id ?? null,
          updated_at: now,
        }));

        const { error: attendanceError } = await (supabase as any)
          .from("attendance_period_settings")
          .upsert(attendancePayload, { onConflict: "month,year,kelas,rombel" });

        if (attendanceError) throw attendanceError;
      }

      return data as MonthlyReportPeriodSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MONTHLY_REPORT_PERIOD_SETTINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["attendance-period-settings"] });
    },
  });
};
