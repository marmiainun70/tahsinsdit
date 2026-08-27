import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, AlignmentType, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import { MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { getEffectiveProgramFromReport } from "@/utils/programLogic";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type MonthlyReport = Database["public"]["Tables"]["monthly_reports"]["Row"];

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

const BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

const createHeaderCell = (text: string, width?: number) => {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 24 })], // size 24 = 12pt
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: "E0E0E0" },
    verticalAlign: VerticalAlign.CENTER,
    borders: BORDERS,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
};

const createCell = (text: string | number, align: AlignmentType = AlignmentType.LEFT, bold: boolean = false) => {
  let display = String(text);
  // Add + sign for positive diff
  if (typeof text === 'number' && align === AlignmentType.CENTER && bold && text > 0) {
     display = `+${text}`;
  }
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: display, size: 22, bold })], // size 22 = 11pt
        alignment: align,
      }),
    ],
    verticalAlign: VerticalAlign.CENTER,
    borders: BORDERS,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
};

export const exportMonthlyRecapToDocx = async (
  students: Student[],
  reports: MonthlyReport[],
  selectedMonth: number,
  selectedYear: number
) => {
  // Helpers
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const getStats = (m: number, y: number) => {
    const monthReports = reports.filter(r => r.month === m && r.year === y);
    const studentsWithReports = new Set(monthReports.map(r => r.student_id));
    const activeStudents = students.filter(
      st => st.status_siswa === 'aktif' || studentsWithReports.has(st.id)
    );

    const stats = {
      "Iqro 1": 0, "Iqro 2": 0, "Iqro 3": 0, "Iqro 4": 0, "Iqro 5": 0, "Iqro 6": 0,
      "Tahsin Lanjutan": 0, "Tahfizh": 0, "Total": 0
    };
    
    // Sort tahfizh list by class and name
    const tahfizhList: Array<{ nama: string; kelas: string; capaian: string }> = [];

    // Simple grouping logic for multiple reports per student (prioritizing tahfizh)
    const reportMap = new Map<string, MonthlyReport>();
    monthReports.forEach(r => {
      if (!reportMap.has(r.student_id)) {
        reportMap.set(r.student_id, r);
      } else {
         if (r.program_type === 'tahfizh') reportMap.set(r.student_id, r);
      }
    });

    activeStudents.forEach(s => {
      const report = reportMap.get(s.id);
      const bucket = getEffectiveProgramFromReport(report, s.level);
      stats.Total++;

      if (bucket === "TFZ") {
        stats.Tahfizh++;
        let capaian = report?.end_iqra_level || s.level || "Tahfizh";
        if (report?.end_page) capaian += ` Hal. ${report.end_page}`;
        tahfizhList.push({
          nama: s.nama,
          kelas: `${s.kelas}${s.rombel}`,
          capaian,
        });
      } else if (bucket === "TL") {
        stats["Tahsin Lanjutan"]++;
      } else {
        const endLvl = report?.end_iqra_level?.trim() || report?.iqra_level?.trim() || s.level;
        if (endLvl.includes("1")) stats["Iqro 1"]++;
        else if (endLvl.includes("2")) stats["Iqro 2"]++;
        else if (endLvl.includes("3")) stats["Iqro 3"]++;
        else if (endLvl.includes("4")) stats["Iqro 4"]++;
        else if (endLvl.includes("5")) stats["Iqro 5"]++;
        else if (endLvl.includes("6")) stats["Iqro 6"]++;
        else stats["Iqro 1"]++; // default fallback
      }
    });
    
    tahfizhList.sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
    return { stats, tahfizhList };
  };

  const curr = getStats(selectedMonth, selectedYear);
  const prev = getStats(prevMonth, prevYear);

  const monthName = MONTH_NAMES[selectedMonth - 1];
  const prevMonthName = MONTH_NAMES[prevMonth - 1];

  // 1. STATS TABLE
  const statsKeys: Array<keyof typeof curr.stats> = [
    "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6", 
    "Tahsin Lanjutan", "Tahfizh", "Total"
  ];

  const statsRows = statsKeys.map(key => {
    const diff = curr.stats[key] - prev.stats[key];
    const isTotal = key === "Total";
    return new TableRow({
      children: [
        createCell(key, AlignmentType.LEFT, isTotal),
        createCell(prev.stats[key], AlignmentType.CENTER, isTotal),
        createCell(curr.stats[key], AlignmentType.CENTER, isTotal),
        createCell(diff, AlignmentType.CENTER, true),
      ],
    });
  });

  const statsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createHeaderCell("Program", 40),
          createHeaderCell(`Bulan Lalu (${prevMonthName})`, 20),
          createHeaderCell(`Bulan Ini (${monthName})`, 20),
          createHeaderCell("Selisih", 20),
        ],
      }),
      ...statsRows,
    ],
  });

  // 2. TAHFIZH LIST PER CLASS
  const tahfizhContent: any[] = [];
  
  if (curr.tahfizhList.length > 0) {
    // Group by class
    const grouped = curr.tahfizhList.reduce((acc, st) => {
      if (!acc[st.kelas]) acc[st.kelas] = [];
      acc[st.kelas].push(st);
      return acc;
    }, {} as Record<string, typeof curr.tahfizhList>);

    Object.keys(grouped).sort().forEach(kelas => {
      tahfizhContent.push(
        new Paragraph({
          text: `Kelas ${kelas}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 100 },
        })
      );

      const rows = grouped[kelas].map((st, idx) => 
        new TableRow({
          children: [
            createCell(idx + 1, AlignmentType.CENTER),
            createCell(st.nama),
            createCell(st.capaian),
          ],
        })
      );

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("No", 10),
              createHeaderCell("Nama Siswa", 50),
              createHeaderCell("Capaian Terakhir", 40),
            ],
          }),
          ...rows,
        ],
      });
      
      tahfizhContent.push(table);
    });
  } else {
    tahfizhContent.push(new Paragraph({ text: "Tidak ada siswa Tahfizh di bulan ini.", italics: true }));
  }

  // Create Doc
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `REKAPITULASI LAPORAN TAHSIN & TAHFIZH`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Bulan ${monthName} Tahun ${selectedYear}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            bold: true,
          }),
          
          new Paragraph({
            text: "1. Ringkasan Statistik Siswa",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          statsTable,

          new Paragraph({
            text: "2. Daftar Capaian Siswa Tahfizh",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 },
          }),
          ...tahfizhContent,

          new Paragraph({
            text: "",
            spacing: { before: 800 },
          }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ text: "Mengetahui,", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Kepala Sekolah", alignment: AlignmentType.CENTER, spacing: { after: 1000 } }),
                      new Paragraph({ text: "(..................................................)", alignment: AlignmentType.CENTER }),
                    ],
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    }
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ text: " ", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Koordinator Tahfizh", alignment: AlignmentType.CENTER, spacing: { after: 1000 } }),
                      new Paragraph({ text: "(..................................................)", alignment: AlignmentType.CENTER }),
                    ],
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    }
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Rekap_Bulanan_${monthName}_${selectedYear}.docx`);
};
