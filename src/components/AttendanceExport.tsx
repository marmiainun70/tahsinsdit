import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText } from "lucide-react";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AttRow {
  id: string;
  month: number;
  year: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  students?: { nama: string; kelas: number; rombel: string };
}

const loadImg = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d"); if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      try { resolve(c.toDataURL("image/png")); } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

interface Props {
  attendance: AttRow[];
  label?: string;
}

const AttendanceExport = ({ attendance, label = "Riwayat Absensi" }: Props) => {
  const { data: settings } = useInstitutionSettings();

  const buildRows = () =>
    [...attendance]
      .sort((a, b) => {
        const sa = a.students, sb = b.students;
        if (!sa || !sb) return 0;
        return sa.kelas - sb.kelas || sa.rombel.localeCompare(sb.rombel) || sa.nama.localeCompare(sb.nama);
      })
      .map((a, i) => ({
        No: i + 1,
        Nama: a.students?.nama ?? "-",
        Kelas: `${a.students?.kelas ?? "-"}${a.students?.rombel ?? ""}`,
        Bulan: `${MONTH_NAMES[a.month - 1]} ${a.year}`,
        Hadir: a.present,
        Sakit: a.sick,
        Izin: a.permission,
        Alfa: a.absent,
        Total: a.present + a.sick + a.permission + a.absent,
      }));

  const exportExcel = () => {
    const rows = buildRows();
    if (rows.length === 0) { toast({ title: "Tidak ada data", variant: "destructive" }); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 25 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
    XLSX.writeFile(wb, `Riwayat_Absensi_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: "Excel diunduh ✅" });
  };

  const exportPDF = async () => {
    const rows = buildRows();
    if (rows.length === 0) { toast({ title: "Tidak ada data", variant: "destructive" }); return; }
    const [logo, ttdKoor, ttdKepsek] = await Promise.all([
      loadImg(settings?.logo_url || ""), loadImg(settings?.koordinator_ttd_url || ""), loadImg(settings?.kepsek_ttd_url || ""),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 12;

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
    doc.text(label.toUpperCase(), pageW / 2, M + 23, { align: "center" });

    autoTable(doc, {
      startY: M + 28,
      head: [["No", "Nama", "Kelas", "Bulan", "Hadir", "Sakit", "Izin", "Alfa", "Total"]],
      body: rows.map(r => [r.No, r.Nama, r.Kelas, r.Bulan, r.Hadir, r.Sakit, r.Izin, r.Alfa, r.Total]),
      styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "middle", lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [34, 87, 122], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: 50 }, 2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 28 }, 4: { cellWidth: 14, halign: "center" }, 5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 14, halign: "center" }, 7: { cellWidth: 14, halign: "center" }, 8: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          if (data.column.index === 4) data.cell.styles.textColor = [16, 124, 65];
          else if (data.column.index === 5) data.cell.styles.textColor = [180, 100, 0];
          else if (data.column.index === 6) data.cell.styles.textColor = [30, 80, 180];
          else if (data.column.index === 7) data.cell.styles.textColor = [185, 28, 28];
        }
      },
      margin: { left: M, right: M, bottom: 22 },
    });

    let cursorY = (doc as any).lastAutoTable.finalY + 6;
    if (cursorY + 40 > pageH - 14) { doc.addPage(); cursorY = M + 5; }
    const colW = (pageW - M * 2) / 2;
    const drawSig = (xC: number, lbl: string, nama: string, ttd: string | null) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(40);
      doc.text(lbl, xC, cursorY, { align: "center" });
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

    doc.save(`Riwayat_Absensi_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "PDF diunduh ✅" });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportExcel} className="gap-1 h-8 text-xs">
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1 h-8 text-xs">
        <FileText className="w-3.5 h-3.5 text-red-600" /> PDF
      </Button>
    </div>
  );
};

export default AttendanceExport;
