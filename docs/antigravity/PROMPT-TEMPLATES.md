# Template Prompt Antigravity

Gunakan salah satu template berikut. Jangan hanya menulis seperti "buat lebih bagus" atau "perbaiki halaman ini".

## Perubahan UI sempit

```text
Baca AGENTS.md terlebih dahulu.

Tugas:
[jelaskan bagian yang perlu diubah]

Hasil yang saya inginkan:
- [hasil 1]
- [hasil 2]

Batas:
- Jangan mengubah logic fitur, query, database, rumus nilai, atau hak akses.
- Jangan membuat fitur baru.
- Ubah hanya file yang benar-benar terkait.
- Pertahankan tampilan mobile.

Sebelum selesai:
- Tampilkan ringkasan diff.
- Jalankan git diff --check, npm run lint:changed, dan npm run build.
- Jika semuanya lulus, commit dan push ke branch aktif.
- Jalankan npm run verify:remote dan jangan berhenti sebelum lokal sama dengan GitHub.
- Jangan menggunakan force push.
```

## Memperbaiki bug

```text
Baca AGENTS.md terlebih dahulu.

Gejala:
[apa yang terjadi]

Seharusnya:
[perilaku yang benar]

Cara reproduksi:
1. [...]
2. [...]

Cari penyebab sebenarnya terlebih dahulu. Jangan redesign atau refactor luas.
Pertahankan data lama, logic lain, database, dan hak akses.

Setelah menemukan penyebab:
- Jelaskan penyebab singkat.
- Terapkan perbaikan paling sempit.
- Jalankan pemeriksaan file berubah dan build.
- Jika lulus, commit, push, lalu jalankan npm run verify:remote.
- Sebutkan apa yang berhasil diuji.
```

## Perubahan yang melibatkan database

```text
Baca AGENTS.md terlebih dahulu.

Tugas database:
[jelaskan kebutuhan]

Sebelum mengubah apa pun:
- Periksa schema, generated types, migration lama, RLS, trigger, dan data yang sudah ada.
- Berikan rencana migration yang aman untuk data lama.
- Jangan menjalankan migration atau query mutasi ke database live.
- Jangan melakukan backfill jika periode/nilai yang benar belum diketahui.

Frontend dan migration harus dipisahkan agar dapat direview terpisah.
Tunggu persetujuan saya sebelum tindakan live.
```

## Audit hasil Antigravity

```text
Baca AGENTS.md terlebih dahulu.

Audit perubahan yang belum di-commit.
Jangan mengedit terlebih dahulu.

Periksa:
- Apakah perubahan melebar dari permintaan?
- Apakah UI, database, SQL, data recovery, dan dependency tercampur?
- Apakah logic lama atau hak akses berubah?
- Apakah ada provider/helper duplikat?
- Apakah mobile dan dark mode tetap aman?
- Apakah build dan lint file berubah lulus?

Laporkan temuan berdasarkan tingkat risiko, dengan file dan baris terkait.
Setelah itu tunggu perintah saya untuk memperbaiki.
```

## Perintah implementasi sampai GitHub

```text
Baca dan patuhi AGENTS.md.

Kerjakan perubahan berikut:
[jelaskan tugas]

Jangan berhenti setelah mengedit file lokal. Selesaikan alur berikut:
1. Periksa diff dan pastikan hanya file terkait yang berubah.
2. Jalankan git diff --check.
3. Jalankan npm run lint:changed.
4. Jalankan npm run build dan test yang relevan.
5. Commit hanya file terkait dengan pesan yang jelas.
6. Push branch aktif ke origin tanpa force push.
7. Jalankan npm run verify:remote.
8. Nyatakan selesai hanya jika hash lokal sama dengan GitHub.

Jika push gagal, tampilkan error asli dan jangan mengklaim perubahan sudah online.
```
