import { motion } from "framer-motion";
import { students, LEVELS, LEVEL_COLORS, getOverallStats, getClassStats } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, TrendingUp, BookOpen, Award, Star } from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#f97316", "#ec4899", "#14b8a6"];

const Monitoring = () => {
  const overall = getOverallStats();

  const levelData = LEVELS.map(l => ({
    level: l.replace("Iqro ", "Iqro ").replace("Tahsin ", "Ts.").replace("Tahfizh", "Tahfizh"),
    fullName: l,
    count: overall.levelCount[l] || 0,
  }));

  const classData = [1, 2, 3, 4, 5, 6].map(k => {
    const stats = getClassStats(k);
    return {
      kelas: `Kelas ${k}`,
      iqro: stats.iqro,
      tahsinDasar: stats.tahsinDasar,
      tahsinLanjutan: stats.tahsinLanjutan,
      tahfizh: stats.tahfizh,
    };
  });

  const pieData = LEVELS.filter(l => (overall.levelCount[l] || 0) > 0).map((l, i) => ({
    name: l,
    value: overall.levelCount[l] || 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const statCards = [
    { label: "Total Siswa", value: overall.total, icon: Users, color: "bg-primary" },
    { label: "Sedang Iqro", value: LEVELS.filter(l => l.startsWith("Iqro")).reduce((a, l) => a + (overall.levelCount[l] || 0), 0), icon: BookOpen, color: "bg-blue-500" },
    { label: "Program Tahsin", value: (overall.levelCount["Tahsin Dasar"] || 0) + (overall.levelCount["Tahsin Lanjutan"] || 0), icon: Star, color: "bg-gold" },
    { label: "Program Tahfizh", value: overall.levelCount["Tahfizh"] || 0, icon: Award, color: "bg-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground"
      >
        <h1 className="text-2xl font-bold mb-1">Monitoring Seluruh Siswa</h1>
        <p className="text-primary-foreground/70 text-sm">Rekap perkembangan belajar Al-Qur'an — SD Islam Tahun Ajaran 2024/2025</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Level Distribution Table */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Distribusi Siswa Per Level
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEVELS.map((level, i) => {
            const count = overall.levelCount[level] || 0;
            const pct = Math.round((count / overall.total) * 100);
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl"
              >
                <span className={`text-xs font-medium px-2.5 py-1.5 rounded-lg w-28 text-center flex-shrink-0 ${LEVEL_COLORS[level]}`}>
                  {level}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{pct}%</span>
                    <span className="font-semibold text-foreground">{count} siswa</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-hero rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart - Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-sm"
        >
          <h2 className="font-bold text-foreground mb-4">📊 Jumlah Siswa Per Level</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={levelData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="level" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v, _n, props) => [v, props.payload.fullName]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-sm"
        >
          <h2 className="font-bold text-foreground mb-4">🥧 Proporsi Level Bacaan</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
              />
              <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Stacked Bar Chart per Kelas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl border border-border p-5 shadow-sm"
      >
        <h2 className="font-bold text-foreground mb-4">📈 Perkembangan Per Kelas</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="kelas" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
            />
            <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            <Bar dataKey="iqro" name="Iqro" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="tahsinDasar" name="Tahsin Dasar" fill="#f59e0b" stackId="a" />
            <Bar dataKey="tahsinLanjutan" name="Tahsin Lanjutan" fill="#10b981" stackId="a" />
            <Bar dataKey="tahfizh" name="Tahfizh" fill="#8b5cf6" stackId="a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* All students table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-foreground">Daftar Seluruh Siswa</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{overall.total} siswa terdaftar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["No", "Nama", "Kelas", "Level", "Status Bacaan", "Halaman"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">{s.nama}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{s.kelas}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{s.statusBacaan}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-foreground">{s.halamanTerakhir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
