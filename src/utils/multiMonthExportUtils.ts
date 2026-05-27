import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { AggregatedReport } from '@/hooks/useMultiMonthReports';
import { MONTH_NAMES } from '@/hooks/useMultiMonthReports';
import { removeBlockedNoteEmoticons } from '@/lib/noteValidation';

export interface ExportSettings {
  nama_lembaga?: string;
  alamat?: string;
  logo_url?: string;
  koordinator_nama?: string;
  koordinator_ttd_url?: string;
  kepsek_nama?: string;
  kepsek_ttd_url?: string;
}

export interface ExportGroup {
  kelas: number;
  rombel: string;
  reports: AggregatedReport[];
}

const loadImageAsBase64 = (url: string): Promise<string | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const formatTahfizhLevel = (level: string | null | undefined, page: number) => {
  if (!level) return `hal.${page}`;
  const juz = Number(String(level).replace(/\D/g, '')) || null;
  return juz ? `Juz ${juz} hal.${page}` : `hal.${page}`;
};

export const generateMultiMonthPDF = async (
  groups: ExportGroup[],
  selectedMonths: number[],
  selectedYear: number,
  settings: ExportSettings
) => {
  const [logoB64, koordTtdB64, kepsekTtdB64] = await Promise.all([
    settings.logo_url ? loadImageAsBase64(settings.logo_url) : Promise.resolve(null),
    settings.koordinator_ttd_url ? loadImageAsBase64(settings.koordinator_ttd_url) : Promise.resolve(null),
    settings.kepsek_ttd_url ? loadImageAsBase64(settings.kepsek_ttd_url) : Promise.resolve(null),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 12;

  const monthLabels = selectedMonths.map(m => MONTH_NAMES[m - 1]);
  const periodeStr =
    selectedMonths.length === 1
      ? `${monthLabels[0]} ${selectedYear}`
      : `${monthLabels[0]} - ${monthLabels[monthLabels.length - 1]} ${selectedYear}`;

  const drawHeader = () => {
    let y = M;
    if (logoB64) {
      try {
        doc.addImage(logoB64, 'PNG', M, y, 16, 16);
      } catch {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 101, 52);
    doc.text((settings.nama_lembaga || 'Lembaga').toUpperCase(), pageW / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    if (settings.alamat) doc.text(settings.alamat, pageW / 2, y + 10, { align: 'center' });
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.line(M, y + 18, pageW - M, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('REKAP LAPORAN BULANAN TAHSIN & TAHFIZH', pageW / 2, y + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Periode: ${periodeStr}`, pageW / 2, y + 28, { align: 'center' });
  };

  drawHeader();
  let cursorY = M + 32;

  groups.forEach(grp => {
    if (cursorY > pageH - 60) {
      doc.addPage();
      drawHeader();
      cursorY = M + 32;
    }

    doc.setFillColor(232, 245, 233);
    doc.rect(M, cursorY, pageW - 2 * M, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(27, 94, 32);
    doc.text(
      `Kelas ${grp.kelas} — Rombel ${grp.rombel}  (${grp.reports.length} siswa)`,
      M + 2,
      cursorY + 4.2
    );
    cursorY += 7;

    const tableColumns = [
      'No',
      'Nama',
      'Program',
      'Level',
      'Periode',
      'Awal',
      'Akhir',
      'Total',
      'Target',
      'Kehadiran %',
      'Status',
      'Catatan',
    ];

    const tableBody = grp.reports.map((r, idx) => [
      String(idx + 1),
      r.nama,
      r.program,
      r.level,
      r.months.join(' / '),
      r.startPage > 0 ? formatTahfizhLevel(r.monthlyData[0]?.iqraLevel, r.startPage) : '-',
      r.endPage > 0
        ? formatTahfizhLevel(r.monthlyData[r.monthlyData.length - 1]?.endIqraLevel, r.endPage)
        : '-',
      r.status === 'empty' ? '-' : String(r.totalPages),
      r.status === 'empty' ? '-' : String(r.totalTarget),
      r.status === 'empty' ? '-' : `${r.averageAttendance}%`,
      r.status === 'achieved'
        ? 'Tercapai'
        : r.status === 'partial'
        ? 'Sebagian'
        : r.status === 'not_achieved'
        ? 'Belum'
        : 'BELUM DIISI',
      removeBlockedNoteEmoticons(r.catatan || '') || '-',
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [tableColumns],
      body: tableBody,
      styles: {
        fontSize: 7,
        cellPadding: 1.2,
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [30, 30, 30],
      },
      headStyles: {
        fillColor: [34, 87, 122],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 24 },
        3: { cellWidth: 18 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        8: { cellWidth: 12, halign: 'center' },
        9: { cellWidth: 14, halign: 'center' },
        10: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        11: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 10) {
          const v = String(data.cell.raw);
          if (v === 'Tercapai') data.cell.styles.textColor = [16, 124, 65];
          else if (v === 'Sebagian') data.cell.styles.textColor = [245, 127, 23];
          else if (v === 'Belum') data.cell.styles.textColor = [185, 28, 28];
          else if (v === 'BELUM DIISI') {
            data.cell.styles.textColor = [220, 38, 38];
            if (data.row.cells) {
              Object.values(data.row.cells).forEach((c: any) => {
                c.styles.fillColor = [255, 235, 238];
              });
            }
          }
        }
      },
      margin: { left: M, right: M, bottom: 24 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 4;
  });

  // Summary and Signatures
  const sigBlockH = 50;
  if (cursorY + sigBlockH > pageH - 14) {
    doc.addPage();
    drawHeader();
    cursorY = M + 34;
  }

  // Summary section
  const totalStudents = groups.reduce((sum, g) => sum + g.reports.length, 0);
  const achievedStudents = groups.reduce(
    (sum, g) => sum + g.reports.filter(r => r.status === 'achieved').length,
    0
  );
  const partialStudents = groups.reduce(
    (sum, g) => sum + g.reports.filter(r => r.status === 'partial').length,
    0
  );
  const totalPagesRead = groups.reduce((sum, g) => sum + g.reports.reduce((s, r) => s + r.totalPages, 0), 0);
  const avgAttendance =
    totalStudents > 0
      ? Math.round(groups.reduce((sum, g) => sum + g.reports.reduce((s, r) => s + r.averageAttendance, 0), 0) / totalStudents)
      : 0;

  cursorY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text('RINGKASAN LAPORAN', M, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60);
  const summaryText = [
    `Total Siswa: ${totalStudents}`,
    `Target Tercapai: ${achievedStudents} siswa (${totalStudents > 0 ? Math.round((achievedStudents / totalStudents) * 100) : 0}%)`,
    `Sebagian Tercapai: ${partialStudents} siswa`,
    `Total Halaman Dibaca: ${totalPagesRead} hal.`,
    `Rata-rata Kehadiran: ${avgAttendance}%`,
  ];
  summaryText.forEach(text => {
    doc.text(text, M + 3, cursorY);
    cursorY += 4;
  });

  cursorY += 6;
  const colW = (pageW - M * 2) / 2;
  const sigY = cursorY;

  const drawSig = (xCenter: number, label: string, nama: string, ttd: string | null) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40);
    doc.text(label, xCenter, sigY, { align: 'center' });
    if (ttd) {
      try {
        doc.addImage(ttd, 'PNG', xCenter - 16, sigY + 2, 32, 14);
      } catch {}
    }
    doc.setLineWidth(0.2);
    doc.setDrawColor(120);
    doc.line(xCenter - 28, sigY + 18, xCenter + 28, sigY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(nama || '(.....................)', xCenter, sigY + 23, { align: 'center' });
  };

  drawSig(M + colW / 2, 'Koordinator Tahfizh,', settings.koordinator_nama || '', koordTtdB64);
  drawSig(M + colW + colW / 2, 'Mengetahui, Kepala Sekolah,', settings.kepsek_nama || '', kepsekTtdB64);

  // Footer
  const totalPages = doc.getNumberOfPages();
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(M, pageH - 10, pageW - M, pageH - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${today}`, M, pageH - 6);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW - M, pageH - 6, { align: 'right' });
  }

  const periodeFileName = selectedMonths.length === 1
    ? MONTH_NAMES[selectedMonths[0] - 1]
    : `${MONTH_NAMES[selectedMonths[0] - 1]}-${MONTH_NAMES[selectedMonths[selectedMonths.length - 1] - 1]}`;

  doc.save(`Rekap_Laporan_${periodeFileName}_${selectedYear}.pdf`);
};

export const generateMultiMonthExcel = (
  groups: ExportGroup[],
  selectedMonths: number[],
  selectedYear: number,
  settings: ExportSettings
) => {
  const wb = XLSX.utils.book_new();
  const monthLabels = selectedMonths.map(m => MONTH_NAMES[m - 1]);
  const periodeStr =
    selectedMonths.length === 1
      ? `${monthLabels[0]} ${selectedYear}`
      : `${monthLabels[0]} - ${monthLabels[monthLabels.length - 1]} ${selectedYear}`;

  // Main sheet
  const aoa: any[][] = [];
  aoa.push([(settings.nama_lembaga || 'Lembaga').toUpperCase()]);
  if (settings.alamat) aoa.push([settings.alamat]);
  aoa.push(['REKAP LAPORAN BULANAN TAHSIN & TAHFIZH']);
  aoa.push([`Periode: ${periodeStr}`]);
  aoa.push([]);

  const headers = [
    'No',
    'Nama',
    'Kelas',
    'Rombel',
    'Program',
    'Level',
    'Awal',
    'Akhir',
    'Total Halaman',
    'Target',
    'Kehadiran %',
    'Status',
    'Catatan',
  ];

  groups.forEach(grp => {
    aoa.push([`Kelas ${grp.kelas} — Rombel ${grp.rombel}`]);
    aoa.push(headers);
    grp.reports.forEach((r, idx) => {
      aoa.push([
        idx + 1,
        r.nama,
        r.kelas,
        r.rombel,
        r.program,
        r.level,
        r.startPage > 0 ? formatTahfizhLevel(r.monthlyData[0]?.iqraLevel, r.startPage) : '-',
        r.endPage > 0
          ? formatTahfizhLevel(r.monthlyData[r.monthlyData.length - 1]?.endIqraLevel, r.endPage)
          : '-',
        r.status === 'empty' ? '' : r.totalPages,
        r.status === 'empty' ? '' : r.totalTarget,
        r.status === 'empty' ? '' : r.averageAttendance,
        r.status === 'achieved'
          ? 'Tercapai'
          : r.status === 'partial'
          ? 'Sebagian'
          : r.status === 'not_achieved'
          ? 'Belum Tercapai'
          : 'BELUM DIISI',
        r.catatan || '',
      ]);
    });
    aoa.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colWidths = headers.map((h, ci) => {
    let max = h.length;
    aoa.forEach(row => {
      const v = row[ci];
      if (v != null) max = Math.max(max, String(v).length);
    });
    return { wch: Math.min(Math.max(max + 2, 8), 50) };
  });
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const cellA = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
    const isGroupHeader = cellA && typeof cellA.v === 'string' && cellA.v.startsWith('Kelas ');
    const isHeaderRow = cellA && cellA.v === 'No';
    const isTitle = R < 4;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      cell.s = cell.s || {};
      if (isTitle) {
        cell.s = { font: { bold: true, sz: R === 2 ? 12 : 11 }, alignment: { horizontal: 'left' } };
      } else if (isGroupHeader) {
        cell.s = {
          font: { bold: true, color: { rgb: '1B5E20' } },
          fill: { fgColor: { rgb: 'E8F5E9' } },
        };
      } else if (isHeaderRow) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '22577A' } },
          alignment: { horizontal: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          },
        };
      } else {
        cell.s = {
          alignment: { wrapText: true, vertical: 'top' },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } },
          },
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');

  // Summary sheet
  const totalStudents = groups.reduce((sum, g) => sum + g.reports.length, 0);
  const achievedStudents = groups.reduce(
    (sum, g) => sum + g.reports.filter(r => r.status === 'achieved').length,
    0
  );
  const partialStudents = groups.reduce(
    (sum, g) => sum + g.reports.filter(r => r.status === 'partial').length,
    0
  );
  const notAchievedStudents = groups.reduce(
    (sum, g) => sum + g.reports.filter(r => r.status === 'not_achieved').length,
    0
  );
  const totalPagesRead = groups.reduce((sum, g) => sum + g.reports.reduce((s, r) => s + r.totalPages, 0), 0);
  const avgAttendance =
    totalStudents > 0
      ? Math.round(groups.reduce((sum, g) => sum + g.reports.reduce((s, r) => s + r.averageAttendance, 0), 0) / totalStudents)
      : 0;

  const summaryAoa: any[][] = [
    ['RINGKASAN LAPORAN MULTI-BULAN'],
    [],
    ['Periode', periodeStr],
    ['Total Siswa', totalStudents],
    ['Target Tercapai', achievedStudents, `(${totalStudents > 0 ? Math.round((achievedStudents / totalStudents) * 100) : 0}%)`],
    ['Sebagian Tercapai', partialStudents, `(${totalStudents > 0 ? Math.round((partialStudents / totalStudents) * 100) : 0}%)`],
    ['Belum Tercapai', notAchievedStudents, `(${totalStudents > 0 ? Math.round((notAchievedStudents / totalStudents) * 100) : 0}%)`],
    [],
    ['Total Halaman Dibaca', totalPagesRead],
    ['Rata-rata Kehadiran', `${avgAttendance}%`],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

  // Style summary sheet
  const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1');
  for (let R = summaryRange.s.r; R <= summaryRange.e.r; ++R) {
    for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = summaryWs[addr];
      if (!cell) continue;
      cell.s = cell.s || {};
      if (R === 0) {
        cell.s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left' } };
      } else if (R >= 2) {
        cell.s = { font: { sz: 10 }, alignment: { horizontal: 'left' }, border: { bottom: { style: 'thin', color: { rgb: 'CCCCCC' } } } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

  // Signatures sheet
  const sigAoa: any[][] = [
    ['TANDA TANGAN RESMI'],
    [],
    ['Koordinator Tahfizh', '', '', 'Kepala Sekolah'],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    [settings.koordinator_nama || '(.....................)', '', '', settings.kepsek_nama || '(...)'],
  ];
  const sigWs = XLSX.utils.aoa_to_sheet(sigAoa);
  sigWs['!cols'] = [{ wch: 30 }, { wch: 5 }, { wch: 5 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, sigWs, 'Tanda Tangan');

  const periodeFileName = selectedMonths.length === 1
    ? MONTH_NAMES[selectedMonths[0] - 1]
    : `${MONTH_NAMES[selectedMonths[0] - 1]}-${MONTH_NAMES[selectedMonths[selectedMonths.length - 1] - 1]}`;

  XLSX.writeFile(wb, `Rekap_Laporan_${periodeFileName}_${selectedYear}.xlsx`);
};
