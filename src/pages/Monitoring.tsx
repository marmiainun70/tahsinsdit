import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, ClipboardList, RotateCcw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import { useStudents } from "@/hooks/useSupabaseData";
import { useTeacherClasses, useTeacherStudents } from "@/hooks/useTeacherStudents";
import { useProfileMap } from "@/hooks/useProfiles";
import { useAttendanceForRecapPeriod, useAttendancePeriodSettingsByGroups } from "@/hooks/useAttendance";
import { MONTH_NAMES, useMonthlyReportsForPeriod } from "@/hooks/useMonthlyReports";
import { buildRecapJoinedGroups, type RecapJoinedRow } from "@/utils/recapMonthlyReportRows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitoringSiswa } from "@/components/monitoring/MonitoringSiswa";
import { MonitoringGuru } from "@/components/monitoring/MonitoringGuru";

const now = new Date();
const currentMonthIdx = now.getMonth();
const initialSemester = currentMonthIdx >= 6 ? "ganjil" : "genap";
const YEARS = [2024, 2025, 2026, 2027, 2028];

type TeacherLoadReportRow = {
  student_id: string;
  teacher_id: string | null;
  teacher_name: string | null;
  teacher_id_snapshot?: string | null;
  teacher_name_snapshot?: string | null;
  program_type: string | null;
  month: number;
  year: number;
};

type TeacherLoadSummary = {
  teacherId: string;
  teacherName: string;
  TD: number;
  TL: number;
  TFZ: number;
  total: number;
  tdPercent: number;
};

type TeacherLoadChartLimit = "8" | "15" | "all";

type TeacherOverviewRow = {
  teacherId: string;
  teacherName: string;
  studentCount: number;
  classCount: number;
  reportFilled: number;
  reportEmpty: number;
  avgProgress: number | null;
  loadStatus: string;
  loadStatusClassName: string;
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const getMonthLabel = (month: number, year: number) => `${MONTH_NAMES[month - 1]} ${year}`;

const getTeacherLoadKey = (teacherName: string | null | undefined, teacherId?: string | null) =>
  teacherName?.trim() || teacherId || "Tidak Diketahui";

const getPreviousPeriod = (month: number, year: number) => {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
};

const getProgramBucket = (programType: string | null): "TD" | "TL" | "TFZ" => {
  const normalized = (programType ?? "").toLowerCase();
  if (normalized.includes("tahfizh")) return "TFZ";
  if (normalized.includes("lanjutan") || normalized === "tahsin") return "TL";
  return "TD";
};

const normalizeTeacherNameForRow = (
  row: RecapJoinedRow,
  assignedTeachers: string[],
  studentAssignedTeachers: string[],
) => {
  let teacherName = row.guru && row.guru !== "-" ? row.guru : "Tidak Diketahui";

  if (teacherName === "Tidak Diketahui") {
    if (studentAssignedTeachers.length === 1) {
      teacherName = studentAssignedTeachers[0];
    } else if (assignedTeachers.length === 1) {
      teacherName = assignedTeachers[0];
    } else if (studentAssignedTeachers.length > 1) {
      teacherName = studentAssignedTeachers[0];
    }
  }

  if (assignedTeachers.length === 1) return assignedTeachers[0];

  if (assignedTeachers.length > 1) {
    const loweredTeacher = teacherName.toLowerCase();
    const matched = assignedTeachers.find((name) =>
      loweredTeacher.includes(name.toLowerCase().split(" ")[0]),
    );
    if (matched) return matched;
  }

  return teacherName;
};

const buildTeacherLoadSummaries = (rows: TeacherLoadReportRow[]): TeacherLoadSummary[] => {
  const map = new Map<string, TeacherLoadSummary>();
  const seenStudentPerTeacher = new Set<string>();

  rows.forEach((row) => {
    const teacherName =
      row.teacher_name_snapshot?.trim() || row.teacher_name?.trim() || "Tidak Diketahui";
    const teacherId = getTeacherLoadKey(teacherName, row.teacher_id_snapshot ?? row.teacher_id);
    const uniqueKey = `${teacherId}-${row.student_id}`;
    if (seenStudentPerTeacher.has(uniqueKey)) return;
    seenStudentPerTeacher.add(uniqueKey);

    if (!map.has(teacherId)) {
      map.set(teacherId, {
        teacherId,
        teacherName,
        TD: 0,
        TL: 0,
        TFZ: 0,
        total: 0,
        tdPercent: 0,
      });
    }

    const summary = map.get(teacherId)!;
    const bucket = getProgramBucket(row.program_type);
    summary[bucket] += 1;
    summary.total += 1;
  });

  return Array.from(map.values())
    .map((summary) => ({
      ...summary,
      tdPercent: summary.total > 0 ? (summary.TD / summary.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total || a.teacherName.localeCompare(b.teacherName));
};

export default function Monitoring() {
  const { user, profile } = useAuth();
  const isTeacher = isTeacherRole(profile?.role);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLTableElement>(null);

  const { data: students = [], isLoading: ls } = useStudents();
  const { data: assignments = [], isLoading: la } = useTeacherClasses(user?.id);
  const { data: allTeacherStudents = [] } = useTeacherStudents("all", "approved");
  const profileMap = useProfileMap();

  const [activeTab, setActiveTab] = useState("siswa");
  const [filterSemester, setFilterSemester] = useState<string>(initialSemester);
  const [filterMonth, setFilterMonth] = useState<string>(String(currentMonthIdx + 1));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedRombels, setExpandedRombels] = useState<Record<string, boolean>>({});
  const [teacherLoadChartLimit, setTeacherLoadChartLimit] = useState<TeacherLoadChartLimit>("8");
  const [showAllJenjang, setShowAllJenjang] = useState(false);

  const selectedMonth = Number(filterMonth);
  const selectedYear = Number(filterYear);
  const previousLoadPeriod = useMemo(
    () => getPreviousPeriod(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  );

  useEffect(() => {
    const m = Number(filterMonth);
    if (filterSemester === "ganjil" && (m < 7 || m > 12)) {
      setFilterMonth("7");
    } else if (filterSemester === "genap" && (m < 1 || m > 6)) {
      setFilterMonth("1");
    }
  }, [filterMonth, filterSemester]);

  const hasAccess = useMemo(() => {
    if (!isTeacher) return true;
    return assignments.length > 0;
  }, [assignments.length, isTeacher]);

  const { data: reports = [], isLoading: lr } = useMonthlyReportsForPeriod({
    month: selectedMonth,
    year: selectedYear,
    enabled: hasAccess,
  });

  const availableClasses = useMemo(() => {
    if (!isTeacher) {
      return Array.from(new Set(students.map((s) => s.kelas))).sort((a, b) => a - b);
    }
    return Array.from(new Set(assignments.map((a) => a.kelas))).sort((a, b) => a - b);
  }, [assignments, isTeacher, students]);

  const accessibleStudents = useMemo(() => {
    if (!isTeacher) return students;
    return students.filter((student) =>
      assignments.some((assignment) => assignment.kelas === student.kelas && assignment.rombel === student.rombel),
    );
  }, [assignments, isTeacher, students]);

  const studentAssignedTeachers = useMemo(() => {
    const map = new Map<string, string[]>();
    allTeacherStudents.forEach((assignment) => {
      const teacherName = profileMap.get(assignment.teacher_id);
      if (!teacherName) return;
      const current = map.get(assignment.student_id) ?? [];
      if (!current.includes(teacherName)) current.push(teacherName);
      map.set(assignment.student_id, current);
    });
    return map;
  }, [allTeacherStudents, profileMap]);

  const availableRombels = useMemo(() => {
    let filtered = accessibleStudents;
    if (filterKelas !== "all") {
      filtered = filtered.filter((student) => student.kelas === Number(filterKelas));
    }
    return Array.from(new Set(filtered.map((student) => student.rombel))).sort((a, b) => a.localeCompare(b));
  }, [accessibleStudents, filterKelas]);

  const availableMonths = useMemo(() => {
    if (filterSemester === "ganjil") {
      return MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name })).slice(6);
    }
    if (filterSemester === "genap") {
      return MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name })).slice(0, 6);
    }
    return MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name }));
  }, [filterSemester]);

  const baseFilteredStudents = useMemo(() => {
    let filtered = accessibleStudents;
    if (filterKelas !== "all") filtered = filtered.filter((student) => student.kelas === Number(filterKelas));
    if (filterRombel !== "all") filtered = filtered.filter((student) => student.rombel === filterRombel);
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.nama.toLowerCase().includes(query) || student.rombel.toLowerCase().includes(query),
      );
    }
    return filtered.sort(
      (a, b) =>
        a.kelas - b.kelas || a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama),
    );
  }, [accessibleStudents, filterKelas, filterRombel, search]);

  const availableTeachers = useMemo(() => {
    const set = new Set<string>();
    baseFilteredStudents.forEach((student) => {
      (studentAssignedTeachers.get(student.id) ?? []).forEach((teacherName) => set.add(teacherName));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [baseFilteredStudents, studentAssignedTeachers]);

  const filteredStudents = useMemo(() => {
    if (filterTeacher === "all") return baseFilteredStudents;
    return baseFilteredStudents.filter((student) =>
      (studentAssignedTeachers.get(student.id) ?? []).includes(filterTeacher),
    );
  }, [baseFilteredStudents, filterTeacher, studentAssignedTeachers]);

  const visibleGroupKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredStudents.forEach((student) => keys.add(`${student.kelas}-${student.rombel}`));
    return Array.from(keys).map((key) => {
      const [kelas, rombel] = key.split("-");
      return { kelas: Number(kelas), rombel };
    });
  }, [filteredStudents]);

  const teacherLoadStudentIds = useMemo(() => filteredStudents.map((student) => student.id), [filteredStudents]);
  const teacherLoadStudentIdSet = useMemo(() => new Set(teacherLoadStudentIds), [teacherLoadStudentIds]);

  const attendanceQuery = useAttendanceForRecapPeriod({
    month: selectedMonth,
    year: selectedYear,
    enabled: hasAccess,
  });

  const attendanceSettingsQuery = useAttendancePeriodSettingsByGroups({
    month: selectedMonth,
    year: selectedYear,
    groups: visibleGroupKeys,
    enabled: visibleGroupKeys.length > 0 && hasAccess,
  });

  const groups = useMemo(() => {
    if (!hasAccess) return [];
    return buildRecapJoinedGroups({
      students: filteredStudents,
      month: selectedMonth,
      year: selectedYear,
      monthName: MONTH_NAMES[selectedMonth - 1],
      reports,
      attendance: attendanceQuery.data ?? [],
      attendanceSettings: attendanceSettingsQuery.data ?? [],
      getTeacherName: (userId) => (userId ? profileMap.get(userId) : undefined),
    });
  }, [
    attendanceQuery.data,
    attendanceSettingsQuery.data,
    filteredStudents,
    hasAccess,
    profileMap,
    reports,
    selectedMonth,
    selectedYear,
  ]);

  const teachersForClassRombel = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const studentMap = new Map(students.map((student) => [student.id, student]));

    allTeacherStudents.forEach((assignment) => {
      const student = studentMap.get(assignment.student_id);
      const teacherName = profileMap.get(assignment.teacher_id);
      if (!student || !teacherName) return;
      const key = `${student.kelas}-${student.rombel}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(teacherName);
    });

    const result = new Map<string, string[]>();
    map.forEach((names, key) => result.set(key, Array.from(names)));
    return result;
  }, [allTeacherStudents, profileMap, students]);

  const allRows = useMemo(() => {
    let rows = groups.flatMap((group) => group.rows);
    if (filterCategory !== "all") {
      rows = rows.filter((row) => {
        if (filterCategory === "Tahsin Dasar") {
          return row.level.startsWith("Iqro") || row.level === "Tahsin Dasar";
        }
        if (filterCategory === "Tahsin Lanjutan") return row.level === "Tahsin Lanjutan";
        if (filterCategory === "Tahfizh") return row.level === "Tahfizh";
        return true;
      });
    }
    if (filterStatus !== "all") {
      rows = rows.filter((row) => {
        if (filterStatus === "filled") return row.reportStatus === "filled";
        if (filterStatus === "empty") return row.reportStatus === "empty";
        if (filterStatus === "attention") {
          return (
            row.reportStatus === "filled" &&
            ((row.nilaiAkhirProgresif !== null && row.nilaiAkhirProgresif < 70) ||
              row.kategoriProgres === "Kurang Konsisten" ||
              row.kategoriProgres === "Tidak Konsisten")
          );
        }
        return true;
      });
    }
    return rows;
  }, [filterCategory, filterStatus, groups]);

  const stats = useMemo(() => {
    const baseRows = allRows;
    const total = baseRows.length;
    let tahsinDasar = 0;
    let tahsinLanjutan = 0;
    let tahfizh = 0;
    let latestProgress = 0;
    let emptyProgress = 0;
    let needsAttention = 0;

    baseRows.forEach((row) => {
      if (row.level === "Tahfizh") tahfizh++;
      else if (row.level === "Tahsin Lanjutan") tahsinLanjutan++;
      else if (row.level.startsWith("Iqro") || row.level === "Tahsin Dasar") tahsinDasar++;

      if (row.reportStatus === "filled") latestProgress++;
      else emptyProgress++;

      if (
        row.reportStatus === "filled" &&
        ((row.nilaiAkhirProgresif !== null && row.nilaiAkhirProgresif < 70) ||
          row.kategoriProgres === "Kurang Konsisten" ||
          row.kategoriProgres === "Tidak Konsisten")
      ) {
        needsAttention++;
      }
    });

    return {
      total,
      tahsinDasar,
      tahsinLanjutan,
      tahfizh,
      latestProgress,
      emptyProgress,
      needsAttention,
    };
  }, [allRows]);

  const actionStats = useMemo(() => {
    let below70 = 0;
    let stagnant = 0;
    const emptyRombels = new Set<string>();

    allRows.forEach((row) => {
      if (row.reportStatus === "filled") {
        if (row.nilaiAkhirProgresif !== null && row.nilaiAkhirProgresif < 70) below70++;
        if (
          row.kategoriProgres === "Stagnan" ||
          row.kategoriProgres === "Tidak Konsisten" ||
          row.kategoriProgres === "Kurang Konsisten"
        ) {
          stagnant++;
        }
      } else {
        emptyRombels.add(`${row.kelas}-${row.rombel}`);
      }
    });

    return {
      empty: stats.emptyProgress,
      attention: stats.needsAttention,
      below70,
      stagnant,
      emptyRombelsCount: emptyRombels.size,
    };
  }, [allRows, stats.emptyProgress, stats.needsAttention]);

  const rowsByGrade = useMemo(() => {
    const map: Record<number, RecapJoinedRow[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    allRows.forEach((row) => {
      if (map[row.kelas]) map[row.kelas].push(row);
    });
    return map;
  }, [allRows]);

  const gradeSummaries = useMemo(() => {
    return [1, 2, 3, 4, 5, 6]
      .map((grade) => {
        const gradeRows = rowsByGrade[grade] ?? [];
        if (gradeRows.length === 0) return null;

        const rombelMap = new Map<string, RecapJoinedRow[]>();
        gradeRows.forEach((row) => {
          const current = rombelMap.get(row.rombel) ?? [];
          current.push(row);
          rombelMap.set(row.rombel, current);
        });

        return {
          grade,
          rombels: Array.from(rombelMap.entries())
            .map(([rombel, rows]) => {
              let tahsinDasar = 0;
              let tahsinLanjutan = 0;
              let tahfizh = 0;
              let filled = 0;
              let empty = 0;
              let attention = 0;
              let totalScore = 0;
              let scoreCount = 0;

              rows.forEach((row) => {
                if (row.level.startsWith("Iqro") || row.level === "Tahsin Dasar") tahsinDasar++;
                else if (row.level === "Tahsin Lanjutan") tahsinLanjutan++;
                else if (row.level === "Tahfizh") tahfizh++;

                if (row.reportStatus === "filled") {
                  filled++;
                  if (row.nilaiAkhirProgresif !== null) {
                    totalScore += row.nilaiAkhirProgresif;
                    scoreCount++;
                  }
                  if (
                    (row.nilaiAkhirProgresif !== null && row.nilaiAkhirProgresif < 70) ||
                    row.kategoriProgres === "Kurang Konsisten" ||
                    row.kategoriProgres === "Tidak Konsisten"
                  ) {
                    attention++;
                  }
                } else {
                  empty++;
                }
              });

              return {
                rombel,
                total: rows.length,
                tahsinDasar,
                tahsinLanjutan,
                tahfizh,
                filled,
                empty,
                attention,
                avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
              };
            })
            .sort((a, b) => a.rombel.localeCompare(b.rombel)),
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
  }, [rowsByGrade]);

  const toggleRombelExpand = (key: string) => {
    setExpandedRombels((current) => ({ ...current, [key]: !current[key] }));
  };

  const past6MonthsKeys = useMemo(() => {
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      let month = selectedMonth - i;
      let year = selectedYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      keys.push({ month, year });
    }
    return keys;
  }, [selectedMonth, selectedYear]);

  const historicalStudentIds = useMemo(() => filteredStudents.map((student) => student.id), [filteredStudents]);

  const { data: historicalReports = [] } = useQuery({
    queryKey: ["historical-reports", historicalStudentIds, past6MonthsKeys],
    queryFn: async () => {
      if (historicalStudentIds.length === 0) return [];
      const conditions = past6MonthsKeys.map((key) => `and(month.eq.${key.month},year.eq.${key.year})`).join(",");
      const allData: Array<{ month: number; year: number; student_id: string; program_type: string | null }> = [];
      let from = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("monthly_reports")
          .select("month, year, student_id, program_type")
          .in("student_id", historicalStudentIds)
          .or(conditions)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        const batch = data ?? [];
        allData.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return allData;
    },
    enabled: hasAccess && historicalStudentIds.length > 0,
  });

  const lineChartData = useMemo(() => {
    return past6MonthsKeys.map((key) => {
      const label = `${MONTH_NAMES[key.month - 1].substring(0, 3)} ${String(key.year).slice(2)}`;
      const reportsForMonth = historicalReports.filter(
        (report) => report.month === key.month && report.year === key.year,
      );

      const seenStudents = new Set<string>();
      let tahsinDasar = 0;
      let tahsinLanjutan = 0;
      let tahfizh = 0;

      reportsForMonth.forEach((report) => {
        if (seenStudents.has(report.student_id)) return;
        seenStudents.add(report.student_id);
        const programType = report.program_type?.toLowerCase() ?? "";
        if (programType === "iqra" || programType === "tahsin dasar (iqra)") tahsinDasar++;
        else if (programType === "tahsin" || programType === "tahsin lanjutan") tahsinLanjutan++;
        else if (programType === "tahfizh") tahfizh++;
      });

      return {
        name: label,
        "Tahsin Dasar": tahsinDasar,
        "Tahsin Lanjutan": tahsinLanjutan,
        Tahfizh: tahfizh,
      };
    });
  }, [historicalReports, past6MonthsKeys]);

  const jenjangKelasRows = useMemo(() => {
    return groups
      .map((group) => {
        const key = `${group.kelas}-${group.rombel}`;
        const assignedTeachers = teachersForClassRombel.get(key) ?? [];
        const teacherMap = new Map<string, { total: number; td: number; tl: number; tfz: number }>();

        assignedTeachers.forEach((teacherName) => {
          teacherMap.set(teacherName, { total: 0, td: 0, tl: 0, tfz: 0 });
        });

        group.rows.forEach((row) => {
          const teacherName = normalizeTeacherNameForRow(
            row,
            assignedTeachers,
            studentAssignedTeachers.get(row.studentId) ?? [],
          );

          if (!teacherMap.has(teacherName)) {
            teacherMap.set(teacherName, { total: 0, td: 0, tl: 0, tfz: 0 });
          }

          const counts = teacherMap.get(teacherName)!;
          counts.total += 1;
          if (row.program === "Tahsin Dasar" || row.program === "Tahsin Dasar (Iqra)") counts.td += 1;
          else if (row.program === "Tahsin Lanjutan") counts.tl += 1;
          else if (row.program === "Tahfizh") counts.tfz += 1;
        });

        const prioritizedTeachers = [
          ...assignedTeachers.map((teacherName) => [teacherName, teacherMap.get(teacherName) ?? { total: 0, td: 0, tl: 0, tfz: 0 }] as const),
          ...Array.from(teacherMap.entries())
            .filter(([teacherName, counts]) => !assignedTeachers.includes(teacherName) && counts.total > 0)
            .sort((a, b) => b[1].total - a[1].total),
        ];

        if (prioritizedTeachers.length > 4) {
          let total = 0;
          let td = 0;
          let tl = 0;
          let tfz = 0;
          prioritizedTeachers.slice(3).forEach(([, counts]) => {
            total += counts.total;
            td += counts.td;
            tl += counts.tl;
            tfz += counts.tfz;
          });
          prioritizedTeachers.splice(3, prioritizedTeachers.length - 3, [
            "Guru Lainnya",
            { total, td, tl, tfz },
          ]);
        }

        return {
          kelas: group.kelas,
          rombel: group.rombel,
          originalRows: group.rows,
          teacher1: prioritizedTeachers[0] ?? null,
          teacher2: prioritizedTeachers[1] ?? null,
          teacher3: prioritizedTeachers[2] ?? null,
          teacher4: prioritizedTeachers[3] ?? null,
        };
      })
      .sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [groups, studentAssignedTeachers, teachersForClassRombel]);

  const teacherLoadRows = useMemo(() => {
    const map = new Map<string, TeacherLoadSummary>();

    groups.forEach((group) => {
      const assignedTeachers = teachersForClassRombel.get(`${group.kelas}-${group.rombel}`) ?? [];
      group.rows.forEach((row) => {
        const teacherName = normalizeTeacherNameForRow(
          row,
          assignedTeachers,
          studentAssignedTeachers.get(row.studentId) ?? [],
        );
        const teacherId = getTeacherLoadKey(teacherName);
        if (!map.has(teacherId)) {
          map.set(teacherId, {
            teacherId,
            teacherName,
            TD: 0,
            TL: 0,
            TFZ: 0,
            total: 0,
            tdPercent: 0,
          });
        }
        const summary = map.get(teacherId)!;
        summary.total += 1;
        if (row.program === "Tahsin Dasar" || row.program === "Tahsin Dasar (Iqra)") summary.TD += 1;
        else if (row.program === "Tahsin Lanjutan") summary.TL += 1;
        else if (row.program === "Tahfizh") summary.TFZ += 1;
      });
    });

    return Array.from(map.values())
      .map((summary) => ({
        ...summary,
        tdPercent: summary.total > 0 ? (summary.TD / summary.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total || a.teacherName.localeCompare(b.teacherName));
  }, [groups, studentAssignedTeachers, teachersForClassRombel]);

  const currentTeacherLoads = useMemo(() => {
    if (filterTeacher === "all") return teacherLoadRows;
    return teacherLoadRows.filter((row) => row.teacherName === filterTeacher);
  }, [filterTeacher, teacherLoadRows]);

  const { data: previousTeacherLoadReportsForPeriod = [], isLoading: teacherLoadLoading } = useQuery({
    queryKey: ["teacher-load-previous-reports", previousLoadPeriod.month, previousLoadPeriod.year],
    queryFn: async () => {
      const allData: TeacherLoadReportRow[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("monthly_reports")
          .select("student_id, teacher_id, teacher_name, teacher_id_snapshot, teacher_name_snapshot, program_type, month, year")
          .eq("month", previousLoadPeriod.month)
          .eq("year", previousLoadPeriod.year)
          .order("id", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        const batch = (data ?? []) as TeacherLoadReportRow[];
        allData.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return allData;
    },
    enabled: hasAccess,
  });

  const previousTeacherLoadReports = useMemo(
    () =>
      previousTeacherLoadReportsForPeriod.filter((report) => teacherLoadStudentIdSet.has(report.student_id)),
    [previousTeacherLoadReportsForPeriod, teacherLoadStudentIdSet],
  );

  const previousTeacherLoads = useMemo(() => {
    const rows = buildTeacherLoadSummaries(previousTeacherLoadReports);
    if (filterTeacher === "all") return rows;
    return rows.filter((row) => row.teacherName === filterTeacher);
  }, [filterTeacher, previousTeacherLoadReports]);

  const teacherLoadTotals = useMemo(() => {
    const total = currentTeacherLoads.reduce(
      (acc, item) => ({
        total: acc.total + item.total,
        TD: acc.TD + item.TD,
        TL: acc.TL + item.TL,
        TFZ: acc.TFZ + item.TFZ,
      }),
      { total: 0, TD: 0, TL: 0, TFZ: 0 },
    );
    return {
      ...total,
      tdPercent: total.total > 0 ? (total.TD / total.total) * 100 : 0,
      tlPercent: total.total > 0 ? (total.TL / total.total) * 100 : 0,
      tfzPercent: total.total > 0 ? (total.TFZ / total.total) * 100 : 0,
    };
  }, [currentTeacherLoads]);

  const teacherLoadChartData = useMemo(() => {
    if (teacherLoadChartLimit === "all") return currentTeacherLoads;
    return currentTeacherLoads.slice(0, Number(teacherLoadChartLimit));
  }, [currentTeacherLoads, teacherLoadChartLimit]);

  const dominantTdTeachers = useMemo(
    () => currentTeacherLoads.filter((teacher) => teacher.tdPercent >= 80),
    [currentTeacherLoads],
  );

  const teacherLoadChartLimitLabel = useMemo(() => {
    if (teacherLoadChartLimit === "all") return "semua guru";
    return `${teacherLoadChartData.length} guru teratas`;
  }, [teacherLoadChartData.length, teacherLoadChartLimit]);

  const teacherLoadComparisonRows = useMemo(() => {
    const previousMap = new Map(previousTeacherLoads.map((item) => [item.teacherId, item]));
    const currentMap = new Map(currentTeacherLoads.map((item) => [item.teacherId, item]));
    const ids = Array.from(new Set([...previousMap.keys(), ...currentMap.keys()]));

    return ids
      .map((id) => {
        const current = currentMap.get(id);
        const previous = previousMap.get(id);
        const tdDelta = (current?.TD ?? 0) - (previous?.TD ?? 0);
        const tlDelta = (current?.TL ?? 0) - (previous?.TL ?? 0);

        let status = "Tetap";
        let statusClassName = "bg-muted text-foreground border-border";
        if (tdDelta > 2) {
          status = "TD Naik";
          statusClassName = "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40";
        } else if (tlDelta > 2) {
          status = "TL Naik";
          statusClassName = "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40";
        }

        return {
          teacherId: id,
          teacherName: current?.teacherName ?? previous?.teacherName ?? "Tidak Diketahui",
          previousTD: previous?.TD ?? 0,
          currentTD: current?.TD ?? 0,
          tdDelta,
          previousTL: previous?.TL ?? 0,
          currentTL: current?.TL ?? 0,
          tlDelta,
          status,
          statusClassName,
        };
      })
      .sort(
        (a, b) =>
          b.currentTD + b.currentTL - (a.currentTD + a.currentTL) ||
          a.teacherName.localeCompare(b.teacherName),
      );
  }, [currentTeacherLoads, previousTeacherLoads]);

  const teacherOverviewRows = useMemo(() => {
    const summaryMap = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        studentCount: number;
        reportFilled: number;
        reportEmpty: number;
        totalProgress: number;
        progressCount: number;
        classKeys: Set<string>;
      }
    >();

    groups.forEach((group) => {
      const assignedTeachers = teachersForClassRombel.get(`${group.kelas}-${group.rombel}`) ?? [];
      group.rows.forEach((row) => {
        const teacherName = normalizeTeacherNameForRow(
          row,
          assignedTeachers,
          studentAssignedTeachers.get(row.studentId) ?? [],
        );
        const teacherId = getTeacherLoadKey(teacherName);

        if (!summaryMap.has(teacherId)) {
          summaryMap.set(teacherId, {
            teacherId,
            teacherName,
            studentCount: 0,
            reportFilled: 0,
            reportEmpty: 0,
            totalProgress: 0,
            progressCount: 0,
            classKeys: new Set<string>(),
          });
        }

        const summary = summaryMap.get(teacherId)!;
        summary.studentCount += 1;
        summary.classKeys.add(`${group.kelas}-${group.rombel}`);
        if (row.reportStatus === "filled") {
          summary.reportFilled += 1;
          if (row.nilaiAkhirProgresif !== null) {
            summary.totalProgress += row.nilaiAkhirProgresif;
            summary.progressCount += 1;
          }
        } else {
          summary.reportEmpty += 1;
        }
      });
    });

    const rows = Array.from(summaryMap.values()).map((summary) => ({
      teacherId: summary.teacherId,
      teacherName: summary.teacherName,
      studentCount: summary.studentCount,
      classCount: summary.classKeys.size,
      reportFilled: summary.reportFilled,
      reportEmpty: summary.reportEmpty,
      avgProgress: summary.progressCount > 0 ? Math.round(summary.totalProgress / summary.progressCount) : null,
      loadStatus: "Seimbang",
      loadStatusClassName: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
    }));

    const averageLoad = rows.length > 0 ? rows.reduce((sum, row) => sum + row.studentCount, 0) / rows.length : 0;
    const highThreshold = Math.max(1, averageLoad * 1.25);
    const lowThreshold = Math.max(1, averageLoad * 0.75);

    return rows
      .map((row) => {
        if (row.studentCount > highThreshold) {
          return {
            ...row,
            loadStatus: "Terlalu Tinggi",
            loadStatusClassName: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40",
          };
        }
        if (row.studentCount < lowThreshold) {
          return {
            ...row,
            loadStatus: "Terlalu Rendah",
            loadStatusClassName: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40",
          };
        }
        return row;
      })
      .sort((a, b) => b.studentCount - a.studentCount || a.teacherName.localeCompare(b.teacherName));
  }, [groups, studentAssignedTeachers, teachersForClassRombel]);

  const orphanStudents = useMemo(() => {
    return baseFilteredStudents
      .filter((student) => (studentAssignedTeachers.get(student.id) ?? []).length === 0)
      .map((student) => ({
        id: student.id,
        nama: student.nama,
        kelas: student.kelas,
        rombel: student.rombel,
        level: student.level,
      }))
      .sort(
        (a, b) =>
          a.kelas - b.kelas || a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama),
      );
  }, [baseFilteredStudents, studentAssignedTeachers]);

  const getStatusColor = (kategori: string | null, nilai: number | null) => {
    if (nilai !== null && nilai < 70) {
      return "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/40";
    }
    if (kategori === "Konsisten & Progresif" || kategori === "Ada Progres") {
      return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40";
    }
    if (kategori === "Kurang Konsisten" || kategori === "Tidak Konsisten") {
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40";
    }
    return "bg-muted text-foreground border-border dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/40";
  };

  const handleResetFilters = () => {
    setFilterSemester(initialSemester);
    setFilterMonth(String(currentMonthIdx + 1));
    setFilterYear(String(now.getFullYear()));
    setFilterKelas("all");
    setFilterRombel("all");
    setFilterTeacher("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setSearch("");
  };

  const isFilterActive = useMemo(
    () =>
      filterSemester !== initialSemester ||
      filterMonth !== String(currentMonthIdx + 1) ||
      filterYear !== String(now.getFullYear()) ||
      filterKelas !== "all" ||
      filterRombel !== "all" ||
      filterTeacher !== "all" ||
      filterCategory !== "all" ||
      filterStatus !== "all" ||
      search.trim() !== "",
    [
      filterCategory,
      filterKelas,
      filterMonth,
      filterRombel,
      filterSemester,
      filterStatus,
      filterTeacher,
      filterYear,
      search,
    ],
  );

  if (ls || lr || (isTeacher && la)) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Memuat data monitoring...</p>
        </div>
      </div>
    );
  }

  if (isTeacher && !hasAccess) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center px-4 bg-background">
        <ShieldCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Akses Terbatas</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          Kamu belum diberi akses. Silakan ajukan siswa ke Koordinator Tahfizh.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto space-y-6 pb-20 pt-6 sm:pb-8"
      style={{ zoom: 0.8 }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-900 p-6 md:p-8 text-white shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ClipboardList className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30">
                Dashboard
              </Badge>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-100 border-amber-400/30 hover:bg-amber-500/30">
                SDIT Luqmanul Hakim
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monitoring Tahsin & Tahfizh</h1>
            <p className="mt-2 text-sm text-emerald-100 max-w-xl leading-relaxed">
              Pantau capaian siswa dan beban guru dari sumber data yang sama dengan rekap laporan bulanan.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm">
              Tahun Ajaran {filterYear}/{Number(filterYear) + 1}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
      </div>

      <Card className="border border-border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semester</label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="ganjil">Ganjil (Jul - Des)</SelectItem>
                  <SelectItem value="genap">Genap (Jan - Jun)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tahun</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}/{year + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bulan</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kelas</label>
              <Select
                value={filterKelas}
                onValueChange={(value) => {
                  setFilterKelas(value);
                  setFilterRombel("all");
                  setFilterTeacher("all");
                }}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {availableClasses.map((kelas) => (
                    <SelectItem key={kelas} value={String(kelas)}>
                      Kelas {kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rombel</label>
              <Select
                value={filterRombel}
                onValueChange={(value) => {
                  setFilterRombel(value);
                  setFilterTeacher("all");
                }}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Rombel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rombel</SelectItem>
                  {availableRombels.map((rombel) => (
                    <SelectItem key={rombel} value={rombel}>
                      {rombel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guru</label>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Guru</SelectItem>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher} value={teacher}>
                      {teacher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Tahsin Dasar">Tahsin Dasar</SelectItem>
                  <SelectItem value="Tahsin Lanjutan">Tahsin Lanjutan</SelectItem>
                  <SelectItem value="Tahfizh">Tahfizh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Laporan</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="filled">Sudah Diisi</SelectItem>
                  <SelectItem value="empty">Belum Diisi</SelectItem>
                  <SelectItem value="attention">Perlu Perhatian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari siswa / rombel..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 h-10 w-full md:max-w-md"
              />
            </div>
            {isFilterActive && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 self-start sm:self-center"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl bg-muted/50 p-1 sm:grid-cols-2">
          <TabsTrigger value="siswa" className="h-11 rounded-xl text-sm font-semibold">
            Monitoring Siswa
          </TabsTrigger>
          <TabsTrigger value="guru" className="h-11 rounded-xl text-sm font-semibold">
            Beban & Perkembangan Guru
          </TabsTrigger>
        </TabsList>

        <TabsContent value="siswa" className="space-y-6">
          {attendanceQuery.isLoading || attendanceSettingsQuery.isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          ) : (
            <MonitoringSiswa
              stats={stats}
              actionStats={actionStats}
              filterKelas={filterKelas}
              setFilterKelas={setFilterKelas}
              setFilterRombel={setFilterRombel}
              lineChartData={lineChartData}
              jenjangKelasRows={jenjangKelasRows}
              expandedRombels={expandedRombels}
              toggleRombelExpand={toggleRombelExpand}
              getStatusColor={getStatusColor}
              showAllJenjang={showAllJenjang}
              setShowAllJenjang={setShowAllJenjang}
              tableScrollRef={tableScrollRef}
              tableContentRef={tableContentRef}
            />
          )}
        </TabsContent>

        <TabsContent value="guru" className="space-y-6">
          <MonitoringGuru
            teacherLoadLoading={teacherLoadLoading}
            selectedPeriodLabel={getMonthLabel(selectedMonth, selectedYear)}
            previousPeriodLabel={getMonthLabel(previousLoadPeriod.month, previousLoadPeriod.year)}
            teacherLoadTotals={teacherLoadTotals}
            currentTeacherLoads={currentTeacherLoads}
            dominantTdTeachers={dominantTdTeachers}
            teacherLoadChartLimit={teacherLoadChartLimit}
            setTeacherLoadChartLimit={setTeacherLoadChartLimit}
            teacherLoadChartLimitLabel={teacherLoadChartLimitLabel}
            teacherLoadChartData={teacherLoadChartData}
            teacherLoadComparisonRows={teacherLoadComparisonRows}
            teacherOverviewRows={teacherOverviewRows}
            orphanStudents={orphanStudents}
            formatPercent={formatPercent}
            teacherFilterLabel={filterTeacher === "all" ? "Semua guru aktif" : filterTeacher}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
