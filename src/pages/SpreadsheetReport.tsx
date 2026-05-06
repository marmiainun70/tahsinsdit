import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useStudents, LEVELS, IQRO_LEVELS } from "@/hooks/useSupabaseData";
import {
  useAllMonthlyReports, useAddMonthlyReport, useUpdateMonthlyReport,
  MONTH_NAMES, calcIqraPagesSigned, getProgressStatus, getTarget,
  IQRA_PAGES_PER_LEVEL, isIqraDecline, buildIqraDeclineNote,
  buildTahfizhDeclineNote,
} from "@/hooks/useMonthlyReports";
import { JUZ_LIST, JUZ_PAGES_PER_JUZ, calcHafalanPagesSigned, isTahfizhDecline } from "@/lib/juzData";
import { useEnsureTeacherStudent } from "@/hooks/useTeacherStudents";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, Minus, Loader2, FileSpreadsheet, MessageSquarePlus, CheckCircle2, AlertTriangle, TrendingDown, Pause } from "lucide-react";

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ROMBELS = ["A", "B", "C", "D"];
const KELAS_LIST = [1, 2, 3, 4, 5, 6];
const PROGRAMS = [
  { value: "iqra", label: "Iqra (Tahsin Dasar)" },
  { value: "tahsin", label: "Tahsin Lanjutan" },
  { value: "tahfizh", label: "Tahfizh" },
];

const TEMPLATE_NOTES = [
  "Perlu peningkatan pada makhraj agar pelafalan setiap huruf semakin jelas dan tepat sesuai dengan kaidah tajwid, terus berlatih secara rutin saat membaca. Barakallah fiik.",
  "Sudah baik dalam membaca Al-Qur'an, pelafalan dan kelancarannya cukup terjaga, pertahankan dan terus ditingkatkan agar semakin sempurna. Barakallah fiik.",
  "Perlu lebih sering berlatih membaca agar kelancaran semakin meningkat dan bacaan menjadi lebih percaya diri serta tidak terbata-bata. Barakallah fiik.",
  "Perlu meningkatkan semangat dan kesungguhan dalam belajar membaca Al-Qur'an, jangan mudah malas dan biasakan berlatih secara rutin agar kualitas bacaan dapat berkembang dengan baik. Barakallah fiik.",
];

const IQRA_PAGES = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 1, 4..32

interface Row {
  studentId: string;
  studentName: string;
  reportId?: string;
  startLevel: string;   // for iqra: "1".."6", for tahfizh: juz "30".."1"
  startPage: number;
  endLevel: string;
  endPage: number;
  notes: string;
  dirty: boolean;
  saving: boolean;
}

const programLevels = (program: string): string[] => {
  if (program === "iqra") return ["1", "2", "3", "4", "5", "6"];
  if (program === "tahsin") return ["Tahsin Lanjutan"];
  return JUZ_LIST.map(String); // tahfizh
};

const calcSigned = (program: string, sl: string, sp: number, el: string, ep: number): number => {
  if (program === "tahfizh") return calcHafalanPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  if (program === "iqra") return calcIqraPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  // tahsin lanjutan: simple page diff
  return ep - sp;
};

const formatLevel = (program: string, lvl: string): string => {
  if (program === "iqra") return `Iqro ${lvl}`;
  if (program === "tahfizh") return `Juz ${lvl}`;
  return lvl;
};

const SpreadsheetReport = () => {
  const { user, profile } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: reports = [] } = useAllMonthlyReports();
  const addReport = useAddMonthlyReport();
  const updateReport = useUpdateMonthlyReport();
  const ensureTS = useEnsureTeacherStudent();

  const [program, setProgram] = useState("iqra");
  const [kelas, setKelas] = useState<string>("1");
  const [rombel, setRombel] = useState("A");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const filteredStudents = useMemo(
    () => students.filter(s => s.kelas === parseInt(kelas) && s.rombel === rombel),
    [students, kelas, rombel],
  );

  const target = getTarget(program);

  // Build rows from students + existing reports + autofill prev month
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const newRows: Row[] = filteredStudents.map(s => {
      const existing = (reports as any[]).find(
        r => r.student_id === s.id && r.month === month && r.year === year && r.program_type === program,
      );

      // prev month for autofill
      let prevMonth = month - 1, prevYear = year;
      if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
      const prev = (reports as any[])
        .filter(r => r.student_id === s.id && r.program_type === program)
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .find(r => r.year * 12 + r.month < year * 12 + month);

      const defaultLevels = programLevels(program);
      const fallbackLvl = program === "tahfizh" ? "30" : program === "iqra" ? "1" : "Tahsin Lanjutan";

      if (existing) {
        return {
          studentId: s.id,
          studentName: s.nama,
          reportId: existing.id,
          startLevel: existing.iqra_level || fallbackLvl,
          startPage: existing.start_page || 1,
          endLevel: existing.end_iqra_level || existing.iqra_level || fallbackLvl,
          endPage: existing.end_page || 1,
          notes: existing.notes || "",
          dirty: false,
          saving: false,
        };
      }

      // autofill from previous month's end
      const sl = prev ? (prev.end_iqra_level || prev.iqra_level || fallbackLvl) : fallbackLvl;
      const sp = prev ? prev.end_page : 1;
      return {
        studentId: s.id,
        studentName: s.nama,
        startLevel: sl,
        startPage: sp,
        endLevel: sl,
        endPage: sp,
        notes: "",
        dirty: false,
        saving: false,
      };
    });
    setRows(newRows);
  }, [filteredStudents.map(s => s.id).join(","), reports.length, month, year, program]);

  const updateRow = useCallback((idx: number, patch: Partial<Row>) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch, dirty: true } : r));
  }, []);

  const filledCount = rows.filter(r => r.reportId).length;
  const totalRows = rows.length;
  const progressPct = totalRows ? Math.round((filledCount / totalRows) * 100) : 0;

  const buildAutoNote = (r: Row): string => {
    const signed = calcSigned(program, r.startLevel, r.startPage, r.endLevel, r.endPage);
    if (program === "iqra") {
      if (isIqraDecline(parseInt(r.startLevel), r.startPage, parseInt(r.endLevel), r.endPage)) {
        return buildIqraDeclineNote(parseInt(r.startLevel), r.startPage, parseInt(r.endLevel), r.endPage);
      }
    }
    if (program === "tahfizh") {
      if (isTahfizhDecline(parseInt(r.startLevel), r.startPage, parseInt(r.endLevel), r.endPage)) {
        return buildTahfizhDeclineNote(parseInt(r.startLevel), r.startPage, parseInt(r.endLevel), r.endPage);
      }
    }
    if (signed === 0) return "Belum ada penambahan progres pada bulan ini. Disarankan menambah intensitas latihan membaca/menghafal.";
    return "";
  };

  const saveRow = async (idx: number) => {
    const r = rows[idx];
    if (!r.dirty || r.saving) return;
    setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: true } : x));
    try {
      const signed = calcSigned(program, r.startLevel, r.startPage, r.endLevel, r.endPage);
      const status = getProgressStatus(signed, target);
      const payload: any = {
        student_id: r.studentId,
        month, year, program_type: program,
        iqra_level: r.startLevel,
        end_iqra_level: r.endLevel,
        start_page: r.startPage,
        end_page: r.endPage,
        pages_read: Math.max(0, signed),
        target_pages: target,
        achievement_status: status,
        notes: r.notes,
      };
      let saved;
      if (r.reportId) {
        saved = await updateReport.mutateAsync({ id: r.reportId, ...payload });
      } else {
        saved = await addReport.mutateAsync(payload);
      }
      const stu = filteredStudents.find(s => s.id === r.studentId);
      await ensureTS.mutateAsync({ studentId: r.studentId, kelas: stu?.kelas, rombel: stu?.rombel });
      setRows(prev => prev.map((x, i) => i === idx ? { ...x, reportId: saved.id, dirty: false, saving: false } : x));
    } catch (e: any) {
      setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: false } : x));
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
  };

  // Debounced auto-save per row (800ms)
  const timersRef = useRef<Record<number, any>>({});
  useEffect(() => {
    rows.forEach((r, idx) => {
      if (r.dirty && !r.saving) {
        clearTimeout(timersRef.current[idx]);
        timersRef.current[idx] = setTimeout(() => saveRow(idx), 800);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const saveAll = async () => {
    const dirtyIdx = rows.map((r, i) => r.dirty ? i : -1).filter(i => i >= 0);
    if (dirtyIdx.length === 0) {
      toast({ title: "Tidak ada perubahan" });
      return;
    }
    for (const i of dirtyIdx) await saveRow(i);
    toast({ title: `Tersimpan ${dirtyIdx.length} laporan` });
  };

  const pageOptions = (program === "iqra") ? IQRA_PAGES
    : program === "tahfizh" ? Array.from({ length: JUZ_PAGES_PER_JUZ }, (_, i) => i + 1)
    : Array.from({ length: 200 }, (_, i) => i + 1);

  const stepPage = (cur: number, dir: 1 | -1): number => {
    if (program === "iqra") {
      const idx = IQRA_PAGES.indexOf(cur);
      const newIdx = Math.max(0, Math.min(IQRA_PAGES.length - 1, idx + dir));
      return IQRA_PAGES[newIdx] ?? cur;
    }
    if (program === "tahfizh") return Math.max(1, Math.min(JUZ_PAGES_PER_JUZ, cur + dir));
    return Math.max(1, cur + dir);
  };

  const lvlOpts = programLevels(program);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Input Cepat — Laporan Bulanan (Spreadsheet)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Mode Excel: pilih kelas & bulan, lalu isi langsung di tabel. Auto-save 800ms · Auto-fill dari bulan sebelumnya · Guru: <span className="font-medium text-foreground">{profile?.full_name || "—"}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>{PROGRAMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
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
                <span className="text-muted-foreground">Progres pengisian</span>
                <span className="font-semibold">{filledCount}/{totalRows} ({progressPct}%)</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
            <Button onClick={saveAll} className="gap-2">
              <Save className="w-4 h-4" /> Simpan Semua
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-collapse min-w-[1200px]">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="p-2 border-b">#</th>
                <th className="p-2 border-b min-w-[180px]">Nama Siswa</th>
                <th className="p-2 border-b">Awal</th>
                <th className="p-2 border-b">Hal. Awal</th>
                <th className="p-2 border-b">Akhir</th>
                <th className="p-2 border-b">Hal. Akhir</th>
                <th className="p-2 border-b text-center">Total</th>
                <th className="p-2 border-b text-center">Target</th>
                <th className="p-2 border-b text-center">Status</th>
                <th className="p-2 border-b min-w-[260px]">Catatan</th>
                <th className="p-2 border-b text-center">Simpan</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Belum ada siswa pada filter ini.</td></tr>
              )}
              {rows.map((r, idx) => {
                const signed = calcSigned(program, r.startLevel, r.startPage, r.endLevel, r.endPage);
                const status = getProgressStatus(signed, target);
                const statusBadge = {
                  achieved: <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Tercapai</Badge>,
                  not_achieved: <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><AlertTriangle className="w-3 h-3 mr-1" />Belum</Badge>,
                  stagnant: <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200"><Pause className="w-3 h-3 mr-1" />Stagnan</Badge>,
                  decline: <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><TrendingDown className="w-3 h-3 mr-1" />Turun</Badge>,
                }[status];
                return (
                  <tr key={r.studentId} className={r.dirty ? "bg-amber-50/40" : ""}>
                    <td className="p-2 border-b text-muted-foreground">{idx + 1}</td>
                    <td className="p-2 border-b font-medium">{r.studentName}</td>
                    <td className="p-2 border-b">
                      <Select value={r.startLevel} onValueChange={v => updateRow(idx, { startLevel: v })}>
                        <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{lvlOpts.map(l => <SelectItem key={l} value={l}>{formatLevel(program, l)}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border-b">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { startPage: stepPage(r.startPage, -1) })}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-mono">{r.startPage}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { startPage: stepPage(r.startPage, 1) })}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </td>
                    <td className="p-2 border-b">
                      <Select value={r.endLevel} onValueChange={v => updateRow(idx, { endLevel: v })}>
                        <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{lvlOpts.map(l => <SelectItem key={l} value={l}>{formatLevel(program, l)}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border-b">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { endPage: stepPage(r.endPage, -1) })}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-mono">{r.endPage}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateRow(idx, { endPage: stepPage(r.endPage, 1) })}><Plus className="w-3 h-3" /></Button>
                      </div>
                    </td>
                    <td className="p-2 border-b text-center font-mono">{signed}</td>
                    <td className="p-2 border-b text-center font-mono text-muted-foreground">{target}</td>
                    <td className="p-2 border-b text-center">{statusBadge}</td>
                    <td className="p-2 border-b">
                      <div className="flex items-start gap-1">
                        <Textarea
                          value={r.notes}
                          onChange={e => updateRow(idx, { notes: e.target.value })}
                          placeholder="Catatan…"
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
                            <p className="text-xs font-semibold px-1 py-1">Pilih template</p>
                            {TEMPLATE_NOTES.map((t, i) => (
                              <button
                                key={i}
                                onClick={() => updateRow(idx, { notes: t })}
                                className="block w-full text-left text-xs p-2 rounded hover:bg-accent"
                              >
                                {t}
                              </button>
                            ))}
                            <button
                              onClick={() => updateRow(idx, { notes: buildAutoNote(r) || r.notes })}
                              className="block w-full text-left text-xs p-2 rounded bg-primary/10 hover:bg-primary/20 font-medium"
                            >
                              ⚙️ Catatan otomatis (berdasarkan progres)
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    <td className="p-2 border-b text-center">
                      {r.saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> :
                        r.dirty ? <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge> :
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
    </div>
  );
};

export default SpreadsheetReport;
