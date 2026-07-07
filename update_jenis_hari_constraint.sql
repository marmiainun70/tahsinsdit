BEGIN;

-- 1. Hapus constraint lama agar kita bisa memasukkan nilai baru
ALTER TABLE public.academic_calendar_days 
  DROP CONSTRAINT IF EXISTS academic_calendar_days_jenis_check;

-- 2. Migrasi data lama ke kategori baru (agar data lama tetap rapi dan konsisten)
UPDATE public.academic_calendar_days 
  SET jenis = 'ujian' 
  WHERE jenis IN ('pts', 'pas');

UPDATE public.academic_calendar_days 
  SET jenis = 'kegiatan_sekolah' 
  WHERE jenis = 'kegiatan_khusus';

-- 3. Tambahkan constraint baru dengan semua opsi yang ada saat ini
ALTER TABLE public.academic_calendar_days 
  ADD CONSTRAINT academic_calendar_days_jenis_check 
  CHECK (jenis IN (
    'reguler', 
    'weekend', 
    'libur_nasional', 
    'cuti_bersama', 
    'libur_semester', 
    'libur_akhir_tahun', 
    'kegiatan_sekolah', 
    'ujian', 
    'lainnya'
  ));

COMMIT;
