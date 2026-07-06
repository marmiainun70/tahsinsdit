-- Migration 1D: Extend activity_type enum + semua RPC Kenaikan Tahun Ajaran
-- Catatan: ALTER TYPE ADD VALUE tidak boleh dalam transaksi dengan DDL lain,
--          tetapi di Supabase migrations berjalan per-file sehingga aman.

-- ============================================================
-- BAGIAN 1: Extend activity_type enum
-- ============================================================

ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'naik_kelas';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'lulus_alumni';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'keluar_sekolah';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'pindah_sekolah';

-- ============================================================
-- BAGIAN 2: RPC get_transition_preview
-- Kalkulasi preview kenaikan + validasi (tidak mengubah data)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_transition_preview(
  p_academic_year_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ay                RECORD;
  v_next_ay           RECORD;
  v_max_kelas         INTEGER;
  v_total_aktif       INTEGER;
  v_total_alumni      INTEGER;
  v_class_breakdown   JSONB := '[]'::JSONB;
  v_errors            JSONB := '[]'::JSONB;
  v_warnings          JSONB := '[]'::JSONB;
  v_is_valid          BOOLEAN := true;
  v_rec               RECORD;
BEGIN
  -- Hanya admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;

  -- Ambil data tahun ajaran yang akan diproses
  SELECT * INTO v_ay FROM public.academic_years WHERE id = p_academic_year_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tahun ajaran tidak ditemukan';
  END IF;

  -- Cek sudah completed
  IF v_ay.transition_status = 'completed' THEN
    v_errors := v_errors || jsonb_build_object(
      'code', 'ALREADY_COMPLETED',
      'message', 'Proses kenaikan untuk tahun ajaran ini sudah selesai dilakukan.',
      'is_fatal', true,
      'affected_count', null
    );
    v_is_valid := false;
  END IF;

  -- Ambil max kelas yang ada di sistem
  SELECT MAX(kelas) INTO v_max_kelas FROM public.students WHERE status_siswa = 'aktif';

  IF v_max_kelas IS NULL THEN
    v_errors := v_errors || jsonb_build_object(
      'code', 'NO_STUDENTS',
      'message', 'Tidak ada siswa aktif ditemukan di sistem.',
      'is_fatal', true,
      'affected_count', 0
    );
    v_is_valid := false;
  END IF;

  -- Cek siswa tanpa rombel
  DECLARE v_no_rombel INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_no_rombel
    FROM public.students
    WHERE status_siswa = 'aktif' AND (rombel IS NULL OR rombel = '');

    IF v_no_rombel > 0 THEN
      v_errors := v_errors || jsonb_build_object(
        'code', 'STUDENTS_WITHOUT_ROMBEL',
        'message', format('%s siswa tidak memiliki rombel.', v_no_rombel),
        'is_fatal', true,
        'affected_count', v_no_rombel
      );
      v_is_valid := false;
    END IF;
  END;

  -- Hitung total siswa aktif
  SELECT COUNT(*) INTO v_total_aktif FROM public.students WHERE status_siswa = 'aktif';

  -- Siswa yang akan jadi alumni (kelas terakhir)
  IF v_max_kelas IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_alumni
    FROM public.students
    WHERE status_siswa = 'aktif' AND kelas = v_max_kelas;
  ELSE
    v_total_alumni := 0;
  END IF;

  -- Bangun class_breakdown per kombinasi (kelas, rombel)
  IF v_max_kelas IS NOT NULL THEN
    FOR v_rec IN
      SELECT
        kelas,
        rombel,
        COUNT(*) AS jumlah
      FROM public.students
      WHERE status_siswa = 'aktif'
      GROUP BY kelas, rombel
      ORDER BY kelas, rombel
    LOOP
      v_class_breakdown := v_class_breakdown || jsonb_build_object(
        'from_kelas', v_rec.kelas,
        'from_rombel', v_rec.rombel,
        'to_kelas', CASE WHEN v_rec.kelas = v_max_kelas THEN NULL ELSE v_rec.kelas + 1 END,
        'to_rombel', CASE WHEN v_rec.kelas = v_max_kelas THEN NULL ELSE v_rec.rombel END,
        'student_count', v_rec.jumlah,
        'is_last_grade', (v_rec.kelas = v_max_kelas)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'academic_year_id', p_academic_year_id,
    'academic_year_name', v_ay.nama,
    'total_students', v_total_aktif,
    'total_naik', v_total_aktif - v_total_alumni,
    'total_alumni', v_total_alumni,
    'max_kelas', v_max_kelas,
    'class_breakdown', v_class_breakdown,
    'validation_errors', v_errors,
    'validation_warnings', v_warnings,
    'is_valid', v_is_valid
  );
END;
$$;

-- ============================================================
-- BAGIAN 3: RPC get_class_mapping_suggestion
-- Auto-suggest mapping kelas (tidak mengubah data)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_class_mapping_suggestion(
  p_academic_year_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_kelas   INTEGER;
  v_result      JSONB := '[]'::JSONB;
  v_rec         RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;

  SELECT MAX(kelas) INTO v_max_kelas FROM public.students WHERE status_siswa = 'aktif';

  FOR v_rec IN
    SELECT
      kelas,
      rombel,
      COUNT(*) AS student_count
    FROM public.students
    WHERE status_siswa = 'aktif'
    GROUP BY kelas, rombel
    ORDER BY kelas, rombel
  LOOP
    v_result := v_result || jsonb_build_object(
      'from_kelas', v_rec.kelas,
      'from_rombel', v_rec.rombel,
      'to_kelas', CASE WHEN v_rec.kelas = v_max_kelas THEN NULL ELSE v_rec.kelas + 1 END,
      'to_rombel', CASE WHEN v_rec.kelas = v_max_kelas THEN NULL ELSE v_rec.rombel END,
      'student_count', v_rec.student_count,
      'is_last_grade', (v_rec.kelas = v_max_kelas)
    );
  END LOOP;

  RETURN v_result;
END;
$$;

-- ============================================================
-- BAGIAN 4: RPC execute_academic_year_transition (RPC Utama)
-- Menjalankan proses kenaikan dalam SATU transaksi
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_academic_year_transition(
  p_academic_year_id UUID,
  p_class_mappings   JSONB,     -- array ClassMapping dari frontend
  p_teacher_action   TEXT,      -- 'pertahankan' | 'kosongkan' | 'baru'
  p_notes            TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time      TIMESTAMPTZ := clock_timestamp();
  v_transition_id   UUID;
  v_total_students  INTEGER := 0;
  v_total_naik      INTEGER := 0;
  v_total_alumni    INTEGER := 0;
  v_duration_ms     INTEGER;
  v_mapping         JSONB;
  v_from_kelas      INTEGER;
  v_from_rombel     TEXT;
  v_to_kelas        INTEGER;
  v_to_rombel       TEXT;
  v_is_last_grade   BOOLEAN;
  v_affected        INTEGER;
  v_max_kelas       INTEGER;
  v_caller_profile  RECORD;
BEGIN
  -- ── Langkah 0: Verifikasi hanya admin ──────────────────────
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menjalankan proses kenaikan tahun ajaran';
  END IF;

  -- Validasi parameter teacher_action
  IF p_teacher_action NOT IN ('pertahankan', 'kosongkan', 'baru') THEN
    RAISE EXCEPTION 'teacher_action tidak valid: %', p_teacher_action;
  END IF;

  -- Ambil profil caller untuk audit log
  SELECT * INTO v_caller_profile FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  -- ── Langkah 1: Validasi ulang (cegah race condition) ───────
  DECLARE v_ay_status TEXT; v_ay_transition TEXT;
  BEGIN
    SELECT status, transition_status::TEXT INTO v_ay_status, v_ay_transition
    FROM public.academic_years WHERE id = p_academic_year_id FOR UPDATE;

    IF v_ay_transition = 'completed' THEN
      RAISE EXCEPTION 'Proses kenaikan untuk tahun ajaran ini sudah selesai.';
    END IF;

    IF v_ay_transition = 'processing' THEN
      RAISE EXCEPTION 'Proses kenaikan sedang berjalan. Silakan tunggu.';
    END IF;
  END;

  -- Hitung max kelas saat ini
  SELECT MAX(kelas) INTO v_max_kelas FROM public.students WHERE status_siswa = 'aktif';
  IF v_max_kelas IS NULL THEN
    RAISE EXCEPTION 'Tidak ada siswa aktif untuk diproses.';
  END IF;

  -- Total siswa aktif
  SELECT COUNT(*) INTO v_total_students FROM public.students WHERE status_siswa = 'aktif';

  -- ── Langkah 2: Update status → processing ──────────────────
  UPDATE public.academic_years
    SET transition_status = 'processing'
    WHERE id = p_academic_year_id;

  -- ── Langkah 3: Insert record transisi (audit trail) ────────
  INSERT INTO public.academic_year_transitions (
    academic_year_id, processed_by, class_mapping,
    teacher_action, notes, status, total_students
  )
  VALUES (
    p_academic_year_id, auth.uid(), p_class_mappings,
    p_teacher_action, p_notes, 'processing', v_total_students
  )
  RETURNING id INTO v_transition_id;

  -- ── Langkah 4 & 5: Proses setiap mapping kelas ─────────────
  FOR v_mapping IN SELECT * FROM jsonb_array_elements(p_class_mappings)
  LOOP
    v_from_kelas    := (v_mapping->>'from_kelas')::INTEGER;
    v_from_rombel   := v_mapping->>'from_rombel';
    v_is_last_grade := (v_mapping->>'is_last_grade')::BOOLEAN;
    v_to_kelas      := CASE WHEN v_mapping->>'to_kelas' IS NULL THEN NULL
                            ELSE (v_mapping->>'to_kelas')::INTEGER END;
    v_to_rombel     := v_mapping->>'to_rombel';

    IF v_is_last_grade THEN
      -- Jadikan Alumni
      UPDATE public.students
        SET
          status_siswa = 'alumni',
          tahun_lulus  = EXTRACT(YEAR FROM now())::INTEGER,
          updated_at   = now()
        WHERE kelas = v_from_kelas
          AND rombel = v_from_rombel
          AND status_siswa = 'aktif';

      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_alumni := v_total_alumni + v_affected;

      -- Activity log untuk alumni (batch insert)
      INSERT INTO public.activity_logs (student_id, activity_type, judul, metadata, created_by)
        SELECT
          id,
          'lulus_alumni',
          format('Lulus sebagai Alumni Tahun %s', EXTRACT(YEAR FROM now())::INTEGER),
          jsonb_build_object(
            'academic_year_id', p_academic_year_id,
            'transition_id', v_transition_id,
            'kelas_terakhir', v_from_kelas,
            'rombel_terakhir', v_from_rombel,
            'tahun_lulus', EXTRACT(YEAR FROM now())::INTEGER
          ),
          auth.uid()
        FROM public.students
        WHERE kelas = v_from_kelas
          AND rombel = v_from_rombel
          AND status_siswa = 'alumni'
          AND tahun_lulus = EXTRACT(YEAR FROM now())::INTEGER;

    ELSE
      -- Naik kelas
      IF v_to_kelas IS NULL OR v_to_rombel IS NULL THEN
        RAISE EXCEPTION 'Mapping kelas tidak valid: from=%s%s to=%s%s',
          v_from_kelas, v_from_rombel, v_to_kelas, v_to_rombel;
      END IF;

      UPDATE public.students
        SET
          kelas      = v_to_kelas,
          rombel     = v_to_rombel,
          updated_at = now()
        WHERE kelas = v_from_kelas
          AND rombel = v_from_rombel
          AND status_siswa = 'aktif';

      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_naik := v_total_naik + v_affected;

      -- Activity log untuk naik kelas
      INSERT INTO public.activity_logs (student_id, activity_type, judul, metadata, created_by)
        SELECT
          id,
          'naik_kelas',
          format('Naik ke Kelas %s%s', v_to_kelas, v_to_rombel),
          jsonb_build_object(
            'academic_year_id', p_academic_year_id,
            'transition_id', v_transition_id,
            'dari_kelas', v_from_kelas,
            'dari_rombel', v_from_rombel,
            'ke_kelas', v_to_kelas,
            'ke_rombel', v_to_rombel
          ),
          auth.uid()
        FROM public.students
        WHERE kelas = v_to_kelas
          AND rombel = v_to_rombel
          AND status_siswa = 'aktif';
    END IF;
  END LOOP;

  -- ── Langkah 6: Handle teacher assignments ──────────────────
  IF p_teacher_action = 'kosongkan' THEN
    -- Hapus relasi guru-siswa untuk semua siswa yang baru naik/lulus
    DELETE FROM public.teacher_students
      WHERE student_id IN (
        SELECT id FROM public.students
        WHERE status_siswa IN ('aktif', 'alumni')
      );

    -- Hapus juga relasi guru-kelas (akan di-assign ulang oleh admin)
    DELETE FROM public.teacher_classes;
  END IF;
  -- 'pertahankan' → tidak ada perubahan
  -- 'baru' → admin assign manual, tidak ada perubahan di sini

  -- ── Langkah 7: Update record transisi dengan hasil ─────────
  v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000;

  UPDATE public.academic_year_transitions
    SET
      status         = 'completed',
      duration_ms    = v_duration_ms,
      total_students = v_total_students,
      total_naik     = v_total_naik,
      total_alumni   = v_total_alumni,
      total_gagal    = 0
    WHERE id = v_transition_id;

  -- ── Langkah 8: Update academic_years ───────────────────────
  UPDATE public.academic_years
    SET
      transition_status        = 'completed',
      transition_processed_at  = now(),
      transition_processed_by  = auth.uid(),
      transition_notes         = p_notes
    WHERE id = p_academic_year_id;

  -- ── Langkah 9: Audit log ────────────────────────────────────
  INSERT INTO public.config_audit_log (
    modul, entity_id, field_changed, old_value, new_value,
    changed_by, changed_by_role, alasan
  )
  VALUES (
    'kenaikan_tahun_ajaran',
    p_academic_year_id::TEXT,
    'transition_status',
    'waiting',
    'completed',
    auth.uid(),
    COALESCE(v_caller_profile.role, 'koordinator'),
    format('Proses kenaikan: %s siswa naik, %s alumni. Durasi: %sms',
           v_total_naik, v_total_alumni, v_duration_ms)
  );

  -- ── Commit (otomatis karena tidak ada error) ────────────────
  RETURN jsonb_build_object(
    'success',          true,
    'transition_id',    v_transition_id,
    'total_students',   v_total_students,
    'total_naik',       v_total_naik,
    'total_alumni',     v_total_alumni,
    'duration_ms',      v_duration_ms
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback otomatis terjadi, update status failed
  -- Catatan: UPDATE di bawah ini TIDAK akan tersimpan karena transaksi sudah di-rollback.
  -- Untuk mencatat kegagalan, kita perlu menggunakan transaksi autonomous (tidak tersedia
  -- di standard PostgreSQL). Solusi: status failed akan di-set oleh frontend setelah
  -- menerima error response, atau via RPC terpisah.
  RAISE;
END;
$$;

-- ============================================================
-- BAGIAN 5: RPC get_transition_history
-- Mengambil riwayat transisi untuk halaman audit
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_transition_history(
  p_limit  INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;

  SELECT jsonb_agg(row_to_json(t.*))
  INTO v_result
  FROM (
    SELECT
      ayt.id,
      ayt.academic_year_id,
      ayt.processed_at,
      ayt.duration_ms,
      ayt.total_students,
      ayt.total_naik,
      ayt.total_alumni,
      ayt.total_gagal,
      ayt.status,
      ayt.teacher_action,
      ayt.notes,
      ayt.created_at,
      ay.nama  AS academic_year_name,
      p.full_name AS processed_by_name
    FROM public.academic_year_transitions ayt
    LEFT JOIN public.academic_years ay ON ay.id = ayt.academic_year_id
    LEFT JOIN public.profiles p ON p.user_id = ayt.processed_by
    ORDER BY ayt.processed_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ============================================================
-- BAGIAN 6: role_permissions entry baru
-- ============================================================

INSERT INTO public.role_permissions (feature_key, feature_name, teacher_access, parent_access)
VALUES ('kenaikan_tahun_ajaran', 'Kenaikan Tahun Ajaran', false, false)
ON CONFLICT (feature_key) DO NOTHING;
