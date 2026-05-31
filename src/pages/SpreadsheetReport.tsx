import { useState, useMemo, useEffect, useCallback } from "react";
import { useStudents, IQRO_LEVELS, isTahsinDasar } from "@/hooks/useSupabaseData";
import {
  useAllMonthlyReports, useAddMonthlyReport, useUpdateMonthlyReport,
  MONTH_NAMES, calcIqraPagesSigned, getProgressStatus, getTarget,
  isIqraDecline, getAutoNoteByProgress, getAutoNoteOptions,
} from "@/hooks/useMonthlyReports";
import { useAllAttendance, useUpsertAttendance } from "@/hooks/useAttendance";
import { JUZ_LIST, JUZ_PAGES_PER_JUZ, calcHafalanPagesSigned, isTahfizhDecline } from "@/lib/juzData";
import { useEnsureTeacherStudent } from "@/hooks/useTeacherStudents";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { NOTE_EMOTICON_WARNING, hasBlockedNoteEmoticon, removeBlockedNoteEmoticons } from "@/lib/noteValidation";
import { Save, Plus, Minus, Loader2, FileSpreadsheet, MessageSquarePlus, CheckCircle2, AlertTriangle, TrendingDown, Pause } from "lucide-react";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ROMBELS = ["A", "B", "C", "D"];
const KELAS_LIST = [1, 2, 3, 4, 5, 6];
const PROGRAMS = [
  { value: "iqra", label: "Iqra (Tahsin Dasar)" },
  { value: "tahsin", label: "Tahsin Lanjutan" },
  { value: "tahfizh", label: "Tahfizh" },
];

const IQRA_PAGES = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 1, 4..32
const TAHSIN_LANJUTAN_PAGES = 200; // halaman bebas

const programLevels = (program: string): string[] => {
  if (program === "iqra") return ["1", "2", "3", "4", "5", "6"];
  if (program === "tahsin") return ["Tahsin Lanjutan"];
  return JUZ_LIST.map(String); // tahfizh
};

const formatLevel = (program: string, lvl: string): string => {
  if (program === "iqra") return `Iqro ${lvl}`;
  if (program === "tahfizh") return `Juz ${lvl}`;
  return lvl;
};

const detectProgramFromLevel = (level: ReadingLevel | string | null | undefined): "iqra" | "tahsin" | "tahfizh" => {
  if (!level) return "iqra";
  if (level === "Tahfizh") return "tahfizh";
  if (level === "Tahsin Lanjutan") return "tahsin";
  if (isTahsinDasar(level as ReadingLevel)) return "iqra";
  return "iqra";
};

const calcSigned = (program: string, sl: string, sp: number, el: string, ep: number): number => {
  if (program === "tahfizh") return calcHafalanPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  if (program === "iqra") return calcIqraPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  return ep - sp;
};

const isDecline = (program: string, sl: string, sp: number, el: string, ep: number): boolean => {
  if (program === "tahfizh") return isTahfizhDecline(parseInt(sl), sp, parseInt(el), ep);
  if (program === "iqra") return isIqraDecline(parseInt(sl), sp, parseInt(el), ep);
  return ep < sp;
};

const stepPage = (program: string, cur: number, dir: 1 | -1): number => {
  if (program === "iqra") {
    const idx = IQRA_PAGES.indexOf(cur);
    const newIdx = Math.max(0, Math.min(IQRA_PAGES.length - 1, idx + dir));
    return IQRA_PAGES[newIdx] ?? cur;
  }
  if (program === "tahfizh") return Math.max(1, Math.min(JUZ_PAGES_PER_JUZ, cur + dir));
  return Math.max(1, Math.min(TAHSIN_LANJUTAN_PAGES, cur + dir));
};

interface Row {
  studentId: string;
  studentName: string;
  studentLevel: ReadingLevel;
  reportId?: string;
  attendanceId?: string;
  program: "iqra" | "tahsin" | "tahfizh";
  startLevel: string;
  startPage: number;
  endLevel: string;
  endPage: number;
  notes: string;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  dirty: boolean;
  saving: boolean;
}

const SpreadsheetReport = () => {
  const { profile } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: reports = [] } = useAllMonthlyReports();
  const { data: attendance = [] } = useAllAttendance();
  const addReport = useAddMonthlyReport();
  const updateReport = useUpdateMonthlyReport();
  const upsertAttendance = useUpsertAttendance();
  const ensureTS = useEnsureTeacherStudent();

  const [kelas, setKelas] = useState<string>("1");
  const [rombel, setRombel] = useState("A");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [savingAll, setSavingAll] = useState(false);

  const filteredStudents = useMemo(
    () => students.filter(s => s.kelas === parseInt(kelas) && s.rombel === rombel),
    [students, kelas, rombel],
  );

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const newRows: Row[] = filteredStudents.map(s => {
      const defaultProgram = detectProgramFromLevel(s.level);

      // existing report (any program for this month)
      const existing = (reports as any[]).find(
        r => r.student_id === s.id && r.month === month && r.year === year,
      );
      const program: "iqra" | "tahsin" | "tahfizh" = existing ? existing.program_type : defaultProgram;

      // previous report (same program) for autofill
      const prev = (reports as any[])
        .filter(r => r.student_id === s.id && r.program_type === program)
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .find(r => r.year * 12 + r.month < year * 12 + month);

      const fallbackLvl = program === "tahfizh" ? "30" : program === "iqra" ? "1" : "Tahsin Lanjutan";

      const att = (attendance as any[]).find(
        a => a.student_id === s.id && a.month === month && a.year === year,
      );

      const baseAtt = {
        attendanceId: att?.id,
        present: att?.present ?? 0,
        sick: att?.sick ?? 0,
        permission: att?.permission ?? 0,
        absent: att?.absent ?? 0,
      };

      if (existing) {
        const lvlRaw = (existing.iqra_level || fallbackLvl).replace(/^Iqro /, "").replace(/^Juz /, "");
        const endLvlRaw = (existing.end_iqra_level || existing.iqra_level || fallbackLvl).replace(/^Iqro /, "").replace(/^Juz /, "");
        return {
          studentId: s.id,
          studentName: s.nama,
          studentLevel: s.level as ReadingLevel,
          reportId: existing.id,
          program,
          startLevel: lvlRaw,
          startPage: existing.start_page || 1,
          endLevel: endLvlRaw,
          endPage: existing.end_page || 1,
          notes: existing.notes || "",
          ...baseAtt,
          dirty: false,
          saving: false,
        };
      }

      // autofill from previous month's end
      const prevEndLvlRaw = prev ? ((prev.end_iqra_level || prev.iqra_level || fallbackLvl)).replace(/^Iqro /, "").replace(/^Juz /, "") : fallbackLvl;
      const sl = prevEndLvlRaw;
      const sp = prev ? prev.end_page : 1;
      return {
        studentId: s.id,
        studentName: s.nama,
        studentLevel: s.level as ReadingLevel,
        program,
        startLevel: sl,
        startPage: sp,
        endLevel: sl,
        endPage: sp,
        notes: "",
        ...baseAtt,
        dirty: false,
        saving: false,
      };
    });
    setRows(newRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents.map(s => s.id).join(","), reports.length, attendance.length, month, year]);

  const updateRow = useCallback((idx: number, patch: Partial<Row>) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, ...patch, dirty: true };
      // jika program berubah, reset level default
      if (patch.program && patch.program !== r.program) {
        const fb = patch.program === "tahfizh" ? "30" : patch.program === "iqra" ? "1" : "Tahsin Lanjutan";
        next.startLevel = fb; next.endLevel = fb;
        next.startPage = 1; next.endPage = 1;
      }
      return next;
    }));
  }, []);

  const updateRowNotes = useCallback((idx: number, value: string) => {
    if (hasBlockedNoteEmoticon(value)) {
      toast({ title: NOTE_EMOTICON_WARNING, variant: "destructive" });
      updateRow(idx, { notes: removeBlockedNoteEmoticons(value) });
      return;
    }
    updateRow(idx, { notes: value });
  }, [updateRow]);

  const filledCount = rows.filter(r => r.reportId).length;
  const totalRows = rows.length;
  const progressPct = totalRows ? Math.round((filledCount / totalRows) * 100) : 0;

  const buildAutoNote = (r: Row): string => {
    const signed = calcSigned(r.program, r.startLevel, r.startPage, r.endLevel, r.endPage);
    return getAutoNoteByProgress(r.program, signed, getTarget(r.program));
  };

  const saveRow = async (idx: number, silent = false): Promise<boolean> => {
    const r = rows[idx];
    if (!r.dirty || r.saving) return true;
    setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: true } : x));
    try {
      const target = getTarget(r.program);
      const signed = calcSigned(r.program, r.startLevel, r.startPage, r.endLevel, r.endPage);
      const status = getProgressStatus(signed, target);
      const totalAttendance = r.present + r.sick + r.permission + r.absent;
      const attendancePercentage =
        totalAttendance > 0 ? Math.round((r.present / totalAttendance) * 100) : 0;
      const payload: any = {
        student_id: r.studentId,
        month, year, program_type: r.program,
        iqra_level: r.program === "iqra" ? `Iqro ${r.startLevel}`
          : r.program === "tahfizh" ? `Juz ${r.startLevel}`
          : r.startLevel,
        end_iqra_level: r.program === "iqra" ? `Iqro ${r.endLevel}`
          : r.program === "tahfizh" ? `Juz ${r.endLevel}`
          : r.endLevel,
        start_page: r.startPage,
        end_page: r.endPage,
        pages_read: signed,
        target_pages: target,
        attendance_percentage: attendancePercentage,
        achievement_status: status,
        notes: r.notes,
      };
      let saved;
      if (r.reportId) saved = await updateReport.mutateAsync({ id: r.reportId, ...payload });
      else saved = await addReport.mutateAsync(payload);

      // Save attendance if any value > 0 OR existing record
      let attId = r.attendanceId;
      if (r.present > 0 || r.sick > 0 || r.permission > 0 || r.absent > 0 || r.attendanceId) {
        const attSaved = await upsertAttendance.mutateAsync({
          student_id: r.studentId,
          month, year,
          present: r.present, sick: r.sick, permission: r.permission, absent: r.absent,
        });
        attId = (attSaved as any).id;
      }

      const stu = filteredStudents.find(s => s.id === r.studentId);
      await ensureTS.mutateAsync({ studentId: r.studentId, kelas: stu?.kelas, rombel: stu?.rombel });

      setRows(prev => prev.map((x, i) => i === idx ? { ...x, reportId: saved.id, attendanceId: attId, dirty: false, saving: false } : x));
      return true;
    } catch (e: any) {
      setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: false } : x));
      if (!silent) toast({ title: `Gagal menyimpan ${r.studentName}`, description: e.message, variant: "destructive" });
      return false;
    }
  };

  const saveAll = async () => {
    const dirtyIdx = rows.map((r, i) => r.dirty ? i : -1).filter(i => i >= 0);
    if (dirtyIdx.length === 0) {
      toast({ title: "Tidak ada perubahan untuk disimpan" });
      return;
    }
    setSavingAll(true);
    let ok = 0, fail = 0;
    for (const i of dirtyIdx) {
      const success = await saveRow(i, true);
      if (success) ok++; else fail++;
    }
    setSavingAll(false);
    toast({
      title: `Tersimpan ${ok} laporan${fail ? ` · ${fail} gagal` : ""}`,
      variant: fail ? "destructive" : "default",
    });
  };

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-[1700px] mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Input Laporan Bulanan & Absensi (Spreadsheet)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Semua program (Iqra, Tahsin Lanjutan, Tahfizh) dalam satu tabel. Program otomatis sesuai level siswa, kolom menyesuaikan. Auto-fill dari bulan sebelumnya · Guru: <span className="font-medium text-foreground">{profile?.full_name || "—"}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
              <SelectContent>{KELAS_LIST.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={rombel} onValueChange={setRombel}>
              <SelectTrigger><SelectValue placeholder="Rombel" /></SelectTrigger>
              <SelectContent>{ROMBELS.map(r => <SelectItem key={r} value={r}>Rombel {r}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progres pengisian (laporan tersimpan)</span>
                <span className="font-semibold">{filledCount}/{totalRows} ({progressPct}%)</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
            <Button onClick={saveAll} disabled={savingAll} className="gap-2">
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Semua
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-collapse min-w-[1400px]">
            <thead className="bg-muted sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-2 border-b">#</th>
                <th className="p-2 border-b min-w-[170px]">Nama Siswa</th>
                <th className="p-2 border-b min-w-[140px]">Program</th>
                <th className="p-2 border-b">Awal</th>
                <th className="p-2 border-b">Hal. Awal</th>
                <th className="p-2 border-b">Akhir</th>
                <th className="p-2 border-b">Hal. Akhir</th>
                <th className="p-2 border-b text-center">Total</th>
                <th className="p-2 border-b text-center">Target</th>
                <th className="p-2 border-b text-center">Status</th>
                <th className="p-2 border-b text-center" title="Hadir">H</th>
                <th className="p-2 border-b text-center" title="Sakit">S</th>
                <th className="p-2 border-b text-center" title="Izin">I</th>
                <th className="p-2 border-b text-center" title="Alpha">A</th>
                <th className="p-2 border-b min-w-[240px]">Catatan</th>
                <th className="p-2 border-b text-center">Status Simpan</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={16} className="p-6 text-center text-muted-foreground">Belum ada siswa pada filter ini.</td></tr>
              )}
              {rows.map((r, idx) => {
                const target = getTarget(r.program);
                const signed = calcSigned(r.program, r.startLevel, r.startPage, r.endLevel, r.endPage);
                const status = getProgressStatus(signed, target);
                const decline = isDecline(r.program, r.startLevel, r.startPage, r.endLevel, r.endPage);
                const lvlOpts = programLevels(r.program);
                const showLevelSelect = r.program !== "tahsin"; // Tahsin Lanjutan: 1 level, sembunyikan dropdown
                const statusBadge = {
                  achieved: <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Tercapai</Badge>,
                  not_achieved: <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><AlertTriangle className="w-3 h-3 mr-1" />Belum</Badge>,
                  stagnant: <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200"><Pause className="w-3 h-3 mr-1" />Stagnan</Badge>,
                  decline: <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><TrendingDown className="w-3 h-3 mr-1" />Turun</Badge>,
                }[status];

                return (
                  <tr key={r.studentId} className={r.dirty ? "bg-amber-50/50" : decline ? "bg-red-50/30" : ""}>
                    <td className="p-2 border-b text-muted-foreground">{idx + 1}</td>
                    <td className="p-2 border-b font-medium">
                      <div>{r.studentName}</div>
                      <div className="text-[10px] text-muted-foreground">{r.studentLevel}</div>
                    </td>
                    <td className="p-2 border-b">
                      <Select value={r.program} onValueChange={(v: any) => updateRow(idx, { program: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{PROGRAMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border-b">
                      {showLevelSelect ? (
                        <Select value={r.startLevel} onValueChange={v => updateRow(idx, { startLevel: v })}>
                          <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{lvlOpts.map(l => <SelectItem key={l} value={l}>{formatLevel(r.program, l)}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 border-b">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { startPage: stepPage(r.program, r.startPage, -1) })}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-mono">{r.startPage}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { startPage: stepPage(r.program, r.startPage, 1) })}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </td>
                    <td className="p-2 border-b">
                      {showLevelSelect ? (
                        <Select value={r.endLevel} onValueChange={v => updateRow(idx, { endLevel: v })}>
                          <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{lvlOpts.map(l => <SelectItem key={l} value={l}>{formatLevel(r.program, l)}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 border-b">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { endPage: stepPage(r.program, r.endPage, -1) })}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-mono">{r.endPage}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { endPage: stepPage(r.program, r.endPage, 1) })}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </td>
                    <td className={`p-2 border-b text-center font-mono ${signed < 0 ? "text-red-600" : ""}`}>{signed}</td>
                    <td className="p-2 border-b text-center font-mono text-muted-foreground">{target}</td>
                    <td className="p-2 border-b text-center">{statusBadge}</td>
                    {(["present", "sick", "permission", "absent"] as const).map(k => (
                      <td key={k} className="p-1 border-b">
                        <Input
                          type="number" min={0}
                          value={r[k]}
                          onChange={e => updateRow(idx, { [k]: Math.max(0, parseInt(e.target.value) || 0) } as any)}
                          className="h-8 w-14 text-center text-xs px-1"
                        />
                      </td>
                    ))}
                    <td className="p-2 border-b">
                      <div className="flex items-start gap-1">
                        <Textarea
                          value={r.notes}
                          onChange={e => updateRowNotes(idx, e.target.value)}
                          placeholder="Catatan..."
                          className="min-h-[40px] text-xs"
                          rows={2}
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Template catatan">
                              <MessageSquarePlus className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[360px] p-2 space-y-1">
                            <p className="text-xs font-semibold px-1 py-1">Pilih catatan otomatis</p>
                            {getAutoNoteOptions(r.program).map((option) => (
                              <button
                                key={option.key}
                                onClick={() => updateRowNotes(idx, option.note)}
                                className="block w-full text-left text-xs p-2 rounded hover:bg-accent"
                              >
                                <span className="font-semibold">{option.label}</span>
                                <span className="block whitespace-pre-line text-muted-foreground mt-1">{option.note}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => updateRowNotes(idx, buildAutoNote(r) || r.notes)}
                              className="block w-full text-left text-xs p-2 rounded bg-primary/10 hover:bg-primary/20 font-medium"
                            >
                              Catatan otomatis berdasarkan progres
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    <td className="p-2 border-b text-center">
                      {r.saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> :
                        r.dirty ? <Badge variant="outline" className="text-amber-600 border-amber-300">Belum Disimpan</Badge> :
                        r.reportId ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" /> :
                        <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={saveAll} disabled={savingAll} size="lg" className="gap-2">
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Semua
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetReport;
