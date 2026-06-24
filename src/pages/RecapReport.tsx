import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useStudents, IQRO_LEVELS, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { useAllMonthlyReports, MONTH_NAMES } from "@/hooks/useMonthlyReports";
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
import {
  Search, Loader2, Eye, Download, CheckCircle2,
  Users, ListChecks, AlertCircle, Percent, FileWarning, Calendar
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2024, 2025, 2026, 2027, 2028];
type PdfPaperSize = "a4" | "legal";

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
  kehadiran: string;
  status: string;
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

const getProgramLabel = (level: string) => {
  if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level || "-";
};

const cleanPdfText = (value: unknown) => {
  return removeBlockedNoteEmoticons(String(value ?? ""))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
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

const formatTahfizhLevel = (level: string | null | undefined, page: number) => {
  if (!level) return `hal.${page}`;
  const juz = Number(String(level).replace(/\D/g, "")) || null;
  return juz ? `Juz ${juz} hal.${page}` : `hal.${page}`;
};

const getStatusLabel = (status: string) => {
  if (status === "achieved") return "Tercapai";
  if (status === "partial") return "Sebagian";
  if (status === "not_achieved") return "Belum";
  return "BELUM DIISI";
};

const isReportMeaningfullyFilled = (report: {
  achievement_status?: string | null;
  pages_read?: number | null;
  start_page?: number | null;
  end_page?: number | null;
  iqra_level?: string | null;
  end_iqra_level?: string | null;
  notes?: string | null;
  created_by?: string | null;
  teacher_name?: string | null;
}) => {
  const status = String(report.achievement_status ?? "");
  const notes = String(report.notes ?? "").trim();
  const hasProgress =
    Number(report.pages_read ?? 0) !== 0 ||
    Number(report.start_page ?? 0) !== Number(report.end_page ?? 0);
  const hasTeacherInput =
    notes.length > 0 ||
    Boolean(report.teacher_name) ||
    Boolean(report.created_by);

  if (status === "achieved" || status === "stagnant" || status === "decline") return true;
  if (hasProgress) return true;
  if ((status === "not_achieved" || status === "partial") && hasTeacherInput) return true;
  return false;
};

interface RowData {
  no: number;
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  program: string;
  level: string;
  bulan: string;
  awal: string;
  akhir: string;
  total: number;
  target: number;
  status: "achieved" | "not_achieved" | "empty";
  guru: string;
  catatan: string;
}

interface AggregatedReport {
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  program: string;
  months: string[];
  startPage: number;
  endPage: number;
  totalPages: number;
  totalTarget: number;
  averageAttendance: number;
  status: 'achieved' | 'not_achieved' | 'partial' | 'empty';
  guru: string;
  catatan: string;
  monthlyData: Array<{
    month: string;
    year: number;
    startPage: number;
    endPage: number;
    pagesRead: number;
    targetPages: number;
    iqraLevel: string | null;
    endIqraLevel: string | null;
    attendancePercentage: number;
    achievementStatus: string;
    notes: string;
  }>;
}

const RecapReport = () => {
  const { data: students = [], isLoading: ls } = useStudents();
  const { data: reports = [], isLoading: lr } = useAllMonthlyReports();
  const { data: settings } = useInstitutionSettings();
  const profileMap = useProfileMap();
  const queryClient = useQueryClient();

  const now = new Date();
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  type FilterStatusType = "all" | "filled" | "empty" | "achieved" | "not_achieved";
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>("all");
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
  
  // Multi-month export state

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

  // Group per rombel: kelas-rombel (single month mode)
  const groups = useMemo(() => {
    const map = new Map<string, { kelas: number; rombel: string; rows: RowData[] }>();
    filteredStudents.forEach(st => {
      const key = `${st.kelas}-${st.rombel}`;
      if (!map.has(key)) map.set(key, { kelas: st.kelas, rombel: st.rombel, rows: [] });
      const grp = map.get(key)!;

      const rep = reports.find(r =>
        r.student_id === st.id &&
        r.month === Number(filterMonth) &&
        r.year === Number(filterYear)
      );

      const monthLabel = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

      if (!rep || !isReportMeaningfullyFilled(rep)) {
        grp.rows.push({
          no: grp.rows.length + 1,
          studentId: st.id,
          nama: st.nama,
          kelas: st.kelas,
          rombel: st.rombel,
          program: getProgramLabel(st.level),
          level: st.level,
          bulan: monthLabel,
          awal: "-",
          akhir: "-",
          total: 0,
          target: 0,
          status: "empty",
          guru: "-",
          catatan: "",
        });
      } else {
        const fmtTahfizh = (lvl: string | null | undefined, page: number) => {
          const j = Number(String(lvl || "").replace(/\D/g, "")) || null;
          return j ? `Juz ${j} hal.${page}` : `hal.${page}`;
        };
        const awal = rep.iqra_level
          ? (rep.program_type === "tahfizh" ? fmtTahfizh(rep.iqra_level, rep.start_page) : `${rep.iqra_level} hal.${rep.start_page}`)
          : String(rep.start_page);
        const akhir = (rep as any).end_iqra_level
          ? (rep.program_type === "tahfizh" ? fmtTahfizh((rep as any).end_iqra_level, rep.end_page) : `${(rep as any).end_iqra_level} hal.${rep.end_page}`)
          : String(rep.end_page);
        grp.rows.push({
          no: grp.rows.length + 1,
          studentId: st.id,
          nama: st.nama,
          kelas: st.kelas,
          rombel: st.rombel,
          program: getProgramLabel(st.level),
          level: st.level,
          bulan: monthLabel,
          awal, akhir,
          total: rep.pages_read,
          target: rep.target_pages,
          status: rep.achievement_status === "achieved" ? "achieved" : "not_achieved",
          guru:
            rep.teacher_name?.trim() ||
            (rep.created_by ? profileMap.get(rep.created_by) || "-" : "-"),
          catatan: rep.notes || "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [filteredStudents, reports, filterMonth, filterYear, profileMap]);

  // Apply status filter (sudah/belum diisi) and renumber per rombel
  const displayGroups = useMemo(() => {
    return groups
      .map(g => {
        const filtered = g.rows.filter(r => {
          if (filterStatus === "filled") return r.status !== "empty";
          if (filterStatus === "empty") return r.status === "empty";
          if (filterStatus === "achieved") return r.status === "achieved";
          if (filterStatus === "not_achieved") return r.status === "not_achieved";
          return true;
        }).map((r, i) => ({ ...r, no: i + 1 }));
        return { ...g, rows: filtered };
      })
      .filter(g => g.rows.length > 0);
  }, [groups, filterStatus]);

  // Statistik (selalu dari groups penuh, tidak dipengaruhi filterStatus)
  const stats = useMemo(() => {
    const all = groups.flatMap(g => g.rows);
    const total = all.length;
    const filled = all.filter(r => r.status !== "empty").length;
    const empty = total - filled;
    const achieved = all.filter(r => r.status === "achieved").length;
    const notAchieved = all.filter(r => r.status === "not_achieved").length;
    const completion = total ? Math.round((filled / total) * 100) : 0;
    const achievementRate = filled ? Math.round((achieved / filled) * 100) : 0;
    return { total, filled, empty, achieved, notAchieved, completion, achievementRate };
  }, [groups]);

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
      .catch((error: any) => {
        toast({
          title: "Gagal memulihkan data April",
          description: error?.message ?? "Akun login mungkin tidak punya izin update/insert laporan.",
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

  const singleMonthPdfGroups = useMemo<PdfGroupData[]>(() => {
    return displayGroups.map(group => ({
      kelas: group.kelas,
      rombel: group.rombel,
      rows: group.rows.map(row => ({
        no: row.no,
        studentId: row.studentId,
        nama: row.nama,
        program: row.program,
        level: row.level,
        periode: row.bulan,
        awal: row.awal,
        akhir: row.akhir,
        total: row.status === "empty" ? "-" : String(row.total),
        target: row.status === "empty" ? "-" : String(row.target),
        kehadiran: "-",
        status: getStatusLabel(row.status),
        guru: row.guru,
        catatan: row.catatan,
      })),
    }));
  }, [displayGroups]);

  const activePdfGroups = singleMonthPdfGroups;
  const activePeriodLabel = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

  const buildRowsForRombelMonth = useCallback((rombel: RombelOption, month: number, year: string): PdfRowData[] => {
    const studentsInRombel = filteredStudents
      .filter(student => student.kelas === rombel.kelas && student.rombel === rombel.rombel)
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    return studentsInRombel.map((student, index) => {
      const report = reports.find(item =>
        item.student_id === student.id &&
        item.month === month &&
        item.year === Number(year)
      );

      if (!report || !isReportMeaningfullyFilled(report)) {
        return {
          no: index + 1,
          studentId: student.id,
          nama: student.nama,
          program: getProgramLabel(student.level),
          level: student.level,
          periode: monthLabel,
          awal: "-",
          akhir: "-",
          total: "-",
          target: "-",
          kehadiran: "-",
          status: "Belum Diisi",
          guru: "-",
          catatan: "",
        };
      }

      const awal = report.iqra_level
        ? (report.program_type === "tahfizh"
          ? formatTahfizhLevel(report.iqra_level, report.start_page)
          : `${report.iqra_level} hal.${report.start_page}`)
        : String(report.start_page);
      const akhir = (report as any).end_iqra_level
        ? (report.program_type === "tahfizh"
          ? formatTahfizhLevel((report as any).end_iqra_level, report.end_page)
          : `${(report as any).end_iqra_level} hal.${report.end_page}`)
        : String(report.end_page);

      return {
        no: index + 1,
        studentId: student.id,
        nama: student.nama,
        program: getProgramLabel(student.level),
        level: student.level,
        periode: monthLabel,
        awal,
        akhir,
        total: String(report.pages_read),
        target: String(report.target_pages),
        kehadiran: report.attendance_percentage ? `${report.attendance_percentage}%` : "-",
        status: report.achievement_status === "achieved" ? "Tercapai" : "Belum Tercapai",
        guru:
          report.teacher_name?.trim() ||
          (report.created_by
            ? profileMap.get(report.created_by) || "-"
            : "-"),
        catatan: report.notes || "",
      };
    });
  }, [filteredStudents, profileMap, reports]);

  const buildSelectedRombelPDF = useCallback(async (rombel: RombelOption, months: number[], year: string) => {
    const exportSettings = (settings || {}) as ExportSettings;
    const [logoB64, koordTtdB64, kepsekTtdB64] = await Promise.all([
      exportSettings.logo_url ? loadImageAsBase64(exportSettings.logo_url) : Promise.resolve(null),
      exportSettings.koordinator_ttd_url ? loadImageAsBase64(exportSettings.koordinator_ttd_url) : Promise.resolve(null),
      exportSettings.kepsek_ttd_url ? loadImageAsBase64(exportSettings.kepsek_ttd_url) : Promise.resolve(null),
    ]);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const hasAmiriFont = await loadAmiriFont(doc);

    const drawHeader = (month: number) => {
      const y = margin;
      if (logoB64) {
        try {
          doc.addImage(logoB64, "PNG", margin, y, 16, 16);
        } catch {}
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
          } catch {}
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
      const hasReportData = reports.some(item =>
        item.month === month &&
        item.year === Number(year) &&
        rows.some(row => row.studentId === item.student_id)
      );

      let cursorY = margin + 34;
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

      autoTable(doc, {
        startY: cursorY,
        head: [[
          "No",
          "Nama",
          "Program",
          "Level",
          "Awal",
          "Akhir",
          "Total",
          "Target",
          "Kehadiran",
          "Status",
          "Guru",
          "Catatan",
        ]],
        body: rows.map(row => [
          String(row.no),
          cleanPdfText(row.nama),
          cleanPdfText(row.program),
          cleanPdfText(row.level),
          cleanPdfText(row.awal),
          cleanPdfText(row.akhir),
          row.status === "Belum Diisi" ? "-" : row.total,
          row.status === "Belum Diisi" ? "-" : row.target,
          row.status === "Belum Diisi" ? "-" : row.kehadiran,
          row.status,
          cleanPdfText(row.guru),
          cleanPdfText(row.catatan || "-"),
        ]),
        styles: {
          font: "helvetica",
          fontStyle: "normal",
          fontSize: 7,
          cellPadding: 1.2,
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
          fontSize: 7,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 34 },
          2: { cellWidth: 23 },
          3: { cellWidth: 21 },
          4: { cellWidth: 19 },
          5: { cellWidth: 19 },
          6: { cellWidth: 11, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 11, halign: "center" },
          8: { cellWidth: 16, halign: "center" },
          9: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          10: { cellWidth: 22 },
          11: { cellWidth: "auto", overflow: "linebreak", valign: "top" },
        },
        didParseCell: data => {
          if (data.section === "body" && data.column.index === 11) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.valign = "top";
            data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            data.cell.styles.fontStyle = "normal";
          }
          if (data.section === "body" && data.column.index === 9) {
            const value = String(data.cell.raw);
            if (value === "Tercapai") data.cell.styles.textColor = [16, 124, 65];
            else if (value === "Belum Tercapai") data.cell.styles.textColor = [185, 28, 28];
            else if (value === "Belum Diisi") {
              data.cell.styles.textColor = [220, 38, 38];
              Object.values(data.row.cells).forEach((cell: any) => {
                cell.styles.fillColor = [255, 235, 238];
              });
            }
          }
        },
        margin: { left: margin, right: margin, bottom: 22 },
      });

      drawSignature((doc as any).lastAutoTable.finalY + 2);
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
  }, [buildRowsForRombelMonth, reports, settings]);

  const downloadSelectedRombelPDFs = useCallback(async () => {
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
        const doc = await buildSelectedRombelPDF(rombel, dialogMonths, dialogYear);
        doc.save(`Rekap_Tahsin_${safeFilePart(rombel.label)}_${safeFilePart(monthFilePart)}_${dialogYear}.pdf`);
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
      format: paperSize,
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const isLegal = paperSize === "legal";
    const hasAmiriFont = await loadAmiriFont(doc);

    const drawHeader = () => {
      const y = margin;
      if (logoB64) {
        try {
          doc.addImage(logoB64, "PNG", margin, y, 16, 16);
        } catch {}
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

      autoTable(doc, {
        startY: cursorY,
        head: [[
          "No",
          "Nama",
          "Program",
          "Level",
          "Awal",
          "Akhir",
          "Total",
          "Target",
          "Status",
          "Guru",
          "Catatan",
        ]],
        body: group.rows.map(row => {
          const status =
            row.status === "Tercapai"
              ? "Tercapai"
              : row.status === "BELUM DIISI"
              ? "Belum Diisi"
              : row.status === "Sebagian"
              ? "Sebagian"
              : "Belum Tercapai";

          return [
            String(row.no),
            cleanPdfText(row.nama),
            cleanPdfText(row.program),
            cleanPdfText(row.level),
            cleanPdfText(row.awal),
            cleanPdfText(row.akhir),
            row.status === "BELUM DIISI" ? "-" : String(row.total),
            row.status === "BELUM DIISI" ? "-" : String(row.target),
            status,
            cleanPdfText(row.guru),
            cleanPdfText(row.catatan || "-"),
          ];
        }),
        styles: {
          font: "helvetica",
          fontStyle: "normal",
          fontSize: isLegal ? 8 : 7,
          cellPadding: isLegal ? 1.6 : 1.2,
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
          fontSize: isLegal ? 8 : 7,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: isLegal
          ? {
              0: { cellWidth: 8, halign: "center" },
              1: { cellWidth: 42 },
              2: { cellWidth: 26 },
              3: { cellWidth: 26 },
              4: { cellWidth: 22 },
              5: { cellWidth: 22 },
              6: { cellWidth: 12, halign: "center", fontStyle: "bold" },
              7: { cellWidth: 12, halign: "center" },
              8: { cellWidth: 24, halign: "center", fontStyle: "bold" },
              9: { cellWidth: 28 },
              10: { cellWidth: "auto", overflow: "linebreak", valign: "top" },
            }
          : {
              0: { cellWidth: 8, halign: "center" },
              1: { cellWidth: 34 },
              2: { cellWidth: 23 },
              3: { cellWidth: 21 },
              4: { cellWidth: 19 },
              5: { cellWidth: 19 },
              6: { cellWidth: 11, halign: "center", fontStyle: "bold" },
              7: { cellWidth: 11, halign: "center" },
              8: { cellWidth: 20, halign: "center", fontStyle: "bold" },
              9: { cellWidth: 22 },
              10: { cellWidth: "auto", overflow: "linebreak", valign: "top" },
            },
        didParseCell: data => {
          if (data.section === "body" && data.column.index === 10) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.valign = "top";
            data.cell.styles.font = hasAmiriFont && hasArabicText(data.cell.raw) ? "Amiri" : "helvetica";
            data.cell.styles.fontStyle = "normal";
          }

          if (data.section === "body" && data.column.index === 8) {
            const value = String(data.cell.raw);
            if (value === "Tercapai") data.cell.styles.textColor = [16, 124, 65];
            else if (value === "Sebagian") data.cell.styles.textColor = [245, 127, 23];
            else if (value === "Belum Tercapai") data.cell.styles.textColor = [185, 28, 28];
            else if (value === "Belum Diisi") {
              data.cell.styles.textColor = [220, 38, 38];
              Object.values(data.row.cells).forEach((cell: any) => {
                cell.styles.fillColor = [255, 235, 238];
              });
            }
          }
        },
        margin: { left: margin, right: margin, bottom: 22 },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 4;
    });

    const signatureHeight = 50;
    if (cursorY + signatureHeight > pageH - 14) {
      doc.addPage();
      drawHeader();
      cursorY = margin + 34;
    }

    const allRows = activePdfGroups.flatMap(group => group.rows);
    const filledRows = allRows.filter(row => row.status !== "BELUM DIISI");
    const achievedRows = allRows.filter(row => row.status === "Tercapai");
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
      `Sudah Diisi: ${filledRows.length} siswa`,
      `Target Tercapai: ${achievedRows.length} siswa (${allRows.length > 0 ? Math.round((achievedRows.length / allRows.length) * 100) : 0}%)`,
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
        } catch {}
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

  if (ls || lr) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Rekap Laporan Bulanan
          </h1>
          <p className="text-sm text-muted-foreground">
            Tahsin Dasar, Tahsin Lanjutan & Tahfizh — siap export PDF & Excel
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setMultiMonthDialogOpen(true)}
            variant="outline"
            className="gap-2 text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            Download Multi Bulan per Rombel
          </Button>
        </div>
      </div>

      {/* Single Month Mode */}
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total Siswa"
              value={stats.total}
              color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
              onClick={() => setFilterStatus("all")}
              isActive={filterStatus === "all"}
              activeColor="border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
            />
            <StatCard
              icon={<ListChecks className="w-4 h-4" />}
              label="Sudah Diisi"
              value={stats.filled}
              color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              onClick={() => setFilterStatus("filled")}
              isActive={filterStatus === "filled"}
              activeColor="border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20"
            />
            <StatCard
              icon={<FileWarning className="w-4 h-4" />}
              label="Belum Diisi"
              value={stats.empty}
              color="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              onClick={() => setFilterStatus("empty")}
              isActive={filterStatus === "empty"}
              activeColor="border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20"
            />
            <StatCard
              icon={<Percent className="w-4 h-4" />}
              label="Kelengkapan"
              value={`${stats.completion}%`}
              color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              onClick={() => setFilterStatus("filled")}
              isActive={false}
              activeColor="border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Target Tercapai"
              value={`${stats.achievementRate}%`}
              color="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
              onClick={() => setFilterStatus("achieved")}
              isActive={filterStatus === "achieved"}
              activeColor="border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/30 dark:bg-violet-950/20"
            />
          </div>

          {/* Active Filter Cues */}
          {(filterStatus !== "all" || search.trim() || filterKelas !== "all" || filterRombel !== "all") && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-muted/40 border border-border rounded-lg text-xs transition-all duration-200">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                Filter Aktif:
              </span>
              {filterStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Status: {
                    filterStatus === "filled" ? "Sudah Diisi" :
                    filterStatus === "empty" ? "Belum Diisi" :
                    filterStatus === "achieved" ? "Target Tercapai" :
                    filterStatus === "not_achieved" ? "Target Belum Tercapai" : ""
                  }
                  <button onClick={() => setFilterStatus("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">×</button>
                </Badge>
              )}
              {filterKelas !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Kelas {filterKelas}
                  <button onClick={() => setFilterKelas("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">×</button>
                </Badge>
              )}
              {filterRombel !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Rombel {filterRombel}
                  <button onClick={() => setFilterRombel("all")} className="hover:text-foreground text-muted-foreground font-bold ml-1">×</button>
                </Badge>
              )}
              {search.trim() && (
                <Badge variant="secondary" className="gap-1 bg-background border px-2 py-0.5">
                  Cari: "{search}"
                  <button onClick={() => setSearch("")} className="hover:text-foreground text-muted-foreground font-bold ml-1">×</button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 ml-auto"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterKelas("all");
                  setFilterRombel("all");
                  setSearch("");
                }}
              >
                Reset Semua Filter
              </Button>
            </div>
          )}

          {stats.empty > 0 && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-sm text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Masih ada <strong>{stats.empty} siswa</strong> yang belum diisi laporannya untuk periode ini.
              </span>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Cari Siswa</Label>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-7 h-9"
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
                <Label className="text-xs">Status Isi</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as any)}
                >
                  <SelectTrigger
                    className={`h-9 transition-colors ${
                      filterStatus === "empty"
                        ? "border-rose-400 text-rose-700 bg-rose-50/50"
                        : filterStatus === "filled"
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50/50"
                        : filterStatus === "achieved"
                        ? "border-violet-400 text-violet-700 bg-violet-50/50"
                        : filterStatus === "not_achieved"
                        ? "border-amber-400 text-amber-700 bg-amber-50/50"
                        : ""
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="filled">Sudah Diisi</SelectItem>
                    <SelectItem value="empty">Belum Diisi</SelectItem>
                    <SelectItem value="achieved">Target Tercapai</SelectItem>
                    <SelectItem value="not_achieved">Target Belum Tercapai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 text-xs sm:text-sm"
              disabled={!!pdfLoading || activePdfGroups.length === 0}
              onClick={() => previewPDF("a4")}
            >
              {pdfLoading === "preview-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview A4
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-xs sm:text-sm"
              disabled={!!pdfLoading || activePdfGroups.length === 0}
              onClick={() => previewPDF("legal")}
            >
              {pdfLoading === "preview-legal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview Legal
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-xs sm:text-sm"
              disabled={!!pdfLoading || activePdfGroups.length === 0}
              onClick={() => exportPDF("a4")}
            >
              {pdfLoading === "download-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF A4
            </Button>
            <Button
              className="gap-2 text-xs sm:text-sm"
              disabled={!!pdfLoading || activePdfGroups.length === 0}
              onClick={() => exportPDF("legal")}
            >
              {pdfLoading === "download-legal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF Legal
            </Button>
          </div>

          {/* Tables grouped per rombel */}
          {displayGroups.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Tidak ada siswa pada filter ini.
              </CardContent>
            </Card>
          )}
          {displayGroups.map(grp => (
            <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden">
              <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 py-3">
                <CardTitle className="text-sm text-emerald-900 dark:text-emerald-300">
                  Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
                  <Badge variant="outline" className="ml-2 bg-white dark:bg-background">
                    {grp.rows.length} siswa
                  </Badge>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-white dark:bg-background text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                  >
                    {grp.rows.filter(r => r.status === "empty").length} belum diisi
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr className="text-left">
                        <th className="px-2 py-2 w-8">No</th>
                        <th className="px-2 py-2 min-w-[140px]">Nama</th>
                        <th className="px-2 py-2">Program</th>
                        <th className="px-2 py-2">Level</th>
                        <th className="px-2 py-2 text-center">Awal</th>
                        <th className="px-2 py-2 text-center">Akhir</th>
                        <th className="px-2 py-2 text-center">Total</th>
                        <th className="px-2 py-2 text-center">Target</th>
                        <th className="px-2 py-2 text-center">Status</th>
                        <th className="px-2 py-2">Guru</th>
                        <th className="px-2 py-2 min-w-[200px]">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grp.rows.map(row => {
                        const empty = row.status === "empty";
                        return (
                          <tr
                            key={row.studentId}
                            className={`border-t ${
                              empty
                                ? "bg-rose-50/60 dark:bg-rose-950/20"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <td className="px-2 py-2">{row.no}</td>
                            <td className="px-2 py-2 font-medium">
                              {highlight(row.nama, search)}
                            </td>
                            <td className="px-2 py-2">{row.program}</td>
                            <td className="px-2 py-2">
                              <Badge
                                className={`text-[10px] ${
                                  LEVEL_COLORS[row.level as ReadingLevel] || ""
                                }`}
                              >
                                {row.level}
                              </Badge>
                            </td>
                            <td className="px-2 py-2 text-center">{row.awal}</td>
                            <td className="px-2 py-2 text-center">{row.akhir}</td>
                            <td className="px-2 py-2 text-center font-bold">
                              {empty ? "-" : row.total}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {empty ? "-" : row.target}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {row.status === "achieved" && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  Tercapai
                                </Badge>
                              )}
                              {row.status === "not_achieved" && (
                                <Badge variant="destructive">Belum</Badge>
                              )}
                              {empty && (
                                <Badge className="bg-rose-200 text-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                                  Belum diisi
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {row.guru}
                            </td>
                            <td className="px-2 py-2 whitespace-pre-wrap text-muted-foreground">
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
                    const empty = row.status === "empty";
                    return (
                      <div key={row.studentId} className={`p-3 space-y-2 ${empty ? "bg-rose-50/60 dark:bg-rose-950/10" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{row.no}. {row.nama}</p>
                            <p className="text-xs text-muted-foreground">{row.program} - {row.level}</p>
                          </div>
                          <Badge className={`text-[10px] ${empty ? "bg-rose-200 dark:bg-rose-950/40 text-rose-900 dark:text-rose-400" : row.status === "achieved" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400" : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400"}`}>
                            {getStatusLabel(row.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Awal</span><p>{row.awal}</p></div>
                          <div><span className="text-muted-foreground">Akhir</span><p>{row.akhir}</p></div>
                          <div><span className="text-muted-foreground">Total</span><p className="font-semibold">{empty ? "-" : row.total}</p></div>
                          <div><span className="text-muted-foreground">Target</span><p>{empty ? "-" : row.target}</p></div>
                          <div><span className="text-muted-foreground">Status</span><p>{getStatusLabel(row.status)}</p></div>
                          <div><span className="text-muted-foreground">Guru</span><p>{row.guru}</p></div>
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
              disabled={pdfLoading === "multi-rombel"}
              onClick={downloadSelectedRombelPDFs}
            >
              {pdfLoading === "multi-rombel" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Rekap Terpilih
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
  onClick,
  isActive,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
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
      className={`transition-all duration-200 select-none ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0" : ""
      } ${activeClass}`}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>
            {icon}
          </div>
          {isActive && (
            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-3.5 bg-primary/10 text-primary border-none font-semibold">
              Aktif
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
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




