import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BookOpen, ClipboardList, UserRoundSearch, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TeacherLoadSummary = {
  teacherId: string;
  teacherName: string;
  TD: number;
  TL: number;
  TFZ: number;
  total: number;
  tdPercent: number;
};

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

type TeacherLoadComparisonRow = {
  teacherId: string;
  teacherName: string;
  previousTD: number;
  currentTD: number;
  tdDelta: number;
  previousTL: number;
  currentTL: number;
  tlDelta: number;
  status: string;
  statusClassName: string;
};

type OrphanStudent = {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
};

type MonitoringGuruProps = {
  teacherLoadLoading: boolean;
  selectedPeriodLabel: string;
  previousPeriodLabel: string;
  teacherLoadTotals: {
    total: number;
    TD: number;
    TL: number;
    TFZ: number;
    tdPercent: number;
    tlPercent: number;
    tfzPercent: number;
  };
  currentTeacherLoads: TeacherLoadSummary[];
  dominantTdTeachers: TeacherLoadSummary[];
  teacherLoadChartLimit: "8" | "15" | "all";
  setTeacherLoadChartLimit: (value: "8" | "15" | "all") => void;
  teacherLoadChartLimitLabel: string;
  teacherLoadChartData: TeacherLoadSummary[];
  teacherLoadComparisonRows: TeacherLoadComparisonRow[];
  teacherOverviewRows: TeacherOverviewRow[];
  orphanStudents: OrphanStudent[];
  formatPercent: (value: number) => string;
  teacherFilterLabel: string;
};

const TEACHER_LOAD_COLORS = {
  TD: "#10b981",
  TL: "#f59e0b",
  TFZ: "#8b5cf6",
};

const formatTeacherChartName = (name: string) => {
  if (name.length <= 24) return name;
  return `${name.slice(0, 23)}...`;
};

const getTeacherLoadStatus = (tdPercent: number) => {
  if (tdPercent >= 80) {
    return {
      label: "Dominan TD",
      className: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40",
    };
  }
  if (tdPercent >= 60) {
    return {
      label: "Campuran",
      className: "bg-amber-100 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40",
    };
  }
  return {
    label: "Seimbang",
    className: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
  };
};

export function MonitoringGuru({
  teacherLoadLoading,
  selectedPeriodLabel,
  previousPeriodLabel,
  teacherLoadTotals,
  currentTeacherLoads,
  dominantTdTeachers,
  teacherLoadChartLimit,
  setTeacherLoadChartLimit,
  teacherLoadChartLimitLabel,
  teacherLoadChartData,
  teacherLoadComparisonRows,
  teacherOverviewRows,
  orphanStudents,
  formatPercent,
  teacherFilterLabel,
}: MonitoringGuruProps) {
  const totalTeachers = teacherOverviewRows.length;
  const totalFilled = teacherOverviewRows.reduce((sum, row) => sum + row.reportFilled, 0);
  const totalEmpty = teacherOverviewRows.reduce((sum, row) => sum + row.reportEmpty, 0);
  const averageStudents = totalTeachers > 0
    ? teacherOverviewRows.reduce((sum, row) => sum + row.studentCount, 0) / totalTeachers
    : 0;
  const overloadCount = teacherOverviewRows.filter((row) => row.loadStatus === "Terlalu Tinggi").length;
  const underloadCount = teacherOverviewRows.filter((row) => row.loadStatus === "Terlalu Rendah").length;

  const summaryCards = [
    {
      label: "Guru Aktif",
      value: totalTeachers,
      helper: teacherFilterLabel,
      icon: Users,
    },
    {
      label: "Rata-rata Siswa/Guru",
      value: totalTeachers > 0 ? averageStudents.toFixed(1) : "0.0",
      helper: selectedPeriodLabel,
      icon: BookOpen,
    },
    {
      label: "Laporan Sudah Diisi",
      value: totalFilled,
      helper: `${teacherLoadTotals.total > 0 ? formatPercent((totalFilled / teacherLoadTotals.total) * 100) : "0.0%"}`,
      icon: ClipboardList,
    },
    {
      label: "Laporan Belum Diisi",
      value: totalEmpty,
      helper: `${teacherLoadTotals.total > 0 ? formatPercent((totalEmpty / teacherLoadTotals.total) * 100) : "0.0%"}`,
      icon: ClipboardList,
    },
    {
      label: "Beban Terlalu Tinggi",
      value: overloadCount,
      helper: "Perlu pemerataan",
      icon: AlertTriangle,
    },
    {
      label: "Siswa Tanpa Pengampu",
      value: orphanStudents.length,
      helper: "Perlu penugasan",
      icon: UserRoundSearch,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden border-border shadow-sm">
              <CardContent className="flex h-full items-center gap-4 p-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-foreground">{card.value}</div>
                  <div className="text-[11px] text-muted-foreground">{card.helper}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Ringkasan Beban & Perkembangan Guru
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Sumber data sama dengan Rekap Laporan Bulanan untuk periode {selectedPeriodLabel}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {teacherOverviewRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">Belum ada data guru pada filter ini</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Coba ubah filter kelas, rombel, atau guru untuk melihat ringkasan pengampu.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama Guru</TableHead>
                    <TableHead className="text-right">Siswa Binaan</TableHead>
                    <TableHead className="text-right">Kelas/Rombel</TableHead>
                    <TableHead className="text-right">Sudah Diisi</TableHead>
                    <TableHead className="text-right">Belum Diisi</TableHead>
                    <TableHead className="text-right">Rata-rata Progres</TableHead>
                    <TableHead>Status Beban</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherOverviewRows.map((row) => (
                    <TableRow key={row.teacherId}>
                      <TableCell className="font-semibold">{row.teacherName}</TableCell>
                      <TableCell className="text-right font-bold">{row.studentCount}</TableCell>
                      <TableCell className="text-right">{row.classCount}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{row.reportFilled}</TableCell>
                      <TableCell className="text-right text-amber-600">{row.reportEmpty}</TableCell>
                      <TableCell className="text-right">{row.avgProgress ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={row.loadStatusClassName}>
                          {row.loadStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Beban Guru per Bulan
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Data dari ringkasan rombel dan laporan bulanan {selectedPeriodLabel}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {teacherLoadLoading ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-80 rounded-xl" />
            </div>
          ) : currentTeacherLoads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">Data beban guru belum tersedia</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Belum ada laporan bulanan dengan guru pengampu untuk periode {selectedPeriodLabel}.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="current" className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:inline-grid sm:w-auto sm:grid-cols-3">
                <TabsTrigger value="current">Beban Bulan Ini</TabsTrigger>
                <TabsTrigger value="distribution">Distribusi Beban</TabsTrigger>
                <TabsTrigger value="comparison">Perbandingan Bulan Lalu</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Total Terdata",
                      value: teacherLoadTotals.total,
                      percent: "100.0%",
                      color: "bg-slate-500",
                    },
                    {
                      label: "Total TD",
                      value: teacherLoadTotals.TD,
                      percent: formatPercent(teacherLoadTotals.tdPercent),
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Total TL",
                      value: teacherLoadTotals.TL,
                      percent: formatPercent(teacherLoadTotals.tlPercent),
                      color: "bg-amber-500",
                    },
                    {
                      label: "Total TFZ",
                      value: teacherLoadTotals.TFZ,
                      percent: formatPercent(teacherLoadTotals.tfzPercent),
                      color: "bg-violet-500",
                    },
                  ].map((item) => (
                    <Card key={item.label} className="overflow-hidden rounded-xl border-border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-2 text-3xl font-bold text-foreground">{item.value}</p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              {item.percent} dari total
                            </p>
                          </div>
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nama Guru</TableHead>
                        <TableHead className="text-right">TD</TableHead>
                        <TableHead className="text-right">TL</TableHead>
                        <TableHead className="text-right">TFZ</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">%TD</TableHead>
                        <TableHead className="min-w-[160px]">Bar progress %TD</TableHead>
                        <TableHead>Badge status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTeacherLoads.map((teacher) => {
                        const status = getTeacherLoadStatus(teacher.tdPercent);
                        return (
                          <TableRow key={teacher.teacherId}>
                            <TableCell className="font-semibold">{teacher.teacherName}</TableCell>
                            <TableCell className="text-right">{teacher.TD}</TableCell>
                            <TableCell className="text-right">{teacher.TL}</TableCell>
                            <TableCell className="text-right">{teacher.TFZ}</TableCell>
                            <TableCell className="text-right font-bold">{teacher.total}</TableCell>
                            <TableCell className="text-right">{formatPercent(teacher.tdPercent)}</TableCell>
                            <TableCell>
                              <div className="h-2.5 rounded-full bg-muted">
                                <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(teacher.tdPercent, 100)}%` }} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={status.className}>
                                {status.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {dominantTdTeachers.length > 0 && (
                  <Alert variant="destructive" className="border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex flex-col gap-1 pr-2 sm:flex-row sm:items-center sm:justify-between">
                      <span>Guru dengan beban TD dominan</span>
                      <Badge variant="outline" className="w-fit border-rose-200 dark:border-rose-900/40 bg-card text-rose-700 dark:text-rose-300">
                        {dominantTdTeachers.length} guru perlu ditinjau
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-3 space-y-3">
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        Prioritas penyeimbangan beban: porsi Tahsin Dasar mencapai 80% atau lebih.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {dominantTdTeachers.map((teacher) => (
                          <div key={teacher.teacherId} className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-card p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-rose-900 dark:text-rose-400" title={teacher.teacherName}>
                                  {teacher.teacherName}
                                </div>
                                <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                                  {teacher.TD} TD dari {teacher.total} siswa
                                </div>
                              </div>
                              <div className="shrink-0 rounded-md bg-rose-100 dark:bg-rose-950/40 px-2 py-1 text-sm font-black text-rose-700 dark:text-rose-300">
                                {formatPercent(teacher.tdPercent)}
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-rose-100 dark:bg-rose-950/40">
                              <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(teacher.tdPercent, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="distribution" className="space-y-3">
                <div className="flex flex-col gap-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 p-3 text-blue-900 dark:text-blue-400 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold">Distribusi beban ditampilkan berdasarkan total siswa terbanyak</div>
                    <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                      Default Top 8 dipakai agar chart tetap ringkas dan mudah dibaca. Ubah pilihan jika ingin melihat lebih banyak guru.
                    </p>
                  </div>
                  <div className="w-full sm:w-44">
                    <Select value={teacherLoadChartLimit} onValueChange={(value) => setTeacherLoadChartLimit(value as "8" | "15" | "all")}>
                      <SelectTrigger className="h-9 bg-card text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">Top 8</SelectItem>
                        <SelectItem value="15">Top 15</SelectItem>
                        <SelectItem value="all">Semua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 sm:p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Menampilkan {teacherLoadChartLimitLabel}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Urutan dari guru dengan total siswa paling banyak.
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit bg-muted/40 text-muted-foreground">
                      Total guru: {currentTeacherLoads.length}
                    </Badge>
                  </div>
                  <div className="w-full" style={{ height: `${Math.max(360, teacherLoadChartData.length * 52 + 96)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teacherLoadChartData} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="teacherName"
                          width={156}
                          tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
                          tickFormatter={formatTeacherChartName}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value} siswa`, name]}
                          labelFormatter={(label) => `Guru: ${label}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend verticalAlign="top" height={32} />
                        <Bar dataKey="TD" stackId="load" fill={TEACHER_LOAD_COLORS.TD} />
                        <Bar dataKey="TL" stackId="load" fill={TEACHER_LOAD_COLORS.TL} />
                        <Bar dataKey="TFZ" stackId="load" fill={TEACHER_LOAD_COLORS.TFZ} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">
                  {previousPeriodLabel} vs {selectedPeriodLabel}
                </h3>
                <div className="rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nama Guru</TableHead>
                        <TableHead className="text-right">TD bulan lalu</TableHead>
                        <TableHead className="text-right">TD bulan ini</TableHead>
                        <TableHead className="text-right">Delta TD</TableHead>
                        <TableHead className="text-right">TL bulan lalu</TableHead>
                        <TableHead className="text-right">TL bulan ini</TableHead>
                        <TableHead className="text-right">Delta TL</TableHead>
                        <TableHead>Status perubahan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherLoadComparisonRows.map((row) => {
                        const deltaClass = (value: number) => {
                          if (value > 0) return "text-emerald-600 dark:text-emerald-400";
                          if (value < 0) return "text-rose-600";
                          return "text-muted-foreground";
                        };
                        const deltaLabel = (value: number) => (value > 0 ? `+${value}` : String(value));

                        return (
                          <TableRow key={row.teacherId}>
                            <TableCell className="font-semibold">{row.teacherName}</TableCell>
                            <TableCell className="text-right">{row.previousTD}</TableCell>
                            <TableCell className="text-right">{row.currentTD}</TableCell>
                            <TableCell className={`text-right font-bold ${deltaClass(row.tdDelta)}`}>{deltaLabel(row.tdDelta)}</TableCell>
                            <TableCell className="text-right">{row.previousTL}</TableCell>
                            <TableCell className="text-right">{row.currentTL}</TableCell>
                            <TableCell className={`text-right font-bold ${deltaClass(row.tlDelta)}`}>{deltaLabel(row.tlDelta)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={row.statusClassName}>
                                {row.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Siswa Belum Memiliki Pengampu</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Daftar siswa yang belum memiliki relasi pengampu pada filter kelas dan rombel saat ini.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {orphanStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Semua siswa pada filter ini sudah memiliki pengampu.
            </div>
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Rombel</TableHead>
                    <TableHead>Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-semibold">{student.nama}</TableCell>
                      <TableCell>{student.kelas}</TableCell>
                      <TableCell>{student.rombel}</TableCell>
                      <TableCell>{student.level}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {underloadCount > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
              {underloadCount} guru berada di bawah rata-rata beban siswa pada periode ini. Data ini bisa dipakai untuk pemerataan penugasan berikutnya.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
