import { useState, useMemo } from "react";
import { useStudents, IQRO_LEVELS, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { useAllMonthlyReports, MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { useProfileMap } from "@/hooks/useProfiles";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MultiMonthExportFilters } from "@/components/MultiMonthExportFilters";
import { generateMultiMonthPDF, generateMultiMonthExcel, type ExportGroup, aggregateMultiMonthData } from "@/utils/multiMonthExportUtils";
import {
  Search, Loader2, Eye, Download, CheckCircle2,
  Users, ListChecks, AlertCircle, Percent, FileWarning, FileSpreadsheet, Calendar
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const getProgramLabel = (level: string) => {
  if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level || "-";
};

interface RowData {
  no: number;
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  program: string;
  level: string;
  bulan: string;
  awal: string;
  akhir: string;
  total: number;
  target: number;
  status: "achieved" | "not_achieved" | "empty";
  guru: string;
  catatan: string;
}

interface AggregatedReport {
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
}

const RecapReport = () => {
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: reports = [], isLoading: lr } = useAllMonthlyReports();
  const { data: settings } = useInstitutionSettings();
  const profileMap = useProfileMap();

  const now = new Date();
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "filled" | "empty">("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Multi-month export state
  const [multiMonthMode, setMultiMonthMode] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Filter siswa sesuai kelas/rombel/search
  const filteredStudents = useMemo(() => {
    let s = students;
    if (filterKelas !== "all") s = s.filter(st => st.kelas === Number(filterKelas));
    if (filterRombel !== "all") s = s.filter(st => st.rombel === filterRombel);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(st => st.nama.toLowerCase().includes(q));
    }
    return s.sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama));
  }, [students, filterKelas, filterRombel, search]);

  // Group per rombel: kelas-rombel (single month mode)
  const groups = useMemo(() => {
    const map = new Map<string, { kelas: number; rombel: string; rows: RowData[] }>();
    filteredStudents.forEach(st => {
      const key = `${st.kelas}-${st.rombel}`;
      if (!map.has(key)) map.set(key, { kelas: st.kelas, rombel: st.rombel, rows: [] });
      const grp = map.get(key)!;

      const rep = reports.find(r =>
        r.student_id === st.id &&
        r.month === Number(filterMonth) &&
        r.year === Number(filterYear)
      );

      const monthLabel = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

      if (!rep) {
        grp.rows.push({
          no: grp.rows.length + 1,
          studentId: st.id,
          nama: st.nama,
          kelas: st.kelas,
          rombel: st.rombel,
          program: getProgramLabel(st.level),
          level: st.level,
          bulan: monthLabel,
          awal: "-",
          akhir: "-",
          total: 0,
          target: 0,
          status: "empty",
          guru: "-",
          catatan: "",
        });
      } else {
        const fmtTahfizh = (lvl: string | null | undefined, page: number) => {
          const j = Number(String(lvl || "").replace(/\D/g, "")) || null;
          return j ? `Juz ${j} hal.${page}` : `hal.${page}`;
        };
        const awal = rep.iqra_level
          ? (rep.program_type === "tahfizh" ? fmtTahfizh(rep.iqra_level, rep.start_page) : `${rep.iqra_level} hal.${rep.start_page}`)
          : String(rep.start_page);
        const akhir = (rep as any).end_iqra_level
          ? (rep.program_type === "tahfizh" ? fmtTahfizh((rep as any).end_iqra_level, rep.end_page) : `${(rep as any).end_iqra_level} hal.${rep.end_page}`)
          : String(rep.end_page);
        grp.rows.push({
          no: grp.rows.length + 1,
          studentId: st.id,
          nama: st.nama,
          kelas: st.kelas,
          rombel: st.rombel,
          program: getProgramLabel(st.level),
          level: st.level,
          bulan: monthLabel,
          awal, akhir,
          total: rep.pages_read,
          target: rep.target_pages,
          status: rep.achievement_status === "achieved" ? "achieved" : "not_achieved",
          guru: rep.created_by ? (profileMap.get(rep.created_by) || "-") : "-",
          catatan: rep.notes || "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [filteredStudents, reports, filterMonth, filterYear, profileMap]);

  // Apply status filter (sudah/belum diisi) and renumber per rombel
  const displayGroups = useMemo(() => {
    return groups
      .map(g => {
        const filtered = g.rows.filter(r => {
          if (filterStatus === "filled") return r.status !== "empty";
          if (filterStatus === "empty") return r.status === "empty";
          return true;
        }).map((r, i) => ({ ...r, no: i + 1 }));
        return { ...g, rows: filtered };
      })
      .filter(g => g.rows.length > 0);
  }, [groups, filterStatus]);

  // Statistik (selalu dari groups penuh, tidak dipengaruhi filterStatus)
  const stats = useMemo(() => {
    const all = groups.flatMap(g => g.rows);
    const total = all.length;
    const filled = all.filter(r => r.status !== "empty").length;
    const empty = total - filled;
    const achieved = all.filter(r => r.status === "achieved").length;
    const notAchieved = all.filter(r => r.status === "not_achieved").length;
    const completion = total ? Math.round((filled / total) * 100) : 0;
    const achievementRate = filled ? Math.round((achieved / filled) * 100) : 0;
    return { total, filled, empty, achieved, notAchieved, completion, achievementRate };
  }, [groups]);

  // Multi-month data aggregation
  const multiMonthExportGroups = useMemo(() => {
    if (!multiMonthMode || selectedMonths.length === 0) return [];

    const map = new Map<string, ExportGroup>();
    
    filteredStudents.forEach(st => {
      const key = `${st.kelas}-${st.rombel}`;
      if (!map.has(key)) {
        map.set(key, { kelas: st.kelas, rombel: st.rombel, reports: [] });
      }

      const studentReports = reports.filter(
        r => r.student_id === st.id && 
             selectedMonths.includes(r.month) && 
             r.year === selectedYear
      );

      const monthlyData = selectedMonths
        .map(m => {
          const rep = studentReports.find(r => r.month === m);
          return {
            month: MONTH_NAMES[m - 1],
            year: selectedYear,
            startPage: rep?.start_page || 0,
            endPage: rep?.end_page || 0,
            pagesRead: rep?.pages_read || 0,
            targetPages: rep?.target_pages || 0,
            iqraLevel: rep?.iqra_level || null,
            endIqraLevel: (rep as any)?.end_iqra_level || null,
            attendancePercentage: rep?.attendance_percentage || 0,
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

      const aggregated: AggregatedReport = {
        studentId: st.id,
        nama: st.nama,
        kelas: st.kelas,
        rombel: st.rombel,
        level: st.level,
        program: getProgramLabel(st.level),
        months: monthlyData.map(m => m.month),
        startPage: monthlyData[0]?.startPage || 0,
        endPage: monthlyData[monthlyData.length - 1]?.endPage || 0,
        totalPages,
        totalTarget,
        averageAttendance: avgAttendance,
        status,
        guru: studentReports[0]?.created_by ? `${studentReports[0].created_by}`.substring(0, 50) : '-',
        catatan: monthlyData.map(m => m.notes).filter(Boolean).join(' | '),
      };

      map.get(key)!.reports.push(aggregated);
    });

    return Array.from(map.values())
      .map(g => ({
        ...g,
        reports: g.reports.sort((a, b) => a.nama.localeCompare(b.nama))
      }))
      .sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [multiMonthMode, selectedMonths, selectedYear, filteredStudents, reports]);

  // Multi-month stats
  const multiMonthStats = useMemo(() => {
    if (!multiMonthExportGroups.length) return null;

    const all = multiMonthExportGroups.flatMap(g => g.reports);
    const total = all.length;
    const filled = all.filter(r => r.status !== "empty").length;
    const empty = total - filled;
    const achieved = all.filter(r => r.status === "achieved").length;
    const partial = all.filter(r => r.status === "partial").length;
    const totalPages = all.reduce((sum, r) => sum + r.totalPages, 0);
    const avgAttendance = filled > 0 
      ? Math.round(all.reduce((sum, r) => sum + r.averageAttendance, 0) / filled)
      : 0;

    return { total, filled, empty, achieved, partial, totalPages, avgAttendance };
  }, [multiMonthExportGroups]);

  const exportMultiMonthPDF = async () => {
    if (multiMonthExportGroups.length === 0) {
      toast({ title: "Tidak ada data untuk dicetak", variant: "destructive" });
      return;
    }

    try {
      await generateMultiMonthPDF(
        multiMonthExportGroups,
        selectedMonths,
        selectedYear,
        settings || {}
      );
      toast({ title: "PDF berhasil diunduh ✅" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error mengekspor PDF", variant: "destructive" });
    }
  };

  const exportMultiMonthExcel = () => {
    if (multiMonthExportGroups.length === 0) {
      toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }

    try {
      generateMultiMonthExcel(
        multiMonthExportGroups,
        selectedMonths,
        selectedYear,
        settings || {}
      );
      toast({ title: "Excel berhasil diunduh ✅" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error mengekspor Excel", variant: "destructive" });
    }
  };

  if (ls || lr) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Rekap Laporan Bulanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Tahsin Dasar, Tahsin Lanjutan & Tahfizh — siap export PDF & Excel
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant={multiMonthMode ? "default" : "outline"}
            className="gap-2 text-xs sm:text-sm"
            onClick={() => {
              setMultiMonthMode(!multiMonthMode);
              if (!multiMonthMode) {
                setSelectedMonths([]);
              }
            }}
          >
            <Calendar className="w-4 h-4" />
            {multiMonthMode ? "Mode Multi-Bulan" : "Multi-Bulan"}
          </Button>
        </div>
      </div>

      {/* Multi-Month Mode */}
      {multiMonthMode && (
        <div className="space-y-4">
          <MultiMonthExportFilters
            onMonthsChange={setSelectedMonths}
            onYearChange={setSelectedYear}
            selectedMonths={selectedMonths}
            selectedYear={selectedYear}
          />

          {selectedMonths.length > 0 && multiMonthExportGroups.length > 0 && (
            <>
              {/* Multi-Month Stats */}
              {multiMonthStats && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <StatCard
                    icon={<Users className="w-4 h-4" />}
                    label="Total Siswa"
                    value={multiMonthStats.total}
                    color="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Tercapai"
                    value={multiMonthStats.achieved}
                    color="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Sebagian"
                    value={multiMonthStats.partial}
                    color="bg-amber-50 text-amber-700"
                  />
                  <StatCard
                    icon={<FileWarning className="w-4 h-4" />}
                    label="Belum Diisi"
                    value={multiMonthStats.empty}
                    color="bg-rose-50 text-rose-700"
                  />
                  <StatCard
                    icon={<Percent className="w-4 h-4" />}
                    label="Kehadiran"
                    value={`${multiMonthStats.avgAttendance}%`}
                    color="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    icon={<ListChecks className="w-4 h-4" />}
                    label="Total Hal."
                    value={multiMonthStats.totalPages}
                    color="bg-indigo-50 text-indigo-700"
                  />
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm"
                  onClick={exportMultiMonthExcel}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
                <Button
                  className="gap-2 text-xs sm:text-sm"
                  onClick={exportMultiMonthPDF}
                >
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </div>

              {/* Multi-Month Tables */}
              {multiMonthExportGroups.map(grp => (
                <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden">
                  <CardHeader className="bg-blue-50 py-3">
                    <CardTitle className="text-sm text-blue-900">
                      Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
                      <Badge variant="outline" className="ml-2 bg-white">
                        {grp.reports.length} siswa
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-muted/80">
                          <tr className="text-left">
                            <th className="px-2 py-2 w-8">No</th>
                            <th className="px-2 py-2 min-w-[120px]">Nama</th>
                            <th className="px-2 py-2">Program</th>
                            <th className="px-2 py-2">Bulan</th>
                            <th className="px-2 py-2 text-center">Total Hal</th>
                            <th className="px-2 py-2 text-center">Target</th>
                            <th className="px-2 py-2 text-center">Kehadiran %</th>
                            <th className="px-2 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grp.reports.map((row, idx) => {
                            const empty = row.status === "empty";
                            return (
                              <tr
                                key={row.studentId}
                                className={`border-t ${empty ? "bg-rose-50/60" : "hover:bg-muted/40"}`}
                              >
                                <td className="px-2 py-2">{idx + 1}</td>
                                <td className="px-2 py-2 font-medium">
                                  {highlight(row.nama, search)}
                                </td>
                                <td className="px-2 py-2">{row.program}</td>
                                <td className="px-2 py-2 text-xs">
                                  {row.months.join(" / ")}
                                </td>
                                <td className="px-2 py-2 text-center font-bold">
                                  {empty ? "-" : row.totalPages}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {empty ? "-" : row.totalTarget}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {empty ? "-" : `${row.averageAttendance}%`}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {row.status === "achieved" && (
                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                                      Tercapai
                                    </Badge>
                                  )}
                                  {row.status === "partial" && (
                                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                      Sebagian
                                    </Badge>
                                  )}
                                  {row.status === "not_achieved" && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      Belum
                                    </Badge>
                                  )}
                                  {empty && (
                                    <Badge className="bg-rose-200 text-rose-900 text-[10px]">
                                      Belum diisi
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {selectedMonths.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Silakan pilih bulan untuk menampilkan data
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Single Month Mode */}
      {!multiMonthMode && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total Siswa"
              value={stats.total}
              color="bg-blue-50 text-blue-700"
            />
            <StatCard
              icon={<ListChecks className="w-4 h-4" />}
              label="Sudah Diisi"
              value={stats.filled}
              color="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              icon={<FileWarning className="w-4 h-4" />}
              label="Belum Diisi"
              value={stats.empty}
              color="bg-rose-50 text-rose-700"
            />
            <StatCard
              icon={<Percent className="w-4 h-4" />}
              label="Kelengkapan"
              value={`${stats.completion}%`}
              color="bg-amber-50 text-amber-700"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Target Tercapai"
              value={`${stats.achievementRate}%`}
              color="bg-violet-50 text-violet-700"
            />
          </div>

          {stats.empty > 0 && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Masih ada <strong>{stats.empty} siswa</strong> yang belum diisi laporannya untuk periode ini.
              </span>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Cari Siswa</Label>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-7 h-9"
                    placeholder="Nama siswa..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Kelas</Label>
                <Select value={filterKelas} onValueChange={setFilterKelas}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(k => (
                      <SelectItem key={k} value={String(k)}>
                        Kelas {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rombel</Label>
                <Select value={filterRombel} onValueChange={setFilterRombel}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {["A", "B", "C", "D"].map(r => (
                      <SelectItem key={r} value={r}>
                        Rombel {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Bulan</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tahun</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status Isi</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as any)}
                >
                  <SelectTrigger
                    className={`h-9 ${
                      filterStatus === "empty"
                        ? "border-rose-400 text-rose-700"
                        : filterStatus === "filled"
                        ? "border-emerald-400 text-emerald-700"
                        : ""
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="filled">✅ Sudah Diisi</SelectItem>
                    <SelectItem value="empty">⚠️ Belum Diisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tables grouped per rombel */}
          {displayGroups.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Tidak ada siswa pada filter ini.
              </CardContent>
            </Card>
          )}
          {displayGroups.map(grp => (
            <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden">
              <CardHeader className="bg-emerald-50 py-3">
                <CardTitle className="text-sm text-emerald-900">
                  Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
                  <Badge variant="outline" className="ml-2 bg-white">
                    {grp.rows.length} siswa
                  </Badge>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-white text-rose-700 border-rose-200"
                  >
                    {grp.rows.filter(r => r.status === "empty").length} belum diisi
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr className="text-left">
                        <th className="px-2 py-2 w-8">No</th>
                        <th className="px-2 py-2 min-w-[140px]">Nama</th>
                        <th className="px-2 py-2">Program</th>
                        <th className="px-2 py-2">Level</th>
                        <th className="px-2 py-2 text-center">Awal</th>
                        <th className="px-2 py-2 text-center">Akhir</th>
                        <th className="px-2 py-2 text-center">Total</th>
                        <th className="px-2 py-2 text-center">Target</th>
                        <th className="px-2 py-2 text-center">Status</th>
                        <th className="px-2 py-2">Guru</th>
                        <th className="px-2 py-2 min-w-[200px]">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grp.rows.map(row => {
                        const empty = row.status === "empty";
                        return (
                          <tr
                            key={row.studentId}
                            className={`border-t ${
                              empty
                                ? "bg-rose-50/60"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <td className="px-2 py-2">{row.no}</td>
                            <td className="px-2 py-2 font-medium">
                              {highlight(row.nama, search)}
                            </td>
                            <td className="px-2 py-2">{row.program}</td>
                            <td className="px-2 py-2">
                              <Badge
                                className={`text-[10px] ${
                                  LEVEL_COLORS[row.level as ReadingLevel] || ""
                                }`}
                              >
                                {row.level}
                              </Badge>
                            </td>
                            <td className="px-2 py-2 text-center">{row.awal}</td>
                            <td className="px-2 py-2 text-center">{row.akhir}</td>
                            <td className="px-2 py-2 text-center font-bold">
                              {empty ? "-" : row.total}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {empty ? "-" : row.target}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {row.status === "achieved" && (
                                <Badge className="bg-emerald-100 text-emerald-800">
                                  Tercapai
                                </Badge>
                              )}
                              {row.status === "not_achieved" && (
                                <Badge variant="destructive">Belum</Badge>
                              )}
                              {empty && (
                                <Badge className="bg-rose-200 text-rose-900">
                                  Belum diisi
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {row.guru}
                            </td>
                            <td className="px-2 py-2 whitespace-pre-wrap text-muted-foreground">
                              {row.catatan || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) => (
  <Card>
    <CardContent className="p-3">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const highlight = (text: string, q: string) => {
  if (!q.trim()) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="bg-yellow-200 px-0.5 rounded">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

export default RecapReport;
