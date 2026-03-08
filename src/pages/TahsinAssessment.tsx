import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStudent, LEVEL_COLORS, useTahsinAssessments, useAddTahsinAssessment, getLevelDisplayLabel } from "@/hooks/useSupabaseData";
import {
  ChevronRight, BookOpenCheck, Star, Loader2,
  CalendarDays, ChevronDown, ChevronUp, Info, TrendingUp,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import TahsinTrendChart from "@/components/TahsinTrendChart";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

// ─── Konstanta ────────────────────────────────────────────────────────────────
const MATERI = [
  {
    key: "makhraj_huruf" as const,
    label: "Makhraj Huruf",
    icon: "م",
    desc: "Ketepatan tempat keluarnya huruf hijaiyah",
    tips: [
      "Perhatikan huruf-huruf yang sering tertukar (ذ/ز, ث/س, ح/ه)",
      "Huruf tenggorokan: ء ه ع غ ح خ",
      "Huruf lisan: sebagian besar huruf hijaiyah",
    ],
  },
  {
    key: "hukum_nun_mati" as const,
    label: "Hukum Nun Mati/Tanwin",
    icon: "ن",
    desc: "Idzhar, idgham, iqlab, dan ikhfa",
    tips: [
      "Idzhar Halqi: ء ه ع غ ح خ",
      "Idgham Bighunnah: ي ن م و",
      "Idgham Bilaghunnah: ل ر",
      "Iqlab: ب",
      "Ikhfa: sisa 15 huruf",
    ],
  },
  {
    key: "hukum_mim_mati" as const,
    label: "Hukum Mim Mati",
    icon: "م",
    desc: "Idzhar syafawi, idgham mimi, dan ikhfa syafawi",
    tips: [
      "Idzhar Syafawi: semua huruf kecuali م dan ب",
      "Idgham Mimi / Mutamatsilain: bertemu م",
      "Ikhfa Syafawi: bertemu ب",
    ],
  },
  {
    key: "mad" as const,
    label: "Mad (Panjang Pendek)",
    icon: "ـا",
    desc: "Ketepatan ukuran panjang bacaan mad",
    tips: [
      "Mad Thabii: 2 harakat",
      "Mad Wajib Muttasil: 4-5 harakat",
      "Mad Jaiz Munfasil: 2-5 harakat",
      "Mad Lazim: 6 harakat",
    ],
  },
  {
    key: "tartil" as const,
    label: "Bacaan Tartil",
    icon: "ت",
    desc: "Kelancaran, irama, dan keindahan bacaan secara keseluruhan",
    tips: [
      "Tempo bacaan tidak terlalu cepat atau lambat",
      "Konsistensi irama dari awal hingga akhir",
      "Kejelasan setiap huruf dan harakatnya",
      "Waqaf dan ibtida pada tempat yang benar",
    ],
  },
];

const PREDIKAT_CONFIG = [
  { min: 90, label: "Mumtaz", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300", emoji: "🌟" },
  { min: 80, label: "Jayyid Jiddan", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-300", emoji: "✨" },
  { min: 70, label: "Jayyid", color: "text-sky-700", bg: "bg-sky-100", border: "border-sky-300", emoji: "👍" },
  { min: 60, label: "Maqbul", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-300", emoji: "📝" },
  { min: 0, label: "Rajih", color: "text-red-700", bg: "bg-red-100", border: "border-red-300", emoji: "⚠️" },
];

const getPredikat = (nilai: number) =>
  PREDIKAT_CONFIG.find(p => nilai >= p.min) ?? PREDIKAT_CONFIG[PREDIKAT_CONFIG.length - 1];

// ─── Sub-komponen ─────────────────────────────────────────────────────────────
const NilaiSlider = ({
  materi,
  nilai,
  keterangan,
  onNilai,
  onKeterangan,
}: {
  materi: typeof MATERI[0];
  nilai: number;
  keterangan: string;
  onNilai: (v: number) => void;
  onKeterangan: (v: string) => void;
}) => {
  const [showTips, setShowTips] = useState(false);
  const color = nilai >= 80 ? "bg-emerald-500" : nilai >= 70 ? "bg-blue-500" : nilai >= 60 ? "bg-yellow-500" : "bg-red-400";
  const textColor = nilai >= 80 ? "text-emerald-700 bg-emerald-100" : nilai >= 70 ? "text-blue-700 bg-blue-100" : nilai >= 60 ? "text-yellow-700 bg-yellow-100" : "text-red-700 bg-red-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <div className="p-4 bg-muted/30">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-lg">{materi.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{materi.label}</p>
              <p className="text-xs text-muted-foreground">{materi.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`w-12 text-center text-sm font-bold px-2 py-1 rounded-lg ${textColor}`}>{nilai}</span>
            <button
              type="button"
              onClick={() => setShowTips(v => !v)}
              className="text-muted-foreground/60 hover:text-primary transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input
          type="range" min={0} max={100} step={5}
          value={nilai}
          onChange={e => onNilai(parseInt(e.target.value))}
          className="w-full accent-primary mb-2"
        />
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${nilai}%` }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-primary/5 px-4 py-3"
          >
            <p className="text-xs font-semibold text-primary mb-2">Panduan Penilaian:</p>
            <ul className="space-y-1">
              {materi.tips.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary flex-shrink-0">•</span> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 border-t border-border">
        <input
          type="text"
          value={keterangan}
          onChange={e => onKeterangan(e.target.value)}
          placeholder={`Keterangan ${materi.label} (opsional)...`}
          className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/50"
        />
      </div>
    </motion.div>
  );
};

// ─── Halaman Utama ────────────────────────────────────────────────────────────
const TahsinAssessment = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(studentId ?? "");
  const { data: riwayat = [], isLoading: loadingRiwayat } = useTahsinAssessments(studentId ?? "");
  const addAssessment = useAddTahsinAssessment();

  const [nilai, setNilai] = useState({
    makhraj_huruf: 70, hukum_nun_mati: 70, hukum_mim_mati: 70, mad: 70, tartil: 70,
  });
  const [keterangan, setKeterangan] = useState({
    makhraj_huruf: "", hukum_nun_mati: "", hukum_mim_mati: "", mad: "", tartil: "",
  });
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [result, setResult] = useState<{ total: number; predikat: string } | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!student) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Siswa tidak ditemukan.</div>
  );

  const nilaiTotal = Math.round(
    (nilai.makhraj_huruf + nilai.hukum_nun_mati + nilai.hukum_mim_mati + nilai.mad + nilai.tartil) / 5
  );
  const predikat = getPredikat(nilaiTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const predikatLabel = getPredikat(nilaiTotal).label;
    await addAssessment.mutateAsync({
      student_id: student.id,
      level_dinilai: student.level,
      makhraj_huruf: nilai.makhraj_huruf,
      hukum_nun_mati: nilai.hukum_nun_mati,
      hukum_mim_mati: nilai.hukum_mim_mati,
      mad: nilai.mad,
      tartil: nilai.tartil,
      nilai_total: nilaiTotal,
      predikat: predikatLabel,
      keterangan: keterangan,
      catatan: catatan,
    });
    setResult({ total: nilaiTotal, predikat: predikatLabel });
    setSubmitted(true);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/class/${student.kelas}`} className="hover:text-primary transition-colors">Kelas {student.kelas}</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/student/${student.id}`} className="hover:text-primary transition-colors">{student.nama}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Penilaian Tahsin</span>
      </div>

      {/* Header Siswa */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <BookOpenCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{student.nama}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Kelas {student.kelas}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[student.level as ReadingLevel]}`}>{student.level}</span>
              <span className="text-xs text-muted-foreground">Penilaian Tahsin</span>
            </div>
          </div>
          <button
            onClick={() => setShowRiwayat(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl border border-border hover:border-primary/40"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Riwayat ({riwayat.length})
            {showRiwayat ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Riwayat Penilaian */}
      <AnimatePresence>
        {showRiwayat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Tren Nilai Per Materi</h3>
                <span className="ml-auto text-xs text-muted-foreground">{riwayat.length} penilaian</span>
              </div>
              {loadingRiwayat ? (
                <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <>
                  {/* Line chart tren */}
                  {riwayat.length >= 2 && (
                    <div className="p-4 border-b border-border">
                      <TahsinTrendChart data={riwayat} compact />
                    </div>
                  )}
                  {/* Riwayat list */}
                  {riwayat.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">Belum ada riwayat penilaian.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {riwayat.map(r => {
                        const p = getPredikat(r.nilai_total);
                        return (
                          <div key={r.id} className="p-4 hover:bg-muted/20">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{r.tanggal}</p>
                                <p className="text-xs text-muted-foreground">{r.level_dinilai}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-foreground">{r.nilai_total}</span>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${p.color} ${p.bg} ${p.border}`}>
                                  {p.emoji} {p.label}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                              {MATERI.map(m => (
                                <div key={m.key} className="text-center">
                                  <p className="text-xs text-muted-foreground truncate">{m.label.split(" ")[0]}</p>
                                  <p className={`text-sm font-bold ${r[m.key] >= 80 ? "text-emerald-600" : r[m.key] >= 70 ? "text-blue-600" : r[m.key] >= 60 ? "text-yellow-600" : "text-red-500"}`}>{r[m.key]}</p>
                                </div>
                              ))}
                            </div>
                            {r.catatan && <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-2 italic">"{r.catatan}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form atau Hasil */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview Nilai Total (live) */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Nilai Akhir (Otomatis)
              </h2>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${predikat.color} ${predikat.bg} ${predikat.border}`}>
                {predikat.emoji} {predikat.label}
              </span>
            </div>
            <div className="flex items-end gap-4">
              <span className={`text-5xl font-bold ${predikat.color}`}>{nilaiTotal}</span>
              <div className="flex-1 pb-2">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${nilaiTotal}%` }}
                    transition={{ type: "spring", stiffness: 120 }}
                    className={`h-full rounded-full ${
                      nilaiTotal >= 90 ? "bg-emerald-500" : nilaiTotal >= 80 ? "bg-blue-500" :
                      nilaiTotal >= 70 ? "bg-sky-500" : nilaiTotal >= 60 ? "bg-yellow-500" : "bg-red-400"
                    }`}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
                  <span>Rajih</span><span>Maqbul</span><span>Jayyid</span><span>J. Jiddan</span><span>Mumtaz</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {MATERI.map(m => (
                <div key={m.key} className="text-center p-2 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 truncate">{m.label.split(" ")[0]}</p>
                  <p className={`text-base font-bold ${nilai[m.key] >= 80 ? "text-emerald-600" : nilai[m.key] >= 70 ? "text-blue-600" : nilai[m.key] >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                    {nilai[m.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Penilaian per Materi */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">1</span>
              Penilaian Per Materi
            </h2>
            <div className="space-y-3">
              {MATERI.map(m => (
                <NilaiSlider
                  key={m.key}
                  materi={m}
                  nilai={nilai[m.key]}
                  keterangan={keterangan[m.key]}
                  onNilai={v => setNilai(prev => ({ ...prev, [m.key]: v }))}
                  onKeterangan={v => setKeterangan(prev => ({ ...prev, [m.key]: v }))}
                />
              ))}
            </div>
          </div>

          {/* Catatan Guru */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">2</span>
              Catatan Umum Guru
            </h2>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: Bacaan tartil sudah bagus, namun perlu latihan lebih pada bacaan ikhfa..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={addAssessment.isPending}
            className="w-full py-3.5 bg-gradient-hero text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-green text-base disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {addAssessment.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
            Simpan Penilaian Tahsin
          </button>
        </form>
      ) : (
        /* Hasil */
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center"
        >
          {(() => {
            const p = result ? getPredikat(result.total) : predikat;
            return (
              <>
                <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-4 ${p.bg} ${p.border}`}>
                  <span className="text-4xl">{p.emoji}</span>
                </div>
                <h2 className={`text-3xl font-bold ${p.color} mb-1`}>{p.label}</h2>
                <p className="text-5xl font-black text-foreground my-3">{result?.total}</p>
                <p className="text-muted-foreground mb-5">
                  Penilaian Tahsin <span className="font-semibold text-foreground">{student.nama}</span> berhasil disimpan.
                </p>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {MATERI.map(m => {
                    const mp = getPredikat(nilai[m.key]);
                    return (
                      <div key={m.key} className={`p-3 rounded-xl border ${mp.bg} ${mp.border}`}>
                        <p className="text-xs text-muted-foreground truncate">{m.label.split(" ")[0]}</p>
                        <p className={`text-lg font-bold ${mp.color}`}>{nilai[m.key]}</p>
                      </div>
                    );
                  })}
                </div>
                {catatan && (
                  <p className="text-sm text-muted-foreground italic bg-muted rounded-xl px-4 py-3 mb-6 text-left">"{catatan}"</p>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setSubmitted(false); setResult(null); }}
                    className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Penilaian Baru
                  </button>
                  <Link to={`/student/${student.id}`}>
                    <button className="px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-green">
                      Kembali ke Profil
                    </button>
                  </Link>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
};

export default TahsinAssessment;
