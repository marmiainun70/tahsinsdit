import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type MonthlyReport = Database['public']['Tables']['monthly_reports']['Row'];

export interface AggregatedReport {
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  program: string;
  months: string[];
  startPage: number;
  endPage: number;
  totalPages: number;
  totalTarget: number;
  averageAttendance: number;
  status: 'achieved' | 'not_achieved' | 'partial' | 'empty';
  guru: string;
  catatan: string;
  monthlyData: Array<{
    month: string;
    year: number;
    startPage: number;
    endPage: number;
    pagesRead: number;
    targetPages: number;
    iqraLevel: string | null;
    endIqraLevel: string | null;
    attendancePercentage: number;
    achievementStatus: string;
    notes: string;
  }>;
}

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTHLY_REPORTS_PAGE_SIZE = 1000;

export const useAllMonthlyReports = () => {
  return useQuery({
    queryKey: ['all-monthly-reports'],
    queryFn: async () => {
      const allReports: MonthlyReport[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('id', { ascending: true })
          .range(from, from + MONTHLY_REPORTS_PAGE_SIZE - 1);

        if (error) throw error;

        const batch = (data || []) as MonthlyReport[];
        allReports.push(...batch);

        if (batch.length < MONTHLY_REPORTS_PAGE_SIZE) break;
        from += MONTHLY_REPORTS_PAGE_SIZE;
      }

      return allReports;
    },
  });
};

export const useMultiMonthReports = (
  studentIds: string[],
  months: number[],
  year: number
) => {
  return useQuery({
    queryKey: ['multi-month-reports', studentIds, months, year],
    queryFn: async () => {
      if (!studentIds.length || !months.length) return {};

      const reports: MonthlyReport[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('monthly_reports')
          .select('*')
          .in('student_id', studentIds)
          .in('month', months)
          .eq('year', year)
          .order('id', { ascending: true })
          .range(from, from + MONTHLY_REPORTS_PAGE_SIZE - 1);

        if (error) throw error;

        const batch = (data || []) as MonthlyReport[];
        reports.push(...batch);

        if (batch.length < MONTHLY_REPORTS_PAGE_SIZE) break;
        from += MONTHLY_REPORTS_PAGE_SIZE;
      }

      // Group by student
      const grouped = reports.reduce(
        (acc, report) => {
          if (!acc[report.student_id]) {
            acc[report.student_id] = [];
          }
          acc[report.student_id].push(report);
          return acc;
        },
        {} as Record<string, MonthlyReport[]>
      );

      return grouped;
    },
    enabled: studentIds.length > 0 && months.length > 0,
  });
};

export const aggregateMultiMonthData = (
  studentId: string,
  nama: string,
  kelas: number,
  rombel: string,
  level: string,
  program: string,
  reports: MonthlyReport[],
  months: number[],
  year: number
): AggregatedReport => {
  const monthlyData = months
    .map(m => {
      const rep = reports.find(r => r.month === m && r.year === year);
      return {
        month: MONTH_NAMES[m - 1],
        year,
        startPage: rep?.start_page || 0,
        endPage: rep?.end_page || 0,
        pagesRead: rep?.pages_read || 0,
        targetPages: rep?.target_pages || 0,
        iqraLevel: rep?.iqra_level || null,
        endIqraLevel: (rep as any)?.end_iqra_level || null,
        attendancePercentage: 0,
        achievementStatus: rep?.achievement_status || 'empty',
        notes: rep?.notes || '',
      };
    })
    .sort((a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month));

  const filledMonths = monthlyData.filter(m => m.pagesRead > 0);
  const totalPages = filledMonths.reduce((sum, m) => sum + m.pagesRead, 0);
  const totalTarget = filledMonths.reduce((sum, m) => sum + m.targetPages, 0);
  const avgAttendance =
    filledMonths.length > 0
      ? Math.round(
          filledMonths.reduce((sum, m) => sum + m.attendancePercentage, 0) /
            filledMonths.length
        )
      : 0;

  const achievedCount = filledMonths.filter(
    m => m.achievementStatus === 'achieved'
  ).length;
  let status: 'achieved' | 'not_achieved' | 'partial' | 'empty';
  if (filledMonths.length === 0) {
    status = 'empty';
  } else if (achievedCount === filledMonths.length) {
    status = 'achieved';
  } else if (achievedCount > 0) {
    status = 'partial';
  } else {
    status = 'not_achieved';
  }

  const guru = reports[0]?.teacher_name?.trim() || '-';

  return {
    studentId,
    nama,
    kelas,
    rombel,
    level,
    program,
    months: monthlyData.map(m => m.month),
    startPage: monthlyData[0]?.startPage || 0,
    endPage: monthlyData[monthlyData.length - 1]?.endPage || 0,
    totalPages,
    totalTarget,
    averageAttendance: avgAttendance,
    status,
    guru,
    catatan: monthlyData.map(m => m.notes).filter(Boolean).join(' | '),
    monthlyData,
  };
};
