import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { IQRO_LEVELS } from "@/hooks/useSupabaseData";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import type { Database } from "@/integrations/supabase/types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { removeBlockedNoteEmoticons } from "@/lib/noteValidation";

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

const loadImg = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      try { resolve(c.toDataURL("image/png")); } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

interface Props {
  reports: ReportWithStudent[];
}

const MonthlyReportExport = ({ reports }: Props) => {
  const { data: settings } = useInstitutionSettings();
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

  const buildRows = () =>
    filteredData
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
          Awal: r.start_page,
          Akhir: r.end_page,
          Total: r.pages_read,
          Target: r.target_pages,
          Status: r.achievement_status === "achieved" ? "Tercapai" : "Belum Tercapai",
          Catatan: removeBlockedNoteEmoticons(r.notes || "") || "-",
        };
      });

  const exportExcel = () => {
    setExporting(true);
    try {
      const rows = buildRows();
      if (rows.length === 0) { toast({ title: "Tidak ada data untuk di-export", variant: "destructive" }); setExporting(false); return; }
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 4 }, { wch: 25 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      const periodLabel = exportMonth !== "all" ? MONTH_NAMES[Number(exportMonth) - 1] : "Semua Bulan";
      const kelasLabel = exportKelas !== "all" ? `Kelas ${exportKelas}` : "Semua Kelas";
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");
      XLSX.writeFile(wb, `Rekap_Laporan_${kelasLabel}_${periodLabel}_${exportYear}.xlsx`);
      toast({ title: "File Excel berhasil di-download ✅" });
    } catch (e: any) {
      toast({ title: "Gagal export Excel", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const rows = buildRows();
      if (rows.length === 0) { toast({ title: "Tidak ada data untuk di-export", variant: "destructive" }); setExporting(false); return; }

      const [logo, ttdKoor, ttdKepsek] = await Promise.all([
        loadImg(settings?.logo_url || ""), loadImg(settings?.koordinator_ttd_url || ""), loadImg(settings?.kepsek_ttd_url || ""),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 12;
      const periodLabel = exportMonth !== "all" ? MONTH_NAMES[Number(exportMonth) - 1] : "Semua Bulan";
      const kelasLabel = exportKelas !== "all" ? `Kelas ${exportKelas}` : "Semua Kelas";
      const yearLabel = exportYear !== "all" ? exportYear : "Semua Tahun";

      // Header
      if (logo) { try { doc.addImage(logo, "PNG", M, M, 16, 16); } catch {} }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(22, 101, 52);
      doc.text((settings?.nama_lembaga || "Lembaga").toUpperCase(), pageW / 2, M + 5, { align: "center" });
      if (settings?.alamat) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
        doc.text(settings.alamat, pageW / 2, M + 10, { align: "center" });
      }
      doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.6);
      doc.line(M, M + 18, pageW - M, M + 18);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20);
      doc.text("REKAP LAPORAN BULANAN BACAAN AL-QUR'AN", pageW / 2, M + 23, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
      doc.text(`${kelasLabel} — ${periodLabel} ${yearLabel}`, pageW / 2, M + 28, { align: "center" });

      const achieved = rows.filter(r => r.Status === "Tercapai").length;
      const pct = rows.length > 0 ? Math.round((achieved / rows.length) * 100) : 0;
      doc.text(`Total: ${rows.length}  •  Tercapai: ${achieved} (${pct}%)  •  Belum: ${rows.length - achieved}`, pageW / 2, M + 33, { align: "center" });

      autoTable(doc, {
        startY: M + 37,
        head: [["No", "Nama", "Kelas", "Program", "Level", "Bulan", "Awal", "Akhir", "Total", "Target", "Status", "Catatan"]],
        body: rows.map(r => [r.No, r.Nama, r.Kelas, r.Program, r.Level, r.Bulan, r.Awal, r.Akhir, r.Total, r.Target, r.Status, r.Catatan]),
        styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "middle", lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [34, 87, 122], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: 38 }, 2: { cellWidth: 12, halign: "center" },
          3: { cellWidth: 26 }, 4: { cellWidth: 22 }, 5: { cellWidth: 24 },
          6: { cellWidth: 12, halign: "center" }, 7: { cellWidth: 12, halign: "center" },
          8: { cellWidth: 12, halign: "center", fontStyle: "bold" }, 9: { cellWidth: 12, halign: "center" },
          10: { cellWidth: 22, halign: "center", fontStyle: "bold" }, 11: { cellWidth: "auto" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 10) {
            data.cell.styles.textColor = data.cell.raw === "Tercapai" ? [16, 124, 65] : [185, 28, 28];
          }
        },
        margin: { left: M, right: M, bottom: 22 },
      });

      let cursorY = (doc as any).lastAutoTable.finalY + 6;
      const sigBlockH = 40;
      if (cursorY + sigBlockH > pageH - 14) { doc.addPage(); cursorY = M + 5; }
      const colW = (pageW - M * 2) / 2;
      const drawSig = (xC: number, label: string, nama: string, ttd: string | null) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(40);
        doc.text(label, xC, cursorY, { align: "center" });
        if (ttd) { try { doc.addImage(ttd, "PNG", xC - 18, cursorY + 3, 36, 16); } catch {} }
        doc.setDrawColor(120); doc.setLineWidth(0.2);
        doc.line(xC - 30, cursorY + 22, xC + 30, cursorY + 22);
        doc.setFont("helvetica", "bold"); doc.text(nama || "(.....................)", xC, cursorY + 27, { align: "center" });
      };
      drawSig(M + colW / 2, "Koordinator Tahfizh,", settings?.koordinator_nama || "", ttdKoor);
      drawSig(M + colW + colW / 2, "Mengetahui, Kepala Sekolah,", settings?.kepsek_nama || "", ttdKepsek);

      const totalPages = doc.getNumberOfPages();
      const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(220); doc.line(M, pageH - 10, pageW - M, pageH - 10);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
        doc.text(`Dicetak: ${today}`, M, pageH - 6);
        doc.text(`Halaman ${p} dari ${totalPages}`, pageW - M, pageH - 6, { align: "right" });
      }

      doc.save(`Rekap_Laporan_${kelasLabel}_${periodLabel}_${yearLabel}.pdf`);
      toast({ title: "File PDF berhasil di-download ✅" });
    } catch (e: any) {
      toast({ title: "Gagal export PDF", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Export Rekap Laporan Bulanan</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Kelas</Label>
            <Select value={exportKelas} onValueChange={setExportKelas}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {[1,2,3,4,5,6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
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
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tahun</Label>
              <Select value={exportYear} onValueChange={setExportYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {(years.length > 0 ? years : [2024,2025,2026]).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Data: <strong className="text-foreground">{filteredData.length}</strong> laporan
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={exportExcel} disabled={exporting || filteredData.length === 0} className="gap-2 flex-1">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />} Excel
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={exporting || filteredData.length === 0} className="gap-2 flex-1">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-red-600" />} PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportExport;
