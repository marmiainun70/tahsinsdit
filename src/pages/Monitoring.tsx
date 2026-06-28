import { useState, useMemo, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import { useStudents } from "@/hooks/useSupabaseData";
import {
  useMonthlyReportsForPeriod,
  MONTH_NAMES,
} from "@/hooks/useMonthlyReports";
import {
  useAttendanceForRecapPeriod,
  useAttendancePeriodSettingsByGroups,
} from "@/hooks/useAttendance";
import { useProfileMap } from "@/hooks/useProfiles";
import {
  buildRecapJoinedGroups,
  type RecapJoinedRow,
} from "@/utils/recapMonthlyReportRows";
import { useTeacherClasses } from "@/hooks/useTeacherStudents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  ClipboardList,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const now = new Date();
const currentMonthIdx = now.getMonth();
const initialSemester = currentMonthIdx >= 6 ? "ganjil" : "genap";
const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function Monitoring() {
  const { user, profile } = useAuth();
  const isTeacher = isTeacherRole(profile?.role);

  const { data: students = [], isLoading: ls } = useStudents();

  const [filterSemester, setFilterSemester] = useState<string>(initialSemester);
  const [filterMonth, setFilterMonth] = useState<string>(
    String(currentMonthIdx + 1),
  );
  const [filterYear, setFilterYear] = useState<string>(
    String(now.getFullYear()),
  );
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedRombels, setExpandedRombels] = useState<Record<string, boolean>>({});

  const selectedMonth = Number(filterMonth);
  const selectedYear = Number(filterYear);

  // Sync Month with Semester when Semester changes
  useEffect(() => {
    const m = Number(filterMonth);
    if (filterSemester === "ganjil" && (m < 7 || m > 12)) {
      setFilterMonth("7");
    } else if (filterSemester === "genap" && (m < 1 || m > 6)) {
      setFilterMonth("1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSemester]);

  const { data: assignments = [], isLoading: la } = useTeacherClasses(user?.id);
  const { data: allAssignments = [] } = useTeacherClasses();

  const hasAccess = useMemo(() => {
    if (!isTeacher) return true;
    return assignments.length > 0;
  }, [isTeacher, assignments]);

  const { data: reports = [], isLoading: lr } = useMonthlyReportsForPeriod({
    month: selectedMonth,
    year: selectedYear,
    enabled: hasAccess,
  });

  const profileMap = useProfileMap();

  const availableClasses = useMemo(() => {
    if (!isTeacher) {
      return Array.from(new Set(students.map((s) => s.kelas))).sort(
        (a, b) => a - b,
      );
    }
    return Array.from(new Set(assignments.map((a) => a.kelas))).sort(
      (a, b) => a - b,
    );
  }, [isTeacher, students, assignments]);

  const availableRombels = useMemo(() => {
    let filtered = isTeacher
      ? students.filter((s) =>
          assignments.some((a) => a.kelas === s.kelas && a.rombel === s.rombel),
        )
      : students;

    if (filterKelas !== "all") {
      filtered = filtered.filter((s) => s.kelas === Number(filterKelas));
    }

    return Array.from(new Set(filtered.map((s) => s.rombel))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [isTeacher, students, assignments, filterKelas]);

  const availableMonths = useMemo(() => {
    if (filterSemester === "ganjil") {
      return MONTH_NAMES.map((name, i) => ({
        value: String(i + 1),
        label: name,
      })).slice(6);
    }
    if (filterSemester === "genap") {
      return MONTH_NAMES.map((name, i) => ({
        value: String(i + 1),
        label: name,
      })).slice(0, 6);
    }
    return MONTH_NAMES.map((name, i) => ({
      value: String(i + 1),
      label: name,
    }));
  }, [filterSemester]);

  const filteredStudents = useMemo(() => {
    let s = students;
    if (isTeacher) {
      s = s.filter((st) =>
        assignments.some((a) => a.kelas === st.kelas && a.rombel === st.rombel),
      );
    }
    if (filterKelas !== "all")
      s = s.filter((st) => st.kelas === Number(filterKelas));
    if (filterRombel !== "all")
      s = s.filter((st) => st.rombel === filterRombel);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter((st) => st.nama.toLowerCase().includes(q));
    }
    return s.sort(
      (a, b) =>
        a.kelas - b.kelas ||
        a.rombel.localeCompare(b.rombel) ||
        a.nama.localeCompare(b.nama),
    );
  }, [students, isTeacher, assignments, filterKelas, filterRombel, search]);

  const visibleGroupKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredStudents.forEach((s) => keys.add(`${s.kelas}-${s.rombel}`));
    return Array.from(keys).map((k) => {
      const [kelas, rombel] = k.split("-");
      return { kelas: Number(kelas), rombel };
    });
  }, [filteredStudents]);

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
    hasAccess,
    filteredStudents,
    selectedMonth,
    selectedYear,
    reports,
    attendanceQuery.data,
    attendanceSettingsQuery.data,
    profileMap,
  ]);

  const allRows = useMemo(() => {
    let rows = groups.flatMap((g) => g.rows);
    if (filterCategory !== "all") {
      rows = rows.filter((r) => {
        if (filterCategory === "Tahsin Dasar")
          return r.level.startsWith("Iqro") || r.level === "Tahsin Dasar";
        if (filterCategory === "Tahsin Lanjutan")
          return r.level === "Tahsin Lanjutan";
        if (filterCategory === "Tahfizh") return r.level === "Tahfizh";
        return true;
      });
    }
    if (filterStatus !== "all") {
      rows = rows.filter((r) => {
        if (filterStatus === "filled") return r.reportStatus === "filled";
        if (filterStatus === "empty") return r.reportStatus === "empty";
        if (filterStatus === "attention") {
          return (
            r.reportStatus === "filled" &&
            ((r.nilaiAkhirProgresif !== null && r.nilaiAkhirProgresif < 70) ||
              r.kategoriProgres === "Kurang Konsisten" ||
              r.kategoriProgres === "Tidak Konsisten")
          );
        }
        return true;
      });
    }
    return rows;
  }, [groups, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    let baseRows = groups.flatMap((g) => g.rows);
    if (filterCategory !== "all") {
      baseRows = baseRows.filter((r) => {
        if (filterCategory === "Tahsin Dasar")
          return r.level.startsWith("Iqro") || r.level === "Tahsin Dasar";
        if (filterCategory === "Tahsin Lanjutan")
          return r.level === "Tahsin Lanjutan";
        if (filterCategory === "Tahfizh") return r.level === "Tahfizh";
        return true;
      });
    }

    const total = baseRows.length;
    let tahsinDasar = 0;
    let tahsinLanjutan = 0;
    let tahfizh = 0;
    let latestProgress = 0;
    let emptyProgress = 0;
    let needsAttention = 0;

    baseRows.forEach((r) => {
      if (r.level === "Tahfizh") tahfizh++;
      else if (r.level === "Tahsin Lanjutan") tahsinLanjutan++;
      else if (r.level.startsWith("Iqro") || r.level === "Tahsin Dasar")
        tahsinDasar++;

      if (r.reportStatus === "filled") latestProgress++;
      else emptyProgress++;

      if (r.reportStatus === "filled") {
        if (
          (r.nilaiAkhirProgresif !== null && r.nilaiAkhirProgresif < 70) ||
          r.kategoriProgres === "Kurang Konsisten" ||
          r.kategoriProgres === "Tidak Konsisten"
        ) {
          needsAttention++;
        }
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
  }, [groups, filterCategory]);

  const handleResetFilters = () => {
    setFilterSemester(initialSemester);
    setFilterMonth(String(currentMonthIdx + 1));
    setFilterYear(String(now.getFullYear()));
    setFilterKelas("all");
    setFilterRombel("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setSearch("");
  };

  const isFilterActive = useMemo(() => {
    return (
      filterSemester !== initialSemester ||
      filterMonth !== String(currentMonthIdx + 1) ||
      filterYear !== String(now.getFullYear()) ||
      filterKelas !== "all" ||
      filterRombel !== "all" ||
      filterCategory !== "all" ||
      filterStatus !== "all" ||
      search.trim() !== ""
    );
  }, [
    filterSemester,
    filterMonth,
    filterYear,
    filterKelas,
    filterRombel,
    filterCategory,
    filterStatus,
    search,
  ]);

  const rowsByGrade = useMemo(() => {
    const map: Record<number, typeof allRows> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const r of allRows) {
      if (map[r.kelas]) {
        map[r.kelas].push(r);
      }
    }
    return map;
  }, [allRows]);

  const gradeSummaries = useMemo(() => {
    const summaries = [];
    for (const g of [1, 2, 3, 4, 5, 6]) {
      const gradeRows = rowsByGrade[g] || [];
      if (gradeRows.length === 0) continue;

      const total = gradeRows.length;
      let tahsinDasar = 0;
      let tahsinLanjutan = 0;
      let tahfizh = 0;
      let filled = 0;
      let empty = 0;
      let attention = 0;
      let totalScore = 0;
      let scoredCount = 0;

      const rombelMap: Record<string, typeof gradeRows> = {};
      gradeRows.forEach((r) => {
        const rb = r.rombel || "-";
        if (!rombelMap[rb]) rombelMap[rb] = [];
        rombelMap[rb].push(r);
      });

      const rombelSummaries = Object.keys(rombelMap)
        .sort()
        .map((rb) => {
          const rRows = rombelMap[rb];
          let rTahsinDasar = 0;
          let rTahsinLanjutan = 0;
          let rTahfizh = 0;
          let rFilled = 0;
          let rEmpty = 0;
          let rAttention = 0;
          let rTotalScore = 0;
          let rScoredCount = 0;

          rRows.forEach((r) => {
            if (r.level.startsWith("Iqro") || r.level === "Tahsin Dasar") {
              tahsinDasar++;
              rTahsinDasar++;
            } else if (r.level === "Tahsin Lanjutan") {
              tahsinLanjutan++;
              rTahsinLanjutan++;
            } else if (r.level === "Tahfizh") {
              tahfizh++;
              rTahfizh++;
            }

            if (r.reportStatus === "filled") {
              filled++;
              rFilled++;
              if (r.nilaiAkhirProgresif !== null) {
                totalScore += r.nilaiAkhirProgresif;
                scoredCount++;
                rTotalScore += r.nilaiAkhirProgresif;
                rScoredCount++;
              }
              const needsAttention =
                (r.nilaiAkhirProgresif !== null &&
                  r.nilaiAkhirProgresif < 70) ||
                r.kategoriProgres === "Kurang Konsisten" ||
                r.kategoriProgres === "Tidak Konsisten";
              if (needsAttention) {
                attention++;
                rAttention++;
              }
            } else {
              empty++;
              rEmpty++;
            }
          });

          return {
            rombel: rb,
            total: rRows.length,
            tahsinDasar: rTahsinDasar,
            tahsinLanjutan: rTahsinLanjutan,
            tahfizh: rTahfizh,
            filled: rFilled,
            empty: rEmpty,
            attention: rAttention,
            avgScore:
              rScoredCount > 0 ? Math.round(rTotalScore / rScoredCount) : null,
          };
        });

      const avgScore =
        scoredCount > 0 ? Math.round(totalScore / scoredCount) : null;

      summaries.push({
        grade: g,
        total,
        tahsinDasar,
        tahsinLanjutan,
        tahfizh,
        filled,
        empty,
        attention,
        avgScore,
        rombels: rombelSummaries,
      });
    }
    return summaries;
  }, [rowsByGrade]);

  const toggleRombelExpand = (key: string) => {
    setExpandedRombels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const teachersForClassRombel = useMemo(() => {
    const map = new Map<string, string[]>();
    allAssignments.forEach((tc) => {
      const key = `${tc.kelas}-${tc.rombel}`;
      const name = profileMap.get(tc.teacher_id);
      if (name) {
        if (!map.has(key)) map.set(key, []);
        const list = map.get(key)!;
        if (!list.includes(name)) {
          list.push(name);
        }
      }
    });
    return map;
  }, [allAssignments, profileMap]);

  const actionStats = useMemo(() => {
    let below70 = 0;
    let stagnant = 0;
    const emptyRombels = new Set<string>();

    allRows.forEach((r) => {
      if (r.reportStatus === "filled") {
        if (r.nilaiAkhirProgresif !== null && r.nilaiAkhirProgresif < 70) {
          below70++;
        }
        if (
          r.kategoriProgres === "Stagnan" ||
          r.kategoriProgres === "Tidak Konsisten" ||
          r.kategoriProgres === "Kurang Konsisten"
        ) {
          stagnant++;
        }
      } else {
        emptyRombels.add(`${r.kelas}-${r.rombel}`);
      }
    });

    return {
      empty: stats.emptyProgress,
      attention: stats.needsAttention,
      below70,
      stagnant,
      emptyRombelsCount: emptyRombels.size,
    };
  }, [allRows, stats]);

  const barChartData = useMemo(() => {
    const data = [];
    for (let g = 1; g <= 6; g++) {
      const total = rowsByGrade[g]?.length || 0;
      data.push({ name: `Kelas ${g}`, "Jumlah Siswa": total });
    }
    return data;
  }, [rowsByGrade]);

  const past6MonthsKeys = useMemo(() => {
    const list = [];
    const monthOffset = 5;
    for (let i = monthOffset; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      list.push({ month: m, year: y });
    }
    return list;
  }, [selectedMonth, selectedYear]);

  const historicalStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);

  const { data: historicalReports = [] } = useQuery({
    queryKey: ['historical-reports', historicalStudentIds, past6MonthsKeys],
    queryFn: async () => {
      if (historicalStudentIds.length === 0) return [];
      
      const conditions = past6MonthsKeys.map(k => `and(month.eq.${k.month},year.eq.${k.year})`).join(',');
      
      const { data, error } = await supabase
        .from('monthly_reports')
        .select('month, year, student_id')
        .in('student_id', historicalStudentIds)
        .or(conditions);
        
      if (error) throw error;
      return data || [];
    },
    enabled: hasAccess && historicalStudentIds.length > 0
  });

  const lineChartData = useMemo(() => {
    return past6MonthsKeys.map((k) => {
      const monthName = MONTH_NAMES[k.month - 1].substring(0, 3);
      const label = `${monthName} ${String(k.year).substring(2)}`;
      
      if (historicalStudentIds.length === 0) {
        return { name: label, "Kelengkapan Data (%)": 0, "Siswa Dilaporkan": 0 };
      }
      
      const reportsForMonth = historicalReports.filter(r => r.month === k.month && r.year === k.year);
      const uniqueStudentReports = new Set(reportsForMonth.map(r => r.student_id)).size;
      const percent = Math.round((uniqueStudentReports / historicalStudentIds.length) * 100);
      
      return {
        name: label,
        "Kelengkapan Data (%)": percent,
        "Siswa Dilaporkan": uniqueStudentReports
      };
    });
  }, [past6MonthsKeys, historicalReports, historicalStudentIds]);

  const rombelRows = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowsList: any[] = [];
    gradeSummaries.forEach((gs) => {
      gs.rombels.forEach((rs) => {
        const teacherNames =
          teachersForClassRombel.get(`${gs.grade}-${rs.rombel}`) || [];
        rowsList.push({
          kelas: gs.grade,
          rombel: rs.rombel,
          guruPengampu: teacherNames.join(", ") || "-",
          total: rs.total,
          tahsinDasar: rs.tahsinDasar,
          tahsinDasarPercent:
            rs.total > 0 ? Math.round((rs.tahsinDasar / rs.total) * 100) : 0,
          tahsinLanjutan: rs.tahsinLanjutan,
          tahsinLanjutanPercent:
            rs.total > 0 ? Math.round((rs.tahsinLanjutan / rs.total) * 100) : 0,
          tahfizh: rs.tahfizh,
          tahfizhPercent:
            rs.total > 0 ? Math.round((rs.tahfizh / rs.total) * 100) : 0,
          filled: rs.filled,
          filledPercent:
            rs.total > 0 ? Math.round((rs.filled / rs.total) * 100) : 0,
          empty: rs.empty,
          emptyPercent:
            rs.total > 0 ? Math.round((rs.empty / rs.total) * 100) : 0,
          attention: rs.attention,
          attentionPercent:
            rs.total > 0 ? Math.round((rs.attention / rs.total) * 100) : 0,
          avgScore: rs.avgScore,
          originalRows: rs.rows,
        });
      });
    });
    return rowsList.sort(
      (a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel),
    );
  }, [gradeSummaries, teachersForClassRombel]);

  const jenjangKelasRows = useMemo(() => {
    return groups.map((g) => {
      const map = new Map<
        string,
        { total: number; td: number; tl: number; tfz: number }
      >();
      
      const assigned = teachersForClassRombel.get(`${g.kelas}-${g.rombel}`) || [];
      const t1Name = assigned[0] || null;
      const t2Name = assigned[1] || null;

      if (t1Name) map.set(t1Name, { total: 0, td: 0, tl: 0, tfz: 0 });
      if (t2Name) map.set(t2Name, { total: 0, td: 0, tl: 0, tfz: 0 });

      g.rows.forEach((r) => {
        let teacher = r.guru && r.guru !== "-" ? r.guru : "Tidak Diketahui";
        
        // Force assignment if only 1 teacher is official
        if (assigned.length === 1 && t1Name) {
           teacher = t1Name;
        } else if (assigned.length > 1) {
           // Attempt fuzzy matching for 2-teacher classes in case of slight typo
           if (t1Name && teacher.toLowerCase().includes(t1Name.toLowerCase().split(' ')[0])) {
               teacher = t1Name;
           } else if (t2Name && teacher.toLowerCase().includes(t2Name.toLowerCase().split(' ')[0])) {
               teacher = t2Name;
           }
        }

        if (!map.has(teacher)) {
          map.set(teacher, { total: 0, td: 0, tl: 0, tfz: 0 });
        }
        const counts = map.get(teacher)!;
        counts.total++;
        if (r.program === "Tahsin Dasar" || r.program === "Tahsin Dasar (Iqra)") {
          counts.td++;
        } else if (r.program === "Tahsin Lanjutan") {
          counts.tl++;
        } else if (r.program === "Tahfizh") {
          counts.tfz++;
        }
      });

      let teacher1 = null;
      let teacher2 = null;

      if (assigned.length > 0) {
        teacher1 = t1Name ? [t1Name, map.get(t1Name)!] : null;
        teacher2 = t2Name ? [t2Name, map.get(t2Name)!] : null;
      } else {
        const sortedTeachers = Array.from(map.entries()).sort(
          (a, b) => b[1].total - a[1].total,
        );
        teacher1 = sortedTeachers[0] || null;
        teacher2 = sortedTeachers[1] || null;
      }

      return {
        kelas: g.kelas,
        rombel: g.rombel,
        originalRows: g.rows,
        // @ts-expect-error generic tuple
        teacher1,
        // @ts-expect-error generic tuple
        teacher2,
      };
    }).sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [groups, teachersForClassRombel]);


  const selectedRombelRows = useMemo(() => {
    if (filterKelas === "all" || filterRombel === "all") return [];
    return allRows.filter(
      (r) => String(r.kelas) === filterKelas && r.rombel === filterRombel,
    );
  }, [allRows, filterKelas, filterRombel]);

  const teacherSummaries = useMemo(() => {
    if (selectedRombelRows.length === 0) return [];

    const map = new Map<string, typeof selectedRombelRows>();
    selectedRombelRows.forEach((r) => {
      const teacher = r.guru && r.guru !== "-" ? r.guru : "Tidak Diketahui";
      if (!map.has(teacher)) map.set(teacher, []);
      map.get(teacher)!.push(r);
    });

    return Array.from(map.entries()).map(([teacher, rows]) => {
      let tahsinDasar = 0;
      let tahsinLanjutan = 0;
      let tahfizh = 0;
      let filled = 0;
      let empty = 0;
      let attention = 0;
      let totalNilai = 0;
      let countNilai = 0;
      let totalPersentaseHadir = 0;
      let countHadir = 0;

      rows.forEach((r) => {
        if (
          r.program === "Tahsin Dasar" ||
          r.program === "Tahsin Dasar (Iqra)"
        ) {
          tahsinDasar++;
        } else if (r.program === "Tahsin Lanjutan") {
          tahsinLanjutan++;
        } else if (r.program === "Tahfizh") {
          tahfizh++;
        }

        if (r.reportStatus === "filled") {
          filled++;
          if (r.nilaiAkhirProgresif !== null) {
            totalNilai += r.nilaiAkhirProgresif;
            countNilai++;
          }
          if (
            (r.nilaiAkhirProgresif !== null && r.nilaiAkhirProgresif < 70) ||
            r.kategoriProgres === "Kurang Konsisten" ||
            r.kategoriProgres === "Tidak Konsisten" ||
            r.kategoriProgres === "Stagnan"
          ) {
            attention++;
          }
        } else {
          empty++;
        }

        if (r.persentaseHadir !== null) {
          totalPersentaseHadir += r.persentaseHadir;
          countHadir++;
        }
      });

      const avgScore =
        countNilai > 0 ? Math.round(totalNilai / countNilai) : null;
      const avgHadir =
        countHadir > 0 ? Math.round(totalPersentaseHadir / countHadir) : null;
      const filledPercent =
        rows.length > 0 ? Math.round((filled / rows.length) * 100) : 0;

      return {
        guru: teacher,
        total: rows.length,
        tahsinDasar,
        tahsinLanjutan,
        tahfizh,
        filled,
        filledPercent,
        empty,
        attention,
        avgScore,
        avgHadir,
      };
    });
  }, [selectedRombelRows]);

  const getStatusColor = (kategori: string | null, nilai: number | null) => {
    if (nilai !== null && nilai < 70)
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40";
    if (kategori === "Konsisten & Progresif" || kategori === "Ada Progres")
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40";
    if (kategori === "Kurang Konsisten" || kategori === "Tidak Konsisten")
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/40";
    return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/40";
  };

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
    >
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-900 p-6 md:p-8 text-white shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ClipboardList className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30">Dashboard</Badge>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-100 border-amber-400/30 hover:bg-amber-500/30">SDIT Luqmanul Hakim</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              Monitoring Tahsin & Tahfizh
            </h1>
            <p className="mt-2 text-sm text-emerald-100 max-w-xl leading-relaxed">
              Pantau capaian Tahsin & Tahfizh siswa secara menyeluruh dan ambil
              tindakan yang tepat.
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

      {/* Filter Section */}
      <Card className="border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Semester
              </label>
              <Select
                value={filterSemester}
                onValueChange={(val) => setFilterSemester(val)}
              >
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tahun
              </label>
              <Select
                value={filterYear}
                onValueChange={(val) => setFilterYear(val)}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}/{y + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bulan
              </label>
              <Select
                value={filterMonth}
                onValueChange={(val) => setFilterMonth(val)}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kelas
              </label>
              <Select
                value={filterKelas}
                onValueChange={(val) => {
                  setFilterKelas(val);
                  setFilterRombel("all");
                }}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {availableClasses.map((k) => (
                    <SelectItem key={k} value={String(k)}>
                      Kelas {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rombel
              </label>
              <Select
                value={filterRombel}
                onValueChange={(val) => setFilterRombel(val)}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Rombel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rombel</SelectItem>
                  {availableRombels.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kategori
              </label>
              <Select
                value={filterCategory}
                onValueChange={(val) => setFilterCategory(val)}
              >
                <SelectTrigger className="h-10 bg-background text-sm">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Tahsin Dasar">Tahsin Dasar</SelectItem>
                  <SelectItem value="Tahsin Lanjutan">
                    Tahsin Lanjutan
                  </SelectItem>
                  <SelectItem value="Tahfizh">Tahfizh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Laporan
              </label>
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val)}
              >
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
                onChange={(e) => setSearch(e.target.value)}
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

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa</span>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.total}
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">
                Keseluruhan Populasi
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahsin Dasar</span>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.tahsinDasar}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.tahsinDasar / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lanjutan</span>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.tahsinLanjutan}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.tahsinLanjutan / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahfizh</span>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.tahfizh}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.tahfizh / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ada Laporan</span>
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.latestProgress}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.latestProgress / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Diisi</span>
              <div className="p-1.5 bg-amber-50 rounded-md">
                <ClipboardList className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.emptyProgress}
              </div>
              <div className="text-[10px] font-medium text-amber-600 mt-1 bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.emptyProgress / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perhatian</span>
              <div className="p-1.5 bg-rose-50 rounded-md">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.needsAttention}
              </div>
              <div className="text-[10px] font-medium text-rose-600 mt-1 bg-rose-50 inline-block px-1.5 py-0.5 rounded">
                {stats.total > 0
                  ? ((stats.needsAttention / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Dashboard Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Tombol Cepat Kelas & Perlu Tindakan Koordinator */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Tombol Cepat Kelas */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                Tombol Cepat Kelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((gradeNum) => (
                  <Button
                    key={gradeNum}
                    variant={filterKelas === String(gradeNum) ? "default" : "outline"}
                    onClick={() => {
                      setFilterKelas(String(gradeNum));
                      setFilterRombel("all");
                    }}
                    className={`h-12 flex flex-col items-center justify-center p-1 border transition-colors ${
                      filterKelas === String(gradeNum)
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                        : "bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <Users className={`h-3.5 w-3.5 mb-0.5 ${filterKelas === String(gradeNum) ? "text-emerald-100" : "text-emerald-600/70"}`} />
                    <span className="text-xs font-bold">Kelas {gradeNum}</span>
                  </Button>
                ))}
                <Button
                  variant={filterKelas === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilterKelas("all");
                    setFilterRombel("all");
                  }}
                  className={`col-span-3 h-10 mt-1 font-bold flex items-center justify-center gap-2 border transition-colors ${
                    filterKelas === "all"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                      : "bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Semua Kelas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Perlu Tindakan Koordinator */}
          <Card className="border border-slate-200 bg-white shadow-sm flex-1 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Perlu Tindakan Koordinator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex gap-3 items-start">
                  <div className="bg-amber-100 text-amber-700 p-1.5 rounded-full mt-0.5 shadow-sm">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      Siswa Belum Diisi
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Laporan bulanan masih kosong
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-amber-900">
                    {actionStats.empty}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setFilterStatus("empty")} className="text-[10px] h-7 px-2 border-amber-200 text-amber-700 hover:bg-amber-100 hidden sm:flex">
                    Lihat
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="flex gap-3 items-start">
                  <div className="bg-rose-100 text-rose-700 p-1.5 rounded-full mt-0.5 shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-900">
                      Perlu Perhatian Khusus
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5">
                      Berdasarkan parameter capaian
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-rose-900">
                    {actionStats.attention}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setFilterStatus("attention")} className="text-[10px] h-7 px-2 border-rose-200 text-rose-700 hover:bg-rose-100 hidden sm:flex">
                    Lihat
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full mt-0.5 shadow-sm">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900">
                      Nilai di Bawah 70
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5">
                      Nilai akhir progresif &lt; 70
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-blue-900">
                    {actionStats.below70}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setFilterStatus("attention")} className="text-[10px] h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-100 hidden sm:flex">
                    Lihat
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex gap-3 items-start">
                  <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-full mt-0.5 shadow-sm">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-900">
                      Tidak Konsisten / Stagnan
                    </div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">
                      Progres bulanan terhambat
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-900">
                  {actionStats.stagnant}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex gap-3 items-start">
                  <div className="bg-slate-200 text-slate-700 p-1.5 rounded-full mt-0.5 shadow-sm">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Rombel Belum Tuntas
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Rombel masih ada status kosong
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {actionStats.emptyRombelsCount}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Perbandingan Total Siswa per Kelas */}
        <Card className="xl:col-span-3 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Perbandingan Total Siswa per Kelas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Bar
                  dataKey="Jumlah Siswa"
                  fill="#0f766e"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tren Perkembangan (6 Bulan Terakhir) */}
        <Card className="xl:col-span-5 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tren Kelengkapan Laporan (6 Bulan Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 10, right: 20, left: -25, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => {
                    if (name === "Kelengkapan Data (%)") return [`${value}%`, "Kelengkapan"];
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Kelengkapan Data (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


      {/* Pengampu Summary Section / Ringkasan Jenjang Kelas */}
      {filterKelas !== "all" && filterRombel !== "all" ? (
        <Card className="border border-emerald-200 bg-white shadow-sm overflow-hidden mb-6 rounded-2xl">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4">
            <CardTitle className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Ringkasan Pengampu - Kelas {filterKelas} {filterRombel}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Summary Strip (Jika Filter Aktif) */}
            <div className="bg-emerald-600 text-white px-4 py-2 mb-6 flex flex-wrap gap-4 text-[10px] sm:text-xs font-medium items-center justify-center rounded-lg shadow-sm">
              <span>Total Siswa: {stats.total}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Tahsin Dasar: {stats.tahsinDasar}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Tahsin Lanjutan: {stats.tahsinLanjutan}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Tahfizh: {stats.tahfizh}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Ada Laporan: {stats.latestProgress}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Belum Diisi: {stats.emptyProgress}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
              <span>Perlu Perhatian: {stats.needsAttention}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map((idx) => {
                const ts = teacherSummaries[idx];
                if (!ts) {
                  return (
                    <div key={`empty-${idx}`} className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
                      <Users className="h-6 w-6 text-slate-300 mb-2" />
                      <span className="text-slate-400 text-sm font-medium">Pengampu {idx === 0 ? "pertama" : "kedua"} belum terdeteksi</span>
                    </div>
                  );
                }
                return (
                  <div key={ts.guru} className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-emerald-50/50 px-4 py-3 flex justify-between items-center border-b border-emerald-100">
                      <div className="font-bold text-emerald-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Pengampu {idx + 1}
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                        {ts.total} Siswa Binaan
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 text-center">
                          <tr className="[&>th]:font-semibold [&>th]:px-2 [&>th]:py-2.5">
                            <th className="text-left px-4">Nama Pengampu</th>
                            <th>TD</th>
                            <th>TL</th>
                            <th>TFZ</th>
                            <th className="text-emerald-700">Laporan</th>
                            <th className="text-amber-700">Belum</th>
                            <th className="text-rose-700">Perhatian</th>
                            <th>Nilai</th>
                            <th>Hadir</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          <tr className="hover:bg-slate-50/50 [&>td]:px-2 [&>td]:py-3">
                            <td className="text-left font-bold text-slate-800 px-4 max-w-[150px] truncate" title={ts.guru}>{ts.guru}</td>
                            <td className="text-slate-600">{ts.tahsinDasar}</td>
                            <td className="text-slate-600">{ts.tahsinLanjutan}</td>
                            <td className="text-slate-600">{ts.tahfizh}</td>
                            <td>
                              <span className="font-bold text-emerald-600">{ts.filled}</span>
                            </td>
                            <td className="font-bold text-amber-600">{ts.empty}</td>
                            <td className="font-bold text-rose-600">{ts.attention}</td>
                            <td className="font-bold text-slate-700">{ts.avgScore ?? "-"}</td>
                            <td className="font-bold text-slate-700">{ts.avgHadir !== null ? `${ts.avgHadir}%` : "-"}</td>
                            <td>
                              <Button variant="outline" size="sm" className="h-6 text-[10px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-2" onClick={() => {}}>
                                Lihat Detail
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : filterKelas !== "all" ? (
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden mb-6 rounded-2xl flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium">Pilih salah satu rombel spesifik untuk melihat ringkasan pengampu.</p>
          </div>
        </Card>
      ) : (
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
          <CardTitle className="text-base font-bold text-foreground">
            Ringkasan Jenjang Kelas
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 text-center">
              <tr className="[&>th]:font-semibold [&>th]:px-4 [&>th]:py-3">
                <th className="text-left whitespace-nowrap">Kelas</th>
                <th className="text-left whitespace-nowrap">Rombel</th>
                <th className="text-left whitespace-nowrap">Pengampu 1</th>
                <th className="text-left whitespace-nowrap">Total Siswa Binaan 1</th>
                <th className="text-left whitespace-nowrap border-l border-slate-200">Pengampu 2</th>
                <th className="text-left whitespace-nowrap">Total Siswa Binaan 2</th>
                <th className="whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jenjangKelasRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data ringkasan rombel ditemukan.
                  </td>
                </tr>
              ) : (
                jenjangKelasRows.map((row) => {
                  const rombelKey = `${row.kelas}-${row.rombel}`;
                  const isExpanded = !!expandedRombels[rombelKey];
                  
                  const t1 = row.teacher1;
                  const t2 = row.teacher2;

                  return (
                    <Fragment key={`jenjang-group-${rombelKey}`}>
                      <tr className="hover:bg-slate-50/50 transition-colors text-sm [&>td]:px-4 [&>td]:py-3 [&>td]:whitespace-nowrap">
                        <td className="text-left font-bold text-slate-800">
                          Kelas {row.kelas}
                        </td>
                        <td className="text-left font-bold text-slate-800">{row.rombel}</td>
                        
                        <td className="text-left font-bold text-emerald-800 max-w-[150px] truncate" title={t1?.[0]}>
                          {t1 ? t1[0] : "-"}
                        </td>
                        <td className="text-left">
                          {t1 ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                                {t1[1].total} Siswa
                              </Badge>
                              <span className="text-[11px] text-slate-500 font-medium">
                                (TD: {t1[1].td}, TL: {t1[1].tl}, TFZ: {t1[1].tfz})
                              </span>
                            </div>
                          ) : "-"}
                        </td>

                        <td className="text-left font-bold text-emerald-800 max-w-[150px] truncate border-l border-slate-100" title={t2?.[0]}>
                          {t2 ? t2[0] : "-"}
                        </td>
                        <td className="text-left">
                          {t2 ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                                {t2[1].total} Siswa
                              </Badge>
                              <span className="text-[11px] text-slate-500 font-medium">
                                (TD: {t2[1].td}, TL: {t2[1].tl}, TFZ: {t2[1].tfz})
                              </span>
                            </div>
                          ) : "-"}
                        </td>

                        <td className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 border border-border"
                            onClick={() => toggleRombelExpand(rombelKey)}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={17} className="p-0 bg-muted/20">
                            <div className="p-4 border-t border-b border-border bg-muted/10">
                              <h4 className="text-xs font-bold text-foreground mb-2 text-left">
                                Daftar Siswa Rombel {row.kelas}
                                {row.rombel} ({row.originalRows.length} siswa)
                              </h4>
                              <table className="w-full text-left text-xs bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-muted/80 text-muted-foreground border-b border-border">
                                  <tr>
                                    <th className="px-3 py-2 font-semibold">
                                      No
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Nama Siswa
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Kategori / Level
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Status Laporan
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Kategori Progres
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Nilai
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Catatan
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                      Guru Pembuat
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {row.originalRows.map(
                                    (
                                      studentRow: RecapJoinedRow,
                                      idx: number,
                                    ) => {
                                      const needsAttention =
                                        studentRow.reportStatus === "filled" &&
                                        ((studentRow.nilaiAkhirProgresif !==
                                          null &&
                                          studentRow.nilaiAkhirProgresif <
                                            70) ||
                                          studentRow.kategoriProgres ===
                                            "Kurang Konsisten" ||
                                          studentRow.kategoriProgres ===
                                            "Tidak Konsisten");
                                      return (
                                        <tr
                                          key={studentRow.studentId}
                                          className="hover:bg-muted/40 transition-colors bg-background"
                                        >
                                          <td className="px-3 py-2 text-muted-foreground">
                                            {idx + 1}
                                          </td>
                                          <td className="px-3 py-2 font-semibold text-foreground">
                                            <div className="flex items-center gap-1.5">
                                              {studentRow.nama}
                                              {needsAttention && (
                                                <Badge
                                                  variant="destructive"
                                                  className="text-[9px] px-1 py-0 bg-rose-100 text-rose-700 border-rose-200"
                                                >
                                                  Perhatian
                                                </Badge>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-muted-foreground">
                                                {studentRow.program}
                                              </span>
                                              <span className="font-semibold text-foreground">
                                                {studentRow.level}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <Badge
                                              variant="outline"
                                              className={
                                                studentRow.reportStatus ===
                                                "filled"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] px-1"
                                                  : "bg-amber-50 text-amber-700 border-amber-100 text-[10px] px-1"
                                              }
                                            >
                                              {studentRow.reportStatus ===
                                              "filled"
                                                ? "Sudah Diisi"
                                                : "Belum Diisi"}
                                            </Badge>
                                          </td>
                                          <td className="px-3 py-2">
                                            {studentRow.reportStatus ===
                                            "filled" ? (
                                              <Badge
                                                variant="outline"
                                                className={`${getStatusColor(studentRow.kategoriProgres, studentRow.nilaiAkhirProgresif)} text-[10px] px-1`}
                                              >
                                                {studentRow.kategoriProgres ||
                                                  "-"}
                                              </Badge>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td className="px-3 py-2 font-bold">
                                            {studentRow.reportStatus ===
                                            "filled" ? (
                                              <span
                                                className={
                                                  studentRow.nilaiAkhirProgresif !==
                                                    null &&
                                                  studentRow.nilaiAkhirProgresif <
                                                    70
                                                    ? "text-rose-600 dark:text-rose-400 font-bold"
                                                    : "text-foreground font-bold"
                                                }
                                              >
                                                {studentRow.nilaiAkhirProgresif ??
                                                  "-"}
                                              </span>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td
                                            className="px-3 py-2 text-muted-foreground max-w-[200px] truncate"
                                            title={studentRow.catatan}
                                          >
                                            {studentRow.catatan || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-muted-foreground">
                                            {studentRow.guru || "-"}
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </motion.div>
  );
}
