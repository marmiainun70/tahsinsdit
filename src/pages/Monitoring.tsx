import { useState, useMemo, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

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
  const [expandedGrades, setExpandedGrades] = useState<Record<number, boolean>>(
    {},
  );

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

  const toggleGradeExpand = (grade: number) => {
    setExpandedGrades((prev) => ({
      ...prev,
      [grade]: !prev[grade],
    }));
  };

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Monitoring Tahsin & Tahfizh
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau capaian Tahsin & Tahfizh siswa secara menyeluruh dan ambil
            tindakan yang tepat.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-bold text-foreground">
            SDIT Luqmanul Hakim
          </div>
          <div className="text-xs text-muted-foreground">
            Tahun Ajaran {filterYear}/{Number(filterYear) + 1}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
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
        <Card className="bg-blue-50/50 border-blue-200/60 shadow-sm dark:bg-blue-950/10 dark:border-blue-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold">Total Siswa</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.total}
              </div>
              <div className="text-[10px] font-medium text-blue-700/80 dark:text-blue-400/80 mt-1">
                100%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200/60 shadow-sm dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-semibold">Tahsin Dasar</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {stats.tahsinDasar}
              </div>
              <div className="text-[10px] font-medium text-amber-700/80 dark:text-amber-400/80 mt-1">
                {stats.total > 0
                  ? ((stats.tahsinDasar / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200/60 shadow-sm dark:bg-emerald-950/10 dark:border-emerald-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
              <Award className="h-4 w-4" />
              <span className="text-xs font-semibold">Lanjutan</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {stats.tahsinLanjutan}
              </div>
              <div className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                {stats.total > 0
                  ? ((stats.tahsinLanjutan / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200/60 shadow-sm dark:bg-purple-950/10 dark:border-purple-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
              <Award className="h-4 w-4" />
              <span className="text-xs font-semibold">Tahfizh</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.tahfizh}
              </div>
              <div className="text-[10px] font-medium text-purple-700/80 dark:text-purple-400/80 mt-1">
                {stats.total > 0
                  ? ((stats.tahfizh / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/50 border-indigo-200/60 shadow-sm dark:bg-indigo-950/10 dark:border-indigo-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs font-semibold">Ada Laporan</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {stats.latestProgress}
              </div>
              <div className="text-[10px] font-medium text-indigo-700/80 dark:text-indigo-400/80 mt-1">
                {stats.total > 0
                  ? ((stats.latestProgress / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 border-orange-200/60 shadow-sm dark:bg-orange-950/10 dark:border-orange-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs font-semibold">Belum Diisi</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.emptyProgress}
              </div>
              <div className="text-[10px] font-medium text-orange-700/80 dark:text-orange-400/80 mt-1">
                {stats.total > 0
                  ? ((stats.emptyProgress / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-200/60 shadow-sm dark:bg-rose-950/10 dark:border-rose-900/30">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold">Perhatian</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                {stats.needsAttention}
              </div>
              <div className="text-[10px] font-medium text-rose-700/80 dark:text-rose-400/80 mt-1">
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
                    variant={
                      filterKelas === String(gradeNum) ? "default" : "outline"
                    }
                    onClick={() => {
                      setFilterKelas(String(gradeNum));
                      setFilterRombel("all");
                    }}
                    className="h-12 flex flex-col items-center justify-center p-1 border-border bg-card text-foreground hover:bg-muted/50"
                  >
                    <Users className="h-3.5 w-3.5 mb-0.5 text-muted-foreground" />
                    <span className="text-xs font-bold">Kelas {gradeNum}</span>
                  </Button>
                ))}
                <Button
                  variant={filterKelas === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilterKelas("all");
                    setFilterRombel("all");
                  }}
                  className="col-span-3 h-10 mt-1 bg-emerald-800 hover:bg-emerald-950 text-white hover:text-white font-bold flex items-center justify-center gap-2 border-0"
                >
                  <Users className="h-4 w-4" />
                  Semua Kelas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Perlu Tindakan Koordinator */}
          <Card className="border-border bg-card shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Perlu Tindakan Koordinator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                <div className="flex gap-3 items-start">
                  <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 p-1.5 rounded-full mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-900 dark:text-red-300">
                      Siswa tanpa laporan &gt; 2 bulan
                    </div>
                    <div className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5">
                      Perlu diingatkan ke wali kelas / guru
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-red-900 dark:text-red-300">
                  {inactiveTwoMonthsCount}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                <div className="flex gap-3 items-start">
                  <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 p-1.5 rounded-full mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Capaian di bawah target
                    </div>
                    <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      Perlu bimbingan khusus
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900 dark:text-amber-300">
                  {belowTargetCount}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 p-1.5 rounded-full mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Hafalan stagnan &gt; 1 bulan
                    </div>
                    <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                      Perlu evaluasi dan pendampingan
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-300">
                  {stagnantOneMonthCount}
                </div>
              </div>

              <button
                onClick={() => setFilterStatus("attention")}
                className="w-full text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline pt-2 block bg-transparent border-0 cursor-pointer"
              >
                Lihat Daftar Lengkap &gt;
              </button>
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

        {/* Distribusi Tahsin & Tahfizh */}
        <Card className="xl:col-span-2 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Distribusi Tahsin & Tahfizh
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-2 flex flex-col justify-between">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1 text-[9px] px-2 mt-auto">
              {donutData.map((d) => {
                const pct =
                  stats.total > 0
                    ? Math.round((d.value / stats.total) * 100)
                    : 0;
                return (
                  <div
                    key={d.name}
                    className="flex items-center justify-between font-bold"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}
                    </span>
                    <span className="text-foreground">
                      {d.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tren Perkembangan (6 Bulan Terakhir) */}
        <Card className="xl:col-span-3 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Tren Perkembangan (6 Bulan Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
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
                />
                <Line
                  type="monotone"
                  dataKey="Tahsin Dasar"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tahsin Lanjutan"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tahfizh"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rombel Recap Table Section */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
          <CardTitle className="text-base font-bold text-foreground">
            Ringkasan Rombel
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr className="[&>th]:font-bold [&>th]:px-3 [&>th]:py-3 text-center">
                <th className="text-left whitespace-nowrap">Kelas</th>
                <th className="text-left whitespace-nowrap">Rombel</th>
                <th className="text-left whitespace-nowrap">Guru Pengampu</th>
                <th className="whitespace-nowrap">Total Siswa</th>
                <th className="whitespace-nowrap bg-amber-50/30 text-amber-900 dark:text-amber-300">
                  Tahsin Dasar (Jml)
                </th>
                <th className="whitespace-nowrap bg-amber-50/30 text-amber-900 dark:text-amber-300">
                  Tahsin Dasar (%)
                </th>
                <th className="whitespace-nowrap bg-emerald-50/30 text-emerald-900 dark:text-emerald-300">
                  Tahsin Lanjutan (Jml)
                </th>
                <th className="whitespace-nowrap bg-emerald-50/30 text-emerald-900 dark:text-emerald-300">
                  Tahsin Lanjutan (%)
                </th>
                <th className="whitespace-nowrap bg-purple-50/30 text-purple-900 dark:text-purple-300">
                  Tahfizh (Jml)
                </th>
                <th className="whitespace-nowrap bg-purple-50/30 text-purple-900 dark:text-purple-300">
                  Tahfizh (%)
                </th>
                <th className="whitespace-nowrap bg-indigo-50/30 text-indigo-900 dark:text-indigo-300">
                  Ada Laporan (Jml)
                </th>
                <th className="whitespace-nowrap bg-indigo-50/30 text-indigo-900 dark:text-indigo-300">
                  Ada Laporan (%)
                </th>
                <th className="whitespace-nowrap bg-orange-50/30 text-orange-900 dark:text-orange-300">
                  Belum Diisi (Jml)
                </th>
                <th className="whitespace-nowrap bg-orange-50/30 text-orange-900 dark:text-orange-300">
                  Belum Diisi (%)
                </th>
                <th className="whitespace-nowrap bg-rose-50/30 text-rose-900 dark:text-rose-300">
                  Perlu Perhatian (Jml)
                </th>
                <th className="whitespace-nowrap bg-rose-50/30 text-rose-900 dark:text-rose-300">
                  Perlu Perhatian (%)
                </th>
                <th className="whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rombelRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
                    className="px-4 py-8 text-center text-muted-foreground bg-background"
                  >
                    Tidak ada data ringkasan rombel ditemukan.
                  </td>
                </tr>
              ) : (
                rombelRows.map((row) => {
                  const rombelKey = `${row.kelas}-${row.rombel}`;
                  const isExpanded = !!expandedRombels[rombelKey];
                  return (
                    <Fragment key={`rombel-group-${rombelKey}`}>
                      <tr className="hover:bg-muted/30 transition-colors font-medium text-foreground bg-background text-center [&>td]:px-3 [&>td]:py-2.5 [&>td]:whitespace-nowrap">
                        <td className="text-left font-bold">
                          Kelas {row.kelas}
                        </td>
                        <td className="text-left font-bold">{row.rombel}</td>
                        <td
                          className="text-left font-semibold max-w-[150px] truncate"
                          title={row.guruPengampu}
                        >
                          {row.guruPengampu}
                        </td>
                        <td className="font-semibold">{row.total}</td>
                        <td className="bg-amber-50/10 text-amber-700 dark:text-amber-400 font-bold">
                          {row.tahsinDasar}
                        </td>
                        <td className="bg-amber-50/10 text-amber-600 dark:text-amber-400">
                          {row.tahsinDasarPercent}%
                        </td>
                        <td className="bg-emerald-50/10 text-emerald-700 dark:text-emerald-400 font-bold">
                          {row.tahsinLanjutan}
                        </td>
                        <td className="bg-emerald-50/10 text-emerald-600 dark:text-emerald-400">
                          {row.tahsinLanjutanPercent}%
                        </td>
                        <td className="bg-purple-50/10 text-purple-700 dark:text-purple-400 font-bold">
                          {row.tahfizh}
                        </td>
                        <td className="bg-purple-50/10 text-purple-600 dark:text-purple-400">
                          {row.tahfizhPercent}%
                        </td>
                        <td className="bg-indigo-50/10 text-indigo-700 dark:text-indigo-400 font-bold">
                          {row.filled}
                        </td>
                        <td className="bg-indigo-50/10 text-indigo-600 dark:text-indigo-400">
                          {row.filledPercent}%
                        </td>
                        <td className="bg-orange-50/10 text-orange-700 dark:text-orange-400 font-bold">
                          {row.empty}
                        </td>
                        <td className="bg-orange-50/10 text-orange-600 dark:text-orange-400">
                          {row.emptyPercent}%
                        </td>
                        <td className="bg-rose-50/10 text-rose-700 dark:text-rose-400 font-bold">
                          {row.attention}
                        </td>
                        <td className="bg-rose-50/10 text-rose-600 dark:text-rose-400">
                          {row.attentionPercent > 0 ? (
                            <Badge
                              variant="destructive"
                              className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0 text-[10px] font-bold px-1.5 py-0"
                            >
                              {row.attentionPercent}%
                            </Badge>
                          ) : (
                            "0%"
                          )}
                        </td>
                        <td>
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
    </motion.div>
  );
}
