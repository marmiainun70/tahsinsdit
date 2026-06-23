-- Restore April 2026 monthly_reports, part 7 of 7.
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
  (6, 'D', 'Azizah Dinata', 'iqra', 'Iqro 5', 'Iqro 5', 23, 28, 5, 15, 'not_achieved', 'Makharijul huruf tsa, dzal dan dzho belum tepat,mad beserta tajwid'),
  (6, 'D', 'Dzakira Azzahra', 'tahfizh', 'Juz 30', 'Juz 28', 1, 11, 30, 3, 'achieved', 'Makharijul huruf masih perlu perbaikan selalu tsa'),
  (6, 'D', 'Fadilla Fauzianya Siregar', 'iqra', 'Iqro 4', 'Iqro 4', 24, 31, 7, 15, 'not_achieved', 'Makharijul huruf belum tepat, panjang pendek serta tajwid perlu perbaikan'),
  (6, 'D', 'Fahira Khanza Azzahra', 'iqra', 'Iqro 5', 'Iqro 5', 9, 24, 15, 15, 'achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (6, 'D', 'Hafiza Khaira Lubna', 'iqra', 'Iqro 5', 'Iqro 6', 15, 5, 20, 15, 'achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Agar tambah lancar Baarakallahu Fiik'),
  (6, 'D', 'Hilyatun Qanita', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 20, 27, 7, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Kayla Zahirah Humairah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 10, 4, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Keysha Khalifa Shaki Fonna T', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 14, 7, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Khansa Adiba Shakila', 'iqra', 'Iqro 5', 'Iqro 5', 17, 28, 11, 15, 'not_achieved', 'Makharijul huruf masih perlu perbaiakan serta tajwidnya'),
  (6, 'D', 'Kinara Az Zahra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 4, 9, 5, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Marsya Hamizah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 9, 8, 15, 'not_achieved', 'Bacaan masih tergesa-gesa,penerapan hukum nun mati dan tasydid belum cukup baik, pengetahuan tanda waqaf jim belum tepat'),
  (6, 'D', 'Mumin Aisha Liyagati', 'iqra', 'Iqro 6', 'Iqro 6', 6, 23, 17, 15, 'achieved', 'Tajwid perlu perbaiakan'),
  (6, 'D', 'Nadhifa Sheena Fakhira Pulungan', 'iqra', 'Iqro 5', 'Iqro 5', 14, 20, 6, 15, 'not_achieved', 'Makaharijul huruf, tajwid, bacaaan masih terputus-putus'),
  (6, 'D', 'Naura Nadhifa', 'iqra', 'Iqro 5', 'Iqro 5', 13, 20, 7, 15, 'not_achieved', 'Makharijul huruf belum tepat, tajwid,perlu perbaikan'),
  (6, 'D', 'Putri Ramadani', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 9, 4, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Raisa Amanda', 'iqra', 'Iqro 6', 'Iqro 6', 4, 10, 6, 15, 'not_achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (6, 'D', 'Salwa Azmi Salsabila', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 21, 20, 15, 'achieved', 'membaca tenang,perlu membiasakan membedakan tafkhim dan tarqiq pada lafaz jalalah sesuai harakat sebelumnya, tanda waqaf mim.'),
  (6, 'D', 'Syaira Al Basit', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 11, 8, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Syakira Anindya Maheswari', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 20, 19, 15, 'achieved', 'Penerapan mad aridh lissukun serta hukum nun mati belum tepat, pelafalan huruf dzho cenderung terdengar seperti zai yang ditebalkan, serta tanda waqaf jim belum tepat'),
  (6, 'D', 'Tia Rizki', 'iqra', 'Iqro 4', 'Iqro 4', 5, 12, 7, 15, 'not_achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (6, 'D', 'Wafa Gumaisha', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 18, 8, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Zahidah Qanita Annajiyah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 20, 8, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (6, 'D', 'Zahra Aqila Queenzah Sipayung', 'iqra', 'Iqro 5', 'Iqro 5', 6, 10, 4, 15, 'not_achieved', 'bacaan terlalu tergesa-gesa, Makharijul huruf masih belum tepat, tajwid perlu bimbingan'),
  (6, 'D', 'Zahra Mentari', 'iqra', 'Iqro 5', 'Iqro 5', 15, 20, 5, 15, 'not_achieved', 'Makharijul huruf masih perlu perbaiakan,bacaan masih terputus-putus');

SELECT 'part_7_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_7_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_7_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
