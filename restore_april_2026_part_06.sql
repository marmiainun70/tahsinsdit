-- Restore April 2026 monthly_reports, part 6 of 7.
-- Safe mode: existing April rows are skipped, not overwritten.

BEGIN;

CREATE TEMP TABLE _restore_april_2026_reports (
  kelas integer NOT NULL,
  rombel text NOT NULL,
  nama text NOT NULL,
  program_type text NOT NULL,
  iqra_level text,
  end_iqra_level text,
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  pages_read integer NOT NULL,
  target_pages integer NOT NULL,
  achievement_status text NOT NULL,
  notes text
) ON COMMIT DROP;

INSERT INTO _restore_april_2026_reports
(kelas, rombel, nama, program_type, iqra_level, end_iqra_level, start_page, end_page, pages_read, target_pages, achievement_status, notes)
VALUES
  (5, 'D', 'Salimah Khoir', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 14, 4, 15, 'not_achieved', NULL),
  (5, 'D', 'Salsabila Jannah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 8, 3, 15, 'not_achieved', NULL),
  (5, 'D', 'Salvina Varisha', 'iqra', 'Iqro 5', 'Iqro 5', 6, 13, 7, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah semakin lancar, akan tetapi lebih berlatih lagi untuk pengucapan huruf þµ þ™ þ« þ¯ þ­"'),
  (5, 'D', 'Salwa Nabila', 'iqra', 'Iqro 4', 'Iqro 4', 22, 24, 2, 15, 'not_achieved', NULL),
  (5, 'D', 'Shakyla Aulia', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 9, 8, 15, 'not_achieved', '-'),
  (5, 'D', 'Shasha Shabillah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', '-'),
  (5, 'D', 'Syifa Az Zahra', 'iqra', 'Iqro 6', 'Iqro 6', 9, 12, 3, 15, 'not_achieved', NULL),
  (6, 'A', 'Abdullah Aziz syahreza sinurat', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 12, 2, 15, 'not_achieved', '-'),
  (6, 'A', 'Abdurrahman arrayyan fadhillah', 'iqra', 'Iqro 4', 'Iqro 5', 25, 13, 18, 15, 'achieved', '-'),
  (6, 'A', 'Abdurrahman Umar alfaruq', 'tahfizh', 'Juz 30', 'Juz 28', 1, 1, 40, 3, 'achieved', '-'),
  (6, 'A', 'Abrizam Rajanangin Batubara', 'iqra', 'Iqro 6', 'Iqro 6', 9, 9, 0, 15, 'not_achieved', '-'),
  (6, 'A', 'Arjuna Siddiq Al-baihaqi', 'iqra', 'Iqro 4', 'Iqro 5', 26, 4, 8, 15, 'not_achieved', '-'),
  (6, 'A', 'Aufa Ar-Razzaq', 'iqra', 'Iqro 4', 'Iqro 5', 25, 1, 8, 15, 'not_achieved', '-'),
  (6, 'A', 'Azam Khalil Ar ramsyi', 'iqra', 'Iqro 5', 'Iqro 5', 4, 25, 21, 15, 'achieved', '-'),
  (6, 'A', 'Azka ramadhan', 'iqra', 'Iqro 4', 'Iqro 4', 9, 23, 14, 15, 'not_achieved', '-'),
  (6, 'A', 'Azwar Zaidan ibram', 'iqra', 'Iqro 4', 'Iqro 4', 15, 31, 16, 15, 'achieved', '-'),
  (6, 'A', 'Bayu alfahrizi', 'iqra', 'Iqro 4', 'Iqro 5', 21, 4, 13, 15, 'not_achieved', '-'),
  (6, 'A', 'Daffa Ramadhan Diarja', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 9, 12, 3, 15, 'not_achieved', '-'),
  (6, 'A', 'Danish Arfa Rizqiansyah', 'iqra', 'Iqro 6', 'Iqro 6', 23, 29, 6, 15, 'not_achieved', '-'),
  (6, 'A', 'Dzacky fayyadh pratama', 'iqra', 'Iqro 4', 'Iqro 5', 29, 8, 9, 15, 'not_achieved', '-'),
  (6, 'A', 'Fathirrahman Azka alfonso', 'iqra', 'Iqro 6', 'Iqro 6', 9, 32, 23, 15, 'achieved', '-'),
  (6, 'A', 'Kenzie Aditya Pratama Siswanto', 'tahfizh', 'Juz 30', 'Juz 27', 1, 1, 60, 3, 'achieved', '-'),
  (6, 'A', 'Luay Dwi Irawan', 'iqra', 'Iqro 6', 'Iqro 6', 17, 28, 11, 15, 'not_achieved', '-'),
  (6, 'A', 'Muhammad Adham Ginting', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 0, 2, 2, 15, 'not_achieved', 'baru ujian iqra'' Semoga makhraj nya lebih baik lagi'),
  (6, 'A', 'Muhammad Adiyat Harahap', 'iqra', 'Iqro 6', 'Iqro 6', 17, 24, 7, 15, 'not_achieved', '-'),
  (6, 'A', 'Muhammad Affan alwi', 'iqra', 'Iqro 4', 'Iqro 5', 31, 18, 17, 15, 'achieved', '-'),
  (6, 'A', 'Muhammad arifin ilham', 'iqra', 'Iqro 4', 'Iqro 4', 13, 22, 9, 15, 'not_achieved', '-'),
  (6, 'A', 'Muhammad Fadhil yaqdan gultom', 'iqra', 'Iqro 4', 'Iqro 5', 25, 9, 14, 15, 'not_achieved', '-'),
  (6, 'A', 'Muhammad Thalahah Al-Ukhasyah', 'iqra', 'Iqro 4', 'Iqro 4', 17, 19, 2, 15, 'not_achieved', 'Serinh tidak hadir ke sekolah'),
  (6, 'A', 'Muhammad Zahwan Firdaus', 'iqra', 'Iqro 6', 'Iqro 6', 22, 30, 8, 15, 'not_achieved', '-'),
  (6, 'A', 'Musa Ibnu hafidz', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 15, 3, 15, 'not_achieved', '-'),
  (6, 'A', 'Syarif Abdullah Razzaq', 'iqra', 'Iqro 6', 'Iqro 6', 1, 10, 7, 15, 'not_achieved', '-'),
  (6, 'A', 'Ubay', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 9, 11, 2, 15, 'not_achieved', '-'),
  (6, 'A', 'Yusuf Abdillah tarigan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 17, 27, 10, 15, 'not_achieved', '-'),
  (6, 'A', 'Zaheer Ansharie Permana', 'iqra', 'Iqro 6', 'Iqro 6', 22, 32, 10, 15, 'not_achieved', 'Ujian iqra'' dan belum lulus, diperhatikan lagi bacaan maad nya'),
  (6, 'B', 'Aldian Praditya', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 77, 84, 7, 15, 'not_achieved', '-'),
  (6, 'B', 'ARKAN ASHARI MAULANA', 'iqra', 'Iqro 5', 'Iqro 5', 8, 10, 2, 15, 'not_achieved', '-'),
  (6, 'B', 'Ayyub Fadhlullah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 11, 19, 8, 15, 'not_achieved', 'Surah Al-Baqarah'),
  (6, 'B', 'Dzakir Khafadi Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 118, 122, 4, 15, 'not_achieved', '-'),
  (6, 'B', 'DZENKA MUHAMMAD AVICENNA', 'iqra', 'Iqro 5', 'Iqro 5', 6, 9, 3, 15, 'not_achieved', '-'),
  (6, 'B', 'Faad Alzahabi', 'iqra', 'Iqro 4', 'Iqro 5', 27, 10, 13, 15, 'not_achieved', '-'),
  (6, 'B', 'FAEYZA ABRISAM FATHANAH', 'iqra', 'Iqro 6', 'Iqro 6', 1, 6, 3, 15, 'not_achieved', '-'),
  (6, 'B', 'FAHMI RAMADHAN', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 5, 4, 100, 'not_achieved', '-'),
  (6, 'B', 'GIBRAN AHMAD SYAHPUTRA', 'iqra', 'Iqro 6', 'Iqro 6', 25, 28, 3, 15, 'not_achieved', '-'),
  (6, 'B', 'Habil Mumfarid', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 57, 65, 8, 15, 'not_achieved', '-'),
  (6, 'B', 'HAFIDZ RAFFI RABBANI', 'iqra', 'Iqro 4', 'Iqro 4', 17, 20, 3, 15, 'not_achieved', '-'),
  (6, 'B', 'HAFIDZ RAMADHAN NAPITULU', 'iqra', 'Iqro 6', 'Iqro 6', 12, 14, 2, 15, 'not_achieved', '-'),
  (6, 'B', 'Khairi Azzam', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 17, 5, 15, 'not_achieved', '-'),
  (6, 'B', 'Lathef Nohan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 9, 6, 15, 'not_achieved', '-'),
  (6, 'B', 'Muchtar Hariansyah Simamora', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 55, 59, 4, 15, 'not_achieved', '-'),
  (6, 'B', 'Muhammad Aidil Ginting', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 4, 13, 9, 15, 'not_achieved', '-'),
  (6, 'B', 'Muhammad Gibran Habibi', 'iqra', 'Iqro 6', 'Iqro 6', 5, 11, 6, 15, 'not_achieved', '-'),
  (6, 'B', 'Muhammad Hafiz Ardian', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 98, 102, 4, 15, 'not_achieved', '-'),
  (6, 'B', 'MUHAMMAD HANIF KHAN', 'iqra', 'Iqro 6', 'Iqro 6', 27, 29, 2, 15, 'not_achieved', '-'),
  (6, 'B', 'MUHAMMAD ROBI', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 4, 1, 100, 'not_achieved', '-'),
  (6, 'B', 'NURHAN AFKAR FADHIL', 'iqra', 'Iqro 5', 'Iqro 5', 4, 6, 2, 15, 'not_achieved', '-'),
  (6, 'B', 'RAZIQ HANAN NOVIANTO', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 11, 13, 2, 100, 'not_achieved', '-'),
  (6, 'B', 'Said khoir', 'tahfizh', 'Juz 27', 'Juz 26', 13, 5, 28, 3, 'achieved', '-'),
  (6, 'B', 'SULTAN NADIF', 'iqra', 'Iqro 2', 'Iqro 2', 22, 24, 2, 15, 'not_achieved', '-'),
  (6, 'B', 'SYABIL RIZKI ( V-A)', 'iqra', 'Iqro 6', 'Iqro 6', 8, 16, 8, 15, 'not_achieved', '-'),
  (6, 'B', 'SYAFIQ FAUZAN', 'tahfizh', 'Tahfizh', 'Tahfizh', 1, 3, 2, 100, 'not_achieved', '-'),
  (6, 'B', 'Syakir Al-Baihaqi', 'iqra', 'Iqro 6', 'Iqro 6', 17, 23, 6, 15, 'not_achieved', '-'),
  (6, 'B', 'Zaid', 'tahfizh', 'Juz 28', 'Juz 27', 11, 6, 25, 3, 'achieved', '-'),
  (6, 'B', 'ZIKRI ALHAFIS ZULKARNAIN', 'iqra', 'Iqro 6', 'Iqro 6', 6, 9, 3, 15, 'not_achieved', '-'),
  (6, 'C', 'Adzkia Samha Saufa', 'tahfizh', 'Tahfizh', 'Tahfizh', 582, 597, 15, 100, 'not_achieved', 'Alhamdul;illah bacaan sudah bagus dan lancar serta tajwid baik Tetap semangat ya kak'),
  (6, 'C', 'Afifah Zhahirah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 28, 31, 3, 100, 'not_achieved', 'Alhamdulillah bacaan sudah bagus dan lancar perlu ditingkatkan lagi tajwidnya Tetap semangat ya kak'),
  (6, 'C', 'Aisyah Lubis', 'tahfizh', 'Tahfizh', 'Tahfizh', 518, 521, 3, 100, 'not_achieved', 'Alhamdulillah bacaan sudah bagus dan lancar dan tajwidnya baik Tetap semangat ya kak.'),
  (6, 'C', 'Akifa Dwila Putri', 'iqra', 'Iqro 6', 'Iqro 6', 4, 31, 27, 15, 'achieved', 'Alhamdulillah... Bacaan lancar,tapi masih banyak yg harus diperbaiki, terutama Makhraj dan Tajwidnya. tetap semangat y kk Akifa !!!!!!'),
  (6, 'C', 'Alifa Azkana Shadiqah', 'tahfizh', 'Tahfizh', 'Tahfizh', 28, 30, 2, 100, 'not_achieved', 'Bacaan kurang lancar, perlu banyak perbaikan Makhraj dan Tajwid tetap semangat y kk !!!'),
  (6, 'C', 'Alnisa Putri Hamzah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 14, 17, 3, 100, 'not_achieved', 'Alhamdulillah... bacaannya sdh lancar hanya perlu di tingkatkan lagi Makhraj dan Tajwidnya tetap semangat y kk!!'),
  (6, 'C', 'Assyfa Aqilla Jasmine', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 13, 17, 4, 100, 'not_achieved', 'Alhamdulillah.. bacaan kk sdh lancar, namun masih perlu perbaikan Makhraj dan Tajwidnya . lebih semangat lagi menghafal dan memuraja''ahnya y kk !!'),
  (6, 'C', 'Aziqra Valeeqa Siregar', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 4, 8, 4, 100, 'not_achieved', 'Bacaan kurang lancar, masih perlu banyak perbaikan Makhraj dan Tajwid. tetap semangat y kk Aziqra !!!'),
  (6, 'C', 'Azzahra Asyila Rahma', 'iqra', 'Iqro 6', 'Iqro 6', 4, 25, 21, 15, 'achieved', 'Alhamdulillah....... Bacaan lancar,Tapi masih perlu banyak belajar untuk memperbaiki bacaan, Makhraj dan Tajwidnya. Tetap semangat kk Asyila !!!!!!!'),
  (6, 'C', 'Caroline Yumnaa Syahnant', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 20, 32, 12, 100, 'not_achieved', 'Alhamdulillah... bacaan kk lancar ,tapi masih perlu perbaikan Makhraj dan Tajwid'),
  (6, 'C', 'Delia Kirani Lubis', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 28, 32, 4, 100, 'not_achieved', 'Alhamdulillah.. bacaan kk sdh lancar, namun masih perlu perbaikan Makhraj dan Tajwid tetap semangat y kk !!!!'),
  (6, 'C', 'Fadiyah Khayla Azzahra Ketaren', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 13, 1, 100, 'not_achieved', 'Bacaan kurang lancar , semoga kk lebih semangat lagi belajar, agar bacaan kk lebih baik lagi.'),
  (6, 'C', 'Fazila Hafiza', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 13, 17, 4, 100, 'not_achieved', 'Alhamdulillah... bacaan kk lancar, tapi masih perlu perbaikan Makhraj dan Tajwid . tetap semangat y kk !!!'),
  (6, 'C', 'Fitra Alfatin Nisa', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 24, 26, 2, 100, 'not_achieved', 'Bacaan kk kurang lancar, masih banyak yg harus di perhatikan Makhraj dan Tajwid. tetap semangat y kk !!!'),
  (6, 'C', 'Gusti Ayu Kailani', 'iqra', 'Iqro 6', 'Iqro 6', 30, 31, 1, 15, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Hafiza Khaira Lubna', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 27, 29, 2, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Hilya Nasikah Markhan', 'iqra', 'Iqro 4', 'Iqro 4', 29, 31, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Husna Fhataniah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 10, 0, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Khanza Raisya Putri', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 21, 21, 0, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Luthfia Thalita Salim', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 28, 30, 2, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Nadhifatul Shifwa Lubis', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 6, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Nadien Shafiya Azka', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 25, 26, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Najifah Fildza', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 22, 23, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Natasya', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 33, 34, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Naura Dapita Br Surbakti', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 21, 22, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Nurhasanah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 2, 3, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Raihana Inayasya Pasaribu', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 30, 31, 1, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'C', 'Thalita Zahra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 17, 17, 0, 100, 'not_achieved', 'Fashiha Billa -'),
  (6, 'D', 'Anzu Ghaisani Bilqis', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 30, 35, 5, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Ashilah Aprilia Syah Br Tarigan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 19, 18, 15, 'achieved', 'Tanda waqaf,penerapan panjang pendek mad dan ketepatan harakat, makharijul huruf masih sering tertukar serta tidak diulangi ketika salah, huruf hamzah penyebutan seperti `ain'),
  (6, 'D', 'Attahira Zalfa Ahmad', 'iqra', 'Iqro 6', 'Iqro 6', 14, 24, 10, 15, 'not_achieved', 'Tajwid dan makharijul hueuf dzal masih perlu perbaikan');

SELECT 'part_6_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_6_students_not_matched' AS check_name, count(*) AS total
FROM _restore_april_2026_reports r
LEFT JOIN public.students s
  ON s.kelas = r.kelas
 AND s.rombel = r.rombel
 AND lower(regexp_replace(trim(s.nama), '\s+', ' ', 'g')) = lower(regexp_replace(trim(r.nama), '\s+', ' ', 'g'))
WHERE s.id IS NULL;

SELECT r.kelas, r.rombel, r.nama
FROM _restore_april_2026_reports r
LEFT JOIN public.students s
  ON s.kelas = r.kelas
 AND s.rombel = r.rombel
 AND lower(regexp_replace(trim(s.nama), '\s+', ' ', 'g')) = lower(regexp_replace(trim(r.nama), '\s+', ' ', 'g'))
WHERE s.id IS NULL
ORDER BY r.kelas, r.rombel, r.nama;

WITH inserted AS (
  INSERT INTO public.monthly_reports (
    student_id, month, year, program_type, iqra_level, end_iqra_level,
    start_page, end_page, pages_read, target_pages, achievement_status, notes, created_by
  )
  SELECT
    s.id, 4, 2026, r.program_type, r.iqra_level, r.end_iqra_level,
    r.start_page, r.end_page, r.pages_read, r.target_pages, r.achievement_status, r.notes, NULL
  FROM _restore_april_2026_reports r
  JOIN public.students s
    ON s.kelas = r.kelas
   AND s.rombel = r.rombel
   AND lower(regexp_replace(trim(s.nama), '\s+', ' ', 'g')) = lower(regexp_replace(trim(r.nama), '\s+', ' ', 'g'))
  ON CONFLICT (student_id, month, year) DO NOTHING
  RETURNING student_id
)
SELECT 'part_6_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
