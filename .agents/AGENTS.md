# Petunjuk Agent untuk Tahsin SDIT

Dokumen ini wajib dibaca sebelum agent AI mengubah repository.

## Tujuan utama

Lakukan perubahan sekecil mungkin untuk memenuhi permintaan pengguna. Pertahankan alur, data lama, hak akses, rumus penilaian, dan perilaku fitur yang tidak disebutkan.

## Batas keras

- Jangan mengubah struktur database, migration, SQL, RLS, trigger, atau data produksi kecuali diminta secara eksplisit.
- Jangan menghapus atau menimpa data siswa, kelas, ujian, laporan, absensi, akun, maupun riwayat.
- Jangan membuat fitur tambahan, redesign luas, atau mengganti library hanya karena terlihat lebih modern.
- Jangan mencampur perubahan UI, database, pemulihan data, dan dependency dalam satu pekerjaan.
- Jangan menyentuh file di luar lingkup permintaan. Jika file tambahan memang diperlukan, jelaskan alasannya.
- Jangan mengubah rumus nilai, pemetaan level, status akun, atau aturan transisi pembelajaran tanpa persetujuan.
- Jangan melakukan commit atau push sebelum build dan pemeriksaan file yang berubah selesai.
- Setelah verifikasi lulus, pekerjaan perubahan kode harus diselesaikan sampai commit dan push ke branch aktif, kecuali pengguna secara eksplisit mengatakan "lokal saja" atau "jangan push".

## Cara bekerja

1. Baca permintaan dan tulis ulang lingkupnya dalam 1-3 kalimat.
2. Periksa `git status` dan perubahan terbaru sebelum mengedit.
3. Temukan control point yang sudah ada; gunakan komponen/helper bersama daripada membuat jalur kedua.
4. Buat patch sempit dan pertahankan gaya kode yang sudah ada.
5. Periksa `git diff --check` dan `npm run lint:changed`.
6. Jalankan `npm run build` untuk perubahan source/config.
7. Pastikan hanya file dalam lingkup tugas yang akan di-stage.
8. Commit dengan pesan yang menjelaskan satu tujuan perubahan.
9. Push branch aktif ke `origin` dengan `npm run push:remote`. Jangan gunakan `git push` langsung dari lingkungan agent.
10. Jalankan `npm run verify:remote` dan pastikan hash lokal sama dengan hash remote.
11. Laporkan file yang berubah, hasil verifikasi, commit, branch, dan status sinkronisasi remote.

## Alur publikasi GitHub

- Jangan menganggap pekerjaan selesai jika perubahan hanya ada di komputer lokal.
- Default untuk tugas implementasi adalah: edit -> verifikasi -> commit -> `npm run push:remote` -> verifikasi remote.
- Lingkungan agent dapat menyuntikkan dummy `GITHUB_TOKEN`. Karena itu, gunakan `npm run push:remote`; script ini membersihkan token environment dan memakai Git Credential Manager secara eksplisit.
- Jika push gagal karena autentikasi atau jaringan, tampilkan error sebenarnya dan langkah yang diperlukan. Jangan mengatakan tugas selesai.
- Jangan menggunakan force push, reset, rebase, atau mengubah riwayat tanpa izin eksplisit.
- Jangan memasukkan file lain yang tidak terkait hanya agar worktree terlihat bersih.
- Setelah push, `npm run verify:remote` harus menampilkan hash lokal dan remote yang sama.

## Aturan UI

- Untuk pekerjaan UI/desain, baca dan ikuti `desain.md` di root repository sebagai design system resmi proyek Tahsin.
- Utamakan tampilan ringkas, responsif, dan nyaman pada mobile.
- Gunakan token warna dari `src/index.css` dan komponen yang sudah tersedia.
- Pastikan perubahan tema memakai satu provider yang sama.
- Uji desktop dan mobile jika layout, sidebar, dialog, tabel, atau navigasi berubah.
- Jangan menambahkan warna hardcoded baru jika token semantik seperti `background`, `card`, `foreground`, `muted`, `border`, `primary`, atau `secondary` sudah cukup.

## Aturan Supabase dan data

- Periksa type/generated schema dan migration lama sebelum menyimpulkan kolom tidak ada.
- Pisahkan migration dari perubahan frontend.
- Migration baru harus aman untuk data lama dan tidak boleh melakukan backfill spekulatif.
- Jangan menjalankan query mutasi terhadap database live tanpa izin eksplisit.
- Jika pengguna perlu menjalankan SQL manual di Supabase SQL Editor, buat file SQL terpisah di `outputs/<nama_tugas>_sql_parts/`.
- Pecah SQL manual menjadi beberapa part jika melebihi sekitar 100-150 baris per sekali jalan, dan sertakan `README-URUTAN.txt` yang menjelaskan urutan eksekusi.

## Definisi selesai

Pekerjaan belum selesai hanya karena halaman terlihat benar. Minimal:

- patch sesuai permintaan dan tidak melebar;
- `git diff --check` lulus;
- `npm run lint:changed` lulus untuk file TypeScript yang disentuh;
- `npm run build` lulus;
- tidak ada perubahan database atau data yang tidak diminta;
- perubahan sudah di-commit dan di-push, kecuali pengguna meminta lokal saja;
- `npm run verify:remote` mengonfirmasi branch lokal sama dengan GitHub;
- ringkasan akhir menyebutkan hal yang belum dapat diverifikasi.
