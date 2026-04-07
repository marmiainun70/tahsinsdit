import { useState, useMemo } from "react";
import { useStudents, isTahsinDasar, IQRO_LEVELS, LEVEL_COLORS, LEVELS } from "@/hooks/useSupabaseData";
import {
  useAllMonthlyReports, useAddMonthlyReport, useDeleteMonthlyReport,
  getTarget, getAchievementStatus, getValidIqraPage, MONTH_NAMES
} from "@/hooks/useMonthlyReports";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, Loader2, Trash2, CheckCircle2, XCircle, Filter, Users } from "lucide-react";
import BulkMonthlyReportForm from "@/components/BulkMonthlyReportForm";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const IQRO_LEVELS_LIST = ["Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6"];

const MonthlyReport = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: reports = [], isLoading: loadingReports } = useAllMonthlyReports();
  const addReport = useAddMonthlyReport();
  const deleteReport = useDeleteMonthlyReport();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  // Filters
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const effectiveLevel = (selectedLevel || selectedStudent?.level || "Iqro 1") as ReadingLevel;
  const programType = isTahsinDasar(effectiveLevel) ? "iqra" : "tahsin";
  const iqraLevel = IQRO_LEVELS.includes(effectiveLevel) ? effectiveLevel : null;
  const target = getTarget(programType);

  const validStart = programType === "iqra" ? getValidIqraPage(startPage) : startPage;
  const validEnd = programType === "iqra" ? getValidIqraPage(endPage) : endPage;
  const pagesRead = Math.max(0, validEnd - validStart);
  const status = getAchievementStatus(pagesRead, target);

  const getProgramLabel = (level: string) => {
    if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
    if (level === "Tahsin Dasar") return "Tahsin Dasar";
    if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
    if (level === "Tahfizh") return "Tahfizh";
    return level;
  };

  const filteredReports = useMemo(() => {
    let r = reports;
    if (filterKelas !== "all") r = r.filter(rep => (rep as any).students?.kelas === Number(filterKelas));
    if (filterMonth !== "all") r = r.filter(rep => rep.month === Number(filterMonth));
    if (filterLevel !== "all") r = r.filter(rep => (rep as any).students?.level === filterLevel);
    return r;
  }, [reports, filterKelas, filterMonth, filterLevel]);

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast({ title: "Pilih siswa terlebih dahulu", variant: "destructive" });
      return;
    }
    if (validEnd < validStart) {
      toast({ title: "Halaman akhir tidak boleh lebih kecil dari halaman awal", variant: "destructive" });
      return;
    }
    if (programType === "iqra" && validEnd > 32) {
      toast({ title: "Halaman Iqra maksimal 32", variant: "destructive" });
      return;
    }

    try {
      await addReport.mutateAsync({
        student_id: selectedStudentId,
        month,
        year,
        program_type: programType,
        iqra_level: iqraLevel,
        start_page: validStart,
        end_page: validEnd,
        pages_read: pagesRead,
        target_pages: target,
        achievement_status: status,
        notes,
      });
      toast({ title: "Laporan berhasil disimpan ✅" });
      setDialogOpen(false);
      resetForm();
    } catch (e: any) {
      if (e.message?.includes("duplicate") || e.message?.includes("unique")) {
        toast({ title: "Laporan untuk bulan ini sudah ada", description: "Tidak boleh input laporan bulan yang sama dua kali", variant: "destructive" });
      } else {
        toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
      }
    }
  };

  const resetForm = () => {
    setSelectedStudentId("");
    setStartPage(1);
    setEndPage(1);
    setNotes("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    await deleteReport.mutateAsync(id);
    toast({ title: "Laporan dihapus" });
  };

  if (loadingStudents || loadingReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Laporan Bulanan</h1>
          <p className="text-sm text-muted-foreground">Catat progres bacaan siswa setiap bulan</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" /> Input Massal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Input Laporan Massal</DialogTitle>
              </DialogHeader>
              <BulkMonthlyReportForm onClose={() => setBulkDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Buat Laporan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buat Laporan Bulanan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pilih Siswa</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger><SelectValue placeholder="Pilih siswa..." /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nama} — Kelas {s.kelas}{s.rombel} ({s.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Bulan</Label>
                    <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tahun</Label>
                    <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedStudent && (
                  <div className="p-3 bg-muted rounded-xl space-y-1 text-sm">
                    <p><span className="font-medium">Program:</span> {getProgramLabel(selectedStudent.level)}</p>
                    <p><span className="font-medium">Level:</span> {selectedStudent.level}</p>
                    <p><span className="font-medium">Target:</span> {target} {programType === "iqra" ? "halaman" : "baris"}/bulan</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Halaman Awal</Label>
                    <Input type="number" min={1} max={programType === "iqra" ? 32 : 999}
                      value={startPage} onChange={e => setStartPage(Number(e.target.value))} />
                    {programType === "iqra" && startPage >= 2 && startPage <= 3 && (
                      <p className="text-xs text-amber-600 mt-1">⚠ Halaman 2-3 tidak ada, otomatis ke halaman 4</p>
                    )}
                  </div>
                  <div>
                    <Label>Halaman Akhir</Label>
                    <Input type="number" min={1} max={programType === "iqra" ? 32 : 999}
                      value={endPage} onChange={e => setEndPage(Number(e.target.value))} />
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-xl grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Halaman</p>
                    <p className="text-lg font-bold text-foreground">{pagesRead}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Target</p>
                    <p className="text-lg font-bold text-foreground">{target}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge variant={status === "achieved" ? "default" : "destructive"} className="mt-1">
                      {status === "achieved" ? "Tercapai ✅" : "Belum Tercapai"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Catatan Guru</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Catatan perkembangan siswa..." rows={3} />
                </div>

                <Button onClick={handleSubmit} disabled={addReport.isPending} className="w-full gap-2">
                  {addReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Simpan Laporan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterKelas} onValueChange={setFilterKelas}>
          <SelectTrigger className="w-36">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {[1, 2, 3, 4, 5, 6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Level</SelectItem>
            {IQRO_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            <SelectItem value="Tahsin Lanjutan">Tahsin Lanjutan</SelectItem>
            <SelectItem value="Tahfizh">Tahfizh</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Laporan ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada laporan</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-center">Hal. Awal</TableHead>
                    <TableHead className="text-center">Hal. Akhir</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Target</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map(r => {
                    const st = (r as any).students;
                    const levelColor = st?.level ? (LEVEL_COLORS[st.level as ReadingLevel] ?? "") : "";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{st?.nama ?? "-"}</TableCell>
                        <TableCell>{st?.kelas ?? "-"}{st?.rombel ?? ""}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {st?.level ? getProgramLabel(st.level) : (r.program_type === "iqra" ? "Iqra" : "Tahsin")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${levelColor}`}>
                            {st?.level ?? (r.iqra_level || r.program_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{MONTH_NAMES[r.month - 1]} {r.year}</TableCell>
                        <TableCell className="text-center">{r.start_page}</TableCell>
                        <TableCell className="text-center">{r.end_page}</TableCell>
                        <TableCell className="text-center font-bold">{r.pages_read}</TableCell>
                        <TableCell className="text-center">{r.target_pages}</TableCell>
                        <TableCell className="text-center">
                          {r.achievement_status === "achieved" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{r.notes || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReport;
