# DESIGN SYSTEM — TAHSIN SDIT

> Panduan UI/UX resmi untuk website Tahsin SDIT Luqmanul Hakim.  
> Dokumen ini menjadi acuan untuk seluruh halaman, komponen, tabel, filter, form, dashboard, laporan, PDF, dan fitur baru.  
> Sistem mendukung **Light Theme** dan **Dark Theme** dengan karakter visual yang sama.

---

# 1. VISI DESAIN

Website Tahsin SDIT harus terasa:

- Islami modern
- Profesional
- Powerful
- Rapi
- Mudah digunakan
- Berorientasi data
- Konsisten
- Ringan
- Responsif
- Terpercaya

Desain harus membantu guru dan admin menyelesaikan pekerjaan dengan cepat, bukan sekadar terlihat menarik.

## Prinsip utama

1. Satu fungsi utama hanya muncul satu kali dalam satu halaman.
2. Jangan mengulang filter, tombol PDF, pencarian, atau toolbar.
3. Informasi terpenting tampil lebih dahulu.
4. Semua komponen harus memiliki hierarchy yang jelas.
5. Warna digunakan berdasarkan makna.
6. Tabel tetap padat tetapi mudah dibaca.
7. Fitur lama tidak boleh hilang tanpa instruksi eksplisit.
8. Perubahan visual tidak boleh mengubah data atau logika.
9. Light dan Dark Theme harus memiliki struktur identik.
10. Semua halaman harus mengikuti design token yang sama.

---

# 2. KARAKTER VISUAL

Karakter utama desain:

- dominan emerald dan teal;
- aksen gold untuk identitas Islami;
- panel bersih dengan border tipis;
- radius sedang;
- shadow halus;
- ikon outline konsisten;
- typography modern;
- tampilan profesional, tidak ramai;
- tidak seperti template generik;
- tidak menggunakan glow berlebihan;
- tidak menggunakan terlalu banyak warna pada satu area.

## Light Theme

Karakter:

- putih kehijauan;
- panel putih;
- border emerald sangat lembut;
- teks slate gelap;
- shadow halus;
- header tabel pastel;
- tombol utama emerald;
- aksen gold tetap terlihat tetapi tidak dominan.

## Dark Theme

Karakter:

- background emerald-black;
- panel dark emerald;
- border hijau gelap;
- teks off-white;
- aksen gold dan emerald lebih tegas;
- shadow gelap;
- tabel tetap memiliki pemisahan visual yang jelas.

---

# 3. SISTEM WARNA

## 3.1 CSS Variables Dual Theme

```css
:root {
  --background: 150 25% 98%;
  --foreground: 164 45% 10%;

  --card: 0 0% 100%;
  --card-foreground: 164 45% 10%;

  --popover: 0 0% 100%;
  --popover-foreground: 164 45% 10%;

  --primary: 158 84% 32%;
  --primary-foreground: 0 0% 100%;

  --secondary: 150 24% 94%;
  --secondary-foreground: 164 35% 16%;

  --muted: 150 18% 94%;
  --muted-foreground: 160 10% 42%;

  --accent: 42 92% 50%;
  --accent-foreground: 164 40% 7%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  --border: 152 20% 85%;
  --input: 152 20% 85%;
  --ring: 158 72% 40%;

  --radius: 0.65rem;
}

.dark {
  --background: 164 38% 5%;
  --foreground: 150 20% 94%;

  --card: 164 31% 8%;
  --card-foreground: 150 20% 94%;

  --popover: 164 31% 8%;
  --popover-foreground: 150 20% 94%;

  --primary: 158 84% 32%;
  --primary-foreground: 150 25% 97%;

  --secondary: 164 22% 13%;
  --secondary-foreground: 150 18% 90%;

  --muted: 164 18% 14%;
  --muted-foreground: 155 10% 62%;

  --accent: 42 92% 50%;
  --accent-foreground: 164 40% 7%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;

  --border: 160 18% 20%;
  --input: 160 18% 20%;
  --ring: 158 72% 40%;
}
```

---

## 3.2 Palet Light Theme

| Fungsi | Warna | Hex |
|---|---|---|
| Background | Soft Emerald White | `#F7FBF9` |
| Card | White | `#FFFFFF` |
| Panel Secondary | Emerald Mist | `#F0F7F3` |
| Border | Soft Emerald Border | `#D6E5DD` |
| Text Primary | Deep Emerald Slate | `#112C24` |
| Text Secondary | Muted Green Slate | `#65766F` |
| Primary | Emerald | `#10B981` |
| Primary Hover | Emerald Dark | `#059669` |
| Gold | Islamic Gold | `#F59E0B` |
| Blue | Information Blue | `#3B82F6` |
| Purple | Feature Purple | `#8B5CF6` |
| Amber | Warning Amber | `#F59E0B` |
| Red | Danger Red | `#EF4444` |
| Teal | Teal | `#0D9488` |

---

## 3.3 Palet Dark Theme

| Fungsi | Warna | Hex |
|---|---|---|
| Background | Emerald Black | `#06110E` |
| Sidebar | Deep Emerald | `#071712` |
| Card | Dark Emerald | `#0B1F19` |
| Panel Secondary | Dark Slate Green | `#10251F` |
| Border | Muted Emerald | `#244137` |
| Text Primary | Off White | `#F1F5F3` |
| Text Secondary | Soft Gray Green | `#A8B8B1` |
| Primary | Emerald | `#10B981` |
| Primary Hover | Emerald Dark | `#059669` |
| Gold | Islamic Gold | `#F59E0B` |
| Blue | Information Blue | `#3B82F6` |
| Purple | Feature Purple | `#8B5CF6` |
| Amber | Warning Amber | `#F59E0B` |
| Red | Danger Red | `#EF4444` |
| Teal | Teal | `#009688` |

---

## 3.4 Makna Warna

- **Emerald:** aksi utama, berhasil, aktif.
- **Gold:** identitas sekolah dan menu aktif.
- **Blue:** informasi umum dan total siswa.
- **Purple:** fitur layout dan hasil.
- **Amber:** belum lengkap atau membutuhkan perhatian.
- **Red:** error, gagal, belum diisi.
- **Teal:** nilai progresif dan statistik.
- **Slate:** informasi netral.

Warna harus digunakan konsisten di kedua tema.

---

# 4. TYPOGRAPHY

Gunakan:

```css
font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
```

## Skala teks

| Elemen | Ukuran | Bobot |
|---|---:|---:|
| Judul halaman | 26–30 px | 700 |
| Judul section | 18–20 px | 700 |
| Judul kartu | 13–14 px | 600 |
| Nilai KPI | 24–30 px | 700–800 |
| Body | 14–16 px | 400 |
| Label form | 12–13 px | 500–600 |
| Tabel | 11–13 px | 400–600 |
| Caption | 10–12 px | 500 |

Aturan:

- jangan memakai terlalu banyak kapital;
- label panjang boleh wrap;
- hindari font di bawah 10 px;
- nama siswa harus mudah dibaca;
- heading harus memiliki hierarchy yang jelas.

---

# 5. IKONOGRAFI

Gunakan **Lucide React**.

## Aturan

- ukuran tombol: 16 px;
- ukuran sidebar: 17–18 px;
- ukuran KPI: 20–24 px;
- stroke: 1.5–2;
- jangan memakai emoji;
- jangan memakai dua ikon berbeda untuk fungsi sama;
- ikon penting tetap disertai label.

## Rekomendasi ikon

| Fungsi | Ikon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Kelola siswa | `Users` |
| Murid binaan | `UserRoundCheck` |
| Penugasan guru | `UserCog` |
| Absensi | `ClipboardCheck` |
| Input laporan | `FilePenLine` |
| Rekap laporan | `ClipboardList` |
| Monitoring | `ChartNoAxesCombined` |
| Jadwal ujian | `CalendarDays` |
| Pengumuman | `Megaphone` |
| Notifikasi | `Bell` |
| Pengaturan | `Settings` |
| Preview | `Eye` |
| Download | `Download` |
| Cetak | `Printer` |
| Edit layout | `LayoutGrid` |
| Atur kolom | `Columns3` |
| Atur lebar | `MoveHorizontal` |
| Urutkan | `ArrowUpDown` |
| Simpan | `Save` |
| Reset | `RotateCcw` |
| Cari siswa | `Search` |
| Filter | `ListFilter` |
| Total siswa | `Users` |
| Sudah diisi | `SquareCheckBig` |
| Belum diisi | `FileWarning` |
| Absensi lengkap | `ShieldCheck` |
| Belum lengkap | `CircleAlert` |
| Nilai progresif | `ChartNoAxesColumnIncreasing` |

---

# 6. APP SHELL

Struktur utama:

```txt
App Shell
├── Sidebar
├── Topbar
└── Main Content
    ├── Page Header
    ├── Filter Panel
    ├── KPI Cards
    ├── Alert
    ├── Action Toolbar
    ├── Layout Toolbar
    ├── Main Table
    └── Fixed Horizontal Scrollbar
```

## Aturan penting

- jangan menampilkan tombol PDF di topbar jika sudah ada di action toolbar;
- jangan menampilkan pencarian siswa lebih dari satu kali;
- jangan mengulang filter;
- jangan mengulang toolbar;
- jangan menampilkan aksi yang sama di dua lokasi.

---

# 7. SIDEBAR

Sidebar harus:

- memiliki logo;
- memiliki grup menu;
- dapat ditutup;
- menjadi drawer pada mobile;
- menu aktif memakai gold;
- ukuran item 38–42 px;
- tidak terlalu lebar;
- tidak memakai terlalu banyak badge.

## Light Theme

```tsx
className="
  border-r border-emerald-100
  bg-white
  text-slate-700
"
```

## Dark Theme

```tsx
className="
  border-r border-emerald-950
  bg-[#071712]
  text-emerald-50
"
```

## Menu aktif

```tsx
className="
  border border-amber-400/40
  bg-amber-500/15
  text-amber-700
  dark:text-amber-200
"
```

---

# 8. TOPBAR

Topbar memuat:

- tombol sidebar;
- judul ringkas;
- pencarian siswa atau pencarian global;
- notifikasi;
- profil.

Jangan menaruh tombol PDF di topbar apabila tombol PDF sudah ada di bawah.

## Light Theme

```tsx
className="
  border-b border-emerald-100
  bg-white/90
  backdrop-blur
"
```

## Dark Theme

```tsx
className="
  border-b border-emerald-950
  bg-[#06110E]/90
  backdrop-blur
"
```

---

# 9. PAGE HEADER

Gunakan:

```txt
Judul halaman
Deskripsi singkat
```

Contoh:

```txt
Rekap Laporan Bulanan
Ringkasan pencapaian dan perkembangan siswa per rombel dan bulan.
```

Jangan meletakkan banyak tombol di header.

---

# 10. FILTER PANEL

Urutan filter Rekap Laporan:

1. Cari siswa
2. Kelas
3. Tahun
4. Rombel
5. Bulan
6. Status laporan
7. Status absensi
8. Kategori progres
9. Nilai
10. Terapkan Filter
11. Reset

## Aturan

- pencarian siswa wajib ada;
- filter hanya satu panel;
- jangan menduplikasi filter;
- gunakan label;
- gunakan tinggi input konsisten;
- `Terapkan Filter` sebagai primary;
- `Reset` sebagai outline;
- field wrap pada layar kecil.

## Light Theme

```tsx
className="
  rounded-xl border border-emerald-100
  bg-white
  shadow-sm
"
```

## Dark Theme

```tsx
className="
  rounded-xl border border-emerald-900/60
  bg-emerald-950/30
"
```

---

# 11. KPI CARDS

KPI berfungsi sebagai statistik dan navigasi filter.

## Susunan

```txt
Ikon
Label
Nilai
Subtitle
Chevron opsional
```

## Aturan

- tinggi sama;
- label boleh wrap;
- jangan truncate;
- jangan membuat teks terlalu kecil;
- kartu dapat diklik;
- hover halus;
- active state jelas;
- warna sama di light dan dark, hanya intensitasnya berbeda.

## Grid

```tsx
className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
```

## Warna KPI

| KPI | Warna |
|---|---|
| Total siswa | Blue |
| Laporan sudah diisi | Emerald |
| Laporan belum diisi | Amber |
| Absensi lengkap | Purple |
| Absensi belum lengkap | Red |
| Rata-rata nilai progresif | Teal |

## Contoh Blue KPI

```tsx
className="
  border-blue-200 bg-blue-50/70
  hover:border-blue-400
  dark:border-blue-500/30
  dark:bg-blue-500/[0.06]
  dark:hover:border-blue-400/60
"
```

## Contoh Emerald KPI

```tsx
className="
  border-emerald-200 bg-emerald-50/70
  dark:border-emerald-500/30
  dark:bg-emerald-500/[0.06]
"
```

---

# 12. ALERT

Gunakan alert untuk:

- laporan belum diisi;
- absensi belum lengkap;
- error;
- berhasil;
- data kosong.

## Light Theme

- sukses: emerald-50;
- warning: amber-50;
- error: red-50;
- info: blue-50.

## Dark Theme

- gunakan background warna 5–10% opacity;
- border 25–35% opacity;
- teks lebih terang.
- **KHUSUS MONITORING & DASHBOARD GURU**: Jangan gunakan warna merah gelap murni (`bg-red-950` atau `bg-rose-950`) untuk kondisi "kosong/terkunci". Gunakan warna slate/emerald yang soft (contoh: `dark:bg-slate-900/40` atau `dark:bg-emerald-950/20`) agar menyatu dengan background utama.

---

# 13. ACTION TOOLBAR

Semua aksi file berada dalam satu toolbar.

Urutan:

1. Preview PDF A4
2. Download/Cetak PDF A4
3. Preview PDF F4
4. Download/Cetak PDF F4
5. Download Per Rombel
6. Multi Bulan

Jangan mengulang tombol tersebut di header atau topbar.

## Light Theme

- preview: outline;
- download A4: outline atau blue subtle;
- F4: emerald subtle;
- multi bulan: emerald solid.

## Dark Theme

- preview: dark neutral;
- download A4: dark neutral;
- F4: emerald dark;
- multi bulan: emerald solid.

---

# 14. EDIT LAYOUT TOOLBAR

Struktur:

```txt
[Edit Layout] [Status Layout]
                         [Atur Kolom] [Atur Lebar] [Urutkan] [Simpan]
```

Saat aktif:

```txt
[Selesai Edit] [Simpan Layout] [Reset] [Gunakan Layout Global]
[Font] [Ukuran] [Bold] [Align] [Wrap] [Tinggi Baris]
```

Aturan:

- identitas fitur layout menggunakan purple;
- kontrol lengkap hanya muncul saat mode edit;
- jangan mengulang tombol layout;
- status layout tampil dalam badge;
- perubahan belum tersimpan harus terlihat.

---

# 15. TABEL REKAP

Grup:

1. Identitas
2. Progres Bulanan
3. Absensi Bulanan
4. Penilaian Progresif
5. Hasil

## Warna header grup

Gunakan warna yang *soft* (tidak pure/terlalu kaku) agar menyatu dengan latar belakang dark theme. Gunakan opacity seperti `/30` atau `/40` pada background, dan text yang lebih kalem (misalnya `-200` atau `-300`).

| Grup | Light | Dark (Soft Colors) |
|---|---|---|
| Identitas | Slate 100 | `dark:bg-slate-900/40 dark:text-slate-200` |
| Progres | Emerald 100 | `dark:bg-emerald-950/40 dark:text-emerald-200` |
| Absensi | Blue 100 | `dark:bg-sky-950/40 dark:text-sky-200` |
| Penilaian | Amber 100 | `dark:bg-amber-950/40 dark:text-amber-200` |
| Hasil | Purple 100 | `dark:bg-violet-950/40 dark:text-violet-200` |

## Aturan

- sticky header;
- dua tingkat header;
- nama siswa rata kiri;
- nilai rata tengah;
- program dan level chip;
- badge status;
- row height 42–48 px;
- border tipis;
- hover halus;
- horizontal scroll;
- resize kolom;
- teks panjang wrap;
- jangan menghapus kolom utama;
- jangan membuat zebra strip terlalu kontras.

## Light Table

```tsx
className="
  border-slate-200
  bg-white
  text-slate-800
"
```

## Dark Table

```tsx
className="
  border-emerald-900/60
  bg-emerald-950/20
  text-emerald-50
"
```

---

# 16. PROGRAM DAN LEVEL

Program harus tampil sesuai data:

- Tahsin Dasar (Iqro)
- Tahsin Lanjutan
- Tahfizh

Jangan membuat label program baru yang tidak ada di sistem.

Level menggunakan chip:

- Iqro 1
- Iqro 2
- Iqro 3
- Al-Qur'an
- Juz 30
- dan seterusnya.

---

# 17. SCROLLBAR HORIZONTAL

Gunakan satu scrollbar permanen yang fixed atau sticky di bagian bawah viewport/area kerja. Scrollbar ini harus tetap terlihat dan bisa digunakan walaupun pengguna masih berada di bagian atas halaman, sehingga pengguna tidak perlu turun ke bawah tabel hanya untuk menggeser kolom.

Aturan wajib:

- fixed atau sticky di bawah viewport/area kerja;
- tetap muncul selama tabel lebih lebar dari layar, termasuk saat halaman berada di posisi atas;
- native scrollbar horizontal tabel disembunyikan;
- jangan memakai scrollbar horizontal lokal yang hanya berada di dalam tabel;
- jangan membuat scrollbar horizontal di setiap tabel/section;
- sinkron dua arah antara scrollbar bawah dan posisi scroll tabel;
- tidak ada scrollbar ganda;
- refresh saat resize kolom, zoom, perubahan layout, atau perubahan lebar tabel;
- warna mengikuti theme;
- scrollbar harus cukup jelas untuk desktop dan mobile.

Pola yang disukai:

```txt
Halaman atas / tengah / bawah
└── Tabel lebar
    └── native scrollbar tabel tersembunyi

Viewport bawah
└── Fixed Horizontal Scrollbar permanen
```

## Light Theme

- track: slate-200;
- thumb: emerald-500;
- hover: emerald-600.

## Dark Theme

- track: emerald-950;
- thumb: emerald-600;
- hover: emerald-500.

Gunakan shared component:

```tsx
<FixedHorizontalScrollbar
  scrollContainerRef={tableScrollRef}
  contentRef={tableContentRef}
  refreshKey={refreshKey}
/>
```

---

# 18. PDF DAN CETAK

Format:

- A4 Landscape
- F4 Landscape `330 × 210 mm`

Aturan:

- preview dan download memakai generator sama;
- hasil preview dan download identik;
- header tabel diulang;
- setiap rombel memiliki judul;
- data tidak boleh terpotong;
- kolom Catatan boleh dipisah jika F4 tidak muat;
- catatan tidak boleh hilang;
- tombol PDF hanya muncul satu kali.

---

# 19. BADGE

Gunakan badge untuk:

- Sudah Diisi
- Belum Diisi
- Lengkap
- Belum Lengkap
- Sangat Baik
- Baik
- Cukup
- Perlu Perbaikan

Aturan:

- gunakan `rounded-md`;
- tidak terlalu besar;
- teks tetap terbaca;
- warna sama makna di kedua tema;
- jangan memakai warna merah untuk status netral.

---

# 20. EMPTY STATE

Format:

```txt
Ikon
Judul
Deskripsi
Satu aksi
```

Contoh:

```txt
Belum ada laporan pada periode ini
Pilih bulan atau rombel lain, atau mulai input laporan.
```

---

# 21. LOADING

Gunakan:

- skeleton kartu;
- skeleton tabel;
- spinner pada tombol;
- progress text untuk banyak file.

Jangan mengganti seluruh halaman dengan satu spinner bila struktur halaman tetap dapat muncul.

---

# 22. RESPONSIVE

## Desktop

- sidebar tetap;
- 6 KPI;
- filter grid;
- tabel horizontal;
- toolbar satu panel.

## Tablet

- sidebar collapsible;
- KPI 3 kolom;
- filter 2–3 kolom;
- toolbar wrap.

## Mobile

- sidebar drawer;
- KPI 2 kolom;
- filter 1 kolom;
- tombol full width;
- tabel dapat menjadi card;
- data penting tidak boleh hilang.

---

# 23. ACCESSIBILITY

Wajib:

- label pada input;
- `aria-label` untuk icon button;
- focus state terlihat;
- kontras mencukupi;
- jangan hanya mengandalkan warna;
- heading berurutan;
- modal keyboard friendly;
- tooltip untuk ikon yang tidak jelas.

---

# 24. UX RULES

1. Search siswa hanya satu.
2. Filter hanya satu panel.
3. Tombol PDF hanya satu toolbar.
4. Edit Layout hanya satu toolbar.
5. Jangan menduplikasi aksi.
6. Jangan membuat tombol sama di topbar dan content.
7. KPI dapat menjadi shortcut filter.
8. Reset tidak lebih menonjol dari Terapkan Filter.
9. Sticky header menjaga konteks.
10. Status aktif jelas.
11. Perubahan layout belum disimpan harus terlihat.
12. Konfirmasi reset atau penghapusan.
13. Jangan mengubah data karena perubahan visual.
14. Jangan menambahkan fitur yang tidak diminta.
15. Gunakan shared component.

---

# 25. DO

- gunakan hierarchy;
- gunakan Lucide;
- gunakan warna berdasarkan makna;
- kelompokkan aksi;
- gunakan spacing konsisten;
- pertahankan pencarian siswa;
- gunakan satu filter panel;
- gunakan satu action toolbar;
- gunakan satu layout toolbar;
- jaga dark dan light konsisten;
- pertahankan fitur lama.

---

# 26. DON'T

- jangan mengulang tombol;
- jangan mengulang filter;
- jangan mengulang search;
- jangan menyembunyikan search;
- jangan memakai font terlalu kecil;
- jangan memakai warna neon;
- jangan membuat semua tombol hijau;
- jangan memotong teks penting;
- jangan membuat scrollbar ganda;
- jangan memakai ikon tanpa arti;
- jangan mengubah database karena desain;
- jangan menghapus fitur lama;
- jangan mengorbankan UX demi estetika.

---

# 27. STRUKTUR REKAP LAPORAN

```tsx
<div className="spreadsheet-report-page space-y-5">
  <PageHeader />

  <FilterPanel>
    <StudentSearch />
    <ClassFilter />
    <YearFilter />
    <RombelFilter />
    <MonthFilter />
    <ReportStatusFilter />
    <AttendanceStatusFilter />
    <ProgressCategoryFilter />
    <ApplyFilterButton />
    <ResetButton />
  </FilterPanel>

  <StatsGrid />

  <IncompleteReportAlert />

  <ReportActionToolbar />

  <LayoutEditorToolbar />

  <ReportTable />

  <FixedHorizontalScrollbar />
</div>
```

---

# 28. SHARED PANEL CLASS

```tsx
className="
  rounded-xl border
  border-emerald-100 bg-white shadow-sm
  dark:border-emerald-900/60
  dark:bg-emerald-950/30
  dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]
"
```

---

# 29. PRIMARY BUTTON

```tsx
className="
  border border-emerald-500/20
  bg-emerald-600 text-white
  hover:bg-emerald-500
  dark:bg-emerald-700
  dark:hover:bg-emerald-600
"
```

---

# 30. GOLD BUTTON

```tsx
className="
  border border-amber-400/40
  bg-amber-500/10
  text-amber-700
  hover:bg-amber-500/20
  dark:text-amber-200
"
```

---

# 31. INPUT CLASS

```tsx
className="
  h-10 rounded-lg
  border-emerald-200 bg-white
  text-slate-900
  placeholder:text-slate-400
  focus-visible:ring-emerald-500/40
  dark:border-emerald-900/70
  dark:bg-black/20
  dark:text-emerald-50
  dark:placeholder:text-emerald-200/40
"
```

---

# 32. THEME SWITCHER

Dukung:

- Light
- Dark
- System

Gunakan class `.dark` pada root.

Contoh:

```tsx
<html className={theme === "dark" ? "dark" : ""}>
```

Jangan membuat struktur layout berbeda antara Light dan Dark.

---

# 33. IMPLEMENTATION RULES

Saat menerapkan:

1. Baca `.agents/AGENTS.md`.
2. Pertahankan flow lama.
3. Jangan mengubah Supabase.
4. Jangan membuat migration.
5. Jangan mengubah SQL.
6. Jangan mengubah RLS.
7. Gunakan komponen bersama.
8. Lakukan perubahan kecil.
9. Uji light dan dark.
10. Uji desktop, tablet, mobile.
11. Jalankan:

```bash
git diff --check
npm run lint:changed
npm run build
```

---

# 34. RINGKASAN IDENTITAS

Tahsin SDIT harus tampil:

- islami melalui emerald dan gold;
- profesional melalui struktur;
- powerful melalui data;
- rapi melalui spacing;
- mudah digunakan melalui search dan filter;
- konsisten di light dan dark;
- kuat di desktop dan mobile;
- stabil tanpa pengulangan fitur.

> Setiap halaman baru wajib mengikuti design system ini agar seluruh website terasa sebagai satu produk yang utuh.

