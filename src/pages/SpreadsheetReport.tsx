import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useStudents, isTahsinDasar } from "@/hooks/useSupabaseData";
import {
  useAllMonthlyReports, useAddMonthlyReport, useUpdateMonthlyReport,
  MONTH_NAMES, calcIqraPagesSigned, getProgressStatus, getTarget,
  isIqraDecline, getAutoNoteByProgress, getAutoNoteOptions,
} from "@/hooks/useMonthlyReports";
import { useMonthlyReportPeriodSettings, useUpsertMonthlyReportPeriodSettings } from "@/hooks/useMonthlyReportPeriodSettings";
import { JUZ_LIST, JUZ_PAGES_PER_JUZ, calcHafalanPagesSigned, isTahfizhDecline } from "@/lib/juzData";
import { useEnsureTeacherStudent } from "@/hooks/useTeacherStudents";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { NOTE_EMOTICON_WARNING, hasBlockedNoteEmoticon, removeBlockedNoteEmoticons } from "@/lib/noteValidation";
import { Save, Plus, Minus, Loader2, FileSpreadsheet, MessageSquarePlus, CheckCircle2, Info, Search, Settings } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { FixedHorizontalScrollbar } from "@/components/reports/FixedHorizontalScrollbar";
import { SpreadsheetLayoutToolbar } from "@/components/reports/SpreadsheetLayoutToolbar";
import { ResizableTableHeader } from "@/components/reports/ResizableTableHeader";
import { MONTHLY_REPORT_COLUMNS } from "@/config/monthlyReportColumns";
import { useSpreadsheetLayout } from "@/hooks/useSpreadsheetLayout";
import {
  PROGRESSIVE_POINT_OPTIONS,
  TARGET_MONTH_OPTIONS,
  buildProgressiveReportScopeKey,
  calculateProgressiveReportScore,
  normalizeProgressivePoint,
  type ProgressivePoint,
  type ProgressCategory,
  type ReportProgram,
} from "@/utils/calculateProgressiveReportScore";
import { generateIntegratedMonthlyNote } from "@/utils/generateIntegratedMonthlyNote";
import type { SpreadsheetAlign, SpreadsheetColumnKey, SpreadsheetFont } from "@/types/spreadsheetLayout";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ROMBELS = ["A", "B", "C", "D"];
const KELAS_LIST = [1, 2, 3, 4, 5, 6];
const PROGRAMS = [
  { value: "iqra", label: "Iqra" },
  { value: "tahsin", label: "Tahsin Lanjutan" },
  { value: "tahfizh", label: "Tahfizh" },
];

const IQRA_PAGES = [1, ...Array.from({ length: 29 }, (_, i) => i + 4)]; // 1, 4..32
const TAHSIN_LANJUTAN_PAGES = 200; // halaman bebas
const END_NOT_SET = "__empty__";
const ADVANCED_LEVELS = ["Tahsin Lanjutan", "Tahfizh"] as const;
const isAdvancedLevel = (lvl: string): lvl is (typeof ADVANCED_LEVELS)[number] =>
  ADVANCED_LEVELS.some((level) => level === lvl);
const INDICATOR_GUIDES = [
  {
    key: "kehadiranKesiapan",
    field: "poinKehadiranKesiapan",
    label: "Kehadiran & Kesiapan Belajar",
    descriptions: {
      2: "Selalu hadir dan selalu siap mengikuti pembelajaran.",
      1: "Sering hadir, tetapi terkadang belum siap belajar.",
      0: "Sering tidak hadir, tetapi memiliki keterangan.",
      [-1]: "Sering absen tanpa keterangan.",
    },
  },
  {
    key: "kualitasBacaan",
    field: "poinKualitasBacaan",
    label: "Kualitas Bacaan Harian",
    descriptions: {
      2: "Bacaan lancar dan hanya memerlukan koreksi minimal.",
      1: "Cukup lancar, tetapi masih terdapat beberapa koreksi.",
      0: "Kurang lancar dan masih memerlukan banyak koreksi.",
      [-1]: "Tidak siap membaca ketika mendapat giliran.",
    },
  },
  {
    key: "perbaikanBacaan",
    field: "poinPerbaikanBacaan",
    label: "Perbaikan Bacaan Harian",
    descriptions: {
      2: "Kesalahan sebelumnya sudah berkurang atau tidak terulang.",
      1: "Sudah terlihat sedikit perbaikan.",
      0: "Kesalahan yang sama masih berulang.",
      [-1]: "Kesalahan bertambah atau belum terlihat upaya perbaikan.",
    },
  },
] as const;

const formatPoint = (point: number) => (point > 0 ? `+${point}` : String(point));

const clampTargetMonths = (value: unknown, program: ReportProgram) => {
  if (program === "iqra") return 0;
  const parsed = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(5, parsed));
};

const normalizeProgramType = (value: unknown, fallback: ReportProgram): ReportProgram => {
  if (value === "iqra" || value === "tahsin" || value === "tahfizh") return value;
  return fallback;
};

const getCategoryClass = (category: ProgressCategory) => {
  switch (category) {
    case "Konsisten & Progresif":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    case "Ada Progres":
      return "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100";
    case "Stagnan":
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
    case "Kurang Konsisten":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    case "Tidak Konsisten":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
  }
};

const getScoreClass = (score: number) => {
  if (score >= 90) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 75) return "bg-primary/10 text-primary border-primary/20";
  return "bg-red-100 text-red-700 border-red-200";
};

const programLevels = (program: string): string[] => {
  if (program === "iqra") return ["1", "2", "3", "4", "5", "6"];
  if (program === "tahsin") return ["Tahsin Lanjutan"];
  return JUZ_LIST.map(String); // tahfizh
};

const endLevelOptions = (program: string): string[] => {
  if (program === "iqra") return ["1", "2", "3", "4", "5", "6", "Tahsin Lanjutan"];
  if (program === "tahsin") return ["Tahsin Lanjutan", "Tahfizh"];
  return JUZ_LIST.map(String); // tahfizh
};

const formatLevel = (program: string, lvl: string): string => {
  if (isAdvancedLevel(lvl)) return lvl;
  if (program === "iqra") return `Iqro ${lvl}`;
  if (program === "tahfizh") return `Juz ${lvl}`;
  return lvl;
};

const formatStoredLevel = (program: string, lvl: string): string => {
  if (isAdvancedLevel(lvl)) return lvl;
  return formatLevel(program, lvl);
};

const stripStoredLevelPrefix = (level: string): string =>
  level
    .replace(/^Iqra\s+/i, "")
    .replace(/^Iqro\s+/i, "")
    .replace(/^Jilid\s+/i, "")
    .replace(/^Juz\s+/i, "");

const isAdvancedEndLevel = (lvl: string): boolean => isAdvancedLevel(lvl);
const isPromotionEnd = (program: string, lvl: string): boolean =>
  (program === "iqra" && lvl === "Tahsin Lanjutan") ||
  (program === "tahsin" && lvl === "Tahfizh");

type MonthlyReportRecord = {
  id?: string;
  student_id: string;
  month: number;
  year: number;
  program_type?: string | null;
  iqra_level?: string | null;
  end_iqra_level?: string | null;
  start_page?: number | null;
  end_page?: number | null;
  present?: number | null;
  sick?: number | null;
  permission?: number | null;
  absent?: number | null;
  attendance_percentage?: number | null;
  achievement_status?: string | null;
  notes?: string | null;
  poin_kehadiran_kesiapan?: number | null;
  poin_kualitas_bacaan?: number | null;
  poin_perbaikan_bacaan?: number | null;
  pencapaian_target_bulan?: number | null;
};

type MonthlyReportPayload = {
  student_id: string;
  month: number;
  year: number;
  program_type: ReportProgram;
  iqra_level: string;
  end_iqra_level: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  target_pages: number;
  attendance_percentage: number;
  poin_kehadiran_kesiapan: number;
  poin_kualitas_bacaan: number;
  poin_perbaikan_bacaan: number;
  poin_konsistensi: number;
  pencapaian_target_bulan: number;
  poin_pencapaian: number;
  nilai_dasar: number;
  nilai_akhir_progresif: number;
  kategori_progres: ProgressCategory;
  achievement_status: string;
  notes: string;
};

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const PERIOD_NOT_READY_MESSAGE =
  "Hari efektif bulan ini belum diatur. Silahkan hubungi Koordinator Tahfizh untuk pembaruan.";
const normalizeNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

const detectProgramFromLevel = (level: ReadingLevel | string | null | undefined): ReportProgram => {
  if (!level) return "iqra";
  if (level === "Tahfizh") return "tahfizh";
  if (level === "Tahsin Lanjutan") return "tahsin";
  if (isTahsinDasar(level as ReadingLevel)) return "iqra";
  return "iqra";
};

const calcSigned = (program: string, sl: string, sp: number, el: string, ep: number): number => {
  if (isPromotionEnd(program, el)) {
    if (program === "iqra") return calcIqraPagesSigned(parseInt(sl), sp, 6, 32);
    return getTarget(program);
  }
  if (program === "tahfizh") return calcHafalanPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  if (program === "iqra") return calcIqraPagesSigned(parseInt(sl), sp, parseInt(el), ep);
  return ep - sp;
};

const isDecline = (program: string, sl: string, sp: number, el: string, ep: number): boolean => {
  if (isPromotionEnd(program, el)) return false;
  if (program === "tahfizh") return isTahfizhDecline(parseInt(sl), sp, parseInt(el), ep);
  if (program === "iqra") return isIqraDecline(parseInt(sl), sp, parseInt(el), ep);
  return ep < sp;
};

const stepPage = (program: string, cur: number, dir: 1 | -1): number => {
  if (program === "iqra") {
    const idx = IQRA_PAGES.indexOf(cur);
    const newIdx = Math.max(0, Math.min(IQRA_PAGES.length - 1, idx + dir));
    return IQRA_PAGES[newIdx] ?? cur;
  }
  if (program === "tahfizh") return Math.max(1, Math.min(JUZ_PAGES_PER_JUZ, cur + dir));
  return Math.max(1, Math.min(TAHSIN_LANJUTAN_PAGES, cur + dir));
};

const getPageLimit = (program: string, level?: string): number => {
  if (level === "Tahfizh" || program === "tahfizh") return JUZ_PAGES_PER_JUZ;
  if (program === "iqra" && !isAdvancedEndLevel(level || "")) return 32;
  return TAHSIN_LANJUTAN_PAGES;
};

const pageProgramFor = (program: string, level?: string): string => {
  if (!level) return "iqra";
  if (level === "Tahfizh") return "tahfizh";
  if (level === "Tahsin Lanjutan") return "tahsin";
  if (isTahsinDasar(level as ReadingLevel)) return "iqra";
  return "iqra";
};

const clampPage = (program: string, page: number, level?: string): number =>
  Math.max(1, Math.min(getPageLimit(program, level), page));

export const getTahsinLanjutanFase = (page: number | null | undefined): number => {
  if (!page) return 1;
  if (page <= 41) return 1;
  if (page <= 76) return 2;
  return 3;
};

interface Row {
  studentId: string;
  studentName: string;
  studentLevel: ReadingLevel;
  kelas: number;
  rombel: string;
  reportId?: string;
  program: ReportProgram;
  startLevel: string;
  startPage: number;
  endLevel: string;
  endPage: number | null;
  tahfizhReportId?: string;
  tahfizhJuz: string;
  tahfizhStartPage: number;
  tahfizhEndPage: number | null;
  poinKehadiranKesiapan: ProgressivePoint;
  poinKualitasBacaan: ProgressivePoint;
  poinPerbaikanBacaan: ProgressivePoint;
  pencapaianTargetBulan: number;
  attendancePercentage: number;
  notes: string;
  dirty: boolean;
  saving: boolean;
}

const SpreadsheetReport = () => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const teacherAccount = isTeacherRole(profile?.role);
  const { data: students = [] } = useStudents();
  const { data: reports = [] } = useAllMonthlyReports();
  const addReport = useAddMonthlyReport();
  const updateReport = useUpdateMonthlyReport();
  const ensureTS = useEnsureTeacherStudent();
  const [zoom, setZoom] = useState<number>(100);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [kelas, setKelas] = useState<string>("semua");
  const [rombel, setRombel] = useState<string>("semua");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [studentSearch, setStudentSearch] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [periodSettingsForm, setPeriodSettingsForm] = useState({
    target_iqra: 0,
    target_tahsin_lanjutan: 0,
    target_tahfizh: 0,
    effective_days: 0,
  });
  const periodSettingsQuery = useMonthlyReportPeriodSettings({ month, year });
  const upsertPeriodSettings = useUpsertMonthlyReportPeriodSettings();
  const spreadsheetLayout = useSpreadsheetLayout({
    userId: user?.id,
    role: profile?.role,
  });

  const filteredStudents = useMemo(
    () => {
      const selectedMonthReports = reports.filter(r => r.month === month && r.year === year);
      const studentsWithReports = new Set(selectedMonthReports.map(r => r.student_id));

      return students.filter(s => {
        const keyword = studentSearch.trim().toLowerCase();
        const isActiveOrHasReport = s.status_siswa === 'aktif' || studentsWithReports.has(s.id);

        return (
          isActiveOrHasReport &&
          (kelas === "semua" || s.kelas === parseInt(kelas)) &&
          (rombel === "semua" || s.rombel === rombel) &&
          (!keyword || s.nama.toLowerCase().includes(keyword))
        );
      });
    },
    [students, kelas, rombel, studentSearch, reports, month, year],
  );

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setPeriodSettingsForm({
      target_iqra: periodSettingsQuery.data?.target_iqra ?? getTarget("iqra"),
      target_tahsin_lanjutan: periodSettingsQuery.data?.target_tahsin_lanjutan ?? getTarget("tahsin"),
      target_tahfizh: periodSettingsQuery.data?.target_tahfizh ?? getTarget("tahfizh"),
      effective_days: periodSettingsQuery.data?.effective_days ?? 0,
    });
  }, [periodSettingsQuery.data, month, year]);

  useEffect(() => {
    const reportRows = reports as MonthlyReportRecord[];
    const newRows: Row[] = filteredStudents.map(s => {
      const defaultProgram = detectProgramFromLevel(s.level);
      const latestPrev = reportRows
        .filter(r => r.student_id === s.id)
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .find(r => r.year * 12 + r.month < year * 12 + month);
      const previousEndLevel = latestPrev?.end_iqra_level || latestPrev?.iqra_level || "";

      // existing report is scoped by student + month + year so changing months never overwrites another report.
      const currentScopeKey = buildProgressiveReportScopeKey({ studentId: s.id, month, year });
      const existing = reportRows.find(
          r => buildProgressiveReportScopeKey({ studentId: r.student_id, month: r.month, year: r.year }) === currentScopeKey,
        );
        const existingTahfizh = reportRows.find(
          r => r.student_id === s.id && r.month === month && r.year === year && r.program_type === "tahfizh"
        );
      const inferredProgram: ReportProgram = previousEndLevel === "Tahfizh"
        ? "tahfizh"
        : previousEndLevel === "Tahsin Lanjutan"
          ? "tahsin"
          : defaultProgram;
      const program = normalizeProgramType(existing?.program_type, inferredProgram);

      // previous report (same program) for autofill
      const prev = reportRows
        .filter(r => r.student_id === s.id && r.program_type === program)
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .find(r => r.year * 12 + r.month < year * 12 + month);

      const fallbackLvl = program === "tahfizh" ? "30" : program === "iqra" ? "1" : "Tahsin Lanjutan";

      const progressiveDefaults = {
        poinKehadiranKesiapan: normalizeProgressivePoint(Number(existing?.poin_kehadiran_kesiapan ?? 0)),
        poinKualitasBacaan: normalizeProgressivePoint(Number(existing?.poin_kualitas_bacaan ?? 0)),
        poinPerbaikanBacaan: normalizeProgressivePoint(Number(existing?.poin_perbaikan_bacaan ?? 0)),
        pencapaianTargetBulan: clampTargetMonths(existing?.pencapaian_target_bulan ?? 0, program),
      };

      if (existing) {
        const lvlRaw = stripStoredLevelPrefix(existing.iqra_level || fallbackLvl);
        const endLvlRaw = stripStoredLevelPrefix(existing.end_iqra_level || existing.iqra_level || fallbackLvl);
        return {
          studentId: s.id,
          studentName: s.nama,
          studentLevel: s.level as ReadingLevel,
          kelas: s.kelas,
          rombel: s.rombel,
          reportId: existing.id,
          program,
          startLevel: lvlRaw,
          startPage: existing.start_page || 1,
          endLevel: endLvlRaw,
          endPage: existing.end_page || 1,
            tahfizhReportId: existingTahfizh?.id,
            tahfizhJuz: existingTahfizh ? stripStoredLevelPrefix(existingTahfizh.end_iqra_level || existingTahfizh.iqra_level || "30") : "30",
            tahfizhStartPage: existingTahfizh?.start_page || 1,
            tahfizhEndPage: existingTahfizh?.end_page || null,
            ...progressiveDefaults,
          attendancePercentage: existing.attendance_percentage ?? 0,
          notes: existing.notes || "",
          dirty: false,
          saving: false,
        };
      }

      // autofill from previous month's end
      const transitionPrev = latestPrev && ["Tahsin Lanjutan", "Tahfizh"].includes(latestPrev.end_iqra_level) ? latestPrev : null;
      const prevForStart = prev || transitionPrev;
      const prevEndLvlRaw = prevForStart
        ? stripStoredLevelPrefix(prevForStart.end_iqra_level || prevForStart.iqra_level || fallbackLvl)
        : fallbackLvl;
      const sl = program === "tahfizh" && prevForStart?.end_iqra_level === "Tahfizh" ? "30" : prevEndLvlRaw;
      const sp = prevForStart ? prevForStart.end_page : 1;
      return {
        studentId: s.id,
        studentName: s.nama,
        studentLevel: s.level as ReadingLevel,
        kelas: s.kelas,
        rombel: s.rombel,
        program,
        startLevel: sl,
        startPage: sp,
        endLevel: "",
        endPage: null,
          tahfizhReportId: undefined,
          tahfizhJuz: "30",
          tahfizhStartPage: 1,
          tahfizhEndPage: null,
          ...progressiveDefaults,
        attendancePercentage: 0,
        notes: "",
        dirty: false,
        saving: false,
      };
    });
    setRows(newRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents.map(s => s.id).join(","), reports.length, month, year]);

  const updateRow = useCallback((idx: number, patch: Partial<Row>) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, ...patch, dirty: true };
      // jika program berubah, reset level default
      if (patch.program && patch.program !== r.program) {
        const fb = patch.program === "tahfizh" ? "30" : patch.program === "iqra" ? "1" : "Tahsin Lanjutan";
        next.startLevel = fb; next.endLevel = "";
        next.startPage = 1; next.endPage = null;
        next.pencapaianTargetBulan = patch.program === "iqra" ? 0 : clampTargetMonths(next.pencapaianTargetBulan, patch.program);
      }
      if (patch.pencapaianTargetBulan !== undefined) {
        next.pencapaianTargetBulan = clampTargetMonths(patch.pencapaianTargetBulan, next.program);
      }
      if (patch.endLevel) {
        next.endPage = clampPage(patch.program || next.program, next.endPage ?? 1, patch.endLevel);
      }
      return next;
    }));
  }, []);

  const updateRowNotes = useCallback((idx: number, value: string) => {
    if (hasBlockedNoteEmoticon(value)) {
      toast({ title: NOTE_EMOTICON_WARNING, variant: "destructive" });
      updateRow(idx, { notes: removeBlockedNoteEmoticons(value) });
      return;
    }
    updateRow(idx, { notes: value });
  }, [updateRow]);

  const filledCount = rows.filter(r => r.reportId).length;
  const totalRows = rows.length;
  const progressPct = totalRows ? Math.round((filledCount / totalRows) * 100) : 0;

  const rowPages = useMemo(() => {
    const groups: Record<string, { row: Row, index: number }[]> = {};
    rows.forEach((r, index) => {
      const key = `${r.kelas}-${r.rombel}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ row: r, index });
    });

    const pages: { row: Row, index: number }[][] = [];
    const sortedKeys = Object.keys(groups).sort();
    for (const key of sortedKeys) {
      const classRows = groups[key];
      for (let i = 0; i < classRows.length; i += 20) {
        pages.push(classRows.slice(i, i + 20));
      }
    }
    return pages;
  }, [rows]);

  const [page, setPage] = useState(1);
  const totalPages = rowPages.length || 1;

  useEffect(() => {
    setPage(1);
  }, [kelas, rombel, month, year, studentSearch]);

  const currentPageRows = rowPages[page - 1] || [];
  const scoreForRow = useCallback((r: Row) => calculateProgressiveReportScore({
    program: r.program,
    kelas: r.kelas,
    endLevel: r.endLevel || r.startLevel,
    kehadiranKesiapan: r.poinKehadiranKesiapan,
    kualitasBacaan: r.poinKualitasBacaan,
    perbaikanBacaan: r.poinPerbaikanBacaan,
    pencapaianTargetBulan: r.pencapaianTargetBulan,
  }), []);
  const targetForProgram = useCallback((program: ReportProgram) => {
    const settings = periodSettingsQuery.data;
    if (!settings) return getTarget(program);
    if (program === "tahfizh") return settings.target_tahfizh;
    if (program === "tahsin") return settings.target_tahsin_lanjutan;
    return settings.target_iqra;
  }, [periodSettingsQuery.data]);
  const targetForRow = useCallback((row: Row) => targetForProgram(row.program), [targetForProgram]);

  const programStats = useMemo(() => rows.reduce(
    (acc, row) => {
      acc[row.program] += 1;
      acc.totalScore += scoreForRow(row).nilaiAkhir;
      return acc;
    },
    { iqra: 0, tahsin: 0, tahfizh: 0, totalScore: 0 },
  ), [rows, scoreForRow]);
  const averageScore = rows.length ? Math.round(programStats.totalScore / rows.length) : null;

  const buildAutoNote = (r: Row): string => {
    if (r.endPage === null) return "";
    const signed = calcSigned(r.program, r.startLevel, r.startPage, r.endLevel || r.startLevel, r.endPage);
    return getAutoNoteByProgress(r.program, signed, targetForRow(r));
  };

  const buildIntegratedNote = (r: Row): string => {
    const score = scoreForRow(r);
    const signedProgress = r.endLevel && r.endPage !== null
      ? calcSigned(r.program, r.startLevel, r.startPage, r.endLevel, r.endPage)
      : 0;

    return generateIntegratedMonthlyNote({
      studentId: r.studentId,
      month,
      year,
      program: r.program,
      kelas: r.kelas,
      startLevel: r.startLevel,
      endLevel: r.endLevel || r.startLevel,
      pagesRead: signedProgress,
      signedProgress,
      targetPages: targetForRow(r),
      kehadiranKesiapan: r.poinKehadiranKesiapan,
      kualitasBacaan: r.poinKualitasBacaan,
      perbaikanBacaan: r.poinPerbaikanBacaan,
      pencapaianTargetBulan: score.pencapaianTargetBulan,
      nilaiDasar: score.nilaiDasar,
      poinKonsistensi: score.poinKonsistensi,
      poinPencapaian: score.poinPencapaian,
      nilaiAkhir: score.nilaiAkhir,
      kategoriProgres: score.kategoriProgres,
    });
  };

  const isLayoutCellSelected = (studentId: string, columnKey: SpreadsheetColumnKey) => {
    const selection = spreadsheetLayout.selection;
    if (selection.type === "table") return true;
    if (selection.type === "column") return selection.columnKey === columnKey;
    if (selection.type === "row") return selection.studentId === studentId;
    return selection.studentId === studentId && selection.columnKey === columnKey;
  };

  const layoutCellProps = (studentId: string, columnKey: SpreadsheetColumnKey) => ({
    "data-layout-cell": `${studentId}:${columnKey}`,
    "data-layout-selected": spreadsheetLayout.isEditing && isLayoutCellSelected(studentId, columnKey) ? true : undefined,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      if (!spreadsheetLayout.isEditing) return;
      event.preventDefault();
      event.stopPropagation();
      spreadsheetLayout.setSelection({ type: "cell", studentId, columnKey });
    },
    style: spreadsheetLayout.getCellStyle(studentId, columnKey),
  });

  const startRowResize = (event: ReactPointerEvent<HTMLElement>, studentId: string) => {
    if (!spreadsheetLayout.isEditing) return;
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = spreadsheetLayout.getRowHeight(studentId);
    const handleMove = (moveEvent: PointerEvent) => {
      spreadsheetLayout.setRowHeight(studentId, startHeight + moveEvent.clientY - startY);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const saveLayout = async (scope: "global" | "personal") => {
    try {
      if (scope === "global") await spreadsheetLayout.saveGlobal();
      else await spreadsheetLayout.savePersonal();
      toast({ title: "Layout berhasil disimpan" });
    } catch (error: unknown) {
      toast({ title: "Gagal menyimpan layout", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const resetLayout = async (scope: "global" | "personal") => {
    const label = scope === "global" ? "layout global" : "layout pribadi";
    if (!window.confirm(`Reset ${label}? Perubahan layout tersimpan akan dihapus.`)) return;
    try {
      if (scope === "global") await spreadsheetLayout.resetGlobal();
      else await spreadsheetLayout.resetPersonal();
      toast({ title: `${label} berhasil direset` });
    } catch (error: unknown) {
      toast({ title: `Gagal reset ${label}`, description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const restoreDefaultLayout = () => {
    if (!window.confirm("Kembalikan draft layout ke default bawaan?")) return;
    spreadsheetLayout.resetDraftToDefault();
  };

  const toggleLayoutEdit = async () => {
    if (!spreadsheetLayout.isEditing) {
      spreadsheetLayout.setIsEditing(true);
      spreadsheetLayout.setSelection({ type: "table" });
      return;
    }

    if (!spreadsheetLayout.dirty) {
      spreadsheetLayout.setIsEditing(false);
      return;
    }

    if (window.confirm("Layout belum disimpan. Pilih OK untuk menyimpan sekarang, atau Cancel untuk pilihan lain.")) {
      await saveLayout(spreadsheetLayout.isAdmin ? "global" : "personal");
      spreadsheetLayout.setIsEditing(false);
      return;
    }

    if (window.confirm("Buang perubahan layout yang belum disimpan? Pilih Cancel untuk tetap di mode edit.")) {
      spreadsheetLayout.discardDraft();
      spreadsheetLayout.setIsEditing(false);
    }
  };

  const applyFont = (font: SpreadsheetFont) => spreadsheetLayout.applyStyleToSelection({ fontFamily: font });
  const applyFontSize = (size: number) => spreadsheetLayout.applyStyleToSelection({ fontSize: Math.max(8, Math.min(24, Math.round(size))) });
  const applyAlign = (align: SpreadsheetAlign) => spreadsheetLayout.applyStyleToSelection({ align });
  const applyBold = () => spreadsheetLayout.applyStyleToSelection({ bold: true });
  const applyWrap = () => spreadsheetLayout.applyStyleToSelection({ wrap: true });

  const saveRow = async (idx: number, silent = false): Promise<boolean> => {
    const r = rows[idx];
    if (!r.dirty || r.saving) return true;
    if (r.endPage === null) {
      if (!silent) toast({ title: `Lengkapi Hal. Akhir untuk ${r.studentName}`, variant: "destructive" });
      return false;
    }
    setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: true } : x));
    try {
      const target = targetForRow(r);
      const signed = calcSigned(r.program, r.startLevel, r.startPage, r.endLevel || r.startLevel, r.endPage);
      const status = isPromotionEnd(r.program, r.endLevel) ? "achieved" : getProgressStatus(signed, target);
      const progressiveScore = scoreForRow(r);
      const notesForSave = r.notes.trim() ? r.notes : buildIntegratedNote(r);
      const payload: MonthlyReportPayload = {
        student_id: r.studentId,
        month, year, program_type: r.program,
        iqra_level: formatStoredLevel(r.program, r.startLevel),
        end_iqra_level: formatStoredLevel(r.program, r.endLevel || r.startLevel),
        start_page: r.startPage,
        end_page: r.endPage,
        pages_read: signed,
        target_pages: target,
        attendance_percentage: r.attendancePercentage,
        poin_kehadiran_kesiapan: r.poinKehadiranKesiapan,
        poin_kualitas_bacaan: r.poinKualitasBacaan,
        poin_perbaikan_bacaan: r.poinPerbaikanBacaan,
        poin_konsistensi: progressiveScore.poinKonsistensi,
        pencapaian_target_bulan: progressiveScore.pencapaianTargetBulan,
        poin_pencapaian: progressiveScore.poinPencapaian,
        nilai_dasar: progressiveScore.nilaiDasar,
        nilai_akhir_progresif: progressiveScore.nilaiAkhir,
        kategori_progres: progressiveScore.kategoriProgres,
        achievement_status: status,
        notes: notesForSave,
      };
      let saved;
      if (r.reportId) saved = await updateReport.mutateAsync({ id: r.reportId, ...payload });
      else saved = await addReport.mutateAsync(payload);

      // Handle Tahfizh Setoran for Tahsin Lanjutan Fase 2+
      let savedTahfizhId = r.tahfizhReportId;
      if (r.program === "tahsin" && getTahsinLanjutanFase(r.startPage) >= 2 && r.tahfizhEndPage !== null) {
        const tahfizhPayload: MonthlyReportPayload = {
          student_id: r.studentId,
          month, year, program_type: "tahfizh",
          iqra_level: formatStoredLevel("tahfizh", r.tahfizhJuz),
          end_iqra_level: formatStoredLevel("tahfizh", r.tahfizhJuz),
          start_page: r.tahfizhStartPage,
          end_page: r.tahfizhEndPage,
          pages_read: calcHafalanPagesSigned(parseInt(r.tahfizhJuz), r.tahfizhStartPage, parseInt(r.tahfizhJuz), r.tahfizhEndPage),
          target_pages: getTarget("tahfizh"),
          attendance_percentage: r.attendancePercentage,
          poin_kehadiran_kesiapan: r.poinKehadiranKesiapan,
          poin_kualitas_bacaan: r.poinKualitasBacaan,
          poin_perbaikan_bacaan: r.poinPerbaikanBacaan,
          poin_konsistensi: progressiveScore.poinKonsistensi,
          pencapaian_target_bulan: clampTargetMonths(r.pencapaianTargetBulan, "tahfizh"),
          poin_pencapaian: progressiveScore.poinPencapaian,
          nilai_dasar: progressiveScore.nilaiDasar,
          nilai_akhir_progresif: progressiveScore.nilaiAkhir,
          kategori_progres: progressiveScore.kategoriProgres,
          achievement_status: "achieved",
          notes: notesForSave,
        };
        
        if (r.tahfizhReportId) {
          const res = await updateReport.mutateAsync({ id: r.tahfizhReportId, ...tahfizhPayload });
          savedTahfizhId = res.id;
        } else {
          const res = await addReport.mutateAsync(tahfizhPayload);
          savedTahfizhId = res.id;
        }
      }

      const stu = filteredStudents.find(s => s.id === r.studentId);
      await ensureTS.mutateAsync({ studentId: r.studentId, kelas: stu?.kelas, rombel: stu?.rombel });

      setRows(prev => prev.map((x, i) => i === idx ? {
          ...x,
          reportId: saved.id,
          tahfizhReportId: savedTahfizhId,
        pencapaianTargetBulan: progressiveScore.pencapaianTargetBulan,
        notes: notesForSave,
        dirty: false,
        saving: false,
      } : x));
      return true;
    } catch (e: unknown) {
      setRows(prev => prev.map((x, i) => i === idx ? { ...x, saving: false } : x));
      if (!silent) toast({ title: `Gagal menyimpan ${r.studentName}`, description: getErrorMessage(e), variant: "destructive" });
      return false;
    }
  };

  const saveAll = async () => {
    const dirtyIdx = rows.map((r, i) => r.dirty ? i : -1).filter(i => i >= 0);
    if (dirtyIdx.length === 0) {
      toast({ title: "Tidak ada perubahan untuk disimpan" });
      return;
    }
    setSavingAll(true);
    let ok = 0, fail = 0;
    for (const i of dirtyIdx) {
      const success = await saveRow(i, true);
      if (success) ok++; else fail++;
    }
    setSavingAll(false);
    toast({
      title: `Tersimpan ${ok} laporan${fail ? ` · ${fail} gagal` : ""}`,
      variant: fail ? "destructive" : "default",
    });
  };

  const updatePeriodSettingsForm = (
    field: "target_iqra" | "target_tahsin_lanjutan" | "target_tahfizh" | "effective_days",
    value: string,
  ) => {
    setPeriodSettingsForm((current) => ({ ...current, [field]: normalizeNumber(value) }));
  };

  const saveGlobalPeriodSettings = async () => {
    if (!isAdmin) return;
    try {
      await upsertPeriodSettings.mutateAsync({
        month,
        year,
        ...periodSettingsForm,
        syncAttendanceSettings: true,
      });
      toast({
        title: "Pengaturan bulanan tersimpan",
        description: "Target laporan dan hari efektif global sudah diperbarui.",
      });
      await periodSettingsQuery.refetch();
    } catch (error: unknown) {
      toast({
        title: "Gagal menyimpan pengaturan bulanan",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="spreadsheet-report-page p-3 md:p-6 space-y-4 max-w-[1700px] mx-auto">
      <Card className="rounded-2xl overflow-hidden border border-primary/15 shadow-lg shadow-primary/5 bg-background">
        <CardHeader className="pb-3 border-b border-border/70 bg-gradient-to-b from-background to-muted/20">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Input Laporan Bulanan
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Semua program (Iqra, Tahsin Lanjutan, Tahfizh) dalam satu tabel. Program otomatis sesuai level siswa, kolom menyesuaikan. Auto-fill dari bulan sebelumnya · Guru: <span className="font-medium text-foreground">{profile?.full_name || "—"}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kelas</SelectItem>
                {KELAS_LIST.map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rombel} onValueChange={setRombel}>
              <SelectTrigger><SelectValue placeholder="Rombel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Rombel</SelectItem>
                {ROMBELS.map(r => <SelectItem key={r} value={r}>Rombel {r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <div className="relative col-span-2 md:col-span-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Cari siswa..."
                className="pl-8"
              />
            </div>
          </div>

          {teacherAccount && (periodSettingsQuery.data?.effective_days ?? 0) <= 0 && (
            <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100">
              <Info className="h-4 w-4" />
              <AlertDescription>{PERIOD_NOT_READY_MESSAGE}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <div className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Total Siswa</p>
              <p className="text-lg font-bold text-foreground">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Program Iqra</p>
              <p className="text-lg font-bold text-primary">{programStats.iqra}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Tahsin Lanjutan</p>
              <p className="text-lg font-bold text-primary">{programStats.tahsin}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Program Tahfizh</p>
              <p className="text-lg font-bold text-primary">{programStats.tahfizh}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Rata-rata Nilai</p>
              <p className="text-lg font-bold text-foreground">{averageScore ?? "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progres pengisian (laporan tersimpan)</span>
                <span className="font-semibold">{filledCount}/{totalRows} ({progressPct}%)</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
            <div className="flex items-center gap-1.5 bg-muted/60 p-0.5 rounded-md border border-border">
              <span className="text-[10px] text-muted-foreground px-1.5 font-medium">Zoom:</span>
              {([50, 75, 100] as const).map(z => (
                <Button
                  key={z}
                  size="sm"
                  variant={zoom === z ? "default" : "ghost"}
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => setZoom(z)}
                >
                  {z}%
                </Button>
              ))}
            </div>
            <Button onClick={saveAll} disabled={savingAll} className="gap-2">
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Semua
            </Button>
          </div>
        </CardContent>
      </Card>

      <SpreadsheetLayoutToolbar
        isEditing={spreadsheetLayout.isEditing}
        canEdit={spreadsheetLayout.canEdit}
        isAdmin={spreadsheetLayout.isAdmin}
        isTeacher={spreadsheetLayout.isTeacher}
        dirty={spreadsheetLayout.dirty}
        statusText={spreadsheetLayout.statusText}
        tableFont={spreadsheetLayout.layout.tableFont}
        tableFontSize={spreadsheetLayout.layout.tableFontSize}
        defaultRowHeight={spreadsheetLayout.layout.defaultRowHeight}
        selection={spreadsheetLayout.selection}
        onToggleEdit={toggleLayoutEdit}
        onSaveGlobal={() => saveLayout("global")}
        onSavePersonal={() => saveLayout("personal")}
        onResetGlobal={() => resetLayout("global")}
        onResetPersonal={() => resetLayout("personal")}
        onUseGlobal={() => resetLayout("personal")}
        onRestoreDefault={restoreDefaultLayout}
        onResetSelection={spreadsheetLayout.resetSelection}
        onApplyFont={applyFont}
        onApplyFontSize={applyFontSize}
        onApplyBold={applyBold}
        onApplyAlign={applyAlign}
        onApplyWrap={applyWrap}
        onDefaultRowHeightChange={spreadsheetLayout.setDefaultRowHeight}
        isSaving={spreadsheetLayout.isSaving}
        afterStatus={isAdmin ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                title="Pengaturan Bulanan"
                aria-label="Pengaturan Bulanan"
              >
                <Settings className="h-4 w-4" />
                Pengaturan Bulanan
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] space-y-3 p-4" align="start">
              <div>
                <p className="text-sm font-semibold">Pengaturan Bulanan</p>
                <p className="text-xs text-muted-foreground">{MONTH_NAMES[month - 1]} {year}</p>
              </div>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Iqra / Tahsin Dasar</label>
                  <Input
                    type="number"
                    min={0}
                    value={periodSettingsForm.target_iqra}
                    onChange={(event) => updatePeriodSettingsForm("target_iqra", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Tahsin Lanjutan</label>
                  <Input
                    type="number"
                    min={0}
                    value={periodSettingsForm.target_tahsin_lanjutan}
                    onChange={(event) => updatePeriodSettingsForm("target_tahsin_lanjutan", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Tahfizh</label>
                  <Input
                    type="number"
                    min={0}
                    value={periodSettingsForm.target_tahfizh}
                    onChange={(event) => updatePeriodSettingsForm("target_tahfizh", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Hari Efektif</label>
                  <Input
                    type="number"
                    min={0}
                    value={periodSettingsForm.effective_days}
                    onChange={(event) => updatePeriodSettingsForm("effective_days", event.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="w-full gap-2"
                onClick={saveGlobalPeriodSettings}
                disabled={upsertPeriodSettings.isPending}
              >
                {upsertPeriodSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Global
              </Button>
            </PopoverContent>
          </Popover>
        ) : null}
      />

      <Card className="overflow-hidden rounded-2xl border border-amber-600/20 bg-amber-50/40 shadow-sm dark:bg-amber-950/10">
        <button
          type="button"
          onClick={() => setShowGuide((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={showGuide}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
            <Info className="h-4 w-4" />
            Panduan Penilaian Progresif (+2, +1, 0, -1)
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {showGuide ? "Tutup panduan" : "Buka panduan"}
          </span>
        </button>
        {showGuide && (
          <CardContent className="grid gap-2 p-4 pt-0 md:grid-cols-3">
            {INDICATOR_GUIDES.map((guide) => (
              <div key={guide.key} className="overflow-hidden rounded-xl border border-amber-200 bg-background">
                <div className="bg-amber-100/70 px-3 py-2 text-xs font-bold text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                  {guide.label}
                </div>
                <div className="divide-y divide-amber-100 dark:divide-amber-900/40">
                  {PROGRESSIVE_POINT_OPTIONS.map((point) => (
                    <div key={point} className="grid grid-cols-[42px_1fr] gap-2 px-3 py-2 text-[11px] leading-relaxed">
                      <span className="inline-flex min-h-6 items-center justify-center rounded-md bg-primary/10 font-black text-primary">
                        {formatPoint(point)}
                      </span>
                      <span className="text-muted-foreground">{guide.descriptions[point]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <Card className="rounded-2xl overflow-hidden border border-primary/20 shadow-md shadow-primary/5 bg-background">
        <CardContent ref={tableScrollRef} className="spreadsheet-table-scroll p-0">
          <table
            ref={tableRef}
            aria-label="Tabel input laporan bulanan dan penilaian progresif"
            className={`w-full border-separate border-spacing-0 text-xs ${spreadsheetLayout.isEditing ? "spreadsheet-layout-editing" : ""}`}
            style={{
              minWidth: spreadsheetLayout.tableMinWidth,
              fontFamily: `"${spreadsheetLayout.layout.tableFont}", system-ui, sans-serif`,
              fontSize: `${spreadsheetLayout.layout.tableFontSize}px`,
              zoom: zoom / 100,
            }}
            onClick={(event) => {
              if (!spreadsheetLayout.isEditing || event.target !== event.currentTarget) return;
              spreadsheetLayout.setSelection({ type: "table" });
            }}
          >
            <colgroup>
              {MONTHLY_REPORT_COLUMNS.map((column) => {
                const width = spreadsheetLayout.getColumnWidth(column.key);
                return <col key={column.key} style={{ width, minWidth: width, maxWidth: width }} />;
              })}
            </colgroup>
            <thead className="text-white">
              <tr className="text-center">
                <th className="sticky left-0 top-0 z-[55] h-9 border border-white/20 bg-[#087047] px-2 py-2 text-center align-middle font-extrabold" colSpan={3} style={{ fontSize: spreadsheetLayout.layout.headerFontSize }}>
                  Identitas
                </th>
                <th className="sticky top-0 z-30 h-9 border border-white/20 bg-[#0a7950] px-2 py-2 text-center align-middle font-extrabold" colSpan={6} style={{ fontSize: spreadsheetLayout.layout.headerFontSize }}>
                  Progres Bulanan
                </th>
                <th className="sticky top-0 z-30 h-9 border border-white/20 bg-[#8a650e] px-2 py-2 text-center align-middle font-extrabold" colSpan={5} style={{ fontSize: spreadsheetLayout.layout.headerFontSize }}>
                  Penilaian Progresif
                </th>
                <th className="sticky top-0 z-30 h-9 border border-white/20 bg-[#32443a] px-2 py-2 text-center align-middle font-extrabold" colSpan={3} style={{ fontSize: spreadsheetLayout.layout.headerFontSize }}>
                  Hasil
                </th>
              </tr>
              <tr className="text-center">
                {MONTHLY_REPORT_COLUMNS.map((column) => {
                  const width = spreadsheetLayout.getColumnWidth(column.key);
                  const left = column.key === "number"
                    ? spreadsheetLayout.stickyLeft.number
                    : column.key === "studentName"
                      ? spreadsheetLayout.stickyLeft.studentName
                      : undefined;
                  const bg = column.group === "progressiveAssessment"
                    ? "bg-[#9a7418]"
                    : column.group === "result"
                      ? "bg-[#3b5045]"
                      : "bg-[#0a8251]";
                  const selected = spreadsheetLayout.isEditing && (
                    spreadsheetLayout.selection.type === "table"
                    || (spreadsheetLayout.selection.type === "column" && spreadsheetLayout.selection.columnKey === column.key)
                  );
                  return (
                    <ResizableTableHeader
                      key={column.key}
                      column={column}
                      width={width}
                      left={left}
                      top={36}
                      isEditing={spreadsheetLayout.isEditing}
                      selected={selected}
                      className={bg}
                      style={{
                        fontSize: spreadsheetLayout.layout.headerFontSize,
                        ...spreadsheetLayout.getColumnStyle(column.key),
                      }}
                      onSelect={() => spreadsheetLayout.setSelection({ type: "column", columnKey: column.key })}
                      onResize={(nextWidth) => spreadsheetLayout.setColumnWidth(column.key, nextWidth)}
                      onResetWidth={() => spreadsheetLayout.resetColumnWidth(column.key)}
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {currentPageRows.length === 0 && (
                <tr><td colSpan={17} className="p-6 text-center text-muted-foreground border border-border text-[10px]">Belum ada siswa pada filter ini.</td></tr>
              )}
              {currentPageRows.map(({ row: r, index: idx }, pageIndex) => {
                const target = targetForRow(r);
                const hasEnd = r.endPage !== null;
                  const actualEndLevel = r.endLevel || r.startLevel;
                const signed = hasEnd ? calcSigned(r.program, r.startLevel, r.startPage, actualEndLevel, r.endPage as number) : 0;
                const decline = hasEnd ? isDecline(r.program, r.startLevel, r.startPage, actualEndLevel, r.endPage as number) : false;
                const lvlOpts = programLevels(r.program);
                const endOpts = endLevelOptions(r.program);
                const showStartLevelSelect = r.program !== "tahsin"; // Tahsin Lanjutan: 1 level, sembunyikan dropdown awal
                const progressiveScore = scoreForRow(r);

                const rowBg = r.dirty
                  ? "bg-amber-100 dark:bg-amber-900/40"
                  : decline
                    ? "bg-rose-100 dark:bg-rose-900/40"
                    : "bg-card";

                const hasSetoran = r.program === "tahsin" && getTahsinLanjutanFase(Math.max(r.startPage || 1, r.endPage || 1)) >= 2;
                const rs = hasSetoran ? 2 : 1;
                const signedTahfizh = r.tahfizhEndPage !== null ? calcHafalanPagesSigned(parseInt(r.tahfizhJuz), r.tahfizhStartPage, parseInt(r.tahfizhJuz), r.tahfizhEndPage) : 0;
                return (
                  <React.Fragment key={r.studentId}>
                  <tr
                    className={`divide-x divide-blue-400 dark:divide-blue-700 ${r.dirty ? "bg-amber-50/50 dark:bg-amber-950/20" : decline ? "bg-red-50/30 dark:bg-red-950/20" : "hover:bg-blue-50/80 dark:hover:bg-blue-900/40 transition-colors"}`}
                    data-layout-selected={spreadsheetLayout.isEditing && (spreadsheetLayout.selection.type === "table" || (spreadsheetLayout.selection.type === "row" && spreadsheetLayout.selection.studentId === r.studentId)) ? true : undefined}
                    style={spreadsheetLayout.getRowStyle(r.studentId)}
                  >
                    <td
                      {...layoutCellProps(r.studentId, "number")} rowSpan={rs}
                      onClick={(event) => {
                        if (!spreadsheetLayout.isEditing) return;
                        event.preventDefault();
                        event.stopPropagation();
                        spreadsheetLayout.setSelection({ type: "row", studentId: r.studentId });
                      }}
                      className={`relative p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-muted-foreground text-[10px] sticky left-0 z-10 ${rowBg}`}
                      style={{ ...spreadsheetLayout.getCellStyle(r.studentId, "number"), left: spreadsheetLayout.stickyLeft.number }}
                    >
                      {pageIndex + 1}
                      {spreadsheetLayout.isEditing && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-[-4px] left-0 z-20 h-2 w-full cursor-row-resize touch-none"
                          onPointerDown={(event) => startRowResize(event, r.studentId)}
                        />
                      )}
                    </td>
                    <td
                      {...layoutCellProps(r.studentId, "studentName")} rowSpan={rs}
                      className={`p-0.5 px-1 border border-[1.5px] border-blue-400 dark:border-blue-700 border-r-[1.5px] border-r-blue-500 dark:border-r-blue-400 font-medium text-[10px] shadow-[1px_0_0_0_theme(colors.blue.500)] dark:shadow-[1px_0_0_0_theme(colors.blue.400)] truncate sticky z-10 ${rowBg}`}
                      style={{ ...spreadsheetLayout.getCellStyle(r.studentId, "studentName"), left: spreadsheetLayout.stickyLeft.studentName }}
                      title={r.studentName}
                    >
                      {r.studentName}
                    </td>
                    <td {...layoutCellProps(r.studentId, "program")} rowSpan={rs} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      <Select value={r.program} onValueChange={(v) => updateRow(idx, { program: v as ReportProgram })} disabled={spreadsheetLayout.isEditing}>
                        <SelectTrigger className="h-6 w-full border-none bg-transparent shadow-none hover:bg-muted/30 focus:bg-background text-[10px] px-1 focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                        <SelectContent>{PROGRAMS.map(p => <SelectItem key={p.value} value={p.value} className="text-[10px]">{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td {...layoutCellProps(r.studentId, "startLevel")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      {showStartLevelSelect ? (
                        <Select value={r.startLevel} onValueChange={v => updateRow(idx, { startLevel: v })} disabled={spreadsheetLayout.isEditing}>
                          <SelectTrigger className="h-6 w-full border-none bg-transparent shadow-none hover:bg-muted/30 focus:bg-background text-[10px] px-1 focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                          <SelectContent>{lvlOpts.map(l => <SelectItem key={l} value={l} className="text-[10px]">{formatLevel(r.program, l)}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <span className="text-[10px] text-muted-foreground px-1">—</span>}
                    </td>
                    <td {...layoutCellProps(r.studentId, "startPage")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      <div className="flex items-center justify-center">
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { startPage: stepPage(r.program, r.startPage, -1) })}><Minus className="w-2 h-2" /></Button>
                        <Input
                          type="number"
                          min={1}
                          max={getPageLimit(r.program, r.startLevel)}
                          value={r.startPage}
                          disabled={spreadsheetLayout.isEditing}
                          onChange={e => updateRow(idx, { startPage: clampPage(r.program, parseInt(e.target.value) || 1, r.startLevel) })}
                          className="h-6 w-9 text-center text-[10px] md:text-[10px] px-0.5 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/30"
                        />
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { startPage: stepPage(r.program, r.startPage, 1) })}><Plus className="w-2 h-2" /></Button>
                      </div>
                    </td>
                    <td {...layoutCellProps(r.studentId, "endLevel")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      <Select value={r.endLevel || END_NOT_SET} onValueChange={v => updateRow(idx, { endLevel: v === END_NOT_SET ? "" : v })} disabled={spreadsheetLayout.isEditing}>
                        <SelectTrigger className="h-6 w-full border-none bg-transparent shadow-none hover:bg-muted/30 focus:bg-background text-[10px] px-1 focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={END_NOT_SET} className="text-[10px]">Akhir</SelectItem>
                          {endOpts.map(l => <SelectItem key={l} value={l} className="text-[10px]">{formatLevel(r.program, l)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td {...layoutCellProps(r.studentId, "endPage")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      <div className="flex items-center justify-center">
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { endPage: stepPage(pageProgramFor(r.program, actualEndLevel), r.endPage ?? 1, -1) })}><Minus className="w-2 h-2" /></Button>
                        <Input
                          type="number"
                          min={1}
                          max={getPageLimit(r.program, r.endLevel)}
                          value={r.endPage ?? ""}
                          disabled={spreadsheetLayout.isEditing}
                          placeholder="Isi"
                          onChange={e => updateRow(idx, {
                            endPage: e.target.value === "" ? null : clampPage(r.program, parseInt(e.target.value) || 1, r.endLevel),
                          })}
                          className="h-6 w-9 text-center text-[10px] md:text-[10px] px-0.5 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/30"
                        />
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { endPage: stepPage(pageProgramFor(r.program, actualEndLevel), r.endPage ?? 1, 1) })}><Plus className="w-2 h-2" /></Button>
                      </div>
                    </td>
                                          <td {...layoutCellProps(r.studentId, "totalProgress")} className={`p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-[10px] ${signed < 0 ? "text-red-600 font-bold" : ""}`}>{hasEnd ? signed : "-"}</td>
                    <td {...layoutCellProps(r.studentId, "target")} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-muted-foreground text-[10px]">{target}</td>
                    {INDICATOR_GUIDES.map((guide) => {
                      const point = r[guide.field] as ProgressivePoint;
                      const tooltipText = `${formatPoint(point)} - ${guide.descriptions[point]}`;
                      const columnKey = guide.key === "kehadiranKesiapan"
                        ? "attendanceReadiness"
                        : guide.key === "kualitasBacaan"
                          ? "readingQuality"
                          : "readingImprovement";
                      return (
                        <td key={guide.key} {...layoutCellProps(r.studentId, columnKey)} rowSpan={rs} className="p-1 border border-[1.5px] border-blue-400 dark:border-blue-700">
                          <Select
                            value={String(point)}
                            disabled={spreadsheetLayout.isEditing}
                            onValueChange={(value) => updateRow(idx, {
                              [guide.field]: normalizeProgressivePoint(Number(value)),
                            } as Partial<Row>)}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectTrigger
                                  title={tooltipText}
                                  aria-label={`${guide.label}: ${tooltipText}`}
                                  className="h-7 w-full border-amber-200/50 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-50 px-2 text-center text-[10px] font-bold shadow-none focus:ring-0 focus:ring-offset-0"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[260px] text-xs">
                                {tooltipText}
                              </TooltipContent>
                            </Tooltip>
                            <SelectContent>
                              {PROGRESSIVE_POINT_OPTIONS.map((option) => (
                                <SelectItem key={option} value={String(option)} className="text-[10px]">
                                  {formatPoint(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                    <td {...layoutCellProps(r.studentId, "monthlyAchievement")} rowSpan={rs} className="p-1 border border-[1.5px] border-blue-400 dark:border-blue-700 bg-amber-50/40 dark:bg-amber-950/10">
                      <Select
                        value={String(r.pencapaianTargetBulan)}
                        disabled={r.program === "iqra" || spreadsheetLayout.isEditing}
                        onValueChange={(value) => updateRow(idx, { pencapaianTargetBulan: Number(value) })}
                      >
                        <SelectTrigger
                          title={r.program === "iqra" ? "Pencapaian bulanan hanya untuk Tahsin Lanjutan dan Tahfizh" : "Jumlah bulan target tercapai selama semester berjalan"}
                          className="h-7 w-full border-amber-200 bg-amber-50 px-2 text-left text-[10px] font-bold text-amber-800 shadow-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:ring-0 focus:ring-offset-0"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {r.program === "iqra" ? (
                            <SelectItem value="0" className="text-[10px]">&mdash; Tidak berlaku</SelectItem>
                          ) : (
                            TARGET_MONTH_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)} className="text-[10px]">
                                {option} bulan
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                    <td {...layoutCellProps(r.studentId, "progressCategory")} rowSpan={rs} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center">
                      <Badge variant="outline" className={`py-0 px-1.5 text-[9px] ${getCategoryClass(progressiveScore.kategoriProgres)}`}>
                        {progressiveScore.kategoriProgres}
                      </Badge>
                    </td>
                    <td {...layoutCellProps(r.studentId, "finalScore")} rowSpan={rs} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center">
                      <span className={`inline-flex min-h-7 min-w-10 items-center justify-center rounded-lg border px-2 text-[13px] font-black ${getScoreClass(progressiveScore.nilaiAkhir)}`}>
                        {progressiveScore.nilaiAkhir}
                      </span>
                    </td>
                    <td {...layoutCellProps(r.studentId, "notes")} rowSpan={rs} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700">
                      <div className="flex items-center gap-0.5">
                        <Textarea
                          value={r.notes}
                          disabled={spreadsheetLayout.isEditing}
                          onChange={e => updateRowNotes(idx, e.target.value)}
                          placeholder="Catatan..."
                          className="min-h-[22px] h-6 w-full border-none bg-transparent shadow-none resize-none focus-visible:ring-0 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/30 text-[10px] px-1 py-0"
                          rows={1}
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0 p-0 hover:bg-muted" title="Template catatan" disabled={spreadsheetLayout.isEditing}>
                              <MessageSquarePlus className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[360px] p-2 space-y-1">
                            <p className="text-xs font-semibold px-1 py-1">Pilih catatan otomatis</p>
                            {getAutoNoteOptions(r.program).map((option) => (
                              <button
                                key={option.key}
                                onClick={() => updateRowNotes(idx, option.note)}
                                className="block w-full text-left text-xs p-2 rounded hover:bg-accent font-medium"
                              >
                                {option.label}
                              </button>
                            ))}
                            <button
                              onClick={() => updateRowNotes(idx, buildAutoNote(r) || r.notes)}
                              className="block w-full text-left text-xs p-2 rounded bg-primary/10 hover:bg-primary/20 font-medium"
                            >
                              Catatan otomatis berdasarkan progres
                            </button>
                            <button
                              onClick={() => updateRowNotes(idx, buildIntegratedNote(r))}
                              className="block w-full text-left text-xs p-2 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-100 font-medium"
                            >
                              Catatan terpadu berdasarkan nilai & progres
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    <td {...layoutCellProps(r.studentId, "saveStatus")} rowSpan={rs} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-[10px]">
                      {r.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> :
                        r.dirty || !r.reportId ? <Badge variant="outline" className="text-amber-600 border-amber-300 py-0 px-1 text-[9px]">Belum Simpan</Badge> :
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 py-0 px-1 text-[9px] text-emerald-700"><CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />Tersimpan</Badge>}{/*
                        <span className="text-muted-foreground text-[10px]">—</span>}
                    */}
                    </td>
                    </tr>
                    {hasSetoran && (
                      <tr className="bg-muted/40">
                        <td {...layoutCellProps(r.studentId, "startLevel")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                           <div className="h-full flex items-center justify-center">
                             <Select value={r.tahfizhJuz} onValueChange={v => updateRow(idx, { tahfizhJuz: v })} disabled={spreadsheetLayout.isEditing}>
                               <SelectTrigger className="h-6 w-full border-none bg-transparent shadow-none hover:bg-muted/30 focus:bg-background text-[10px] px-1 focus:ring-0 focus:ring-offset-0 text-blue-700 font-medium">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => <SelectItem key={j} value={String(j)} className="text-[10px]">Juz {j}</SelectItem>)}
                               </SelectContent>
                             </Select>
                           </div>
                        </td>
                        <td {...layoutCellProps(r.studentId, "startPage")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                          <div className="flex items-center justify-center">
                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted text-blue-700" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { tahfizhStartPage: stepPage("tahfizh", r.tahfizhStartPage, -1) })}><Minus className="w-2 h-2" /></Button>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={r.tahfizhStartPage}
                              disabled={spreadsheetLayout.isEditing}
                              onChange={e => updateRow(idx, { tahfizhStartPage: clampPage("tahfizh", parseInt(e.target.value) || 1, r.tahfizhJuz) })}
                              className="h-6 w-9 text-center text-[10px] md:text-[10px] px-0.5 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-blue-100 dark:focus-visible:bg-blue-800/30 text-blue-700 font-medium"
                            />
                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted text-blue-700" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { tahfizhStartPage: stepPage("tahfizh", r.tahfizhStartPage, 1) })}><Plus className="w-2 h-2" /></Button>
                          </div>
                        </td>
                        <td {...layoutCellProps(r.studentId, "endLevel")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700 bg-muted/10">
                          <div className="h-6 w-full flex items-center justify-center text-muted-foreground text-[10px]">-</div>
                        </td>
                        <td {...layoutCellProps(r.studentId, "endPage")} className="p-0 border border-[1.5px] border-blue-400 dark:border-blue-700">
                          <div className="flex items-center justify-center">
                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted text-blue-700" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { tahfizhEndPage: stepPage("tahfizh", r.tahfizhEndPage ?? 1, -1) })}><Minus className="w-2 h-2" /></Button>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={r.tahfizhEndPage ?? ""}
                              disabled={spreadsheetLayout.isEditing}
                              placeholder="Isi"
                              onChange={e => updateRow(idx, { tahfizhEndPage: e.target.value === "" ? null : clampPage("tahfizh", parseInt(e.target.value) || 1, r.tahfizhJuz) })}
                              className="h-6 w-9 text-center text-[10px] md:text-[10px] px-0.5 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-blue-100 dark:focus-visible:bg-blue-800/30 text-blue-700 font-medium"
                            />
                            <Button size="icon" variant="ghost" className="h-5 w-5 rounded-none p-0 hover:bg-muted text-blue-700" disabled={spreadsheetLayout.isEditing} onClick={() => updateRow(idx, { tahfizhEndPage: stepPage("tahfizh", r.tahfizhEndPage ?? 1, 1) })}><Plus className="w-2 h-2" /></Button>
                          </div>
                        </td>
                        <td {...layoutCellProps(r.studentId, "totalProgress")} className={`p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-[10px] text-blue-700 font-medium ${signedTahfizh < 0 ? "text-red-600 font-bold" : ""}`}>
                          {r.tahfizhEndPage !== null ? signedTahfizh : "-"}
                        </td>
                        <td {...layoutCellProps(r.studentId, "target")} className="p-0.5 border border-[1.5px] border-blue-400 dark:border-blue-700 text-center text-muted-foreground text-[10px]">
                          {targetForProgram("tahfizh")}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex-1">
            {totalPages > 1 && (
              <DataTablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
          <Button onClick={saveAll} disabled={savingAll} size="lg" className="gap-2">
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Semua
          </Button>
        </div>
      )}

      <FixedHorizontalScrollbar
        scrollContainerRef={tableScrollRef}
        contentRef={tableRef}
        refreshKey={`${zoom}-${page}-${currentPageRows.length}-${rows.length}-${spreadsheetLayout.tableMinWidth}`}
      />
    </div>
  );
};

export default SpreadsheetReport;
