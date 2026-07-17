
# Rencana Optimasi Performa (sebelum upgrade instance)

Berdasarkan slow query log, ~90% beban compute berasal dari 3 hotspot: `monthly_reports + students` (list & rekap), `students` (paginated tanpa filter), dan sesi CBT (`asesmen_jawaban` upsert + `asesmen_session` update). Semua bisa diringankan tanpa mengubah fitur.

## Target hotspot & aksi

### 1. `monthly_reports` list dengan embed `students` (≈370 ribu ms total)
- **Masalah:** setiap render `RecapReport`, `MonthlyReport`, `StudentProgress` mengambil embed `students(nama,kelas,rombel,level)` via LEFT JOIN LATERAL. Sering di-refetch oleh React Query (`refetchOnWindowFocus`, `refetchOnMount`).
- **Aksi kode:**
  - Set default React Query di `src/main.tsx` / `App.tsx`: `staleTime: 5 * 60_000`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`.
  - Di `useMonthlyReports.ts` dan `useMultiMonthReports.ts`: hentikan embed `students(...)` jika snapshot (`student_name_snapshot`, `kelas_snapshot`, dst.) sudah tersedia — pakai snapshot langsung. Jatuhkan embed hanya untuk baris yang benar-benar tidak punya snapshot.
  - Batasi `.range()` per halaman UI (jangan tarik semua bulan sekaligus di dashboard).
- **Aksi DB (migration):**
  - `CREATE INDEX idx_monthly_reports_year_month_id ON public.monthly_reports (year DESC, month DESC, id);`
  - `CREATE INDEX idx_monthly_reports_student_period ON public.monthly_reports (student_id, year, month);`

### 2. `students` paginated (≈365 ribu ms total, 13 ribu calls)
- **Masalah:** hampir setiap halaman memanggil `useStudents()` yang menarik seluruh baris; `usePaginatedStudents` dipakai lagi di banyak layar dengan `queryKey` berbeda sehingga tidak di-share.
- **Aksi kode:**
  - Ganti `useStudents()` konsumen yang hanya butuh nama/kelas jadi `usePaginatedStudents` atau selector ringan (`select: id,nama,kelas,rombel,level`).
  - Satukan `queryKey` daftar siswa yang identik (hapus parameter yang tidak dipakai) agar cache dipakai bersama.
  - Terapkan `staleTime` 5 menit khusus siswa (data jarang berubah).
- **Aksi DB:**
  - `CREATE INDEX idx_students_kelas_nama ON public.students (kelas, nama);` (menyesuaikan ORDER BY).
  - `CREATE INDEX idx_students_status_kelas ON public.students (status_siswa, kelas);`

### 3. Sesi CBT: `asesmen_jawaban` upsert & `asesmen_session.last_question` (≈330 ribu ms)
- **Masalah:** setiap klik jawaban / next question → 1 network call. Volume sangat tinggi.
- **Aksi kode di `useCBT.ts` / `CBTRoom.tsx`:**
  - Debounce simpan jawaban 400–800 ms (simpan hanya jawaban terakhir per soal).
  - Debounce update `last_question` (misal 1 detik atau saat pindah soal saja, bukan setiap render).
  - Batch multiple jawaban dalam satu upsert jika tersedia (kumpulkan queue lalu flush).
- **Aksi DB:** indeks sudah cukup (PK composite). Tidak perlu tambahan.

### 4. `role_permissions` (3.5 ribu calls, 36 detik total)
- **Aksi kode:** cache di React Query dengan `staleTime: Infinity` (invalidate manual saat admin menyimpan perubahan). Saat ini dipanggil ulang di banyak layar.

### 5. `exam_schedules` & `attendance`
- **Aksi DB:**
  - `CREATE INDEX idx_exam_schedules_tanggal_waktu ON public.exam_schedules (tanggal, waktu_mulai);`
  - `CREATE INDEX idx_attendance_year_month ON public.attendance (year DESC, month DESC);`
  - `CREATE INDEX idx_attendance_student_period ON public.attendance (student_id, year, month);`

## Urutan eksekusi
1. Tambah semua indeks di atas dalam satu migration.
2. Set React Query defaults global + turunkan `refetchOnWindowFocus`.
3. Refactor `useMonthlyReports` & konsumen `useStudents` supaya minimal payload dan pakai snapshot.
4. Debounce & batching di CBT (`useCBT`).
5. Verifikasi dengan slow_queries lagi setelah 1–2 hari pemakaian nyata.

## Trade-off (bahasa umum)
- Indeks membuat baca lebih cepat, tulis sedikit lebih lambat, dan pakai storage ekstra — untuk pola pemakaian Anda dampaknya positif jelas.
- Menurunkan `refetchOnWindowFocus` berarti data tidak auto-refresh saat pindah tab; user tetap bisa refresh manual. Hemat sangat banyak call.
- Debounce CBT: jawaban tersimpan ~0.5 detik setelah klik terakhir, bukan instan. Aman selama ada flush saat pindah soal / submit.

## Ekspektasi hasil
Perkiraan penurunan beban compute 40–60% tanpa upgrade instance. Jika masih kurang setelah verifikasi, baru pertimbangkan upgrade.
