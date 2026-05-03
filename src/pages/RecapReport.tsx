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
    const margin = 10;

    const drawHeader = () => {
      let cursorY = margin;
      if (logoB64) {
        try { doc.addImage(logoB64, "PNG", margin, cursorY, 18, 18); } catch {}
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text((settings?.nama_lembaga || "Lembaga").toUpperCase(), pageW / 2, cursorY + 6, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      if (settings?.alamat) doc.text(settings.alamat, pageW / 2, cursorY + 11, { align: "center" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text("REKAP LAPORAN BULANAN TAHSIN & TAHFIZH", pageW / 2, cursorY + 18, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(`Periode: ${MONTH_NAMES[Number(filterMonth) - 1]} ${filterYear}`, pageW / 2, cursorY + 23, { align: "center" });
      doc.setDrawColor(180); doc.line(margin, cursorY + 27, pageW - margin, cursorY + 27);
      return cursorY + 30;
    };

    let y = drawHeader();
    const headers = ["No", "Nama", "Program", "Level", "Awal", "Akhir", "Total", "Target", "Status", "Guru", "Catatan"];
    const colW = [8, 38, 26, 22, 22, 22, 12, 12, 18, 26, pageW - 2 * margin - 206];
    const rowH = 6;
    const headerH = 7;

    const drawTableHeader = () => {
      doc.setFillColor(34, 87, 122);
      doc.rect(margin, y, pageW - 2 * margin, headerH, "F");
      doc.setTextColor(255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      let x = margin;
      headers.forEach((h, i) => { doc.text(h, x + 1.5, y + 5); x += colW[i]; });
      y += headerH;
      doc.setTextColor(0); doc.setFont("helvetica", "normal");
    };

    const ensureSpace = (need: number) => {
      if (y + need > pageH - 18) {
        doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Hal. ${doc.getNumberOfPages()}`, pageW - margin, pageH - 5, { align: "right" });
        doc.addPage(); y = drawHeader(); doc.setTextColor(0);
      }
    };

    displayGroups.forEach(grp => {
      ensureSpace(12);
      doc.setFillColor(232, 245, 233);
      doc.rect(margin, y, pageW - 2 * margin, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(27, 94, 32);
      doc.text(`Kelas ${grp.kelas} — Rombel ${grp.rombel}`, margin + 2, y + 4.2);
      doc.setTextColor(0); y += 7;
      drawTableHeader();

      grp.rows.forEach((row, idx) => {
        // Estimate height by catatan length
        const catatanLines = doc.splitTextToSize(row.catatan || "-", colW[10] - 2);
        const dynH = Math.max(rowH, catatanLines.length * 3.2 + 2.5);
        ensureSpace(dynH);

        if (row.status === "empty") {
          doc.setFillColor(255, 235, 238);
          doc.rect(margin, y, pageW - 2 * margin, dynH, "F");
        } else if (idx % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, y, pageW - 2 * margin, dynH, "F");
        }

        doc.setFontSize(7); doc.setFont("helvetica", "normal");
        let x = margin;
        const vals = [
          String(row.no), row.nama, row.program, row.level,
          row.awal, row.akhir, String(row.total || "-"), String(row.target || "-"),
          row.status === "achieved" ? "Tercapai" : row.status === "not_achieved" ? "Belum" : "BELUM DIISI",
          row.guru, "",
        ];
        vals.forEach((v, i) => {
          if (i === 8) {
            if (row.status === "achieved") doc.setTextColor(16, 124, 65);
            else if (row.status === "not_achieved") doc.setTextColor(185, 28, 28);
            else doc.setTextColor(220, 38, 38);
            doc.setFont("helvetica", "bold");
          }
          const truncated = i === 1 || i === 9 ? v.substring(0, 28) : v;
          doc.text(truncated, x + 1.5, y + 4);
          if (i === 8) { doc.setTextColor(0); doc.setFont("helvetica", "normal"); }
          x += colW[i];
        });
        // Catatan multi-line
        doc.text(catatanLines, margin + colW.slice(0, 10).reduce((a, b) => a + b, 0) + 1.5, y + 4);
        y += dynH;
      });
      y += 2;
    });

    // Footer signatures (last page)
    ensureSpace(40);
    y += 5;
    doc.setFontSize(8); doc.setTextColor(80);
    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    doc.text(`Dicetak: ${dateStr}`, margin, y);
    y += 8;
    doc.setTextColor(0); doc.setFontSize(9);

    const sigW = 70;
    const sigKoordX = margin + 10;
    const sigKepsekX = pageW - margin - sigW - 10;
    doc.text("Koordinator Tahfizh,", sigKoordX, y);
    doc.text("Mengetahui, Kepala Sekolah,", sigKepsekX, y);

    if (koordTtdB64) {
      try { doc.addImage(koordTtdB64, "PNG", sigKoordX, y + 2, 32, 18); } catch {}
    }
    if (kepsekTtdB64) {
      try { doc.addImage(kepsekTtdB64, "PNG", sigKepsekX, y + 2, 32, 18); } catch {}
    }

    doc.line(sigKoordX, y + 22, sigKoordX + sigW, y + 22);
    doc.line(sigKepsekX, y + 22, sigKepsekX + sigW, y + 22);
    doc.setFont("helvetica", "bold");
    doc.text(settings?.koordinator_nama || "(.....................)", sigKoordX, y + 27);
    doc.text(settings?.kepsek_nama || "(.....................)", sigKepsekX, y + 27);
    doc.setFont("helvetica", "normal");

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(`Hal. ${p} / ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
    }

    const fname = `Rekap_Laporan_${MONTH_NAMES[Number(filterMonth) - 1]}_${filterYear}.pdf`;
    doc.save(fname);
    toast({ title: "PDF berhasil diunduh ✅" });
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
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4" /> Preview Laporan
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
        <CardContent className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2">
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
