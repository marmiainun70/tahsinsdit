## Ringkasan
Tambahkan fitur "Sistem Terkait" yang menghubungkan Web Tahsin ke Web Tahfizh (dan sebaliknya) melalui card di Dashboard dan menu di sidebar. Tanpa perubahan database, auth, atau fitur utama.

## Analisis Situs Saat Ini
Berdasarkan `index.html` (judul "Tahsin SDIT Luqmanul Hakim"), halaman Dashboard ("Monitoring Iqro & Tahsin"), dan menu sidebar (Ujian Tahsin Dasar, Tahsin Lanjutan, Laporan Bulanan, dsb.), situs ini teridentifikasi sebagai **Web Tahsin**.

## Perubahan yang Dilakukan

### 1. Card "Sistem Terkait" di Dashboard
- Lokasi: Di `src/pages/Dashboard.tsx`, setelah section statCards.
- Desain: Card putih dengan border halus, ikon `ExternalLink` + `GraduationCap`, tombol warna tema hijau/emas.
- Konten:
  - Judul: "Buka Sistem Tahfizh"
  - Deskripsi: "Untuk setoran hafalan, ujian tahfizh, sertifikat tahfizh, dan QR validasi."
  - Tombol: "Masuk ke Sistem Tahfizh" → `window.location.href = "https://tahfizhsditluqmanulhakim.lovable.app"`
- Responsive: Grid 1 kolom mobile, 2-4 kolom desktop.

### 2. Menu Sidebar
- Lokasi: Di `src/components/Layout.tsx`, setelah "Menu Utama" atau di bawah "Data Kelas".
- Label: "Buka Sistem Tahfizh"
- Ikon: `ExternalLink`
- Aksi: `window.location.href = "https://tahfizhsditluqmanulhakim.lovable.app"` (bukan `<Link>` internal React Router).

### 3. Deteksi Otomatis (untuk reuse)
- Buat helper kecil atau inline check berdasarkan `window.location.hostname` / `document.title` untuk menentukan apakah ini Web Tahsin atau Web Tahfizh, sehingga jika kode ini nanti dicopy ke Web Tahfizh, card otomatis menunjukkan ke Web Tahsin.

## Teknis
- Tidak ada perubahan database, Supabase, auth, rumus penilaian, PDF, atau fitur berjalan.
- Import ikon dari `lucide-react` (sudah tersedia).
- Build harus lolos TypeScript tanpa error.