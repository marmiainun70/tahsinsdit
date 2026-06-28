import { useState, useMemo, useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { useAllMonthlyReports, MONTH_NAMES } from "@/hooks/useMonthlyReports";
import {
  useAttendanceForRecapPeriod,
  useAttendanceForRecapPeriods,
  useAttendancePeriodSettingsByGroups,
  useAttendancePeriodSettingsByPeriods,
} from "@/hooks/useAttendance";
import { useProfileMap } from "@/hooks/useProfiles";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { removeBlockedNoteEmoticons } from "@/lib/noteValidation";
import { restoreApril2026Reports } from "@/lib/restoreApril2026";
import { FixedHorizontalScrollbar } from "@/components/reports/FixedHorizontalScrollbar";
import { SpreadsheetLayoutToolbar } from "@/components/reports/SpreadsheetLayoutToolbar";
import { ResizableTableHeader } from "@/components/reports/ResizableTableHeader";
import { useSpreadsheetLayout } from "@/hooks/useSpreadsheetLayout";
import {
  RECAP_REPORT_COLUMNS,
  RECAP_REPORT_SPREADSHEET_PAGE_KEY,
  type RecapReportColumnKey,
} from "@/config/recapReportColumns";
import {
  PROGRESS_CATEGORIES,
  buildRecapJoinedGroups,
  formatAttendanceCompact,
  formatProgressivePoint,
  formatRecapValue,
  type RecapAttendanceStatus,
  type RecapJoinedGroup,
  type RecapJoinedRow,
} from "@/utils/recapMonthlyReportRows";
import {
  Search, Loader2, Eye, Download,
  Users, ListChecks, AlertCircle, FileWarning, Calendar,
  ClipboardList, Star, Filter, RotateCcw, FileText, ShieldCheck
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2024, 2025, 2026, 2027, 2028];
type PdfPaperSize = "a4" | "legal" | "f4";

interface PdfRowData {
  no: number;
  studentId: string;
  nama: string;
  program: string;
  level: string;
  periode: string;
  awal: string;
  akhir: string;
  total: string;
  target: string;
  absensi: string;
  persentaseHadir: string;
  statusAbsensi: string;
  kehadiranKesiapan: string;
  kualitasBacaan: string;
  perbaikanBacaan: string;
  pencapaianBulanan: string;
  kategoriProgres: string;
  nilai: string;
  reportStatus: string;
  guru: string;
  catatan: string;
}

interface PdfGroupData {
  kelas: number;
  rombel: string;
  rows: PdfRowData[];
}

interface ExportSettings {
  nama_lembaga?: string;
  alamat?: string;
  logo_url?: string;
  koordinator_nama?: string;
  koordinator_ttd_url?: string;
  kepsek_nama?: string;
  kepsek_ttd_url?: string;
}

interface RombelOption {
  key: string;
  kelas: number;
  rombel: string;
  label: string;
}

const cleanPdfText = (value: unknown) => {
  return removeBlockedNoteEmoticons(String(value ?? ""))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .split("\n")
    .map(line => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
};

const hasArabicText = (value: unknown) =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(String(value ?? ""));

const safeFilePart = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_");

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const loadAmiriFont = async (doc: jsPDF) => {
  try {
    const response = await fetch("/fonts/Amiri-Regular.ttf");
    if (!response.ok) return false;

    const fontBase64 = arrayBufferToBase64(await response.arrayBuffer());
    doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    return true;
  } catch {
    return false;
  }
};

const loadImageAsBase64 = (url: string): Promise<string | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const waitForUiFrame = () => new Promise(resolve => window.setTimeout(resolve, 0));

const getLastAutoTableFinalY = (doc: jsPDF, fallbackY: number) =>
  (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? fallbackY;

type FilterReportStatusType = "all" | "filled" | "empty";
type FilterAttendanceStatusType = "all" | RecapAttendanceStatus;
type FilterCategoryType = "all" | (typeof PROGRESS_CATEGORIES)[number];
type FilterScoreType = "all" | "good" | "medium" | "low" | "empty";

const getReportStatusClass = (status: "filled" | "empty") =>
  status === "filled"
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : "bg-amber-100 text-amber-800 border-amber-200";

const getAttendanceStatusClass = (status: RecapAttendanceStatus) => {
  if (status === "Lengkap") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Belum Diisi") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "Melebihi Hari Efektif") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
};

const scoreMatchesFilter = (score: number | null, filter: FilterScoreType) => {
  if (filter === "all") return true;
  if (filter === "empty") return score === null;
  if (score === null) return false;
  if (filter === "good") return score >= 85;
  if (filter === "medium") return score >= 70 && score < 85;
  return score < 70;
};

const RECAP_IDENTITY_COLUMNS = RECAP_REPORT_COLUMNS.filter((column) => column.group === "identity");
const RECAP_DETAIL_COLUMNS = RECAP_REPORT_COLUMNS.filter((column) => column.group !== "identity");

const getRecapHeaderClass = (group: "identity" | "monthlyProgress" | "attendance" | "progressiveAssessment" | "result") => {
  if (group === "monthlyProgress") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300/90";
  if (group === "attendance") return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-sky-300/90";
  if (group === "progressiveAssessment") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-300/90";
  if (group === "result") return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/50 dark:text-violet-300/90";
  return "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-300/90";
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan saat memproses layout.";

const RecapReport = () => {
  const { user, profile } = useAuth();
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: reports = [], isLoading: lr } = useAllMonthlyReports();
  const { data: settings } = useInstitutionSettings();
  const profileMap = useProfileMap();
  const queryClient = useQueryClient();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [filterReportStatus, setFilterReportStatus] = useState<FilterReportStatusType>("all");
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<FilterAttendanceStatusType>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategoryType>("all");
  const [filterScore, setFilterScore] = useState<FilterScoreType>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewSize, setPdfPreviewSize] = useState<PdfPaperSize>("a4");
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [selectedRombelKeys, setSelectedRombelKeys] = useState<string[]>([]);
  const [multiDownloadProgress, setMultiDownloadProgress] = useState("");
  const [aprilRestoreRunning, setAprilRestoreRunning] = useState(false);
  const [aprilRestoreDone, setAprilRestoreDone] = useState(false);
  const [multiMonthDialogOpen, setMultiMonthDialogOpen] = useState(false);
  const [dialogYear, setDialogYear] = useState<string>(String(now.getFullYear()));
  const [dialogMonths, setDialogMonths] = useState<number[]>([Number(now.getMonth() + 1)]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const recapLayout = useSpreadsheetLayout<RecapReportColumnKey>({
    userId: user?.id,
    role: profile?.role,
    pageKey: RECAP_REPORT_SPREADSHEET_PAGE_KEY,
    columns: RECAP_REPORT_COLUMNS,
  });
  const selectedMonth = Number(filterMonth);
  const selectedYear = Number(filterYear);

  // Filter siswa sesuai kelas/rombel/search
  const filteredStudents = useMemo(() => {
    let s = students;
    if (filterKelas !== "all") s = s.filter(st => st.kelas === Number(filterKelas));
    if (filterRombel !== "all") s = s.filter(st => st.rombel === filterRombel);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(st => st.nama.toLowerCase().includes(q));
    }
    return s.sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama));
  }, [students, filterKelas, filterRombel, search]);

  const availableRombels = useMemo<RombelOption[]>(() => {
    const map = new Map<string, RombelOption>();
    filteredStudents.forEach(student => {
      const key = `${student.kelas}-${student.rombel}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          kelas: student.kelas,
          rombel: student.rombel,
          label: `${student.kelas}${student.rombel}`,
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel)
    );
  }, [filteredStudents]);

  useEffect(() => {
    setSelectedRombelKeys(current => {
      const available = new Set(availableRombels.map(item => item.key));
      return current.filter(key => available.has(key));
    });
  }, [availableRombels]);

  const allRombelsSelected =
    availableRombels.length > 0 && selectedRombelKeys.length === availableRombels.length;

  const visibleGroupKeys = useMemo(
    () => availableRombels.map(({ kelas, rombel }) => ({ kelas, rombel })),
    [availableRombels],
  );
  const attendanceQuery = useAttendanceForRecapPeriod({
    month: selectedMonth,
    year: selectedYear,
    enabled: true,
  });
  const attendanceSettingsQuery = useAttendancePeriodSettingsByGroups({
    month: selectedMonth,
    year: selectedYear,
    groups: visibleGroupKeys,
    enabled: visibleGroupKeys.length > 0,
  });
  const multiAttendanceQuery = useAttendanceForRecapPeriods({
    months: dialogMonths,
    year: Number(dialogYear),
    enabled: dialogMonths.length > 0,
  });
  const multiAttendanceSettingsQuery = useAttendancePeriodSettingsByPeriods({
    months: dialogMonths,
    year: Number(dialogYear),
    groups: visibleGroupKeys,
    enabled: dialogMonths.length > 0 && visibleGroupKeys.length > 0,
  });

  const toggleRombel = (key: string) => {
    setSelectedRombelKeys(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key]
    );
  };

  const toggleAllRombels = () => {
    setSelectedRombelKeys(allRombelsSelected ? [] : availableRombels.map(item => item.key));
  };

  const groups = useMemo<RecapJoinedGroup[]>(() => {
    return buildRecapJoinedGroups({
      students: filteredStudents,
      month: selectedMonth,
      year: selectedYear,
      monthName: MONTH_NAMES[selectedMonth - 1],
      reports,
      attendance: attendanceQuery.data ?? [],
      attendanceSettings: attendanceSettingsQuery.data ?? [],
      getTeacherName: (userId) => (userId ? profileMap.get(userId) : undefined),
    });
  }, [
    attendanceQuery.data,
    attendanceSettingsQuery.data,
    filteredStudents,
    profileMap,
    reports,
    selectedMonth,
    selectedYear,
  ]);

  const displayGroups = useMemo(() => {
    return groups
      .map(g => {
        const filtered = g.rows.filter(r => {
          if (filterReportStatus === "filled" && r.reportStatus !== "filled") return false;
          if (filterReportStatus === "empty" && r.reportStatus !== "empty") return false;
          if (filterAttendanceStatus !== "all" && r.attendanceStatus !== filterAttendanceStatus) return false;
          if (filterCategory !== "all" && r.kategoriProgres !== filterCategory) return false;
          if (!scoreMatchesFilter(r.nilaiAkhirProgresif, filterScore)) return false;
          return true;
        }).map((r, i) => ({ ...r, no: i + 1 }));
        return { ...g, rows: filtered };
      })
      .filter(g => g.rows.length > 0);
  }, [filterAttendanceStatus, filterCategory, filterReportStatus, filterScore, groups]);

  const stats = useMemo(() => {
    const all = groups.flatMap(g => g.rows);
    const total = all.length;
    const filled = all.filter(r => r.reportStatus === "filled").length;
    const empty = total - filled;
    const attendanceComplete = all.filter(r => r.attendanceStatus === "Lengkap").length;
    const attendanceIncomplete = all.filter(r => r.attendanceStatus !== "Lengkap").length;
    const scoreRows = all.filter(r => r.nilaiAkhirProgresif !== null);
    const averageScore = scoreRows.length
      ? Math.round(scoreRows.reduce((sum, row) => sum + (row.nilaiAkhirProgresif ?? 0), 0) / scoreRows.length)
      : 0;
    const percentOfTotal = (value: number) => total ? `${Math.round((value / total) * 100)}%` : "0%";
    const scoreLabel = averageScore >= 85 ? "Sangat baik" : averageScore >= 70 ? "Baik" : averageScore > 0 ? "Perlu perhatian" : "Belum ada nilai";
    return {
      total,
      filled,
      empty,
      attendanceComplete,
      attendanceIncomplete,
      averageScore,
      filledPercent: percentOfTotal(filled),
      emptyPercent: percentOfTotal(empty),
      attendanceCompletePercent: percentOfTotal(attendanceComplete),
      attendanceIncompletePercent: percentOfTotal(attendanceIncomplete),
      scoreLabel,
    };
  }, [groups]);

  const resetFilters = () => {
    setFilterReportStatus("all");
    setFilterAttendanceStatus("all");
    setFilterCategory("all");
    setFilterScore("all");
    setFilterKelas("all");
    setFilterRombel("all");
    setSearch("");
    setShowAllGroups(false);
  };

  useEffect(() => {
    if (lr || ls) return;
    if (aprilRestoreDone || aprilRestoreRunning) return;
    if (filterMonth !== "4" || filterYear !== "2026") return;
    if (stats.empty <= 0) return;

    setAprilRestoreRunning(true);
    toast({ title: "Memulihkan data April 2026 dari backup PDF lama..." });
    restoreApril2026Reports()
      .then(async result => {
        await queryClient.invalidateQueries({ queryKey: ["monthly_reports"] });
        setAprilRestoreDone(true);
        toast({
          title: `${result.restored} data April 2026 sudah diisi ulang`,
          description: result.unmatched.length
            ? `${result.unmatched.length} nama belum cocok dan perlu dicek manual.`
            : "Data April diproses dari backup PDF lama.",
        });
      })
      .catch((error: unknown) => {
        toast({
          title: "Gagal memulihkan data April",
          description: error instanceof Error ? error.message : "Akun login mungkin tidak punya izin update/insert laporan.",
          variant: "destructive",
        });
      })
      .finally(() => setAprilRestoreRunning(false));
  }, [
    aprilRestoreDone,
    aprilRestoreRunning,
    filterMonth,
    filterYear,
    lr,
    ls,
    queryClient,
    stats.empty,
  ]);

  const cleanupPreviewUrl = useCallback(() => {
    setPdfPreviewUrl(current => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handlePreviewOpenChange = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) cleanupPreviewUrl();
  }, [cleanupPreviewUrl]);

  const toPdfRow = useCallback((row: RecapJoinedRow): PdfRowData => ({
    no: row.no,
    studentId: row.studentId,
    nama: row.nama,
    program: row.program,
    level: row.level,
    periode: row.periode,
    awal: row.awal,
    akhir: row.akhir,
    total: formatRecapValue(row.total),
    target: formatRecapValue(row.target),
    absensi: formatAttendanceCompact(row),
    persentaseHadir: row.hasAttendance ? `${row.persentaseHadir ?? 0}%` : "-",
    statusAbsensi: row.attendanceStatus,
    kehadiranKesiapan: formatProgressivePoint(row.poinKehadiranKesiapan),
    kualitasBacaan: formatProgressivePoint(row.poinKualitasBacaan),
    perbaikanBacaan: formatProgressivePoint(row.poinPerbaikanBacaan),
    pencapaianBulanan: formatRecapValue(row.pencapaianTargetBulan),
    kategoriProgres: row.kategoriProgres ?? "-",
    nilai: formatRecapValue(row.nilaiAkhirProgresif),
    reportStatus: row.reportStatus === "filled" ? "Sudah Diisi" : "Belum Diisi",
    guru: row.guru,
    catatan: row.catatan,
  }), []);

  const singleMonthPdfGroups = useMemo<PdfGroupData[]>(() => {
    return displayGroups.map(group => ({
      kelas: group.kelas,
      rombel: group.rombel,
      rows: group.rows.map(toPdfRow),
    }));
  }, [displayGroups, toPdfRow]);

  const activePdfGroups = singleMonthPdfGroups;
  const activePeriodLabel = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

  const isLayoutCellSelected = (studentId: string, columnKey: RecapReportColumnKey) => {
    const selection = recapLayout.selection;
    if (selection.type === "table") return true;
    if (selection.type === "column") return selection.columnKey === columnKey;
    if (selection.type === "row") return selection.studentId === studentId;
    return selection.studentId === studentId && selection.columnKey === columnKey;
  };

  const layoutCellProps = (studentId: string, columnKey: RecapReportColumnKey) => ({
    "data-layout-cell": `${studentId}:${columnKey}`,
    "data-layout-selected": recapLayout.isEditing && isLayoutCellSelected(studentId, columnKey) ? true : undefined,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      if (!recapLayout.isEditing) return;
      event.preventDefault();
      event.stopPropagation();
      recapLayout.setSelection({ type: "cell", studentId, columnKey });
    },
    style: recapLayout.getCellStyle(studentId, columnKey),
  });

  const startRowResize = (event: ReactPointerEvent<HTMLElement>, studentId: string) => {
    if (!recapLayout.isEditing) return;
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = recapLayout.getRowHeight(studentId);
    const handleMove = (moveEvent: PointerEvent) => {
      recapLayout.setRowHeight(studentId, startHeight + moveEvent.clientY - startY);
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
      if (scope === "global") await recapLayout.saveGlobal();
      else await recapLayout.savePersonal();
      toast({ title: "Layout rekap berhasil disimpan" });
    } catch (error: unknown) {
      toast({ title: "Gagal menyimpan layout rekap", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const resetLayout = async (scope: "global" | "personal") => {
    const label = scope === "global" ? "layout global rekap" : "layout pribadi rekap";
    if (!window.confirm(`Reset ${label}? Perubahan layout tersimpan akan dihapus.`)) return;
    try {
      if (scope === "global") await recapLayout.resetGlobal();
      else await recapLayout.resetPersonal();
      toast({ title: `${label} berhasil direset` });
    } catch (error: unknown) {
      toast({ title: `Gagal reset ${label}`, description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const restoreDefaultLayout = () => {
    if (!window.confirm("Kembalikan draft layout rekap ke default bawaan?")) return;
    recapLayout.resetDraftToDefault();
  };

  const toggleLayoutEdit = async () => {
    if (!recapLayout.isEditing) {
      recapLayout.setIsEditing(true);
      recapLayout.setSelection({ type: "table" });
      return;
    }

    if (!recapLayout.dirty) {
      recapLayout.setIsEditing(false);
      return;
    }

    if (window.confirm("Layout belum disimpan. Pilih OK untuk menyimpan sekarang, atau Cancel untuk pilihan lain.")) {
      await saveLayout(recapLayout.isAdmin ? "global" : "personal");
      recapLayout.setIsEditing(false);
      return;
    }

    if (window.confirm("Buang perubahan layout yang belum disimpan? Pilih Cancel untuk tetap di mode edit.")) {
      recapLayout.discardDraft();
      recapLayout.setIsEditing(false);
    }
  };

  const applyFont = (font: typeof recapLayout.layout.tableFont) => recapLayout.applyStyleToSelection({ fontFamily: font });
  const applyFontSize = (fontSize: number) => recapLayout.applyStyleToSelection({ fontSize });
  const applyBold = () => recapLayout.applyStyleToSelection({ bold: true });
  const applyAlign = (align: "left" | "center" | "right") => recapLayout.applyStyleToSelection({ align });
  const applyWrap = () => recapLayout.applyStyleToSelection({ wrap: true });

  const buildRowsForRombelMonth = useCallback((rombel: RombelOption, month: number, year: string): PdfRowData[] => {
    const studentsInRombel = filteredStudents
      .filter(student => student.kelas === rombel.kelas && student.rombel === rombel.rombel)
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const monthGroups = buildRecapJoinedGroups({
      students: studentsInRombel,
      month,
      year: Number(year),
      monthName: MONTH_NAMES[month - 1],
      reports,
      attendance: multiAttendanceQuery.data ?? [],
      attendanceSettings: multiAttendanceSettingsQuery.data ?? [],
      getTeacherName: (userId) => (userId ? profileMap.get(userId) : undefined),
    });

    return (monthGroups[0]?.rows ?? []).map(toPdfRow);
  }, [
    filteredStudents,
    multiAttendanceQuery.data,
    multiAttendanceSettingsQuery.data,
    profileMap,
    reports,
    toPdfRow,
  ]);

  const buildSelectedRombelPDF = useCallback(async (rombel: RombelOption, months: number[], year: string, paperSize: PdfPaperSize = "a4") => {
    const exportSettings = (settings || {}) as ExportSettings;
    const [logoB64, koordTtdB64, kepsekTtdB64] = await Promise.all([
      exportSettings.logo_url ? loadImageAsBase64(exportSettings.logo_url) : Promise.resolve(null),
      exportSettings.koordinator_ttd_url ? loadImageAsBase64(exportSettings.koordinator_ttd_url) : Promise.resolve(null),
      exportSettings.kepsek_ttd_url ? loadImageAsBase64(exportSettings.kepsek_ttd_url) : Promise.resolve(null),
    ]);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: paperSize === "f4" ? [330, 210] : "a4",
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const isF4 = paperSize === "f4";
    const hasAmiriFont = await loadAmiriFont(doc);

    const drawHeader = (month: number) => {
      const y = margin;
      if (logoB64) {
        try {
          doc.addImage(logoB64, "PNG", margin, y, 16, 16);
        } catch {
          // Ignore logo rendering failures; the PDF should still be generated.
        }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(22, 101, 52);
      doc.text((exportSettings.nama_lembaga || "Lembaga").toUpperCase(), pageW / 2, y + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      if (exportSettings.alamat) doc.text(exportSettings.alamat, pageW / 2, y + 10, { align: "center" });
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 18, pageW - margin, y + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(`REKAP TAHSIN KELAS ${rombel.label}`, pageW / 2, y + 23, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Periode: ${MONTH_NAMES[month - 1]} ${year}`, pageW / 2, y + 28, { align: "center" });
    };

    const drawSignature = (cursorY: number) => {
      const signatureHeight = 40;
      let sigY = cursorY + 6;
      if (sigY + signatureHeight > pageH - 14) {
        doc.addPage();
        sigY = margin + 10;
      }
      const colW = (pageW - margin * 2) / 2;
      const drawOne = (xCenter: number, label: string, nama: string, signature: string | null) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40);
        doc.text(label, xCenter, sigY, { align: "center" });
        if (signature) {
          try {
            doc.addImage(signature, "PNG", xCenter - 16, sigY + 2, 32, 14);
          } catch {
            // Ignore signature image failures; text signature placeholders remain.
          }
        }
        doc.setLineWidth(0.2);
        doc.setDrawColor(120);
        doc.line(xCenter - 28, sigY + 18, xCenter + 28, sigY + 18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(nama || "(.....................)", xCenter, sigY + 23, { align: "center" });
      };
      drawOne(margin + colW / 2, "Koordinator Tahfizh,", exportSettings.koordinator_nama || "", koordTtdB64);
      drawOne(margin + colW + colW / 2, "Mengetahui, Kepala Sekolah,", exportSettings.kepsek_nama || "", kepsekTtdB64);
    };

    months.forEach((month, monthIndex) => {
      if (monthIndex > 0) doc.addPage();
      drawHeader(month);

      const rows = buildRowsForRombelMonth(rombel, month, year);
      const hasReportData = rows.some(row => row.reportStatus === "Sudah Diisi" || row.absensi !== "-");

      const cursorY = margin + 34;
      if (!hasReportData) {
        doc.setFillColor(255, 247, 237);
        doc.rect(margin, cursorY, pageW - margin * 2, 18, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(154, 52, 18);
        doc.text("Belum ada data rekap untuk bulan ini.", margin + 3, cursorY + 11);
        drawSignature(cursorY + 20);
        return;
      }

      const headers = [
        "No", "Nama", "Program", "Level", "Awal", "Akhir", "Total", "Target",
        "Absensi H/S/I/A", "% Hadir", "Status Absensi", "Kehadiran & Kesiapan Belajar",
        "Kualitas Bacaan Harian", "Perbaikan Bacaan Harian", "Pencapaian Bulanan",
        "Kategori Progres", "Nilai", "Guru"
      ];
      if (!isF4) headers.push("Catatan");

      autoTable(doc, {
        startY: cursorY,
        head: [headers],
        body: rows.map(row => {
          const rowData = [
            String(row.no), cleanPdfText(row.nama), cleanPdfText(row.program),
            cleanPdfText(row.level), cleanPdfText(row.awal), cleanPdfText(row.akhir),
            row.total, row.target, row.absensi, row.persentaseHadir, row.statusAbsensi,
            row.kehadiranKesiapan, row.kualitasBacaan, row.perbaikanBacaan,
            row.pencapaianBulanan, cleanPdfText(row.kategoriProgres), row.nilai,
            cleanPdfText(row.guru)
          ];
          if (!isF4) rowData.push(cleanPdfText(row.catatan || "-"));
          return rowData;
        }),
        styles: {
          font: "helvetica",
          fontStyle: "normal",
          fontSize: isF4 ? 7 : 5.6,
          cellPadding: isF4 ? 1.2 : 0.9,
          overflow: "linebreak",
          valign: "top",
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: [34, 87, 122],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: isF4 ? 6.5 : 5.4,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: isF4 ? {
          0: { cellWidth: 10, halign: "center" },
          6: { cellWidth: 11, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 11, halign: "center" },
          8: { cellWidth: 26, halign: "center" },
          9: { cellWidth: 12, halign: "center" },
          10: { cellWidth: 25, halign: "center" },
          11: { cellWidth: 18, halign: "center" },
          12: { cellWidth: 18, halign: "center" },
          13: { cellWidth: 18, halign: "center" },
          14: { cellWidth: 18, halign: "center" },
          16: { cellWidth: 11, halign: "center" },
        } : {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 28 },
          2: { cellWidth: 18 },
          3: { cellWidth: 16 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 9, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 9, halign: "center" },
          8: { cellWidth: 23, halign: "center" },
          9: { cellWidth: 10, halign: "center" },
          10: { cellWidth: 22, halign: "center" },
          11: { cellWidth: 15, halign: "center" },
          12: { cellWidth: 15, halign: "center" },
          13: { cellWidth: 15, halign: "center" },
          14: { cellWidth: 15, halign: "center" },
          15: { cellWidth: 24 },
          16: { cellWidth: 9, halign: "center" },
          17: { cellWidth: 17 },
          18: { cellWidth: "auto", overflow: "linebreak", valign: "top" },
        },
        didParseCell: data => {
          if (!isF4 && data.section === "body" && data.column.index === 18) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.valign = "top";
            data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            data.cell.styles.fontStyle = "normal";
          }
          if (data.section === "body" && data.column.index === 10) {
            const value = String(data.cell.raw);
            if (value === "Lengkap") data.cell.styles.textColor = [16, 124, 65];
            else if (value === "Melebihi Hari Efektif") data.cell.styles.textColor = [185, 28, 28];
            else if (value === "Belum Diisi" || value === "Belum Lengkap" || value === "Hari Efektif Belum Diatur") {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        },
        margin: { left: margin, right: margin, bottom: 22 },
      });

      if (isF4) {
        doc.addPage();
        drawHeader(month);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(27, 94, 32);
        doc.text("Catatan Rombel", margin, margin + 34);

        autoTable(doc, {
          startY: margin + 40,
          head: [["No", "Nama Siswa", "Kelas/Rombel", "Catatan"]],
          body: rows.map(row => [
            String(row.no),
            cleanPdfText(row.nama),
            "Kelas " + rombel.kelas + " " + rombel.rombel,
            cleanPdfText(row.catatan || "-")
          ]),
          styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5, overflow: "linebreak" },
          headStyles: { fillColor: [34, 87, 122], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: "auto" }
          },
          didParseCell: data => {
            if (data.section === "body" && data.column.index === 3) {
              data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            }
          },
          margin: { left: margin, right: margin, bottom: 22 },
        });
      }

      drawSignature(getLastAutoTableFinalY(doc, cursorY) + 2);
    });

    const totalPages = doc.getNumberOfPages();
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`Dicetak: ${today}`, margin, pageH - 6);
      doc.text(`Halaman ${page} dari ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
    }

    return doc;
  }, [buildRowsForRombelMonth, settings]);

  const downloadSelectedRombelPDFs = useCallback(async (paperSize: PdfPaperSize = "a4") => {
    if (dialogMonths.length === 0) {
      toast({ title: "Pilih minimal satu bulan terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (selectedRombelKeys.length === 0) {
      toast({ title: "Pilih minimal satu rombel terlebih dahulu.", variant: "destructive" });
      return;
    }

    const selectedRombels = availableRombels.filter(item => selectedRombelKeys.includes(item.key));
    const monthFilePart = dialogMonths.map(month => MONTH_NAMES[month - 1]).join("-");
    setPdfLoading("multi-rombel");

    try {
      for (let index = 0; index < selectedRombels.length; index += 1) {
        const rombel = selectedRombels[index];
        setMultiDownloadProgress(`Menyiapkan PDF ${index + 1} dari ${selectedRombels.length}...`);
        await waitForUiFrame();
        const doc = await buildSelectedRombelPDF(rombel, dialogMonths, dialogYear, paperSize);
        const suffix = paperSize === "f4" ? "_F4" : "";
        doc.save(`Rekap_Tahsin_${safeFilePart(rombel.label)}_${safeFilePart(monthFilePart)}_${dialogYear}${suffix}.pdf`);
      }
      toast({ title: `${selectedRombels.length} file PDF rekap multi bulan berhasil diunduh.` });
    } catch (error) {
      console.error(error);
      toast({
        title: "Gagal mengunduh PDF rekap terpilih",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPdfLoading(null);
      setMultiDownloadProgress("");
    }
  }, [availableRombels, buildSelectedRombelPDF, dialogMonths, dialogYear, selectedRombelKeys]);

  const buildRecapPDF = useCallback(async (paperSize: PdfPaperSize = "a4") => {
    if (activePdfGroups.length === 0) {
      throw new Error("Tidak ada data untuk dicetak");
    }

    const exportSettings = (settings || {}) as ExportSettings;
    const [logoB64, koordTtdB64, kepsekTtdB64] = await Promise.all([
      exportSettings.logo_url ? loadImageAsBase64(exportSettings.logo_url) : Promise.resolve(null),
      exportSettings.koordinator_ttd_url ? loadImageAsBase64(exportSettings.koordinator_ttd_url) : Promise.resolve(null),
      exportSettings.kepsek_ttd_url ? loadImageAsBase64(exportSettings.kepsek_ttd_url) : Promise.resolve(null),
    ]);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: paperSize === "f4" ? [330, 210] : paperSize,
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const isLegal = paperSize === "legal";
    const isF4 = paperSize === "f4";
    const hasAmiriFont = await loadAmiriFont(doc);

    const drawHeader = () => {
      const y = margin;
      if (logoB64) {
        try {
          doc.addImage(logoB64, "PNG", margin, y, 16, 16);
        } catch {
          // Ignore logo rendering failures; the PDF should still be generated.
        }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(22, 101, 52);
      doc.text((exportSettings.nama_lembaga || "Lembaga").toUpperCase(), pageW / 2, y + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      if (exportSettings.alamat) doc.text(exportSettings.alamat, pageW / 2, y + 10, { align: "center" });
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 18, pageW - margin, y + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text("REKAP LAPORAN BULANAN TAHSIN & TAHFIZH", pageW / 2, y + 23, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Periode: ${activePeriodLabel}`, pageW / 2, y + 28, { align: "center" });
    };

    drawHeader();
    let cursorY = margin + 32;

    activePdfGroups.forEach(group => {
      if (cursorY > pageH - 60) {
        doc.addPage();
        drawHeader();
        cursorY = margin + 32;
      }

      doc.setFillColor(232, 245, 233);
      doc.rect(margin, cursorY, pageW - 2 * margin, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(27, 94, 32);
      doc.text(`Kelas ${group.kelas} - Rombel ${group.rombel}  (${group.rows.length} siswa)`, margin + 2, cursorY + 4.2);
      cursorY += 7;

      const headers = [
        "No", "Nama", "Program", "Level", "Awal", "Akhir", "Total", "Target",
        "Absensi H/S/I/A", "% Hadir", "Status Absensi", "Kehadiran & Kesiapan Belajar",
        "Kualitas Bacaan Harian", "Perbaikan Bacaan Harian", "Pencapaian Bulanan",
        "Kategori Progres", "Nilai", "Guru"
      ];
      if (!isF4) headers.push("Catatan");

      autoTable(doc, {
        startY: cursorY,
        head: [headers],
        body: group.rows.map(row => {
          const rowData = [
            String(row.no), cleanPdfText(row.nama), cleanPdfText(row.program),
            cleanPdfText(row.level), cleanPdfText(row.awal), cleanPdfText(row.akhir),
            row.total, row.target, row.absensi, row.persentaseHadir, row.statusAbsensi,
            row.kehadiranKesiapan, row.kualitasBacaan, row.perbaikanBacaan,
            row.pencapaianBulanan, cleanPdfText(row.kategoriProgres), row.nilai,
            cleanPdfText(row.guru)
          ];
          if (!isF4) rowData.push(cleanPdfText(row.catatan || "-"));
          return rowData;
        }),
        styles: {
          font: "helvetica",
          fontStyle: "normal",
          fontSize: isF4 ? 7.2 : (isLegal ? 6.2 : 5.4),
          cellPadding: isF4 ? 1.2 : (isLegal ? 1.1 : 0.8),
          overflow: "linebreak",
          valign: "top",
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: [34, 87, 122],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: isF4 ? 6.8 : (isLegal ? 6 : 5.4),
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: isF4 ? {
          0: { cellWidth: 10, halign: "center" },
          6: { cellWidth: 11, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 11, halign: "center" },
          8: { cellWidth: 26, halign: "center" },
          9: { cellWidth: 12, halign: "center" },
          10: { cellWidth: 25, halign: "center" },
          11: { cellWidth: 18, halign: "center" },
          12: { cellWidth: 18, halign: "center" },
          13: { cellWidth: 18, halign: "center" },
          14: { cellWidth: 18, halign: "center" },
          16: { cellWidth: 11, halign: "center" },
        } : {
          0: { cellWidth: isLegal ? 9 : 8, halign: "center" },
          1: { cellWidth: isLegal ? 32 : 28 },
          2: { cellWidth: isLegal ? 20 : 18 },
          3: { cellWidth: isLegal ? 18 : 16 },
          4: { cellWidth: isLegal ? 17 : 15 },
          5: { cellWidth: isLegal ? 17 : 15 },
          6: { cellWidth: isLegal ? 10 : 9, halign: "center", fontStyle: "bold" },
          7: { cellWidth: isLegal ? 10 : 9, halign: "center" },
          8: { cellWidth: isLegal ? 26 : 23, halign: "center" },
          9: { cellWidth: isLegal ? 11 : 10, halign: "center" },
          10: { cellWidth: isLegal ? 25 : 22, halign: "center", fontStyle: "bold" },
          11: { cellWidth: isLegal ? 17 : 15, halign: "center" },
          12: { cellWidth: isLegal ? 17 : 15, halign: "center" },
          13: { cellWidth: isLegal ? 17 : 15, halign: "center" },
          14: { cellWidth: isLegal ? 17 : 15, halign: "center" },
          15: { cellWidth: isLegal ? 28 : 24 },
          16: { cellWidth: isLegal ? 10 : 9, halign: "center" },
          17: { cellWidth: isLegal ? 20 : 17 },
          18: { cellWidth: "auto", overflow: "linebreak", valign: "top" },
        },
        didParseCell: data => {
          if (!isF4 && data.section === "body" && data.column.index === 18) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.valign = "top";
            data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            data.cell.styles.fontStyle = "normal";
          }
          if (data.section === "body" && data.column.index === 10) {
            const value = String(data.cell.raw);
            if (value === "Lengkap") data.cell.styles.textColor = [16, 124, 65];
            else if (value === "Melebihi Hari Efektif") data.cell.styles.textColor = [185, 28, 28];
            else if (value === "Belum Diisi" || value === "Belum Lengkap" || value === "Hari Efektif Belum Diatur") {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        },
        margin: { left: margin, right: margin, bottom: 22 },
      });

      if (isF4) {
        doc.addPage();
        drawHeader();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(27, 94, 32);
        doc.text("Catatan Rombel - Kelas " + group.kelas + " - Rombel " + group.rombel, margin, margin + 34);

        autoTable(doc, {
          startY: margin + 40,
          head: [["No", "Nama Siswa", "Kelas/Rombel", "Catatan"]],
          body: group.rows.map(row => [
            String(row.no),
            cleanPdfText(row.nama),
            "Kelas " + group.kelas + " " + group.rombel,
            cleanPdfText(row.catatan || "-")
          ]),
          styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5, overflow: "linebreak" },
          headStyles: { fillColor: [34, 87, 122], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: "auto" }
          },
          didParseCell: data => {
            if (data.section === "body" && data.column.index === 3) {
              data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            }
          },
          margin: { left: margin, right: margin, bottom: 22 },
        });
      }

      cursorY = getLastAutoTableFinalY(doc, cursorY) + 4;
    });

    const signatureHeight = 50;
    if (cursorY + signatureHeight > pageH - 14) {
      doc.addPage();
      drawHeader();
      cursorY = margin + 34;
    }

    const allRows = activePdfGroups.flatMap(group => group.rows);
    const filledRows = allRows.filter(row => row.reportStatus === "Sudah Diisi");
    const completeAttendanceRows = allRows.filter(row => row.statusAbsensi === "Lengkap");
    const totalPagesRead = filledRows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

    cursorY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text("RINGKASAN LAPORAN", margin, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60);
    [
      `Total Siswa: ${allRows.length}`,
      `Laporan Sudah Diisi: ${filledRows.length} siswa`,
      `Absensi Lengkap: ${completeAttendanceRows.length} siswa`,
      `Total Halaman Dibaca: ${totalPagesRead} hal.`,
    ].forEach(text => {
      doc.text(text, margin + 3, cursorY);
      cursorY += 4;
    });

    cursorY += 6;
    const colW = (pageW - margin * 2) / 2;
    const sigY = cursorY;

    const drawSignature = (xCenter: number, label: string, nama: string, signature: string | null) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(40);
      doc.text(label, xCenter, sigY, { align: "center" });
      if (signature) {
        try {
          doc.addImage(signature, "PNG", xCenter - 16, sigY + 2, 32, 14);
        } catch {
          // Ignore signature image failures; text signature placeholders remain.
        }
      }
      doc.setLineWidth(0.2);
      doc.setDrawColor(120);
      doc.line(xCenter - 28, sigY + 18, xCenter + 28, sigY + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(nama || "(.....................)", xCenter, sigY + 23, { align: "center" });
    };

    drawSignature(margin + colW / 2, "Koordinator Tahfizh,", exportSettings.koordinator_nama || "", koordTtdB64);
    drawSignature(margin + colW + colW / 2, "Mengetahui, Kepala Sekolah,", exportSettings.kepsek_nama || "", kepsekTtdB64);

    const totalPages = doc.getNumberOfPages();
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`Dicetak: ${today}`, margin, pageH - 6);
      doc.text(`Halaman ${page} dari ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
    }

    return doc;
  }, [activePdfGroups, activePeriodLabel, settings]);

  const getPdfFileName = useCallback((paperSize: PdfPaperSize) => {
    return `Rekap_Laporan_${activePeriodLabel.replace(/\s+/g, "_")}_${paperSize.toUpperCase()}.pdf`;
  }, [activePeriodLabel]);

  const exportPDF = useCallback(async (paperSize: PdfPaperSize) => {
    if (activePdfGroups.length === 0) {
      toast({ title: "Tidak ada data untuk dicetak", variant: "destructive" });
      return;
    }

    const label = `download-${paperSize}`;
    setPdfLoading(label);
    try {
      await waitForUiFrame();
      const doc = await buildRecapPDF(paperSize);
      doc.save(getPdfFileName(paperSize));
      toast({ title: `PDF ${paperSize.toUpperCase()} berhasil diunduh` });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error mengekspor PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPdfLoading(null);
    }
  }, [activePdfGroups.length, buildRecapPDF, getPdfFileName]);

  const previewPDF = useCallback(async (paperSize: PdfPaperSize) => {
    if (activePdfGroups.length === 0) {
      toast({ title: "Tidak ada data untuk dipreview", variant: "destructive" });
      return;
    }

    const label = `preview-${paperSize}`;
    setPdfLoading(label);
    try {
      await waitForUiFrame();
      const doc = await buildRecapPDF(paperSize);
      const blob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      cleanupPreviewUrl();
      setPdfPreviewUrl(url);
      setPdfPreviewSize(paperSize);
      setPreviewOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error membuat preview PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPdfLoading(null);
    }
  }, [activePdfGroups.length, buildRecapPDF, cleanupPreviewUrl]);

  if (ls || lr || attendanceQuery.isLoading || attendanceSettingsQuery.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 spreadsheet-report-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Rekap Laporan Bulanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Tahsin Dasar, Tahsin Lanjutan & Tahfizh - siap export PDF & Excel
          </p>
        </div>
      </div>

      {/* Single Month Mode */}
          {/* Filters */}
          <Card className="border-emerald-100 bg-white/90 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <CardContent className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4 xl:grid-cols-12">
              <div className="col-span-2">
                <Label className="text-xs">Cari Siswa</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-7"
                    placeholder="Nama siswa..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Kelas</Label>
                <Select value={filterKelas} onValueChange={setFilterKelas}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(k => (
                      <SelectItem key={k} value={String(k)}>
                        Kelas {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tahun</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rombel</Label>
                <Select value={filterRombel} onValueChange={setFilterRombel}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {["A", "B", "C", "D"].map(r => (
                      <SelectItem key={r} value={r}>
                        Rombel {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Bulan</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status laporan</Label>
                <Select
                  value={filterReportStatus}
                  onValueChange={(v) => setFilterReportStatus(v as FilterReportStatusType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="filled">Sudah Diisi</SelectItem>
                    <SelectItem value="empty">Belum Diisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status absensi</Label>
                <Select
                  value={filterAttendanceStatus}
                  onValueChange={(v) => setFilterAttendanceStatus(v as FilterAttendanceStatusType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="Lengkap">Lengkap</SelectItem>
                    <SelectItem value="Belum Lengkap">Belum Lengkap</SelectItem>
                    <SelectItem value="Belum Diisi">Belum Diisi</SelectItem>
                    <SelectItem value="Melebihi Hari Efektif">Melebihi Hari Efektif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Kategori progres</Label>
                <Select
                  value={filterCategory}
                  onValueChange={(v) => setFilterCategory(v as FilterCategoryType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {PROGRESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nilai</Label>
                <Select
                  value={filterScore}
                  onValueChange={(v) => setFilterScore(v as FilterScoreType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="good">85 ke atas</SelectItem>
                    <SelectItem value="medium">70 - 84</SelectItem>
                    <SelectItem value="low">Di bawah 70</SelectItem>
                    <SelectItem value="empty">Belum ada nilai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <Button
                  className="h-9 flex-1 gap-2 bg-emerald-700 text-xs hover:bg-emerald-800"
                  onClick={() => toast({ title: "Filter rekap sudah diterapkan." })}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Terapkan Filter
                </Button>
                <Button
                  variant="outline"
                  className="h-9 flex-1 gap-2 text-xs"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total Siswa"
              value={stats.total}
              color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
              onClick={() => {
                setFilterReportStatus("all");
                setFilterAttendanceStatus("all");
                setFilterCategory("all");
                setFilterScore("all");
              }}
              isActive={filterReportStatus === "all" && filterAttendanceStatus === "all" && filterCategory === "all" && filterScore === "all"}
              activeColor="border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
              subtitle="Semua siswa"
            />
            <StatCard
              icon={<ListChecks className="w-4 h-4" />}
              label="Laporan Sudah Diisi"
              value={stats.filled}
              color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              onClick={() => setFilterReportStatus("filled")}
              isActive={filterReportStatus === "filled"}
              activeColor="border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20"
              subtitle={stats.filledPercent}
            />
            <StatCard
              icon={<FileWarning className="w-4 h-4" />}
              label="Laporan Belum Diisi"
              value={stats.empty}
              color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              onClick={() => setFilterReportStatus("empty")}
              isActive={filterReportStatus === "empty"}
              activeColor="border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20"
              subtitle={stats.emptyPercent}
            />
            <StatCard
              icon={<ShieldCheck className="w-4 h-4" />}
              label="Absensi Lengkap"
              value={stats.attendanceComplete}
              color="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
              onClick={() => setFilterAttendanceStatus("Lengkap")}
              isActive={filterAttendanceStatus === "Lengkap"}
              activeColor="border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/30 dark:bg-violet-950/20"
              subtitle={stats.attendanceCompletePercent}
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4" />}
              label="Absensi Belum Lengkap/Belum Diisi"
              value={stats.attendanceIncomplete}
              color="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              onClick={() => setFilterAttendanceStatus("Belum Lengkap")}
              isActive={filterAttendanceStatus === "Belum Lengkap"}
              activeColor="border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20"
              subtitle={stats.attendanceIncompletePercent}
            />
            <StatCard
              icon={<Star className="w-4 h-4" />}
              label="Rata-rata Nilai Progresif"
              value={stats.averageScore}
              color="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
              subtitle={stats.scoreLabel}
            />
          </div>

          {/* Active Filter Cues */}
          {(filterReportStatus !== "all" || filterAttendanceStatus !== "all" || filterCategory !== "all" || filterScore !== "all" || search.trim() || filterKelas !== "all" || filterRombel !== "all") && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-muted/40 border border-border rounded-lg text-xs transition-all duration-200">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                Filter Aktif:
              </span>
              {filterReportStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Status laporan: {filterReportStatus === "filled" ? "Sudah Diisi" : "Belum Diisi"}
                  <button onClick={() => setFilterReportStatus("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {filterAttendanceStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Status absensi: {filterAttendanceStatus}
                  <button onClick={() => setFilterAttendanceStatus("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {filterCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Kategori: {filterCategory}
                  <button onClick={() => setFilterCategory("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {filterScore !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Nilai: {
                    filterScore === "good" ? ">= 85" :
                    filterScore === "medium" ? "70 - 84" :
                    filterScore === "low" ? "< 70" : "Belum ada nilai"
                  }
                  <button onClick={() => setFilterScore("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {filterKelas !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Kelas {filterKelas}
                  <button onClick={() => setFilterKelas("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {filterRombel !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Rombel {filterRombel}
                  <button onClick={() => setFilterRombel("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              {search.trim() && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Cari: "{search}"
                  <button onClick={() => setSearch("")} className="hover:text-foreground text-muted-foreground font-bold ml-1">x</button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 ml-auto"
                onClick={resetFilters}
              >
                Reset Semua Filter
              </Button>
            </div>
          )}

          {stats.empty > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Masih ada <strong>{stats.empty} siswa</strong> yang belum diisi laporannya untuk periode ini.
              </span>
            </div>
          )}

          <Card className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
            <CardHeader className="flex flex-col gap-3 border-b border-emerald-100 bg-white/80 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/20 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-emerald-700" />
                Data Rekap Laporan Bulanan
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading || activePdfGroups.length === 0}
                  onClick={() => previewPDF("a4")}
                >
                  {pdfLoading === "preview-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Preview PDF (A4)
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading || activePdfGroups.length === 0}
                  onClick={() => exportPDF("a4")}
                >
                  {pdfLoading === "download-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Download PDF (A4)
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-emerald-200 bg-emerald-50/70 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 sm:text-sm"
                  disabled={!!pdfLoading || activePdfGroups.length === 0}
                  onClick={() => previewPDF("f4")}
                >
                  {pdfLoading === "preview-f4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Preview PDF (F4)
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-emerald-200 bg-emerald-50/70 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 sm:text-sm"
                  disabled={!!pdfLoading || activePdfGroups.length === 0}
                  onClick={() => exportPDF("f4")}
                >
                  {pdfLoading === "download-f4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Download/Cetak PDF (F4)
                </Button>
                <Button
                  className="gap-2 bg-emerald-700 text-xs hover:bg-emerald-800 sm:text-sm"
                  disabled={!!pdfLoading || activePdfGroups.length === 0}
                  onClick={() => setMultiMonthDialogOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  Download Per Rombel (Multi Bulan)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="hidden p-3 md:block">
              <SpreadsheetLayoutToolbar
                isEditing={recapLayout.isEditing}
                canEdit={recapLayout.canEdit}
                isAdmin={recapLayout.isAdmin}
                isTeacher={recapLayout.isTeacher}
                dirty={recapLayout.dirty}
                statusText={recapLayout.statusText}
                tableFont={recapLayout.layout.tableFont}
                tableFontSize={recapLayout.layout.tableFontSize}
                defaultRowHeight={recapLayout.layout.defaultRowHeight}
                selection={recapLayout.selection}
                onToggleEdit={toggleLayoutEdit}
                onSaveGlobal={() => saveLayout("global")}
                onSavePersonal={() => saveLayout("personal")}
                onResetGlobal={() => resetLayout("global")}
                onResetPersonal={() => resetLayout("personal")}
                onUseGlobal={() => resetLayout("personal")}
                onRestoreDefault={restoreDefaultLayout}
                onResetSelection={recapLayout.resetSelection}
                onApplyFont={applyFont}
                onApplyFontSize={applyFontSize}
                onApplyBold={applyBold}
                onApplyAlign={applyAlign}
                onApplyWrap={applyWrap}
                onDefaultRowHeightChange={recapLayout.setDefaultRowHeight}
                isSaving={recapLayout.isSaving}
              />
            </CardContent>
          </Card>

          {/* Tables grouped per rombel */}
          {displayGroups.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Tidak ada siswa pada filter ini.
              </CardContent>
            </Card>
          )}
          {displayGroups.length > 0 && (
            <div
              ref={tableScrollRef}
              className="spreadsheet-table-scroll"
              onClick={(event) => {
                if (!recapLayout.isEditing || event.target !== event.currentTarget) return;
                recapLayout.setSelection({ type: "table" });
              }}
            >
              <div ref={tableContentRef} className="space-y-6" style={{ minWidth: recapLayout.tableMinWidth }}>
                {(showAllGroups ? displayGroups : displayGroups.slice(0, 4)).map(grp => (
                  <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden border-emerald-100 shadow-sm dark:border-emerald-900/60">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/70 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <CardTitle className="text-sm text-emerald-900 dark:text-emerald-300">
                  Kelas {grp.kelas} - Rombel {grp.rombel}{" "}
                  <Badge variant="outline" className="ml-2 bg-white dark:bg-background">
                    {grp.rows.length} siswa
                  </Badge>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-white dark:bg-background text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                  >
                    {grp.rows.filter(r => r.reportStatus === "empty").length} laporan belum diisi
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:block">
                  <table
                    className={`w-full border-collapse ${recapLayout.isEditing ? "spreadsheet-layout-editing" : ""}`}
                    style={{
                      minWidth: recapLayout.tableMinWidth,
                      fontFamily: `"${recapLayout.layout.tableFont}", system-ui, sans-serif`,
                      fontSize: `${recapLayout.layout.tableFontSize}px`,
                    }}
                    onClick={(event) => {
                      if (!recapLayout.isEditing || event.target !== event.currentTarget) return;
                      recapLayout.setSelection({ type: "table" });
                    }}
                  >
                    <colgroup>
                      {RECAP_REPORT_COLUMNS.map((column) => {
                        const width = recapLayout.getColumnWidth(column.key);
                        return <col key={column.key} style={{ width, minWidth: width, maxWidth: width }} />;
                      })}
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="text-center text-[11px] font-bold uppercase tracking-normal">
                        {RECAP_IDENTITY_COLUMNS.map((column) => {
                          const width = recapLayout.getColumnWidth(column.key);
                          const selected = recapLayout.isEditing && (
                            recapLayout.selection.type === "table"
                            || (recapLayout.selection.type === "column" && recapLayout.selection.columnKey === column.key)
                          );
                          return (
                            <ResizableTableHeader
                              key={column.key}
                              column={column}
                              width={width}
                              rowSpan={2}
                              isEditing={recapLayout.isEditing}
                              selected={selected}
                              className={`${getRecapHeaderClass(column.group)} ${column.key === "studentName" ? "text-left" : ""}`}
                              style={{
                                fontSize: recapLayout.layout.headerFontSize,
                                ...recapLayout.getColumnStyle(column.key),
                              }}
                              onSelect={() => recapLayout.setSelection({ type: "column", columnKey: column.key })}
                              onResize={(nextWidth) => recapLayout.setColumnWidth(column.key, nextWidth)}
                              onResetWidth={() => recapLayout.resetColumnWidth(column.key)}
                            />
                          );
                        })}
                        <th colSpan={4} className="border border-emerald-200 bg-emerald-50 px-2 py-3 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300/90 tracking-wider text-center" style={{ fontSize: recapLayout.layout.headerFontSize }}>PROGRES BULANAN</th>
                        <th colSpan={7} className="border border-sky-200 bg-sky-50 px-2 py-3 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-sky-300/90 tracking-wider text-center" style={{ fontSize: recapLayout.layout.headerFontSize }}>ABSENSI BULANAN</th>
                        <th colSpan={5} className="border border-amber-200 bg-amber-50 px-2 py-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-300/90 tracking-wider text-center" style={{ fontSize: recapLayout.layout.headerFontSize }}>PENILAIAN PROGRESIF</th>
                        <th className="border-y border-l border-violet-200 bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/50"></th>
                        <th className="border-y border-violet-200 bg-violet-50 px-2 py-3 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/50 dark:text-violet-300/90 tracking-wider text-center" style={{ fontSize: recapLayout.layout.headerFontSize }}>HASIL</th>
                        <th className="border-y border-r border-violet-200 bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/50"></th>
                      </tr>
                      <tr className="text-center text-[10px] font-semibold">
                        {RECAP_DETAIL_COLUMNS.map((column) => {
                          const width = recapLayout.getColumnWidth(column.key);
                          const selected = recapLayout.isEditing && (
                            recapLayout.selection.type === "table"
                            || (recapLayout.selection.type === "column" && recapLayout.selection.columnKey === column.key)
                          );
                          return (
                            <ResizableTableHeader
                              key={column.key}
                              column={column}
                              width={width}
                              top={42}
                              isEditing={recapLayout.isEditing}
                              selected={selected}
                              className={getRecapHeaderClass(column.group)}
                              style={{
                                fontSize: recapLayout.layout.headerFontSize,
                                ...recapLayout.getColumnStyle(column.key),
                              }}
                              onSelect={() => recapLayout.setSelection({ type: "column", columnKey: column.key })}
                              onResize={(nextWidth) => recapLayout.setColumnWidth(column.key, nextWidth)}
                              onResetWidth={() => recapLayout.resetColumnWidth(column.key)}
                            />
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {grp.rows.map(row => {
                        const reportEmpty = row.reportStatus === "empty";
                        return (
                          <tr
                            key={row.studentId}
                            className={`transition-colors ${
                              reportEmpty
                                ? "bg-rose-50/60 dark:bg-slate-900/40"
                                : "hover:bg-muted/40"
                            }`}
                            data-layout-selected={recapLayout.isEditing && (recapLayout.selection.type === "table" || (recapLayout.selection.type === "row" && recapLayout.selection.studentId === row.studentId)) ? true : undefined}
                            style={recapLayout.getRowStyle(row.studentId)}
                          >
                            <td
                              {...layoutCellProps(row.studentId, "number")}
                              onClick={(event) => {
                                if (!recapLayout.isEditing) return;
                                event.preventDefault();
                                event.stopPropagation();
                                recapLayout.setSelection({ type: "row", studentId: row.studentId });
                              }}
                              className={`relative border border-slate-200 dark:border-slate-800/60 dark:border-slate-800/60 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}
                            >
                              {row.no}
                              {recapLayout.isEditing && (
                                <span
                                  aria-hidden="true"
                                  className="absolute bottom-[-4px] left-0 z-20 h-2 w-full cursor-row-resize touch-none"
                                  onPointerDown={(event) => startRowResize(event, row.studentId)}
                                />
                              )}
                            </td>
                            <td
                              {...layoutCellProps(row.studentId, "studentName")}
                              className={`border border-slate-200 dark:border-slate-800/60 dark:border-slate-800/60 px-2 py-3 font-medium ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}
                            >
                              <div>{highlight(row.nama, search)}</div>
                              <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                                Kelas {grp.kelas} {grp.rombel}
                              </div>
                            </td>
                            <td {...layoutCellProps(row.studentId, "program")} className={`border border-slate-200 dark:border-slate-800/60 dark:border-slate-800/60 px-2 py-3 text-center leading-tight ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              {row.program === "Tahsin Dasar" || row.program?.includes("Tahsin Dasar") ? (
                                <>
                                  <span className="block">Tahsin Dasar</span>
                                  <span className="block text-[10px] opacity-80 mt-0.5">(Iqra)</span>
                                </>
                              ) : row.program}
                            </td>
                            <td {...layoutCellProps(row.studentId, "level")} className={`border border-slate-200 dark:border-slate-800/60 dark:border-slate-800/60 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              <Badge
                                className={`text-[10px] ${
                                  LEVEL_COLORS[row.level as ReadingLevel] || ""
                                }`}
                              >
                                {row.level}
                              </Badge>
                            </td>
                            <td {...layoutCellProps(row.studentId, "start")} className={`border border-emerald-100 dark:border-emerald-900/40 dark:border-emerald-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{row.awal}</td>
                            <td {...layoutCellProps(row.studentId, "end")} className={`border border-emerald-100 dark:border-emerald-900/40 dark:border-emerald-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{row.akhir}</td>
                            <td {...layoutCellProps(row.studentId, "totalProgress")} className={`border border-emerald-100 dark:border-emerald-900/40 dark:border-emerald-900/40 px-2 py-3 text-center font-bold ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              {formatRecapValue(row.total)}
                            </td>
                            <td {...layoutCellProps(row.studentId, "target")} className={`border border-emerald-100 dark:border-emerald-900/40 dark:border-emerald-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              {formatRecapValue(row.target)}
                            </td>
                            <td {...layoutCellProps(row.studentId, "present")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.present)}</td>
                            <td {...layoutCellProps(row.studentId, "sick")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.sick)}</td>
                            <td {...layoutCellProps(row.studentId, "permission")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.permission)}</td>
                            <td {...layoutCellProps(row.studentId, "absent")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.absent)}</td>
                            <td {...layoutCellProps(row.studentId, "totalAttendance")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.totalAbsensi)}</td>
                            <td {...layoutCellProps(row.studentId, "attendancePercentage")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{row.hasAttendance ? `${row.persentaseHadir ?? 0}%` : "-"}</td>
                            <td {...layoutCellProps(row.studentId, "attendanceStatus")} className={`border border-sky-100 dark:border-sky-900/40 dark:border-sky-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              <Badge variant="outline" className={getAttendanceStatusClass(row.attendanceStatus)}>{row.attendanceStatus}</Badge>
                            </td>
                            <td {...layoutCellProps(row.studentId, "attendanceReadiness")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center font-medium ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatProgressivePoint(row.poinKehadiranKesiapan)}</td>
                            <td {...layoutCellProps(row.studentId, "readingQuality")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center font-medium ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatProgressivePoint(row.poinKualitasBacaan)}</td>
                            <td {...layoutCellProps(row.studentId, "readingImprovement")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center font-medium ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatProgressivePoint(row.poinPerbaikanBacaan)}</td>
                            <td {...layoutCellProps(row.studentId, "monthlyAchievement")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.pencapaianTargetBulan)}</td>
                            <td {...layoutCellProps(row.studentId, "progressCategory")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center text-[10px] font-medium ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{row.kategoriProgres ?? "-"}</td>
                            <td {...layoutCellProps(row.studentId, "finalScore")} className={`border border-amber-100 dark:border-amber-900/40 dark:border-amber-900/40 px-2 py-3 text-center font-semibold ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>{formatRecapValue(row.nilaiAkhirProgresif)}</td>
                            <td {...layoutCellProps(row.studentId, "teacher")} className={`border border-violet-100 dark:border-violet-900/40 dark:border-violet-900/40 px-2 py-3 text-muted-foreground ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              {row.guru}
                            </td>
                            <td {...layoutCellProps(row.studentId, "notes")} className={`border border-violet-100 dark:border-violet-900/40 dark:border-violet-900/40 px-2 py-3 whitespace-pre-wrap text-muted-foreground ${recapLayout.isEditing ? "cursor-cell select-none" : ""}`}>
                              {row.catatan || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y">
                  {grp.rows.map(row => {
                    const reportEmpty = row.reportStatus === "empty";
                    return (
                      <div key={row.studentId} className={`p-3 space-y-3 ${reportEmpty ? "bg-rose-50/60 dark:bg-slate-900/40" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{row.no}. {row.nama}</p>
                            <p className="text-xs text-muted-foreground">{row.program} - {row.level}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${getReportStatusClass(row.reportStatus)}`}>
                            {reportEmpty ? "Belum Diisi" : "Sudah Diisi"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <section>
                            <p className="mb-1 font-semibold text-foreground">Progres Bulanan</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Awal</span><p>{row.awal}</p></div>
                              <div><span className="text-muted-foreground">Akhir</span><p>{row.akhir}</p></div>
                              <div><span className="text-muted-foreground">Total</span><p className="font-semibold">{formatRecapValue(row.total)}</p></div>
                              <div><span className="text-muted-foreground">Target</span><p>{formatRecapValue(row.target)}</p></div>
                            </div>
                          </section>
                          <section>
                            <p className="mb-1 font-semibold text-foreground">Absensi Bulanan</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Hadir</span><p>{formatRecapValue(row.present)}</p></div>
                              <div><span className="text-muted-foreground">Sakit</span><p>{formatRecapValue(row.sick)}</p></div>
                              <div><span className="text-muted-foreground">Izin</span><p>{formatRecapValue(row.permission)}</p></div>
                              <div><span className="text-muted-foreground">Alfa</span><p>{formatRecapValue(row.absent)}</p></div>
                              <div><span className="text-muted-foreground">Total Absensi</span><p>{formatRecapValue(row.totalAbsensi)}</p></div>
                              <div><span className="text-muted-foreground">Persentase Hadir</span><p>{row.hasAttendance ? `${row.persentaseHadir ?? 0}%` : "-"}</p></div>
                              <div className="col-span-2"><span className="text-muted-foreground">Status Absensi</span><p>{row.attendanceStatus}</p></div>
                            </div>
                          </section>
                          <section>
                            <p className="mb-1 font-semibold text-foreground">Penilaian Progresif</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Kehadiran & Kesiapan Belajar</span><p>{formatProgressivePoint(row.poinKehadiranKesiapan)}</p></div>
                              <div><span className="text-muted-foreground">Kualitas Bacaan Harian</span><p>{formatProgressivePoint(row.poinKualitasBacaan)}</p></div>
                              <div><span className="text-muted-foreground">Perbaikan Bacaan Harian</span><p>{formatProgressivePoint(row.poinPerbaikanBacaan)}</p></div>
                              <div><span className="text-muted-foreground">Pencapaian Bulanan</span><p>{formatRecapValue(row.pencapaianTargetBulan)}</p></div>
                              <div><span className="text-muted-foreground">Kategori Progres</span><p>{row.kategoriProgres ?? "-"}</p></div>
                              <div><span className="text-muted-foreground">Nilai</span><p className="font-semibold">{formatRecapValue(row.nilaiAkhirProgresif)}</p></div>
                            </div>
                          </section>
                          <section>
                            <p className="mb-1 font-semibold text-foreground">Guru dan Catatan</p>
                            <div><span className="text-muted-foreground">Guru</span><p>{row.guru}</p></div>
                          </section>
                        </div>
                        {row.catatan && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{row.catatan}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
                  </Card>
                ))}

                {!showAllGroups && displayGroups.length > 4 && (
                  <div className="flex justify-center mt-2 mb-6">
                    <Button variant="outline" onClick={() => setShowAllGroups(true)} className="gap-2 bg-background shadow-sm hover:bg-muted">
                      <ListChecks className="w-4 h-4" />
                      Tampilkan Semua Rombel ({displayGroups.length} Rombel)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {displayGroups.length > 0 && (
            <FixedHorizontalScrollbar
              scrollContainerRef={tableScrollRef}
              contentRef={tableContentRef}
              refreshKey={`${selectedMonth}-${selectedYear}-${displayGroups.length}-${displayGroups.map(grp => `${grp.kelas}-${grp.rombel}-${grp.rows.length}`).join("|")}-${recapLayout.tableMinWidth}-${recapLayout.layout.defaultRowHeight}-${recapLayout.layout.tableFontSize}-${recapLayout.isEditing}`}
            />
          )}

          {displayGroups.length > 0 && (
            <div className="grid gap-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100 md:grid-cols-2">
              <div>
                <p className="mb-2 font-semibold">Keterangan Status Absensi</p>
                <ul className="space-y-1">
                  <li><strong>Lengkap</strong> = Total absensi sama dengan hari efektif</li>
                  <li><strong>Belum Lengkap</strong> = Total absensi kurang dari hari efektif</li>
                  <li><strong>Melebihi Hari Efektif</strong> = Total absensi lebih dari hari efektif</li>
                  <li><strong>Belum Diisi</strong> = Belum ada data absensi</li>
                  <li><strong>Hari Efektif Belum Diatur</strong> = Pengaturan hari efektif belum tersedia</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">Keterangan Status Laporan</p>
                <ul className="space-y-1">
                  <li><strong>Sudah Diisi</strong> = Laporan bulanan sudah tersimpan dan memiliki isi laporan</li>
                  <li><strong>Belum Diisi</strong> = Laporan bulanan belum tersedia atau masih kosong</li>
                  <li><strong>Nilai Progresif</strong> = Menggunakan nilai akhir progresif yang tersimpan di laporan</li>
                </ul>
              </div>
            </div>
          )}

      {/* Dialog Download Multi Bulan per Rombel */}
      <Dialog open={multiMonthDialogOpen} onOpenChange={setMultiMonthDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Download Multi Bulan per Rombel</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Pilih bulan dan rombel, lalu unduh satu file PDF untuk setiap rombel.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pilih Tahun</Label>
              <Select value={dialogYear} onValueChange={setDialogYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Pilih Bulan</Label>
                <span className="text-xs text-muted-foreground">
                  {dialogMonths.length === 0
                    ? "Belum ada bulan dipilih"
                    : dialogMonths.length <= 3
                    ? `${dialogMonths.map(month => MONTH_NAMES[month - 1]).join(", ")} dipilih`
                    : `${dialogMonths.length} bulan dipilih`}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {MONTH_NAMES.map((monthName, index) => {
                  const month = index + 1;
                  const checked = dialogMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        setDialogMonths(current =>
                          current.includes(month)
                            ? current.filter(item => item !== month)
                            : [...current, month].sort((a, b) => a - b)
                        );
                      }}
                      className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Pilih Rombel</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={allRombelsSelected}
                    onCheckedChange={toggleAllRombels}
                  />
                  Pilih Semua
                </label>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2 bg-muted/30">
                {availableRombels.map(rombel => (
                  <label
                    key={rombel.key}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs hover:bg-muted bg-background cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedRombelKeys.includes(rombel.key)}
                      onCheckedChange={() => toggleRombel(rombel.key)}
                    />
                    {rombel.label}
                  </label>
                ))}
              </div>
            </div>

            {multiDownloadProgress && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">{multiDownloadProgress}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setMultiMonthDialogOpen(false)}
            >
              Tutup
            </Button>
            <Button
              variant="outline"
              disabled={pdfLoading === "multi-rombel"}
              onClick={() => downloadSelectedRombelPDFs("a4")}
            >
              {pdfLoading === "multi-rombel" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download (A4)
            </Button>
            <Button
              disabled={pdfLoading === "multi-rombel"}
              onClick={() => downloadSelectedRombelPDFs("f4")}
            >
              {pdfLoading === "multi-rombel" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download (F4)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={handlePreviewOpenChange}>
        <DialogContent className="max-w-6xl h-[92vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DialogTitle className="text-base">
                Preview PDF Rekap Laporan ({pdfPreviewSize.toUpperCase()} Landscape)
              </DialogTitle>
              {pdfPreviewUrl && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Buka di Tab Baru
                  </a>
                  <a
                    href={pdfPreviewUrl}
                    download={getPdfFileName(pdfPreviewSize)}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </DialogHeader>
          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-full"
              title="Preview PDF Rekap Laporan"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              PDF belum tersedia.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
  subtitle,
  onClick,
  isActive,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
  isActive?: boolean;
  activeColor?: string;
}) => {
  const activeClass = isActive
    ? activeColor || "border-primary ring-2 ring-primary/20 bg-primary/5"
    : "hover:border-muted-foreground/30";

  return (
    <Card
      onClick={onClick}
      className={`relative h-full min-h-[112px] border bg-card/95 shadow-sm transition-all duration-200 select-none dark:bg-card/80 ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0" : ""
      } ${activeClass}`}
    >
      {isActive && (
        <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] py-0 px-1.5 h-3.5 bg-primary/10 text-primary border-none font-semibold z-10">
          Aktif
        </Badge>
      )}
      <CardContent className="flex h-full items-center gap-4 p-4 text-left">
        <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
          <div className="scale-125">{icon}</div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug text-foreground">{label}</p>
          <p className="mt-1 text-2xl font-extrabold leading-none text-foreground">{value}</p>
          {subtitle && <p className="mt-2 text-[11px] leading-tight text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const highlight = (text: string, q: string) => {
  if (!q.trim()) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="bg-yellow-200 px-0.5 rounded">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

export default RecapReport;




