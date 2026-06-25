import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, Search, Unlock, Users } from "lucide-react";
import { AttendanceStudent, AttendanceWithStudent, useAttendanceByPeriod, useAttendancePeriodSettings, useAttendancePeriodSettingsByGroups, useBulkUpsertAttendance, useStudentsForAttendance, useUpsertAttendancePeriodSettings } from "@/hooks/useAttendance";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import { useProfileMap } from "@/hooks/useProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/DataTablePagination";
import AttendanceExport, { type AttRow } from "@/components/AttendanceExport";

type StatusFilter = "all" | "filled" | "empty";

type AttendanceInputRow = {
  studentId: string;
  studentName: string;
  kelas: number;
  rombel: string;
  level: string;
  existingId?: string;
  present: number;
  sick: number;
  permission: number;
  absent: number;
};

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const KELAS_LIST = [1, 2, 3, 4, 5, 6];
const ROMBELS = ["A", "B", "C", "D"];
const HISTORY_PAGE_SIZE = 25;

const getTotal = (row: Pick<AttendanceInputRow, "present" | "sick" | "permission" | "absent">) =>
  row.present + row.sick + row.permission + row.absent;

const getStatus = (row: AttendanceInputRow, effectiveDays: number) => {
  const total = getTotal(row);
  if (!row.existingId && total === 0) return "Belum Diisi";
  if (total === effectiveDays) return "Lengkap";
  if (total < effectiveDays) return "Belum Lengkap";
  return "Melebihi Hari Efektif";
};

const statusClass = (status: string) => {
  if (status === "Lengkap") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Belum Lengkap") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === "Melebihi Hari Efektif") return "bg-red-100 text-red-700 border-red-200";
  return "bg-muted text-muted-foreground border-border";
};

const statusLabelMobile = (status: string, isLocked: boolean) => {
  if (isLocked) return "Dikunci";
  if (status === "Belum Diisi") return "Kosong";
  if (status === "Lengkap") return "Lengkap";
  if (status === "Belum Lengkap") return "Kurang";
  if (status === "Melebihi Hari Efektif") return "Lebih";
  return status;
};

const statusClassMobile = (status: string, isLocked: boolean) => {
  if (isLocked) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/30";
  if (status === "Lengkap") return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/30";
  if (status === "Belum Lengkap") return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900 hover:bg-yellow-100 dark:hover:bg-yellow-950/30";
  if (status === "Melebihi Hari Efektif") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/30";
  return "bg-muted text-muted-foreground border-border dark:bg-muted/30 dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted/30";
};

const normalizeNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

const buildRows = (students: AttendanceStudent[], attendance: AttendanceWithStudent[]): AttendanceInputRow[] =>
  students.map((student) => {
    const existing = attendance.find((item) => item.student_id === student.id);
    return {
      studentId: student.id,
      studentName: student.nama,
      kelas: student.kelas,
      rombel: student.rombel,
      level: student.level,
      existingId: existing?.id,
      present: existing?.present ?? 0,
      sick: existing?.sick ?? 0,
      permission: existing?.permission ?? 0,
      absent: existing?.absent ?? 0,
    };
  });

const MonthlyReport = () => {
  const now = new Date();
  const { user, profile } = useAuth();
  const profileMap = useProfileMap();
  const isAdmin = profile?.role === "admin";
  const teacherAccount = isTeacherRole(profile?.role);
  const teacherOverview = teacherAccount && !isAdmin;

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [kelas, setKelas] = useState("");
  const [rombel, setRombel] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [effectiveDays, setEffectiveDays] = useState(0);
  const [rows, setRows] = useState<AttendanceInputRow[]>([]);
  const [activeTab, setActiveTab] = useState("input");
  const [historyPage, setHistoryPage] = useState(1);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const hasClassFilter = Boolean(kelas && rombel);
  const hasAttendanceScope = teacherOverview || hasClassFilter;

  const studentsQuery = useStudentsForAttendance({
    kelas: teacherOverview ? "" : kelas,
    rombel: teacherOverview ? "" : rombel,
    search,
    enabled: hasAttendanceScope,
  });

  const attendanceQuery = useAttendanceByPeriod({
    month,
    year,
    kelas: teacherOverview ? "" : kelas,
    rombel: teacherOverview ? "" : rombel,
    enabled: hasAttendanceScope,
  });

  const settingsQuery = useAttendancePeriodSettings({
    month,
    year,
    kelas,
    rombel,
    enabled: hasClassFilter && !teacherOverview,
  });

  const visibleGroups = useMemo(() => {
    const map = new Map<string, { kelas: number; rombel: string }>();
    for (const row of rows) {
      map.set(`${row.kelas}-${row.rombel}`, { kelas: row.kelas, rombel: row.rombel });
    }
    return Array.from(map.values()).sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [rows]);

  const groupSettingsQuery = useAttendancePeriodSettingsByGroups({
    month,
    year,
    groups: visibleGroups,
    enabled: teacherOverview && visibleGroups.length > 0,
  });

  const historyQuery = useAttendanceByPeriod({
    month,
    year,
    kelas: teacherOverview ? "" : kelas,
    rombel: teacherOverview ? "" : rombel,
    enabled: activeTab === "history" && hasAttendanceScope,
  });

  const bulkUpsert = useBulkUpsertAttendance();
  const upsertSettings = useUpsertAttendancePeriodSettings();

  useEffect(() => {
    setRows(buildRows(studentsQuery.data ?? [], attendanceQuery.data ?? []));
  }, [studentsQuery.data, attendanceQuery.data]);

  useEffect(() => {
    if (teacherOverview) {
      const settings = groupSettingsQuery.data ?? [];
      const uniqueEffectiveDays = Array.from(new Set(settings.map((setting) => setting.effective_days)));
      setEffectiveDays(uniqueEffectiveDays.length === 1 ? uniqueEffectiveDays[0] : 0);
      return;
    }

    setEffectiveDays(settingsQuery.data?.effective_days ?? 0);
  }, [teacherOverview, settingsQuery.data?.id, settingsQuery.data?.effective_days, groupSettingsQuery.data]);

  useEffect(() => {
    setHistoryPage(1);
  }, [month, year, kelas, rombel, activeTab, teacherOverview]);

  const visibleRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => {
      const status = getStatus(row, effectiveDays);
      return statusFilter === "filled" ? status !== "Belum Diisi" : status === "Belum Diisi";
    });
  }, [rows, statusFilter, effectiveDays]);

  const summary = useMemo(() => {
    const total = rows.length;
    const filled = rows.filter((row) => getStatus(row, effectiveDays) !== "Belum Diisi").length;
    const empty = total - filled;
    const pct = total ? Math.round((filled / total) * 100) : 0;
    return { total, filled, empty, pct };
  }, [rows, effectiveDays]);

  const groupedVisibleRows = useMemo(() => {
    const groups = new Map<number, AttendanceInputRow[]>();
    for (const row of visibleRows) {
      const current = groups.get(row.kelas) ?? [];
      current.push(row);
      groups.set(row.kelas, current);
    }
    return Array.from(groups.entries())
      .sort(([kelasA], [kelasB]) => kelasA - kelasB)
      .map(([kelas, classRows]) => ({
        kelas,
        rows: classRows.sort((a, b) => a.studentName.localeCompare(b.studentName)),
      }));
  }, [visibleRows]);

  const isLocked = teacherOverview
    ? Boolean(groupSettingsQuery.data?.some((setting) => setting.is_locked))
    : Boolean(settingsQuery.data?.is_locked);
  const saveDisabled = bulkUpsert.isPending || upsertSettings.isPending || (teacherAccount && isLocked);

  const updateRow = (studentId: string, field: "present" | "sick" | "permission" | "absent", value: string) => {
    setRows((current) =>
      current.map((row) => row.studentId === studentId ? { ...row, [field]: normalizeNumber(value) } : row)
    );
  };

  const scrollToRow = (studentId: string) => {
    const isMobile = window.innerWidth < 768;
    const id = isMobile ? `row-mobile-${studentId}` : `row-desktop-${studentId}`;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-yellow-100", "dark:bg-yellow-950/40");
      setTimeout(() => {
        element.classList.remove("bg-yellow-100", "dark:bg-yellow-950/40");
      }, 2000);
    } else {
      rowRefs.current[studentId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const validateRows = () => {
    if (!hasAttendanceScope) return "Pilih kelas dan rombel terlebih dahulu.";
    if (effectiveDays <= 0) return "Jumlah Hari Efektif wajib lebih dari 0.";

    for (const row of rows) {
      const values = [row.present, row.sick, row.permission, row.absent];
      if (values.some((value) => value < 0)) {
        scrollToRow(row.studentId);
        return `${row.studentName}: angka absensi tidak boleh negatif.`;
      }

      const total = getTotal(row);
      if (total !== effectiveDays) {
        scrollToRow(row.studentId);
        if (total < effectiveDays) return `${row.studentName}: total absensi ${total}, masih kurang dari hari efektif ${effectiveDays}.`;
        return `${row.studentName}: total absensi ${total}, melebihi hari efektif ${effectiveDays}.`;
      }
    }

    return null;
  };

  const saveAll = async () => {
    const validationError = validateRows();
    if (validationError) {
      toast({ title: "Absensi belum valid", description: validationError, variant: "destructive" });
      return;
    }

    try {
      if (teacherOverview) {
        await Promise.all(visibleGroups.map((group) => {
          const existing = groupSettingsQuery.data?.find(
            (setting) => setting.kelas === group.kelas && setting.rombel === group.rombel
          );

          return upsertSettings.mutateAsync({
            month,
            year,
            kelas: group.kelas,
            rombel: group.rombel,
            effective_days: effectiveDays,
            is_locked: existing?.is_locked ?? false,
            locked_by: existing?.locked_by ?? null,
            locked_at: existing?.locked_at ?? null,
          });
        }));
      } else {
        await upsertSettings.mutateAsync({
          month,
          year,
          kelas: Number(kelas),
          rombel,
          effective_days: effectiveDays,
          is_locked: isLocked,
          locked_by: settingsQuery.data?.locked_by ?? null,
          locked_at: settingsQuery.data?.locked_at ?? null,
        });
      }

      const saved = await bulkUpsert.mutateAsync(rows.map((row) => ({
        student_id: row.studentId,
        month,
        year,
        present: row.present,
        sick: row.sick,
        permission: row.permission,
        absent: row.absent,
      })));

      toast({ title: "Absensi berhasil disimpan", description: `${saved.length} data absensi tersimpan.` });
      await Promise.all([
        attendanceQuery.refetch(),
        teacherOverview ? groupSettingsQuery.refetch() : settingsQuery.refetch(),
      ]);
    } catch (error: unknown) {
      toast({
        title: "Gagal menyimpan absensi",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.",
        variant: "destructive",
      });
    }
  };

  const toggleLock = async () => {
    if (!isAdmin || !hasClassFilter) return;
    const nextLocked = !isLocked;
    try {
      await upsertSettings.mutateAsync({
        month,
        year,
        kelas: Number(kelas),
        rombel,
        effective_days: effectiveDays,
        is_locked: nextLocked,
        locked_by: nextLocked ? user?.id ?? null : null,
        locked_at: nextLocked ? new Date().toISOString() : null,
      });
      toast({ title: nextLocked ? "Periode absensi dikunci" : "Kunci periode dibuka" });
      await settingsQuery.refetch();
    } catch (error: unknown) {
      toast({
        title: "Gagal mengubah kunci periode",
        description: error instanceof Error ? error.message : "Coba lagi beberapa saat.",
        variant: "destructive",
      });
    }
  };

  const historyRows = historyQuery.data ?? [];
  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / HISTORY_PAGE_SIZE));
  const pagedHistoryRows = historyRows.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Absensi Bulanan</h1>
            {isLocked && <Badge className="bg-slate-700 text-white hover:bg-slate-700">Dikunci</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">Input dan pantau kelengkapan absensi siswa setiap bulan.</p>
        </div>
        {isAdmin && hasClassFilter && (
          <Button type="button" variant={isLocked ? "outline" : "secondary"} onClick={toggleLock} disabled={upsertSettings.isPending}>
            {upsertSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {isLocked ? "Buka Kunci Periode" : "Kunci Absensi Periode Ini"}
          </Button>
        )}
      </div>

      {/* Card Filter Utama - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-lg">Filter Utama</CardTitle>
        </CardHeader>
        <CardContent className={`grid gap-4 md:grid-cols-3 ${teacherOverview ? "lg:grid-cols-4" : "lg:grid-cols-6"}`}>
          <div className="space-y-2">
            <Label>Bulan</Label>
            <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tahun</Label>
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!teacherOverview && (
            <>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={kelas || undefined} onValueChange={setKelas}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {KELAS_LIST.map((item) => <SelectItem key={item} value={String(item)}>Kelas {item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rombel</Label>
                <Select value={rombel || undefined} onValueChange={setRombel}>
                  <SelectTrigger><SelectValue placeholder="Pilih rombel" /></SelectTrigger>
                  <SelectContent>
                    {ROMBELS.map((item) => <SelectItem key={item} value={item}>Rombel {item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="filled">Sudah Diisi</SelectItem>
                <SelectItem value="empty">Belum Diisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cari Nama</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama siswa" className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Filter Utama - Mobile */}
      <Card className="block md:hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Filter Utama</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Baris pertama: Bulan, Tahun */}
            <div className="space-y-1">
              <Label className="text-xs">Bulan</Label>
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)} className="text-xs">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tahun</Label>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((item) => <SelectItem key={item} value={String(item)} className="text-xs">{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Baris kedua: Kelas, Rombel (jika bukan teacherOverview) */}
            {!teacherOverview && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Kelas</Label>
                  <Select value={kelas || undefined} onValueChange={setKelas}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Kelas" /></SelectTrigger>
                    <SelectContent>
                      {KELAS_LIST.map((item) => <SelectItem key={item} value={String(item)} className="text-xs">Kelas {item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rombel</Label>
                  <Select value={rombel || undefined} onValueChange={setRombel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Rombel" /></SelectTrigger>
                    <SelectContent>
                      {ROMBELS.map((item) => <SelectItem key={item} value={item} className="text-xs">Rombel {item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Baris ketiga: Hari Efektif, Filter Status */}
            <div className="space-y-1">
              <Label className="text-xs">Hari Efektif</Label>
              <Input
                type="number"
                min={0}
                value={effectiveDays}
                onChange={(event) => setEffectiveDays(normalizeNumber(event.target.value))}
                className="h-9 text-xs"
                disabled={teacherAccount && isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua</SelectItem>
                  <SelectItem value="filled" className="text-xs">Sudah Diisi</SelectItem>
                  <SelectItem value="empty" className="text-xs">Belum Diisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pencarian siswa tampil satu baris penuh di bawahnya */}
          <div className="space-y-1 pt-1">
            <Label className="text-xs">Cari Nama</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama siswa" className="pl-9 h-9 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {teacherOverview && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>Menampilkan semua murid binaan yang sudah disetujui, dipisahkan berdasarkan kelas.</AlertDescription>
        </Alert>
      )}

      {!hasAttendanceScope ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Pilih kelas dan rombel</AlertTitle>
          <AlertDescription>Data siswa tidak dimuat sebelum kelas dan rombel dipilih agar halaman tetap ringan.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Ringkasan Statistik - Desktop */}
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Siswa</p>
                <p className="text-3xl font-bold">{summary.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Sudah Diisi</p>
                <p className="text-3xl font-bold text-emerald-600">{summary.filled}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter("empty")}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Belum Diisi</p>
                <p className="text-3xl font-bold text-yellow-600">{summary.empty}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Kelengkapan</p>
                <p className="text-3xl font-bold">{summary.pct}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Ringkasan Statistik - Mobile */}
          <div className="grid md:hidden grid-cols-4 gap-1.5">
            <Card className="p-2 flex flex-col justify-between">
              <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
              <p className="text-base font-bold leading-none mt-1">{summary.total}</p>
            </Card>
            <Card className="p-2 flex flex-col justify-between">
              <p className="text-[10px] text-emerald-600 leading-tight">Selesai</p>
              <p className="text-base font-bold text-emerald-600 leading-none mt-1">{summary.filled}</p>
            </Card>
            <Card className="p-2 flex flex-col justify-between cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter("empty")}>
              <p className="text-[10px] text-yellow-600 leading-tight">Belum</p>
              <p className="text-base font-bold text-yellow-600 leading-none mt-1">{summary.empty}</p>
            </Card>
            <Card className="p-2 flex flex-col justify-between">
              <p className="text-[10px] text-muted-foreground leading-tight">Persen</p>
              <p className="text-base font-bold leading-none mt-1">{summary.pct}%</p>
            </Card>
          </div>

          {summary.empty > 0 ? (
            <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Masih ada {summary.empty} siswa yang belum diisi absensinya untuk periode {MONTH_NAMES[month - 1]} {year}.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Absensi seluruh siswa pada periode ini sudah lengkap.</AlertDescription>
            </Alert>
          )}

          {teacherAccount && isLocked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>Periode ini sudah dikunci. Guru tidak dapat mengubah absensi sampai admin membuka kembali periode.</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="input">Input Absensi</TabsTrigger>
              <TabsTrigger value="history">Riwayat Absensi</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <Card>
                <CardHeader className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg">Input Massal</CardTitle>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="effective-days">Jumlah Hari Efektif</Label>
                      <Input
                        id="effective-days"
                        type="number"
                        min={0}
                        value={effectiveDays}
                        onChange={(event) => setEffectiveDays(normalizeNumber(event.target.value))}
                        className="w-full sm:w-40"
                        disabled={teacherAccount && isLocked}
                      />
                    </div>
                    <Button type="button" onClick={saveAll} disabled={saveDisabled || rows.length === 0}>
                      {bulkUpsert.isPending || upsertSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Simpan Semua Absensi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-6 pb-24 md:pb-6">
                  {studentsQuery.isLoading || attendanceQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat data absensi...
                    </div>
                  ) : visibleRows.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Tidak ada siswa sesuai filter.</p>
                  ) : (
                    <>
                      {/* Tabel Desktop */}
                      <div className="hidden md:block overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                              <TableHead className="w-12">No</TableHead>
                              <TableHead>Nama Siswa</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead className="w-24">Hadir</TableHead>
                              <TableHead className="w-24">Sakit</TableHead>
                              <TableHead className="w-24">Izin</TableHead>
                              <TableHead className="w-24">Alfa</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Persentase Kehadiran</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              let rowNumber = 0;
                              const groups = teacherOverview ? groupedVisibleRows : [{ kelas: Number(kelas), rows: visibleRows }];

                              return groups.map((group) => (
                                <Fragment key={group.kelas}>
                                  {teacherOverview && (
                                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                                      <TableCell colSpan={10} className="font-semibold text-foreground">Kelas {group.kelas}</TableCell>
                                    </TableRow>
                                  )}
                                  {group.rows.map((row) => {
                                    rowNumber += 1;
                                    const total = getTotal(row);
                                    const percentage = effectiveDays > 0 ? Math.round((row.present / effectiveDays) * 100) : 0;
                                    const status = getStatus(row, effectiveDays);
                                    return (
                                      <TableRow
                                        key={row.studentId}
                                        id={`row-desktop-${row.studentId}`}
                                        ref={(element) => { rowRefs.current[row.studentId] = element; }}
                                      >
                                        <TableCell>{rowNumber}</TableCell>
                                        <TableCell className="min-w-48 font-medium">{row.studentName}</TableCell>
                                        <TableCell>{row.level}</TableCell>
                                        {(["present", "sick", "permission", "absent"] as const).map((field) => (
                                          <TableCell key={field}>
                                            <Input
                                              type="number"
                                              min={0}
                                              value={row[field]}
                                              onChange={(event) => updateRow(row.studentId, field, event.target.value)}
                                              disabled={teacherAccount && isLocked}
                                              className="h-9 w-20"
                                            />
                                          </TableCell>
                                        ))}
                                        <TableCell className="font-semibold">{total}</TableCell>
                                        <TableCell>{percentage}%</TableCell>
                                        <TableCell><Badge variant="outline" className={statusClass(status)}>{status}</Badge></TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </Fragment>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Tabel Mobile */}
                      <div className="block md:hidden w-full overflow-hidden rounded-md border">
                        <div className="text-[10px] text-muted-foreground px-2 py-1.5 border-b bg-muted/30 text-center font-medium">
                          H = Hadir · S = Sakit · I = Izin · A = Alfa
                        </div>
                        <table className="w-full table-fixed text-[10px]">
                          <colgroup>
                            <col className="w-[6%]" />
                            <col className="w-[34%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                            <col className="w-[20%]" />
                          </colgroup>
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">No</th>
                              <th className="py-2 px-0.5 text-left font-semibold text-muted-foreground text-[9px]">Nama Siswa</th>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">H</th>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">S</th>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">I</th>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">A</th>
                              <th className="py-2 px-0.5 text-center font-semibold text-muted-foreground text-[9px]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              let rowNumber = 0;
                              const groups = teacherOverview ? groupedVisibleRows : [{ kelas: Number(kelas), rows: visibleRows }];

                              return groups.map((group) => (
                                <Fragment key={group.kelas}>
                                  {teacherOverview && (
                                    <tr className="bg-muted/60">
                                      <td colSpan={7} className="font-semibold text-foreground py-1.5 px-2 text-[11px]">Kelas {group.kelas}</td>
                                    </tr>
                                  )}
                                  {group.rows.map((row) => {
                                    rowNumber += 1;
                                    const total = getTotal(row);
                                    const status = getStatus(row, effectiveDays);
                                    const hasError = total !== effectiveDays;
                                    return (
                                      <tr
                                        key={row.studentId}
                                        id={`row-mobile-${row.studentId}`}
                                        className={`border-b transition-colors hover:bg-muted/30 ${
                                          hasError
                                            ? (total > effectiveDays ? "bg-red-50/50 dark:bg-red-950/10" : "bg-yellow-50/50 dark:bg-yellow-950/10")
                                            : ""
                                        }`}
                                      >
                                        <td className="py-1.5 px-0.5 text-center text-muted-foreground">{rowNumber}</td>
                                        <td className="py-1.5 px-0.5 align-middle min-w-0">
                                          <span
                                            title={row.studentName}
                                            className="line-clamp-2 break-words leading-tight font-medium text-[10px]"
                                          >
                                            {row.studentName}
                                          </span>
                                          {hasError && (
                                            <span className="text-[8px] text-red-500 dark:text-red-400 block leading-none mt-0.5">
                                              {total > effectiveDays ? `Lebih: ${total}/${effectiveDays}` : `Kurang: ${total}/${effectiveDays}`}
                                            </span>
                                          )}
                                        </td>
                                        {(["present", "sick", "permission", "absent"] as const).map((field) => (
                                          <td key={field} className="py-1.5 px-0.5 text-center">
                                            <Input
                                              type="number"
                                              inputMode="numeric"
                                              min={0}
                                              value={row[field]}
                                              onChange={(event) => updateRow(row.studentId, field, event.target.value)}
                                              disabled={teacherAccount && isLocked}
                                              className="h-8 w-full min-w-0 px-0.5 py-0 text-center text-[11px] rounded-md"
                                              onFocus={(e) => e.target.select()}
                                            />
                                          </td>
                                        ))}
                                        <td className="py-1.5 px-0.5 text-center align-middle">
                                          <Badge className={`px-1 py-0 text-[8px] leading-4 whitespace-normal text-center font-normal ${statusClassMobile(status, isLocked)}`}>
                                            {statusLabelMobile(status, isLocked)}
                                          </Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </Fragment>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Tombol Simpan Sticky untuk Mobile */}
                      <div className="block md:hidden sticky bottom-0 z-20 border-t bg-background/95 p-2 backdrop-blur -mx-6 -mb-6 mt-4">
                        <Button
                          type="button"
                          onClick={saveAll}
                          disabled={saveDisabled || rows.length === 0}
                          className="w-full"
                        >
                          {bulkUpsert.isPending || upsertSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Simpan Absensi ({rows.length} Siswa)
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg">Riwayat Absensi</CardTitle>
                  <AttendanceExport attendance={historyRows as AttRow[]} label={`Riwayat Absensi ${MONTH_NAMES[month - 1]} ${year}`} />
                </CardHeader>
                <CardContent>
                  {historyQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat riwayat...
                    </div>
                  ) : historyRows.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Belum ada data absensi pada filter ini.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nama</TableHead>
                              <TableHead>Kelas</TableHead>
                              <TableHead>Bulan</TableHead>
                              <TableHead>Hadir</TableHead>
                              <TableHead>Sakit</TableHead>
                              <TableHead>Izin</TableHead>
                              <TableHead>Alfa</TableHead>
                              <TableHead>Persentase</TableHead>
                              <TableHead>Terakhir diubah oleh</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedHistoryRows.map((item) => {
                              const percentage = effectiveDays > 0 ? Math.round((item.present / effectiveDays) * 100) : 0;
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.students?.nama ?? "-"}</TableCell>
                                  <TableCell>{item.students ? `${item.students.kelas}${item.students.rombel}` : "-"}</TableCell>
                                  <TableCell>{MONTH_NAMES[item.month - 1]} {item.year}</TableCell>
                                  <TableCell>{item.present}</TableCell>
                                  <TableCell>{item.sick}</TableCell>
                                  <TableCell>{item.permission}</TableCell>
                                  <TableCell>{item.absent}</TableCell>
                                  <TableCell>{percentage}%</TableCell>
                                  <TableCell>{item.created_by ? profileMap.get(item.created_by) ?? item.created_by : "-"}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <DataTablePagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MonthlyReport;
