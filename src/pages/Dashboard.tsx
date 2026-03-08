import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getClassStats, getOverallStats, LEVELS, LEVEL_COLORS } from "@/data/mockData";
import { Users, BookOpen, Star, TrendingUp, Award } from "lucide-react";

const classColors = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
];

const Dashboard = () => {
  const overall = getOverallStats();

  const statCards = [
    { label: "Total Siswa", value: overall.total, icon: Users, color: "bg-primary", sub: "Seluruh kelas" },
    { label: "Level Iqro", value: LEVELS.filter(l => l.startsWith("Iqro")).reduce((a, l) => a + (overall.levelCount[l] || 0), 0), icon: BookOpen, color: "bg-gold", sub: "Iqro 1–6" },
    { label: "Level Tahsin", value: (overall.levelCount["Tahsin Dasar"] || 0) + (overall.levelCount["Tahsin Lanjutan"] || 0), icon: Star, color: "bg-emerald-600", sub: "Dasar & Lanjutan" },
    { label: "Tahfizh", value: overall.levelCount["Tahfizh"] || 0, icon: Award, color: "bg-purple-600", sub: "Hafalan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm mb-1">Selamat Datang, Guru Admin 👋</p>
          <h1 className="text-2xl font-bold mb-1">Sistem Monitoring Iqro & Tahsin</h1>
          <p className="text-primary-foreground/70 text-sm">SD Islam — Tahun Ajaran 2024/2025</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
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

      {/* Class Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Ringkasan Per Kelas</h2>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">6 Kelas Aktif</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((kelas, i) => {
            const stats = getClassStats(kelas);
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

                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Tahsin</span>
                          <span>{((stats.tahsinDasar + stats.tahsinLanjutan + stats.tahfizh) / stats.total * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                            style={{ width: `${(stats.tahsinDasar + stats.tahsinLanjutan + stats.tahfizh) / stats.total * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-blue-600">{stats.iqro}</p>
                          <p className="text-xs text-blue-400">Iqro</p>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-yellow-600">{stats.tahsinDasar}</p>
                          <p className="text-xs text-yellow-400">Tahsin Dasar</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <p className="text-lg font-bold text-emerald-600">{stats.tahsinLanjutan + stats.tahfizh}</p>
                          <p className="text-xs text-emerald-400">Tahsin Lanjut</p>
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

      {/* Level Summary */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-4">Distribusi Level Seluruh Siswa</h2>
        <div className="space-y-3">
          {LEVELS.map((level) => {
            const count = overall.levelCount[level] || 0;
            const pct = (count / overall.total) * 100;
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
    </div>
  );
};

export default Dashboard;
