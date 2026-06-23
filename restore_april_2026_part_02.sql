-- Restore April 2026 monthly_reports, part 2 of 7.
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
  (2, 'A', 'Ahmad Rayyan Ritonga', 'iqra', 'Iqro 3', 'Iqro 4', 29, 9, 10, 15, 'not_achieved', '-'),
  (2, 'A', 'Alfarizi Ramadhan', 'iqra', 'Iqro 4', 'Iqro 4', 7, 18, 11, 15, 'not_achieved', '-'),
  (2, 'A', 'Ar Raffi Malikal Mulki', 'iqra', 'Iqro 5', 'Iqro 5', 1, 11, 8, 15, 'not_achieved', 'panjang pendek perlu diperbaiki'),
  (2, 'A', 'Azzam Khalif', 'iqra', 'Iqro 3', 'Iqro 3', 24, 28, 4, 15, 'not_achieved', '-'),
  (2, 'A', 'Fatir Akaria', 'iqra', 'Iqro 5', 'Iqro 5', 1, 15, 12, 15, 'not_achieved', 'mad nya belum tepat'),
  (2, 'A', 'Firaz Nadeem Abdillah', 'iqra', 'Iqro 2', 'Iqro 2', 8, 16, 8, 15, 'not_achieved', '-'),
  (2, 'A', 'Gio Zafran Siddin', 'iqra', 'Iqro 2', 'Iqro 2', 1, 6, 3, 15, 'not_achieved', 'Makharijul huruf perlu perbaikan'),
  (2, 'A', 'Khalif Firzatullah Iswandi', 'iqra', 'Iqro 5', 'Iqro 5', 1, 19, 16, 15, 'achieved', 'Tajwid perlu diperbaikan'),
  (2, 'A', 'M. Gibran El syarif', 'iqra', 'Iqro 3', 'Iqro 3', 12, 15, 3, 15, 'not_achieved', '-'),
  (2, 'A', 'M. Khalif Alfarizqi', 'iqra', 'Iqro 4', 'Iqro 4', 9, 19, 10, 15, 'not_achieved', '-'),
  (2, 'A', 'M. Yusuf Alfatih', 'iqra', 'Iqro 3', 'Iqro 3', 7, 14, 7, 15, 'not_achieved', 'Panjang pendek, makharijul huruf sering tertukar'),
  (2, 'A', 'MHD. Al Faiz Harahap', 'iqra', 'Iqro 4', 'Iqro 4', 17, 28, 11, 15, 'not_achieved', '-'),
  (2, 'A', 'Muhammad Ammar Syafiq', 'iqra', 'Iqro 4', 'Iqro 4', 7, 11, 4, 15, 'not_achieved', 'Panjang pendek,pengaturan nafas masih terputus-putus'),
  (2, 'A', 'Muhammad Falih Aqmar', 'iqra', 'Iqro 4', 'Iqro 5', 28, 8, 10, 15, 'not_achieved', '-'),
  (2, 'A', 'Muhammad Khalid Afzam', 'iqra', 'Iqro 2', 'Iqro 2', 14, 16, 2, 15, 'not_achieved', 'Makharijul huruf masih belum lancar'),
  (2, 'A', 'Muhammad Luqman Hakim', 'iqra', 'Iqro 4', 'Iqro 4', 14, 21, 7, 15, 'not_achieved', '-'),
  (2, 'A', 'Muhammad Zidan Azhari', 'iqra', 'Iqro 2', 'Iqro 2', 1, 7, 4, 15, 'not_achieved', 'makharijul huruf perlu perbaikan'),
  (2, 'A', 'Rafka Zahid Al ikhwan', 'iqra', 'Iqro 4', 'Iqro 4', 11, 23, 12, 15, 'not_achieved', '-'),
  (2, 'A', 'Razzan Rizqi Kurniawan', 'iqra', 'Iqro 4', 'Iqro 4', 5, 11, 6, 15, 'not_achieved', 'Harakat masih perlu perbaikan'),
  (2, 'A', 'Rizky Maulana Hartono', 'iqra', 'Iqro 2', 'Iqro 2', 1, 5, 2, 15, 'not_achieved', 'Makharijul Huruf,panjang pendek perlu perbaikan'),
  (2, 'A', 'Rohim Arfan Azhari', 'iqra', 'Iqro 5', 'Iqro 5', 16, 28, 12, 15, 'not_achieved', '-'),
  (2, 'A', 'Tito Ravli Baskoro', 'iqra', 'Iqro 5', 'Iqro 5', 1, 19, 16, 15, 'achieved', 'ikhfa dan idzhar sering tertukar'),
  (2, 'A', 'Utsman Ibnu Affan', 'iqra', 'Iqro 5', 'Iqro 5', 4, 11, 7, 15, 'not_achieved', '-'),
  (2, 'A', 'Uwais Al Qarni', 'iqra', 'Iqro 2', 'Iqro 2', 1, 7, 4, 15, 'not_achieved', 'Makharijul huruf dan panjang pendek belum tepat'),
  (2, 'A', 'Wildan Abdurrahman', 'iqra', 'Iqro 6', 'Iqro 6', 10, 27, 17, 15, 'achieved', 'tanda waqaf perlu perbaikan'),
  (2, 'A', 'Zafran Umar Maulana', 'iqra', 'Iqro 2', 'Iqro 2', 26, 31, 5, 15, 'not_achieved', '-'),
  (2, 'B', 'Adzkia Salsabila Darma', 'iqra', 'Iqro 6', 'Iqro 6', 17, 22, 5, 15, 'not_achieved', '-'),
  (2, 'B', 'Afiza Azzahra', 'iqra', 'Iqro 4', 'Iqro 4', 24, 26, 2, 15, 'not_achieved', 'Kesulitan menyambungkan bacaan, panjang pendek dan juga sering tidak hadir'),
  (2, 'B', 'Aisyah Al Syafiyyah', 'iqra', 'Iqro 5', 'Iqro 5', 9, 25, 16, 15, 'achieved', 'Alhamdulillah... Bacaan Aisyah lancar,yg perlu di perbaiki Makhraj dan Tajwidnya.'),
  (2, 'B', 'Aisyah Br Pandia', 'iqra', 'Iqro 6', 'Iqro 6', 21, 27, 6, 15, 'not_achieved', 'Belum bisa membedakan waqof'),
  (2, 'B', 'Alesha Alfara Pohan', 'iqra', 'Iqro 5', 'Iqro 5', 9, 14, 5, 15, 'not_achieved', 'Masih perlu banyak belajar, untuk perbaikan Makhraj,Tetap semangat y kk Alesha!!!'),
  (2, 'B', 'Asma Mujahidah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 14, 20, 6, 15, 'not_achieved', 'Kesulitan mendengungkan ghunnah'),
  (2, 'B', 'Athiyah Husna Panjaitan', 'iqra', 'Iqro 6', 'Iqro 6', 13, 22, 9, 15, 'not_achieved', 'Membacanya masih terputus-putus'),
  (2, 'B', 'Beby Arisha Br Sitepu', 'iqra', 'Iqro 3', 'Iqro 4', 29, 10, 11, 15, 'not_achieved', 'Tetap semangat dalam belajar membaca Al-Qur’an, meskipun bertahap insyaAllah dengan kesungguhan akan mencapai kelancaran dan keberkahan. Barakallah fiiki.'),
  (2, 'B', 'Cut Aja Alisha', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 16, 20, 4, 15, 'not_achieved', 'Sering tidak hadir, dan panjang pendeknya masih kurang tepat'),
  (2, 'B', 'Farosha Nazneen Qiyyama', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 1, 0, 100, 'not_achieved', 'Alhamdulillah... bacaan sdh bagus,namun masih perlu perbaikan tajwid. tetap semangat kk farosha!!!!'),
  (2, 'B', 'Humaira Izzatunisa', 'iqra', 'Iqro 2', 'Iqro 2', 14, 21, 7, 15, 'not_achieved', 'Masih bingung hutuf þ¦ þ£ þŸ jika bersambung'),
  (2, 'B', 'Kamilatul Afiyah', 'iqra', 'Iqro 5', 'Iqro 5', 15, 22, 7, 15, 'not_achieved', 'Panjang pendek masih serung salah'),
  (2, 'B', 'Khadijah', 'iqra', 'Iqro 3', 'Iqro 3', 23, 27, 4, 15, 'not_achieved', 'Alhamdulillah... Bacaan lancar,yg perlu di perhatikan Makhraj dan Tajwidnya. Tetap semangat y kk Khadijah !!!!'),
  (2, 'B', 'Khumaira Altafunnisa', 'iqra', 'Iqro 6', 'Iqro 6', 11, 25, 14, 15, 'not_achieved', 'Alhamdulillah.... Bacaan lancar,yg perlu di perhatikan Makhraj dan Tajwidnya. tetap semangat kk Khumaira!!!!!'),
  (2, 'B', 'Miftahul Jannah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 24, 29, 5, 15, 'not_achieved', 'Masih sering melebihkan mad yang 2 harakat, membaca ayat masih terputus dan masih memperbaiki huruf þ±'),
  (2, 'B', 'Mikayla Almahyra Bancin', 'iqra', 'Iqro 5', 'Iqro 5', 4, 8, 4, 15, 'not_achieved', '-'),
  (2, 'B', 'Nadya Carissa Pane', 'iqra', 'Iqro 4', 'Iqro 4', 23, 29, 6, 15, 'not_achieved', 'Bacaan kurang lancar,masih banyak yg perlu di perbaiki, Makhraj dan Tajwidnya, semoga kk lebih semangat lagi belajar nya y...'),
  (2, 'B', 'Naura Chairunnisa', 'iqra', 'Iqro 4', 'Iqro 5', 27, 4, 7, 15, 'not_achieved', 'Membaca masih terputus putus'),
  (2, 'B', 'Nusaibah Humairoh', 'iqra', 'Iqro 4', 'Iqro 4', 5, 10, 5, 15, 'not_achieved', 'Alhamdulillah... bacaan kk lancar,yg harus di perbaiki Makhraj dan Tajwidnya, Ustadzah harap tolong kehadiran di perhatikan!!!!'),
  (2, 'B', 'Qalesya Nafiah Lubis', 'iqra', 'Iqro 4', 'Iqro 4', 5, 18, 13, 15, 'not_achieved', 'Masih perlu banyak belajar, Untuk perbaikan Makhraj dan Tajwidnya Tetap semangat y kk Qslesya!!!!!!'),
  (2, 'B', 'Queenre Nabila Alfatih', 'iqra', 'Iqro 5', 'Iqro 5', 18, 25, 7, 15, 'not_achieved', 'Masih sulit menyambung bacaan bertasydid dan panjang pendek'),
  (2, 'B', 'Rahil Mafaza', 'iqra', 'Iqro 5', 'Iqro 5', 13, 24, 11, 15, 'not_achieved', 'Cukup baik'),
  (2, 'B', 'Rizqia Hasna Malaika', 'iqra', 'Iqro 5', 'Iqro 5', 8, 9, 1, 15, 'not_achieved', 'Alhamdulillah... bacaan sdh lancar,tapi masih perlu banyak belajar, untuk perbaikan Makhraj dan Tajwidnya.Tetap semangat kk Rizqia !!!!!!'),
  (2, 'B', 'Rizqia Zivana Alea', 'iqra', 'Iqro 5', 'Iqro 5', 1, 11, 8, 15, 'not_achieved', 'Masih sulit menyambung bacaan tasydid'),
  (2, 'B', 'Rumaysa Hafsah Kirana Saleh', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 27, 34, 7, 15, 'not_achieved', 'Alhamdulillah... bacaan sdh lancar dan bagus,dan Tajwidnya baik,tapi masih perlu di ingat ketika mau berhenti ( tanda waqaf ).'),
  (2, 'B', 'Safira Najiha Aljannah', 'iqra', 'Iqro 6', 'Iqro 6', 7, 11, 4, 15, 'not_achieved', 'Alhamdulillah..... Bacaan lancar,yg harus di perbaiki Makhraj dan Tajwidnya. Tetap semangat kk Safira !!!'),
  (2, 'B', 'Shakilla Azzahra Munawir', 'iqra', 'Iqro 5', 'Iqro 6', 25, 5, 10, 15, 'not_achieved', 'Cukup baik'),
  (2, 'B', 'Vierra Qisya Yuan Surbakti', 'iqra', 'Iqro 5', 'Iqro 5', 14, 20, 6, 15, 'not_achieved', 'Jarang hadir dan pa jang pendek masih kurang tepat'),
  (2, 'C', 'Abdul Hanif', 'iqra', 'Iqro 5', 'Iqro 5', 15, 27, 12, 15, 'not_achieved', '-'),
  (2, 'C', 'Abdullah Abrar Taqiy Al Sudar', 'iqra', 'Iqro 4', 'Iqro 4', 10, 18, 8, 15, 'not_achieved', 'Fashiha Billa Banyak baca iqra dan perhatikan panjang pendek nya'),
  (2, 'C', 'Adiba Kayla', 'iqra', 'Iqro 5', 'Iqro 5', 23, 30, 7, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Aiza Ufairah Wibowo', 'iqra', 'Iqro 3', 'Iqro 3', 6, 8, 2, 15, 'not_achieved', 'Fashiha Billa Banyak baca iqra dan perhatikan panjang pendek dan huruf yang dibaca'),
  (2, 'C', 'Al Rashid Adnan Habibie', 'iqra', 'Iqro 3', 'Iqro 3', 17, 21, 4, 15, 'not_achieved', '-'),
  (2, 'C', 'Alzafran Rafasya prastio', 'iqra', 'Iqro 5', 'Iqro 5', 16, 23, 7, 15, 'not_achieved', '-'),
  (2, 'C', 'Amira Wulandari Br Bancin', 'iqra', 'Iqro 4', 'Iqro 4', 22, 24, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Arelya Shandra', 'iqra', 'Iqro 4', 'Iqro 5', 30, 5, 5, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Assyifa Rubina', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 21, 26, 5, 15, 'not_achieved', '-'),
  (2, 'C', 'Azzam Azzubair Manik', 'iqra', 'Iqro 5', 'Iqro 5', 4, 10, 6, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Chairul Azidan Maulan', 'iqra', 'Iqro 5', 'Iqro 5', 17, 22, 5, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Elfira Arsyila Az-zahra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 2, 4, 2, 15, 'not_achieved', '-'),
  (2, 'C', 'Elifia Sylvani Putri', 'iqra', 'Iqro 3', 'Iqro 3', 15, 20, 5, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Hanan Abiyyu Harahap', 'iqra', 'Iqro 3', 'Iqro 3', 17, 24, 7, 15, 'not_achieved', '-'),
  (2, 'C', 'Jefry Abdillah Tarigan', 'iqra', 'Iqro 3', 'Iqro 3', 30, 32, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Mafaza Khairunnisa', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 20, 27, 7, 15, 'not_achieved', '-'),
  (2, 'C', 'Muhammad Al-Fatih Bangun', 'iqra', 'Iqro 4', 'Iqro 4', 13, 25, 12, 15, 'not_achieved', '-'),
  (2, 'C', 'Muhammad AlFatih Purba', 'iqra', 'Iqro 3', 'Iqro 3', 11, 18, 7, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Muhammad irham Atalah', 'iqra', 'Iqro 2', 'Iqro 2', 25, 30, 5, 15, 'not_achieved', '-'),
  (2, 'C', 'Nabil Fajar Assyauqi', 'iqra', 'Iqro 4', 'Iqro 4', 11, 19, 8, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Nazia Afrira', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 17, 21, 4, 15, 'not_achieved', '-'),
  (2, 'C', 'Nuqman Firdaus', 'iqra', 'Iqro 3', 'Iqro 3', 23, 25, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Nur Ainun F', 'iqra', 'Iqro 6', 'Iqro 6', 15, 16, 1, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Nur Hanifah Hafsah Hafiman', 'iqra', 'Iqro 4', 'Iqro 4', 8, 10, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (2, 'C', 'Rayga Prasetiyo', 'iqra', 'Iqro 3', 'Iqro 3', 22, 28, 6, 15, 'not_achieved', '-'),
  (2, 'C', 'Razania Almashyra Surbakti', 'iqra', 'Iqro 4', 'Iqro 5', 30, 12, 12, 15, 'not_achieved', '-'),
  (2, 'C', 'Risa Ramadhaniza', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 8, 3, 15, 'not_achieved', '-'),
  (2, 'C', 'Syafira Adreena', 'iqra', 'Iqro 6', 'Iqro 6', 18, 22, 4, 15, 'not_achieved', '-'),
  (3, 'A', 'Ahmad Alfath Cholia', 'iqra', 'Iqro 4', 'Iqro 4', 1, 19, 16, 15, 'achieved', 'panjang dan pendek perlu perbaikan'),
  (3, 'A', 'Al Khalifi Dzikri', 'iqra', 'Iqro 6', 'Iqro 6', 1, 19, 16, 15, 'achieved', 'Ikhfa dan Idzhar belum tepat'),
  (3, 'A', 'Aryo Wicaksono', 'iqra', 'Iqro 6', 'Iqro 6', 7, 14, 7, 15, 'not_achieved', NULL),
  (3, 'A', 'Hilmi Arsyad', 'iqra', 'Iqro 2', 'Iqro 2', 1, 12, 9, 15, 'not_achieved', 'makharijul huruf belum tepat'),
  (3, 'A', 'Luthfie Sakhi Zaidhan', 'iqra', 'Iqro 5', 'Iqro 5', 13, 16, 3, 15, 'not_achieved', NULL),
  (3, 'A', 'M.Alfarizqi Shaquille', 'iqra', 'Iqro 4', 'Iqro 4', 10, 15, 5, 15, 'not_achieved', NULL),
  (3, 'A', 'Mahesa Arya Wiguna', 'iqra', 'Iqro 2', 'Iqro 2', 1, 4, 1, 15, 'not_achieved', 'makharijul huruf, lama idzin pulang kampung'),
  (3, 'A', 'Muhammad Syathir Rayyan', 'iqra', 'Iqro 6', 'Iqro 6', 10, 14, 4, 15, 'not_achieved', NULL),
  (3, 'A', 'Qayyum Shidqi Wahyu', 'iqra', 'Iqro 3', 'Iqro 3', 24, 29, 5, 15, 'not_achieved', 'Makharijul huruf beserta harakat belum tepat'),
  (3, 'A', 'Radja Maulana Nasution', 'iqra', 'Iqro 3', 'Iqro 3', 20, 23, 3, 15, 'not_achieved', NULL),
  (3, 'A', 'Rakha Al Rasyid Sirait', 'iqra', 'Iqro 5', 'Iqro 5', 26, 28, 2, 15, 'not_achieved', NULL),
  (3, 'A', 'Rizieq Bahrirasyidi', 'iqra', 'Iqro 5', 'Iqro 5', 4, 19, 15, 15, 'achieved', 'tajwid perlu perbaikan'),
  (3, 'A', 'Sa''id Abdullah Pinem', 'iqra', 'Iqro 6', 'Iqro 6', 11, 14, 3, 15, 'not_achieved', NULL);

SELECT 'part_2_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_2_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_2_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
