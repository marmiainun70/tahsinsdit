import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useStudents, LEVELS, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, TrendingUp, BookOpen, Award, Star, Loader2, AlertTriangle, BookOpenCheck, ChevronRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#f97316", "#ec4899", "#14b8a6"];

const Monitoring = () => {
  const { data: students = [], isLoading } = useStudents();
  const total = students.length;

  const levelCount: Record<string, number> = {};
  LEVELS.forEach(l => { levelCount[l] = 0; });
  students.forEach(s => { levelCount[s.level] = (levelCount[s.level] || 0) + 1; });

  const iqroCount = LEVELS.filter(l => l.startsWith("Iqro")).reduce((a, l) => a + (levelCount[l] || 0), 0);
  const tahsinCount = (levelCount["Tahsin Dasar"] || 0) + (levelCount["Tahsin Lanjutan"] || 0);
  const tahfizhCount = levelCount["Tahfizh"] || 0;
  const perluPerhatian = students.filter(s => (s as any).perlu_perhatian === true);

  const levelData = LEVELS.map(l => ({
    level: l.replace("Tahsin Dasar", "Ts. Dasar").replace("Tahsin Lanjutan", "Ts. Lanjutan"),
    fullName: l,
    count: levelCount[l] || 0,
  }));

  const classData = [1, 2, 3, 4, 5, 6].map(k => {
    const cls = students.filter(s => s.kelas === k);
    return {
      kelas: `Kelas ${k}`,
      iqro: cls.filter(s => s.level.startsWith("Iqro")).length,
      tahsinDasar: cls.filter(s => s.level === "Tahsin Dasar").length,
      tahsinLanjutan: cls.filter(s => s.level === "Tahsin Lanjutan").length,
      tahfizh: cls.filter(s => s.level === "Tahfizh").length,
    };
  });

  const pieData = LEVELS.filter(l => (levelCount[l] || 0) > 0).map((l, i) => ({
    name: l, value: levelCount[l] || 0, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold mb-1">Monitoring Seluruh Siswa</h1>
        <p className="text-primary-foreground/70 text-sm">Rekap perkembangan belajar Al-Qur'an — SD Islam</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Siswa", value: total, icon: Users, color: "bg-primary" },
          { label: "Sedang Iqro", value: iqroCount, icon: BookOpen, color: "bg-blue-500" },
          { label: "Program Tahsin", value: tahsinCount, icon: Star, color: "bg-gold" },
          { label: "Program Tahfizh", value: tahfizhCount, icon: Award, color: "bg-purple-600" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Panel Peringatan */}
      {perluPerhatian.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
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
              <p className="text-xs text-destructive/70">Nilai rata-rata Tahsin &lt; 70 selama 2 penilaian berturut-turut</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perluPerhatian.map(s => (
              <Link key={s.id} to={`/tahsin/${s.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-card hover:bg-destructive/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive font-bold text-sm">{s.nama.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.nama}</p>
                    <p className="text-xs text-muted-foreground">Kelas {s.kelas} · {s.level}</p>
                  </div>
                  <BookOpenCheck className="w-4 h-4 text-destructive/50 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {total === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Belum ada data siswa</p>
          <p className="text-sm text-muted-foreground mt-1">Tambahkan siswa melalui halaman kelas untuk melihat monitoring</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Distribusi Siswa Per Level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LEVELS.map((level, i) => {
                const count = levelCount[level] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <motion.div key={level} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                    <span className={`text-xs font-medium px-2.5 py-1.5 rounded-lg w-28 text-center flex-shrink-0 ${LEVEL_COLORS[level as ReadingLevel]}`}>{level}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{pct}%</span>
                        <span className="font-semibold text-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4 + i * 0.05 }} className="h-full bg-gradient-hero rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="font-bold text-foreground mb-4">📊 Jumlah Siswa Per Level</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={levelData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="level" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v, _n, props) => [v, props.payload.fullName]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="font-bold text-foreground mb-4">🥧 Proporsi Level Bacaan</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                  <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4">📈 Perkembangan Per Kelas</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="kelas" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="iqro" name="Iqro" fill="#3b82f6" stackId="a" />
                <Bar dataKey="tahsinDasar" name="Tahsin Dasar" fill="#f59e0b" stackId="a" />
                <Bar dataKey="tahsinLanjutan" name="Tahsin Lanjutan" fill="#10b981" stackId="a" />
                <Bar dataKey="tahfizh" name="Tahfizh" fill="#8b5cf6" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Daftar Seluruh Siswa</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{total} siswa terdaftar</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {["No", "Nama", "Kelas", "Level", "Status Bacaan", "Halaman", "Flag"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s, i) => {
                    const flagged = (s as any).perlu_perhatian === true;
                    return (
                      <tr key={s.id} className={`hover:bg-muted/20 transition-colors ${flagged ? "bg-destructive/5" : ""}`}>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {flagged && (
                              <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                            )}
                            <Link to={`/student/${s.id}`} className="hover:text-primary transition-colors">{s.nama}</Link>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{s.kelas}</td>
                        <td className="py-3 px-4"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.level as ReadingLevel]}`}>{s.level}</span></td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{s.status_bacaan}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">{s.halaman_terakhir}</td>
                        <td className="py-3 px-4">
                          {flagged && (
                            <Link to={`/tahsin/${s.id}`}>
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap">⚠ Perlu Perhatian</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Monitoring;
