import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useStudent, useProgressEntries,
  useAddProgress, useUpdateStudent, LEVEL_COLORS, LEVELS,
  useTahsinAssessments, getLevelDisplayLabel, isTahsinDasar,
} from "@/hooks/useSupabaseData";
import { useMonthlyReports, MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { useAddActivityLog } from "@/hooks/useActivityLog";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import { ChevronRight, TrendingUp, Award, BookOpen, CalendarDays, ClipboardList, Loader2, AlertTriangle, FileDown, ArrowRightLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import TahsinTrendChart from "@/components/TahsinTrendChart";
import StudentReportPDF from "@/components/StudentReportPDF";
import { useExportPDF } from "@/hooks/useExportPDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { NOTE_EMOTICON_WARNING, hasBlockedNoteEmoticon, removeBlockedNoteEmoticons } from "@/lib/noteValidation";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

const ROMBEL_OPTIONS = ["A", "B", "C", "D"] as const;
type Rombel = typeof ROMBEL_OPTIONS[number];

const ROMBEL_COLORS: Record<Rombel, string> = {
  A: "bg-blue-500/10 text-blue-700 border-blue-200",
  B: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  C: "bg-violet-500/10 text-violet-700 border-violet-200",
  D: "bg-orange-500/10 text-orange-700 border-orange-200",
};

const ScoreBar = ({ value, label }: { value: number; label: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${value >= 80 ? "text-emerald-600" : value >= 65 ? "text-yellow-600" : "text-red-500"}`}>{value}</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`h-full rounded-full ${value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-yellow-500" : "bg-red-400"}`}
      />
    </div>
  </div>
);

const StudentProgress = () => {
  const { studentId } = useParams();
  const { data: student, isLoading: loadingStudent } = useStudent(studentId ?? "");
  const { data: progres = [], isLoading: loadingProgress } = useProgressEntries(studentId ?? "");
  const { data: monthlyReports = [], isLoading: loadingMonthlyReports } = useMonthlyReports(studentId ?? "");
  const { data: tahsinData = [] } = useTahsinAssessments(studentId ?? "");
  const addProgress = useAddProgress();
  const updateStudent = useUpdateStudent();
  const addActivityLog = useAddActivityLog();
  const { reportRef, exporting, exportPDF } = useExportPDF();
  const { toast } = useToast();

  const [form, setForm] = useState({
    halaman: "", kelancaran: "", makhraj: "", tajwid: "", catatan: "",
    status_bacaan: "Cukup" as ReadingStatus,
  });

  const handleCatatanChange = (value: string) => {
    if (hasBlockedNoteEmoticon(value)) {
      toast({ title: NOTE_EMOTICON_WARNING, variant: "destructive" });
      setForm(f => ({ ...f, catatan: removeBlockedNoteEmoticons(value) }));
      return;
    }
    setForm(f => ({ ...f, catatan: value }));
  };
  const [saved, setSaved] = useState(false);

  // Pindah Rombel state
  const [showPindahRombel, setShowPindahRombel] = useState(false);
  const [targetRombel, setTargetRombel] = useState<Rombel>("A");

  const handlePindahRombel = async () => {
    if (!student || targetRombel === (student as any).rombel) return;
    const rombelLama = (student as any).rombel;
    await updateStudent.mutateAsync({ id: student.id, rombel: targetRombel });
    await addActivityLog.mutateAsync({
      student_id: student.id,
      activity_type: "pindah_rombel",
      judul: `Pindah Rombel ${rombelLama} → ${targetRombel}`,
      deskripsi: `${student.nama} dipindahkan dari Rombel ${rombelLama} ke Rombel ${targetRombel}.`,
      metadata: { rombel_asal: rombelLama, rombel_tujuan: targetRombel },
    });
    setShowPindahRombel(false);
    toast({
      title: "Rombel berhasil diubah",
      description: `${student.nama} dipindahkan ke Rombel ${targetRombel}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !form.halaman || !form.kelancaran || !form.makhraj || !form.tajwid) return;
    const kel = parseInt(form.kelancaran);
    const mak = parseInt(form.makhraj);
    const taj = parseInt(form.tajwid);
    await addProgress.mutateAsync({
      student_id: student.id,
      buku: student.level,
      halaman: parseInt(form.halaman),
      kelancaran: kel,
      makhraj: mak,
      tajwid: taj,
      catatan: form.catatan,
    });
    await updateStudent.mutateAsync({
      id: student.id,
      halaman_terakhir: parseInt(form.halaman),
      status_bacaan: form.status_bacaan,
    });
    // Log nilai rendah jika rata-rata < 65
    const avg = Math.round((kel + mak + taj) / 3);
    if (avg < 65) {
      await addActivityLog.mutateAsync({
        student_id: student.id,
        activity_type: "nilai_rendah",
        judul: "Nilai progres di bawah rata-rata",
        deskripsi: `Rata-rata nilai ${avg} (Kelancaran: ${kel}, Makhraj: ${mak}, Tajwid: ${taj}). Halaman ${form.halaman}.`,
        metadata: { rata_rata: avg, kelancaran: kel, makhraj: mak, tajwid: taj, halaman: form.halaman },
      });
    } else {
      await addActivityLog.mutateAsync({
        student_id: student.id,
        activity_type: "catatan_progres",
        judul: `Progres dicatat — Hal. ${form.halaman}`,
        deskripsi: form.catatan || `Rata-rata nilai: ${avg}. Status: ${form.status_bacaan}.`,
        metadata: { rata_rata: avg, kelancaran: kel, makhraj: mak, tajwid: taj, halaman: form.halaman },
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ halaman: "", kelancaran: "", makhraj: "", tajwid: "", catatan: "", status_bacaan: "Cukup" });
  };

  if (loadingStudent) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Siswa tidak ditemukan.</div>
  );

  const latestProgress = progres[0];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/class/${student.kelas}`} className="hover:text-primary transition-colors">Kelas {student.kelas}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{student.nama}</span>
      </div>

      {/* Student Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center flex-shrink-0 shadow-green">
            <span className="text-primary-foreground text-2xl font-bold">{student.nama.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{student.nama}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Kelas {student.kelas}</span>
              {/* Rombel badge — clickable shortcut to open pindah rombel */}
              <button
                onClick={() => { setTargetRombel((student as any).rombel as Rombel); setShowPindahRombel(true); }}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-opacity hover:opacity-80 ${ROMBEL_COLORS[(student as any).rombel as Rombel] ?? "bg-muted text-muted-foreground border-border"}`}
              >
                Rombel {(student as any).rombel}
              </button>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[student.level]}`}>
                {getLevelDisplayLabel(student.level as ReadingLevel)}
              </span>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">Hal. {student.halaman_terakhir}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{student.status_bacaan}</span>
              {(student as any).perlu_perhatian && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Perlu Perhatian
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setTargetRombel((student as any).rombel as Rombel); setShowPindahRombel(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Pindah Rombel
            </button>
            {isTahsinDasar(student.level as ReadingLevel) && (
              <Link to={`/tahsin/${student.id}`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  <BookOpen className="w-4 h-4" />
                  Penilaian Tahsin
                </button>
              </Link>
            )}
            <button
              onClick={() => exportPDF(student, progres, [], tahsinData)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            >
              {exporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FileDown className="w-4 h-4" />}
              {exporting ? "Memproses…" : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Pindah Rombel Dialog */}
      <AlertDialog open={showPindahRombel} onOpenChange={setShowPindahRombel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Pindah Rombel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pindahkan <span className="font-semibold text-foreground">{student.nama}</span> dari{" "}
              <span className="font-semibold text-foreground">Rombel {(student as any).rombel}</span> ke rombel tujuan:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Rombel selector */}
          <div className="grid grid-cols-4 gap-2 py-2">
            {ROMBEL_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setTargetRombel(r)}
                disabled={r === (student as any).rombel}
                className={`
                  py-3 rounded-xl text-sm font-bold border-2 transition-all
                  ${r === (student as any).rombel
                    ? "opacity-40 cursor-not-allowed border-border bg-muted text-muted-foreground"
                    : targetRombel === r
                    ? "border-primary bg-primary/10 text-primary scale-105 shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                Rombel {r}
              </button>
            ))}
          </div>

          {targetRombel !== (student as any).rombel && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Siswa akan dipindahkan ke <span className="font-semibold text-foreground">Rombel {targetRombel}</span>.
              Perubahan ini akan langsung terlihat di halaman kelas.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePindahRombel}
              disabled={updateStudent.isPending || targetRombel === (student as any).rombel}
              className="flex items-center gap-2"
            >
              {updateStudent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Pindahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Latest Scores */}
      {latestProgress && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Kelancaran", value: latestProgress.kelancaran, icon: TrendingUp, color: "text-blue-500 bg-blue-50" },
            { label: "Makhraj", value: latestProgress.makhraj, icon: BookOpen, color: "text-emerald-500 bg-emerald-50" },
            { label: "Tajwid", value: latestProgress.tajwid, icon: Award, color: "text-purple-500 bg-purple-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.7 }}
                  className={`h-full rounded-full ${value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-yellow-500" : "bg-red-400"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Riwayat Progres Belajar</h2>
          <span className="ml-auto text-xs text-muted-foreground">{progres.length} catatan</span>
        </div>
        {loadingProgress ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : progres.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Belum ada catatan progres.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Tanggal", "Buku", "Halaman", "Kelancaran", "Makhraj", "Tajwid", "Catatan"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {progres.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/20">
                    <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{p.tanggal}</td>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{p.buku}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">{p.halaman}</td>
                    {[p.kelancaran, p.makhraj, p.tajwid].map((v, j) => (
                      <td key={j} className="py-3 px-4">
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${v >= 80 ? "bg-emerald-100 text-emerald-700" : v >= 65 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{v}</span>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">{p.catatan}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Reports Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Rekap Progres Bulanan</h2>
          <span className="ml-auto text-xs text-muted-foreground">{monthlyReports.length} laporan</span>
        </div>
        {loadingMonthlyReports ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : monthlyReports.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Belum ada rekap laporan bulanan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Periode", "Program", "Level", "Capaian Hal", "Hadir", "Nilai", "Kategori", "Catatan"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyReports.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/20">
                    <td className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">
                      {MONTH_NAMES[r.month - 1]} {r.year}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground capitalize">{r.program_type}</td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {r.iqra_level === r.end_iqra_level 
                        ? r.iqra_level 
                        : `${r.iqra_level} ➔ ${r.end_iqra_level}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      Hal. {r.start_page} ➔ {r.end_page} <br />
                      <span className="text-xs">({r.pages_read} hal)</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {r.attendance_percentage ?? 0}%
                    </td>
                    <td className="py-3 px-4">
                      {r.nilai_akhir_progresif !== null ? (
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                          r.nilai_akhir_progresif >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                          r.nilai_akhir_progresif >= 65 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : 
                          "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {r.nilai_akhir_progresif}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.kategori_progres ? (
                        <span className="text-xs bg-muted text-foreground px-2 py-1 rounded-full whitespace-nowrap border border-border">
                          {r.kategori_progres}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground min-w-[200px] whitespace-pre-wrap">{r.notes}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Progress Form */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Catat Progres Hari Ini
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Buku</label>
            <input defaultValue={student.level} readOnly className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Halaman</label>
            <input type="number" value={form.halaman} onChange={e => setForm(f => ({ ...f, halaman: e.target.value }))} placeholder="Nomor halaman" className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          {[["Kelancaran", "kelancaran"], ["Makhraj", "makhraj"], ["Tajwid", "tajwid"]].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label} (0-100)</label>
              <input type="number" min={0} max={100} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="0–100" className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Status Bacaan</label>
            <select value={form.status_bacaan} onChange={e => setForm(f => ({ ...f, status_bacaan: e.target.value as ReadingStatus }))} className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm">
              {["Lancar", "Cukup", "Perlu Latihan", "Terbata-bata"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Catatan Guru</label>
            <input type="text" value={form.catatan} onChange={e => handleCatatanChange(e.target.value)} placeholder="Catatan..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
          <div className="flex items-end sm:col-span-full lg:col-span-1">
            <button type="submit" disabled={addProgress.isPending} className="w-full py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-green disabled:opacity-60 flex items-center justify-center gap-2">
              {addProgress.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saved ? "✓ Tersimpan!" : "Simpan Progres"}
            </button>
          </div>
        </form>
      </div>

      {/* Tahsin Trend Chart — untuk level Tahsin Dasar (Iqro) dan Tahsin Lanjutan/Tahfizh */}
      {isTahsinDasar(student.level as ReadingLevel) && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Tren Nilai Tahsin Per Materi</h2>
            <span className="ml-auto text-xs text-muted-foreground">{tahsinData.length} penilaian</span>
          </div>
          <div className="p-5">
            <TahsinTrendChart data={tahsinData} />
          </div>
        </div>
      )}


      {/* Activity Log */}
      <ActivityLogPanel studentId={student.id} />

      {/* Hidden PDF Report — rendered off-screen, captured by html2canvas */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <StudentReportPDF
          ref={reportRef}
          student={student}
          progres={progres}
          tahsinData={tahsinData}
        />
      </div>
    </div>
  );
};

export default StudentProgress;
