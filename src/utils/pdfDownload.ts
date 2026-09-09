import jsPDF from "jspdf";

/**
 * Menyimpan dokumen jsPDF sebagai file unduhan.
 */
export const downloadPdf = (doc: jsPDF, filename: string) => {
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
};
