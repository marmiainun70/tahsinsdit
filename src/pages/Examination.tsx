import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { students, LEVEL_COLORS, LEVELS, getNextLevel } from "@/data/mockData";
import { ChevronRight, Award, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

const Examination = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = students.find(s => s.id === studentId);

  const [form, setForm] = useState({
    kelancaran: 0,
    makhraj: 0,
    tajwid: 0,
    adab: 0,
    kesalahanMakhraj: 0,
    kesalahanTajwid: 0,
    terhenti: 0,
    dibantuGuru: 0,
    catatan: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [hasil, setHasil] = useState<"Lulus" | "Tidak Lulus" | null>(null);

  if (!student) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">Siswa tidak ditemukan.</div>
  );

  const nilaiRata = Math.round((form.kelancaran + form.makhraj + form.tajwid + form.adab) / 4);
  const lulus = nilaiRata >= 80;
  const nextLevel = getNextLevel(student.level);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasil(lulus ? "Lulus" : "Tidak Lulus");
    setSubmitted(true);
  };

  const NilaiInput = ({ label, field }: { label: string; field: keyof typeof form }) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={form[field] as number}
          onChange={e => setForm(f => ({ ...f, [field]: parseInt(e.target.value) }))}
          className="flex-1 accent-primary"
        />
        <span className={`w-12 text-center text-sm font-bold px-2 py-1 rounded-lg ${
          (form[field] as number) >= 80 ? "bg-emerald-100 text-emerald-700" :
          (form[field] as number) >= 65 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"
        }`}>
          {form[field] as number}
        </span>
      </div>
    </div>
  );

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
        <span className="text-foreground font-medium">Ujian Kenaikan</span>
      </div>

      {/* Student info */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center shadow-gold">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{student.nama}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">Kelas {student.kelas}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[student.level]}`}>
                Ujian: {student.level}
              </span>
              {nextLevel && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  → Target: <span className={`px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[nextLevel]}`}>{nextLevel}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nilai Utama */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gold flex items-center justify-center text-white text-xs">1</span>
              Penilaian Bacaan
            </h2>
            <div className="space-y-4">
              <NilaiInput label="Kelancaran (0-100)" field="kelancaran" />
              <NilaiInput label="Makhraj (0-100)" field="makhraj" />
              <NilaiInput label="Tajwid (0-100)" field="tajwid" />
              <NilaiInput label="Adab Membaca (0-100)" field="adab" />
            </div>

            {/* Rata-rata preview */}
            <div className="mt-5 p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Nilai Rata-rata</span>
                <span className={`text-2xl font-bold ${nilaiRata >= 80 ? "text-emerald-600" : nilaiRata >= 65 ? "text-yellow-600" : "text-red-500"}`}>
                  {nilaiRata}
                </span>
              </div>
              <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${nilaiRata}%` }}
                  className={`h-full rounded-full ${nilaiRata >= 80 ? "bg-emerald-500" : nilaiRata >= 65 ? "bg-yellow-500" : "bg-red-400"}`}
                />
              </div>
              <p className={`mt-2 text-xs font-medium ${nilaiRata >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
                {nilaiRata >= 80 ? "✓ Memenuhi syarat kenaikan level (≥80)" : "⚠ Belum memenuhi syarat kenaikan level (<80)"}
              </p>
            </div>
          </div>

          {/* Kesalahan */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gold flex items-center justify-center text-white text-xs">2</span>
              Catatan Kesalahan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Kesalahan Makhraj", "kesalahanMakhraj"],
                ["Kesalahan Tajwid", "kesalahanTajwid"],
                ["Terhenti", "terhenti"],
                ["Dibantu Guru", "dibantuGuru"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={form[key as keyof typeof form] as number}
                    onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gold flex items-center justify-center text-white text-xs">3</span>
              Catatan Penguji
            </h2>
            <textarea
              value={form.catatan}
              onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
              placeholder="Contoh: Bacaan cukup baik namun masih perlu latihan makhraj..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-hero text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-green text-base"
          >
            Selesai & Tentukan Hasil Ujian
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center"
        >
          {hasil === "Lulus" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-600 mb-2">LULUS! 🎉</h2>
              <p className="text-muted-foreground mb-4">
                <span className="font-semibold text-foreground">{student.nama}</span> berhasil lulus ujian {student.level}
              </p>
              {nextLevel && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <p className="text-emerald-700 font-medium">
                    Siswa akan naik ke level: <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${LEVEL_COLORS[nextLevel]}`}>{nextLevel}</span>
                  </p>
                  {nextLevel === "Tahsin Dasar" && (
                    <p className="text-emerald-600 text-sm mt-1">🌟 Selamat! Siswa telah menyelesaikan seluruh Iqro dan siap masuk program Tahsin!</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  ["Kelancaran", form.kelancaran],
                  ["Makhraj", form.makhraj],
                  ["Tajwid", form.tajwid],
                  ["Adab", form.adab],
                ].map(([l, v]) => (
                  <div key={l} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-600 mb-2">Perlu Perbaikan</h2>
              <p className="text-muted-foreground mb-4">
                <span className="font-semibold text-foreground">{student.nama}</span> belum memenuhi syarat kenaikan level.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-700 text-sm">Nilai rata-rata: <span className="font-bold">{nilaiRata}</span> (minimal 80 untuk naik level)</p>
                <p className="text-yellow-600 text-xs mt-1">Siswa perlu mengulang dan latihan lebih banyak sebelum ujian ulang.</p>
              </div>
            </>
          )}
          {form.catatan && (
            <p className="text-sm text-muted-foreground italic bg-muted rounded-xl px-4 py-3 mb-6">"{form.catatan}"</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setHasil(null); }}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Ujian Ulang
            </button>
            <Link to={`/student/${student.id}`}>
              <button className="px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-green">
                Kembali ke Profil
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Examination;
