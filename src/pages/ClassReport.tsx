import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  BarChart3, ChevronRight, Loader2, TrendingUp, BookOpen, Award,
  LineChart as LineChartIcon, CalendarIcon, X,
} from "lucide-react";
import {
  format, parseISO, startOfMonth, endOfMonth,
  startOfYear, subMonths, isWithinInterval,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProgressRow {
  student_id: string;
  kelancaran: number;
  makhraj: number;
  tajwid: number;
  tanggal: string;
  students: { kelas: number; rombel: string; nama: string } | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
const useClassReportData = () =>
  useQuery({
    queryKey: ["class_report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_entries")
        .select("student_id, kelancaran, makhraj, tajwid, tanggal, students(kelas, rombel, nama)")
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as unknown as ProgressRow[];
    },
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ROMBEL_LIST = ["A", "B", "C", "D"] as const;
type Rombel = typeof ROMBEL_LIST[number];

const ROMBEL_COLORS: Record<Rombel, { bar: string; bg: string; text: string; border: string }> = {
  A: { bar: "#3b82f6", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  B: { bar: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  C: { bar: "#8b5cf6", bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  D: { bar: "#f59e0b", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
};

const ROMBEL_LINE_COLORS: Record<Rombel, string> = {
  A: "#3b82f6",
  B: "#10b981",
  C: "#8b5cf6",
  D: "#f59e0b",
};

const METRIC_COLORS = {
  kelancaran: "#3b82f6",
  makhraj:    "#10b981",
  tajwid:     "#8b5cf6",
};

const METRIC_LABELS = { kelancaran: "Kelancaran", makhraj: "Makhraj", tajwid: "Tajwid" };
type MetricKey = keyof typeof METRIC_LABELS;

const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

const scoreColor = (v: number) =>
  v >= 80 ? "text-emerald-600" : v >= 65 ? "text-yellow-600" : "text-red-500";

const scoreBg = (v: number) =>
  v >= 80
    ? "bg-emerald-100 text-emerald-700"
    : v >= 65
    ? "bg-yellow-100 text-yellow-700"
    : "bg-red-100 text-red-600";

// ─── Date preset helpers ──────────────────────────────────────────────────────
const now = new Date();

type PresetId = "all" | "sem1" | "sem2" | "6m" | "3m" | "custom";

interface DatePreset {
  id: PresetId;
  label: string;
  range: () => { from: Date; to: Date } | null;
}

const DATE_PRESETS: DatePreset[] = [
  { id: "all",  label: "Semua",         range: () => null },
  {
    id: "sem1", label: "Sem. Ganjil",
    range: () => {
      // Semester ganjil: Juli – Desember (tahun akademik berjalan)
      const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      return { from: new Date(year, 6, 1), to: new Date(year, 11, 31) };
    },
  },
  {
    id: "sem2", label: "Sem. Genap",
    range: () => {
      // Semester genap: Januari – Juni
      const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
      return { from: new Date(year, 0, 1), to: new Date(year, 5, 30) };
    },
  },
  {
    id: "6m",   label: "6 Bulan",
    range: () => ({ from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) }),
  },
  {
    id: "3m",   label: "3 Bulan",
    range: () => ({ from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) }),
  },
  { id: "custom", label: "Kustom", range: () => null },
];

const isInRange = (dateStr: string, range: { from: Date; to: Date } | null): boolean => {
  if (!range) return true;
  try {
    return isWithinInterval(parseISO(dateStr), { start: range.from, end: range.to });
  } catch {
    return true;
  }
};

// ─── Custom bar tooltip ───────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-foreground mb-1">
        {typeof label === "number" ? `Kelas ${label}` : `Rombel ${label}`}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="flex justify-between gap-4">
          <span>{METRIC_LABELS[p.dataKey as MetricKey]}</span>
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Custom trend tooltip ─────────────────────────────────────────────────────
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 rounded-full inline-block"
              style={{ backgroundColor: p.stroke }}
            />
            <span className="text-muted-foreground text-xs">
              {`Rombel ${String(p.name).replace("rombel_", "")}`}
            </span>
          </div>
          <span className="font-bold text-foreground">
            {p.value != null ? p.value : "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── DateRangePicker sub-component ───────────────────────────────────────────
interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
}
const DateRangePicker = ({ from, to, onChange }: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const label =
    from && to
      ? `${format(from, "dd MMM yyyy", { locale: idLocale })} – ${format(to, "dd MMM yyyy", { locale: idLocale })}`
      : from
      ? `${format(from, "dd MMM yyyy", { locale: idLocale })} – ...`
      : "Pilih rentang tanggal";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 border-dashed",
            (from || to) && "border-primary text-primary"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={(range) => onChange(range?.from, range?.to)}
          numberOfMonths={2}
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="flex justify-end gap-2 p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { onChange(undefined, undefined); setOpen(false); }}
          >
            Reset
          </Button>
          <Button size="sm" className="text-xs" onClick={() => setOpen(false)}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ClassReport = () => {
  const { data: raw = [], isLoading } = useClassReportData();
  const [selectedKelas, setSelectedKelas] = useState<number | "all">("all");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["kelancaran", "makhraj", "tajwid"]);

  // Date filter state
  const [activePreset, setActivePreset] = useState<PresetId>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo,   setCustomTo]   = useState<Date | undefined>();

  // Trend state
  const [trendRombel, setTrendRombel] = useState<Rombel[]>(["A", "B"]);
  const [trendMetric, setTrendMetric] = useState<MetricKey>("kelancaran");

  // Effective date range
  const dateRange = useMemo((): { from: Date; to: Date } | null => {
    if (activePreset === "custom") {
      if (customFrom && customTo) return { from: customFrom, to: customTo };
      if (customFrom) return { from: customFrom, to: endOfMonth(now) };
      return null;
    }
    const preset = DATE_PRESETS.find(p => p.id === activePreset);
    return preset?.range() ?? null;
  }, [activePreset, customFrom, customTo]);

  const handlePreset = (id: PresetId) => {
    setActivePreset(id);
    if (id !== "custom") { setCustomFrom(undefined); setCustomTo(undefined); }
  };

  // Apply date filter to raw
  const dateFiltered = useMemo(
    () => raw.filter(r => isInRange(r.tanggal, dateRange)),
    [raw, dateRange]
  );

  // Latest entry per student within date range (for bar chart & table)
  const latest = useMemo(() => {
    const seen = new Map<string, ProgressRow>();
    for (const row of dateFiltered) {
      if (!seen.has(row.student_id)) seen.set(row.student_id, row);
    }
    return Array.from(seen.values());
  }, [dateFiltered]);

  // Filter by kelas
  const filtered = useMemo(() =>
    selectedKelas === "all"
      ? latest
      : latest.filter(r => r.students?.kelas === selectedKelas),
    [latest, selectedKelas]
  );

  // Group by rombel → averages
  const rombelStats = useMemo(() =>
    ROMBEL_LIST.map(rombel => {
      const group = filtered.filter(r => r.students?.rombel === rombel);
      const count = group.length;
      return {
        rombel,
        count,
        kelancaran: avg(group.map(r => r.kelancaran)),
        makhraj:    avg(group.map(r => r.makhraj)),
        tajwid:     avg(group.map(r => r.tajwid)),
        total: count > 0
          ? avg(group.map(r => Math.round((r.kelancaran + r.makhraj + r.tajwid) / 3)))
          : 0,
      };
    }).filter(s => s.count > 0),
    [filtered]
  );

  // Per-kelas summary
  const kelasStats = useMemo(() =>
    [1, 2, 3, 4, 5, 6].map(kelas => {
      const group = latest.filter(r => r.students?.kelas === kelas);
      return {
        kelas,
        count: group.length,
        kelancaran: avg(group.map(r => r.kelancaran)),
        makhraj:    avg(group.map(r => r.makhraj)),
        tajwid:     avg(group.map(r => r.tajwid)),
      };
    }).filter(s => s.count > 0),
    [latest]
  );

  // Monthly trend data (respects dateRange + kelas)
  const trendData = useMemo(() => {
    const monthMap = new Map<string, Record<Rombel, number[]>>();

    for (const row of dateFiltered) {
      const rombel = row.students?.rombel as Rombel | undefined;
      if (!rombel || !ROMBEL_LIST.includes(rombel)) continue;
      if (selectedKelas !== "all" && row.students?.kelas !== selectedKelas) continue;

      const monthKey = format(parseISO(row.tanggal), "yyyy-MM");
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { A: [], B: [], C: [], D: [] });
      }
      monthMap.get(monthKey)![rombel].push(row[trendMetric]);
    }

    const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    return sorted.map(([monthKey, rombelValues]) => {
      const label = format(parseISO(`${monthKey}-01`), "MMM yyyy", { locale: idLocale });
      const entry: Record<string, string | number | null> = { month: label };
      for (const r of ROMBEL_LIST) {
        entry[`rombel_${r}`] = rombelValues[r].length > 0 ? avg(rombelValues[r]) : null;
      }
      return entry;
    });
  }, [dateFiltered, trendMetric, selectedKelas]);

  const toggleMetric = (m: MetricKey) =>
    setSelectedMetrics(prev =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter(x => x !== m) : prev) : [...prev, m]
    );

  const toggleTrendRombel = (r: Rombel) =>
    setTrendRombel(prev =>
      prev.includes(r) ? (prev.length > 1 ? prev.filter(x => x !== r) : prev) : [...prev, r]
    );

  const totalStudents = filtered.length;
  const overallKel = avg(filtered.map(r => r.kelancaran));
  const overallMak = avg(filtered.map(r => r.makhraj));
  const overallTaj = avg(filtered.map(r => r.tajwid));

  // Period label for display
  const periodLabel = useMemo(() => {
    if (!dateRange) return "Semua waktu";
    return `${format(dateRange.from, "dd MMM yyyy", { locale: idLocale })} – ${format(dateRange.to, "dd MMM yyyy", { locale: idLocale })}`;
  }, [dateRange]);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Rekap Nilai Kelas</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Rekap Nilai Per Rombel</h1>
            <p className="text-primary-foreground/70 text-sm">
              Rata-rata Kelancaran, Makhraj & Tajwid · {periodLabel}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
        {/* Row 1: Kelas + Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas:</span>
            {(["all", 1, 2, 3, 4, 5, 6] as const).map(k => (
              <button
                key={k}
                onClick={() => setSelectedKelas(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedKelas === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                {k === "all" ? "Semua" : `Kelas ${k}`}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-border hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tampilkan:</span>
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(m => (
              <button
                key={m}
                onClick={() => toggleMetric(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedMetrics.includes(m)
                    ? "text-white border-transparent"
                    : "bg-muted text-muted-foreground border-border hover:bg-secondary"
                }`}
                style={selectedMetrics.includes(m) ? { backgroundColor: METRIC_COLORS[m], borderColor: METRIC_COLORS[m] } : {}}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date range / semester presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Periode:</span>
          {DATE_PRESETS.filter(p => p.id !== "custom").map(p => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activePreset === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
          {/* Custom button */}
          <button
            onClick={() => handlePreset("custom")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activePreset === "custom"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            Kustom
          </button>
          {/* Custom date range picker (shown when custom is active) */}
          {activePreset === "custom" && (
            <DateRangePicker
              from={customFrom}
              to={customTo}
              onChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
            />
          )}
          {/* Active period badge */}
          {dateRange && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <CalendarIcon className="w-3 h-3" />
              {periodLabel}
              <button
                onClick={() => handlePreset("all")}
                className="ml-0.5 hover:text-primary/70 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Belum ada data progres</p>
          <p className="text-sm text-muted-foreground mt-1">
            {dateRange
              ? "Tidak ada data pada periode yang dipilih. Coba ubah filter tanggal."
              : "Catat progres siswa terlebih dahulu untuk melihat rekap nilai."}
          </p>
          {dateRange && (
            <button
              onClick={() => handlePreset("all")}
              className="mt-3 text-xs text-primary underline underline-offset-2"
            >
              Tampilkan semua periode
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Siswa",    value: totalStudents, icon: TrendingUp, suffix: "siswa" },
              { label: "Avg Kelancaran", value: overallKel,   icon: TrendingUp, suffix: "/100", color: METRIC_COLORS.kelancaran },
              { label: "Avg Makhraj",    value: overallMak,   icon: BookOpen,   suffix: "/100", color: METRIC_COLORS.makhraj },
              { label: "Avg Tajwid",     value: overallTaj,   icon: Award,      suffix: "/100", color: METRIC_COLORS.tajwid },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: s.color ? `${s.color}22` : undefined }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color ?? "hsl(var(--primary))" }} />
                </div>
                <p className={`text-2xl font-bold ${s.color ? scoreColor(s.value) : "text-foreground"}`}>
                  {s.value}
                </p>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.suffix}</p>
              </motion.div>
            ))}
          </div>

          {/* Bar chart per rombel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center gap-2 flex-wrap">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">
                Grafik Rata-rata Nilai per Rombel
                {selectedKelas !== "all" && ` — Kelas ${selectedKelas}`}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">{rombelStats.length} rombel aktif</span>
              {dateRange && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {periodLabel}
                </span>
              )}
            </div>
            <div className="p-5">
              {rombelStats.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Tidak ada data rombel untuk filter ini.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rombelStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="rombel"
                      tickFormatter={(v) => `Rombel ${v}`}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickCount={6}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      formatter={(value) => METRIC_LABELS[value as MetricKey] ?? value}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    {selectedMetrics.includes("kelancaran") && (
                      <Bar dataKey="kelancaran" fill={METRIC_COLORS.kelancaran} radius={[5, 5, 0, 0]} maxBarSize={48} />
                    )}
                    {selectedMetrics.includes("makhraj") && (
                      <Bar dataKey="makhraj" fill={METRIC_COLORS.makhraj} radius={[5, 5, 0, 0]} maxBarSize={48} />
                    )}
                    {selectedMetrics.includes("tajwid") && (
                      <Bar dataKey="tajwid" fill={METRIC_COLORS.tajwid} radius={[5, 5, 0, 0]} maxBarSize={48} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Monthly trend line chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
              <LineChartIcon className="w-5 h-5 text-primary flex-shrink-0" />
              <h2 className="font-bold text-foreground">
                Tren Nilai Bulanan per Rombel
                {selectedKelas !== "all" && ` — Kelas ${selectedKelas}`}
              </h2>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Metrik:</span>
                {(Object.keys(METRIC_LABELS) as MetricKey[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setTrendMetric(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      trendMetric === m
                        ? "text-white border-transparent"
                        : "bg-muted text-muted-foreground border-border hover:bg-secondary"
                    }`}
                    style={
                      trendMetric === m
                        ? { backgroundColor: METRIC_COLORS[m], borderColor: METRIC_COLORS[m] }
                        : {}
                    }
                  >
                    {METRIC_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Rombel toggle */}
            <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rombel:
              </span>
              {ROMBEL_LIST.map(r => {
                const active = trendRombel.includes(r);
                const col = ROMBEL_LINE_COLORS[r];
                return (
                  <button
                    key={r}
                    onClick={() => toggleTrendRombel(r)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? "text-white border-transparent"
                        : "bg-muted text-muted-foreground border-border hover:bg-secondary"
                    }`}
                    style={active ? { backgroundColor: col, borderColor: col } : {}}
                  >
                    <span
                      className="w-5 h-0.5 rounded-full inline-block"
                      style={{ backgroundColor: active ? "white" : col }}
                    />
                    Rombel {r}
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {trendData.length === 0 ? (
                <div className="text-center py-12">
                  <LineChartIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Belum cukup data bulanan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dateRange
                      ? "Tidak ada data pada periode ini. Coba perluas rentang tanggal."
                      : "Catat progres dari beberapa bulan berbeda untuk menampilkan tren."}
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                      data={trendData}
                      margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickCount={6}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Legend
                        formatter={(value) =>
                          `Rombel ${String(value).replace("rombel_", "")}`
                        }
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {ROMBEL_LIST.filter(r => trendRombel.includes(r)).map(r => (
                        <Line
                          key={r}
                          type="monotone"
                          dataKey={`rombel_${r}`}
                          name={`rombel_${r}`}
                          stroke={ROMBEL_LINE_COLORS[r]}
                          strokeWidth={2.5}
                          dot={{
                            r: 4,
                            fill: ROMBEL_LINE_COLORS[r],
                            strokeWidth: 2,
                            stroke: "hsl(var(--card))",
                          }}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Rata-rata{" "}
                    <span className="font-semibold text-foreground">
                      {METRIC_LABELS[trendMetric]}
                    </span>{" "}
                    per bulan
                    {dateRange ? ` · ${periodLabel}` : " · maks. 12 bulan terakhir"}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Detail table per rombel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">
                Tabel Rekap per Rombel
                {selectedKelas !== "all" && ` — Kelas ${selectedKelas}`}
              </h2>
              {dateRange && (
                <span className="ml-auto text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {periodLabel}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {["Rombel", "Jumlah Siswa", "Avg Kelancaran", "Avg Makhraj", "Avg Tajwid", "Rata-rata Total"].map(h => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rombelStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground text-sm">
                        Tidak ada data untuk filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    rombelStats.map((s, i) => {
                      const colors = ROMBEL_COLORS[s.rombel as Rombel];
                      return (
                        <motion.tr
                          key={s.rombel}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: colors.bar }}
                              />
                              Rombel {s.rombel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-sm font-semibold text-foreground">{s.count}</span>
                            <span className="text-xs text-muted-foreground ml-1">siswa</span>
                          </td>
                          {(["kelancaran", "makhraj", "tajwid"] as MetricKey[]).map(m => (
                            <td key={m} className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${scoreBg(s[m])}`}>
                                  {s[m]}
                                </span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${s[m]}%`, backgroundColor: METRIC_COLORS[m] }}
                                  />
                                </div>
                              </div>
                            </td>
                          ))}
                          <td className="py-3.5 px-4">
                            <span className={`text-sm font-bold ${scoreColor(s.total)}`}>{s.total}</span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Per-kelas comparison (only when "all" is selected) */}
          {selectedKelas === "all" && kelasStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center gap-2 flex-wrap">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Perbandingan Antar Kelas</h2>
                <span className="ml-auto text-xs text-muted-foreground">klik kelas untuk filter</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={kelasStats} margin={{ top: 8, right: 20, left: 0, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="kelas"
                      tickFormatter={(v) => `Kelas ${v}`}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickCount={6} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      formatter={(value) => METRIC_LABELS[value as MetricKey] ?? value}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    {selectedMetrics.includes("kelancaran") && (
                      <Bar dataKey="kelancaran" fill={METRIC_COLORS.kelancaran} radius={[5, 5, 0, 0]} maxBarSize={36}
                        onClick={(d) => setSelectedKelas(d.kelas)} className="cursor-pointer" />
                    )}
                    {selectedMetrics.includes("makhraj") && (
                      <Bar dataKey="makhraj" fill={METRIC_COLORS.makhraj} radius={[5, 5, 0, 0]} maxBarSize={36}
                        onClick={(d) => setSelectedKelas(d.kelas)} className="cursor-pointer" />
                    )}
                    {selectedMetrics.includes("tajwid") && (
                      <Bar dataKey="tajwid" fill={METRIC_COLORS.tajwid} radius={[5, 5, 0, 0]} maxBarSize={36}
                        onClick={(d) => setSelectedKelas(d.kelas)} className="cursor-pointer" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Klik batang grafik untuk filter ke kelas tersebut
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassReport;
