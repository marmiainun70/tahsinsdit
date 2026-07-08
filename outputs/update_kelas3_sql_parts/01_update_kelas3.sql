DO $$
DECLARE
    r RECORD;
    v_id UUID;
BEGIN
    FOR r IN (
        SELECT 'Abdul Hanif' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Abdurrahman Hanif Ash-Shiddiq' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Abdullah Abrar Taqiy Al Sudar' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Abrisam Abde Habibie' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Al Rashid Adnan Habibie' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Ahmad Rayyan Ritonga' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Alzhafran Raffasya Prastiyo' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Al Ahsan Arfan Firdaus' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Azzam Azzubair Manik' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Alfarizi Ramadhan' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Chairul Azidan Maulana' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Ar Raffi Malikal Mulki' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Hanan Abiyyu' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Azzam Khalif' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Jefry Abdillah Tarigan' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Fatir Zakaria' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhamad Zidan Azhari' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Firaz Nadeem Abdillah' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Al-Fatih Bangun' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Gio Zafran Siddin' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Ammar Syafiq' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Khalif Firzatullah Iswandi' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Falih Aqmar' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'M. Gibran El Syarif Fillah' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Irham Athallah' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'M. Khalif Alfarizqi' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'M.Yusuf Alfatih' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Muhammad Zaki Alsyahtra' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Mhd Al Faiz Harahap' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Nabil Fajar Assyauqi' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Alfatih Purba' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Nuqman Firdaus' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Khalid Afzam' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Rayga Prasetyo' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Muhammad Luqman Hakim' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Rizky Maulana Hartono' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Rafka Zahid Al Ikhwan' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Rohim Arfan Azhari' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Razzan Rizqi Kurniawan' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Uwais Al Qarni' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Tito Ravli Baskoro' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Wildan Abdurrahman' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Utsman Ibnu Affan' AS nama, 3 AS kelas, 'A' AS rombel
        UNION ALL SELECT 'Zafran Umar Maulana' AS nama, 3 AS kelas, 'B' AS rombel
        UNION ALL SELECT 'Amira Wulandari Br Bancin' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Adiba Kayla' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Arelya Shandra' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Adzkiya Salsabila Darma' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Assyifa Rubina' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Afiza Azzahra' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Beby Arisha Br Sitepu' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Aisyah Al-Shafiyyah' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Cut Aja Alisha' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Aisyah Br Pandia' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Daania Ardhani' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Aiza Ufairah Wibowo' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Elfira Arsyila Azzahra' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Alesha Alfara Pohan' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Elifia Sylvani Putri' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Asma Mujahidah' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Farosha Nazneen Qiyyama' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Athiyah Husna Panjaitan' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Kamilatul Afiyah' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Humaira Izzatunisa' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Khadijah Yunedi' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Nur Ainun F' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Khumaira Althafunnisa' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Nur Hanifah Hafsah Hafman' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Mafaza Khairunnisa' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Nusaibah Humairoh' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Miftahul Jannah' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Qalesya Nafiah Lubis' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Mikayla Almahyra Bancin' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Razania Almashyra Surbakti' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Nadya Carisssa Pane' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Rizqia Zivana Alea' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Naura Chairunnisa' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Rumaysa Hafsah Kirana Saleh' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Nazia Afrira' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Safira Najiha Aljannah' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Queenre Nabila Alfatih' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Shakila Ufairah' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Rahil Mafaza' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Shakilla Azzahra Munawir' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Risa Ramadhaniza' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Syafira Adreena' AS nama, 3 AS kelas, 'D' AS rombel
        UNION ALL SELECT 'Rizqia Hasna Malaika' AS nama, 3 AS kelas, 'C' AS rombel
        UNION ALL SELECT 'Vierra Qisya Yuan Surbakti' AS nama, 3 AS kelas, 'D' AS rombel
    ) LOOP
        SELECT id INTO v_id FROM students WHERE nama = r.nama LIMIT 1;
        IF v_id IS NOT NULL THEN
            UPDATE students SET kelas = r.kelas, rombel = r.rombel WHERE id = v_id;
        ELSE
            INSERT INTO students (nama, kelas, rombel, level, status_bacaan) VALUES (r.nama, r.kelas, r.rombel, 'Iqro 1', 'Lancar');
        END IF;
    END LOOP;
END $$;