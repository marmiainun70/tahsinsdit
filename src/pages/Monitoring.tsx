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
import { buildRecapJoinedGroups } from "@/utils/recapMonthlyReportRows";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Monitoring
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan data rekap laporan bulanan
          </p>
        </div>
      </div>

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
                      {y}
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
                placeholder="Cari nama siswa..."
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

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Card className="bg-blue-50 border-blue-200 shadow-sm dark:bg-blue-950/10 dark:border-blue-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-semibold">Total Siswa</span>
            </div>
            <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.total}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200 shadow-sm dark:bg-amber-950/10 dark:border-amber-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-semibold">Tahsin Dasar</span>
            </div>
            <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {stats.tahsinDasar}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 shadow-sm dark:bg-emerald-950/10 dark:border-emerald-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
              <Award className="h-4 w-4" />
              <span className="text-sm font-semibold">Lanjutan</span>
            </div>
            <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {stats.tahsinLanjutan}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 shadow-sm dark:bg-purple-950/10 dark:border-purple-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-2">
              <Award className="h-4 w-4" />
              <span className="text-sm font-semibold">Tahfizh</span>
            </div>
            <span className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.tahfizh}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-950/10 dark:border-indigo-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-semibold">Ada Laporan</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                {stats.latestProgress}
              </span>
              <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80">
                / {stats.total}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 shadow-sm dark:bg-orange-950/10 dark:border-orange-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-2">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-semibold">Belum Diisi</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {stats.emptyProgress}
              </span>
              <span className="text-xs font-medium text-orange-600/80 dark:text-orange-400/80">
                / {stats.total}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-200 shadow-sm dark:bg-rose-950/10 dark:border-rose-900/30">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Perhatian</span>
            </div>
            <span className="text-3xl font-bold text-rose-900 dark:text-rose-100">
              {stats.needsAttention}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gradeSummaries.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-border bg-card shadow-sm p-12 text-center text-muted-foreground">
              Tidak ada data ringkasan kelas ditemukan.
            </Card>
          </div>
        ) : (
          gradeSummaries.map((summary) => (
            <Card
              key={`grade-${summary.grade}`}
              className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                        {summary.grade}
                      </span>
                      Jenjang Kelas {summary.grade}
                    </CardTitle>
                    <div className="mt-1 text-sm text-muted-foreground font-medium">
                      Total {summary.total} siswa terdaftar
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-foreground">
                      {summary.avgScore !== null ? summary.avgScore : "-"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Rata-rata Nilai
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col">
                <div className="p-5 border-b border-border bg-background">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Progres Pengisian Laporan
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {summary.filled} dari {summary.total} laporan telah
                        diisi
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {summary.total > 0
                        ? Math.round((summary.filled / summary.total) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{
                        width: `${summary.total > 0 ? (summary.filled / summary.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {summary.attention > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-md border border-rose-100 dark:border-rose-900/40 text-xs font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
                      <span>
                        {summary.attention} siswa memerlukan perhatian khusus
                        bulan ini
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/10">
                  <div className="p-4 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                      {summary.tahsinDasar}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 text-center">
                      Tahsin Dasar
                    </div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                      {summary.tahsinLanjutan}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 text-center">
                      Tahsin Lanjutan
                    </div>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">
                      {summary.tahfizh}
                    </div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 text-center">
                      Tahfizh
                    </div>
                  </div>
                </div>

                <div className="p-0 bg-background">
                  <button
                    onClick={() => toggleGradeExpand(summary.grade)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-sm font-bold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Statistik Detail per Rombel
                    </span>
                    {expandedGrades[summary.grade] ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {expandedGrades[summary.grade] && (
                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {summary.rombels.map((rombel) => {
                          const percentFilled =
                            rombel.total > 0
                              ? Math.round((rombel.filled / rombel.total) * 100)
                              : 0;
                          return (
                            <div
                              key={rombel.rombel}
                              className="bg-muted/30 border border-border rounded-lg p-3 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-colors"
                            >
                              {rombel.attention > 0 && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {rombel.attention}
                                </div>
                              )}
                              <div className="text-sm font-black text-foreground flex items-center gap-1.5">
                                <span className="text-muted-foreground">
                                  Kelas
                                </span>{" "}
                                {summary.grade}
                                {rombel.rombel}
                              </div>

                              <div className="mt-3 flex justify-between items-end">
                                <div>
                                  <div className="text-2xl font-black leading-none">
                                    {rombel.avgScore !== null
                                      ? rombel.avgScore
                                      : "-"}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                                    Rata-rata
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold leading-none">
                                    {rombel.total}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                                    Siswa
                                  </div>
                                </div>
                              </div>

                              <div className="w-full mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${percentFilled}%` }}
                                />
                              </div>
                              <div className="text-[9px] font-semibold text-muted-foreground mt-1.5 text-center">
                                {rombel.filled} dari {rombel.total} Laporan (
                                {percentFilled}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
