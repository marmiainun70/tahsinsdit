import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  useStudents,
  LEVELS,
  LEVEL_COLORS,
  getLevelGroup,
  IQRO_LEVELS,
} from "@/hooks/useSupabaseData";
import {
  MONTH_NAMES,
  useAllMonthlyReports,
  type MonthlyReport,
} from "@/hooks/useMonthlyReports";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import {
  AlertTriangle,
  Award,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  Loader2,
  Map as MapIcon,
  Presentation,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ReadingLevel = Database["public"]["Enums"]["reading_level"];
type ConditionStatus =
  | "Aman"
  | "Perlu Dipantau"
  | "Perlu Perhatian"
  | "Belum Ada Data";
type TeacherStatus = "Stabil" | "Perlu Dipantau" | "Perlu Pendampingan";
type AttentionReason =
  | "Kelancaran Bacaan"
  | "Tajwid/Makhraj"
  | "Hafalan/Murajaah"
  | "Kehadiran/Setoran"
  | "Lainnya";

type LevelCounts = {
  tahsinDasar: number;
  tahsinLanjutan: number;
  tahfizh: number;
};

type MonthlySummary = LevelCounts & {
  total: number;
  perluPerhatian: number;
};

type ClassConditionData = LevelCounts & {
  label: string;
  total: number;
  perluPerhatian: number;
  attentionPercentage: number;
  status: ConditionStatus;
};

type TeacherSummary = LevelCounts & {
  name: string;
  total: number;
  perluPerhatian: number;
  attentionPercentage: number;
  status: TeacherStatus;
};

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
  percent?: number;
};

const RADIAN = Math.PI / 180;
const ALL_TEACHERS = "all";
const ALL_STATUSES = "all";

const calculatePercentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const isAttentionStudent = (student: Student) => student.perlu_perhatian === true;

const buildTeacherMapFromMonthlyReports = (reports: MonthlyReport[]) => {
  const studentIdToTeacherName: Record<string, string> = {};

  reports.forEach((report) => {
    const storedTeacherName = report.teacher_name?.trim();
    const explicitNoteMatch = report.notes?.match(
      /^(?:Guru|Penguji):\s*(.+)$/im,
    );
    const teacherName =
      storedTeacherName ||
      explicitNoteMatch?.[1]?.trim() ||
      "Belum ditentukan";

    studentIdToTeacherName[report.student_id] = teacherName;
  });

  return studentIdToTeacherName;
};

const getLevelCounts = (students: Student[]): LevelCounts => ({
  tahsinDasar: students.filter(
    (student) => getLevelGroup(student.level as ReadingLevel) === "Tahsin Dasar",
  ).length,
  tahsinLanjutan: students.filter(
    (student) => student.level === "Tahsin Lanjutan",
  ).length,
  tahfizh: students.filter((student) => student.level === "Tahfizh").length,
});

const getTeacherName = (
  student: Student,
  studentIdToTeacherName: Record<string, string> = {},
) => {
  const reportTeacherName = studentIdToTeacherName[student.id]?.trim();
  if (reportTeacherName) return reportTeacherName;

  const raw = student as unknown as Record<string, unknown>;
  const possibleNames = [
    raw.penguji,
    raw.examiner,
    raw.guru,
    raw.teacher,
    raw.teacher_name,
    raw.ustadz,
  ];
  const teacherName = possibleNames.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof teacherName === "string" ? teacherName.trim() : "Belum ditentukan";
};

const getClassLabel = (student: Student) => {
  const raw = student as unknown as Record<string, unknown>;
  const explicitClassName = [raw.className, raw.nama_kelas].find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (typeof explicitClassName === "string") return explicitClassName.trim();
  if (student.rombel?.trim()) return `${student.kelas}${student.rombel.trim()}`;
  return `Kelas ${student.kelas}`;
};

const getConditionStatus = (
  attentionCount: number,
  total: number,
): ConditionStatus => {
  if (total === 0) return "Belum Ada Data";
  const percentage = (attentionCount / total) * 100;
  if (percentage <= 5) return "Aman";
  if (percentage <= 15) return "Perlu Dipantau";
  return "Perlu Perhatian";
};

const getStatusStyle = (status: ConditionStatus | TeacherStatus) => {
  if (status === "Aman" || status === "Stabil") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Perlu Dipantau") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "Perlu Perhatian" || status === "Perlu Pendampingan") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  return "border-border bg-muted text-muted-foreground";
};

const getTeacherStatus = (
  attentionCount: number,
  total: number,
): TeacherStatus => {
  const condition = getConditionStatus(attentionCount, total);
  if (condition === "Perlu Perhatian") return "Perlu Pendampingan";
  if (condition === "Perlu Dipantau") return "Perlu Dipantau";
  return "Stabil";
};

const getAttentionSource = (student: Student) => {
  const raw = student as unknown as Record<string, unknown>;
  return [
    student.catatan_perhatian,
    raw.catatan,
    raw.notes,
    student.status_bacaan,
    raw.reading_status,
    student.level,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
};

const hasDetailedAttentionNote = (student: Student) => {
  const raw = student as unknown as Record<string, unknown>;
  return [student.catatan_perhatian, raw.catatan, raw.notes].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
};

const getAttentionReason = (student: Student): AttentionReason => {
  const source = getAttentionSource(student);

  if (
    ["absen", "tidak setoran"].some((keyword) => source.includes(keyword))
  ) {
    return "Kehadiran/Setoran";
  }
  if (
    ["hafalan", "murajaah", "sering lupa"].some((keyword) =>
      source.includes(keyword),
    )
  ) {
    return "Hafalan/Murajaah";
  }
  if (
    ["makhraj", "tajwid", "mad", "waqaf"].some((keyword) =>
      source.includes(keyword),
    )
  ) {
    return "Tajwid/Makhraj";
  }
  if (
    ["tidak lancar", "belum lancar", "terbata"].some((keyword) =>
      source.includes(keyword),
    )
  ) {
    return "Kelancaran Bacaan";
  }
  return "Lainnya";
};

const buildClassConditionData = (students: Student[]): ClassConditionData[] => {
  const classGroups = new Map<string, Student[]>();

  students.forEach((student) => {
    const label = getClassLabel(student);
    classGroups.set(label, [...(classGroups.get(label) ?? []), student]);
  });

  return Array.from(classGroups.entries())
    .map(([label, classStudents]) => {
      const levelCounts = getLevelCounts(classStudents);
      const attentionCount = classStudents.filter(isAttentionStudent).length;
      return {
        label,
        total: classStudents.length,
        ...levelCounts,
        perluPerhatian: attentionCount,
        attentionPercentage: calculatePercentage(
          attentionCount,
          classStudents.length,
        ),
        status: getConditionStatus(attentionCount, classStudents.length),
      };
    })
    .sort((a, b) =>
      a.label.localeCompare(b.label, "id", {
        numeric: true,
        sensitivity: "base",
      }),
    );
};

const buildTeacherSummary = (
  students: Student[],
  studentIdToTeacherName: Record<string, string>,
): TeacherSummary[] => {
  const teacherGroups = new Map<string, Student[]>();

  students.forEach((student) => {
    const teacherName = getTeacherName(student, studentIdToTeacherName);
    teacherGroups.set(teacherName, [
      ...(teacherGroups.get(teacherName) ?? []),
      student,
    ]);
  });

  return Array.from(teacherGroups.entries())
    .map(([name, teacherStudents]) => {
      const levelCounts = getLevelCounts(teacherStudents);
      const attentionCount = teacherStudents.filter(isAttentionStudent).length;
      return {
        name,
        total: teacherStudents.length,
        ...levelCounts,
        perluPerhatian: attentionCount,
        attentionPercentage: calculatePercentage(
          attentionCount,
          teacherStudents.length,
        ),
        status: getTeacherStatus(attentionCount, teacherStudents.length),
      };
    })
    .sort(
      (a, b) =>
        b.attentionPercentage - a.attentionPercentage ||
        a.name.localeCompare(b.name),
    );
};

const buildCoordinatorRecommendations = ({
  classes,
  summary,
}: {
  classes: ClassConditionData[];
  summary: MonthlySummary;
}) => {
  const recommendations: string[] = [];
  const criticalClasses = classes
    .filter((item) => item.status === "Perlu Perhatian")
    .map((item) => item.label);
  const monitoredClasses = classes
    .filter((item) => item.status === "Perlu Dipantau")
    .map((item) => item.label);

  if (criticalClasses.length > 0) {
    recommendations.push(
      `Prioritaskan supervisi pada kelas ${criticalClasses.slice(0, 3).join(", ")}.`,
    );
  }
  if (monitoredClasses.length > 0) {
    recommendations.push(
      `Jadwalkan pemantauan ringan untuk kelas ${monitoredClasses
        .slice(0, 3)
        .join(", ")}.`,
    );
  }
  if (
    summary.total > 0 &&
    summary.tahsinDasar / summary.total >= 0.5
  ) {
    recommendations.push(
      "Perkuat pembinaan tahsin dasar dan evaluasi kenaikan jilid secara berkala.",
    );
  }
  if (
    summary.total > 0 &&
    summary.perluPerhatian / summary.total > 0.15
  ) {
    recommendations.push(
      "Siapkan pendampingan terarah bagi siswa yang masih membutuhkan penguatan.",
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Kondisi program relatif stabil. Pertahankan ritme monitoring bulanan.",
    );
  }

  return recommendations.slice(0, 4);
};

const getDeltaLabel = (current: number, previous?: number | null) => {
  if (previous === null || previous === undefined) {
    return "Belum ada data bulan lalu";
  }
  const delta = current - previous;
  if (delta > 0) return `Naik ${delta} dari bulan lalu`;
  if (delta < 0) return `Turun ${Math.abs(delta)} dari bulan lalu`;
  return "Stabil dari bulan lalu";
};

const getDeltaTone = (current: number, previous?: number | null) => {
  if (previous === null || previous === undefined) return "text-muted-foreground";
  if (current > previous) return "text-emerald-600";
  if (current < previous) return "text-destructive";
  return "text-muted-foreground";
};

const renderPieLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  value = 0,
  percent = 0,
}: PieLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] font-bold"
    >
      {`${value} (${Math.round(percent * 100)}%)`}
    </text>
  );
};

const hideZeroLabel = (value: number) => (value > 0 ? value : "");

const Monitoring = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: monthlyReports = [], isLoading: loadingReports } =
    useAllMonthlyReports();
  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(ALL_TEACHERS);
  const [selectedClassStatus, setSelectedClassStatus] =
    useState(ALL_STATUSES);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  const activeMonthlyReports = monthlyReports.filter(
    (report) => report.month === activeMonth && report.year === activeYear,
  );
  const studentIdToTeacherName =
    buildTeacherMapFromMonthlyReports(activeMonthlyReports);
  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...monthlyReports.map((report) => report.year),
    ]),
  ).sort((a, b) => b - a);

  const teacherNames = Array.from(
    new Set(
      students.map((student) =>
        getTeacherName(student, studentIdToTeacherName),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredStudents =
    selectedTeacher === ALL_TEACHERS
      ? students
      : students.filter(
          (student) =>
            getTeacherName(student, studentIdToTeacherName) === selectedTeacher,
        );

  const total = filteredStudents.length;
  const levelCounts = getLevelCounts(filteredStudents);
  const perluPerhatian = filteredStudents.filter(isAttentionStudent);
  const currentMonthSummary: MonthlySummary = {
    total,
    ...levelCounts,
    perluPerhatian: perluPerhatian.length,
  };

  // Siap diganti dengan ringkasan historis dari database pada tahap berikutnya.
  const previousMonthSummary: MonthlySummary | null = null;

  const classConditions = buildClassConditionData(filteredStudents);
  const visibleClassConditions =
    selectedClassStatus === ALL_STATUSES
      ? classConditions
      : classConditions.filter(
          (item) => item.status === selectedClassStatus,
        );
  const bestClasses = [...classConditions]
    .sort(
      (a, b) =>
        a.attentionPercentage - b.attentionPercentage ||
        b.tahfizh +
          b.tahsinLanjutan -
          (a.tahfizh + a.tahsinLanjutan),
    )
    .slice(0, 5);
  const supportClasses = [...classConditions]
    .sort(
      (a, b) =>
        b.attentionPercentage - a.attentionPercentage ||
        b.perluPerhatian - a.perluPerhatian,
    )
    .slice(0, 5);
  const teacherSummaries = buildTeacherSummary(
    filteredStudents,
    studentIdToTeacherName,
  );
  const recommendations = buildCoordinatorRecommendations({
    classes: classConditions,
    summary: currentMonthSummary,
  });

  const attentionReasons: AttentionReason[] = [
    "Kelancaran Bacaan",
    "Tajwid/Makhraj",
    "Hafalan/Murajaah",
    "Kehadiran/Setoran",
    "Lainnya",
  ];
  const attentionReasonCounts = attentionReasons.map((reason) => ({
    reason,
    count: perluPerhatian.filter(
      (student) => getAttentionReason(student) === reason,
    ).length,
  }));
  const hasAttentionDetails = perluPerhatian.some(hasDetailedAttentionNote);

  const levelCount: Record<string, number> = {};
  LEVELS.forEach((level) => {
    levelCount[level] = 0;
  });
  filteredStudents.forEach((student) => {
    levelCount[student.level] = (levelCount[student.level] || 0) + 1;
  });

  const comparisonData = [
    {
      name: "Tahsin Dasar",
      bulanIni: currentMonthSummary.tahsinDasar,
      bulanLalu: previousMonthSummary?.tahsinDasar ?? null,
      fill: "#f59e0b",
    },
    {
      name: "Tahsin Lanjutan",
      bulanIni: currentMonthSummary.tahsinLanjutan,
      bulanLalu: previousMonthSummary?.tahsinLanjutan ?? null,
      fill: "#10b981",
    },
    {
      name: "Tahfizh",
      bulanIni: currentMonthSummary.tahfizh,
      bulanLalu: previousMonthSummary?.tahfizh ?? null,
      fill: "#8b5cf6",
    },
    {
      name: "Perlu Perhatian",
      bulanIni: currentMonthSummary.perluPerhatian,
      bulanLalu: previousMonthSummary?.perluPerhatian ?? null,
      fill: "hsl(var(--destructive))",
    },
  ];

  const levelData = IQRO_LEVELS.map((level, index) => ({
    level: `Jilid ${index + 1}`,
    fullName: level,
    count: levelCount[level] || 0,
  }));

  const classChartData = classConditions.map((item) => ({
    kelas: item.label,
    "Tahsin Dasar (Iqro)": item.tahsinDasar,
    "Tahsin Lanjutan": item.tahsinLanjutan,
    Tahfizh: item.tahfizh,
    total: item.total,
  }));

  const pieData = [
    {
      name: "Tahsin Dasar",
      value: currentMonthSummary.tahsinDasar,
      color: "#f59e0b",
    },
    {
      name: "Tahsin Lanjutan",
      value: currentMonthSummary.tahsinLanjutan,
      color: "#10b981",
    },
    {
      name: "Tahfizh",
      value: currentMonthSummary.tahfizh,
      color: "#8b5cf6",
    },
  ].filter((item) => item.value > 0);

  const summaryCards = [
    {
      label: "Total Siswa",
      value: total,
      previous: previousMonthSummary?.total,
      icon: Users,
      color: "bg-primary",
    },
    {
      label: "Tahsin Dasar (Iqro)",
      value: currentMonthSummary.tahsinDasar,
      previous: previousMonthSummary?.tahsinDasar,
      icon: BookOpen,
      color: "bg-amber-500",
    },
    {
      label: "Tahsin Lanjutan",
      value: currentMonthSummary.tahsinLanjutan,
      previous: previousMonthSummary?.tahsinLanjutan,
      icon: Star,
      color: "bg-emerald-600",
    },
    {
      label: "Program Tahfizh",
      value: currentMonthSummary.tahfizh,
      previous: previousMonthSummary?.tahfizh,
      icon: Award,
      color: "bg-purple-600",
    },
  ];

  const chartHeight = presentationMode ? 340 : 270;

  if (loadingStudents || loadingReports) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rankingList = (
    items: ClassConditionData[],
    emptyMessage: string,
  ) => {
    if (items.length === 0) {
      return (
        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{item.label}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.total} siswa, {item.perluPerhatian} perlu perhatian (
                {item.attentionPercentage}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={presentationMode ? "space-y-8" : "space-y-7"}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-hero text-primary-foreground ${
          presentationMode ? "p-8" : "p-6"
        }`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className={
                presentationMode ? "text-3xl font-bold" : "text-2xl font-bold"
              }
            >
              Dashboard Koordinator
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Monitoring program Tahsin dan Tahfizh per kelas
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[150px_110px_minmax(220px,1fr)_auto]">
            <label className="space-y-1">
              <span className="text-xs font-medium text-primary-foreground/80">
                Bulan laporan
              </span>
              <select
                value={activeMonth}
                onChange={(event) => {
                  setActiveMonth(Number(event.target.value));
                  setSelectedTeacher(ALL_TEACHERS);
                }}
                className="h-10 w-full rounded-xl border border-white/30 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/50"
              >
                {MONTH_NAMES.map((monthName, index) => (
                  <option key={monthName} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-primary-foreground/80">
                Tahun
              </span>
              <select
                value={activeYear}
                onChange={(event) => {
                  setActiveYear(Number(event.target.value));
                  setSelectedTeacher(ALL_TEACHERS);
                }}
                className="h-10 w-full rounded-xl border border-white/30 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/50"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-primary-foreground/80">
                Guru Tahsin & Tahfizh
              </span>
              <select
                value={selectedTeacher}
                onChange={(event) => setSelectedTeacher(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/30 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value={ALL_TEACHERS}>Semua Guru Tahsin & Tahfizh</option>
                {teacherNames.map((teacherName) => (
                  <option key={teacherName} value={teacherName}>
                    {teacherName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setPresentationMode((active) => !active)}
              aria-pressed={presentationMode}
              className={`mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                presentationMode
                  ? "border-white bg-white text-primary"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Presentation className="h-4 w-4" />
              {presentationMode ? "Keluar Presentasi" : "Mode Presentasi"}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((summary, index) => (
          <motion.div
            key={summary.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className={`rounded-2xl border border-border bg-card shadow-sm ${
              presentationMode ? "p-6 lg:p-7" : "p-4 sm:p-5"
            }`}
          >
            <div
              className={`mb-3 flex items-center justify-center rounded-xl ${
                summary.color
              } ${presentationMode ? "h-12 w-12" : "h-10 w-10"}`}
            >
              <summary.icon
                className={
                  presentationMode
                    ? "h-6 w-6 text-white"
                    : "h-5 w-5 text-white"
                }
              />
            </div>
            <p
              className={`font-bold text-foreground ${
                presentationMode ? "text-4xl" : "text-2xl"
              }`}
            >
              {summary.value}
            </p>
            <p className="text-sm text-muted-foreground">{summary.label}</p>
            <p
              className={`mt-2 text-xs font-medium ${getDeltaTone(
                summary.value,
                summary.previous,
              )}`}
            >
              {getDeltaLabel(summary.value, summary.previous)}
            </p>
          </motion.div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <MapIcon className="h-5 w-5 text-primary" />
              Peta Kondisi Per Kelas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan kondisi setiap kelas berdasarkan siswa yang perlu perhatian.
            </p>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Status kelas
            </span>
            <select
              value={selectedClassStatus}
              onChange={(event) => setSelectedClassStatus(event.target.value)}
              className="h-10 min-w-48 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={ALL_STATUSES}>Semua Status</option>
              <option value="Aman">Aman</option>
              <option value="Perlu Dipantau">Perlu Dipantau</option>
              <option value="Perlu Perhatian">Perlu Perhatian</option>
              <option value="Belum Ada Data">Belum Ada Data</option>
            </select>
          </label>
        </div>

        {visibleClassConditions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Tidak ada kelas pada filter status ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleClassConditions.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.total} siswa
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Dasar", item.tahsinDasar, "text-amber-600"],
                    ["Lanjutan", item.tahsinLanjutan, "text-emerald-600"],
                    ["Tahfizh", item.tahfizh, "text-purple-600"],
                  ].map(([label, value, tone]) => (
                    <div key={String(label)} className="rounded-xl bg-muted/40 p-2">
                      <p className={`text-lg font-bold ${tone}`}>{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Perlu perhatian</span>
                    <span className="font-semibold text-foreground">
                      {item.perluPerhatian} ({item.attentionPercentage}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        item.status === "Aman"
                          ? "bg-emerald-500"
                          : item.status === "Perlu Dipantau"
                            ? "bg-amber-500"
                            : "bg-destructive"
                      }`}
                      style={{
                        width: `${Math.min(item.attentionPercentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-foreground">
              Kelas dengan Kondisi Terbaik
            </h2>
          </div>
          {rankingList(bestClasses, "Belum ada data kelas untuk dirangkum.")}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-foreground">
              Kelas Perlu Pendampingan
            </h2>
          </div>
          {rankingList(
            supportClasses,
            "Belum ada data kelas yang membutuhkan pendampingan.",
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Ringkasan Guru Tahsin & Tahfizh
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Berdasarkan laporan {MONTH_NAMES[activeMonth - 1]} {activeYear}.
          </p>
        </div>
        {teacherSummaries.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            Belum ada data guru tahsin & tahfizh untuk dirangkum.
          </p>
        ) : (
          <div
            className={`grid gap-3 ${
              presentationMode
                ? "sm:grid-cols-2 xl:grid-cols-3"
                : "sm:grid-cols-2 xl:grid-cols-4"
            }`}
          >
            {teacherSummaries.map((teacher) => (
              <div
                key={teacher.name}
                className="rounded-xl border border-border/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {teacher.total} siswa binaan
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(
                      teacher.status,
                    )}`}
                  >
                    {teacher.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-amber-600">
                      {teacher.tahsinDasar}
                    </p>
                    <p className="text-muted-foreground">Dasar</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600">
                      {teacher.tahsinLanjutan}
                    </p>
                    <p className="text-muted-foreground">Lanjutan</p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-600">{teacher.tahfizh}</p>
                    <p className="text-muted-foreground">Tahfizh</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {teacher.perluPerhatian} siswa perlu perhatian (
                  {teacher.attentionPercentage}%).
                </p>
                {selectedTeacher !== ALL_TEACHERS && (
                  <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs text-foreground">
                    {teacher.status === "Stabil"
                      ? "Pertahankan ritme pemantauan dan penguatan berkala."
                      : "Lakukan pemantauan terarah dan diskusikan kebutuhan pendampingan."}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Kategori Siswa Perlu Perhatian
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan penyebab berdasarkan catatan dan status siswa yang tersedia.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {attentionReasonCounts.map((item) => (
            <div
              key={item.reason}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-2xl font-bold text-foreground">{item.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
            </div>
          ))}
        </div>

        {perluPerhatian.length > 0 && !hasAttentionDetails && (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Penyebab detail belum tersedia. Lengkapi catatan siswa agar analisis lebih
            akurat.
          </div>
        )}

        {perluPerhatian.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5"
          >
            <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/10 px-5 py-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-destructive">
                  {perluPerhatian.length} Siswa Perlu Perhatian Khusus
                </p>
                <p className="text-xs text-destructive/70">
                  Tinjau catatan dan perkembangan siswa secara berkala.
                </p>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {perluPerhatian.map((student) => (
                <Link key={student.id} to={`/tahsin/${student.id}`}>
                  <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-card p-3 transition-colors hover:bg-destructive/5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                      <span className="text-sm font-bold text-destructive">
                        {student.nama.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {student.nama}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getClassLabel(student)} - {getAttentionReason(student)}
                      </p>
                    </div>
                    <BookOpenCheck className="h-4 w-4 flex-shrink-0 text-destructive/50" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">Rekomendasi Koordinator</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.map((recommendation, index) => (
            <div
              key={recommendation}
              className="flex gap-3 rounded-xl border border-primary/10 bg-card p-4"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-foreground">
                {recommendation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {total === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">
            Belum ada data pada filter ini
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih guru tahsin & tahfizh lain atau tambahkan data siswa.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Grafik Monitoring
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visual pendukung untuk membaca distribusi program secara lebih rinci.
              </p>
            </div>

            <div
              className={`rounded-2xl border border-border bg-card shadow-sm ${
                presentationMode ? "p-7" : "p-5"
              }`}
            >
              <div className="mb-2">
                <h3 className="font-bold text-foreground">
                  Perbandingan Bulan Ini dan Bulan Lalu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Riwayat bulan lalu akan muncul setelah datanya tersedia.
                </p>
              </div>
              <ResponsiveContainer
                width="100%"
                height={presentationMode ? 360 : 285}
              >
                <BarChart
                  data={comparisonData}
                  margin={{ top: 28, right: 10, left: -18, bottom: 10 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="bulanIni"
                    name="Bulan Ini"
                    radius={[6, 6, 0, 0]}
                  >
                    {comparisonData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="bulanIni"
                      position="top"
                      className="fill-foreground"
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
                  {previousMonthSummary && (
                    <Bar
                      dataKey="bulanLalu"
                      name="Bulan Lalu"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.4}
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="bulanLalu"
                        position="top"
                        className="fill-muted-foreground"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
              {!previousMonthSummary && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
                  Data bulan lalu belum tersedia. Grafik perbandingan akan aktif
                  setelah riwayat bulanan tersimpan.
                </div>
              )}
            </div>

            <div
              className={`rounded-2xl border border-border bg-card shadow-sm ${
                presentationMode ? "p-7" : "p-5"
              }`}
            >
              <h3 className="mb-1 font-bold text-foreground">
                Distribusi Siswa per Level
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Iqro Jilid 1-6 merupakan bagian dari Tahsin Dasar.
              </p>
              <div className="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30">
                <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/70 px-4 py-2.5">
                  <BookOpen className="h-4 w-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                    Tahsin Dasar - Iqro Jilid 1-6
                  </span>
                  <span className="ml-auto text-xs font-bold text-amber-700">
                    {currentMonthSummary.tahsinDasar} siswa
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                  {IQRO_LEVELS.map((level, index) => {
                    const count = levelCount[level] || 0;
                    const percentage = calculatePercentage(count, total);
                    return (
                      <div
                        key={level}
                        className="flex items-center gap-2 rounded-lg border border-amber-100 bg-card p-2.5"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground">
                            Jilid {index + 1}
                          </p>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Tahsin Lanjutan",
                    value: currentMonthSummary.tahsinLanjutan,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Tahfizh",
                    value: currentMonthSummary.tahfizh,
                    color: "bg-purple-500",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {calculatePercentage(item.value, total)}%
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{
                            width: `${calculatePercentage(item.value, total)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div
                className={`rounded-2xl border border-border bg-card shadow-sm ${
                  presentationMode ? "p-7" : "p-5"
                }`}
              >
                <h3 className="mb-4 font-bold text-foreground">
                  Jumlah Siswa per Jilid Iqro
                </h3>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart
                    data={levelData}
                    margin={{ top: 28, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="level"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(value, _name, props) => [
                        value,
                        props.payload.fullName,
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        className="fill-foreground"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div
                className={`rounded-2xl border border-border bg-card shadow-sm ${
                  presentationMode ? "p-7" : "p-5"
                }`}
              >
                <h3 className="mb-4 font-bold text-foreground">
                  Proporsi Program Belajar
                </h3>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="46%"
                      innerRadius={presentationMode ? 68 : 55}
                      outerRadius={presentationMode ? 112 : 90}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                  {pieData.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.value} siswa (
                        {calculatePercentage(item.value, total)}%)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border border-border bg-card shadow-sm ${
                presentationMode ? "p-7" : "p-5"
              }`}
            >
              <h3 className="mb-4 font-bold text-foreground">
                Perkembangan Program per Kelas
              </h3>
              <ResponsiveContainer
                width="100%"
                height={presentationMode ? 380 : 310}
              >
                <BarChart
                  data={classChartData}
                  margin={{ top: 34, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="kelas"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconSize={10} />
                  <Bar
                    dataKey="Tahsin Dasar (Iqro)"
                    fill="#f59e0b"
                    stackId="program"
                  >
                    <LabelList
                      dataKey="Tahsin Dasar (Iqro)"
                      position="center"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={hideZeroLabel}
                    />
                  </Bar>
                  <Bar
                    dataKey="Tahsin Lanjutan"
                    fill="#10b981"
                    stackId="program"
                  >
                    <LabelList
                      dataKey="Tahsin Lanjutan"
                      position="center"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={hideZeroLabel}
                    />
                  </Bar>
                  <Bar
                    dataKey="Tahfizh"
                    fill="#8b5cf6"
                    stackId="program"
                    radius={[6, 6, 0, 0]}
                  >
                    <LabelList
                      dataKey="Tahfizh"
                      position="center"
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={hideZeroLabel}
                    />
                    <LabelList
                      dataKey="total"
                      position="top"
                      className="fill-foreground"
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {!presentationMode && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-foreground">
                    Daftar Seluruh Siswa
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {total} siswa pada filter aktif
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {[
                        "No",
                        "Nama",
                        "Kelas",
                        "Guru Tahsin & Tahfizh",
                        "Level",
                        "Status Bacaan",
                        "Halaman",
                        "Flag",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student, index) => {
                      const flagged = isAttentionStudent(student);
                      return (
                        <tr
                          key={student.id}
                          className={`transition-colors hover:bg-muted/20 ${
                            flagged ? "bg-destructive/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {flagged && (
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
                              )}
                              <Link
                                to={`/student/${student.id}`}
                                className="transition-colors hover:text-primary"
                              >
                                {student.nama}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {getClassLabel(student)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                            {getTeacherName(student, studentIdToTeacherName)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                LEVEL_COLORS[student.level as ReadingLevel]
                              }`}
                            >
                              {student.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {student.status_bacaan}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">
                            {student.halaman_terakhir}
                          </td>
                          <td className="px-4 py-3">
                            {flagged && (
                              <Link to={`/tahsin/${student.id}`}>
                                <span className="whitespace-nowrap rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                                  Perlu Perhatian
                                </span>
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
          )}
        </>
      )}
    </div>
  );
};

export default Monitoring;
