# Rencana: Landing Page "Islamic Modern International School"

## Ringkasan
Membangun halaman depan publik baru yang elegan, islami, dan profesional, lengkap dengan Hero, Quick Access, Keunggulan, Alur Kerja, Statistik, Sistem Terkait, dan Footer. Tidak menyentuh database, login, sistem nilai, rapor, sertifikat, QR, PDF, atau halaman/fitur lain yang sudah berjalan.

## Strategi Routing (aman, tidak merusak yang ada)
- Tambah route publik baru: `/landing` (bebas akses, tanpa Layout/Sidebar).
- Ubah perilaku root `/` HANYA untuk user yang BELUM login: alih-alih langsung ke `/login`, mereka diarahkan ke `/landing`.
- User yang SUDAH login: `/` tetap menampilkan Dashboard seperti sekarang (tidak berubah).
- Tombol "Masuk Sistem" / "Masuk ke Dashboard" di landing → `/login` (sudah ada). Jika sudah login, otomatis ke Dashboard.
- Semua route lain (`/class/...`, `/laporan-bulanan`, `/pengaturan-notifikasi`, dst.) tidak diubah sama sekali.

## File yang Dibuat
1. `src/pages/Landing.tsx` — Halaman landing utama (publik, tanpa sidebar).
2. `src/components/landing/Navbar.tsx` — Header: logo + nama + subjudul + menu anchor (Beranda, Fitur, Alur Kerja, Rekap, Sistem Terkait) + tombol "Masuk Sistem".
3. `src/components/landing/Hero.tsx` — Hero gradient emerald→navy, badge, judul besar, sub-judul, 2 CTA, dashboard preview mock di sisi kanan (card statistik dummy + ikon Al-Qur'an/guru/siswa/sertifikat/QR), ornamen geometric islami SVG halus di background.
4. `src/components/landing/QuickAccess.tsx` — 4 kartu: Ujian Tahsin, Ujian Tahfizh, Rapor & Sertifikat, Rekap & Statistik (icon, hover lift, tombol kecil "Buka" → link ke `/login`).
5. `src/components/landing/Features.tsx` — 6 keunggulan, grid 3 kolom desktop / 1 kolom mobile.
6. `src/components/landing/Workflow.tsx` — Timeline 6 langkah alur kerja (Pilih siswa → … → QR validasi), step card modern dengan connector.
7. `src/components/landing/Stats.tsx` — Statistik ringkas: Siswa Aktif, Rombel, Ujian Selesai, Sertifikat Terbit, Rapor Terunduh. Menampilkan angka dummy aman (tidak melakukan query baru ke DB di scope ini agar tidak mempengaruhi performa/auth publik).
8. `src/components/landing/RelatedSystemSection.tsx` — Section "Sistem Terkait" memakai konstanta `RELATED_SYSTEM` yang sudah ada di `src/components/RelatedSystemCard.tsx` (tahsin ↔ tahfizh) dengan `window.location.href` (eksternal, bukan routing internal).
9. `src/components/landing/Footer.tsx` — Footer elegan: logo, nama, sub-sistem, deskripsi, copyright tahun berjalan.
10. `src/components/landing/IslamicPattern.tsx` — SVG ornamen geometric (bintang 8/girih) sebagai background halus, opacity rendah.

## File yang Diubah (minimal)
- `src/App.tsx` — Tambah `import Landing` dan route `/landing` (publik). Ubah redirect: jika `!session && pathname === "/"` → `<Navigate to="/landing" />`. Tidak mengubah route lain.
- `index.html` — Update `<title>` & meta description agar SEO landing rapi (judul & deskripsi sekolah). Tidak mengubah skrip/PWA.

## Desain Visual
- Palet: emerald `#0E5E4E` / `#0A7C66`, navy `#0B1F3A`, putih `#FFFFFF`, gold lembut `#C9A24C`/`#E6CB87`. Diturunkan dari token CSS yang ada (`--primary`, `--gold`) bila memungkinkan; sisanya pakai class Tailwind langsung khusus landing.
- Tipografi: pakai `Plus Jakarta Sans` (sudah ada) untuk body, `Amiri` (sudah ada) untuk aksen arabic kecil di hero.
- Gradient hero: `from-[#0B1F3A] via-[#0E5E4E] to-[#0A7C66]` + overlay SVG geometric pattern (opacity 8–12%).
- Card: rounded-2xl, shadow lembut, border tipis, hover lift + ring gold halus.
- Animasi: `framer-motion` (sudah ada) untuk fade/slide masuk section, hover micro-interaction. Tidak memakai library baru.
- Responsif: grid 1/2/3 kolom breakpoint `sm/md/lg`. Navbar collapse jadi menu hamburger di mobile.

## Hal yang TIDAK Disentuh
- Database/Supabase, schema, migrations, RLS, policies.
- `AuthContext`, `Login.tsx`, `Dashboard.tsx`, dan semua halaman fitur.
- Rumus nilai, PDF, sertifikat, QR, rekap, monthly report, attendance, notifikasi, broadcast.
- `Layout.tsx`, sidebar, `NotificationBell`, `PWAInstallPrompt`, service worker.
- `src/index.css` token global (perubahan warna landing dilakukan lokal via class Tailwind agar halaman lain tidak terpengaruh).

## QA Sebelum Selesai
- Cek `/landing` tampil publik tanpa redirect ke login.
- Cek `/` tetap mengarah ke Dashboard untuk user login, dan ke `/landing` untuk yang belum login.
- Cek tombol "Masuk Sistem" → `/login`; tombol "Sistem Terkait" → URL eksternal (full reload).
- Cek responsif desktop / tablet / mobile.
- Tidak ada error TypeScript / import icon `lucide-react`.
