import { Fragment, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FixedHorizontalScrollbar } from "@/components/reports/FixedHorizontalScrollbar";
import type { RecapJoinedRow } from "@/utils/recapMonthlyReportRows";
import {
  AlertTriangle,
  Award,
  BookOpen,
  ClipboardList,
  Eye,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TeacherSlot = [string, { total: number; td: number; tl: number; tfz: number }] | null;

type StudentStats = {
  total: number;
  tahsinDasar: number;
  tahsinLanjutan: number;
  tahfizh: number;
  latestProgress: number;
  emptyProgress: number;
  needsAttention: number;
};

type ActionStats = {
  empty: number;
  attention: number;
  below70: number;
  stagnant: number;
  emptyRombelsCount: number;
};

type JenjangKelasRow = {
  kelas: number;
  rombel: string;
  originalRows: RecapJoinedRow[];
  teacher1: TeacherSlot;
  teacher2: TeacherSlot;
  teacher3: TeacherSlot;
  teacher4: TeacherSlot;
};

type MonitoringSiswaProps = {
  stats: StudentStats;
  actionStats: ActionStats;
  filterKelas: string;
  setFilterKelas: (value: string) => void;
  setFilterRombel: (value: string) => void;
  lineChartData: Array<{
    name: string;
    "Tahsin Dasar": number;
    "Tahsin Lanjutan": number;
    Tahfizh: number;
  }>;
  jenjangKelasRows: JenjangKelasRow[];
  expandedRombels: Record<string, boolean>;
  toggleRombelExpand: (key: string) => void;
  getStatusColor: (kategori: string | null, nilai: number | null) => string;
  showAllJenjang: boolean;
  setShowAllJenjang: (value: boolean) => void;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  tableContentRef: RefObject<HTMLTableElement | null>;
};

export function MonitoringSiswa({
  stats,
  actionStats,
  filterKelas,
  setFilterKelas,
  setFilterRombel,
  lineChartData,
  jenjangKelasRows,
  expandedRombels,
  toggleRombelExpand,
  getStatusColor,
  showAllJenjang,
  setShowAllJenjang,
  tableScrollRef,
  tableContentRef,
}: MonitoringSiswaProps) {
  const summaryCards = [
    {
      label: "Total Siswa",
      value: stats.total,
      helper: "Keseluruhan Populasi",
      accent: "bg-emerald-500",
      icon: Users,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Tahsin Dasar",
      value: stats.tahsinDasar,
      helper: `${stats.total > 0 ? ((stats.tahsinDasar / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-emerald-500",
      icon: BookOpen,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Lanjutan",
      value: stats.tahsinLanjutan,
      helper: `${stats.total > 0 ? ((stats.tahsinLanjutan / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-amber-500",
      icon: Award,
      iconClass: "text-amber-600",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Tahfizh",
      value: stats.tahfizh,
      helper: `${stats.total > 0 ? ((stats.tahfizh / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-violet-500",
      icon: Award,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Ada Laporan",
      value: stats.latestProgress,
      helper: `${stats.total > 0 ? ((stats.latestProgress / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-emerald-500",
      icon: ClipboardList,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Belum Diisi",
      value: stats.emptyProgress,
      helper: `${stats.total > 0 ? ((stats.emptyProgress / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-amber-500",
      icon: ClipboardList,
      iconClass: "text-amber-600",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Perhatian",
      value: stats.needsAttention,
      helper: `${stats.total > 0 ? ((stats.needsAttention / stats.total) * 100).toFixed(1) : "0"}%`,
      accent: "bg-rose-500",
      icon: AlertTriangle,
      iconClass: "text-rose-600",
      iconBg: "bg-rose-50 dark:bg-rose-950/40",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="relative overflow-hidden bg-card border border-border shadow-sm rounded-xl hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 w-1 h-full ${card.accent}`} />
              <CardContent className="p-4 flex flex-col justify-between h-full pl-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className={`p-1.5 rounded-md ${card.iconBg}`}>
                    <Icon className={`h-4 w-4 ${card.iconClass}`} />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  <div className="text-[10px] font-medium text-muted-foreground/70 mt-1">
                    {card.helper}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card shadow-sm flex flex-col h-full rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-muted/40 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Tombol Cepat Kelas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="grid grid-cols-3 gap-3 h-full">
              {[1, 2, 3, 4, 5, 6].map((gradeNum) => (
                <Button
                  key={gradeNum}
                  variant={filterKelas === String(gradeNum) ? "default" : "outline"}
                  onClick={() => {
                    setFilterKelas(String(gradeNum));
                    setFilterRombel("all");
                  }}
                  className={`h-full min-h-[80px] flex flex-col items-center justify-center p-2 border transition-colors rounded-xl ${
                    filterKelas === String(gradeNum)
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-md"
                      : "bg-card text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-900/40 shadow-sm"
                  }`}
                >
                  <Users className={`h-5 w-5 mb-1.5 ${filterKelas === String(gradeNum) ? "text-emerald-100" : "text-emerald-600/70"}`} />
                  <span className="text-sm font-bold">Kelas {gradeNum}</span>
                </Button>
              ))}
              <Button
                variant={filterKelas === "all" ? "default" : "outline"}
                onClick={() => {
                  setFilterKelas("all");
                  setFilterRombel("all");
                }}
                className={`col-span-3 min-h-[60px] font-bold flex items-center justify-center gap-2 border transition-colors rounded-xl mt-1 ${
                  filterKelas === "all"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-md"
                    : "bg-card text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-900/40 shadow-sm"
                }`}
              >
                <Users className="h-5 w-5" />
                Tampilkan Semua Kelas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm flex flex-col rounded-2xl overflow-hidden h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/40 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Perlu Tindakan Koordinator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 flex-1">
            {[
              {
                label: "Siswa Belum Diisi",
                desc: "Laporan bulanan masih kosong",
                value: actionStats.empty,
                bg: "bg-amber-50 dark:bg-amber-950/40",
                border: "border-amber-100 dark:border-amber-900/40",
                iconBg: "bg-amber-100 text-amber-700 dark:text-amber-300",
                text: "text-amber-900 dark:text-amber-400",
                subtext: "text-amber-700 dark:text-amber-300",
                icon: ClipboardList,
              },
              {
                label: "Perlu Perhatian Khusus",
                desc: "Berdasarkan parameter capaian",
                value: actionStats.attention,
                bg: "bg-rose-50 dark:bg-rose-950/40",
                border: "border-rose-100 dark:border-rose-900/40",
                iconBg: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
                text: "text-rose-900 dark:text-rose-400",
                subtext: "text-rose-700 dark:text-rose-300",
                icon: AlertTriangle,
              },
              {
                label: "Nilai di Bawah 70",
                desc: "Nilai akhir progresif < 70",
                value: actionStats.below70,
                bg: "bg-blue-50 dark:bg-blue-950/40",
                border: "border-blue-100 dark:border-blue-900/40",
                iconBg: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
                text: "text-blue-900 dark:text-blue-400",
                subtext: "text-blue-700 dark:text-blue-300",
                icon: BookOpen,
              },
              {
                label: "Tidak Konsisten / Stagnan",
                desc: "Progres bulanan terhambat",
                value: actionStats.stagnant,
                bg: "bg-indigo-50 dark:bg-indigo-950/40",
                border: "border-indigo-100 dark:border-indigo-900/40",
                iconBg: "bg-indigo-100 text-indigo-700 dark:text-indigo-300",
                text: "text-indigo-900 dark:text-indigo-400",
                subtext: "text-indigo-700 dark:text-indigo-300",
                icon: RotateCcw,
              },
              {
                label: "Rombel Belum Tuntas",
                desc: "Rombel masih ada status kosong",
                value: actionStats.emptyRombelsCount,
                bg: "bg-muted/40",
                border: "border-border",
                iconBg: "bg-muted-foreground/20 text-foreground",
                text: "text-foreground",
                subtext: "text-muted-foreground",
                icon: Users,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center justify-between p-3 border rounded-xl ${item.bg} ${item.border}`}>
                  <div className="flex gap-3 items-start">
                    <div className={`p-1.5 rounded-full mt-0.5 shadow-sm ${item.iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${item.text}`}>{item.label}</div>
                      <div className={`text-[10px] mt-0.5 ${item.subtext}`}>{item.desc}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${item.text}`}>{item.value}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Tren Perkembangan (6 Bulan Terakhir)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 20, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="Tahsin Dasar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                <LabelList dataKey="Tahsin Dasar" position="top" offset={10} fontSize={10} fontWeight="bold" fill="#10b981" />
              </Line>
              <Line type="monotone" dataKey="Tahsin Lanjutan" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                <LabelList dataKey="Tahsin Lanjutan" position="top" offset={10} fontSize={10} fontWeight="bold" fill="#f59e0b" />
              </Line>
              <Line type="monotone" dataKey="Tahfizh" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                <LabelList dataKey="Tahfizh" position="top" offset={10} fontSize={10} fontWeight="bold" fill="#8b5cf6" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/40 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">Ringkasan Jenjang Kelas</CardTitle>
          {filterKelas === "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllJenjang(!showAllJenjang)}
              className="text-xs border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 h-8"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {showAllJenjang ? "Sembunyikan Arsip" : "Lihat Arsip Data"}
            </Button>
          )}
        </CardHeader>

        {filterKelas !== "all" || showAllJenjang ? (
          <>
            <div className="spreadsheet-table-scroll overflow-x-hidden relative" ref={tableScrollRef}>
              <table className="w-full text-left text-xs" ref={tableContentRef} style={{ minWidth: "1200px" }}>
                <thead className="bg-muted/40 text-muted-foreground border-b border-border text-center">
                  <tr className="[&>th]:font-semibold [&>th]:px-4 [&>th]:py-3">
                    <th className="text-left whitespace-nowrap">Kelas</th>
                    <th className="text-left whitespace-nowrap">Rombel</th>
                    <th className="text-left whitespace-nowrap">Pengampu 1</th>
                    <th className="text-left whitespace-nowrap">Total Siswa Binaan 1</th>
                    <th className="text-left whitespace-nowrap border-l border-border">Pengampu 2</th>
                    <th className="text-left whitespace-nowrap">Total Siswa Binaan 2</th>
                    <th className="text-left whitespace-nowrap border-l border-border">Pengampu 3</th>
                    <th className="text-left whitespace-nowrap">Total Siswa Binaan 3</th>
                    <th className="text-left whitespace-nowrap border-l border-border">Pengampu 4</th>
                    <th className="text-left whitespace-nowrap">Total Siswa Binaan 4</th>
                    <th className="whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jenjangKelasRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                        Tidak ada data ringkasan rombel ditemukan.
                      </td>
                    </tr>
                  ) : (
                    jenjangKelasRows.map((row) => {
                      const rombelKey = `${row.kelas}-${row.rombel}`;
                      const isExpanded = !!expandedRombels[rombelKey];
                      const teachers = [row.teacher1, row.teacher2, row.teacher3, row.teacher4];

                      return (
                        <Fragment key={`jenjang-group-${rombelKey}`}>
                          <tr className="hover:bg-slate-50/50 transition-colors text-sm [&>td]:px-4 [&>td]:py-3 [&>td]:whitespace-nowrap">
                            <td className="text-left font-bold text-foreground">Kelas {row.kelas}</td>
                            <td className="text-left font-bold text-foreground">{row.rombel}</td>
                            {teachers.map((teacher, index) => (
                              <Fragment key={`${rombelKey}-teacher-${index}`}>
                                <td
                                  className={`text-left font-bold text-emerald-800 dark:text-emerald-400 max-w-[150px] truncate ${index > 0 ? "border-l border-border" : ""}`}
                                  title={teacher?.[0]}
                                >
                                  {teacher ? teacher[0] : "-"}
                                </td>
                                <td className="text-left">
                                  {teacher ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 border-0">
                                        {teacher[1].total} Siswa
                                      </Badge>
                                      {(index < 2 || teacher[1].td || teacher[1].tl || teacher[1].tfz) && (
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                          (TD: {teacher[1].td}, TL: {teacher[1].tl}, TFZ: {teacher[1].tfz})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </Fragment>
                            ))}
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
                              <td colSpan={11} className="p-0 bg-muted/20">
                                <div className="p-4 border-t border-b border-border bg-muted/10">
                                  <h4 className="text-xs font-bold text-foreground mb-2 text-left">
                                    Daftar Siswa Rombel {row.kelas}
                                    {row.rombel} ({row.originalRows.length} siswa)
                                  </h4>
                                  <table className="w-full text-left text-xs bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                                    <thead className="bg-muted/80 text-muted-foreground border-b border-border">
                                      <tr>
                                        <th className="px-3 py-2 font-semibold">No</th>
                                        <th className="px-3 py-2 font-semibold">Nama Siswa</th>
                                        <th className="px-3 py-2 font-semibold">Kategori / Level</th>
                                        <th className="px-3 py-2 font-semibold">Status Laporan</th>
                                        <th className="px-3 py-2 font-semibold">Kategori Progres</th>
                                        <th className="px-3 py-2 font-semibold">Nilai</th>
                                        <th className="px-3 py-2 font-semibold">Catatan</th>
                                        <th className="px-3 py-2 font-semibold">Guru Pembuat</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {row.originalRows.map((studentRow, idx) => {
                                        const needsAttention =
                                          studentRow.reportStatus === "filled" &&
                                          ((studentRow.nilaiAkhirProgresif !== null && studentRow.nilaiAkhirProgresif < 70) ||
                                            studentRow.kategoriProgres === "Kurang Konsisten" ||
                                            studentRow.kategoriProgres === "Tidak Konsisten");
                                        return (
                                          <tr key={studentRow.studentId} className="hover:bg-muted/40 transition-colors bg-background">
                                            <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                            <td className="px-3 py-2 font-semibold text-foreground">
                                              <div className="flex items-center gap-1.5">
                                                {studentRow.nama}
                                                {needsAttention && (
                                                  <Badge
                                                    variant="destructive"
                                                    className="text-[9px] px-1 py-0 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                                                  >
                                                    Perhatian
                                                  </Badge>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground">{studentRow.program}</span>
                                                <span className="font-semibold text-foreground">{studentRow.level}</span>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge
                                                variant="outline"
                                                className={
                                                  studentRow.reportStatus === "filled"
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40 text-[10px] px-1"
                                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/40 text-[10px] px-1"
                                                }
                                              >
                                                {studentRow.reportStatus === "filled" ? "Sudah Diisi" : "Belum Diisi"}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                              {studentRow.reportStatus === "filled" ? (
                                                <Badge
                                                  variant="outline"
                                                  className={`${getStatusColor(studentRow.kategoriProgres, studentRow.nilaiAkhirProgresif)} text-[10px] px-1`}
                                                >
                                                  {studentRow.kategoriProgres || "-"}
                                                </Badge>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td className="px-3 py-2 font-bold">
                                              {studentRow.reportStatus === "filled" ? (
                                                <span
                                                  className={
                                                    studentRow.nilaiAkhirProgresif !== null && studentRow.nilaiAkhirProgresif < 70
                                                      ? "text-rose-600 dark:text-rose-400 font-bold"
                                                      : "text-foreground font-bold"
                                                  }
                                                >
                                                  {studentRow.nilaiAkhirProgresif ?? "-"}
                                                </span>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate" title={studentRow.catatan}>
                                              {studentRow.catatan || "-"}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">{studentRow.guru || "-"}</td>
                                          </tr>
                                        );
                                      })}
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

            <FixedHorizontalScrollbar
              scrollContainerRef={tableScrollRef}
              contentRef={tableContentRef}
              refreshKey={`${jenjangKelasRows.length}-${Object.keys(expandedRombels).length}`}
            />
          </>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-muted/40">
            <div className="bg-emerald-100 dark:bg-emerald-950/40 p-3 rounded-full mb-3 shadow-sm border border-emerald-200 dark:border-emerald-900/40">
              <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">Data Diarsipkan (Mode Semua Kelas)</h3>
            <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">
              Tampilan ringkasan 24 rombel disembunyikan untuk memprioritaskan ruang dan kenyamanan membaca Anda.
            </p>
            <Button onClick={() => setShowAllJenjang(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Eye className="h-4 w-4 mr-2" />
              Tampilkan {jenjangKelasRows.length} Rombel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
