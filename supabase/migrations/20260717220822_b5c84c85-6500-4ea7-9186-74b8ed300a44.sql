
-- Monthly reports: dominan diurut year DESC, month DESC dan difilter student_id
CREATE INDEX IF NOT EXISTS idx_monthly_reports_year_month_id
  ON public.monthly_reports (year DESC, month DESC, id);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_student_period
  ON public.monthly_reports (student_id, year DESC, month DESC);

-- Students: sering diurut kelas, nama dan difilter status
CREATE INDEX IF NOT EXISTS idx_students_kelas_nama
  ON public.students (kelas, nama);

CREATE INDEX IF NOT EXISTS idx_students_status_kelas
  ON public.students (status_siswa, kelas);

-- Attendance: diurut year DESC, month DESC dan difilter student_id
CREATE INDEX IF NOT EXISTS idx_attendance_year_month
  ON public.attendance (year DESC, month DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_student_period
  ON public.attendance (student_id, year DESC, month DESC);

-- Exam schedules: diurut tanggal, waktu_mulai
CREATE INDEX IF NOT EXISTS idx_exam_schedules_tanggal_waktu
  ON public.exam_schedules (tanggal, waktu_mulai);

-- Teacher_students: dipakai fetchApprovedManagedStudentIds di banyak hook
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher_status
  ON public.teacher_students (teacher_id, status);
