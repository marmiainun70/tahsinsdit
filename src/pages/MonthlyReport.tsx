import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, Search, Unlock, Users } from "lucide-react";
import { AttendanceStudent, AttendanceWithStudent, useAttendanceByPeriod, useAttendancePeriodSettings, useBulkUpsertAttendance, useStudentsForAttendance, useUpsertAttendancePeriodSettings } from "@/hooks/useAttendance";
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

const normalizeNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

const buildRows = (students: AttendanceStudent[], attendance: AttendanceWithStudent[]): AttendanceInputRow[] =>
  students.map((student) => {
    const existing = attendance.find((item) => item.student_id === student.id);
    return {
      studentId: student.id,
      studentName: student.nama,
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

  const studentsQuery = useStudentsForAttendance({
    kelas,
    rombel,
    search,
    enabled: hasClassFilter,
  });

  const attendanceQuery = useAttendanceByPeriod({
    month,
    year,
    kelas,
    rombel,
    enabled: hasClassFilter,
  });

  const settingsQuery = useAttendancePeriodSettings({
    month,
    year,
    kelas,
    rombel,
    enabled: hasClassFilter,
  });

  const historyQuery = useAttendanceByPeriod({
    month,
    year,
    kelas,
    rombel,
    enabled: activeTab === "history" && hasClassFilter,
  });

  const bulkUpsert = useBulkUpsertAttendance();
  const upsertSettings = useUpsertAttendancePeriodSettings();

  useEffect(() => {
    setRows(buildRows(studentsQuery.data ?? [], attendanceQuery.data ?? []));
  }, [studentsQuery.data, attendanceQuery.data]);

  useEffect(() => {
    setEffectiveDays(settingsQuery.data?.effective_days ?? 0);
  }, [settingsQuery.data?.id, settingsQuery.data?.effective_days]);

  useEffect(() => {
    setHistoryPage(1);
  }, [month, year, kelas, rombel, activeTab]);

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

  const isLocked = Boolean(settingsQuery.data?.is_locked);
  const saveDisabled = bulkUpsert.isPending || upsertSettings.isPending || (teacherAccount && isLocked);

  const updateRow = (studentId: string, field: "present" | "sick" | "permission" | "absent", value: string) => {
    setRows((current) =>
      current.map((row) => row.studentId === studentId ? { ...row, [field]: normalizeNumber(value) } : row)
    );
  };

  const scrollToRow = (studentId: string) => {
    rowRefs.current[studentId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const validateRows = () => {
    if (!hasClassFilter) return "Pilih kelas dan rombel terlebih dahulu.";
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
      await Promise.all([attendanceQuery.refetch(), settingsQuery.refetch()]);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Utama</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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

      {!hasClassFilter ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Pilih kelas dan rombel</AlertTitle>
          <AlertDescription>Data siswa tidak dimuat sebelum kelas dan rombel dipilih agar halaman tetap ringan.</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <CardContent>
                  {studentsQuery.isLoading || attendanceQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat data absensi...
                    </div>
                  ) : visibleRows.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Tidak ada siswa sesuai filter.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
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
                          {visibleRows.map((row, index) => {
                            const total = getTotal(row);
                            const percentage = effectiveDays > 0 ? Math.round((row.present / effectiveDays) * 100) : 0;
                            const status = getStatus(row, effectiveDays);
                            return (
                              <TableRow key={row.studentId} ref={(element) => { rowRefs.current[row.studentId] = element; }}>
                                <TableCell>{index + 1}</TableCell>
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
                        </TableBody>
                      </Table>
                    </div>
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
