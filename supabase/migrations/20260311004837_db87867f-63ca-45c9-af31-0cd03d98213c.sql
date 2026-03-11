
-- Enum untuk tipe ujian kenaikan
CREATE TYPE public.exam_schedule_type AS ENUM (
  'tahsin_dasar_ke_lanjutan',
  'tahsin_lanjutan_ke_tahfizh'
);

-- Tabel jadwal ujian kenaikan
CREATE TABLE public.exam_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_ujian  public.exam_schedule_type NOT NULL,
  tanggal      date NOT NULL,
  waktu_mulai  time NOT NULL,
  waktu_selesai time,
  lokasi       text NOT NULL DEFAULT '',
  keterangan   text NOT NULL DEFAULT '',
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa baca (notifikasi publik untuk semua guru)
CREATE POLICY "Exam schedules viewable by authenticated users"
  ON public.exam_schedules FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated user bisa insert
CREATE POLICY "Authenticated users can insert exam schedules"
  ON public.exam_schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated user bisa update
CREATE POLICY "Authenticated users can update exam schedules"
  ON public.exam_schedules FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated user bisa delete
CREATE POLICY "Authenticated users can delete exam schedules"
  ON public.exam_schedules FOR DELETE
  TO authenticated
  USING (true);

-- Trigger updated_at
CREATE TRIGGER exam_schedules_updated_at
  BEFORE UPDATE ON public.exam_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_schedules;
