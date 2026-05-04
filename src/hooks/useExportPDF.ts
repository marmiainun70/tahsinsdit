import { useRef, useState, useCallback } from "react";
import type { TahsinAssessment } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ProgressEntry = Database["public"]["Tables"]["progress_entries"]["Row"];
type ExamRecord = Database["public"]["Tables"]["exam_records"]["Row"];

const MATERI_LABELS: Record<string, string> = {
  makhraj_huruf: "Makhraj",
  hukum_nun_mati: "Nun Mati",
  hukum_mim_mati: "Mim Mati",
  mad: "Mad",
  tartil: "Tartil",
};

/**
 * Native PDF export — jsPDF + jspdf-autotable.
 * No html2canvas, no HTML rendering. Presisi, multi-page, A4 portrait.
 */
export const useExportPDF = () => {
  // reportRef tetap ada untuk backwards-compatibility (komponen lama masih pasang ref)
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPDF = useCallback(
    async (
      student: Student,
      progres: ProgressEntry[],
      ujian: ExamRecord[],
      tahsinData: TahsinAssessment[]
    ) => {
      setExporting(true);
      try {
        const [{ default: jsPDF }, autoTableMod] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = (autoTableMod as any).default || (autoTableMod as any);

        // Ambil pengaturan lembaga (logo, ttd) — opsional
        let institution: any = null;
        try {
          const { data } = await (supabase as any)
            .from("institution_settings")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          institution = data ?? null;
        } catch {}

        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();   // 210
        const pageH = doc.internal.pageSize.getHeight();  // 297
        const M = 12; // margin profesional ~12mm
        const today = new Date().toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric",
        });

        // ── Helper: load image as dataURL ──
        const loadImage = async (url: string): Promise<{ data: string; w: number; h: number } | null> => {
          if (!url) return null;
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const dataUrl: string = await new Promise((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = reject;
              r.readAsDataURL(blob);
            });
            const dim = await new Promise<{ w: number; h: number }>((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.width, h: img.height });
              img.onerror = () => resolve({ w: 1, h: 1 });
              img.src = dataUrl;
            });
            return { data: dataUrl, w: dim.w, h: dim.h };
          } catch {
            return null;
          }
        };

        const [logo, ttdKoor, ttdKepsek] = await Promise.all([
          loadImage(institution?.logo_url || ""),
          loadImage(institution?.koordinator_ttd_url || ""),
          loadImage(institution?.kepsek_ttd_url || ""),
        ]);

        // ── HEADER (halaman pertama saja) ──
        let cursorY = M;
        const namaLembaga = institution?.nama_lembaga || "Laporan Perkembangan Siswa";
        const alamat = institution?.alamat || "";

        if (logo) {
          const lh = 18;
          const lw = (logo.w / logo.h) * lh;
          doc.addImage(logo.data, "PNG", M, cursorY, lw, lh, undefined, "FAST");
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(22, 101, 52);
        doc.text(namaLembaga, pageW / 2, cursorY + 6, { align: "center" });

        if (alamat) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(alamat, pageW / 2, cursorY + 11, { align: "center" });
        }

        doc.setDrawColor(217, 119, 6);
        doc.setLineWidth(0.6);
        doc.line(M, cursorY + 20, pageW - M, cursorY + 20);
        cursorY += 24;

        // Judul laporan
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text("LAPORAN PERKEMBANGAN SISWA", pageW / 2, cursorY, { align: "center" });
        cursorY += 6;

        // ── Identitas siswa (tabel 2 kolom) ──
        const levelDisplay = student.level.startsWith("Iqro")
          ? `Tahsin Dasar — ${student.level}`
          : student.level;

        autoTable(doc, {
          startY: cursorY,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: 1.2, textColor: [30, 30, 30], overflow: "linebreak" },
          columnStyles: {
            0: { cellWidth: 28, fontStyle: "bold" },
            1: { cellWidth: 70 },
            2: { cellWidth: 28, fontStyle: "bold" },
            3: { cellWidth: "auto" },
          },
          body: [
            ["Nama", student.nama, "Kelas", String(student.kelas)],
            ["Rombel", String((student as any).rombel ?? "A"), "Level", levelDisplay],
            ["Halaman", String(student.halaman_terakhir ?? "-"), "Tanggal", today],
          ],
          margin: { left: M, right: M },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 4;

        // ── Section helper ──
        const section = (title: string) => {
          if (cursorY > pageH - 40) { doc.addPage(); cursorY = M; }
          doc.setFillColor(22, 101, 52);
          doc.rect(M, cursorY, pageW - M * 2, 6, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(title, M + 2, cursorY + 4.2);
          cursorY += 8;
          doc.setTextColor(20, 20, 20);
        };

        const tableHead = (rgb: [number, number, number]) => ({
          fillColor: rgb,
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: "bold" as const,
          halign: "center" as const,
          fontSize: 8,
        });

        // ── Riwayat Progres ──
        if (progres.length > 0) {
          section("Riwayat Progres Belajar");
          autoTable(doc, {
            startY: cursorY,
            head: [["Tanggal", "Buku/Level", "Hal", "Kelancaran", "Makhraj", "Tajwid", "Catatan"]],
            body: progres.slice(0, 20).map((p) => [
              p.tanggal,
              p.buku.startsWith("Iqro") ? `TD — ${p.buku}` : p.buku,
              String(p.halaman),
              String(p.kelancaran),
              String(p.makhraj),
              String(p.tajwid),
              p.catatan || "—",
            ]),
            styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", valign: "middle", lineColor: [220, 220, 220], lineWidth: 0.1 },
            headStyles: tableHead([2, 132, 199]),
            alternateRowStyles: { fillColor: [245, 250, 255] },
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 30 },
              2: { cellWidth: 12, halign: "center" },
              3: { cellWidth: 20, halign: "center" },
              4: { cellWidth: 18, halign: "center" },
              5: { cellWidth: 18, halign: "center" },
              6: { cellWidth: "auto" },
            },
            margin: { left: M, right: M, bottom: 22 },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 4;
        }

        // ── Tahsin ──
        if (tahsinData.length > 0) {
          section("Penilaian Tahsin");
          autoTable(doc, {
            startY: cursorY,
            head: [["Tanggal", "Level", ...Object.values(MATERI_LABELS), "Total", "Predikat"]],
            body: tahsinData.slice(0, 15).map((t) => [
              t.tanggal,
              t.level_dinilai,
              String(t.makhraj_huruf),
              String(t.hukum_nun_mati),
              String(t.hukum_mim_mati),
              String(t.mad),
              String(t.tartil),
              String(t.nilai_total),
              t.predikat,
            ]),
            styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", valign: "middle", lineColor: [220, 220, 220], lineWidth: 0.1 },
            headStyles: tableHead([217, 119, 6]),
            alternateRowStyles: { fillColor: [255, 251, 235] },
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 28 },
              2: { halign: "center" },
              3: { halign: "center" },
              4: { halign: "center" },
              5: { halign: "center" },
              6: { halign: "center" },
              7: { halign: "center", fontStyle: "bold" },
              8: { halign: "center" },
            },
            margin: { left: M, right: M, bottom: 22 },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 4;
        }

        // ── Ujian ──
        if (ujian.length > 0) {
          section("Riwayat Ujian Kenaikan Level");
          autoTable(doc, {
            startY: cursorY,
            head: [["Tanggal", "Dari", "Ke", "Hasil", "Nilai", "Penguji"]],
            body: ujian.slice(0, 15).map((u: any) => [
              u.tanggal,
              u.level_dari || "—",
              u.level_ke || "—",
              u.hasil,
              u.nilai != null ? String(u.nilai) : "—",
              u.penguji || "—",
            ]),
            styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", lineColor: [220, 220, 220], lineWidth: 0.1 },
            headStyles: tableHead([124, 58, 237]),
            alternateRowStyles: { fillColor: [248, 245, 255] },
            columnStyles: {
              0: { cellWidth: 22 },
              3: { halign: "center", fontStyle: "bold" },
              4: { halign: "center" },
            },
            margin: { left: M, right: M, bottom: 22 },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 4;
        }

        // ── Tanda tangan (di halaman terakhir) ──
        const sigBlockH = 38;
        if (cursorY + sigBlockH > pageH - 22) {
          doc.addPage();
          cursorY = M;
        } else {
          cursorY = Math.max(cursorY + 6, pageH - 22 - sigBlockH);
        }

        const colW = (pageW - M * 2) / 2;
        const sigY = cursorY;

        const drawSig = (
          xCenter: number,
          label: string,
          nama: string,
          ttd: { data: string; w: number; h: number } | null
        ) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(40, 40, 40);
          doc.text(label, xCenter, sigY, { align: "center" });
          if (ttd) {
            const h = 16;
            const w = Math.min(40, (ttd.w / ttd.h) * h);
            doc.addImage(ttd.data, "PNG", xCenter - w / 2, sigY + 4, w, h, undefined, "FAST");
          }
          doc.setLineWidth(0.2);
          doc.setDrawColor(120, 120, 120);
          doc.line(xCenter - 28, sigY + 24, xCenter + 28, sigY + 24);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(nama || "(_______________)", xCenter, sigY + 29, { align: "center" });
        };

        drawSig(
          M + colW / 2,
          "Koordinator Tahfizh",
          institution?.koordinator_nama || "",
          ttdKoor
        );
        drawSig(
          M + colW + colW / 2,
          "Kepala Sekolah",
          institution?.kepsek_nama || "",
          ttdKepsek
        );

        // ── Footer di semua halaman ──
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(M, pageH - 10, pageW - M, pageH - 10);
          doc.text(`Dicetak: ${today}`, M, pageH - 6);
          doc.text(`Halaman ${i} dari ${totalPages}`, pageW - M, pageH - 6, { align: "right" });
        }

        const safeName = student.nama.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        doc.save(`Laporan_${safeName}_Kelas_${student.kelas}.pdf`);
      } catch (e) {
        console.error("Gagal export PDF:", e);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { reportRef, exporting, exportPDF };
};
