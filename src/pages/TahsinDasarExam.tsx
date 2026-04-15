import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStudents } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Settings2, Save, Users, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EbtaScore {
  jilid: number;
  halaman_acak?: number;
  lahn_jali: number;
  lahn_khofi: number;
  kelancaran: number;
}

const DEFAULT_EBTA = (): EbtaScore[] => [
  { jilid: 1, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
  { jilid: 2, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
  { jilid: 3, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
  { jilid: 4, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
  { jilid: 5, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
  { jilid: 6, halaman_acak: 1, lahn_jali: 0, lahn_khofi: 0, kelancaran: 80 },
];

const VALID_PAGES = Array.from({ length: 30 }, (_, i) => i + 1).filter(p => p !== 2 && p !== 3);

const calcScore = (scores: EbtaScore[], jaliP: number, khofiP: number, kelancaranB: number) => {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => {
    const base = s.kelancaran * (kelancaranB / 100);
    const penalty = s.lahn_jali * jaliP + s.lahn_khofi * khofiP;
    return sum + Math.max(0, base - penalty);
  }, 0);
  return Math.round((total / scores.length) * 100) / 100;
};

const TahsinDasarExam = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [waktu, setWaktu] = useState(() => new Date().toTimeString().slice(0, 5));

  // Penalty config
  const [jaliPenalty, setJaliPenalty] = useState(2);
  const [khofiPenalty, setKhofiPenalty] = useState(1);
  const [kelancaranBobot, setKelancaranBobot] = useState(40);
  const [showConfig, setShowConfig] = useState(false);

  // Per-student EBTA scores
  const [studentScores, setStudentScores] = useState<Record<string, EbtaScore[]>>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // History
  const { data: history = [] } = useQuery({
    queryKey: ["tahsin-dasar-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahsin_dasar_exams" as any)
        .select("*, students(nama, kelas)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    let list = students;
    if (filterKelas !== "all") list = list.filter(s => s.kelas === Number(filterKelas));
    if (search) list = list.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [students, filterKelas, search]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (!studentScores[id]) {
        setStudentScores(p => ({ ...p, [id]: DEFAULT_EBTA() }));
      }
      return [...prev, id];
    });
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      const ids = filtered.map(s => s.id);
      ids.forEach(id => {
        if (!studentScores[id]) setStudentScores(p => ({ ...p, [id]: DEFAULT_EBTA() }));
      });
      setSelectedIds(ids);
    }
  };

  const updateScore = (studentId: string, jilidIdx: number, field: keyof EbtaScore, value: number) => {
    setStudentScores(prev => {
      const scores = [...(prev[studentId] || DEFAULT_EBTA())];
      scores[jilidIdx] = { ...scores[jilidIdx], [field]: value };
      return { ...prev, [studentId]: scores };
    });
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) { toast.error("Pilih minimal 1 siswa"); return; }
    setSaving(true);
    try {
      const rows = selectedIds.map(sid => {
        const scores = studentScores[sid] || DEFAULT_EBTA();
        const nilai = calcScore(scores, jaliPenalty, khofiPenalty, kelancaranBobot);
        return {
          student_id: sid,
          tanggal,
          waktu,
          created_by: user?.id ?? null,
          lahn_jali_penalty: jaliPenalty,
          lahn_khofi_penalty: khofiPenalty,
          kelancaran_bobot: kelancaranBobot,
          ebta_scores: scores,
          nilai_akhir: nilai,
          hasil: nilai >= 60 ? "Lulus" : "Tidak Lulus",
          catatan: catatan[sid] || "",
        };
      });

      const { error } = await supabase.from("tahsin_dasar_exams" as any).insert(rows as any);
      if (error) throw error;

      toast.success(`${rows.length} ujian Tahsin Dasar berhasil disimpan`, {
        description: `👤 Diuji oleh: ${profile?.full_name ?? "Guru"}`,
      });
      setSelectedIds([]);
      setStudentScores({});
      setCatatan({});
      qc.invalidateQueries({ queryKey: ["tahsin-dasar-exams"] });
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingStudents) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ujian Tahsin Dasar (EBTA)</h1>
          <p className="text-muted-foreground text-sm">EBTA Iqro 1–5 + 1 halaman acak Iqro 6</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Settings2 className="w-4 h-4 mr-1" /> Edit Penalti & Bobot</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Pengaturan Penalti & Bobot</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Penalti Lahn Jali (per kesalahan)</label>
                  <Input type="number" value={jaliPenalty} onChange={e => setJaliPenalty(Number(e.target.value))} min={0} />
                  <p className="text-xs text-muted-foreground mt-1">Salah huruf, harakat, makhraj</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Penalti Lahn Khofi (per kesalahan)</label>
                  <Input type="number" value={khofiPenalty} onChange={e => setKhofiPenalty(Number(e.target.value))} min={0} />
                  <p className="text-xs text-muted-foreground mt-1">Mad, ghunnah, tajwid, waqaf</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Bobot Kelancaran (%)</label>
                  <Input type="number" value={kelancaranBobot} onChange={e => setKelancaranBobot(Number(e.target.value))} min={1} max={100} />
                </div>
                <Button onClick={() => setShowConfig(false)} className="w-full">Simpan Pengaturan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
          <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Waktu</label>
          <Input type="time" value={waktu} onChange={e => setWaktu(e.target.value)} className="w-32" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Kelas</label>
          <Select value={filterKelas} onValueChange={setFilterKelas}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {[1, 2, 3, 4, 5, 6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari siswa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          <Users className="w-4 h-4 mr-1" /> {selectedIds.length === filtered.length ? "Batal Semua" : "Pilih Semua"}
        </Button>
      </div>

      {/* Student selection */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="py-2 px-3 text-left w-10">
                  <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Nama</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Kelas</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className={`cursor-pointer hover:bg-muted/20 transition-colors ${selectedIds.includes(s.id) ? "bg-primary/5" : ""}`} onClick={() => toggleStudent(s.id)}>
                  <td className="py-2 px-3"><Checkbox checked={selectedIds.includes(s.id)} /></td>
                  <td className="py-2 px-3 font-medium">{s.nama}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.kelas}</td>
                  <td className="py-2 px-3 text-muted-foreground">{s.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EBTA Input Table for selected students */}
      {selectedIds.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">{selectedIds.length} siswa dipilih — Input Nilai EBTA</p>
          
          {selectedIds.map(sid => {
            const student = students.find(s => s.id === sid);
            const scores = studentScores[sid] || DEFAULT_EBTA();
            const nilai = calcScore(scores, jaliPenalty, khofiPenalty, kelancaranBobot);
            const lulus = nilai >= 60;

            return (
              <motion.div key={sid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{student?.nama.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{student?.nama}</p>
                      <p className="text-xs text-muted-foreground">Kelas {student?.kelas} · {student?.level}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${lulus ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {lulus ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {nilai.toFixed(1)} — {lulus ? "Lulus" : "Tidak Lulus"}
                  </div>
                </div>

                {/* Responsive EBTA table */}
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left font-semibold text-muted-foreground w-24">EBTA</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Hal. Acak</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Lahn Jali</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Lahn Khofi</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Kelancaran</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {scores.map((s, idx) => {
                        const base = s.kelancaran * (kelancaranBobot / 100);
                        const pen = s.lahn_jali * jaliPenalty + s.lahn_khofi * khofiPenalty;
                        const rowScore = Math.max(0, base - pen);
                        return (
                          <tr key={idx}>
                            <td className="py-1.5 font-medium">{s.jilid <= 5 ? `Iqro ${s.jilid}` : "Iqro 6 (Acak)"}</td>
                            <td className="py-1.5 text-center">
                              {s.jilid === 6 ? (
                                <Select value={String(s.halaman_acak || 1)} onValueChange={v => updateScore(sid, idx, "halaman_acak" as any, Number(v))}>
                                  <SelectTrigger className="h-7 w-16 mx-auto text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>{VALID_PAGES.map(p => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-1.5 text-center">
                              <Input type="number" min={0} value={s.lahn_jali} onChange={e => updateScore(sid, idx, "lahn_jali", Math.max(0, Number(e.target.value)))} className="h-7 w-14 text-center text-xs mx-auto" />
                            </td>
                            <td className="py-1.5 text-center">
                              <Input type="number" min={0} value={s.lahn_khofi} onChange={e => updateScore(sid, idx, "lahn_khofi", Math.max(0, Number(e.target.value)))} className="h-7 w-14 text-center text-xs mx-auto" />
                            </td>
                            <td className="py-1.5 text-center">
                              <Input type="number" min={60} max={100} value={s.kelancaran} onChange={e => updateScore(sid, idx, "kelancaran", Math.min(100, Math.max(60, Number(e.target.value))))} className="h-7 w-16 text-center text-xs mx-auto" />
                            </td>
                            <td className="py-1.5 text-center">
                              <span className={`font-bold ${rowScore >= 24 ? "text-emerald-600" : "text-red-500"}`}>{rowScore.toFixed(1)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Textarea placeholder="Catatan (opsional)..." value={catatan[sid] || ""} onChange={e => setCatatan(p => ({ ...p, [sid]: e.target.value }))} className="text-xs min-h-[50px]" />
              </motion.div>
            );
          })}

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Simpan {selectedIds.length} Ujian
          </Button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm">Riwayat Ujian Tahsin Dasar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["Tanggal", "Waktu", "Nama", "Kelas", "Nilai", "Hasil"].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3">{h.tanggal}</td>
                    <td className="py-2 px-3">{h.waktu?.slice(0, 5)}</td>
                    <td className="py-2 px-3 font-medium">{h.students?.nama ?? "—"}</td>
                    <td className="py-2 px-3">{h.students?.kelas ?? "—"}</td>
                    <td className="py-2 px-3 font-bold">{Number(h.nilai_akhir).toFixed(1)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${h.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{h.hasil}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TahsinDasarExam;
