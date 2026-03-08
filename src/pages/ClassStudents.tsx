import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getStudentsByClass, LEVEL_COLORS, type Student } from "@/data/mockData";
import { ChevronRight, Search, UserPlus, FileText, Eye } from "lucide-react";
import { useState } from "react";

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
  const siswa = getStudentsByClass(kelas);
  const [search, setSearch] = useState("");

  const filtered = siswa.filter(s =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Kelas {kelas}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelas {kelas}</h1>
          <p className="text-muted-foreground text-sm">{siswa.length} siswa terdaftar</p>
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
            <UserPlus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Class navigation */}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">No</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Nama Siswa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Level Bacaan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Buku Iqro</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Halaman</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Status Bacaan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-xs font-bold">
                          {s.nama.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{s.nama}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[s.level]}`}>
                      {s.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-muted-foreground">
                    {s.level.startsWith("Iqro") ? s.level : "Juz Amma"}
                  </td>
                  <td className="py-3.5 px-4 text-sm font-medium text-foreground">{s.halamanTerakhir}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[s.statusBacaan]}`}>
                      {s.statusBacaan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/student/${s.id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs font-medium transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </Link>
                      <Link to={`/exam/${s.id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-yellow-700 rounded-lg text-xs font-medium transition-colors">
                          <FileText className="w-3.5 h-3.5" />
                          Ujian
                        </button>
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Tidak ada siswa ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassStudents;
