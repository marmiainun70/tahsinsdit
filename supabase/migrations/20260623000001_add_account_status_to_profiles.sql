-- ============================================================
-- Migration: Tambah sistem status akun ke tabel profiles
-- Tujuan: Mencegah akun pending/rejected/inactive masuk aplikasi
-- Dampak: Hanya menambah kolom; semua data lama tidak berubah.
--         Akun lama otomatis mendapat status 'approved' via DEFAULT.
-- ============================================================

-- 1. Tambah kolom status dengan nilai default 'approved'
--    (akun lama aman: tidak perlu UPDATE manual)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

-- 2. Tambah CHECK constraint untuk status
--    IF NOT EXISTS tidak didukung untuk CHECK, pakai DO block agar idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'));
  END IF;
END$$;

-- 3. Tambah kolom username (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT NULL;

-- 4. Unique index untuk username — NULL tidak dihitung sebagai duplikat
--    (PostgreSQL: beberapa baris NULL diperbolehkan dalam unique index)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- 5. Tambah kolom whatsapp (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT NULL;

-- 6. Tambah kolom registered_at
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 7. Backfill registered_at dari created_at untuk akun lama
--    (agar registered_at akun lama bukan nilai default now() saat migration ini dijalankan)
UPDATE public.profiles
SET registered_at = created_at
WHERE registered_at > created_at;

-- ============================================================
-- RLS — Policy untuk admin dapat mengubah status dan role
-- ============================================================

-- Hapus policy UPDATE lama yang terlalu luas (user bisa update apapun)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Policy UPDATE: user biasa hanya dapat mengubah full_name dan kolom aman
-- Catatan: RLS PostgreSQL tidak bisa membatasi kolom secara langsung per-policy.
-- Solusi: buat dua policy UPDATE terpisah berdasarkan role.

-- Policy UPDATE untuk ADMIN: bisa mengubah semua kolom profil siapapun
CREATE POLICY "Admin dapat memperbarui semua profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Policy UPDATE untuk user biasa: hanya bisa mengubah profil sendiri
-- (status dan role dilindungi oleh trigger di bawah)
CREATE POLICY "Pengguna dapat memperbarui profil sendiri"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: Cegah user biasa mengubah status dan role sendiri
-- Pendekatan ini dipilih karena:
-- 1. RLS tidak bisa membatasi kolom secara per-kolom
-- 2. Trigger berjalan di database (server-side), tidak bisa di-bypass dari frontend
-- 3. Tidak memerlukan fungsi RPC tambahan hanya untuk proteksi kolom
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_status_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Izinkan admin mengubah apapun
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Cegah user biasa mengubah status atau role miliknya sendiri
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Anda tidak memiliki izin untuk mengubah status akun.';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Anda tidak memiliki izin untuk mengubah role akun.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_status_role_change ON public.profiles;
CREATE TRIGGER prevent_self_status_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_status_role_change();

-- ============================================================
-- Index untuk query berdasarkan status (digunakan di audit/manajemen akun)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON public.profiles (status);
