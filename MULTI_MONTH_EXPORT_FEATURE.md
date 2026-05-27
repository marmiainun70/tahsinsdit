# Fitur Export Multi-Bulan - Rekap Laporan Bulanan

## 📋 Daftar Isi
- [Pengenalan Fitur](#pengenalan-fitur)
- [Cara Penggunaan](#cara-penggunaan)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Teknis](#arsitektur-teknis)
- [Struktur File](#struktur-file)
- [API & Hooks](#api--hooks)

---

## 🎯 Pengenalan Fitur

Fitur **Export Multi-Bulan** memungkinkan pengguna untuk membuat laporan gabungan dari **1, 2, atau 3 bulan sekaligus** dalam satu file PDF atau Excel. Fitur ini dirancang untuk mempermudah analisis perkembangan siswa dalam periode yang lebih panjang.

### ✨ Keunggulan Fitur
- ✅ Export data dari 1-3 bulan dalam satu file
- ✅ Format PDF & Excel responsif
- ✅ Filter berdasarkan Kelas, Rombel, Bulan, dan Tahun
- ✅ Ringkasan otomatis dengan statistik komprehensif
- ✅ Tracking pencapaian target (Tercapai/Sebagian/Belum)
- ✅ Rata-rata kehadiran per siswa
- ✅ Total halaman bacaan gabungan
- ✅ Design responsif mobile & desktop
- ✅ Dual-mode: Single Month dan Multi-Month

---

## 📖 Cara Penggunaan

### 1. Mengakses Fitur Multi-Bulan

```
Navigasi ke: Rekap Laporan Bulanan
↓
Klik tombol "Multi-Bulan" di pojok kanan atas
↓
Tombol akan berubah menjadi "Mode Multi-Bulan" (aktif)
```

### 2. Memilih Bulan

**Desktop:**
- Klik pada dropdown bulan
- Checkbox akan muncul untuk memilih 1-3 bulan
- Bulan otomatis disort dari awal hingga akhir
- Max 3 bulan dapat dipilih

**Mobile:**
- Tampilan optimized dengan grid 2-3 kolom
- Scroll untuk melihat semua bulan
- Indikator "N bulan terpilih" di bagian atas

### 3. Filter Data

Tersedia filter:
- **Tahun**: Pilih tahun akademik
- **Kelas**: Filter berdasarkan tingkat kelas
- **Rombel**: Filter berdasarkan rombongan belajar
- **Pencarian**: Cari nama siswa

### 4. Export Data

**Format PDF:**
```
Klik tombol "PDF" 
↓
File akan di-download dengan nama:
Rekap_Laporan_[Bulan1]-[Bulan2]_[Tahun].pdf
```

**Format Excel:**
```
Klik tombol "Excel"
↓
File akan di-download dengan 3 sheet:
1. Rekap (data detail)
2. Ringkasan (statistik)
3. Tanda Tangan (placeholder)
```

---

## 🚀 Fitur Utama

### A. Mode Multi-Bulan

#### Dual View System
```
┌─────────────────────────────────────────┐
│ Single Month Mode        Multi-Bulan Mode │
├─────────────────────────────────────────┤
│ • Monthly Report         • Combined Report │
│ • Filter: 1 Bulan       • Filter: 1-3 Bln│
│ • Status: Tercapai/Belum • Status + Partial│
│ • Simple Stats           • Advanced Stats  │
└─────────────────────────────────────────┘
```

### B. Filter Responsif

**Desktop Layout (6 kolom):**
- Cari Siswa (2 kolom)
- Kelas (1 kolom)
- Rombel (1 kolom)
- Bulan (1 kolom)
- Tahun (1 kolom)

**Mobile Layout (grid adaptif):**
- Semua filter di-stack vertically
- Full-width untuk input
- Dropdown lebih besar untuk touch

### C. Statistik Otomatis

#### Single Month
```
Total Siswa | Sudah Diisi | Belum Diisi | Kelengkapan | Target Tercapai
```

#### Multi-Month
```
Total Siswa | Tercapai | Sebagian | Belum Diisi | Kehadiran % | Total Halaman
```

### D. Status Pencapaian

| Status | Kriteria | Warna |
|--------|----------|-------|
| **Tercapai** | Semua bulan tercapai target | ✅ Hijau |
| **Sebagian** | Minimal 1 bulan tercapai | 🟡 Amber |
| **Belum** | Semua bulan tidak tercapai | ❌ Merah |
| **Belum Diisi** | Tidak ada data | ⚠️ Abu |

### E. Ringkasan Laporan

PDF & Excel secara otomatis menampilkan:
```
RINGKASAN LAPORAN MULTI-BULAN
┌─────────────────────────────────┐
│ Periode: Januari - Maret 2026    │
│ Total Siswa: 120                 │
│ Target Tercapai: 85 (70%)        │
│ Sebagian Tercapai: 25 (21%)      │
│ Belum Tercapai: 10 (8%)          │
│ Total Halaman Dibaca: 2,450      │
│ Rata-rata Kehadiran: 92%         │
└─────────────────────────────────┘
```

### F. Header Otomatis

PDF dan Excel include:
```
[LOGO]  Nama Lembaga
        Alamat
        REKAP LAPORAN BULANAN TAHSIN & TAHFIZH
        Periode: [Bulan1] - [BulanN] [Tahun]
        Kelas: [X] | Rombel: [A] | Periode: [Date Range]
```

---

## 🏗️ Arsitektur Teknis

### Tech Stack
- **Frontend**: React 18.3.1 + TypeScript
- **State Management**: React Hooks (useState, useMemo)
- **Data Fetching**: TanStack React Query v5
- **PDF Generation**: jsPDF 4.2.0 + jspdf-autotable 5.0.7
- **Excel Generation**: XLSX 0.18.5
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Database**: Supabase PostgreSQL

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│ RecapReport.tsx (Page Component)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Multi-Month Toggle                           │   │
│  └──────────────────────────────────────────────┘   │
│           │                                         │
│           ├─ FALSE ──→ Single Month Mode           │
│           │            (Original Flow)             │
│           │                                         │
│           └─ TRUE ──→ Multi-Month Mode             │
│                       ↓                            │
│              ┌────────────────────────┐            │
│              │ MultiMonthExportFilters│            │
│              └────────────────────────┘            │
│                       │                            │
│       ┌───────────────┼───────────────┐            │
│       ↓               ↓               ↓            │
│  Months          Year            Filters          │
│  (1-3)         (2024-2028)      (Kelas,Rombel)    │
│       │               │               │            │
│       └───────────────┼───────────────┘            │
│                       ↓                            │
│        ┌──────────────────────────┐              │
│        │ Data Aggregation Hook    │              │
│        └──────────────────────────┘              │
│         (useMultiMonthReports)                    │
│                       │                            │
│       ┌───────────────┴───────────────┐            │
│       ↓                               ↓            │
│  PDF Export              Excel Export             │
│  (generateMultiMonthPDF)  (generateMultiMonthExcel)
│       │                               │            │
│       └───────────────┬───────────────┘            │
│                       ↓                            │
│              File Download (User)                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Struktur File

### File Baru

```
src/
├── hooks/
│   └── useMultiMonthReports.ts          # Hook untuk data multi-bulan
│
├── components/
│   └── MultiMonthExportFilters.tsx      # Komponen filter bulan
│
├── utils/
│   └── multiMonthExportUtils.ts         # Utility export PDF/Excel
│
└── pages/
    └── RecapReport.tsx                  # Page (updated)
```

### File yang Dimodifikasi

- `src/pages/RecapReport.tsx` - Integrasi multi-month logic

---

## 🔌 API & Hooks

### 1. Hook: `useMultiMonthReports`

**Lokasi**: `src/hooks/useMultiMonthReports.ts`

```typescript
export const useMultiMonthReports = (
  studentIds: string[],
  months: number[],
  year: number
) => UseQueryResult<Record<string, MonthlyReport[]>>
```

**Penggunaan:**
```typescript
const { data, isLoading, error } = useMultiMonthReports(
  ['std-001', 'std-002'],
  [1, 2, 3],           // Januari, Februari, Maret
  2026
);
```

### 2. Function: `aggregateMultiMonthData`

**Lokasi**: `src/hooks/useMultiMonthReports.ts`

```typescript
export const aggregateMultiMonthData = (
  studentId: string,
  nama: string,
  kelas: number,
  rombel: string,
  level: string,
  program: string,
  reports: MonthlyReport[],
  months: number[],
  year: number
): AggregatedReport
```

**Return Value:**
```typescript
interface AggregatedReport {
  studentId: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  program: string;
  months: string[];              // ["Januari", "Februari"]
  startPage: number;
  endPage: number;
  totalPages: number;            // Sum dari semua bulan
  totalTarget: number;           // Sum dari semua bulan
  averageAttendance: number;     // Rata-rata %
  status: 'achieved' | 'not_achieved' | 'partial' | 'empty';
  guru: string;
  catatan: string;
}
```

### 3. Component: `MultiMonthExportFilters`

**Lokasi**: `src/components/MultiMonthExportFilters.tsx`

```typescript
export const MultiMonthExportFilters = ({
  onMonthsChange: (months: number[]) => void;
  onYearChange: (year: number) => void;
  selectedMonths: number[];
  selectedYear: number;
}): JSX.Element
```

**Fitur:**
- ✅ Checkbox dengan max 3 bulan
- ✅ Disabled state ketika 3 bulan sudah dipilih
- ✅ Clear button untuk reset
- ✅ Visual feedback dengan warna & border
- ✅ Responsive dropdown dengan close button

### 4. Function: `generateMultiMonthPDF`

**Lokasi**: `src/utils/multiMonthExportUtils.ts`

```typescript
export const generateMultiMonthPDF = async (
  groups: ExportGroup[],
  selectedMonths: number[],
  selectedYear: number,
  settings: ExportSettings
): Promise<void>
```

**ExportGroup Interface:**
```typescript
interface ExportGroup {
  kelas: number;
  rombel: string;
  reports: AggregatedReport[];
}
```

**Features:**
- Header otomatis dengan logo & nama lembaga
- Tabel per kelas/rombel dengan warna alternating
- Status dengan color-coding
- Ringkasan otomatis di halaman terakhir
- Tanda tangan koordinator & kepala sekolah
- Footer dengan tanggal & nomor halaman
- Page break otomatis

### 5. Function: `generateMultiMonthExcel`

**Lokasi**: `src/utils/multiMonthExportUtils.ts`

```typescript
export const generateMultiMonthExcel = (
  groups: ExportGroup[],
  selectedMonths: number[],
  selectedYear: number,
  settings: ExportSettings
): void
```

**Output 3 Sheet:**

1. **Rekap** (Data Detail)
   - Columns: No, Nama, Kelas, Rombel, Program, Level, Awal, Akhir, Total, Target, Kehadiran, Status, Catatan
   - Format: Grouped per kelas/rombel
   - Styling: Bold headers, alternating rows

2. **Ringkasan** (Statistik)
   - Periode
   - Total Siswa & Breakdown Status
   - Total Halaman
   - Rata-rata Kehadiran

3. **Tanda Tangan**
   - Template untuk tanda tangan manual
   - 2 kolom: Koordinator & Kepala Sekolah

---

## 📊 Data Aggregation Logic

### Contoh Skenario

**Input:** Siswa "Adi" dengan data 3 bulan

```
Januari:
  - Pages Read: 50
  - Target: 60
  - Status: not_achieved
  - Attendance: 90%

Februari:
  - Pages Read: 65
  - Target: 60
  - Status: achieved
  - Attendance: 95%

Maret:
  - Pages Read: 70
  - Target: 60
  - Status: achieved
  - Attendance: 88%
```

**Output Aggregation:**

```typescript
{
  studentId: "std-adi",
  nama: "Adi",
  months: ["Januari", "Februari", "Maret"],
  startPage: 50,           // Awal Januari
  endPage: 70,             // Akhir Maret
  totalPages: 185,         // 50 + 65 + 70
  totalTarget: 180,        // 60 + 60 + 60
  averageAttendance: 91,   // (90 + 95 + 88) / 3
  status: "partial",       // 2 achieved, 1 not_achieved
  catatan: "[notes Februari] | [notes Maret]"
}
```

---

## 🎨 UI Components Layout

### Desktop (> 768px)
```
┌───────────────────────────────────────────────┐
│  Filter Section (6 kolom)                     │
│  [Search] [Kelas] [Rombel] [Bulan] [Tahun]... │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│  Stats (6 cards)                              │
│  [Total] [Tercapai] [Sebagian] [Belum] [%]... │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│  Export Buttons                               │
│  [Excel] [PDF]                                │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│  Data Table (Scrollable)                      │
│  Kelas 1 - Rombel A                           │
│  ┌─────────────────────────────────────────┐  │
│  │ No│ Nama │ Program │ Bulan │ Total│Stat│  │
│  ├─────────────────────────────────────────┤  │
│  │ 1 │ Adi  │ Tahsin  │ Jan-Mar│ 185 │ █  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────┐
│ Filter Section (Stacked)│
│ ┌─────────────────────┐ │
│ │ [Search Siswa....]  │ │
│ ├─────────────────────┤ │
│ │ [Kelas ▼]           │ │
│ ├─────────────────────┤ │
│ │ [Rombel ▼]          │ │
│ ├─────────────────────┤ │
│ │ [Bulan ▼]           │ │
│ └─────────────────────┘ │
└─────────────────────────┘
┌─────────────────────────┐
│ Stats (2 per row)       │
│ [Total] [Tercapai]      │
│ [Sebagian] [Belum]      │
└─────────────────────────┘
```

---

## ✅ Testing Checklist

### Single Month Mode
- [ ] Filter works correctly
- [ ] Data displays correctly
- [ ] PDF export generates properly
- [ ] Excel export generates properly
- [ ] Stats calculate correctly

### Multi-Month Mode
- [ ] Month selection UI works
- [ ] Max 3 months enforced
- [ ] Clear button works
- [ ] Data aggregation correct
- [ ] Multi-month PDF exports
- [ ] Multi-month Excel exports
- [ ] Responsive on mobile/desktop
- [ ] Statistics accurate

### Performance
- [ ] No lag with 500+ students
- [ ] PDF generation < 5 seconds
- [ ] Excel generation < 3 seconds
- [ ] Filter response < 500ms

---

## 🐛 Known Issues & Limitations

- Max 3 bulan per export (by design)
- Large datasets (> 1000 students) may take longer
- PDF image embed requires CORS-enabled servers
- Browser print function may have different formatting

---

## 🔄 Migration Guide

Tidak ada breaking changes. Fitur ini backward compatible dengan existing single-month export.

---

## 📚 Dependencies

```json
{
  "jspdf": "^4.2.0",
  "jspdf-autotable": "^5.0.7",
  "xlsx": "^0.18.5",
  "@tanstack/react-query": "^5.83.0",
  "date-fns": "^3.6.0"
}
```

---

## 🚀 Future Enhancements

- [ ] Support untuk 6 bulan atau 1 tahun penuh
- [ ] Comparison chart antar bulan
- [ ] Grafik tren pencapaian
- [ ] Export ke format CSV
- [ ] Email delivery otomatis
- [ ] Schedule export berkala
- [ ] Custom report template
- [ ] Multi-language support

---

## 📞 Support & Troubleshooting

### PDF tidak ter-generate
**Solusi:**
1. Cek koneksi internet
2. Verify setting logo_url di institution settings
3. Try export tanpa logo dulu

### Excel file corrupted
**Solusi:**
1. Gunakan Excel 2016+ atau LibreOffice
2. Coba clear browser cache
3. Download ulang file

### Data tidak muncul
**Solusi:**
1. Verify bulan sudah dipilih (min 1)
2. Check data ada di selected period
3. Try refresh halaman

---

## 📝 License

Part of Tahsin Digital System - All rights reserved
