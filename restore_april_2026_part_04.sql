-- Restore April 2026 monthly_reports, part 4 of 7.
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
  (4, 'B', 'Affan Amarul Zaki', 'iqra', 'Iqro 1', 'Iqro 1', 19, 20, 1, 15, 'not_achieved', 'Sampai sekarang masih belum bisa membedakan huruf þÆ þÃ þ¿ þ»'),
  (4, 'B', 'Affan Muhammad Habibi', 'iqra', 'Iqro 6', 'Iqro 6', 26, 32, 6, 15, 'not_achieved', '-'),
  (4, 'B', 'Arkhan Pradipta Irawan', 'iqra', 'Iqro 5', 'Iqro 5', 12, 13, 1, 15, 'not_achieved', 'Masih perlu banyak bimbingan di rumah, untuk membantu dalam membaca iqro'''),
  (4, 'B', 'Arsyil Pradipta Rahman', 'iqra', 'Iqro 3', 'Iqro 3', 7, 15, 8, 15, 'not_achieved', 'Perhatikan panjang pendek, dan huruf'),
  (4, 'B', 'Aufar Dean Alfatih', 'iqra', 'Iqro 6', 'Iqro 6', 8, 16, 8, 15, 'not_achieved', 'Cukup Bagus'),
  (4, 'B', 'Azka Ar Rasyid Lubis', 'iqra', 'Iqro 5', 'Iqro 5', 14, 23, 9, 15, 'not_achieved', '-'),
  (4, 'B', 'Azzam Askhari Hasibuan', 'iqra', 'Iqro 6', 'Iqro 6', 15, 22, 7, 15, 'not_achieved', 'Sering keliru dengung'),
  (4, 'B', 'Bagas Pradipta', 'iqra', 'Iqro 4', 'Iqro 5', 32, 7, 5, 15, 'not_achieved', 'Masih sering keliru huruf dan panjang pendek'),
  (4, 'B', 'Farid Athallah Alfatih', 'iqra', 'Iqro 6', 'Iqro 6', 7, 14, 7, 15, 'not_achieved', '-'),
  (4, 'B', 'Gibran Maulana', 'iqra', 'Iqro 5', 'Iqro 6', 27, 5, 8, 15, 'not_achieved', '-'),
  (4, 'B', 'Hafiz Atilla', 'iqra', 'Iqro 4', 'Iqro 4', 9, 13, 4, 15, 'not_achieved', 'Abi dan Umi tolong bantu ananda membaca PR Iqro''nya karena agar membantu kelancaran Ananda ketika membaca Iqro''.'),
  (4, 'B', 'Izzuddin Yusuf Abdurrahman', 'iqra', 'Iqro 5', 'Iqro 6', 28, 7, 9, 15, 'not_achieved', 'Perhatian Dengung, dan panjang pendek'),
  (4, 'B', 'Kenzie Syah Alaquila', 'iqra', 'Iqro 6', 'Iqro 6', 16, 24, 8, 15, 'not_achieved', '-'),
  (4, 'B', 'M Alif Akbar Nasution', 'iqra', 'Iqro 5', 'Iqro 6', 21, 1, 12, 15, 'not_achieved', 'Cukup bagus'),
  (4, 'B', 'M. Fabyansyah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', 'Ananda naik level tahsin lanjutan, tahsin dasar dari Iqro'' 6 halaman 30-32.'),
  (4, 'B', 'M. Kenzo Raffasya', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Ananda naik level tahsin lanjutan, tahsin dasar dari Iqro'' 6 halaman 30-32.'),
  (4, 'B', 'Muhad Zazib Roif', 'iqra', 'Iqro 6', 'Iqro 6', 1, 10, 7, 15, 'not_achieved', 'Cukup bagus'),
  (4, 'B', 'Muhammad Alif Al Mahdi', 'iqra', 'Iqro 5', 'Iqro 5', 23, 29, 6, 15, 'not_achieved', '-'),
  (4, 'B', 'Muhammad Azka Syandana', 'iqra', 'Iqro 5', 'Iqro 5', 16, 23, 7, 15, 'not_achieved', 'Cukup bagus'),
  (4, 'B', 'Muhammad Maheer Al''Asyi', 'iqra', 'Iqro 5', 'Iqro 5', 20, 23, 3, 15, 'not_achieved', 'Masih perlu banyak bimbingan d rumah, biar bacaan iqro''nya lancar'),
  (4, 'B', 'Muhammad Muawiyah', 'iqra', 'Iqro 6', 'Iqro 6', 27, 32, 5, 15, 'not_achieved', '-'),
  (4, 'B', 'Rashya Al Kawakibi', 'iqra', 'Iqro 4', 'Iqro 4', 4, 14, 10, 15, 'not_achieved', 'Shaila Ayu - Wiyandha (Iqra) Syahputri Sitorus'),
  (4, 'B', 'Rawi Putra Pratama', 'iqra', 'Iqro 5', 'Iqro 5', 15, 20, 5, 15, 'not_achieved', '-'),
  (4, 'B', 'Sa''ad Abdullah', 'iqra', 'Iqro 6', 'Iqro 6', 21, 27, 6, 15, 'not_achieved', 'Masih sering keliru dengung, dan waqof'),
  (4, 'B', 'Syahir Zain Abdullah', 'iqra', 'Iqro 3', 'Iqro 3', 25, 30, 5, 15, 'not_achieved', 'Masih perlu banyak bimbingan di rumah'),
  (4, 'B', 'Syamil Muhimbullah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 4, 3, 15, 'not_achieved', 'Ananda naik level tahsin lanjutan dan tahsin dasarnya dari Iqro'' 6 halaman 26-32.'),
  (4, 'B', 'Zaki Zaydan', 'iqra', 'Iqro 6', 'Iqro 6', 10, 18, 8, 15, 'not_achieved', '-'),
  (4, 'C', 'Adzkia Hamdani', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 4, 19, 15, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (4, 'C', 'Afrilia Fazila Br Sembiring', 'iqra', 'Iqro 5', 'Iqro 6', 29, 9, 10, 15, 'not_achieved', 'Cukup baik'),
  (4, 'C', 'Aisyah Nuha Zahira', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 23, 28, 5, 15, 'not_achieved', 'Cukup'),
  (4, 'C', 'Aliya Ratu Salsabila Lumban Batu', 'iqra', 'Iqro 6', 'Iqro 6', 18, 24, 6, 15, 'not_achieved', 'Kurang lancar'),
  (4, 'C', 'Aluna Fathya Setiawan', 'iqra', 'Iqro 5', 'Iqro 5', 13, 15, 2, 15, 'not_achieved', 'Pr iqra-nya dibaca dirumah ya kak Baarakallahu Fiik'),
  (4, 'C', 'Anisah Ufairah Iswandi', 'iqra', 'Iqro 5', 'Iqro 5', 20, 30, 10, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya kak Baarakallahu Fiik'),
  (4, 'C', 'Aqila Nayla Putri', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 11, 4, 15, 'not_achieved', 'Cukup'),
  (4, 'C', 'Aqilla Qurrata Aini', 'tahfizh', 'Tahfizh', 'Tahfizh', 1, 33, 32, 100, 'not_achieved', 'kak, biar tambah lancar Baarakallahu Fiik'),
  (4, 'C', 'Arsyila Ramadani', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Cukup'),
  (4, 'C', 'Azzura Al Zemirah Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 4, 3, 15, 'not_achieved', 'Cukup'),
  (4, 'C', 'Deriyana Rahma Siregar', 'iqra', 'Iqro 6', 'Iqro 6', 25, 32, 7, 15, 'not_achieved', 'Pemutqinan iqro 6'),
  (4, 'C', 'Fadhilah Izzatun Jannah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 9, 8, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (4, 'C', 'Faizia Azkia Kamil Nasution', 'iqra', 'Iqro 5', 'Iqro 6', 23, 9, 16, 15, 'achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (4, 'C', 'Habibah Varisha Sholeha', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 22, 26, 4, 15, 'not_achieved', 'Panjang pendek masih kurang tepat'),
  (4, 'C', 'Haniifah Abidah Naziihah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 50, 58, 8, 15, 'not_achieved', 'Baik'),
  (4, 'C', 'Hanina Sahla Hamdani', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 25, 15, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (4, 'C', 'Humairah Saba Purba', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 4, 3, 15, 'not_achieved', 'Cukup'),
  (4, 'C', 'Khanza Aqila Inara', 'iqra', 'Iqro 6', 'Iqro 6', 7, 15, 8, 15, 'not_achieved', 'Masih bingung meng ikhfakan bacaan'),
  (4, 'C', 'Nafisa Nur Alfattya', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 11, 25, 14, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nya Baarakallahu Fiik'),
  (4, 'C', 'Nazwa Aulia Octaviani', 'iqra', 'Iqro 6', 'Iqro 6', 19, 30, 11, 15, 'not_achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (4, 'C', 'Nurwahida Siamaharani', 'iqra', 'Iqro 5', 'Iqro 5', 4, 10, 6, 15, 'not_achieved', 'Pr iqra-nya tetap dibaca dirumah ya kak Baarakallahu Fiik'),
  (4, 'C', 'Qheyra Syafitri Dzahin', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 47, 52, 5, 15, 'not_achieved', 'Cukup lancar'),
  (4, 'C', 'Rafiqa Raisa', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 9, 22, 13, 100, 'not_achieved', 'Perbanyak tadarus dirumah ya kak, agar makin lancar membaca Alquran-nyaDicetak: 7 Mei 2026 Halaman 25 dari 44 Baarakallahu Fiik'),
  (4, 'C', 'Rana Fitya Andara', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 28, 35, 7, 15, 'not_achieved', 'Cukup lancar, terkadang kurang tepat pada makhorijul huruf þ¥'),
  (4, 'C', 'Salsabila Mumtazah', 'tahfizh', 'Tahfizh', 'Tahfizh', 1, 18, 17, 100, 'not_achieved', 'Tetap di murajaah hafalan yang sudah di dapat, biar tambah lancar Baarakallahu Fiik'),
  (4, 'D', 'Adiba Azrin Nindita', 'iqra', 'Iqro 5', 'Iqro 5', 21, 24, 3, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Ailsa Huwaidah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 22, 24, 2, 100, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Aisyah Ayudia Inara', 'iqra', 'Iqro 6', 'Iqro 6', 15, 23, 8, 15, 'not_achieved', 'Perbaikan bacaan panjang pendek'),
  (4, 'D', 'Alfiyyah Naysa Kamila', 'iqra', 'Iqro 4', 'Iqro 4', 23, 28, 5, 15, 'not_achieved', 'Perbaikan bacaan panjang pendek'),
  (4, 'D', 'Alifa Azzahra', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 22, 24, 2, 100, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Annisa Febry Yanti', 'iqra', 'Iqro 6', 'Iqro 6', 21, 32, 11, 15, 'not_achieved', 'Perbaikan bacaan persiapan ujian naik tingkat tahsin lanjutan'),
  (4, 'D', 'Annisa Zhafira', 'iqra', 'Iqro 5', 'Iqro 5', 1, 5, 2, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Assyifa Humaira Ahmad', 'iqra', 'Iqro 6', 'Iqro 6', 14, 23, 9, 15, 'not_achieved', 'Melancarkan Bacaan dan waqaf ketika membaca'),
  (4, 'D', 'Dwi Azka Talita Zahra', 'iqra', 'Iqro 5', 'Iqro 6', 26, 4, 8, 15, 'not_achieved', 'Penguatan Mad Wajib dan Mad Ashly'),
  (4, 'D', 'Indira Azzahra Jasmine', 'iqra', 'Iqro 6', 'Iqro 6', 25, 32, 7, 15, 'not_achieved', 'Persiapan Ujian naik tingkat (Tahsin Lanjutan)'),
  (4, 'D', 'Kanisya Azwa', 'iqra', 'Iqro 5', 'Iqro 6', 24, 4, 10, 15, 'not_achieved', 'Melatih bacaan bersambung pada Iqro'' 5 dan penguatan Mad'),
  (4, 'D', 'Khadijah Nufaisah', 'iqra', 'Iqro 4', 'Iqro 4', 15, 18, 3, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Khairin Rahmadani', 'iqra', 'Iqro 6', 'Iqro 6', 27, 32, 5, 15, 'not_achieved', 'Persiapan ujian naik tingkat (Tahsin Lanjutan)'),
  (4, 'D', 'Maleeka Khairriyah Maulana', 'iqra', 'Iqro 4', 'Iqro 4', 22, 24, 2, 15, 'not_achieved', 'Fashiha Billa Fokus dan banyak baca iqro dirumah untuk melatih bacaan, dan perhatikan mad, huruf dan harakatnya'),
  (4, 'D', 'Nabila Atha Dzakira', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 8, 7, 15, 'not_achieved', 'Penguatan Waqaf dan Mad Wajib'),
  (4, 'D', 'Nadine Safa Elysia', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 22, 24, 2, 100, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Nagiva Humairah', 'iqra', 'Iqro 6', 'Iqro 6', 26, 32, 6, 15, 'not_achieved', 'Persiapan ujian naik tingkat (Tahsin Lanjutan)'),
  (4, 'D', 'Naira Azzahra', 'iqra', 'Iqro 6', 'Iqro 6', 14, 17, 3, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Natasha Ilmira Butar Butar', 'iqra', 'Iqro 6', 'Iqro 6', 24, 28, 4, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Naysa Luna Maharani', 'tahfizh', 'Juz 25', 'Juz 27', 1, 1, 40, 3, 'achieved', 'Muraja''ah 7 Juz (5 halaman/hari)'),
  (4, 'D', 'Salma Adliyah', 'iqra', 'Iqro 5', 'Iqro 5', 10, 15, 5, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Samhana Rafidah Biqis', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 9, 10, 1, 15, 'not_achieved', 'Fashiha Billa -'),
  (4, 'D', 'Syaqila Azzahra', 'iqra', 'Iqro 6', 'Iqro 6', 23, 30, 7, 15, 'not_achieved', 'Penguatan mad dan waqaf'),
  (4, 'D', 'Syaqila Zahrani Hamzan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 6, 3, 100, 'not_achieved', 'Fashiha Billa -'),
  (5, 'A', 'Abdullah Habibi Al Ghifari', 'iqra', 'Iqro 5', 'Iqro 5', 12, 15, 3, 15, 'not_achieved', 'abi dan ummi, ananda diturunkan dari iqro'' 5 hal.30 ke iqro'' 5 hal.12 karena ada bacaan yang belum pas(seperti gunnah dan qalqalah)'),
  (5, 'A', 'Abdurahman', 'iqra', 'Iqro 6', 'Iqro 6', 17, 27, 10, 15, 'not_achieved', 'Sering keliru panjang pendek, dan dengung'),
  (5, 'A', 'Adnan Syafi Amzari', 'iqra', 'Iqro 5', 'Iqro 5', 19, 22, 3, 15, 'not_achieved', 'Shaili Ayu Syahputri abi dan ummi mohon bantuan untuk ananda banyak mengulang membaca pr iqro'' di rumah Sitorus'),
  (5, 'A', 'Adzkan Dzar Alghifari Hasibuan', 'iqra', 'Iqro 5', 'Iqro 5', 17, 20, 3, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah dan tolong untuk melengkapi buku batas bacaan iqro'''),
  (5, 'A', 'Al Hatim', 'iqra', 'Iqro 5', 'Iqro 5', 7, 11, 4, 15, 'not_achieved', 'Harus banyak latihan membaca di rumah'),
  (5, 'A', 'Azka Fairuz', 'iqra', 'Iqro 6', 'Iqro 6', 4, 13, 9, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (5, 'A', 'Badrussalam', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 40, 48, 8, 15, 'not_achieved', 'Perhatikan waqof'),
  (5, 'A', 'Dafa Azhar', 'iqra', 'Iqro 5', 'Iqro 5', 14, 16, 2, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda banyak banyak mengulang membaca pr iqro'' di rumah'),
  (5, 'A', 'Dika Fahrezi', 'iqra', 'Iqro 3', 'Iqro 3', 8, 10, 2, 15, 'not_achieved', 'Abi dan ummi, ananda sangat memerlukan perhatian untuk mengulang bacaan pr iqro'' nya di rumah'),
  (5, 'A', 'Faiz Habibi', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 29, 39, 10, 15, 'not_achieved', 'Perhatikan panjang pendek, dan dengung'),
  (5, 'A', 'Faiz Muzacky Wahyudi', 'iqra', 'Iqro 4', 'Iqro 4', 26, 30, 4, 15, 'not_achieved', 'Banyak latihan membaca di rumah'),
  (5, 'A', 'Faris Bahauddin Basyir Pohan', 'iqra', 'Iqro 3', 'Iqro 3', 20, 21, 1, 15, 'not_achieved', 'abi dan ummi bacaan ananda diturunkan dari iqro''4 hal.31 ke iqro''3 hal.20 supaya bacaan lebih baik lagi dan mohon untuk melengkapi buku batas bacaan(LTQ)'),
  (5, 'A', 'Fawwaz Abu Abdillah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 8, 16, 8, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda mengingat bacaan tajwid(terutama mad), makharijul huruf(terutama huruf þ«,þ™) di rumah'),
  (5, 'A', 'GALANG HARDIANSYAH HASIBUAN', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 29, 33, 4, 15, 'not_achieved', 'alhamdulillah ananda sudah cukup baik bacaannya, tapi tetap harus ditingkatkan lagi ya'),
  (5, 'A', 'Haikal Arkana Ali Masyrafah', 'iqra', 'Iqro 6', 'Iqro 6', 17, 21, 4, 15, 'not_achieved', 'Sering keliru huruf, panjang pendek dan dengung'),
  (5, 'A', 'Hasbi Irsyad', 'iqra', 'Iqro 5', 'Iqro 5', 19, 25, 6, 15, 'not_achieved', 'Perhatikan panjang pendek, huruf dan waqof'),
  (5, 'A', 'Ihsan Al Fatih', 'iqra', 'Iqro 4', 'Iqro 4', 24, 24, 0, 15, 'not_achieved', 'Shaili Ayu abi dan ummi, ananda diturunkan dari iqro''5 hal.17 (Iqra) Syahputri Sitorus ke iqro''4 hal.24 supaya bacaan nya lebih baik lagi dan mohon perhatikan lagi absensi kehadiran'),
  (5, 'A', 'M. Digha Setia Muazzam', 'iqra', 'Iqro 4', 'Iqro 5', 30, 1, 3, 15, 'not_achieved', 'abi dan ummi mohon bantuan ananda supaya rajin mengulang membaca pr iqro'' di rumah dan perhatikan huruf þ« dan þ™'),
  (5, 'A', 'M. Fahri Akbar', 'iqra', 'Iqro 6', 'Iqro 6', 19, 32, 13, 15, 'not_achieved', '-');

SELECT 'part_4_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_4_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_4_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
