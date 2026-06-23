-- Restore April 2026 monthly_reports, part 3 of 7.
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
  (3, 'A', 'Shafiq Adam Batubara Siregar', 'iqra', 'Iqro 4', 'Iqro 4', 8, 18, 10, 15, 'not_achieved', 'Makharijul huruf perlu perbaikan'),
  (3, 'A', 'Uwais', 'iqra', 'Iqro 5', 'Iqro 5', 1, 19, 16, 15, 'achieved', 'Tajwid serta nafas yang masih terputus-putus'),
  (3, 'A', 'Uwais Rashano Lubis', 'iqra', 'Iqro 5', 'Iqro 5', 1, 13, 10, 15, 'not_achieved', 'panjang pendek perlu perbaikan'),
  (3, 'B', 'ABYAN MAUZA ANANTA', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 14, 13, 100, 'not_achieved', '-'),
  (3, 'B', 'Al Baihaqi', 'iqra', 'Iqro 6', 'Iqro 6', 1, 13, 10, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'Alwi Syahreza', 'iqra', 'Iqro 6', 'Iqro 6', 9, 18, 9, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'DIAZ AHMAD AZZAM', 'iqra', 'Iqro 6', 'Iqro 6', 21, 30, 9, 15, 'not_achieved', '-'),
  (3, 'B', 'Ehsan Muhammad', 'tahfizh', 'Juz 29', 'Juz 29', 1, 2, 1, 3, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'GHANI YAZID KHAIRY', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 3, 2, 100, 'not_achieved', '-'),
  (3, 'B', 'Imadi Iltidzam', 'iqra', 'Iqro 6', 'Iqro 6', 22, 32, 10, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'M Boy virendra Lubis', 'iqra', 'Iqro 5', 'Iqro 5', 22, 28, 6, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'M. Alif Alamsyah', 'iqra', 'Iqro 5', 'Iqro 6', 32, 10, 8, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'M. Uwais Al Husain', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'MAHDI AL BARAA', 'iqra', 'Iqro 5', 'Iqro 6', 32, 8, 6, 15, 'not_achieved', '-'),
  (3, 'B', 'Muhammad Ahsan', 'iqra', 'Iqro 4', 'Iqro 4', 17, 23, 6, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'MUHAMMAD AL FARIS', 'iqra', 'Iqro 5', 'Iqro 5', 8, 13, 5, 15, 'not_achieved', '-'),
  (3, 'B', 'Muhammad Faathir Sain', 'iqra', 'Iqro 3', 'Iqro 4', 29, 5, 6, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'MUHAMMAD KUN ARFA', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 20, 10, 100, 'not_achieved', '-'),
  (3, 'B', 'MUHAMMAD TSAQIEB AL-THA', 'iqra', 'Iqro 5', 'Iqro 6', 25, 9, 14, 15, 'not_achieved', '-'),
  (3, 'B', 'RAYHAN AULIA', 'iqra', 'Iqro 6', 'Iqro 6', 21, 28, 7, 15, 'not_achieved', '-'),
  (3, 'B', 'Salman Alfarisi', 'iqra', 'Iqro 6', 'Iqro 6', 16, 23, 7, 15, 'not_achieved', 'Maulina Sitorus -'),
  (3, 'B', 'UTSMAN KHALIF MUSYRAFAI', 'iqra', 'Iqro 6', 'Iqro 6', 6, 14, 8, 15, 'not_achieved', '-'),
  (3, 'C', 'Aisyah Ayudhia Inara', 'iqra', 'Iqro 6', 'Iqro 6', 17, 21, 4, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah lancar.. Untuk makhrojnya sering latihan di rumah ya nak"'),
  (3, 'C', 'AISYAH AYUDIA RAHMAH', 'iqra', 'Iqro 6', 'Iqro 6', 8, 18, 10, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'Azkadina Naila', 'iqra', 'Iqro 4', 'Iqro 5', 28, 4, 6, 15, 'not_achieved', '"Alhamdulillah bacaan anada sudah bagus, tetapi harus lebih teliti lagi membedakan mana yang harus dibaca panjang dan mana yang pendek ya."'),
  (3, 'C', 'BALQIS NURI ALMEERA', 'iqra', 'Iqro 6', 'Iqro 6', 17, 22, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' (perlu penekanan huruf ghunnah yaitu 2 harakat) dan hafalan di rumah'),
  (3, 'C', 'Dzakirah Zahrah', 'iqra', 'Iqro 3', 'Iqro 3', 30, 31, 1, 15, 'not_achieved', '"Lebih semangat lagi belajar nya ya nak.. Madnya diperhatikan lagi, Bacaannya jangan dijeda ya nak"'),
  (3, 'C', 'DZAKIYYA AFTANI ARIFIN', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', 'bacaan Iqro'' 6 bulan ini dari halaman 26-32'),
  (3, 'C', 'HASHIFAH AMIRA NASUTION', 'iqra', 'Iqro 5', 'Iqro 5', 14, 21, 7, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'KHADIJAH', 'iqra', 'Iqro 5', 'Iqro 6', 28, 6, 8, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'KHALSA SABILAH SIHOTANG', 'iqra', 'Iqro 6', 'Iqro 6', 24, 30, 6, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'Khoiro Ulin Nuha', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 3, 8, 5, 15, 'not_achieved', '"Semangat ya nak! Bacaannya sudah mulai lancar, hanya perlu lebih teliti lagi pada tanda waqaf (berhenti) dan wasal (lanjut). Sering-sering diulang di rumah agar semakin mengalir bacaannya"'),
  (3, 'C', 'KINAYA LUTHFIA ALFATIH', 'iqra', 'Iqro 3', 'Iqro 3', 19, 21, 2, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda banyak mengulang membaca pr iqro'' di rumah'),
  (3, 'C', 'Malika Aulia', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 14, 18, 4, 15, 'not_achieved', '"Semangat ya nak! Bacaannya sudah mulai lancar, hanya perlu lebih teliti lagi pada tanda waqaf (berhenti) dan wasal (lanjut). Sering-sering diulang di rumah agar semakin mengalir bacaannya"'),
  (3, 'C', 'MARYAM MUMTAZAH', 'iqra', 'Iqro 3', 'Iqro 4', 30, 5, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda banyak mengulang membaca pr iqro'' di rumah'),
  (3, 'C', 'MARYAM QINARAH BATUBARA', 'iqra', 'Iqro 5', 'Iqro 5', 13, 18, 5, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'Meyhila Tasyfa', 'iqra', 'Iqro 5', 'Iqro 5', 20, 24, 4, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah lancar akan tetapi lebih diperhatikan lagi mad dan tempo bacanya ya nak"'),
  (3, 'C', 'Nayla Adzkia Br Surbakti', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 4, 6, 2, 15, 'not_achieved', '"Semangat ya nak! Bacaannya sudah mulai lancar, hanya perlu lebih teliti lagi pada tanda waqaf (berhenti) dan wasal (lanjut). Sering-sering diulang di rumah agar semakin mengalir bacaannya"'),
  (3, 'C', 'Quin Hafizah Mahdayan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 16, 19, 3, 15, 'not_achieved', '"Semangat ya nak! Bacaannya sudah mulai lancar, hanya perlu lebih teliti lagi pada tanda waqaf (berhenti) dan wasal (lanjut). Sering-sering diulang di rumah agar semakin mengalir bacaannya"'),
  (3, 'C', 'Risya Radhatuljannah', 'iqra', 'Iqro 3', 'Iqro 4', 18, 4, 16, 15, 'achieved', '"Alhamdulillah bacaan ananda sudah mulai lancar, akantetapi untuk tempo bacaannya jangan dijeda" Ya nak"'),
  (3, 'C', 'Shaqueen Salsabila', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 15, 20, 5, 15, 'not_achieved', '"Semangat ya nak! Bacaannya sudah mulai lancar, hanya perlu lebih teliti lagi pada tanda waqaf (berhenti) dan wasal (lanjut). Sering-sering diulang di rumah agar semakin mengalir bacaannya"'),
  (3, 'C', 'Shezan Alisha Arasely', 'iqra', 'Iqro 6', 'Iqro 6', 29, 31, 2, 15, 'not_achieved', '"Alhamdulillah bacaan ananda sudah bagus, akantetapi untuk tempo bacaannya jangan dijeda" Ya nak serta lebih diperhatikan lagi mad jaiz dan wajib nya"'),
  (3, 'C', 'YUMNA CANTIKA ABIDIN', 'iqra', 'Iqro 6', 'Iqro 6', 21, 32, 11, 15, 'not_achieved', 'abi dan ummi mohon bantuan untuk ananda membaca pr iqro'' di rumah'),
  (3, 'C', 'KAIA AFIA', 'iqra', 'Iqro 6', 'Iqro 6', 11, 15, 4, 15, 'not_achieved', 'Shaili Ayu abi dan ummi mohon bantuan untuk ananda (Iqra) Syahputri Sitorus membaca pr iqro'' (terutama bacaan panjang-pendeknya) di rumah'),
  (3, 'D', 'Aisyah Putri Alvia', 'tahfizh', 'Juz 29', 'Juz 29', 1, 5, 4, 3, 'achieved', 'Barakallahufiik.... hafalan kk Aisyah sdh bagus dan lancar,dan Tajwidnya baik semoga kk lebih semangat lagi menghafal dan memuraja''ah di rumah.'),
  (3, 'D', 'Alya Amanda', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 12, 6, 15, 'not_achieved', 'Alhamdulillah... bacaan kk lancar, tapi masih perlu di tingkatkan belajar Makhraj dan Tajwid. tetap semangat y kk..'),
  (3, 'D', 'Arafah Zakiya Nasution', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 7, 6, 15, 'not_achieved', 'Perlu memperbaiki hukum tajwid dan waqaf'),
  (3, 'D', 'Audrey Dinda Faisal', 'iqra', 'Iqro 5', 'Iqro 6', 21, 6, 15, 15, 'achieved', 'Perlu belajar penggunaan waqaf'),
  (3, 'D', 'Aysha Qatrunnada Fitri', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 10, 4, 15, 'not_achieved', 'Alhamdulillah... bacaan kk lancar, namun kurang tepat masih perlu banyak belajar, perbaikan Makhraj dan Tajwid. tetap semangat y kk..'),
  (3, 'D', 'Azkia Hanin Dinayah', 'iqra', 'Iqro 5', 'Iqro 5', 5, 22, 17, 15, 'achieved', '-'),
  (3, 'D', 'Fitri Humaira', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 13, 19, 6, 15, 'not_achieved', 'Bacaan kk kurang lancar,masih perlu banyak belajar perbaikan Makhraj dan Tajwidnya. tetap semangat y kk..'),
  (3, 'D', 'Humaira Ukasya F', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 32, 37, 5, 15, 'not_achieved', 'Alhamdulillah... bacaan sdh lancar,namun perlu di perbaiki Makhraj dan Tajwid. tetap semangat y kk...'),
  (3, 'D', 'Inayah Arfiandi', 'iqra', 'Iqro 4', 'Iqro 5', 31, 12, 11, 15, 'not_achieved', '-'),
  (3, 'D', 'Khadijah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 7, 1, 15, 'not_achieved', '-'),
  (3, 'D', 'Nabila Syahfiri NST', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 11, 6, 15, 'not_achieved', 'Alhamdulillah... bacaan sdh bagus dan lancar,Tajwid sdh baik. semoga kk Nabila lebih semangat lagi menghafal Al-Qur''an dan memuraja''ah.'),
  (3, 'D', 'Nadhira Qiana Senja', 'iqra', 'Iqro 6', 'Iqro 6', 11, 25, 14, 15, 'not_achieved', 'Perlu mempelajari waqaf'),
  (3, 'D', 'Nafisah Nazih', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 10, 15, 5, 15, 'not_achieved', 'Alhamdulillah... bacaan kk lancar ,namun masih perlu banyak perbaikan Makhraj dan Tajwid,dan jangan terburu buru bacanya. tetap semangat y kk....'),
  (3, 'D', 'Naura Alfatunnisa Akbar', 'iqra', 'Iqro 4', 'Iqro 5', 28, 13, 15, 15, 'achieved', '-'),
  (3, 'D', 'Nayra Alyssa', 'tahfizh', 'Juz 30', 'Juz 30', 1, 6, 5, 3, 'achieved', 'Perbaikan huruf þÅ dan þ¯'),
  (3, 'D', 'Raisah Nadhira', 'iqra', 'Iqro 4', 'Iqro 5', 24, 6, 12, 15, 'not_achieved', '-'),
  (3, 'D', 'Rania Azzahra Wahyudi', 'iqra', 'Iqro 5', 'Iqro 5', 8, 20, 12, 15, 'not_achieved', 'Perlu memperbaiki keluar huruf þÉ dan þƒ'),
  (3, 'D', 'Sabrina Najihah', 'iqra', 'Iqro 3', 'Iqro 4', 29, 12, 13, 15, 'not_achieved', '-'),
  (3, 'D', 'Safanah Humairoh', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 7, 14, 7, 15, 'not_achieved', 'Alhamdulillah.. bacaan lancar,namun masih perlu perbaikan Makhraj dan Tajwidnya. tetap semangat y kk...'),
  (3, 'D', 'Wafiq Azizah Sakinah', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 13, 19, 6, 15, 'not_achieved', 'Alhamdulillah.. bacaan kk lancar,namun lebih ditingkatkan lagi kualitas Makhraj dan Tajwid. semoga kk lebih semangat lagi....'),
  (3, 'D', 'Yasmin Ziya Lathifah', 'iqra', 'Iqro 6', 'Iqro 6', 8, 31, 23, 15, 'achieved', '.........þÚþôþÓ ýò þÙþ­þŽþ‘ Alhamdulillah.... Bacaan sdh bagus, dan lancar yg perlu diingat cara membedakan Idzhar dan Ikhfa. lebih semangat lagi y kk Yasmin!!!!!'),
  (3, 'D', 'Zaynab Asysyaima', 'iqra', 'Iqro 6', 'Iqro 6', 11, 27, 16, 15, 'achieved', 'Perlu memperbaiki hukum tajwid Izhar'),
  (4, 'A', 'Abdullah zaid', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 9, 8, 15, 'not_achieved', '-'),
  (4, 'A', 'Ahmad Fachri Rafasha Chaniago', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 5, 12, 7, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Dalam Surat Al-Baqarah'),
  (4, 'A', 'Arzanka Razaq Hamdan', 'iqra', 'Iqro 4', 'Iqro 4', 19, 29, 10, 15, 'not_achieved', '-'),
  (4, 'A', 'Aufa Saqhil', 'iqra', 'Iqro 3', 'Iqro 3', 24, 30, 6, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H -'),
  (4, 'A', 'Azizan Shaqil', 'iqra', 'Iqro 5', 'Iqro 5', 17, 24, 7, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Terus tingkatkan semangat belajarnya, perbanyak membaca dan murojaah sebelum tasmi bersama ustadz agar peningkatan bacaannya semakin pesat, serta kurangi bermain agar lebih fokus dalam belajar, Barakallah Fiik'),
  (4, 'A', 'Azmi Ar rasyid Lubis', 'iqra', 'Iqro 5', 'Iqro 6', 20, 4, 14, 15, 'not_achieved', '-'),
  (4, 'A', 'Dafa Rafif Alfathan', 'iqra', 'Iqro 5', 'Iqro 5', 16, 32, 16, 15, 'achieved', '-'),
  (4, 'A', 'Dzikri Ikhwan', 'iqra', 'Iqro 6', 'Iqro 6', 25, 29, 4, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Lebih serius lagi dalam membaca Iqra’ dan perbanyak latihan setiap hari agar kemampuan membaca semakin baik serta segera naik ke Tahsin Lanjutan'),
  (4, 'A', 'Faiz Pranaja', 'iqra', 'Iqro 5', 'Iqro 5', 14, 29, 15, 15, 'achieved', '-'),
  (4, 'A', 'Fajar alifio', 'iqra', 'Iqro 5', 'Iqro 6', 19, 4, 15, 15, 'achieved', '-'),
  (4, 'A', 'Fathan Ahmad', 'iqra', 'Iqro 5', 'Iqro 6', 28, 11, 13, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H -'),
  (4, 'A', 'Luthfie Sakrie Zaidan', 'iqra', 'Iqro 4', 'Iqro 4', 19, 25, 6, 15, 'not_achieved', 'Miftahul Arsyad Gunakan waktu sebaik mungkin, manfaatkan waktu Saragih (Iqra) Asri, S.H membaca dengan maksimal dan isi waktu luang dengan hal-hal yang bermanfaat. Tingkatkan fokus dalam shalat, insyaAllah Allah akan memperbaiki akhlak dan perangainya, Barakallah fiikum.'),
  (4, 'A', 'Mirza Habib Ukail', 'iqra', 'Iqro 6', 'Iqro 6', 9, 32, 23, 15, 'achieved', '-'),
  (4, 'A', 'Muhammad Alfiandah', 'iqra', 'Iqro 4', 'Iqro 4', 17, 29, 12, 15, 'not_achieved', '-'),
  (4, 'A', 'Muhammad Atha Erlangga', 'iqra', 'Iqro 5', 'Iqro 5', 4, 21, 17, 15, 'achieved', '-'),
  (4, 'A', 'Muhammad Faris khan', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 2, 13, 11, 15, 'not_achieved', '-'),
  (4, 'A', 'Muhammad Farrel Al faiz Waskita', 'iqra', 'Iqro 4', 'Iqro 4', 9, 12, 3, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Tingkatkan semangat belajar Iqra’-nya, perbanyak latihan membaca setiap hari agar kemampuan membaca semakin baik dan terus berkembang. Barakallah fiikum.'),
  (4, 'A', 'Muhammad Hanif Al Hafiz', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 6, 19, 13, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Jangan mudah terpengaruh oleh tingkah laku yang kurang baik dari teman. Pilihlah pergaulan yang membawa kepada kebaikan, tetap hormat kepada guru dan orang tua, serta isi waktu dengan belajar dan kegiatan yang bermanfaat agar menjadi anak yang berakhlak baik dan membanggakan. Barakallah fiikum'),
  (4, 'A', 'Omar Al Faruq', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 19, 18, 15, 'achieved', 'Miftahul Arsyad Asri, S.H -'),
  (4, 'A', 'Rafardan Al farizky', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 32, 45, 13, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Tetap semangat berlatih memanjangkan bacaan mad sesuai kaidah tajwid, karena dengan latihan yang rutin insyaAllah bacaan Al-Qur’annya akan semakin baik, tartil, dan lancar. Barakallah fiik'),
  (4, 'A', 'Rayyan Affan Ar rafif', 'iqra', 'Iqro 5', 'Iqro 6', 18, 4, 16, 15, 'achieved', '-'),
  (4, 'A', 'Revano aditya', 'iqra', 'Iqro 5', 'Iqro 6', 19, 4, 15, 15, 'achieved', '-'),
  (4, 'A', 'Safaraz Wiratama', 'iqra', 'Iqro 4', 'Iqro 4', 16, 22, 6, 15, 'not_achieved', 'Miftahul Arsyad Asri, S.H Tingkatkan lagi semangat membaca Iqra’-nya ya nak, rajin berlatih setiap hari agar bacaan semakin lancar dan cepat berkembang, insyaAllah akan segera naik ke tingkat berikutnya.'),
  (4, 'A', 'Satria Ramadhan Purba', 'iqra', 'Iqro 4', 'Iqro 4', 18, 24, 6, 15, 'not_achieved', 'Miftahul Arsyad Terus latihan di rumah juga ya, karena latihan yang (Iqra) Asri, S.H rutin sangat membantu meningkatkan persentase keberhasilan dalam membaca Al-Qur’an dengan baik dan lancar. Barakallahu fiik'),
  (4, 'A', 'Zain Malik ibrahim', 'iqra', 'Iqro 5', 'Iqro 6', 26, 13, 17, 15, 'achieved', '-'),
  (4, 'A', 'Zaki Khairil Azam Lubis', 'iqra', 'Iqro 5', 'Iqro 6', 21, 15, 24, 15, 'achieved', 'Miftahul Arsyad Asri, S.H Ananda sudah memiliki kemampuan membaca yang baik, Tetap semangat ya nak, sedikit lagi insyaAllah akan naik tingkat. Terus rajin belajar dan berlatih agar bacaan semakin lancar dan baik.'),
  (4, 'A', 'Zidane akido Yuan surbakti', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 1, 6, 5, 15, 'not_achieved', '-'),
  (4, 'B', 'Abdullah Farhan', 'iqra', 'Iqro 6', 'Iqro 6', 4, 14, 10, 15, 'not_achieved', '-'),
  (4, 'B', 'Abid Abqori', 'tahsin', 'Tahsin Lanjutan', 'Tahsin Lanjutan', 14, 21, 7, 15, 'not_achieved', '-');

SELECT 'part_3_rows_in_this_file' AS check_name, count(*) AS total FROM _restore_april_2026_reports;

SELECT 'part_3_students_not_matched' AS check_name, count(*) AS total
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
SELECT 'part_3_inserted_missing_rows' AS check_name, count(*) AS total FROM inserted;

COMMIT;
