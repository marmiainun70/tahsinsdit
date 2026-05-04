import { useState, useMemo, useRef } from "react";
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
import {
  Search, Loader2, Eye, Download, CheckCircle2,
  Users, ListChecks, AlertCircle, Percent, FileWarning, FileSpreadsheet
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const getProgramLabel = (level: string) => {
  if (IQRO_LEVELS.includes(level as ReadingLevel)) return "Tahsin Dasar (Iqra)";
  if (level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return level || "-";
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

  // Group per rombel: kelas-rombel
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
        const awal = rep.iqra_level
          ? `${rep.iqra_level} hal.${rep.start_page}`
          : (rep.program_type === "tahfizh" ? `Juz ? hal.${rep.start_page}` : String(rep.start_page));
        const akhir = (rep as any).end_iqra_level
          ? `${(rep as any).end_iqra_level} hal.${rep.end_page}`
          : (rep.program_type === "tahfizh" ? `Juz ? hal.${rep.end_page}` : String(rep.end_page));
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

  // Preload TTD/logo as base64 for PDF
  const loadImageAsBase64 = (url: string): Promise<string | null> =>
    new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL("image/png")); } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const exportPDF = async () => {
    if (displayGroups.length === 0) {
      toast({ title: "Tidak ada data untuk dicetak", variant: "destructive" });
      return;
    }
    if (stats.empty > 0) {
      toast({
        title: `⚠️ ${stats.empty} siswa belum diisi laporannya`,
        description: "PDF tetap akan diunduh, baris kosong tetap ditampilkan."
      });
    }

    const [logoB64, koordTtdB64, kepsekTtdB64] = await Promise.all([
      settings?.logo_url ? loadImageAsBase64(settings.logo_url) : Promise.resolve(null),
      settings?.koordinator_ttd_url ? loadImageAsBase64(settings.koordinator_ttd_url) : Promise.resolve(null),
      settings?.kepsek_ttd_url ? loadImageAsBase64(settings.kepsek_ttd_url) : Promise.resolve(null),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 12;
    const periodeStr = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;

    const drawHeader = () => {
      let y = M;
      if (logoB64) {
        try { doc.addImage(logoB64, "PNG", M, y, 16, 16); } catch {}
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(22, 101, 52);
      doc.text((settings?.nama_lembaga || "Lembaga").toUpperCase(), pageW / 2, y + 5, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
      if (settings?.alamat) doc.text(settings.alamat, pageW / 2, y + 10, { align: "center" });
      doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.6);
      doc.line(M, y + 18, pageW - M, y + 18);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(20);
      doc.text("REKAP LAPORAN BULANAN TAHSIN & TAHFIZH", pageW / 2, y + 23, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
      doc.text(`Periode: ${periodeStr}`, pageW / 2, y + 28, { align: "center" });
    };

    drawHeader();
    let cursorY = M + 32;

    displayGroups.forEach((grp) => {
      // Group header
      if (cursorY > pageH - 40) { doc.addPage(); drawHeader(); cursorY = M + 32; }
      doc.setFillColor(232, 245, 233);
      doc.rect(M, cursorY, pageW - 2 * M, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(27, 94, 32);
      doc.text(`Kelas ${grp.kelas} — Rombel ${grp.rombel}  (${grp.rows.length} siswa)`, M + 2, cursorY + 4.2);
      cursorY += 7;

      autoTable(doc, {
        startY: cursorY,
        head: [["No", "Nama", "Program", "Level", "Awal", "Akhir", "Total", "Target", "Status", "Guru", "Catatan"]],
        body: grp.rows.map((r) => [
          String(r.no),
          r.nama,
          r.program,
          r.level,
          r.awal,
          r.akhir,
          r.status === "empty" ? "-" : String(r.total),
          r.status === "empty" ? "-" : String(r.target),
          r.status === "achieved" ? "Tercapai" : r.status === "not_achieved" ? "Belum" : "BELUM DIISI",
          r.guru,
          r.catatan || "-",
        ]),
        styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "middle", lineColor: [220, 220, 220], lineWidth: 0.1, textColor: [30, 30, 30] },
        headStyles: { fillColor: [34, 87, 122], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 38 },
          2: { cellWidth: 26 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 12, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 12, halign: "center" },
          8: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          9: { cellWidth: 24 },
          10: { cellWidth: "auto" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 8) {
            const v = String(data.cell.raw);
            if (v === "Tercapai") data.cell.styles.textColor = [16, 124, 65];
            else if (v === "Belum") data.cell.styles.textColor = [185, 28, 28];
            else if (v === "BELUM DIISI") {
              data.cell.styles.textColor = [220, 38, 38];
              data.row.cells && Object.values(data.row.cells).forEach((c: any) => { c.styles.fillColor = [255, 235, 238]; });
            }
          }
        },
        margin: { left: M, right: M, bottom: 22 },
        didDrawPage: () => { /* header re-draw handled below */ },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    });

    // Tanda tangan di halaman terakhir
    const sigBlockH = 40;
    if (cursorY + sigBlockH > pageH - 14) { doc.addPage(); drawHeader(); cursorY = M + 34; }
    cursorY += 4;
    const colW = (pageW - M * 2) / 2;
    const sigY = cursorY;

    const drawSig = (xCenter: number, label: string, nama: string, ttd: string | null) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(40);
      doc.text(label, xCenter, sigY, { align: "center" });
      if (ttd) { try { doc.addImage(ttd, "PNG", xCenter - 18, sigY + 3, 36, 16); } catch {} }
      doc.setLineWidth(0.2); doc.setDrawColor(120);
      doc.line(xCenter - 30, sigY + 22, xCenter + 30, sigY + 22);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(nama || "(.....................)", xCenter, sigY + 27, { align: "center" });
    };
    drawSig(M + colW / 2, "Koordinator Tahfizh,", settings?.koordinator_nama || "", koordTtdB64);
    drawSig(M + colW + colW / 2, "Mengetahui, Kepala Sekolah,", settings?.kepsek_nama || "", kepsekTtdB64);

    // Footer semua halaman
    const totalPages = doc.getNumberOfPages();
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(220); doc.setLineWidth(0.2);
      doc.line(M, pageH - 10, pageW - M, pageH - 10);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`Dicetak: ${today}`, M, pageH - 6);
      doc.text(`Halaman ${p} dari ${totalPages}`, pageW - M, pageH - 6, { align: "right" });
    }

    const fname = `Rekap_Laporan_${MONTH_NAMES[Number(filterMonth) - 1]}_${filterYear}.pdf`;
    doc.save(fname);
    toast({ title: "PDF berhasil diunduh ✅" });
  };

  const exportExcel = () => {
    if (displayGroups.length === 0) {
      toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }
    const wb = XLSX.utils.book_new();
    const periode = `${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`;
    const headers = ["No", "Nama", "Kelas", "Rombel", "Program", "Level", "Awal", "Akhir", "Total", "Target", "Status", "Guru Pengisi", "Catatan"];

    // Sheet utama: semua rombel digabung dengan baris pemisah
    const aoa: any[][] = [];
    aoa.push([(settings?.nama_lembaga || "Lembaga").toUpperCase()]);
    if (settings?.alamat) aoa.push([settings.alamat]);
    aoa.push(["REKAP LAPORAN BULANAN TAHSIN & TAHFIZH"]);
    aoa.push([`Periode: ${periode}`]);
    aoa.push([]);

    displayGroups.forEach(grp => {
      aoa.push([`Kelas ${grp.kelas} — Rombel ${grp.rombel}`]);
      aoa.push(headers);
      grp.rows.forEach(r => {
        aoa.push([
          r.no, r.nama, r.kelas, r.rombel, r.program, r.level,
          r.awal, r.akhir,
          r.status === "empty" ? "" : r.total,
          r.status === "empty" ? "" : r.target,
          r.status === "achieved" ? "Tercapai" : r.status === "not_achieved" ? "Belum Tercapai" : "BELUM DIISI",
          r.guru, r.catatan || "",
        ]);
      });
      aoa.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Auto width
    const colWidths = headers.map((h, ci) => {
      let max = h.length;
      aoa.forEach(row => {
        const v = row[ci];
        if (v != null) max = Math.max(max, String(v).length);
      });
      return { wch: Math.min(Math.max(max + 2, 8), 50) };
    });
    ws["!cols"] = colWidths;

    // Bold headers (cells matching headers row content)
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellA = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      const isGroupHeader = cellA && typeof cellA.v === "string" && cellA.v.startsWith("Kelas ");
      const isHeaderRow = cellA && cellA.v === "No";
      const isTitle = R < 4;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;
        cell.s = cell.s || {};
        if (isTitle) {
          cell.s = { font: { bold: true, sz: R === 2 ? 12 : 11 }, alignment: { horizontal: "left" } };
        } else if (isGroupHeader) {
          cell.s = { font: { bold: true, color: { rgb: "1B5E20" } }, fill: { fgColor: { rgb: "E8F5E9" } } };
        } else if (isHeaderRow) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "22577A" } },
            alignment: { horizontal: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          };
        } else {
          cell.s = {
            alignment: { wrapText: true, vertical: "top" },
            border: { top: { style: "thin", color: { rgb: "CCCCCC" } }, bottom: { style: "thin", color: { rgb: "CCCCCC" } }, left: { style: "thin", color: { rgb: "CCCCCC" } }, right: { style: "thin", color: { rgb: "CCCCCC" } } },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Rekap");

    // Sheet tanda tangan
    const sigAoa: any[][] = [
      ["Tanda Tangan Resmi"],
      [],
      ["Koordinator Tahfizh", "", "", "Kepala Sekolah"],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
      [settings?.koordinator_nama || "(.....................)", "", "", settings?.kepsek_nama || "(.....................)"],
    ];
    const sigWs = XLSX.utils.aoa_to_sheet(sigAoa);
    sigWs["!cols"] = [{ wch: 30 }, { wch: 5 }, { wch: 5 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, sigWs, "Tanda Tangan");

    const fname = `Rekap_Laporan_${MONTH_NAMES[Number(filterMonth) - 1]}_${filterYear}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast({ title: "Excel berhasil diunduh ✅" });
  };

  if (ls || lr) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Rekap Laporan Bulanan</h1>
          <p className="text-sm text-muted-foreground">Tahsin Dasar, Tahsin Lanjutan & Tahfizh — siap export PDF resmi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4" /> Download Excel
          </Button>
          <Button className="gap-2" onClick={exportPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Siswa" value={stats.total} color="bg-blue-50 text-blue-700" />
        <StatCard icon={<ListChecks className="w-4 h-4" />} label="Sudah Diisi" value={stats.filled} color="bg-emerald-50 text-emerald-700" />
        <StatCard icon={<FileWarning className="w-4 h-4" />} label="Belum Diisi" value={stats.empty} color="bg-rose-50 text-rose-700" />
        <StatCard icon={<Percent className="w-4 h-4" />} label="Kelengkapan" value={`${stats.completion}%`} color="bg-amber-50 text-amber-700" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Target Tercapai" value={`${stats.achievementRate}%`} color="bg-violet-50 text-violet-700" />
      </div>

      {stats.empty > 0 && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Masih ada <strong>{stats.empty} siswa</strong> yang belum diisi laporannya untuk periode ini.</span>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 grid grid-cols-2 md:grid-cols-7 gap-2">
          <div className="col-span-2">
            <Label className="text-xs">Cari Siswa</Label>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-7 h-9" placeholder="Nama siswa..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Kelas</Label>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {[1,2,3,4,5,6].map(k => <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rombel</Label>
            <Select value={filterRombel} onValueChange={setFilterRombel}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {["A","B","C","D"].map(r => <SelectItem key={r} value={r}>Rombel {r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bulan</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tahun</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status Isi</Label>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className={`h-9 ${filterStatus === "empty" ? "border-rose-400 text-rose-700" : filterStatus === "filled" ? "border-emerald-400 text-emerald-700" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="filled">✅ Sudah Diisi</SelectItem>
                <SelectItem value="empty">⚠️ Belum Diisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tables grouped per rombel */}
      {displayGroups.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Tidak ada siswa pada filter ini.</CardContent></Card>
      )}
      {displayGroups.map(grp => (
        <Card key={`${grp.kelas}-${grp.rombel}`} className="overflow-hidden">
          <CardHeader className="bg-emerald-50 py-3">
            <CardTitle className="text-sm text-emerald-900">
              Kelas {grp.kelas} — Rombel {grp.rombel}{" "}
              <Badge variant="outline" className="ml-2 bg-white">{grp.rows.length} siswa</Badge>
              <Badge variant="outline" className="ml-1 bg-white text-rose-700 border-rose-200">{grp.rows.filter(r => r.status === "empty").length} belum diisi</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                      <tr key={row.studentId} className={`border-t ${empty ? "bg-rose-50/60" : "hover:bg-muted/40"}`}>
                        <td className="px-2 py-2">{row.no}</td>
                        <td className="px-2 py-2 font-medium">{highlight(row.nama, search)}</td>
                        <td className="px-2 py-2">{row.program}</td>
                        <td className="px-2 py-2"><Badge className={`text-[10px] ${LEVEL_COLORS[row.level as ReadingLevel] || ""}`}>{row.level}</Badge></td>
                        <td className="px-2 py-2 text-center">{row.awal}</td>
                        <td className="px-2 py-2 text-center">{row.akhir}</td>
                        <td className="px-2 py-2 text-center font-bold">{empty ? "-" : row.total}</td>
                        <td className="px-2 py-2 text-center">{empty ? "-" : row.target}</td>
                        <td className="px-2 py-2 text-center">
                          {row.status === "achieved" && <Badge className="bg-emerald-100 text-emerald-800">Tercapai</Badge>}
                          {row.status === "not_achieved" && <Badge variant="destructive">Belum</Badge>}
                          {empty && <Badge className="bg-rose-200 text-rose-900">Belum diisi</Badge>}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.guru}</td>
                        <td className="px-2 py-2 whitespace-pre-wrap text-muted-foreground">{row.catatan || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Preview Rekap Laporan</DialogTitle></DialogHeader>
          <div className="bg-white text-black p-6 border rounded-lg">
            <div className="flex items-center gap-3 border-b pb-3 mb-3">
              {settings?.logo_url && <img src={settings.logo_url} className="w-14 h-14 object-contain" />}
              <div className="flex-1 text-center">
                <h2 className="font-bold text-lg uppercase">{settings?.nama_lembaga || "Lembaga"}</h2>
                {settings?.alamat && <p className="text-xs">{settings.alamat}</p>}
                <p className="font-bold text-sm mt-2">REKAP LAPORAN BULANAN TAHSIN & TAHFIZH</p>
                <p className="text-xs">Periode: {MONTH_NAMES[Number(filterMonth) - 1]} {filterYear}</p>
              </div>
            </div>
            {displayGroups.map(grp => (
              <div key={`p-${grp.kelas}-${grp.rombel}`} className="mb-4">
                <div className="bg-emerald-100 px-2 py-1 font-bold text-xs">Kelas {grp.kelas} — Rombel {grp.rombel}</div>
                <table className="w-full text-[10px] border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      {["No","Nama","Program","Level","Awal","Akhir","Total","Target","Status","Guru","Catatan"].map(h => (
                        <th key={h} className="border border-gray-300 px-1 py-1 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grp.rows.map(r => (
                      <tr key={r.studentId} className={r.status === "empty" ? "bg-rose-50" : ""}>
                        <td className="border border-gray-300 px-1 py-1">{r.no}</td>
                        <td className="border border-gray-300 px-1 py-1">{r.nama}</td>
                        <td className="border border-gray-300 px-1 py-1">{r.program}</td>
                        <td className="border border-gray-300 px-1 py-1">{r.level}</td>
                        <td className="border border-gray-300 px-1 py-1">{r.awal}</td>
                        <td className="border border-gray-300 px-1 py-1">{r.akhir}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{r.status === "empty" ? "-" : r.total}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{r.status === "empty" ? "-" : r.target}</td>
                        <td className={`border border-gray-300 px-1 py-1 font-bold ${r.status === "achieved" ? "text-emerald-700" : "text-rose-700"}`}>
                          {r.status === "achieved" ? "Tercapai" : r.status === "not_achieved" ? "Belum" : "BELUM DIISI"}
                        </td>
                        <td className="border border-gray-300 px-1 py-1">{r.guru}</td>
                        <td className="border border-gray-300 px-1 py-1 whitespace-pre-wrap">{r.catatan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-6 mt-8 text-xs">
              <div className="text-center">
                <p>Koordinator Tahfizh,</p>
                {settings?.koordinator_ttd_url && <img src={settings.koordinator_ttd_url} className="h-12 mx-auto my-1" />}
                {!settings?.koordinator_ttd_url && <div className="h-14"></div>}
                <p className="border-t border-gray-400 pt-1 font-bold">{settings?.koordinator_nama || "(.....................)"}</p>
              </div>
              <div className="text-center">
                <p>Mengetahui, Kepala Sekolah,</p>
                {settings?.kepsek_ttd_url && <img src={settings.kepsek_ttd_url} className="h-12 mx-auto my-1" />}
                {!settings?.kepsek_ttd_url && <div className="h-14"></div>}
                <p className="border-t border-gray-400 pt-1 font-bold">{settings?.kepsek_nama || "(.....................)"}</p>
              </div>
            </div>
          </div>
          <Button onClick={exportPDF} className="gap-2 w-full mt-3">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) => (
  <Card>
    <CardContent className="p-3">
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const highlight = (text: string, q: string) => {
  if (!q.trim()) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) => re.test(p) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{p}</mark> : <span key={i}>{p}</span>);
};

export default RecapReport;
