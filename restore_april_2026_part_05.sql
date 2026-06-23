-- Restore April 2026 monthly_reports, part 5 of 7.
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
  (5, 'A', 'Mhd Daffa Alfarizi', 'iqra', 'Iqro 6', 'Iqro 6', 14, 20, 6, 15, 'not_achieved', 'Perhatikan panjang pendek, dengung dan waqof'),
  (5, 'A', 'Muhammad al baihaqi', 'iqra', 'Iqro 5', 'Iqro 6', 20, 11, 21, 15, 'achieved', '-'),
  (5, 'A', 'Muhammad Al-Baihaqi Ramadhan', 'iqra', 'Iqro 6', 'Iqro 6', 1, 1, 0, 15, 'not_achieved', '-'),
  (5, 'A', 'Muhammad Alif Fatul', 'iqra', 'Iqro 6', 'Iqro 6', 18, 22, 4, 15, 'not_achieved', 'Perhatikan panjang pendek'),
  (5, 'A', 'Muhammad Erza Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 31, 44, 13, 15, 'not_achieved', '-'),
  (5, 'A', 'Muhammad Hadyan Rasyidin Siregar', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 17, 7, 15, 'not_achieved', 'alhamdulillah bacaan ananda sudah cukup baik, tapi tetap ditingkatkan lagi yaa'),
  (5, 'A', 'Muhammad Hajim As Tsaqib', 'iqra', 'Iqro 5', 'Iqro 5', 9, 16, 7, 15, 'not_achieved', 'Perhatikan waqof dan huruf'),
  (5, 'A', 'Muhammad Naufal Hamizan Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 10, 5, 15, 'not_achieved', 'tingkat kan lagi bacaan tajwid nya terutama mad dan ghunnahnya'),
  (5, 'A', 'Mukhlis', 'iqra', 'Iqro 5', 'Iqro 6', 31, 7, 6, 15, 'not_achieved', 'Perhatikan panjang pendek dan waqof'),
  (5, 'A', 'Naufal Afkar Novianto', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'ditingkatkan lagi bacaannya ya'),
  (5, 'A', 'Raffizan Prasetya', 'iqra', 'Iqro 6', 'Iqro 6', 27, 31, 4, 15, 'not_achieved', 'Perhatikan huruf, panjang pendek, dengung, dan waqof'),
  (5, 'A', 'Rasya Arsakha', 'iqra', 'Iqro 5', 'Iqro 6', 30, 4, 4, 15, 'not_achieved', 'Banyak latihan di rumah'),
  (5, 'A', 'Rivana Al Haqqy', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 19, 7, 15, 'not_achieved', 'Shaili Ayu perhatikan huruf þµ dengan þ™ itu berbeda yaa Lanjutan Syahputri Sitorus'),
  (5, 'B', 'Aditya Kanada', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 28, 35, 7, 15, 'not_achieved', 'Bacaan sudah cukup baik, hanya saja sering terburu buru membacanya'),
  (5, 'B', 'Aditya Naufal Kasada', 'iqra', 'Iqro 4', 'Iqro 4', 10, 20, 10, 15, 'not_achieved', '-'),
  (5, 'B', 'Ahmad Satria Rama', 'iqra', 'Iqro 6', 'Iqro 6', 16, 19, 3, 15, 'not_achieved', 'Ananda, semangatlah selalu ketika membaca Iqro'' ya.'),
  (5, 'B', 'Ahsan Abdur Rozzaq', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 15, 3, 15, 'not_achieved', 'Sering sering latihan panjang pendek dan juga ghunnah'),
  (5, 'B', 'Ar Sakha Ransi Azhari', 'iqra', 'Iqro 3', 'Iqro 3', 17, 24, 7, 15, 'not_achieved', 'Abi dan Umi mohon bantuan agar Ananda banyak banyak membaca PR Iqro'' yang diberikan.'),
  (5, 'B', 'Arsa Pradana Siregar', 'iqra', 'Iqro 6', 'Iqro 6', 23, 30, 7, 15, 'not_achieved', 'Cukup lancar, perhatikan lagi cara membaca ikhfa'),
  (5, 'B', 'Daffaa Pranata Ketaren', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 23, 26, 3, 15, 'not_achieved', 'Harus sering latihan tadarus di rumah'),
  (5, 'B', 'Dirga Panca Dahana', 'iqra', 'Iqro 5', 'Iqro 5', 1, 1, 0, 15, 'not_achieved', '-'),
  (5, 'B', 'Elza Altori', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 12, 9, 15, 'not_achieved', '-'),
  (5, 'B', 'Farid Husain', 'iqra', 'Iqro 6', 'Iqro 6', 26, 32, 6, 15, 'not_achieved', 'Pemutqinan iqro'' 6, sering sering dilatih bacaannya di rumah'),
  (5, 'B', 'Fatih Ahmad', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 12, 17, 5, 15, 'not_achieved', 'Perbaiki cara membaca ikhfa dan ghunnah'),
  (5, 'B', 'Fauzan Athallah Putra', 'iqra', 'Iqro 6', 'Iqro 6', 11, 18, 7, 15, 'not_achieved', 'Ananda, semangatlah selalu ketika membaca Iqro'' yaa.'),
  (5, 'B', 'Hanan Attaqy', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 4, 3, 15, 'not_achieved', 'Dita Wardania Sering sering latihan tadarus di rumah agar Lanjutan Br Panjaitan bacaannya semakin baik'),
  (5, 'B', 'Irhabi Sani Harahap', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 29, 35, 6, 15, 'not_achieved', 'Latihan membaca ikhfa, dan panjang pendek terkadang masih keliru'),
  (5, 'B', 'Kenzi Alvaro', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 34, 44, 10, 15, 'not_achieved', 'Masih harus sering sering latihan tadarus di rumah'),
  (5, 'B', 'M. Abinaya Pratama Ramadhan', 'iqra', 'Iqro 6', 'Iqro 6', 24, 30, 6, 15, 'not_achieved', '-'),
  (5, 'B', 'Mhd Farhan', 'iqra', 'Iqro 6', 'Iqro 6', 4, 14, 10, 15, 'not_achieved', 'Masih harus sering berlatih panjang lendek bacaan dan juga ghunnah'),
  (5, 'B', 'Muhammad Fajri Ramadhan', 'iqra', 'Iqro 6', 'Iqro 6', 17, 32, 15, 15, 'achieved', 'Alhamdulillah tercapai, latihan terus untuk pemutqinan iqro 6'),
  (5, 'B', 'Muhammad Habib Kurniawan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 11, 5, 15, 'not_achieved', 'Serung sering latihan tadarus di rumah, perbaiki ikhfa dan ghunnah'),
  (5, 'B', 'Muhammad Hanan Faiz', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Ananda naik level tahsin lanjutan dan tahsin dasar dari Iqro'' 6 hal 30-32.'),
  (5, 'B', 'Muhammad Ibrahim Athallah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 2, 1, 15, 'not_achieved', 'Ananda naik level tahsin lanjutan dari tahsin dasar di Iqro''6 halaman 21-32.'),
  (5, 'B', 'Muhammad Najeeb Hossain Sipayung', 'iqra', 'Iqro 6', 'Iqro 6', 18, 24, 6, 15, 'not_achieved', '-'),
  (5, 'B', 'Muhammad Najib Baihaqi', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 18, 23, 5, 15, 'not_achieved', 'Latihan terus di rumah panjang pendek'),
  (5, 'B', 'Muhammad Syafiq Syahputra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', 'Cukup baik, sering sering tadarus di rumah agar semakin lancar'),
  (5, 'B', 'Pandi Tri Utomo', 'iqra', 'Iqro 4', 'Iqro 4', 4, 5, 1, 15, 'not_achieved', 'Abi dan Umi, Ananda diturunnkan di Iqro''4 halaman 4 karena banyak tidak lancar jika dinaikkan ke halaman selanjutnya dan mohon bantuannya Abi dan Umi untuk selalu banyak banyak mengulang PR Iqro''nya.'),
  (5, 'B', 'Rafa Azhmi Fadhilah', 'iqra', 'Iqro 5', 'Iqro 5', 6, 10, 4, 15, 'not_achieved', 'Harus lebih sering lagi latihan membaca iqro di rumah, masih banyak kesalahan bacaan'),
  (5, 'B', 'Rifqy Syafiq Tarigan', 'iqra', 'Iqro 6', 'Iqro 6', 9, 16, 7, 15, 'not_achieved', 'Masih harus memperbaiki bacaan ikhfa, dan ghunnah, jugapanjangvpendek terkadang mauDicetak: 7 Mei 2026 Halaman 31 dari 44 keliru'),
  (5, 'B', 'Risdanald Aghna Siregar', 'iqra', 'Iqro 4', 'Iqro 5', 28, 7, 9, 15, 'not_achieved', '-'),
  (5, 'B', 'Umar', 'iqra', 'Iqro 5', 'Iqro 5', 20, 32, 12, 15, 'not_achieved', '-'),
  (5, 'B', 'Yahya Khairul Anam', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 15, 20, 5, 15, 'not_achieved', '-'),
  (5, 'B', 'Zein Al-Fatih Sitepu', 'iqra', 'Iqro 6', 'Iqro 6', 1, 4, 1, 15, 'not_achieved', 'Abi dan Umi, Ananda diturunkan Iqro'' dari Iqro''6 halaman 29 ke Iqro'' 6 halaman 3 karena jika dilanjutkan bacaan Iqro''nya banyak yanng tidak lancar dan mohon bantuan Abi dan Umi untuk membaca PR Iqro'' nya.'),
  (5, 'C', 'Adzkia Samha Saufa', 'tahfizh', 'Juz 30', 'Juz 29', 1, 1, 20, 3, 'achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Aisyah Aqilah Yanglera', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 8, 7, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Alesha Inara', 'iqra', 'Iqro 6', 'Iqro 6', 27, 32, 5, 15, 'not_achieved', 'Persiapan ujian naik tingkat (Tahsin Lanjutan)'),
  (5, 'C', 'Assyifa Rifana Fitri', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 12, 11, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Audi Anisa', 'iqra', 'Iqro 5', 'Iqro 5', 16, 25, 9, 15, 'not_achieved', 'Pelancaran bacaan dan penguatan mad (panjang pendek)'),
  (5, 'C', 'Azzahra Nanda Wibowo', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 14, 11, 15, 'not_achieved', 'Penguatan mad wajib dan ghunnah'),
  (5, 'C', 'Bilqis Raysah', 'iqra', 'Iqro 5', 'Iqro 5', 9, 10, 1, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Carissa Aqila Putri', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 15, 10, 15, 'not_achieved', 'Perbaikan waqaf dan penguatan mad'),
  (5, 'C', 'Devia Hafizah', 'tahfizh', 'Juz 30', 'Juz 29', 1, 1, 20, 3, 'achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Dyandra Putri Santoso', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Fatihah Muflihah Al Husein', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 8, 18, 10, 15, 'not_achieved', 'Penguatan mad wajib dan ghunnah'),
  (5, 'C', 'Fusailah Sihombing', 'iqra', 'Iqro 6', 'Iqro 6', 28, 32, 4, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Gadis Humairah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 13, 8, 15, 'not_achieved', 'Penguatan mad dan ghunnah'),
  (5, 'C', 'Hafidzah Az-Zahra', 'iqra', 'Iqro 6', 'Iqro 6', 23, 32, 9, 15, 'not_achieved', 'Persiapan ujian naik tingkat (tahsin lanjutan)'),
  (5, 'C', 'Hana Fakhirah Hamdan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Hania Syakira', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Haura Aqilatunnisa', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 15, 9, 15, 'not_achieved', 'Penguatan waqaf dan lebih men jahr kan suara lagi'),
  (5, 'C', 'Hilwa Shanum', 'iqra', 'Iqro 6', 'Iqro 6', 23, 32, 9, 15, 'not_achieved', 'Persiapan ujian naik tingkat (Tahsin Lanjutan)'),
  (5, 'C', 'Izza Hilyah Nafisah', 'iqra', 'Iqro 6', 'Iqro 6', 17, 27, 10, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Jihan Alifa', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 23, 13, 15, 'not_achieved', 'Penguatan makhraj þ¡ dan þé'),
  (5, 'C', 'Najla Aqila Zahra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 12, 11, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Naura Jasmine', 'iqra', 'Iqro 5', 'Iqro 5', 21, 29, 8, 15, 'not_achieved', 'Melancarkan bacaan dan penguatan mad'),
  (5, 'C', 'Raisa Azzahra', 'iqra', 'Iqro 4', 'Iqro 5', 31, 12, 11, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Raisha Shanika Azka', 'iqra', 'Iqro 5', 'Iqro 5', 25, 32, 7, 15, 'not_achieved', 'Penurunan Iqro'' 5 hal 10 (masih perlu pengutan dan latihan membaca setiap hari agar lisan lancar)'),
  (5, 'C', 'Shakira Afifah Haiqi', 'iqra', 'Iqro 6', 'Iqro 6', 13, 20, 7, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Syahidah Almahira Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 15, 10, 15, 'not_achieved', 'Penguatan bacaan mad dan Al Jauf (membuka mulut dengan sempurna agar huruf terdengar jelas)Dicetak: 7 Mei 2026 Halaman 33 dari 44'),
  (5, 'C', 'Syakura Haura ''Ainin', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 18, 11, 15, 'not_achieved', 'Penguatan Ghunnah dan waqaf'),
  (5, 'C', 'Talitha Azzahra Bancin', 'iqra', 'Iqro 6', 'Iqro 6', 30, 32, 2, 15, 'not_achieved', 'Maulina Sitorus -'),
  (5, 'C', 'Tita Andika', 'tahfizh', 'Juz 30', 'Juz 30', 1, 20, 19, 3, 'achieved', 'Maulina Sitorus -'),
  (5, 'D', 'Adisty Hanifah Kurniawan', 'iqra', 'Iqro 6', 'Iqro 6', 24, 27, 3, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah lancar untuk mad jaiz dan wajib serta tempo bacaannya lebih diperhatikan lagi ya nak"'),
  (5, 'D', 'Akira Shofiyah Hanim', 'iqra', 'Iqro 5', 'Iqro 5', 13, 19, 6, 15, 'not_achieved', NULL),
  (5, 'D', 'Annisa Putri Habibi', 'tahfizh', 'Juz 30', 'Juz 30', 1, 20, 19, 3, 'achieved', '-'),
  (5, 'D', 'Askana Sakhi', 'iqra', 'Iqro 6', 'Iqro 6', 16, 20, 4, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah bagus hanya saja untuk mad wajib dan jaiz serta tempo bacaannya lebih diperhatikan lagi ya nak"'),
  (5, 'D', 'Auliya queen Jenius Husna Simanjuntak', 'iqra', 'Iqro 2', 'Iqro 2', 23, 24, 1, 15, 'not_achieved', '"Samangat terus belajar nya ya nak, jangan sering libur "'),
  (5, 'D', 'Azizah Sofhia Ramadhani', 'iqra', 'Iqro 4', 'Iqro 4', 22, 26, 4, 15, 'not_achieved', NULL),
  (5, 'D', 'Calissa Rania', 'iqra', 'Iqro 3', 'Iqro 3', 20, 23, 3, 15, 'not_achieved', NULL),
  (5, 'D', 'Fadhillah Azzahrah Siregar', 'iqra', 'Iqro 6', 'Iqro 6', 23, 27, 4, 15, 'not_achieved', NULL),
  (5, 'D', 'Halimah Tusyahdiyah', 'iqra', 'Iqro 5', 'Iqro 5', 20, 22, 2, 15, 'not_achieved', '"Semangat terus belajar nya ya nak.. lebih teliti lagi membedakan mana yang harus dibaca panjang dan mana yang pendek ya."'),
  (5, 'D', 'Hasanah Qurrota Aini', 'iqra', 'Iqro 5', 'Iqro 5', 9, 12, 3, 15, 'not_achieved', NULL),
  (5, 'D', 'Keisha Almira Dewi', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 10, 3, 15, 'not_achieved', NULL),
  (5, 'D', 'Keisha Kirana', 'iqra', 'Iqro 6', 'Iqro 6', 25, 31, 6, 15, 'not_achieved', 'saja untuk mad wajib dan jaiz serta tempo bacaannya lebih diperhatikan lagi ya nak"'),
  (5, 'D', 'Mahira Amini', 'tahfizh', 'Juz 30', 'Juz 29', 20, 10, 30, 3, 'achieved', NULL),
  (5, 'D', 'Nada Muslimah Sidik', 'iqra', 'Iqro 6', 'Iqro 6', 11, 16, 5, 15, 'not_achieved', '"Semangat terus belajar nya ya nak.. Lebih teliti lagi membedakan panjang pendek serta tempo dalam bacaan"'),
  (5, 'D', 'Nafisah Hanin Jayadi', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 11, 4, 15, 'not_achieved', NULL),
  (5, 'D', 'Nazhira Syauqi Yatul Munawir', 'iqra', 'Iqro 6', 'Iqro 6', 9, 12, 3, 15, 'not_achieved', NULL),
  (5, 'D', 'Nur Hafizah Rizqi', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', '-'),
  (5, 'D', 'Nur Indah Ailani Harahap', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 15, 22, 7, 15, 'not_achieved', '-'),
  (5, 'D', 'Qyara Anaia Shaliha', 'tahfizh', 'Juz 30', 'Juz 29', 20, 10, 30, 3, 'achieved', NULL),
  (5, 'D', 'Raisya Azzahra Hakim', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 7, 2, 15, 'not_achieved', NULL),
  (5, 'D', 'Rasyuqa Kinatya Praja', 'tahfizh', 'Juz 28', 'Juz 28', 7, 8, 1, 3, 'not_achieved', '-'),
  (5, 'D', 'Rumaisha Amaturrahman Surbakti', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', '-');

SELECT 'part_5_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_5_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_5_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
