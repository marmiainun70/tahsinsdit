-- PERHATIAN: Perintah ini akan MENGHAPUS SEMUA DATA di tabel bank_soal.
-- Karena ada relasi ON DELETE CASCADE, data di tabel paket_asesmen_soal
-- dan tabel asesmen yang terkait dengan soal-soal ini juga akan ikut terhapus.

DELETE FROM public.bank_soal;

-- Alternatif jika Anda ingin mereset sequence ID (jika menggunakan tipe SERIAL, namun tabel ini menggunakan UUID jadi DELETE biasa sudah cukup):
-- TRUNCATE TABLE public.bank_soal CASCADE;
