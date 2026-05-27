import { useState, useMemo, useCallback, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MultiMonthExportFilters } from "@/components/MultiMonthExportFilters";
import { generateMultiMonthExcel, type ExportGroup } from "@/utils/multiMonthExportUtils";
import { removeBlockedNoteEmoticons } from "@/lib/noteValidation";
import {
  Search, Loader2, Eye, Download, CheckCircle2,
  Users, ListChecks, AlertCircle, Percent, FileWarning, FileSpreadsheet, Calendar
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

const getProgramLabel = (level: string) => {
  if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level || "-";
};

const cleanPdfText = (value: unknown) => {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .split("\n")
    .map(line => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
};

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

  const now = new Date();
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterRombel, setFilterRombel] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "filled" | "empty">("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewSize, setPdfPreviewSize] = useState<PdfPaperSize>("a4");
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  
  // Multi-month export state
  const [multiMonthMode, setMultiMonthMode] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

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

      if (!rep) {
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
          guru: rep.created_by ? (profileMap.get(rep.created_by) || "-") : "-",
          catatan: removeBlockedNoteEmoticons(rep.notes || ""),
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

  // Multi-month data aggregation
  const multiMonthExportGroups = useMemo(() => {
    if (!multiMonthMode || selectedMonths.length === 0) return [];

    const map = new Map<string, ExportGroup>();
    
    filteredStudents.forEach(st => {
      const key = `${st.kelas}-${st.rombel}`;
      if (!map.has(key)) {
        map.set(key, { kelas: st.kelas, rombel: st.rombel, reports: [] });
      }

      const studentReports = reports.filter(
        r => r.student_id === st.id && 
             selectedMonths.includes(r.month) && 
             r.year === selectedYear
      );

      const monthlyData = selectedMonths
        .map(m => {
          const rep = studentReports.find(r => r.month === m);
          return {
            month: MONTH_NAMES[m - 1],
            year: selectedYear,
            startPage: rep?.start_page || 0,
            endPage: rep?.end_page || 0,
            pagesRead: rep?.pages_read || 0,
            targetPages: rep?.target_pages || 0,
            iqraLevel: rep?.iqra_level || null,
            endIqraLevel: (rep as any)?.end_iqra_level || null,
            attendancePercentage: rep?.attendance_percentage || 0,
            achievementStatus: rep?.achievement_status || 'empty',
            notes: removeBlockedNoteEmoticons(rep?.notes || ''),
          };
        })
        .sort((a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month));

      const filledMonths = monthlyData.filter(m => m.pagesRead > 0);
      const totalPages = filledMonths.reduce((sum, m) => sum + m.pagesRead, 0);
      const totalTarget = filledMonths.reduce((sum, m) => sum + m.targetPages, 0);
      const avgAttendance =
        filledMonths.length > 0
          ? Math.round(
              filledMonths.reduce((sum, m) => sum + m.attendancePercentage, 0) /
                filledMonths.length
            )
          : 0;

      const achievedCount = filledMonths.filter(
        m => m.achievementStatus === 'achieved'
      ).length;
      let status: 'achieved' | 'not_achieved' | 'partial' | 'empty';
      if (filledMonths.length === 0) {
        status = 'empty';
      } else if (achievedCount === filledMonths.length) {
        status = 'achieved';
      } else if (achievedCount > 0) {
        status = 'partial';
      } else {
        status = 'not_achieved';
      }

      const aggregated: AggregatedReport = {
        studentId: st.id,
        nama: st.nama,
        kelas: st.kelas,
        rombel: st.rombel,
        level: st.level,
        program: getProgramLabel(st.level),
        months: monthlyData.map(m => m.month),
        startPage: monthlyData[0]?.startPage || 0,
        endPage: monthlyData[monthlyData.length - 1]?.endPage || 0,
        totalPages,
        totalTarget,
        averageAttendance: avgAttendance,
        status,
        guru: studentReports[0]?.created_by ? `${studentReports[0].created_by}`.substring(0, 50) : '-',
        catatan: monthlyData.map(m => m.notes).filter(Boolean).join(' | '),
        monthlyData,
      };

      map.get(key)!.reports.push(aggregated);
    });

    return Array.from(map.values())
      .map(g => ({
        ...g,
        reports: g.reports.sort((a, b) => a.nama.localeCompare(b.nama))
      }))
      .sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel));
  }, [multiMonthMode, selectedMonths, selectedYear, filteredStudents, reports]);

  // Multi-month stats
  const multiMonthStats = useMemo(() => {
    if (!multiMonthExportGroups.length) return null;

    const all = multiMonthExportGroups.flatMap(g => g.reports);
    const total = all.length;
    const filled = all.filter(r => r.status !== "empty").length;
    const empty = total - filled;
    const achieved = all.filter(r => r.status === "achieved").length;
    const partial = all.filter(r => r.status === "partial").length;
    const totalPages = all.reduce((sum, r) => sum + r.totalPages, 0);
    const avgAttendance = filled > 0 
      ? Math.round(all.reduce((sum, r) => sum + r.averageAttendance, 0) / filled)
      : 0;

    return { total, filled, empty, achieved, partial, totalPages, avgAttendance };
  }, [multiMonthExportGroups]);

  const exportMultiMonthExcel = () => {
    if (multiMonthExportGroups.length === 0) {
      toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }

    try {
      generateMultiMonthExcel(
        multiMonthExportGroups,
        selectedMonths,
        selectedYear,
        settings || {}
      );
      toast({ title: "Excel berhasil diunduh ✅" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error mengekspor Excel", variant: "destructive" });
    }
  };

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

  const multiMonthPdfGroups = useMemo<PdfGroupData[]>(() => {
    return multiMonthExportGroups.map(group => ({
      kelas: group.kelas,
      rombel: group.rombel,
      rows: group.reports.map((row, index) => ({
        no: index + 1,
        studentId: row.studentId,
        nama: row.nama,
        program: row.program,
        level: row.level,
        periode: row.months.join(" / "),
        awal: row.startPage > 0 ? formatTahfizhLevel(row.monthlyData[0]?.iqraLevel, row.startPage) : "-",
        akhir: row.endPage > 0
          ? formatTahfizhLevel(row.monthlyData[row.monthlyData.length - 1]?.endIqraLevel, row.endPage)
          : "-",
        total: row.status === "empty" ? "-" : String(row.totalPages),
        target: row.status === "empty" ? "-" : String(row.totalTarget),
        kehadiran: row.status === "empty" ? "-" : `${row.averageAttendance}%`,
        status: getStatusLabel(row.status),
        guru: row.guru,
        catatan: row.catatan,
      })),
    }));
  }, [multiMonthExportGroups]);

  const activePdfGroups = multiMonthMode ? multiMonthPdfGroups : singleMonthPdfGroups;

  const activePeriodLabel = multiMonthMode
    ? selectedMonths.length === 1
      ? `${MONTH_NAMES[selectedMonths[0] - 1]} ${selectedYear}`
      : selectedMonths.length > 1
      ? `${MONTH_NAMES[selectedMonths[0] - 1]} - ${MONTH_NAMES[selectedMonths[selectedMonths.length - 1] - 1]} ${selectedYear}`
      : `${selectedYear}`
    : `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

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
    const noteFont = hasAmiriFont ? "Amiri" : "helvetica";

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
              10: { cellWidth: "auto", overflow: "linebreak", valign: "top", font: noteFont },
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
              10: { cellWidth: "auto", overflow: "linebreak", valign: "top", font: noteFont },
            },
        didParseCell: data => {
          if (data.section === "body" && data.column.index === 10) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.valign = "top";
            data.cell.styles.font = noteFont;
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
      const blob = doc.output("blob");
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
            variant={multiMonthMode ? "default" : "outline"}
            className="gap-2 text-xs sm:text-sm"
            onClick={() => {
              setMultiMonthMode(!multiMonthMode);
              if (!multiMonthMode) {
                setSelectedMonths([]);
              }
            }}
          >
            <Calendar className="w-4 h-4" />
            {multiMonthMode ? "Mode Multi-Bulan" : "Multi-Bulan"}
          </Button>
        </div>
      </div>

      {/* Multi-Month Mode */}
      {multiMonthMode && (
        <div className="space-y-4">
          <MultiMonthExportFilters
            onMonthsChange={setSelectedMonths}
            onYearChange={setSelectedYear}
            selectedMonths={selectedMonths}
            selectedYear={selectedYear}
          />

          {selectedMonths.length > 0 && multiMonthExportGroups.length > 0 && (
            <>
              {/* Multi-Month Stats */}
              {multiMonthStats && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <StatCard
                    icon={<Users className="w-4 h-4" />}
                    label="Total Siswa"
                    value={multiMonthStats.total}
                    color="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Tercapai"
                    value={multiMonthStats.achieved}
                    color="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Sebagian"
                    value={multiMonthStats.partial}
                    color="bg-amber-50 text-amber-700"
                  />
                  <StatCard
                    icon={<FileWarning className="w-4 h-4" />}
                    label="Belum Diisi"
                    value={multiMonthStats.empty}
                    color="bg-rose-50 text-rose-700"
                  />
                  <StatCard
                    icon={<Percent className="w-4 h-4" />}
                    label="Kehadiran"
                    value={`${multiMonthStats.avgAttendance}%`}
                    color="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    icon={<ListChecks className="w-4 h-4" />}
                    label="Total Hal."
                    value={multiMonthStats.totalPages}
                    color="bg-indigo-50 text-indigo-700"
                  />
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm"
                  onClick={exportMultiMonthExcel}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading}
                  onClick={() => previewPDF("a4")}
                >
                  {pdfLoading === "preview-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Preview A4
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading}
                  onClick={() => previewPDF("legal")}
                >
                  {pdfLoading === "preview-legal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Preview Legal
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading}
                  onClick={() => exportPDF("a4")}
                >
                  {pdfLoading === "download-a4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PDF A4
                </Button>
                <Button
                  className="gap-2 text-xs sm:text-sm"
                  disabled={!!pdfLoading}
                  onClick={() => exportPDF("legal")}
                >
                  {pdfLoading === "download-legal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PDF Legal
                </Button>
              </div>

              {/* Multi-Month Tables */}
              {multiMonthExportGroups.map(grp => (
                <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden">
                  <CardHeader className="bg-blue-50 py-3">
                    <CardTitle className="text-sm text-blue-900">
                      Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
                      <Badge variant="outline" className="ml-2 bg-white">
                        {grp.reports.length} siswa
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-muted/80">
                          <tr className="text-left">
                            <th className="px-2 py-2 w-8">No</th>
                            <th className="px-2 py-2 min-w-[120px]">Nama</th>
                            <th className="px-2 py-2">Program</th>
                            <th className="px-2 py-2">Level</th>
                            <th className="px-2 py-2">Bulan</th>
                            <th className="px-2 py-2 text-center">Awal</th>
                            <th className="px-2 py-2 text-center">Akhir</th>
                            <th className="px-2 py-2 text-center">Total Hal</th>
                            <th className="px-2 py-2 text-center">Target</th>
                            <th className="px-2 py-2 text-center">Kehadiran %</th>
                            <th className="px-2 py-2 text-center">Status</th>
                            <th className="px-2 py-2">Guru</th>
                            <th className="px-2 py-2 min-w-[200px]">Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grp.reports.map((row, idx) => {
                            const empty = row.status === "empty";
                            return (
                              <tr
                                key={row.studentId}
                                className={`border-t ${empty ? "bg-rose-50/60" : "hover:bg-muted/40"}`}
                              >
                                <td className="px-2 py-2">{idx + 1}</td>
                                <td className="px-2 py-2 font-medium">
                                  {highlight(row.nama, search)}
                                </td>
                                <td className="px-2 py-2">{row.program}</td>
                                <td className="px-2 py-2">{row.level}</td>
                                <td className="px-2 py-2 text-xs">
                                  {row.months.join(" / ")}
                                </td>
                                <td className="px-2 py-2 text-center">{empty ? "-" : row.startPage}</td>
                                <td className="px-2 py-2 text-center">{empty ? "-" : row.endPage}</td>
                                <td className="px-2 py-2 text-center font-bold">
                                  {empty ? "-" : row.totalPages}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {empty ? "-" : row.totalTarget}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {empty ? "-" : `${row.averageAttendance}%`}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {row.status === "achieved" && (
                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                                      Tercapai
                                    </Badge>
                                  )}
                                  {row.status === "partial" && (
                                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                      Sebagian
                                    </Badge>
                                  )}
                                  {row.status === "not_achieved" && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      Belum
                                    </Badge>
                                  )}
                                  {empty && (
                                    <Badge className="bg-rose-200 text-rose-900 text-[10px]">
                                      Belum diisi
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-muted-foreground">{row.guru}</td>
                                <td className="px-2 py-2 whitespace-pre-wrap text-muted-foreground">{row.catatan || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden divide-y">
                      {grp.reports.map((row, idx) => {
                        const empty = row.status === "empty";
                        return (
                          <div key={row.studentId} className={`p-3 space-y-2 ${empty ? "bg-rose-50/60" : ""}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{idx + 1}. {row.nama}</p>
                                <p className="text-xs text-muted-foreground">{row.program} - {row.level}</p>
                              </div>
                              <Badge className={`text-[10px] ${empty ? "bg-rose-200 text-rose-900" : row.status === "achieved" ? "bg-emerald-100 text-emerald-800" : row.status === "partial" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                                {getStatusLabel(row.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Bulan</span><p>{row.months.join(" / ")}</p></div>
                              <div><span className="text-muted-foreground">Level</span><p>{row.level}</p></div>
                              <div><span className="text-muted-foreground">Awal</span><p>{empty ? "-" : row.startPage}</p></div>
                              <div><span className="text-muted-foreground">Akhir</span><p>{empty ? "-" : row.endPage}</p></div>
                              <div><span className="text-muted-foreground">Total</span><p className="font-semibold">{empty ? "-" : row.totalPages}</p></div>
                              <div><span className="text-muted-foreground">Target</span><p>{empty ? "-" : row.totalTarget}</p></div>
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
            </>
          )}

          {selectedMonths.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Silakan pilih bulan untuk menampilkan data
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Single Month Mode */}
      {!multiMonthMode && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total Siswa"
              value={stats.total}
              color="bg-blue-50 text-blue-700"
            />
            <StatCard
              icon={<ListChecks className="w-4 h-4" />}
              label="Sudah Diisi"
              value={stats.filled}
              color="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              icon={<FileWarning className="w-4 h-4" />}
              label="Belum Diisi"
              value={stats.empty}
              color="bg-rose-50 text-rose-700"
            />
            <StatCard
              icon={<Percent className="w-4 h-4" />}
              label="Kelengkapan"
              value={`${stats.completion}%`}
              color="bg-amber-50 text-amber-700"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Target Tercapai"
              value={`${stats.achievementRate}%`}
              color="bg-violet-50 text-violet-700"
            />
          </div>

          {stats.empty > 0 && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
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
                    className={`h-9 ${
                      filterStatus === "empty"
                        ? "border-rose-400 text-rose-700"
                        : filterStatus === "filled"
                        ? "border-emerald-400 text-emerald-700"
                        : ""
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="filled">✅ Sudah Diisi</SelectItem>
                    <SelectItem value="empty">Belum Diisi</SelectItem>
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
              <CardHeader className="bg-emerald-50 py-3">
                <CardTitle className="text-sm text-emerald-900">
                  Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
                  <Badge variant="outline" className="ml-2 bg-white">
                    {grp.rows.length} siswa
                  </Badge>
                  <Badge
                    variant="outline"
                    className="ml-1 bg-white text-rose-700 border-rose-200"
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
                                ? "bg-rose-50/60"
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
                                <Badge className="bg-emerald-100 text-emerald-800">
                                  Tercapai
                                </Badge>
                              )}
                              {row.status === "not_achieved" && (
                                <Badge variant="destructive">Belum</Badge>
                              )}
                              {empty && (
                                <Badge className="bg-rose-200 text-rose-900">
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
                      <div key={row.studentId} className={`p-3 space-y-2 ${empty ? "bg-rose-50/60" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{row.no}. {row.nama}</p>
                            <p className="text-xs text-muted-foreground">{row.program} - {row.level}</p>
                          </div>
                          <Badge className={`text-[10px] ${empty ? "bg-rose-200 text-rose-900" : row.status === "achieved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
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
        </>
      )}

      <Dialog open={previewOpen} onOpenChange={handlePreviewOpenChange}>
        <DialogContent className="max-w-6xl h-[92vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base">
              Preview PDF Rekap Laporan ({pdfPreviewSize.toUpperCase()} Landscape)
            </DialogTitle>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) => (
  <Card>
    <CardContent className="p-3">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

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
