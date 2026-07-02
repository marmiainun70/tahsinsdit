-- 1. Buat tabel role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  admin_access BOOLEAN DEFAULT true,
  teacher_access BOOLEAN DEFAULT false,
  parent_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Masukkan data default sesuai konfigurasi lama (adminOnly / teacherOnly)
INSERT INTO role_permissions (feature_key, feature_name, admin_access, teacher_access, parent_access) VALUES
('dashboard', 'Dashboard', true, true, true),
('kelola_siswa', 'Kelola Siswa', true, true, true),
('murid_binaan', 'Murid Binaan', true, true, false),
('penugasan_guru', 'Penugasan Guru', true, false, false),
('profil_kompetensi_guru', 'Profil Kompetensi Guru', true, true, false),
('laporan_bulanan', 'Absensi Bulanan', true, true, true),
('input_cepat', 'Input Laporan Bulanan', true, true, true),
('rekap_laporan', 'Rekap Laporan', true, true, true),
('monitoring', 'Monitoring', true, true, true),
('jadwal_ujian', 'Jadwal Ujian', true, true, true),
('pengumuman', 'Pengumuman', true, true, true),
('pengaturan_notifikasi', 'Pengaturan Notifikasi', true, true, true),
('pengaturan_lembaga', 'Pengaturan Lembaga', true, false, false),
('kelola_akun', 'Manajemen Akun All User', true, false, false)
ON CONFLICT (feature_key) DO NOTHING;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Semua pengguna yang login dapat membaca izin
CREATE POLICY "Allow read access to all authenticated users on role_permissions" 
ON role_permissions FOR SELECT 
TO authenticated 
USING (true);

-- 5. Hanya user dengan role 'admin' di tabel user_roles (atau profile yang sama dengan admin) yang dapat melakukan update
CREATE POLICY "Allow update access to admins on role_permissions" 
ON role_permissions FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
