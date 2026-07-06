// Tipe untuk Modul Kenaikan Tahun Ajaran

// ─── Enums (mirror database enums) ───────────────────────────

export type StudentStatus = 'aktif' | 'alumni' | 'keluar' | 'pindah';

export type TransitionStatus = 'draft' | 'waiting' | 'processing' | 'completed' | 'failed';

export type TeacherAction = 'pertahankan' | 'kosongkan' | 'baru';

// ─── Mapping Kelas ────────────────────────────────────────────

/** Representasi mapping satu kombinasi kelas/rombel dalam proses kenaikan */
export interface ClassMapping {
  from_kelas: number;       // kelas asal (contoh: 1)
  from_rombel: string;      // rombel asal (contoh: "A")
  to_kelas: number | null;  // null = siswa jadi Alumni
  to_rombel: string | null; // null = siswa jadi Alumni
  student_count: number;    // jumlah siswa di kombinasi ini
  is_last_grade: boolean;   // true = kelas terakhir → Alumni
}

// ─── Validation ───────────────────────────────────────────────

export interface ValidationError {
  code: string;
  message: string;
  is_fatal: boolean;      // jika true → tombol Proses dinonaktifkan
  affected_count?: number | null;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

// ─── Preview (Step 1 & 2 Wizard) ─────────────────────────────

/** Data yang dikembalikan RPC get_transition_preview */
export interface TransitionPreview {
  academic_year_id: string;
  academic_year_name: string;
  total_students: number;
  total_naik: number;
  total_alumni: number;
  max_kelas: number | null;
  class_breakdown: ClassMapping[];
  validation_errors: ValidationError[];
  validation_warnings: ValidationWarning[];
  is_valid: boolean;
}

// ─── Input Eksekusi ───────────────────────────────────────────

/** Input untuk RPC execute_academic_year_transition */
export interface TransitionExecuteInput {
  academic_year_id: string;
  class_mappings: ClassMapping[];
  teacher_action: TeacherAction;
  notes?: string;
}

/** Response dari RPC execute_academic_year_transition */
export interface TransitionExecuteResult {
  success: boolean;
  transition_id: string;
  total_students: number;
  total_naik: number;
  total_alumni: number;
  duration_ms: number;
}

// ─── Riwayat Transisi ────────────────────────────────────────

export interface AcademicYearTransition {
  id: string;
  academic_year_id: string;
  processed_by: string;
  processed_at: string;
  duration_ms: number | null;
  total_students: number;
  total_naik: number;
  total_alumni: number;
  total_gagal: number;
  status: TransitionStatus;
  class_mapping: ClassMapping[];
  teacher_action: TeacherAction;
  notes: string | null;
  created_at: string;
  // Joined fields dari RPC get_transition_history
  academic_year_name?: string;
  processed_by_name?: string;
}

// ─── Academic Year (extended) ─────────────────────────────────

/** Extend tipe academic_year dengan kolom transisi */
export interface AcademicYear {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'draft' | 'aktif' | 'selesai';
  transition_status: TransitionStatus;
  transition_processed_at: string | null;
  transition_processed_by: string | null;
  transition_notes: string | null;
  created_by: string | null;
  created_at: string;
}

// ─── Student (extended dengan lifecycle) ────────────────────

/** Extension fields lifecycle siswa yang ditambahkan di migration 1A */
export interface StudentLifecycle {
  status_siswa: StudentStatus;
  tahun_lulus: number | null;
  tanggal_keluar: string | null;
  alasan_keluar: string | null;
}

// ─── Dashboard Alert ─────────────────────────────────────────

/** Data yang dibutuhkan TransitionAlertCard di Dashboard */
export interface TransitionAlertData {
  academic_year: AcademicYear;
  total_students: number;
  days_until_start: number;  // negatif jika sudah lewat
  is_overdue: boolean;
}

// ─── Wizard State ────────────────────────────────────────────

export interface WizardState {
  currentStep: number;        // 1–5
  academicYearId: string;
  preview: TransitionPreview | null;
  classMappings: ClassMapping[];
  teacherAction: TeacherAction;
  notes: string;
  isProcessing: boolean;
  result: TransitionExecuteResult | null;
}

// ─── Step Labels ─────────────────────────────────────────────

export const WIZARD_STEPS = [
  { label: 'Preview', description: 'Ringkasan kenaikan' },
  { label: 'Validasi', description: 'Pemeriksaan sistem' },
  { label: 'Mapping Kelas', description: 'Atur perpindahan kelas' },
  { label: 'Penugasan Guru', description: 'Atur ulang guru' },
  { label: 'Konfirmasi', description: 'Tinjau & jalankan' },
] as const;

export type WizardStepIndex = 1 | 2 | 3 | 4 | 5;

// ─── Teacher Action Labels ────────────────────────────────────

export const TEACHER_ACTION_LABELS: Record<TeacherAction, string> = {
  kosongkan: 'Kosongkan penugasan guru (default)',
  pertahankan: 'Pertahankan penugasan guru',
  baru: 'Gunakan guru baru (assign manual nanti)',
};
