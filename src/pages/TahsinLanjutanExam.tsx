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
import { Loader2, Search, Settings2, Save, Users, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NOTE_EMOTICON_WARNING, hasBlockedNoteEmoticon, removeBlockedNoteEmoticons } from "@/lib/noteValidation";

const WAQAF_SYMBOLS = [
  { key: "lazim", label: "Lazim (مـ)" },
  { key: "mustahab", label: "Mustahab (قلى)" },
  { key: "jaiz", label: "Jaiz (ج)" },
  { key: "mujawwaz", label: "Mujawwaz (ز)" },
  { key: "mamnu", label: "Mamnu' (لا)" },
  { key: "washol_lazim", label: "Washol Lazim (صلى)" },
] as const;

interface Soal {
  surat: string;
  ayat: string;
  lahn_jali: number;
  lahn_khofi: number;
  waqaf_ibtida: number;
  kelancaran: number;
}

const DEFAULT_SOAL = (): Soal => ({ surat: "", ayat: "", lahn_jali: 0, lahn_khofi: 0, waqaf_ibtida: 0, kelancaran: 80 });

const calcLanjutanScore = (
  soal: Soal[], jaliP: number, khofiP: number, waqafP: number, kelancaranB: number
) => {
  if (soal.length === 0) return 0;
  const total = soal.reduce((sum, s) => {
    const base = s.kelancaran * (kelancaranB / 100);
    const pen = s.lahn_jali * jaliP + s.lahn_khofi * khofiP + s.waqaf_ibtida * waqafP;
    return sum + Math.max(0, base - pen);
  }, 0);
  return Math.round((total / soal.length) * 100) / 100;
};

const TahsinLanjutanExam = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [waktu, setWaktu] = useState(() => new Date().toTimeString().slice(0, 5));

  const [jaliPenalty, setJaliPenalty] = useState(2);
  const [khofiPenalty, setKhofiPenalty] = useState(1);
  const [waqafPenalty, setWaqafPenalty] = useState(2);
  const [kelancaranBobot, setKelancaranBobot] = useState(40);
  const [showConfig, setShowConfig] = useState(false);

  const [studentSoal, setStudentSoal] = useState<Record<string, Soal[]>>({});
  const [studentWaqaf, setStudentWaqaf] = useState<Record<string, Record<string, boolean>>>({});
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const handleCatatanChange = (sid: string, value: string) => {
    if (hasBlockedNoteEmoticon(value)) {
      toast.error(NOTE_EMOTICON_WARNING);
      setCatatan(p => ({ ...p, [sid]: removeBlockedNoteEmoticons(value) }));
      return;
    }
    setCatatan(p => ({ ...p, [sid]: value }));
  };
  const [saving, setSaving] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ["tahsin-lanjutan-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahsin_lanjutan_exams" as any)
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

  const initStudent = (id: string) => {
    if (!studentSoal[id]) setStudentSoal(p => ({ ...p, [id]: [DEFAULT_SOAL(), DEFAULT_SOAL(), DEFAULT_SOAL()] }));
    if (!studentWaqaf[id]) {
      const waqaf: Record<string, boolean> = {};
      WAQAF_SYMBOLS.forEach(w => (waqaf[w.key] = false));
      setStudentWaqaf(p => ({ ...p, [id]: waqaf }));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      initStudent(id);
      return [...prev, id];
    });
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      const ids = filtered.map(s => s.id);
      ids.forEach(initStudent);
      setSelectedIds(ids);
    }
  };

  const addSoal = (sid: string) => {
    setStudentSoal(p => ({ ...p, [sid]: [...(p[sid] || []), DEFAULT_SOAL()] }));
  };

  const removeSoal = (sid: string, idx: number) => {
    setStudentSoal(p => {
      const soal = [...(p[sid] || [])];
      if (soal.length <= 3) { toast.error("Minimal 3 soal"); return p; }
      soal.splice(idx, 1);
      return { ...p, [sid]: soal };
    });
  };

  const updateSoal = (sid: string, idx: number, field: keyof Soal, value: any) => {
    setStudentSoal(p => {
      const soal = [...(p[sid] || [])];
      soal[idx] = { ...soal[idx], [field]: value };
      return { ...p, [sid]: soal };
    });
  };

  const toggleWaqaf = (sid: string, key: string) => {
    setStudentWaqaf(p => ({
      ...p,
      [sid]: { ...(p[sid] || {}), [key]: !(p[sid]?.[key]) },
    }));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) { toast.error("Pilih minimal 1 siswa"); return; }
    // Validate
    for (const sid of selectedIds) {
      const soal = studentSoal[sid] || [];
      if (soal.length < 3) { toast.error("Setiap siswa harus memiliki minimal 3 soal"); return; }
      for (const s of soal) {
        if (!s.surat || !s.ayat) { toast.error("Lengkapi surat dan ayat untuk semua soal"); return; }
      }
    }

    setSaving(true);
    try {
      const rows = selectedIds.map(sid => {
        const soal = studentSoal[sid] || [];
        const waqaf = studentWaqaf[sid] || {};
        const waqafLulus = WAQAF_SYMBOLS.every(w => waqaf[w.key] === true);
        const nilai = calcLanjutanScore(soal, jaliPenalty, khofiPenalty, waqafPenalty, kelancaranBobot);
        return {
          student_id: sid,
          tanggal,
          waktu,
          created_by: user?.id ?? null,
          lahn_jali_penalty: jaliPenalty,
          lahn_khofi_penalty: khofiPenalty,
          waqaf_ibtida_penalty: waqafPenalty,
          kelancaran_bobot: kelancaranBobot,
          soal,
          waqaf_symbols: waqaf,
          waqaf_lulus: waqafLulus,
          nilai_akhir: nilai,
          hasil: nilai >= 60 && waqafLulus ? "Lulus" : "Tidak Lulus",
          catatan: catatan[sid] || "",
        };
      });

      const { error } = await supabase.from("tahsin_lanjutan_exams" as any).insert(rows as any);
      if (error) throw error;

      toast.success(`${rows.length} ujian Tahsin Lanjutan berhasil disimpan`, {
        description: `👤 Diuji oleh: ${profile?.full_name ?? "Guru"}`,
      });
      setSelectedIds([]);
      setStudentSoal({});
      setStudentWaqaf({});
      setCatatan({});
      qc.invalidateQueries({ queryKey: ["tahsin-lanjutan-exams"] });
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
          <h1 className="text-xl font-bold text-foreground">Ujian Tahsin Lanjutan</h1>
          <p className="text-muted-foreground text-sm">Input surat & ayat bebas, tes simbol waqaf</p>
        </div>
        <Dialog open={showConfig} onOpenChange={setShowConfig}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Settings2 className="w-4 h-4 mr-1" /> Edit Penalti & Bobot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pengaturan Penalti & Bobot</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Penalti Lahn Jali</label>
                <Input type="number" value={jaliPenalty} onChange={e => setJaliPenalty(Number(e.target.value))} min={0} />
              </div>
              <div>
                <label className="text-sm font-medium">Penalti Lahn Khofi</label>
                <Input type="number" value={khofiPenalty} onChange={e => setKhofiPenalty(Number(e.target.value))} min={0} />
              </div>
              <div>
                <label className="text-sm font-medium">Penalti Waqaf & Ibtida (per kesalahan)</label>
                <Input type="number" value={waqafPenalty} onChange={e => setWaqafPenalty(Number(e.target.value))} min={0} />
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
                <th className="py-2 px-3 text-left w-10"><Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
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

      {/* Input forms */}
      {selectedIds.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">{selectedIds.length} siswa dipilih — Input Ujian</p>

          {selectedIds.map(sid => {
            const student = students.find(s => s.id === sid);
            const soal = studentSoal[sid] || [DEFAULT_SOAL(), DEFAULT_SOAL(), DEFAULT_SOAL()];
            const waqaf = studentWaqaf[sid] || {};
            const waqafLulus = WAQAF_SYMBOLS.every(w => waqaf[w.key] === true);
            const nilai = calcLanjutanScore(soal, jaliPenalty, khofiPenalty, waqafPenalty, kelancaranBobot);
            const lulus = nilai >= 60 && waqafLulus;

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
                    {!waqafLulus && <span className="ml-1">(Waqaf ✗)</span>}
                  </div>
                </div>

                {/* Soal table */}
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                        <th className="py-2 text-left font-semibold text-muted-foreground">Surat</th>
                        <th className="py-2 text-left font-semibold text-muted-foreground">Ayat</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">L. Jali</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">L. Khofi</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Waqaf/Ibtida</th>
                        <th className="py-2 text-center font-semibold text-muted-foreground">Kelancaran</th>
                        <th className="py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {soal.map((s, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-medium">{idx + 1}</td>
                          <td className="py-1.5"><Input value={s.surat} onChange={e => updateSoal(sid, idx, "surat", e.target.value)} placeholder="Al-Baqarah" className="h-7 text-xs w-28" /></td>
                          <td className="py-1.5"><Input value={s.ayat} onChange={e => updateSoal(sid, idx, "ayat", e.target.value)} placeholder="1-5" className="h-7 text-xs w-16" /></td>
                          <td className="py-1.5 text-center"><Input type="number" min={0} value={s.lahn_jali} onChange={e => updateSoal(sid, idx, "lahn_jali", Math.max(0, Number(e.target.value)))} className="h-7 w-14 text-center text-xs mx-auto" /></td>
                          <td className="py-1.5 text-center"><Input type="number" min={0} value={s.lahn_khofi} onChange={e => updateSoal(sid, idx, "lahn_khofi", Math.max(0, Number(e.target.value)))} className="h-7 w-14 text-center text-xs mx-auto" /></td>
                          <td className="py-1.5 text-center"><Input type="number" min={0} value={s.waqaf_ibtida} onChange={e => updateSoal(sid, idx, "waqaf_ibtida", Math.max(0, Number(e.target.value)))} className="h-7 w-14 text-center text-xs mx-auto" /></td>
                          <td className="py-1.5 text-center"><Input type="number" min={60} max={100} value={s.kelancaran} onChange={e => updateSoal(sid, idx, "kelancaran", Math.min(100, Math.max(60, Number(e.target.value))))} className="h-7 w-16 text-center text-xs mx-auto" /></td>
                          <td className="py-1.5">
                            <button onClick={() => removeSoal(sid, idx)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" onClick={() => addSoal(sid)}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah Soal</Button>

                {/* Waqaf symbol test */}
                <div className="border border-border rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">Tes Simbol Waqaf <span className="text-muted-foreground font-normal">(harus lolos semua)</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WAQAF_SYMBOLS.map(w => (
                      <label key={w.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${waqaf[w.key] ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-border bg-muted/30 text-muted-foreground"}`}>
                        <Checkbox checked={!!waqaf[w.key]} onCheckedChange={() => toggleWaqaf(sid, w.key)} />
                        {w.label}
                      </label>
                    ))}
                  </div>
                  <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${waqafLulus ? "text-emerald-600" : "text-red-500"}`}>
                    {waqafLulus ? <><CheckCircle className="w-3.5 h-3.5" /> Lolos semua simbol waqaf</> : <><XCircle className="w-3.5 h-3.5" /> Belum lolos semua simbol waqaf</>}
                  </div>
                </div>

                <Textarea placeholder="Catatan (opsional)..." value={catatan[sid] || ""} onChange={e => handleCatatanChange(sid, e.target.value)} className="text-xs min-h-[50px]" />
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
            <h3 className="font-semibold text-sm">Riwayat Ujian Tahsin Lanjutan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["Tanggal", "Waktu", "Nama", "Kelas", "Nilai", "Waqaf", "Hasil"].map(h => (
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
                      <span className={`px-2 py-0.5 rounded-full font-medium ${h.waqaf_lulus ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{h.waqaf_lulus ? "✓ Lolos" : "✗ Gagal"}</span>
                    </td>
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

export default TahsinLanjutanExam;
