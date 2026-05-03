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
    async (
      student: Student,
      _progres: ProgressEntry[],
      _ujian: ExamRecord[],
      _tahsinData: TahsinAssessment[]
    ) => {
      if (!reportRef.current) return;
      setExporting(true);

      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);

        const element = reportRef.current;

        // Tunggu render selesai
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Ukuran A4 (px) & margin
        const A4_WIDTH = 794;
        const A4_HEIGHT = 1123;
        const MARGIN = 24;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: -window.scrollY,
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4",
          compress: true,
        });

        const printableWidth = A4_WIDTH - MARGIN * 2;
        const printableHeight = A4_HEIGHT - MARGIN * 2;

        const finalImageHeight =
          (canvas.height * printableWidth) / canvas.width;

        if (finalImageHeight <= printableHeight) {
          const imageData = canvas.toDataURL("image/jpeg", 1.0);
          pdf.addImage(
            imageData,
            "JPEG",
            MARGIN,
            MARGIN,
            printableWidth,
            finalImageHeight,
            undefined,
            "FAST"
          );
        } else {
          // Multi page
          const pageCanvas = document.createElement("canvas");
          const pageContext = pageCanvas.getContext("2d");
          if (!pageContext) throw new Error("Canvas context tidak tersedia");

          const pageHeightInCanvas =
            (printableHeight * canvas.width) / printableWidth;

          let renderedHeight = 0;
          let pageIndex = 0;

          while (renderedHeight < canvas.height) {
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(
              pageHeightInCanvas,
              canvas.height - renderedHeight
            );

            pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageContext.drawImage(
              canvas,
              0,
              renderedHeight,
              canvas.width,
              pageCanvas.height,
              0,
              0,
              canvas.width,
              pageCanvas.height
            );

            const pageData = pageCanvas.toDataURL("image/jpeg", 1.0);
            const pageImageHeight =
              (pageCanvas.height * printableWidth) / pageCanvas.width;

            if (pageIndex > 0) pdf.addPage();

            pdf.addImage(
              pageData,
              "JPEG",
              MARGIN,
              MARGIN,
              printableWidth,
              pageImageHeight,
              undefined,
              "FAST"
            );

            renderedHeight += pageHeightInCanvas;
            pageIndex++;
          }
        }

        const safeName = student.nama
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

        pdf.save(`Laporan_${safeName}_Kelas_${student.kelas}.pdf`);
      } catch (error) {
        console.error("Gagal export PDF:", error);
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { reportRef, exporting, exportPDF };
};
