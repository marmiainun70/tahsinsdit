-- Restore April 2026 monthly_reports, part 1 of 7.
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
  (1, 'A', 'Abdullah Azzubair', 'iqra', 'Iqro 6', 'Iqro 6', 9, 18, 9, 15, 'not_achieved', 'Bang Zubair tetap dibaca pr iqra-nya dirumah sama ummi dan abi agar tambah lancar Baarakallahu Fiik'),
  (1, 'A', 'Alfarezi Khavindra Ligantara', 'iqra', 'Iqro 3', 'Iqro 3', 4, 12, 8, 15, 'not_achieved', 'Masih memerlukan bimbingan lebih mendalam pada penerapan bacaan Mad (Ya'' sukun)'),
  (1, 'A', 'Althaf Maulana Habibi', 'iqra', 'Iqro 5', 'Iqro 5', 8, 22, 14, 15, 'not_achieved', 'pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Amar Mufid Al-Husein', 'iqra', 'Iqro 5', 'Iqro 5', 13, 19, 6, 15, 'not_achieved', 'Melatih penyempurnaan pada sevagian Makhraj dan meyambung bacaan (membaca tidak secara putus-putus)'),
  (1, 'A', 'Arkhan Nur Alrasyid', 'iqra', 'Iqro 4', 'Iqro 4', 16, 25, 9, 15, 'not_achieved', 'Melancarkan Makhrah Huruf dan melancarkan bacaan Mad'),
  (1, 'A', 'Ayyas uwais Alqarny', 'iqra', 'Iqro 3', 'Iqro 4', 32, 14, 12, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Hafizd Al Abbad', 'iqra', 'Iqro 4', 'Iqro 5', 25, 16, 21, 15, 'achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Hamzah Asadullah', 'iqra', 'Iqro 5', 'Iqro 5', 14, 22, 8, 15, 'not_achieved', 'Latihan membaca secara bersambung tanpa terputus-putus'),
  (1, 'A', 'Ibrahim Ar Rayyan', 'iqra', 'Iqro 2', 'Iqro 2', 25, 30, 5, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang harus fokus ketika membaca jangan kebanyakan thawaf ya bang Baarakallahu Fiik'),
  (1, 'A', 'Ikhwan Ma''ruf Yafie', 'iqra', 'Iqro 3', 'Iqro 3', 15, 25, 10, 15, 'not_achieved', 'Melancarkan bacaan Mad dan penyempurnaan makhraj'),
  (1, 'A', 'Kahfi Arka Rachmad', 'iqra', 'Iqro 5', 'Iqro 5', 7, 13, 6, 15, 'not_achieved', 'Latihan bacaan bersambung tanpa terputus putus pada iqro'' 5'),
  (1, 'A', 'Misyari Abdullah Nasution', 'iqra', 'Iqro 3', 'Iqro 3', 9, 14, 5, 15, 'not_achieved', 'Melancarkan bacaan mad dan huruf'),
  (1, 'A', 'Muhammad Abimanyu tarigan', 'iqra', 'Iqro 1', 'Iqro 1', 11, 11, 0, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Muhammad Abyan Tama', 'iqra', 'Iqro 3', 'Iqro 3', 5, 13, 8, 15, 'not_achieved', 'penurunan halaman pada jilid 3 guna melancarkan Mad yang belum sempurna'),
  (1, 'A', 'Muhammad Al-Fatih', 'iqra', 'Iqro 2', 'Iqro 2', 24, 31, 7, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang banyak mengingat huruf þÁ þ þ¥ þ¹ Baarakallahu Fiik'),
  (1, 'A', 'Muhammad Haziq', 'iqra', 'Iqro 3', 'Iqro 4', 30, 10, 10, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Muhammad Ibrahim', 'iqra', 'Iqro 3', 'Iqro 3', 8, 11, 3, 15, 'not_achieved', 'Terus semangat membaca dan belajarnya'),
  (1, 'A', 'Muhammad Khadafi Alfarizi', 'iqra', 'Iqro 3', 'Iqro 4', 30, 6, 0, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Muhammad Ukasya Hanjuni', 'iqra', 'Iqro 4', 'Iqro 4', 17, 25, 8, 15, 'not_achieved', 'Melatih fokus ketika membaca Iqro'''),
  (1, 'A', 'Muhammad Wildan', 'iqra', 'Iqro 4', 'Iqro 4', 17, 21, 4, 15, 'not_achieved', 'Melancarkan Bacaan tanpa terputus purus ketika membaca'),
  (1, 'A', 'Razka Andari Siregar', 'iqra', 'Iqro 6', 'Iqro 6', 4, 14, 10, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'A', 'Ubay Al Ushaim Abdullah', 'iqra', 'Iqro 4', 'Iqro 4', 11, 22, 11, 15, 'not_achieved', 'Perbaikan bacaan panjang pendek'),
  (1, 'A', 'Zegeist Nufail Harahap', 'iqra', 'Iqro 5', 'Iqro 5', 5, 10, 5, 15, 'not_achieved', 'Pr iqra-nya dirumah tetap dibaca ya bang Baarakallahu Fiik'),
  (1, 'B', 'Abid Ubaydullah', 'iqra', 'Iqro 3', 'Iqro 3', 11, 12, 1, 15, 'not_achieved', 'Latihan terus dirumah untuk mengingat huruf dan baris serta makhroj yang tepat ya nak..'),
  (1, 'B', 'Afnan Rafasya', 'iqra', 'Iqro 2', 'Iqro 3', 31, 5, 4, 15, 'not_achieved', 'Abi dan Umi mohon bantu Ananda membaca PR Iqro''nya.'),
  (1, 'B', 'Ahmad Ubaidillah Harahap', 'iqra', 'Iqro 2', 'Iqro 2', 22, 28, 6, 15, 'not_achieved', 'Ummi dan Abi tolong bantuannya untuk membantu ananda Ubai menegerjakan PR membaca Iqro'' nya, agar ketika setoran bacaan Iqro'' di sekolah lancar.'),
  (1, 'B', 'Alrazi Akmal Prasityo', 'iqra', 'Iqro 3', 'Iqro 3', 8, 15, 7, 15, 'not_achieved', 'Abi dan Ummi mohon melengkapi buku Iqro'' Ananda, agar memudahkan Ananda untuk mengulang atau membaca PR Iqro'' nya di rumah.'),
  (1, 'B', 'Atha Alfarezi Kabeakan', 'iqra', 'Iqro 4', 'Iqro 4', 8, 12, 4, 15, 'not_achieved', '"Bacaan atha sudah lancar, tapi harus lebih teliti dan fokus lagi membedakan mana yang harus dibaca panjang dan mana yang pendek ya nak.."'),
  (1, 'B', 'Azka Afif Hamdani', 'iqra', 'Iqro 4', 'Iqro 5', 27, 9, 12, 15, 'not_achieved', '"Alhamdulillah bacaan ananda semakin lancar..tinggal dipercepat sedikit temponya agar lebih mengalir."'),
  (1, 'B', 'Dzakiandra Hasan', 'iqra', 'Iqro 3', 'Iqro 3', 10, 14, 4, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah mulai bagus tapi harus lebih teliti lagi membedakan mana yang harus dibaca panjang dan mana yang pendek ya nak"'),
  (1, 'B', 'Fajar Izzat Tama', 'iqra', 'Iqro 3', 'Iqro 3', 5, 12, 7, 15, 'not_achieved', 'Abi dan Ummi mohon untuk selalu membantu Ananda membaca PR Iqro''nya.'),
  (1, 'B', 'Fawwaz Khuzaimah Praja', 'iqra', 'Iqro 2', 'Iqro 2', 11, 17, 6, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah semakin lancar, akan tetapi lebih berlatih lagi untuk pengucapan huruf þµ þ™ þ« þ¯ þ­"'),
  (1, 'B', 'Fuiraz Achmad Syauqi Aderin', 'iqra', 'Iqro 1', 'Iqro 1', 19, 19, 0, 15, 'not_achieved', '"Jangan menyerah..Tetap semangat mengingat huruf hijaiyahnya ya nak"'),
  (1, 'B', 'Ghifari Al ''Izza', 'iqra', 'Iqro 2', 'Iqro 3', 31, 4, 0, 15, 'not_achieved', 'Abi dan Ummi mohon untuk membantu Ananda membaca PR Iqro'' nya.'),
  (1, 'B', 'Muhammad Alif Hafizh Nasution', 'iqra', 'Iqro 4', 'Iqro 4', 4, 17, 13, 15, 'not_achieved', 'Alhamdulillah Ananda baik dalam membaca Iqro''.'),
  (1, 'B', 'Muhammad Aska Ramadhan Nasution', 'iqra', 'Iqro 5', 'Iqro 5', 21, 29, 8, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah lancar akantetapi untuk mad dan tempo dalam membaca nya lebih dilatih lagi agar semakin baik ya nak"'),
  (1, 'B', 'Muhammad Azka Amzari', 'iqra', 'Iqro 3', 'Iqro 3', 13, 18, 5, 15, 'not_achieved', 'Abi dan Umi mohon bantu Ananda untuk membaca PR Iqro''nya.'),
  (1, 'B', 'Muhammad Fatih Abdul Rahman', 'iqra', 'Iqro 2', 'Iqro 2', 18, 19, 1, 15, 'not_achieved', '"Semangat terus belajarnya ya nak.. Lebih teliti lagi membedakan mana yang harus dibaca panjang dan mana yang pendek ya"'),
  (1, 'B', 'Muhammad Gibran Al-Husayn', 'iqra', 'Iqro 4', 'Iqro 5', 28, 10, 12, 15, 'not_achieved', 'Alhamdulillah Ananda baik dalam membaca Iqro''.'),
  (1, 'B', 'Muhammad Naufal Ar Rasyid', 'iqra', 'Iqro 4', 'Iqro 5', 29, 6, 7, 15, 'not_achieved', '"Bacaan ananda sudah bagus, tinggal dipercepat sedikit temponya agar lebih mengalir."'),
  (1, 'B', 'Nafiz Al-Atta Hamdan', 'iqra', 'Iqro 3', 'Iqro 3', 12, 18, 6, 15, 'not_achieved', 'Abi dan Ummi mohon untuk selalu membantu Ananda membaca PR Iqro''nya.'),
  (1, 'B', 'Raffi Artha', 'iqra', 'Iqro 3', 'Iqro 4', 29, 4, 5, 15, 'not_achieved', 'Abi dan Umi mohon bantu Ananda membaca PR Iqro''nya.'),
  (1, 'B', 'Umar Alfarouq Yanglera', 'iqra', 'Iqro 6', 'Iqro 6', 15, 17, 2, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah bagus, tinggal dipercepat sedikit temponya agar lebih mengalir."'),
  (1, 'B', 'Uwais Al Qorni', 'iqra', 'Iqro 2', 'Iqro 2', 1, 1, 0, 15, 'not_achieved', 'Ananda tidak pernah masuk sekolah.'),
  (1, 'B', 'Yazid', 'iqra', 'Iqro 5', 'Iqro 5', 7, 11, 4, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah mulai bagus...akantetapi untuk mad dan tempo bacaan nya diperhatikan lagi ya nak"'),
  (1, 'B', 'Yusuf Oziel Zamzami', 'iqra', 'Iqro 3', 'Iqro 3', 17, 18, 1, 15, 'not_achieved', '"Semangat terus belajar nya ya nak.. Harus lebih teliti untuk membedakan huruf dengan baris serta panjang pendek nya"'),
  (1, 'B', 'Zaigham Al Hamizan', 'iqra', 'Iqro 3', 'Iqro 4', 30, 5, 5, 15, 'not_achieved', 'Abi dan Umi mohon bantu Ananda membaca PR Iqro''nya.'),
  (1, 'C', 'Afifah lubis', 'iqra', 'Iqro 5', 'Iqro 5', 14, 29, 15, 15, 'achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Aisyah azmina ar-ramsyi', 'iqra', 'Iqro 4', 'Iqro 5', 26, 5, 9, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Alifa Hibatillah', 'iqra', 'Iqro 6', 'Iqro 6', 7, 14, 7, 15, 'not_achieved', NULL),
  (1, 'C', 'Alifia Salsabila', 'iqra', 'Iqro 4', 'Iqro 4', 6, 13, 7, 15, 'not_achieved', NULL),
  (1, 'C', 'Annisa Azkadina Pohan', 'iqra', 'Iqro 2', 'Iqro 2', 8, 16, 8, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Athirah Jasmine Malika', 'iqra', 'Iqro 5', 'Iqro 5', 15, 23, 8, 15, 'not_achieved', NULL),
  (1, 'C', 'Faiqah Muthia Novianto', 'iqra', 'Iqro 4', 'Iqro 4', 7, 16, 9, 15, 'not_achieved', NULL),
  (1, 'C', 'Hanifah Nur Jannah', 'iqra', 'Iqro 5', 'Iqro 5', 6, 15, 9, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Hanin Aulia Mafaza', 'iqra', 'Iqro 3', 'Iqro 4', 31, 8, 7, 15, 'not_achieved', NULL),
  (1, 'C', 'Khadijah Iffatul Azizah', 'iqra', 'Iqro 4', 'Iqro 4', 19, 25, 6, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Maryam Tabiya Eshal', 'iqra', 'Iqro 6', 'Iqro 6', 18, 28, 10, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Naqiyah Nur Iffah Br Sinukaban', 'iqra', 'Iqro 6', 'Iqro 6', 5, 12, 7, 15, 'not_achieved', NULL),
  (1, 'C', 'Nasyita Ghita Syahla', 'iqra', 'Iqro 4', 'Iqro 4', 12, 15, 3, 15, 'not_achieved', NULL),
  (1, 'C', 'Nisrin Naziha', 'iqra', 'Iqro 5', 'Iqro 6', 23, 8, 15, 15, 'achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Qienayha Setia Rahfa', 'iqra', 'Iqro 2', 'Iqro 2', 22, 26, 4, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Rania Azzura Andara', 'iqra', 'Iqro 3', 'Iqro 3', 1, 5, 2, 15, 'not_achieved', NULL),
  (1, 'C', 'Safiyyah Inayah Humaira', 'iqra', 'Iqro 4', 'Iqro 5', 28, 5, 7, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Salsabila Zahra', 'iqra', 'Iqro 5', 'Iqro 5', 7, 10, 3, 15, 'not_achieved', NULL),
  (1, 'C', 'Salwa Putri Rasya', 'iqra', 'Iqro 4', 'Iqro 4', 19, 24, 5, 15, 'not_achieved', NULL),
  (1, 'C', 'Shezan Hanayaka', 'iqra', 'Iqro 4', 'Iqro 5', 29, 8, 9, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Syafiyya jannah', 'iqra', 'Iqro 2', 'Iqro 2', 19, 21, 2, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'C', 'Tanzeela Nada Ramadhani', 'iqra', 'Iqro 5', 'Iqro 5', 15, 25, 10, 15, 'not_achieved', NULL),
  (1, 'C', 'Zalfa Hanya ketaren', 'iqra', 'Iqro 3', 'Iqro 3', 20, 27, 7, 15, 'not_achieved', 'Maulina Sitorus -'),
  (1, 'D', 'Adhiya Bakhdan Faatika', 'iqra', 'Iqro 5', 'Iqro 5', 7, 12, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Ainaya Chaira Dzahin P', 'iqra', 'Iqro 5', 'Iqro 5', 13, 20, 7, 15, 'not_achieved', 'Perhatikan huruf, dan panjang pendek'),
  (1, 'D', 'Asheeqa Hijaba Taqiya', 'iqra', 'Iqro 3', 'Iqro 3', 24, 31, 7, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' (terutama bacaan panjang-pendek) dan hafalan di rumah'),
  (1, 'D', 'Ayasha Shaqueena Shareen', 'iqra', 'Iqro 4', 'Iqro 4', 20, 30, 10, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Cut Qanita Azzahra', 'iqra', 'Iqro 3', 'Iqro 3', 14, 19, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Farhana Abdillah', 'iqra', 'Iqro 2', 'Iqro 2', 10, 14, 4, 15, 'not_achieved', 'Masih banyak harus latihan membaca di rumah'),
  (1, 'D', 'Haura Jazilah', 'iqra', 'Iqro 4', 'Iqro 5', 25, 1, 0, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Kahiratun Najihah', 'iqra', 'Iqro 1', 'Iqro 1', 15, 16, 1, 15, 'not_achieved', 'Masih sangat butuh bantuan orang tua di rumah'),
  (1, 'D', 'Kansa Anindya', 'iqra', 'Iqro 6', 'Iqro 6', 8, 17, 9, 15, 'not_achieved', 'Cukup Lancar'),
  (1, 'D', 'Khanza Nayla Cholia', 'iqra', 'Iqro 5', 'Iqro 5', 1, 9, 6, 15, 'not_achieved', 'Perhatikan huruf2 nya ketika membaca'),
  (1, 'D', 'Layla Andridy Harahap', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 41, 50, 9, 100, 'not_achieved', 'Cukup Bagus'),
  (1, 'D', 'Maryam Aisha Almahyra Lubis', 'iqra', 'Iqro 5', 'Iqro 5', 1, 9, 6, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Mecca Almadina Ikhawan', 'iqra', 'Iqro 3', 'Iqro 3', 1, 4, 1, 15, 'not_achieved', 'Dalam bulan ini membaca Iqro'' 2 (Hal 29-32) dan iqro'' 3 (Hal 3-4)'),
  (1, 'D', 'Naisah Ratu Cantika', 'iqra', 'Iqro 3', 'Iqro 3', 10, 15, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Numa Shabira', 'iqra', 'Iqro 6', 'Iqro 6', 7, 14, 7, 15, 'not_achieved', 'Perhatikan bacaan dengung dan panjang pendek'),
  (1, 'D', 'Raisya Nabila Kurniawan', 'iqra', 'Iqro 3', 'Iqro 3', 24, 27, 3, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' (terutama bacaan panjang pendeknya) di rumah'),
  (1, 'D', 'Rumaysha Hafizhah', 'iqra', 'Iqro 5', 'Iqro 5', 4, 8, 4, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Shafiyah Nailah Nst', 'iqra', 'Iqro 3', 'Iqro 3', 25, 31, 6, 15, 'not_achieved', 'Perhatikan Huruf, dan panjang pendek'),
  (1, 'D', 'Shafyyah Yumna', 'iqra', 'Iqro 5', 'Iqro 5', 7, 13, 6, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (1, 'D', 'Shaqilla Almahira', 'iqra', 'Iqro 3', 'Iqro 3', 7, 11, 4, 15, 'not_achieved', 'Perhatikan Huruf, dan panjang pendek'),
  (1, 'D', 'Syarah Alisya Sidabutar', 'iqra', 'Iqro 3', 'Iqro 3', 8, 10, 2, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda supaya banyak mengulang bacaan pr iqro'' di rumah'),
  (1, 'D', 'Zalfa Nadhif Firmansyah', 'iqra', 'Iqro 3', 'Iqro 3', 1, 6, 3, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda supaya banyak mengulang pr iqro'' di rumah dan juga perhatikan bacaan panjang-pendeknya'),
  (1, 'D', 'Zunayrah Ashfiya', 'iqra', 'Iqro 3', 'Iqro 3', 20, 31, 11, 15, 'not_achieved', 'Cukup Bagus'),
  (2, 'A', 'Abdurrahman Hanif As Shiddiq', 'iqra', 'Iqro 4', 'Iqro 4', 6, 18, 12, 15, 'not_achieved', '-'),
  (2, 'A', 'Abrizam Abdhe Habibie', 'iqra', 'Iqro 3', 'Iqro 3', 1, 5, 2, 15, 'not_achieved', 'mad dan makharijul huruf belum tepat');

SELECT 'part_1_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_1_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_1_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
