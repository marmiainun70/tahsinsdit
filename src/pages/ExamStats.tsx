import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import { useAllExamRecords, useStudents } from "@/hooks/useSupabaseData";
import { Award, CheckCircle, XCircle, Users, TrendingUp, AlertTriangle, Eye } from "lucide-react";
import { Loader2 } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

const formatMonth = (yyyy_mm: string) => {
  const [y, m] = yyyy_mm.split("-");
  return `${MONTH_NAMES[parseInt(m) - 1]} '${y.slice(2)}`;
};

// Colour per class
const CLASS_COLORS = ["#16a34a","#0ea5e9","#a855f7","#f59e0b","#ef4444","#ec4899"];

// ─── custom tooltip ────────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-md px-4 py-3 text-sm space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-auto pl-3">{p.value}%</span>
        </p>
      ))}
    </div>
  );
};

// ─── component ─────────────────────────────────────────────────────────────────
const ExamStats = () => {
  const { data: exams = [], isLoading: loadingExams } = useAllExamRecords();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const isLoading = loadingExams || loadingStudents;

  // ── 1. Kelulusan per kelas ─────────────────────────────────────────────────
  const byClass = useMemo(() => {
    const map: Record<number, { total: number; lulus: number }> = {};
    exams.forEach(e => {
      const k = (e as any).students?.kelas as number;
      if (!k) return;
      if (!map[k]) map[k] = { total: 0, lulus: 0 };
      map[k].total++;
      if (e.hasil === "Lulus") map[k].lulus++;
    });
    return [1, 2, 3, 4, 5, 6].map(k => ({
      kelas: `Kelas ${k}`,
      pct: map[k] ? Math.round((map[k].lulus / map[k].total) * 100) : 0,
      lulus: map[k]?.lulus ?? 0,
      total: map[k]?.total ?? 0,
    }));
  }, [exams]);

  // ── 2. Tren kelulusan per bulan, dibagi per jenis ujian ────────────────────
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { dasar: { t: number; l: number }; lanjutan: { t: number; l: number } }> = {};
    exams.forEach(e => {
      const ym = e.tanggal.slice(0, 7); // "yyyy-mm"
      if (!map[ym]) map[ym] = { dasar: { t: 0, l: 0 }, lanjutan: { t: 0, l: 0 } };
      const isDasar = ["Iqro 1","Iqro 2","Iqro 3","Iqro 4","Iqro 5","Iqro 6","Tahsin Dasar"].includes(e.level_diuji);
      const bucket = isDasar ? map[ym].dasar : map[ym].lanjutan;
      bucket.t++;
      if (e.hasil === "Lulus") bucket.l++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // last 12 months
      .map(([ym, v]) => ({
        bulan: formatMonth(ym),
        "Tahsin Dasar": v.dasar.t ? Math.round((v.dasar.l / v.dasar.t) * 100) : null,
        "Tahsin Lanjutan": v.lanjutan.t ? Math.round((v.lanjutan.l / v.lanjutan.t) * 100) : null,
      }));
  }, [exams]);

  // ── 3. Siswa yang belum pernah ujian kenaikan level ───────────────────────
  const neverExamined = useMemo(() => {
    const examStudentIds = new Set(exams.map(e => e.student_id));
    return students
      .filter(s => !examStudentIds.has(s.id))
      .sort((a, b) => a.kelas - b.kelas || a.nama.localeCompare(b.nama));
  }, [exams, students]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalLulus = exams.filter(e => e.hasil === "Lulus").length;
  const totalTidak = exams.filter(e => e.hasil === "Tidak Lulus").length;
  const pctLulus = exams.length ? Math.round((totalLulus / exams.length) * 100) : 0;

  const summaryCards = [
    { label: "Total Ujian", value: exams.length, icon: Award, color: "bg-primary", sub: "seluruh periode" },
    { label: "Lulus", value: totalLulus, icon: CheckCircle, color: "bg-emerald-600", sub: `${pctLulus}% dari total` },
    { label: "Tidak Lulus", value: totalTidak, icon: XCircle, color: "bg-amber-500", sub: `${100 - pctLulus}% dari total` },
    { label: "Belum Ujian", value: neverExamined.length, icon: AlertTriangle, color: "bg-destructive", sub: "siswa aktif" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistik Ujian Kenaikan Level</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Ringkasan kelulusan, tren bulanan, dan siswa yang belum diujikan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-2xl border border-border p-4 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-black text-foreground">{c.value}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bar chart – kelulusan per kelas */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm">Kelulusan per Kelas</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Persentase siswa yang lulus ujian kenaikan level</p>
          {byClass.every(d => d.total === 0) ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Belum ada data ujian</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byClass} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="kelas" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="pct" name="% Lulus" radius={[6, 6, 0, 0]}>
                  {byClass.map((_, i) => (
                    <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* mini legend table */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {byClass.map((d, i) => (
              <div key={d.kelas} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CLASS_COLORS[i] }} />
                <span className="text-muted-foreground">{d.kelas}</span>
                <span className="font-semibold text-foreground ml-auto">{d.total ? `${d.lulus}/${d.total}` : "—"}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Line chart – tren kelulusan bulanan per jenis ujian */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm">Tren Kelulusan Bulanan</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">% lulus per jenis ujian selama 12 bulan terakhir</p>
          {monthlyTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Belum ada data ujian</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => <span style={{ color: "hsl(var(--foreground))" }}>{val}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="Tahsin Dasar"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#16a34a" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Tahsin Lanjutan"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#a855f7" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Siswa belum pernah ujian */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-sm">Siswa Belum Mengikuti Ujian Kenaikan Level</h2>
            <p className="text-xs text-muted-foreground">Belum pernah tercatat dalam ujian kenaikan program apapun</p>
          </div>
          <span className="bg-destructive/10 text-destructive text-xs font-bold px-3 py-1 rounded-full">
            {neverExamined.length} siswa
          </span>
        </div>

        {neverExamined.length === 0 ? (
          <div className="py-14 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Semua siswa sudah pernah diujikan! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">Tidak ada siswa yang belum tercatat dalam ujian kenaikan level.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["No", "Nama Siswa", "Kelas", "Rombel", "Level Saat Ini", "Status Bacaan", "Aksi"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {neverExamined.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.02 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-xs font-bold">{s.nama.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{s.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">Kelas {s.kelas}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                        {s.rombel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                        {s.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.status_bacaan === "Lancar" ? "bg-emerald-100 text-emerald-700"
                        : s.status_bacaan === "Cukup" ? "bg-blue-100 text-blue-700"
                        : s.status_bacaan === "Perlu Latihan" ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-600"
                      }`}>
                        {s.status_bacaan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/exam/${s.id}`}>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs font-medium transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          Mulai Ujian
                        </button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExamStats;
