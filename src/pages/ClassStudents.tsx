import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStudentsByClass, useAddStudent, useDeleteStudent, LEVEL_COLORS, LEVELS } from "@/hooks/useSupabaseData";
import { ChevronRight, Search, UserPlus, FileText, Eye, Trash2, Loader2, X, AlertTriangle, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import BulkImportStudents from "@/components/BulkImportStudents";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const ROMBEL = ["A", "B", "C", "D"] as const;
type Rombel = typeof ROMBEL[number];

const ROMBEL_COLORS: Record<Rombel, string> = {
  A: "bg-blue-500",
  B: "bg-emerald-500",
  C: "bg-violet-500",
  D: "bg-orange-500",
};

const ROMBEL_TAB_ACTIVE: Record<Rombel, string> = {
  A: "bg-blue-500 text-white shadow-md",
  B: "bg-emerald-500 text-white shadow-md",
  C: "bg-violet-500 text-white shadow-md",
  D: "bg-orange-500 text-white shadow-md",
};

const STATUS_COLORS = {
  "Lancar": "bg-emerald-100 text-emerald-700",
  "Cukup": "bg-blue-100 text-blue-700",
  "Perlu Latihan": "bg-yellow-100 text-yellow-700",
  "Terbata-bata": "bg-red-100 text-red-700",
};

const ClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const kelas = parseInt(classId || "1");
  const { data: students = [], isLoading } = useStudentsByClass(kelas);
  const addStudent = useAddStudent();
  const deleteStudent = useDeleteStudent();

  const [activeRombel, setActiveRombel] = useState<Rombel>("A");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<ReadingLevel>("Iqro 1");
  const [newRombel, setNewRombel] = useState<Rombel>("A");

  const rombelStudents = students.filter(s => (s as any).rombel === activeRombel);
  const filtered = rombelStudents.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addStudent.mutateAsync({ nama: newName.trim(), kelas, level: newLevel, rombel: newRombel });
    setNewName("");
    setNewLevel("Iqro 1");
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus siswa ini?")) return;
    await deleteStudent.mutateAsync({ id, kelas });
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Kelas {kelas} — Rombel {activeRombel}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kelas {kelas}
            <span className={`ml-2 inline-flex w-8 h-8 rounded-xl ${ROMBEL_COLORS[activeRombel]} items-center justify-center text-white text-sm font-bold`}>
              {activeRombel}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {rombelStudents.length} siswa di Rombel {activeRombel} · {students.length} total Kelas {kelas}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={() => { setShowAddForm(true); setNewRombel(activeRombel); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Class Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3, 4, 5, 6].map(k => (
          <button
            key={k}
            onClick={() => navigate(`/class/${k}`)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              k === kelas
                ? "bg-primary text-primary-foreground shadow-green"
                : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            Kelas {k}
          </button>
        ))}
      </div>

      {/* Rombel Tabs + Stats */}
      <div className="grid grid-cols-4 gap-3">
        {ROMBEL.map(r => {
          const count = students.filter(s => (s as any).rombel === r).length;
          const isActive = r === activeRombel;
          return (
            <button
              key={r}
              onClick={() => setActiveRombel(r)}
              className={`relative rounded-2xl p-4 text-left transition-all border ${
                isActive
                  ? "border-transparent " + ROMBEL_COLORS[r].replace("bg-", "bg-") + " text-white shadow-md scale-[1.02]"
                  : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-2xl font-black ${isActive ? "text-white" : "text-foreground"}`}>{r}</span>
                {isActive && (
                  <motion.div
                    layoutId="rombel-indicator"
                    className="w-2 h-2 rounded-full bg-white/80"
                  />
                )}
              </div>
              <p className={`text-xs font-medium ${isActive ? "text-white/80" : "text-muted-foreground"}`}>Rombel {r}</p>
              <p className={`text-lg font-bold mt-0.5 ${isActive ? "text-white" : "text-foreground"}`}>{count} siswa</p>
            </button>
          );
        })}
      </div>

      {/* Add Student Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-2xl border-2 border-primary/20 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Tambah Siswa — Kelas {kelas}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nama lengkap siswa"
                className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                {ROMBEL.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRombel(r)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      newRombel === r
                        ? ROMBEL_COLORS[r] + " text-white border-transparent"
                        : "bg-card border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value as ReadingLevel)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={addStudent.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {addStudent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className={`h-1.5 ${ROMBEL_COLORS[activeRombel]}`} />
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg ${ROMBEL_COLORS[activeRombel]} flex items-center justify-center text-white text-xs font-bold`}>
              {activeRombel}
            </span>
            Rombel {activeRombel} — Kelas {kelas}
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{rombelStudents.length} siswa</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["No", "Nama Siswa", "Level Bacaan", "Halaman", "Status Bacaan", "Aksi"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s, i) => {
                  const flagged = (s as any).perlu_perhatian === true;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`hover:bg-muted/30 transition-colors ${flagged ? "bg-destructive/5" : ""}`}
                    >
                      <td className="py-3.5 px-4 text-sm text-muted-foreground">{i + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${ROMBEL_COLORS[activeRombel]} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">{s.nama.charAt(0)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">{s.nama}</span>
                            {flagged && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle className="w-3 h-3" /> Perlu Perhatian
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-medium text-foreground">{s.halaman_terakhir}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status_bacaan]}`}>{s.status_bacaan}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/student/${s.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs font-medium transition-colors">
                              <Eye className="w-3.5 h-3.5" />Detail
                            </button>
                          </Link>
                          <Link to={`/exam/${s.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-yellow-700 rounded-lg text-xs font-medium transition-colors">
                              <FileText className="w-3.5 h-3.5" />Ujian
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {rombelStudents.length === 0
                    ? `Belum ada siswa di Rombel ${activeRombel}. Klik 'Tambah' untuk menambahkan.`
                    : "Tidak ada siswa ditemukan."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showImport && (
          <BulkImportStudents
            onClose={() => setShowImport(false)}
            defaultKelas={kelas}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassStudents;
