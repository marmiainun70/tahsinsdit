import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStudentsByClass, useAddStudent, useDeleteStudent, LEVEL_COLORS, LEVELS } from "@/hooks/useSupabaseData";
import { ChevronRight, Search, UserPlus, FileText, Eye, Trash2, Loader2, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

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

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<ReadingLevel>("Iqro 1");

  const filtered = students.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addStudent.mutateAsync({ nama: newName.trim(), kelas, level: newLevel });
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Kelas {kelas}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelas {kelas}</h1>
          <p className="text-muted-foreground text-sm">{students.length} siswa terdaftar</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
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
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border-2 border-primary/20 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Tambah Siswa Baru — Kelas {kelas}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nama lengkap siswa"
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              autoFocus
            />
            <select
              value={newLevel}
              onChange={e => setNewLevel(e.target.value as ReadingLevel)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              type="submit"
              disabled={addStudent.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {addStudent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Simpan
            </button>
          </form>
        </motion.div>
      )}

      {/* Class Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["No", "Nama Siswa", "Level Bacaan", "Buku Iqro", "Halaman", "Status Bacaan", "Aksi"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-xs font-bold">{s.nama.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{s.nama}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground">{s.level.startsWith("Iqro") ? s.level : "Juz Amma"}</td>
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
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {students.length === 0 ? "Belum ada siswa. Klik 'Tambah' untuk menambahkan." : "Tidak ada siswa ditemukan."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassStudents;
