-- Script untuk membersihkan data Rekap Progres Bulanan dan Log Aktivitas
-- PERINGATAN: Menjalankan script ini akan menghapus permanen seluruh data di kedua tabel tersebut.

BEGIN;

-- Bersihkan tabel log aktivitas
TRUNCATE TABLE public.activity_logs CASCADE;

-- Bersihkan tabel laporan bulanan
TRUNCATE TABLE public.monthly_reports CASCADE;

COMMIT;
