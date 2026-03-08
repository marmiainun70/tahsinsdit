import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStudents } from "@/hooks/useSupabaseData";
import { LEVELS, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { Users, BookOpen, Star, TrendingUp, Award, Loader2, AlertTriangle, ChevronRight, BookOpenCheck } from "lucide-react";

const classColors = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
];

const Dashboard = () => {
  const { data: students = [], isLoading } = useStudents();

  const total = students.length;
  const iqroCount = students.filter(s => s.level.startsWith("Iqro")).length;
  const tahsinCount = students.filter(s => s.level === "Tahsin Dasar" || s.level === "Tahsin Lanjutan").length;
  const tahfizhCount = students.filter(s => s.level === "Tahfizh").length;
  const perluPerhatian = students.filter(s => (s as any).perlu_perhatian === true);

  const getClassStats = (kelas: number) => {
    const cls = students.filter(s => s.kelas === kelas);
    return {
      total: cls.length,
      iqro: cls.filter(s => s.level.startsWith("Iqro")).length,
      tahsinDasar: cls.filter(s => s.level === "Tahsin Dasar").length,
      tahsinLanjutan: cls.filter(s => s.level === "Tahsin Lanjutan").length,
      tahfizh: cls.filter(s => s.level === "Tahfizh").length,
      rombel: {
        A: cls.filter(s => (s as any).rombel === "A").length,
        B: cls.filter(s => (s as any).rombel === "B").length,
        C: cls.filter(s => (s as any).rombel === "C").length,
        D: cls.filter(s => (s as any).rombel === "D").length,
      },
    };
  };

  const statCards = [
    { label: "Total Siswa", value: total, icon: Users, color: "bg-primary", sub: "Seluruh kelas" },
    { label: "Level Iqro", value: iqroCount, icon: BookOpen, color: "bg-gold", sub: "Iqro 1–6" },
    { label: "Level Tahsin", value: tahsinCount, icon: Star, color: "bg-emerald-600", sub: "Dasar & Lanjutan" },
    { label: "Tahfizh", value: tahfizhCount, icon: Award, color: "bg-purple-600", sub: "Hafalan" },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm mb-1">Selamat Datang 👋</p>
          <h1 className="text-2xl font-bold mb-1">Sistem Monitoring Iqro & Tahsin</h1>
          <p className="text-primary-foreground/70 text-sm">SD Islam — Tahun Ajaran 2024/2025</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-5 shadow-sm border border-border"
          >
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Panel Peringatan Siswa Tahsin */}
      <AnimatePresence>
        {perluPerhatian.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-destructive/5 border border-destructive/30 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-destructive/20 bg-destructive/10">
              <div className="w-8 h-8 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">
                  {perluPerhatian.length} Siswa Tahsin Perlu Perhatian Khusus
                </p>
                <p className="text-xs text-destructive/70">
                  Nilai rata-rata di bawah 70 selama 2 penilaian berturut-turut
                </p>
              </div>
            </div>
            <div className="divide-y divide-destructive/10">
              {perluPerhatian.map(s => (
                <Link key={s.id} to={`/tahsin/${s.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3 hover:bg-destructive/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-destructive font-bold text-sm">{s.nama.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.nama}</p>
                      <p className="text-xs text-muted-foreground">
                        Kelas {s.kelas} · {s.level}
                        {(s as any).catatan_perhatian && (
                          <span className="ml-1 italic text-destructive/70">— {(s as any).catatan_perhatian}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        ⚠ Perlu Perhatian
                      </span>
                      <ChevronRight className="w-4 h-4 text-destructive/50" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Ringkasan Per Kelas</h2>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">6 Kelas Aktif</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((kelas, i) => {
            const stats = getClassStats(kelas);
            const tahsinTotal = stats.tahsinDasar + stats.tahsinLanjutan + stats.tahfizh;
            const pct = stats.total > 0 ? Math.round(tahsinTotal / stats.total * 100) : 0;
            return (
              <motion.div
                key={kelas}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link to={`/class/${kelas}`}>
                  <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-green transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                    <div className={`h-2 bg-gradient-to-r ${classColors[i]}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">KELAS</p>
                          <h3 className="text-2xl font-bold text-foreground">{kelas}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${classColors[i]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                       <div className="mb-3">
                         <div className="flex justify-between text-xs text-muted-foreground mb-1">
                           <span>Tahsin</span>
                           <span>{pct}%</span>
                         </div>
                         <div className="h-2 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                         </div>
                       </div>
                       {/* Rombel breakdown */}
                       <div className="grid grid-cols-4 gap-1.5 mb-3">
                         {(["A","B","C","D"] as const).map((r, ri) => {
                           const rombelColors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-orange-500"];
                           return (
                             <div key={r} className="rounded-xl p-2 text-center bg-muted/60">
                               <div className={`w-4 h-1 rounded-full ${rombelColors[ri]} mx-auto mb-1`} />
                               <p className="text-xs font-bold text-foreground">{stats.rombel[r]}</p>
                               <p className="text-xs text-muted-foreground">{r}</p>
                             </div>
                           );
                         })}
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <div className="bg-muted rounded-xl p-2.5 text-center">
                           <p className="text-lg font-bold text-foreground">{stats.total}</p>
                           <p className="text-xs text-muted-foreground">Total</p>
                         </div>
                         <div className="bg-muted rounded-xl p-2.5 text-center">
                           <p className="text-lg font-bold text-foreground">{stats.tahsinDasar + stats.tahsinLanjutan + stats.tahfizh}</p>
                           <p className="text-xs text-muted-foreground">Tahsin</p>
                         </div>
                       </div>
                      <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium group-hover:gap-2 transition-all">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Lihat detail kelas {kelas}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {students.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-4">Distribusi Level Seluruh Siswa</h2>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const count = students.filter(s => s.level === level).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-28 text-center flex-shrink-0 ${LEVEL_COLORS[level]}`}>
                    {level}
                  </span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-full bg-gradient-hero rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {students.length === 0 && !isLoading && (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">Belum ada data siswa</p>
          <p className="text-sm text-muted-foreground mb-4">Mulai tambahkan siswa melalui halaman kelas</p>
          <Link to="/class/1">
            <button className="px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-green">
              Tambah Siswa Pertama
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
