# Rencana: PWA + Push Notification Realtime

## Tujuan
Mengubah aplikasi Tahsin SDIT menjadi **PWA installable** dan menambahkan **push notification realtime** untuk laporan bulanan baru, jadwal ujian, peringatan "Perlu Perhatian", dan pengumuman admin.

## Catatan penting tentang iOS
- Di iPhone (Safari), push notification PWA **hanya bekerja jika pengguna meng-install aplikasi ke Home Screen** (Share → Add to Home Screen) terlebih dahulu. Sebelum di-install, iPhone tidak menerima notifikasi sama sekali.
- Di Android (Chrome) berjalan penuh tanpa harus di-install (meski lebih baik di-install).
- Akan ditampilkan banner "Install Aplikasi" agar wali murid/guru terdorong meng-install.

## Bagian 1 — PWA Installable
1. Tambah `manifest.webmanifest` dengan nama "Tahsin SDIT", warna brand (Forest Green & Gold), `display: standalone`, ikon 192/512/maskable.
2. Tambah meta tag mobile + iOS (`apple-touch-icon`, `apple-mobile-web-app-capable`, theme-color) di `index.html`.
3. Generate ikon PWA (icon-192, icon-512, maskable, apple-touch-icon) menggunakan logo masjid + warna brand.
4. Setup service worker via `vite-plugin-pwa` dengan pengaman:
   - Tidak aktif di dev / iframe preview Lovable.
   - `NetworkFirst` untuk HTML, `navigateFallbackDenylist` untuk `/~oauth`.
   - Auto-update.
5. Komponen `InstallPrompt` (banner kecil di dashboard) yang menampilkan tombol "Install Aplikasi" saat browser men-trigger `beforeinstallprompt`, plus instruksi khusus iOS ("Tap Share → Add to Home Screen").

## Bagian 2 — Push Notification (Web Push)

### Database (migration)
- Tabel `push_subscriptions` (user_id, endpoint, p256dh, auth, user_agent, created_at) + RLS: user hanya bisa kelola subscription miliknya, admin bisa baca semua untuk broadcast.
- Tabel `notifications` (id, user_id, type, title, body, link, read_at, created_at) sebagai inbox in-app + RLS per user.
- Tabel `notification_preferences` (user_id + flag per jenis notifikasi) — default semua ON.
- GRANT untuk `authenticated` + `service_role`.

### Edge Functions
1. `save-push-subscription` — simpan/upsert subscription dari browser.
2. `send-push-notification` — kirim push via Web Push protocol (VAPID) ke daftar `push_subscriptions`. Dipakai oleh trigger & manual broadcast admin. Sekaligus insert ke tabel `notifications`.
3. `broadcast-announcement` — admin only, kirim pengumuman ke role tertentu (semua / guru / wali murid).

### Trigger otomatis (PostgreSQL → pg_net → edge function)
- **Laporan bulanan baru**: trigger di `monthly_reports` AFTER INSERT → kirim notif ke wali murid siswa terkait.
- **Nilai ujian baru**: trigger di tabel exam result → kirim notif ke wali murid.
- **Pengingat jadwal ujian**: cron `pg_cron` harian jam 07:00 → cek `exam_schedules` H-1 → kirim notif ke siswa/wali murid + penguji.
- **Perlu Perhatian**: modifikasi fungsi `check_tahsin_attention` agar saat flag diset → panggil edge function untuk notif admin & guru rombel siswa.
- **Pengumuman admin**: manual via halaman admin → `broadcast-announcement`.

### Secrets yang dibutuhkan
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (email admin) — akan diminta lewat add_secret. Saya akan beri tahu cara generate (perintah `npx web-push generate-vapid-keys`).

### Frontend
- Hook `usePushNotifications` — minta permission, subscribe ke `pushManager`, kirim subscription ke edge function.
- Tombol "Aktifkan Notifikasi" di halaman pengaturan + prompt halus di dashboard pertama kali login.
- Halaman / dropdown **Inbox Notifikasi** (ikon lonceng di header) — list dari tabel `notifications`, realtime via Supabase Realtime subscription, badge unread.
- Halaman admin **Kirim Pengumuman** (judul, isi, target role).
- Service worker handler `push` → `self.registration.showNotification(...)` + `notificationclick` → buka `link`.

## Bagian 3 — Urutan eksekusi
1. Migration tabel + RLS + preferences.
2. Generate VAPID keys (minta user input via add_secret).
3. Edge functions (save-subscription, send-push, broadcast).
4. Trigger DB & cron job pengingat ujian.
5. Setup PWA (manifest, ikon, service worker dengan handler push).
6. Frontend: hook subscribe, inbox bell, halaman pengaturan notifikasi, halaman broadcast admin, banner install.
7. QA: test install di Android & desktop, test kirim manual, test trigger laporan bulanan.

## Yang TIDAK termasuk
- Publish ke Play Store / App Store (perlu pendekatan Native/Capacitor).
- Notifikasi SMS / email (terpisah).
- Backfill subscription untuk user lama — mereka akan diminta enable saat login berikutnya.
