-- Run this in your Supabase SQL Editor

ALTER TABLE public.institution_settings 
ADD COLUMN IF NOT EXISTS curriculum_targets JSONB,
ADD COLUMN IF NOT EXISTS effective_days_per_month INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS effective_days_per_semester INTEGER DEFAULT 80;

-- Set default JSON structure for curriculum targets for existing rows
UPDATE public.institution_settings
SET curriculum_targets = '{
  "target_per_kelas": {
    "kelas1": {"tahsin": "Menyelesaikan Iqra'' Jilid 1–3", "tahfizh": "An-Nas – Quraisy"},
    "kelas2": {"tahsin": "Menyelesaikan Iqra'' Jilid 4–6", "tahfizh": "Al-Fiil – Al-Qadr"},
    "kelas3": {"tahsin": "Mampu membaca Al-Qur''an (Juz 1)", "tahfizh": "Al-''Alaq – Al-Fajr"},
    "kelas4": {"tahsin": "Menyelesaikan bacaan hingga akhir Surah Al-Baqarah", "tahfizh": "Al-Ghasyiyah – Al-Insyiqaq"},
    "kelas5": {"tahsin": "Fokus Program Tahfizh", "tahfizh": "Al-Muthaffifin – An-Naba''"},
    "kelas6": {"tahsin": "Fokus Program Tahfizh", "tahfizh": "Muraja''ah 1 Juz"}
  },
  "target_harian": {
    "tahsin_dasar": "1–2 halaman",
    "tahsin_lanjutan": "1 halaman",
    "tahfizh": "Minimal 3 baris hafalan"
  },
  "target_pekanan": {
    "tahsin_dasar": "5 halaman",
    "tahsin_lanjutan": "5 halaman",
    "tahfizh": "1 halaman hafalan"
  },
  "target_bulanan": {
    "tahsin_dasar": "15 halaman",
    "tahsin_lanjutan": "15 halaman",
    "tahfizh": "3–5 halaman hafalan",
    "aman_dasar": "15–18 halaman/bulan",
    "aman_lanjutan": "15–18 halaman/bulan"
  },
  "target_semester": {
    "tahsin_dasar": "60 halaman (± 2–3 jilid)",
    "tahsin_lanjutan": "60 halaman (± 3 juz)",
    "tahfizh": "12–20 halaman hafalan"
  },
  "target_tahunan": {
    "tahsin_dasar": "120 halaman (target mencapai Iqra'' 5–6)",
    "tahsin_lanjutan": "120 halaman (± 6 juz bacaan)",
    "tahfizh": "20 halaman hafalan disertai pemutqinan"
  }
}'::jsonb
WHERE curriculum_targets IS NULL;
