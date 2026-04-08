import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { LEVEL_COLORS, IQRO_LEVELS } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

interface ReportWithStudent {
  id: string;
  student_id: string;
  month: number;
  year: number;
  program_type: string;
  iqra_level: string | null;
  start_page: number;
  end_page: number;
  pages_read: number;
  target_pages: number;
  achievement_status: string;
  notes: string | null;
  students: { nama: string; kelas: number; rombel: string; level: string };
}

const getProgramLabel = (level: string) => {
  if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level;
};

interface Props {
  reports: ReportWithStudent[];
}

const MonthlyReportExport = ({ reports }: Props) => {
  const [open, setOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>("all");
  const [exportYear, setExportYear] = useState<string>(String(new Date().getFullYear()));
  const [exportKelas, setExportKelas] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const filteredData = reports.filter(r => {
    const st = r.students;
    if (!st) return false;
    if (exportMonth !== "all" && r.month !== Number(exportMonth)) return false;
    if (exportYear !== "all" && r.year !== Number(exportYear)) return false;
    if (exportKelas !== "all" && st.kelas !== Number(exportKelas)) return false;
    return true;
  });

  const years = [...new Set(reports.map(r => r.year))].sort((a, b) => b - a);

  const buildRows = () => {
    return filteredData
      .sort((a, b) => {
        const sa = a.students, sb = b.students;
        return sa.kelas - sb.kelas || sa.rombel.localeCompare(sb.rombel) || sa.nama.localeCompare(sb.nama);
      })
      .map((r, i) => {
        const st = r.students;
        return {
          No: i + 1,
          Nama: st.nama,
          Kelas: `${st.kelas}${st.rombel}`,
          Program: getProgramLabel(st.level),
          Level: st.level,
          Bulan: `${MONTH_NAMES[r.month - 1]} ${r.year}`,
          "Hal. Awal": r.start_page,
          "Hal. Akhir": r.end_page,
          "Total Halaman": r.pages_read,
          Target: r.target_pages,
          Status: r.achievement_status === "achieved" ? "Tercapai" : "Belum Tercapai",
          Catatan: r.notes || "-",
        };
      });
  };

  const exportExcel = () => {
    setExporting(true);
    try {
      const rows = buildRows();
      if (rows.length === 0) {
        toast({ title: "Tidak ada data untuk di-export", variant: "destructive" });
        setExporting(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      ws["!cols"] = [
        { wch: 4 }, { wch: 25 }, { wch: 8 }, { wch: 18 }, { wch: 14 },
        { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 13 }, { wch: 8 },
        { wch: 15 }, { wch: 25 },
      ];

      const wb = XLSX.utils.book_new();
      const periodLabel = exportMonth !== "all" ? MONTH_NAMES[Number(exportMonth) - 1] : "Semua Bulan";
      const kelasLabel = exportKelas !== "all" ? `Kelas ${exportKelas}` : "Semua Kelas";
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");

      const fileName = `Rekap_Laporan_Bulanan_${kelasLabel}_${periodLabel}_${exportYear}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast({ title: `File Excel berhasil di-download ✅` });
    } catch (e: any) {
      toast({ title: "Gagal export Excel", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const rows = buildRows();
      if (rows.length === 0) {
        toast({ title: "Tidak ada data untuk di-export", variant: "destructive" });
        setExporting(false);
        return;
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;

      const periodLabel = exportMonth !== "all" ? MONTH_NAMES[Number(exportMonth) - 1] : "Semua Bulan";
      const kelasLabel = exportKelas !== "all" ? `Kelas ${exportKelas}` : "Semua Kelas";
      const yearLabel = exportYear !== "all" ? exportYear : "Semua Tahun";

      // Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("REKAP LAPORAN BULANAN BACAAN AL-QUR'AN", pageW / 2, margin + 5, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${kelasLabel} — ${periodLabel} ${yearLabel}`, pageW / 2, margin + 12, { align: "center" });

      // Stats summary
      const achieved = rows.filter(r => r.Status === "Tercapai").length;
      const notAchieved = rows.length - achieved;
      const pct = rows.length > 0 ? Math.round((achieved / rows.length) * 100) : 0;
      doc.setFontSize(9);
      doc.text(`Total Siswa: ${rows.length}   |   Tercapai: ${achieved} (${pct}%)   |   Belum Tercapai: ${notAchieved}`, pageW / 2, margin + 18, { align: "center" });

      // Table
      const headers = ["No", "Nama", "Kelas", "Program", "Level", "Bulan", "Awal", "Akhir", "Total", "Target", "Status", "Catatan"];
      const colWidths = [8, 38, 12, 28, 22, 26, 12, 12, 12, 12, 22, pageW - 2 * margin - 204];

      let y = margin + 24;
      const rowH = 7;
      const headerH = 8;

      const drawHeader = () => {
        doc.setFillColor(34, 87, 122);
        doc.rect(margin, y, pageW - 2 * margin, headerH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        let x = margin;
        headers.forEach((h, i) => {
          doc.text(h, x + 1.5, y + 5.5);
          x += colWidths[i];
        });
        y += headerH;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      };

      drawHeader();

      rows.forEach((row, idx) => {
        if (y + rowH > pageH - 15) {
          // Footer
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(`Halaman ${doc.getNumberOfPages()}`, pageW - margin, pageH - 5, { align: "right" });
          doc.addPage();
          y = margin + 5;
          doc.setTextColor(0, 0, 0);
          drawHeader();
        }

        // Alternate row bg
        if (idx % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
        }

        // Status color
        const isAchieved = row.Status === "Tercapai";

        doc.setFontSize(7);
        let x = margin;
        const vals = [
          String(row.No), row.Nama, row.Kelas, row.Program, row.Level,
          row.Bulan, String(row["Hal. Awal"]), String(row["Hal. Akhir"]),
          String(row["Total Halaman"]), String(row.Target), row.Status,
          (row.Catatan || "").substring(0, 30),
        ];

        vals.forEach((v, i) => {
          if (i === 10) {
            doc.setTextColor(isAchieved ? 16 : 185, isAchieved ? 124 : 28, isAchieved ? 65 : 28);
            doc.setFont("helvetica", "bold");
          }
          doc.text(v, x + 1.5, y + 5);
          if (i === 10) {
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
          }
          x += colWidths[i];
        });

        y += rowH;
      });

      // Final footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Halaman ${doc.getNumberOfPages()}`, pageW - margin, pageH - 5, { align: "right" });
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, margin, pageH - 5);

      // Signature area
      y += 10;
      if (y + 30 > pageH - 15) {
        doc.addPage();
        y = margin + 10;
      }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text("Mengetahui,", pageW - margin - 60, y);
      doc.text("Kepala Sekolah", pageW - margin - 60, y + 5);
      doc.text("_____________________", pageW - margin - 60, y + 25);

      doc.text("Guru Tahsin", margin + 10, y);
      doc.text("_____________________", margin + 10, y + 25);

      const fileName = `Rekap_Laporan_Bulanan_${kelasLabel}_${periodLabel}_${yearLabel}.pdf`;
      doc.save(fileName);
      toast({ title: `File PDF berhasil di-download ✅` });
    } catch (e: any) {
      toast({ title: "Gagal export PDF", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Rekap Laporan Bulanan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Kelas</Label>
            <Select value={exportKelas} onValueChange={setExportKelas}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {[1, 2, 3, 4, 5, 6].map(k => (
                  <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bulan</Label>
              <Select value={exportMonth} onValueChange={setExportMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {MONTH_NAMES.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tahun</Label>
              <Select value={exportYear} onValueChange={setExportYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {(years.length > 0 ? years : [2024, 2025, 2026]).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Data yang akan di-export: <strong className="text-foreground">{filteredData.length}</strong> laporan
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={exportExcel}
            disabled={exporting || filteredData.length === 0}
            className="gap-2 flex-1"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            disabled={exporting || filteredData.length === 0}
            className="gap-2 flex-1"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-red-600" />}
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportExport;
