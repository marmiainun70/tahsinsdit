import { useRef, useState, useCallback } from "react";
import type { TahsinAssessment } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ProgressEntry = Database["public"]["Tables"]["progress_entries"]["Row"];
type ExamRecord = Database["public"]["Tables"]["exam_records"]["Row"];

export const useExportPDF = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPDF = useCallback(
    async (student: Student, _progres: ProgressEntry[], _ujian: ExamRecord[], _tahsinData: TahsinAssessment[]) => {
      if (!reportRef.current) return;
      setExporting(true);
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);

        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: 794,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspect = canvas.height / canvas.width;
        const imgHeight = pdfWidth * canvasAspect;

        // Multi-page support
        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
        } else {
          let yOffset = 0;
          let remaining = imgHeight;
          while (remaining > 0) {
            const sliceHeight = Math.min(pdfHeight, remaining);
            const srcY = yOffset * (canvas.height / imgHeight);
            const srcHeight = sliceHeight * (canvas.height / imgHeight);

            const pageCanvas = document.createElement("canvas");
            pageCanvas.width = canvas.width;
            pageCanvas.height = srcHeight;
            const ctx = pageCanvas.getContext("2d")!;
            ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

            const pageImg = pageCanvas.toDataURL("image/png");
            if (yOffset > 0) pdf.addPage();
            pdf.addImage(pageImg, "PNG", 0, 0, pdfWidth, sliceHeight);

            yOffset += sliceHeight;
            remaining -= sliceHeight;
          }
        }

        const safeName = student.nama.replace(/[^a-z0-9]/gi, "_");
        pdf.save(`Laporan_${safeName}_Kelas${student.kelas}.pdf`);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { reportRef, exporting, exportPDF };
};
