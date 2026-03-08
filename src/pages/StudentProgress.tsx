import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { students, LEVEL_COLORS } from "@/data/mockData";
import { ChevronRight, TrendingUp, Award, BookOpen, CalendarDays, ClipboardList } from "lucide-react";

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
  const student = students.find(s => s.id === studentId);

  if (!student) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Siswa tidak ditemukan.
    </div>
  );

  const latestProgress = student.progres[student.progres.length - 1];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
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
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[student.level]}`}>{student.level}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">Hal. {student.halamanTerakhir}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/exam/${student.id}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-gold">
                <ClipboardList className="w-4 h-4" />
                Ujian Kenaikan
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Score Summary */}
      {latestProgress && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Kelancaran", value: latestProgress.kelancaran, icon: TrendingUp, color: "text-blue-500 bg-blue-50" },
            { label: "Makhraj", value: latestProgress.makhraj, icon: BookOpen, color: "text-emerald-500 bg-emerald-50" },
            { label: "Tajwid", value: latestProgress.tajwid, icon: Award, color: "text-purple-500 bg-purple-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm"
            >
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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Tanggal", "Buku Iqro", "Halaman", "Kelancaran", "Makhraj", "Tajwid", "Catatan Guru"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {student.progres.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{p.tanggal}</td>
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{p.buku}</td>
                  <td className="py-3 px-4 text-sm text-foreground font-semibold">{p.halaman}</td>
                  {[p.kelancaran, p.makhraj, p.tajwid].map((v, j) => (
                    <td key={j} className="py-3 px-4">
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${v >= 80 ? "bg-emerald-100 text-emerald-700" : v >= 65 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {v}
                      </span>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs">{p.catatan}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tambah Progres Form */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Catat Progres Hari Ini
        </h2>
        <AddProgressForm studentId={student.id} level={student.level} />
      </div>

      {/* Exam History */}
      {student.ujian.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            <h2 className="font-bold text-foreground">Riwayat Ujian Kenaikan</h2>
          </div>
          <div className="p-5 space-y-4">
            {student.ujian.map(u => (
              <div key={u.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-foreground">Ujian {u.levelDiuji}</p>
                    <p className="text-xs text-muted-foreground">{u.tanggal}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${u.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {u.hasil}
                  </span>
                </div>
                <div className="space-y-2">
                  <ScoreBar value={u.kelancaran} label="Kelancaran" />
                  <ScoreBar value={u.makhraj} label="Makhraj" />
                  <ScoreBar value={u.tajwid} label="Tajwid" />
                  <ScoreBar value={u.adab} label="Adab Membaca" />
                </div>
                {u.catatan && (
                  <p className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 italic">"{u.catatan}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AddProgressForm = ({ studentId, level }: { studentId: string; level: string }) => {
  const [form, setForm] = useState({
    halaman: "",
    kelancaran: "",
    makhraj: "",
    tajwid: "",
    catatan: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ halaman: "", kelancaran: "", makhraj: "", tajwid: "", catatan: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Buku</label>
        <input
          type="text"
          defaultValue={level}
          readOnly
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-muted-foreground"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Halaman</label>
        <input
          type="number"
          value={form.halaman}
          onChange={e => setForm(f => ({ ...f, halaman: e.target.value }))}
          placeholder="Nomor halaman"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>
      {[["Kelancaran", "kelancaran"], ["Makhraj", "makhraj"], ["Tajwid", "tajwid"]].map(([label, key]) => (
        <div key={key}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label} (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder="0–100"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      ))}
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Catatan Guru</label>
        <input
          type="text"
          value={form.catatan}
          onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
          placeholder="Catatan untuk siswa..."
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-green"
        >
          {saved ? "✓ Tersimpan!" : "Simpan Progres"}
        </button>
      </div>
    </form>
  );
};

export default StudentProgress;
