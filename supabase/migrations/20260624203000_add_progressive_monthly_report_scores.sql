ALTER TABLE public.monthly_reports
  ADD COLUMN IF NOT EXISTS poin_kehadiran_kesiapan integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poin_kualitas_bacaan integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poin_perbaikan_bacaan integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poin_konsistensi integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pencapaian_target_bulan integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poin_pencapaian integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nilai_dasar integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nilai_akhir_progresif integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kategori_progres text NOT NULL DEFAULT 'Stagnan';

ALTER TABLE public.monthly_reports
  DROP CONSTRAINT IF EXISTS monthly_reports_poin_kehadiran_kesiapan_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_poin_kualitas_bacaan_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_poin_perbaikan_bacaan_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_poin_konsistensi_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_pencapaian_target_bulan_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_poin_pencapaian_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_nilai_dasar_check,
  DROP CONSTRAINT IF EXISTS monthly_reports_nilai_akhir_progresif_check,
  ADD CONSTRAINT monthly_reports_poin_kehadiran_kesiapan_check
    CHECK (poin_kehadiran_kesiapan IN (-1, 0, 1, 2)),
  ADD CONSTRAINT monthly_reports_poin_kualitas_bacaan_check
    CHECK (poin_kualitas_bacaan IN (-1, 0, 1, 2)),
  ADD CONSTRAINT monthly_reports_poin_perbaikan_bacaan_check
    CHECK (poin_perbaikan_bacaan IN (-1, 0, 1, 2)),
  ADD CONSTRAINT monthly_reports_poin_konsistensi_check
    CHECK (poin_konsistensi BETWEEN -6 AND 6),
  ADD CONSTRAINT monthly_reports_pencapaian_target_bulan_check
    CHECK (pencapaian_target_bulan BETWEEN 0 AND 5),
  ADD CONSTRAINT monthly_reports_poin_pencapaian_check
    CHECK (poin_pencapaian BETWEEN 0 AND 8),
  ADD CONSTRAINT monthly_reports_nilai_dasar_check
    CHECK (nilai_dasar BETWEEN 0 AND 100),
  ADD CONSTRAINT monthly_reports_nilai_akhir_progresif_check
    CHECK (nilai_akhir_progresif BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_period_progressive
  ON public.monthly_reports (student_id, year, month);
