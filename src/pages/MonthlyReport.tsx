import { useState, useMemo, useCallback } from "react";
import { useStudents, useUpdateStudent, isTahsinDasar, IQRO_LEVELS, LEVEL_COLORS, LEVELS } from "@/hooks/useSupabaseData";
import { useProfileMap } from "@/hooks/useProfiles";
import {
  useAllMonthlyReports, useAddMonthlyReport, useDeleteMonthlyReport, useUpdateMonthlyReport,
  getAchievementStatus, getValidIqraPage, MONTH_NAMES, calcIqraPagesRead
} from "@/hooks/useMonthlyReports";
import { useAllAttendance, useUpsertAttendance } from "@/hooks/useAttendance";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Plus, FileText, Loader2, Trash2, CheckCircle2, XCircle, Filter, Users, Pencil, Save, X,
  AlertTriangle, Search, UserCheck, Thermometer, HandHeart, UserX, CalendarCheck
} from "lucide-react";
import BulkMonthlyReportForm from "@/components/BulkMonthlyReportForm";
import MonthlyReportExport from "@/components/MonthlyReportExport";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const TARGET_IQRA = 15;
const TARGET_TAHSIN = 100;
const getTarget = (programType: string) => programType === "tahsin" ? TARGET_TAHSIN : TARGET_IQRA;

const IQRA_PAGES = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 1, 4-32

const YEARS = [2026, 2027, 2028, 2029, 2030];

const MonthlyReport = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: reports = [], isLoading: loadingReports } = useAllMonthlyReports();
  const { data: attendance = [], isLoading: loadingAtt } = useAllAttendance();
  const addReport = useAddMonthlyReport();
  const deleteReport = useDeleteMonthlyReport();
  const updateReport = useUpdateMonthlyReport();
  const updateStudent = useUpdateStudent();
  const upsertAttendance = useUpsertAttendance();
  const profileMap = useProfileMap();

  // === Form state ===
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [searchName, setSearchName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(2026);
  const [startIqraLevel, setStartIqraLevel] = useState("1");
  const [endIqraLevel, setEndIqraLevel] = useState("1");
  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("1");
  const [notes, setNotes] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  // Attendance fields
  const [attPresent, setAttPresent] = useState(0);
  const [attSick, setAttSick] = useState(0);
  const [attPermission, setAttPermission] = useState(0);
  const [attAbsent, setAttAbsent] = useState(0);

  // Level change confirmation
  const [levelConfirmOpen, setLevelConfirmOpen] = useState(false);
  const [pendingLevelChange, setPendingLevelChange] = useState<{ studentId: string; oldLevel: string; newLevel: string } | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ start_page: number; end_page: number; notes: string }>({ start_page: 1, end_page: 1, notes: "" });

  // Filters for history
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Bulk dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // === Derived ===
  const studentsInKelas = useMemo(() => {
    if (!selectedKelas) return [];
    let s = students.filter(st => st.kelas === Number(selectedKelas));
    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      s = s.filter(st => st.nama.toLowerCase().includes(q));
    }
    return s.sort((a, b) => a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama));
  }, [students, selectedKelas, searchName]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const effectiveLevel = (selectedLevel || selectedStudent?.level || "Iqro 1") as ReadingLevel;
  const programType = isTahsinDasar(effectiveLevel) ? "iqra" : "tahsin";
  const isIqra = programType === "iqra";
  const target = getTarget(programType);

  const validStart = isIqra ? getValidIqraPage(Number(startPage)) : Number(startPage);
  const validEnd = isIqra ? getValidIqraPage(Number(endPage)) : Number(endPage);
  const pagesRead = isIqra
    ? calcIqraPagesRead(Number(startIqraLevel), validStart, Number(endIqraLevel), validEnd)
    : Math.max(0, validEnd - validStart);
  const status = getAchievementStatus(pagesRead, target);

  const getProgramLabel = (level: string) => {
    if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
    if (level === "Tahsin Dasar") return "Tahsin Dasar";
    if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
    if (level === "Tahfizh") return "Tahfizh";
    return level;
  };

  // History filters
  const filteredReports = useMemo(() => {
    let r = reports;
    if (filterKelas !== "all") r = r.filter(rep => (rep as any).students?.kelas === Number(filterKelas));
    if (filterMonth !== "all") r = r.filter(rep => rep.month === Number(filterMonth));
    return r;
  }, [reports, filterKelas, filterMonth]);

  const filteredAttendance = useMemo(() => {
    let a = attendance;
    if (filterKelas !== "all") a = a.filter(att => (att as any).students?.kelas === Number(filterKelas));
    if (filterMonth !== "all") a = a.filter(att => att.month === Number(filterMonth));
    return a;
  }, [attendance, filterKelas, filterMonth]);

  // === Handlers ===
  const resetForm = () => {
    setSelectedStudentId("");
    setSelectedLevel("");
    setStartPage("1");
    setEndPage("1");
    setNotes("");
    setStartIqraLevel("1");
    setEndIqraLevel("1");
    setAttPresent(0);
    setAttSick(0);
    setAttPermission(0);
    setAttAbsent(0);
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setSelectedLevel("");
    const st = students.find(s => s.id === id);
    if (st && IQRO_LEVELS.includes(st.level as ReadingLevel)) {
      const num = st.level.replace("Iqro ", "");
      setStartIqraLevel(num);
      setEndIqraLevel(num);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast({ title: "Pilih siswa terlebih dahulu", variant: "destructive" });
      return;
    }
    if (validEnd < validStart) {
      toast({ title: "Halaman akhir tidak boleh lebih kecil dari halaman awal", variant: "destructive" });
      return;
    }

    const hasLevelChange = selectedStudent && selectedLevel && selectedLevel !== selectedStudent.level;

    try {
      // Save monthly report
      await addReport.mutateAsync({
        student_id: selectedStudentId,
        month, year,
        program_type: programType,
        iqra_level: isIqra ? `Iqro ${startIqraLevel}` : null,
        end_iqra_level: isIqra ? `Iqro ${endIqraLevel}` : null,
        start_page: validStart,
        end_page: validEnd,
        pages_read: pagesRead,
        target_pages: target,
        achievement_status: status,
        notes,
      });

      // Save attendance if any value > 0
      if (attPresent > 0 || attSick > 0 || attPermission > 0 || attAbsent > 0) {
        await upsertAttendance.mutateAsync({
          student_id: selectedStudentId,
          month, year,
          present: attPresent,
          sick: attSick,
          permission: attPermission,
          absent: attAbsent,
        });
      }

      if (hasLevelChange && selectedStudent) {
        setPendingLevelChange({
          studentId: selectedStudent.id,
          oldLevel: selectedStudent.level,
          newLevel: selectedLevel,
        });
        setLevelConfirmOpen(true);
      }

      toast({ title: "Laporan & Absensi berhasil disimpan ✅" });
      resetForm();
    } catch (e: any) {
      if (e.message?.includes("duplicate") || e.message?.includes("unique")) {
        toast({ title: "Laporan untuk bulan ini sudah ada", variant: "destructive" });
      } else {
        toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
      }
    }
  };

  const confirmLevelUpdate = async () => {
    if (!pendingLevelChange) return;
    try {
      await updateStudent.mutateAsync({
        id: pendingLevelChange.studentId,
        level: pendingLevelChange.newLevel as ReadingLevel,
      });
      toast({ title: `Level siswa berhasil diubah ke ${pendingLevelChange.newLevel} ✅` });
    } catch {
      toast({ title: "Gagal mengubah level", variant: "destructive" });
    }
    setLevelConfirmOpen(false);
    setPendingLevelChange(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    await deleteReport.mutateAsync(id);
    toast({ title: "Laporan dihapus" });
  };

  const startEdit = (report: any) => {
    setEditingId(report.id);
    setEditData({ start_page: report.start_page, end_page: report.end_page, notes: report.notes || "" });
  };

  const saveEdit = async (report: any) => {
    const pt = report.program_type;
    const isIq = pt === "iqra";
    const vs = isIq ? getValidIqraPage(editData.start_page) : editData.start_page;
    const ve = isIq ? getValidIqraPage(editData.end_page) : editData.end_page;
    const pr = Math.max(0, ve - vs);
    const st = getAchievementStatus(pr, report.target_pages);
    try {
      await updateReport.mutateAsync({ id: report.id, start_page: vs, end_page: ve, pages_read: pr, achievement_status: st, notes: editData.notes });
      toast({ title: "Laporan diperbarui ✅" });
      setEditingId(null);
    } catch (e: any) {
      toast({ title: "Gagal memperbarui", description: e.message, variant: "destructive" });
    }
  };

  if (loadingStudents || loadingReports || loadingAtt) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Laporan Bulanan & Absensi</h1>
          <p className="text-sm text-muted-foreground">Catat progres bacaan dan kehadiran siswa</p>
        </div>
        <div className="flex gap-2">
          <MonthlyReportExport reports={reports as any} />
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Users className="w-4 h-4" /> Input Massal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Input Laporan Massal</DialogTitle></DialogHeader>
              <BulkMonthlyReportForm onClose={() => setBulkDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input" className="gap-2"><Plus className="w-4 h-4" /> Input Laporan</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><FileText className="w-4 h-4" /> Riwayat</TabsTrigger>
        </TabsList>

        {/* === TAB: INPUT === */}
        <TabsContent value="input" className="space-y-4 mt-4">
          {/* Step 1: Pilih Kelas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                Pilih Kelas & Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 flex-wrap items-end">
                <div className="w-40">
                  <Label className="text-xs">Kelas</Label>
                  <Select value={selectedKelas} onValueChange={v => { setSelectedKelas(v); setSelectedStudentId(""); setSearchName(""); }}>
                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedKelas && (
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs">Cari Nama Siswa</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Ketik nama siswa..."
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedKelas && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {studentsInKelas.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-4">Tidak ada siswa ditemukan</p>
                  ) : (
                    studentsInKelas.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectStudent(s.id)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                          selectedStudentId === s.id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card hover:bg-muted border-border"
                        }`}
                      >
                        <span className="font-medium">{s.nama}</span>
                        <span className="text-xs ml-1 opacity-70">{s.rombel} · {s.level}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Bulan & Tahun */}
          {selectedStudentId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  Periode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Bulan</Label>
                    <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tahun</Label>
                    <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Halaman & Level */}
          {selectedStudentId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  Progres Bacaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Level / Program Override */}
                <div>
                  <Label className="text-xs">Level / Program <span className="text-muted-foreground">(bisa diubah)</span></Label>
                  <Select value={effectiveLevel} onValueChange={v => setSelectedLevel(v)}>
                    <SelectTrigger className={selectedLevel && selectedLevel !== selectedStudent?.level ? "ring-2 ring-amber-400 bg-amber-50" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => (
                        <SelectItem key={l} value={l}>{l} {l === selectedStudent?.level ? "(asal)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLevel && selectedLevel !== selectedStudent?.level && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Level akan diubah permanen setelah konfirmasi
                    </p>
                  )}
                </div>

                {/* Iqra Level + Page Selection */}
                {isIqra && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Start: Level + Page */}
                      <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                        <Label className="text-xs font-semibold text-muted-foreground">📖 Halaman Awal</Label>
                        <div>
                          <Label className="text-xs">Tingkatan Iqra Awal</Label>
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5,6].map(lv => (
                              <button
                                key={lv}
                                onClick={() => {
                                  setStartIqraLevel(String(lv));
                                  if (Number(endIqraLevel) < lv) setEndIqraLevel(String(lv));
                                }}
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                  startIqraLevel === String(lv)
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {lv}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Halaman</Label>
                          <Select value={startPage} onValueChange={setStartPage}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {IQRA_PAGES.map(p => <SelectItem key={p} value={String(p)}>Halaman {p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* End: Level + Page */}
                      <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                        <Label className="text-xs font-semibold text-muted-foreground">📕 Halaman Akhir</Label>
                        <div>
                          <Label className="text-xs">Tingkatan Iqra Akhir</Label>
                          <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5,6].map(lv => (
                              <button
                                key={lv}
                                onClick={() => setEndIqraLevel(String(lv))}
                                disabled={lv < Number(startIqraLevel)}
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                  endIqraLevel === String(lv)
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : lv < Number(startIqraLevel)
                                    ? "bg-muted/50 text-muted-foreground/30 cursor-not-allowed"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {lv}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Halaman</Label>
                          <Select value={endPage} onValueChange={setEndPage}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {IQRA_PAGES.map(p => <SelectItem key={p} value={String(p)}>Halaman {p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {startIqraLevel !== endIqraLevel && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Siswa naik level dari <strong>Iqro {startIqraLevel}</strong> ke <strong>Iqro {endIqraLevel}</strong> dalam bulan ini</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Iqra page inputs */}
                {!isIqra && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Halaman Awal</Label>
                      <Input type="number" min={1} value={startPage} onChange={e => setStartPage(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Halaman Akhir</Label>
                      <Input type="number" min={1} value={endPage} onChange={e => setEndPage(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Summary */}
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
                  <Label className="text-xs">Catatan Guru</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan perkembangan siswa..." rows={2} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Absensi */}
          {selectedStudentId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                  <CalendarCheck className="w-4 h-4" /> Kehadiran / Absensi Bulan Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="flex items-center gap-1 text-xs"><UserCheck className="w-3 h-3 text-emerald-500" /> Hadir</Label>
                    <Input type="number" min={0} value={attPresent} onChange={e => setAttPresent(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs"><Thermometer className="w-3 h-3 text-amber-500" /> Sakit</Label>
                    <Input type="number" min={0} value={attSick} onChange={e => setAttSick(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs"><HandHeart className="w-3 h-3 text-blue-500" /> Izin</Label>
                    <Input type="number" min={0} value={attPermission} onChange={e => setAttPermission(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs"><UserX className="w-3 h-3 text-red-500" /> Alfa</Label>
                    <Input type="number" min={0} value={attAbsent} onChange={e => setAttAbsent(Number(e.target.value))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {selectedStudentId && (
            <Button onClick={handleSubmit} disabled={addReport.isPending} className="w-full gap-2 h-12 text-base">
              {addReport.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Laporan & Absensi
            </Button>
          )}
        </TabsContent>

        {/* === TAB: HISTORY === */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-36"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {[1,2,3,4,5,6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Semua Bulan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
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
                        <TableHead>Level</TableHead>
                        <TableHead>Bulan</TableHead>
                        <TableHead className="text-center">Awal</TableHead>
                        <TableHead className="text-center">Akhir</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Target</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="w-20">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map(r => {
                        const st = (r as any).students;
                        const levelColor = st?.level ? (LEVEL_COLORS[st.level as ReadingLevel] ?? "") : "";
                        const isEditing = editingId === r.id;

                        if (isEditing) {
                          const isIq = r.program_type === "iqra";
                          const vs = isIq ? getValidIqraPage(editData.start_page) : editData.start_page;
                          const ve = isIq ? getValidIqraPage(editData.end_page) : editData.end_page;
                          const pr = Math.max(0, ve - vs);
                          const editStatus = getAchievementStatus(pr, r.target_pages);
                          return (
                            <TableRow key={r.id} className="bg-primary/5">
                              <TableCell className="font-medium">{st?.nama ?? "-"}</TableCell>
                              <TableCell>{st?.kelas ?? "-"}{st?.rombel ?? ""}</TableCell>
                              <TableCell><Badge className={`text-xs ${levelColor}`}>{st?.level ?? r.iqra_level ?? r.program_type}</Badge></TableCell>
                              <TableCell>{MONTH_NAMES[r.month - 1]} {r.year}</TableCell>
                              <TableCell><Input type="number" className="h-8 w-16 text-center text-sm" value={editData.start_page} onChange={e => setEditData(d => ({...d, start_page: Number(e.target.value)}))} /></TableCell>
                              <TableCell><Input type="number" className="h-8 w-16 text-center text-sm" value={editData.end_page} onChange={e => setEditData(d => ({...d, end_page: Number(e.target.value)}))} /></TableCell>
                              <TableCell className="text-center font-bold">{pr}</TableCell>
                              <TableCell className="text-center">{r.target_pages}</TableCell>
                              <TableCell className="text-center">{editStatus === "achieved" ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-destructive mx-auto" />}</TableCell>
                              <TableCell><Input className="h-8 text-sm min-w-[80px]" value={editData.notes} onChange={e => setEditData(d => ({...d, notes: e.target.value}))} /></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEdit(r)}><Save className="w-4 h-4 text-emerald-600" /></Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{st?.nama ?? "-"}</TableCell>
                            <TableCell>{st?.kelas ?? "-"}{st?.rombel ?? ""}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${levelColor}`}>
                                {r.iqra_level || r.program_type}
                                {(r as any).end_iqra_level && (r as any).end_iqra_level !== r.iqra_level && ` → ${(r as any).end_iqra_level}`}
                              </Badge>
                            </TableCell>
                            <TableCell>{MONTH_NAMES[r.month - 1]} {r.year}</TableCell>
                            <TableCell className="text-center">{r.iqra_level ? `${r.iqra_level} hal.${r.start_page}` : r.start_page}</TableCell>
                            <TableCell className="text-center">{(r as any).end_iqra_level ? `${(r as any).end_iqra_level} hal.${r.end_page}` : r.end_page}</TableCell>
                            <TableCell className="text-center font-bold">{r.pages_read}</TableCell>
                            <TableCell className="text-center">{r.target_pages}</TableCell>
                            <TableCell className="text-center">
                              {r.achievement_status === "achieved" ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-destructive mx-auto" />}
                            </TableCell>
                            <TableCell className="max-w-[150px] text-xs text-muted-foreground">
                              <div className="truncate">{r.notes || "-"}</div>
                              {r.created_by && profileMap.get(r.created_by) && (
                                <div className="text-[10px] text-primary/70 mt-0.5">👤 {profileMap.get(r.created_by)}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(r)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                              </div>
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

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" /> Riwayat Absensi ({filteredAttendance.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada data absensi</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Bulan</TableHead>
                        <TableHead className="text-center">Hadir</TableHead>
                        <TableHead className="text-center">Sakit</TableHead>
                        <TableHead className="text-center">Izin</TableHead>
                        <TableHead className="text-center">Alfa</TableHead>
                        <TableHead>Dicatat oleh</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendance.map(a => {
                        const st = (a as any).students;
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{st?.nama ?? "-"}</TableCell>
                            <TableCell>{st?.kelas ?? "-"}{st?.rombel ?? ""}</TableCell>
                            <TableCell>{MONTH_NAMES[a.month - 1]} {a.year}</TableCell>
                            <TableCell className="text-center text-emerald-600 font-bold">{a.present}</TableCell>
                            <TableCell className="text-center text-amber-600 font-bold">{a.sick}</TableCell>
                            <TableCell className="text-center text-blue-600 font-bold">{a.permission}</TableCell>
                            <TableCell className="text-center text-red-600 font-bold">{a.absent}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {a.created_by && profileMap.get(a.created_by) ? <span>👤 {profileMap.get(a.created_by)}</span> : "-"}
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
        </TabsContent>
      </Tabs>

      {/* Level Change Confirmation */}
      <Dialog open={levelConfirmOpen} onOpenChange={setLevelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Ubah Level Siswa?</DialogTitle>
          </DialogHeader>
          {pendingLevelChange && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Apakah ingin mengubah level secara <strong>permanen</strong>?</p>
              <div className="flex items-center justify-center gap-3 py-2">
                <Badge variant="outline">{pendingLevelChange.oldLevel}</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge className="bg-amber-100 text-amber-800">{pendingLevelChange.newLevel}</Badge>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setLevelConfirmOpen(false); setPendingLevelChange(null); }}>Tidak</Button>
            <Button onClick={confirmLevelUpdate} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <CheckCircle2 className="w-4 h-4" /> Ya, Ubah Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyReport;
