# Data Completeness Rules

Gunakan aturan ini setiap membuat rekap, chart, dashboard, atau perbandingan data Supabase.

## Monthly reports

- Jangan mengandalkan default limit Supabase/PostgREST untuk rekap besar.
- Untuk pembacaan `monthly_reports` lintas banyak siswa, selalu gunakan pagination `.range(from, to)` dengan batch 1000 sampai batch terakhir kurang dari 1000.
- Hindari `.in("student_id", ids)` untuk daftar siswa yang besar di dashboard/rekap. Ambil data periode secara paginated, lalu filter lokal dengan `Set` jika daftar ID bisa panjang.
- Untuk perbandingan antar bulan, pastikan key yang dipakai sama di kedua sisi. Jika bulan ini dikelompokkan berdasarkan nama guru, bulan lalu juga harus memakai nama guru yang sama, bukan `teacher_id`.

## Teacher load

- Tab beban guru bulan ini harus mengambil data dari rekap Monitoring yang sudah lengkap, bukan dari tabel tampilan yang bisa menggabungkan kolom menjadi "Guru Lainnya".
- Chart distribusi boleh membatasi tampilan untuk keterbacaan, tetapi sumber agregasinya tetap harus berasal dari data lengkap.
- Jika chart memakai Top 8 atau Top 15, tampilkan catatan UI bahwa data dibatasi untuk keterbacaan dan sediakan pilihan "Semua".

## Period snapshots

- Jangan jadikan nama siswa, kelas, rombel, atau level aktif sebagai sumber utama untuk laporan bulan lama.
- Saat `monthly_reports` dibuat, simpan snapshot periode: `student_name_snapshot`, `kelas_snapshot`, `rombel_snapshot`, `level_snapshot`, `teacher_id_snapshot`, dan `teacher_name_snapshot`.
- Rekap lama harus memprioritaskan snapshot ini agar tetap akurat setelah siswa naik kelas, pindah rombel, namanya dikoreksi, atau guru pengampu berubah.
- Backfill snapshot otomatis hanya bisa memakai kondisi data yang tersedia saat migrasi dijalankan. Jika histori lama sudah berubah sebelum snapshot dibuat, koreksi historis perlu sumber pembanding seperti Excel/arsip periode.
