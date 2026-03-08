import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TahsinAssessment } from "@/hooks/useSupabaseData";

const MATERI_LINES = [
  { key: "makhraj_huruf",  label: "Makhraj",    color: "#3b82f6" },
  { key: "hukum_nun_mati", label: "Nun Mati",   color: "#10b981" },
  { key: "hukum_mim_mati", label: "Mim Mati",   color: "#f59e0b" },
  { key: "mad",            label: "Mad",        color: "#8b5cf6" },
  { key: "tartil",         label: "Tartil",     color: "#ef4444" },
];

interface Props {
  data: TahsinAssessment[];
  compact?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
      {payload[0] && (
        <div className="mt-2 pt-2 border-t border-border flex justify-between">
          <span className="text-muted-foreground">Rata-rata</span>
          <span className="font-bold text-foreground">
            {Math.round(payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0) / payload.length)}
          </span>
        </div>
      )}
    </div>
  );
};

const TrendBadge = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null;
  const diff = values[values.length - 1] - values[values.length - 2];
  if (diff > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />+{diff}
    </span>
  );
  if (diff < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" />{diff}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />Tetap
    </span>
  );
};

const TahsinTrendChart = ({ data, compact = false }: Props) => {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
      .map(r => ({
        tanggal: r.tanggal,
        makhraj_huruf: r.makhraj_huruf,
        hukum_nun_mati: r.hukum_nun_mati,
        hukum_mim_mati: r.hukum_mim_mati,
        mad: r.mad,
        tartil: r.tartil,
        nilai_total: r.nilai_total,
      }));
  }, [data]);

  const latestTotals = useMemo(() =>
    MATERI_LINES.map(m => ({
      ...m,
      values: chartData.map(d => d[m.key as keyof typeof d] as number),
      latest: chartData.length ? chartData[chartData.length - 1][m.key as keyof typeof chartData[0]] as number : 0,
    }))
  , [chartData]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <TrendingUp className="w-8 h-8 opacity-30" />
        <p className="text-sm">Belum ada data penilaian untuk ditampilkan grafik.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mini stat per materi */}
      {!compact && (
        <div className="grid grid-cols-5 gap-2">
          {latestTotals.map(m => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 bg-muted/40 text-center"
            >
              <div
                className="w-1.5 h-6 rounded-full mx-auto mb-1.5"
                style={{ background: m.color }}
              />
              <p className="text-lg font-bold text-foreground">{m.latest}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{m.label}</p>
              <div className="mt-1.5 flex justify-center">
                <TrendBadge values={m.values} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Line Chart */}
      <div className={compact ? "h-48" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="tanggal"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={v => v.slice(5)} // MM-DD
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              ticks={[0, 25, 50, 70, 80, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Min 70", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--destructive))" }} />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Baik 80", position: "insideTopRight", fontSize: 9, fill: "#10b981" }} />
            {!compact && <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />}
            {MATERI_LINES.map(m => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={{ r: 3, fill: m.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TahsinTrendChart;
