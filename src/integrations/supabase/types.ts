export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_calendar_days: {
        Row: {
          created_at: string
          id: string
          is_efektif_pembelajaran: boolean
          is_override: boolean
          jenis: string
          keterangan: string | null
          last_synced_at: string | null
          source: string
          status: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_efektif_pembelajaran?: boolean
          is_override?: boolean
          jenis: string
          keterangan?: string | null
          last_synced_at?: string | null
          source: string
          status: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_efektif_pembelajaran?: boolean
          is_override?: boolean
          jenis?: string
          keterangan?: string | null
          last_synced_at?: string | null
          source?: string
          status?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      academic_calendar_settings: {
        Row: {
          cutover_date: string | null
          id: number
          last_api_sync_at: string | null
          updated_at: string
        }
        Insert: {
          cutover_date?: string | null
          id?: number
          last_api_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          cutover_date?: string | null
          id?: number
          last_api_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      academic_calendar_sync_history: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          jumlah_dilewati: number
          jumlah_ditambah: number
          jumlah_diupdate: number
          started_at: string
          status: string
          tahun_yang_disync: string
          trigger_type: string
          triggered_by: string | null
          triggered_by_role: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          jumlah_dilewati?: number
          jumlah_ditambah?: number
          jumlah_diupdate?: number
          started_at?: string
          status: string
          tahun_yang_disync: string
          trigger_type: string
          triggered_by?: string | null
          triggered_by_role: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          jumlah_dilewati?: number
          jumlah_ditambah?: number
          jumlah_diupdate?: number
          started_at?: string
          status?: string
          tahun_yang_disync?: string
          trigger_type?: string
          triggered_by?: string | null
          triggered_by_role?: string
        }
        Relationships: []
      }
      academic_year_transitions: {
        Row: {
          academic_year_id: string
          class_mapping: Json
          created_at: string
          duration_ms: number | null
          id: string
          notes: string | null
          processed_at: string
          processed_by: string
          status: Database["public"]["Enums"]["transition_status"]
          teacher_action: string
          total_alumni: number
          total_gagal: number
          total_naik: number
          total_students: number
        }
        Insert: {
          academic_year_id: string
          class_mapping?: Json
          created_at?: string
          duration_ms?: number | null
          id?: string
          notes?: string | null
          processed_at?: string
          processed_by: string
          status?: Database["public"]["Enums"]["transition_status"]
          teacher_action?: string
          total_alumni?: number
          total_gagal?: number
          total_naik?: number
          total_students?: number
        }
        Update: {
          academic_year_id?: string
          class_mapping?: Json
          created_at?: string
          duration_ms?: number | null
          id?: string
          notes?: string | null
          processed_at?: string
          processed_by?: string
          status?: Database["public"]["Enums"]["transition_status"]
          teacher_action?: string
          total_alumni?: number
          total_gagal?: number
          total_naik?: number
          total_students?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_year_transitions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nama: string
          status: string
          tanggal_mulai: string
          tanggal_selesai: string
          transition_notes: string | null
          transition_processed_at: string | null
          transition_processed_by: string | null
          transition_status: Database["public"]["Enums"]["transition_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nama: string
          status?: string
          tanggal_mulai: string
          tanggal_selesai: string
          transition_notes?: string | null
          transition_processed_at?: string | null
          transition_processed_by?: string | null
          transition_status?: Database["public"]["Enums"]["transition_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nama?: string
          status?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          transition_notes?: string | null
          transition_processed_at?: string | null
          transition_processed_by?: string | null
          transition_status?: Database["public"]["Enums"]["transition_status"]
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          judul: string
          metadata: Json | null
          student_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          judul: string
          metadata?: Json | null
          student_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          judul?: string
          metadata?: Json | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      asesmen_jawaban: {
        Row: {
          answered_at: string
          benar: boolean | null
          id: string
          jawaban: string | null
          session_id: string
          skor: number | null
          soal_id: string
        }
        Insert: {
          answered_at?: string
          benar?: boolean | null
          id?: string
          jawaban?: string | null
          session_id: string
          skor?: number | null
          soal_id: string
        }
        Update: {
          answered_at?: string
          benar?: boolean | null
          id?: string
          jawaban?: string | null
          session_id?: string
          skor?: number | null
          soal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_jawaban_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "asesmen_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_jawaban_soal_id_fkey"
            columns: ["soal_id"]
            isOneToOne: false
            referencedRelation: "bank_soal"
            referencedColumns: ["id"]
          },
        ]
      }
      asesmen_session: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          jumlah_benar: number | null
          jumlah_salah: number | null
          last_question: number | null
          nilai: number | null
          peserta_asesmen_id: string
          remaining_time: number | null
          started_at: string
          status: string
          total_soal: number | null
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          jumlah_benar?: number | null
          jumlah_salah?: number | null
          last_question?: number | null
          nilai?: number | null
          peserta_asesmen_id: string
          remaining_time?: number | null
          started_at?: string
          status?: string
          total_soal?: number | null
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          jumlah_benar?: number | null
          jumlah_salah?: number | null
          last_question?: number | null
          nilai?: number | null
          peserta_asesmen_id?: string
          remaining_time?: number | null
          started_at?: string
          status?: string
          total_soal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_session_peserta_asesmen_id_fkey"
            columns: ["peserta_asesmen_id"]
            isOneToOne: true
            referencedRelation: "peserta_asesmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_session_peserta_asesmen_id_fkey"
            columns: ["peserta_asesmen_id"]
            isOneToOne: true
            referencedRelation: "vw_peserta_asesmen_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          absent: number
          created_at: string
          created_by: string | null
          id: string
          month: number
          permission: number
          present: number
          sick: number
          student_id: string
          year: number
        }
        Insert: {
          absent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          permission?: number
          present?: number
          sick?: number
          student_id: string
          year: number
        }
        Update: {
          absent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          permission?: number
          present?: number
          sick?: number
          student_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_period_settings: {
        Row: {
          created_at: string
          created_by: string | null
          effective_days: number
          id: string
          is_locked: boolean
          kelas: number
          locked_at: string | null
          locked_by: string | null
          month: number
          rombel: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_days?: number
          id?: string
          is_locked?: boolean
          kelas: number
          locked_at?: string | null
          locked_by?: string | null
          month: number
          rombel: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_days?: number
          id?: string
          is_locked?: boolean
          kelas?: number
          locked_at?: string | null
          locked_by?: string | null
          month?: number
          rombel?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      bank_soal: {
        Row: {
          aktif: boolean
          bobot: number
          created_at: string
          id: string
          indikator_kompetensi: string
          jawaban_benar: string
          kategori: string
          level_kognitif: string
          opsi_a: string | null
          opsi_b: string | null
          opsi_c: string | null
          opsi_d: string | null
          pembahasan: string | null
          soal: string
          sub_aspek: string
          tingkat_kesulitan: string
          tipe_soal: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          bobot?: number
          created_at?: string
          id?: string
          indikator_kompetensi: string
          jawaban_benar: string
          kategori: string
          level_kognitif: string
          opsi_a?: string | null
          opsi_b?: string | null
          opsi_c?: string | null
          opsi_d?: string | null
          pembahasan?: string | null
          soal: string
          sub_aspek: string
          tingkat_kesulitan: string
          tipe_soal: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          bobot?: number
          created_at?: string
          id?: string
          indikator_kompetensi?: string
          jawaban_benar?: string
          kategori?: string
          level_kognitif?: string
          opsi_a?: string | null
          opsi_b?: string | null
          opsi_c?: string | null
          opsi_d?: string | null
          pembahasan?: string | null
          soal?: string
          sub_aspek?: string
          tingkat_kesulitan?: string
          tipe_soal?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_audit_log: {
        Row: {
          alasan: string | null
          batch_id: string | null
          changed_at: string
          changed_by: string | null
          changed_by_role: string
          entity_id: string
          field_changed: string
          id: string
          modul: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          alasan?: string | null
          batch_id?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_role: string
          entity_id: string
          field_changed: string
          id?: string
          modul: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          alasan?: string | null
          batch_id?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_role?: string
          entity_id?: string
          field_changed?: string
          id?: string
          modul?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      evaluasi_awal_semester: {
        Row: {
          academic_year_id: string
          created_at: string
          evaluator_id: string
          final_predicate: string | null
          final_score: number
          id: string
          selected_level_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          evaluator_id: string
          final_predicate?: string | null
          final_score: number
          id?: string
          selected_level_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          evaluator_id?: string
          final_predicate?: string | null
          final_score?: number
          id?: string
          selected_level_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_awal_semester_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluasi_awal_semester_selected_level_id_fkey"
            columns: ["selected_level_id"]
            isOneToOne: false
            referencedRelation: "master_level_kemampuan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluasi_awal_semester_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_kelancaran: {
        Row: {
          evaluasi_id: string
          id: string
          score: number
        }
        Insert: {
          evaluasi_id: string
          id?: string
          score: number
        }
        Update: {
          evaluasi_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_kelancaran_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_kesalahan_bacaan: {
        Row: {
          evaluasi_id: string
          id: string
          lahn_jali_count: number
          lahn_khofi_count: number
        }
        Insert: {
          evaluasi_id: string
          id?: string
          lahn_jali_count?: number
          lahn_khofi_count?: number
        }
        Update: {
          evaluasi_id?: string
          id?: string
          lahn_jali_count?: number
          lahn_khofi_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_kesalahan_bacaan_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_lahn: {
        Row: {
          catatan: string | null
          evaluasi_id: string
          id: string
          jenis_kesalahan: string
          jenis_lahn: string
          jumlah: number
        }
        Insert: {
          catatan?: string | null
          evaluasi_id: string
          id?: string
          jenis_kesalahan: string
          jenis_lahn: string
          jumlah?: number
        }
        Update: {
          catatan?: string | null
          evaluasi_id?: string
          id?: string
          jenis_kesalahan?: string
          jenis_lahn?: string
          jumlah?: number
        }
        Relationships: []
      }
      evaluasi_makharij: {
        Row: {
          checklist: Json
          evaluasi_id: string
          id: string
        }
        Insert: {
          checklist?: Json
          evaluasi_id: string
          id?: string
        }
        Update: {
          checklist?: Json
          evaluasi_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_makharij_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_profil_awal: {
        Row: {
          evaluasi_id: string
          id: string
          jawaban: Json
        }
        Insert: {
          evaluasi_id: string
          id?: string
          jawaban?: Json
        }
        Update: {
          evaluasi_id?: string
          id?: string
          jawaban?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_profil_awal_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_rekomendasi: {
        Row: {
          evaluasi_id: string
          fokus_pembinaan: string[]
          id: string
          manual_halaman: string | null
          manual_iqra: string | null
          recommended_level_id: string | null
        }
        Insert: {
          evaluasi_id: string
          fokus_pembinaan?: string[]
          id?: string
          manual_halaman?: string | null
          manual_iqra?: string | null
          recommended_level_id?: string | null
        }
        Update: {
          evaluasi_id?: string
          fokus_pembinaan?: string[]
          id?: string
          manual_halaman?: string | null
          manual_iqra?: string | null
          recommended_level_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_rekomendasi_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluasi_rekomendasi_recommended_level_id_fkey"
            columns: ["recommended_level_id"]
            isOneToOne: false
            referencedRelation: "master_level_kemampuan"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_sambung_ayat: {
        Row: {
          catatan: string | null
          evaluasi_id: string
          id: string
          ketepatan: string
          keyakinan: string
          respon: string
        }
        Insert: {
          catatan?: string | null
          evaluasi_id: string
          id?: string
          ketepatan: string
          keyakinan: string
          respon: string
        }
        Update: {
          catatan?: string | null
          evaluasi_id?: string
          id?: string
          ketepatan?: string
          keyakinan?: string
          respon?: string
        }
        Relationships: []
      }
      evaluasi_tahfizh: {
        Row: {
          evaluasi_id: string
          id: string
          salah_sambung_ayat_count: number
        }
        Insert: {
          evaluasi_id: string
          id?: string
          salah_sambung_ayat_count?: number
        }
        Update: {
          evaluasi_id?: string
          id?: string
          salah_sambung_ayat_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_tahfizh_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_tajwid: {
        Row: {
          checklist: Json
          evaluasi_id: string
          id: string
        }
        Insert: {
          checklist?: Json
          evaluasi_id: string
          id?: string
        }
        Update: {
          checklist?: Json
          evaluasi_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_tajwid_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_waqaf: {
        Row: {
          error_count: number
          evaluasi_id: string
          id: string
        }
        Insert: {
          error_count?: number
          evaluasi_id: string
          id?: string
        }
        Update: {
          error_count?: number
          evaluasi_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluasi_waqaf_evaluasi_id_fkey"
            columns: ["evaluasi_id"]
            isOneToOne: true
            referencedRelation: "evaluasi_awal_semester"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluasi_waqaf_ibtida: {
        Row: {
          catatan: string | null
          evaluasi_id: string
          id: string
          jumlah_kesalahan: number
          kategori: string
        }
        Insert: {
          catatan?: string | null
          evaluasi_id: string
          id?: string
          jumlah_kesalahan?: number
          kategori: string
        }
        Update: {
          catatan?: string | null
          evaluasi_id?: string
          id?: string
          jumlah_kesalahan?: number
          kategori?: string
        }
        Relationships: []
      }
      exam_participants: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          schedule_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          schedule_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          schedule_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_participants_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_records: {
        Row: {
          adab: number
          catatan: string | null
          created_at: string
          created_by: string | null
          dibantu_guru: number
          hasil: Database["public"]["Enums"]["exam_result"]
          id: string
          kelancaran: number
          kesalahan_makhraj: number
          kesalahan_tajwid: number
          level_diuji: Database["public"]["Enums"]["reading_level"]
          makhraj: number
          student_id: string
          tajwid: number
          tanggal: string
          terhenti: number
        }
        Insert: {
          adab: number
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          dibantu_guru?: number
          hasil: Database["public"]["Enums"]["exam_result"]
          id?: string
          kelancaran: number
          kesalahan_makhraj?: number
          kesalahan_tajwid?: number
          level_diuji: Database["public"]["Enums"]["reading_level"]
          makhraj: number
          student_id: string
          tajwid: number
          tanggal?: string
          terhenti?: number
        }
        Update: {
          adab?: number
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          dibantu_guru?: number
          hasil?: Database["public"]["Enums"]["exam_result"]
          id?: string
          kelancaran?: number
          kesalahan_makhraj?: number
          kesalahan_tajwid?: number
          level_diuji?: Database["public"]["Enums"]["reading_level"]
          makhraj?: number
          student_id?: string
          tajwid?: number
          tanggal?: string
          terhenti?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          jenis_ujian: Database["public"]["Enums"]["exam_schedule_type"]
          keterangan: string
          lokasi: string
          nama_siswa: string
          tanggal: string
          updated_at: string
          waktu_mulai: string
          waktu_selesai: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_ujian: Database["public"]["Enums"]["exam_schedule_type"]
          keterangan?: string
          lokasi?: string
          nama_siswa?: string
          tanggal: string
          updated_at?: string
          waktu_mulai: string
          waktu_selesai?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          jenis_ujian?: Database["public"]["Enums"]["exam_schedule_type"]
          keterangan?: string
          lokasi?: string
          nama_siswa?: string
          tanggal?: string
          updated_at?: string
          waktu_mulai?: string
          waktu_selesai?: string | null
        }
        Relationships: []
      }
      institution_settings: {
        Row: {
          alamat: string
          id: string
          kepsek_nama: string
          kepsek_ttd_url: string | null
          koordinator_nama: string
          koordinator_ttd_url: string | null
          logo_url: string | null
          nama_lembaga: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alamat?: string
          id?: string
          kepsek_nama?: string
          kepsek_ttd_url?: string | null
          koordinator_nama?: string
          koordinator_ttd_url?: string | null
          logo_url?: string | null
          nama_lembaga?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alamat?: string
          id?: string
          kepsek_nama?: string
          kepsek_ttd_url?: string | null
          koordinator_nama?: string
          koordinator_ttd_url?: string | null
          logo_url?: string | null
          nama_lembaga?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_level_kemampuan: {
        Row: {
          created_at: string
          id: string
          kode_level: string
          nama_level: string
          poin_ibp_dasar: number
          program_nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode_level: string
          nama_level: string
          poin_ibp_dasar?: number
          program_nama: string
        }
        Update: {
          created_at?: string
          id?: string
          kode_level?: string
          nama_level?: string
          poin_ibp_dasar?: number
          program_nama?: string
        }
        Relationships: []
      }
      monitoring_settings: {
        Row: {
          id: number
          ipp_trend_threshold: number
          updated_at: string
        }
        Insert: {
          id?: number
          ipp_trend_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: number
          ipp_trend_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          achievement_status: string
          created_at: string
          created_by: string | null
          end_iqra_level: string | null
          end_page: number
          id: string
          iqra_level: string | null
          kategori_progres: string
          kelas_snapshot: number | null
          level_snapshot: string | null
          month: number
          nilai_akhir_progresif: number
          nilai_dasar: number
          notes: string | null
          pages_read: number
          pencapaian_target_bulan: number
          poin_kehadiran_kesiapan: number
          poin_konsistensi: number
          poin_kualitas_bacaan: number
          poin_pencapaian: number
          poin_perbaikan_bacaan: number
          program_type: string
          rombel_snapshot: string | null
          start_page: number
          student_id: string
          student_name_snapshot: string | null
          target_pages: number
          teacher_id: string | null
          teacher_id_snapshot: string | null
          teacher_name: string | null
          teacher_name_snapshot: string | null
          year: number
        }
        Insert: {
          achievement_status?: string
          created_at?: string
          created_by?: string | null
          end_iqra_level?: string | null
          end_page?: number
          id?: string
          iqra_level?: string | null
          kategori_progres?: string
          kelas_snapshot?: number | null
          level_snapshot?: string | null
          month: number
          nilai_akhir_progresif?: number
          nilai_dasar?: number
          notes?: string | null
          pages_read?: number
          pencapaian_target_bulan?: number
          poin_kehadiran_kesiapan?: number
          poin_konsistensi?: number
          poin_kualitas_bacaan?: number
          poin_pencapaian?: number
          poin_perbaikan_bacaan?: number
          program_type?: string
          rombel_snapshot?: string | null
          start_page?: number
          student_id: string
          student_name_snapshot?: string | null
          target_pages?: number
          teacher_id?: string | null
          teacher_id_snapshot?: string | null
          teacher_name?: string | null
          teacher_name_snapshot?: string | null
          year: number
        }
        Update: {
          achievement_status?: string
          created_at?: string
          created_by?: string | null
          end_iqra_level?: string | null
          end_page?: number
          id?: string
          iqra_level?: string | null
          kategori_progres?: string
          kelas_snapshot?: number | null
          level_snapshot?: string | null
          month?: number
          nilai_akhir_progresif?: number
          nilai_dasar?: number
          notes?: string | null
          pages_read?: number
          pencapaian_target_bulan?: number
          poin_kehadiran_kesiapan?: number
          poin_konsistensi?: number
          poin_kualitas_bacaan?: number
          poin_pencapaian?: number
          poin_perbaikan_bacaan?: number
          program_type?: string
          rombel_snapshot?: string | null
          start_page?: number
          student_id?: string
          student_name_snapshot?: string | null
          target_pages?: number
          teacher_id?: string | null
          teacher_id_snapshot?: string | null
          teacher_name?: string | null
          teacher_name_snapshot?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          created_at: string
          created_by: string | null
          effective_days: number
          id: string
          month: number
          notes: string | null
          program_type: string
          target_pages: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_days?: number
          id?: string
          month: number
          notes?: string | null
          program_type: string
          target_pages?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_days?: number
          id?: string
          month?: number
          notes?: string | null
          program_type?: string
          target_pages?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcement: boolean
          attention_alert: boolean
          exam_reminder: boolean
          exam_result: boolean
          monthly_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement?: boolean
          attention_alert?: boolean
          exam_reminder?: boolean
          exam_result?: boolean
          monthly_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement?: boolean
          attention_alert?: boolean
          exam_reminder?: boolean
          exam_result?: boolean
          monthly_report?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paket_asesmen: {
        Row: {
          acak_opsi: boolean | null
          acak_soal: boolean | null
          created_at: string
          durasi_menit: number
          id: string
          jenis_asesmen: string
          jumlah_soal: number
          kategori_kompetensi: string[] | null
          kode_paket: string
          nama_paket: string
          nilai_minimum: number
          periode: string
          status: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
        }
        Insert: {
          acak_opsi?: boolean | null
          acak_soal?: boolean | null
          created_at?: string
          durasi_menit?: number
          id?: string
          jenis_asesmen: string
          jumlah_soal?: number
          kategori_kompetensi?: string[] | null
          kode_paket: string
          nama_paket: string
          nilai_minimum?: number
          periode: string
          status?: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at?: string
        }
        Update: {
          acak_opsi?: boolean | null
          acak_soal?: boolean | null
          created_at?: string
          durasi_menit?: number
          id?: string
          jenis_asesmen?: string
          jumlah_soal?: number
          kategori_kompetensi?: string[] | null
          kode_paket?: string
          nama_paket?: string
          nilai_minimum?: number
          periode?: string
          status?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          updated_at?: string
        }
        Relationships: []
      }
      paket_asesmen_soal: {
        Row: {
          created_at: string
          id: string
          paket_id: string
          soal_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paket_id: string
          soal_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paket_id?: string
          soal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paket_asesmen_soal_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_asesmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paket_asesmen_soal_soal_id_fkey"
            columns: ["soal_id"]
            isOneToOne: false
            referencedRelation: "bank_soal"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          created_at: string
          id: string
          phone: string | null
          student_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone?: string | null
          student_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string | null
          student_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      peserta_asesmen: {
        Row: {
          catatan: string | null
          created_at: string
          guru_id: string
          id: string
          nilai_akhir: number | null
          paket_id: string
          status: string
          updated_at: string
          waktu_mulai: string | null
          waktu_selesai: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          guru_id: string
          id?: string
          nilai_akhir?: number | null
          paket_id: string
          status?: string
          updated_at?: string
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string
          guru_id?: string
          id?: string
          nilai_akhir?: number | null
          paket_id?: string
          status?: string
          updated_at?: string
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peserta_asesmen_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peserta_asesmen_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_asesmen"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_read_by_admin: boolean | null
          registered_at: string
          role: string
          status: string
          updated_at: string
          user_id: string
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          is_read_by_admin?: boolean | null
          registered_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_read_by_admin?: boolean | null
          registered_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      progress_entries: {
        Row: {
          buku: string
          catatan: string | null
          created_at: string
          created_by: string | null
          halaman: number
          id: string
          kelancaran: number
          makhraj: number
          student_id: string
          tajwid: number
          tanggal: string
        }
        Insert: {
          buku: string
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          halaman: number
          id?: string
          kelancaran: number
          makhraj: number
          student_id: string
          tajwid: number
          tanggal?: string
        }
        Update: {
          buku?: string
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          halaman?: number
          id?: string
          kelancaran?: number
          makhraj?: number
          student_id?: string
          tajwid?: number
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      riwayat_kinerja_guru: {
        Row: {
          active_students: number
          bulan: string
          dibuat_pada: string
          guru_id: string
          ibp_raw: number
          ibp_status: string
          id: string
          ipp_score: number
          ipp_status: string
          sep_status: string
          sesi: string
          versi_formula: string
        }
        Insert: {
          active_students?: number
          bulan: string
          dibuat_pada?: string
          guru_id: string
          ibp_raw: number
          ibp_status: string
          id?: string
          ipp_score: number
          ipp_status: string
          sep_status: string
          sesi: string
          versi_formula?: string
        }
        Update: {
          active_students?: number
          bulan?: string
          dibuat_pada?: string
          guru_id?: string
          ibp_raw?: number
          ibp_status?: string
          id?: string
          ipp_score?: number
          ipp_status?: string
          sep_status?: string
          sesi?: string
          versi_formula?: string
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_kinerja_guru_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          admin_access: boolean | null
          created_at: string | null
          feature_key: string
          feature_name: string
          id: string
          parent_access: boolean | null
          teacher_access: boolean | null
          updated_at: string | null
        }
        Insert: {
          admin_access?: boolean | null
          created_at?: string | null
          feature_key: string
          feature_name: string
          id?: string
          parent_access?: boolean | null
          teacher_access?: boolean | null
          updated_at?: string | null
        }
        Update: {
          admin_access?: boolean | null
          created_at?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          parent_access?: boolean | null
          teacher_access?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spreadsheet_layout_settings: {
        Row: {
          created_at: string
          id: string
          page_key: string
          scope: string
          settings: Json
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_key: string
          scope: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_key?: string
          scope?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          alasan_keluar: string | null
          catatan_perhatian: string | null
          created_at: string
          created_by: string | null
          halaman_terakhir: number
          id: string
          kelas: number
          level: Database["public"]["Enums"]["reading_level"]
          nama: string
          nis: string | null
          nisn: string | null
          perlu_perhatian: boolean
          rombel: string
          status_bacaan: Database["public"]["Enums"]["reading_status"]
          status_siswa: Database["public"]["Enums"]["student_status"]
          tahun_lulus: number | null
          tanggal_keluar: string | null
          updated_at: string
        }
        Insert: {
          alasan_keluar?: string | null
          catatan_perhatian?: string | null
          created_at?: string
          created_by?: string | null
          halaman_terakhir?: number
          id?: string
          kelas: number
          level?: Database["public"]["Enums"]["reading_level"]
          nama: string
          nis?: string | null
          nisn?: string | null
          perlu_perhatian?: boolean
          rombel?: string
          status_bacaan?: Database["public"]["Enums"]["reading_status"]
          status_siswa?: Database["public"]["Enums"]["student_status"]
          tahun_lulus?: number | null
          tanggal_keluar?: string | null
          updated_at?: string
        }
        Update: {
          alasan_keluar?: string | null
          catatan_perhatian?: string | null
          created_at?: string
          created_by?: string | null
          halaman_terakhir?: number
          id?: string
          kelas?: number
          level?: Database["public"]["Enums"]["reading_level"]
          nama?: string
          nis?: string | null
          nisn?: string | null
          perlu_perhatian?: boolean
          rombel?: string
          status_bacaan?: Database["public"]["Enums"]["reading_status"]
          status_siswa?: Database["public"]["Enums"]["student_status"]
          tahun_lulus?: number | null
          tanggal_keluar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tahsin_assessments: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          hukum_mim_mati: number
          hukum_nun_mati: number
          id: string
          keterangan: Json | null
          level_dinilai: string
          mad: number
          makhraj_huruf: number
          nilai_total: number
          predikat: string
          student_id: string
          tanggal: string
          tartil: number
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          hukum_mim_mati?: number
          hukum_nun_mati?: number
          id?: string
          keterangan?: Json | null
          level_dinilai: string
          mad?: number
          makhraj_huruf?: number
          nilai_total?: number
          predikat?: string
          student_id: string
          tanggal?: string
          tartil?: number
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          hukum_mim_mati?: number
          hukum_nun_mati?: number
          id?: string
          keterangan?: Json | null
          level_dinilai?: string
          mad?: number
          makhraj_huruf?: number
          nilai_total?: number
          predikat?: string
          student_id?: string
          tanggal?: string
          tartil?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tahsin_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tahsin_dasar_exams: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          ebta_scores: Json
          hasil: string
          id: string
          kelancaran_bobot: number
          lahn_jali_penalty: number
          lahn_khofi_penalty: number
          nilai_akhir: number
          student_id: string
          tanggal: string
          waktu: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          ebta_scores?: Json
          hasil?: string
          id?: string
          kelancaran_bobot?: number
          lahn_jali_penalty?: number
          lahn_khofi_penalty?: number
          nilai_akhir?: number
          student_id: string
          tanggal?: string
          waktu?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          ebta_scores?: Json
          hasil?: string
          id?: string
          kelancaran_bobot?: number
          lahn_jali_penalty?: number
          lahn_khofi_penalty?: number
          nilai_akhir?: number
          student_id?: string
          tanggal?: string
          waktu?: string
        }
        Relationships: [
          {
            foreignKeyName: "tahsin_dasar_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tahsin_lanjutan_exams: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          hasil: string
          id: string
          kelancaran_bobot: number
          lahn_jali_penalty: number
          lahn_khofi_penalty: number
          nilai_akhir: number
          soal: Json
          student_id: string
          tanggal: string
          waktu: string
          waqaf_ibtida_penalty: number
          waqaf_lulus: boolean
          waqaf_symbols: Json
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          hasil?: string
          id?: string
          kelancaran_bobot?: number
          lahn_jali_penalty?: number
          lahn_khofi_penalty?: number
          nilai_akhir?: number
          soal?: Json
          student_id: string
          tanggal?: string
          waktu?: string
          waqaf_ibtida_penalty?: number
          waqaf_lulus?: boolean
          waqaf_symbols?: Json
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          hasil?: string
          id?: string
          kelancaran_bobot?: number
          lahn_jali_penalty?: number
          lahn_khofi_penalty?: number
          nilai_akhir?: number
          soal?: Json
          student_id?: string
          tanggal?: string
          waktu?: string
          waqaf_ibtida_penalty?: number
          waqaf_lulus?: boolean
          waqaf_symbols?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tahsin_lanjutan_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          created_at: string
          id: string
          kelas: number
          rombel: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelas: number
          rombel: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kelas?: number
          rombel?: string
          teacher_id?: string
        }
        Relationships: []
      }
      teacher_diagnostics: {
        Row: {
          category: string
          coaching_recommendation: string | null
          created_at: string
          evaluation_date: string
          evaluator_id: string | null
          fluency_score: number
          id: string
          improvement_note: string | null
          makhraj_score: number
          mapping_score: number
          placement_recommendation: string | null
          sifat_score: number
          strengths_note: string | null
          tajwid_score: number
          teacher_profile_id: string
          teaching_readiness_score: number
          test_material: string | null
          updated_at: string
          waqaf_ibtida_score: number
        }
        Insert: {
          category?: string
          coaching_recommendation?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string | null
          fluency_score?: number
          id?: string
          improvement_note?: string | null
          makhraj_score?: number
          mapping_score?: number
          placement_recommendation?: string | null
          sifat_score?: number
          strengths_note?: string | null
          tajwid_score?: number
          teacher_profile_id: string
          teaching_readiness_score?: number
          test_material?: string | null
          updated_at?: string
          waqaf_ibtida_score?: number
        }
        Update: {
          category?: string
          coaching_recommendation?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string | null
          fluency_score?: number
          id?: string
          improvement_note?: string | null
          makhraj_score?: number
          mapping_score?: number
          placement_recommendation?: string | null
          sifat_score?: number
          strengths_note?: string | null
          tajwid_score?: number
          teacher_profile_id?: string
          teaching_readiness_score?: number
          test_material?: string | null
          updated_at?: string
          waqaf_ibtida_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_diagnostics_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          certificates: string | null
          created_at: string
          current_classes: string | null
          full_name: string
          gender: string | null
          id: string
          last_education: string | null
          notes: string | null
          phone: string | null
          previous_classes: string | null
          specialization: string[]
          tahsin_background: string | null
          teaching_experience: string | null
          teaching_start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          certificates?: string | null
          created_at?: string
          current_classes?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_education?: string | null
          notes?: string | null
          phone?: string | null
          previous_classes?: string | null
          specialization?: string[]
          tahsin_background?: string | null
          teaching_experience?: string | null
          teaching_start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          certificates?: string | null
          created_at?: string
          current_classes?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_education?: string | null
          notes?: string | null
          phone?: string | null
          previous_classes?: string | null
          specialization?: string[]
          tahsin_background?: string | null
          teaching_experience?: string | null
          teaching_start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_at?: string
          requested_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_at?: string
          requested_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_peserta_asesmen_detail: {
        Row: {
          catatan: string | null
          created_at: string | null
          guru_id: string | null
          id: string | null
          nama_guru: string | null
          nilai_akhir: number | null
          paket_id: string | null
          status: string | null
          waktu_mulai: string | null
          waktu_selesai: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peserta_asesmen_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peserta_asesmen_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_asesmen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_all_pending_teacher_student_requests: {
        Args: never
        Returns: number
      }
      approve_teacher_student_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_teacher_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: {
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_access_student: { Args: { _student_id: string }; Returns: boolean }
      can_manage_student: { Args: { _student_id: string }; Returns: boolean }
      create_notification: {
        Args: {
          _body: string
          _link?: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      delete_user: { Args: { target_user_id: string }; Returns: undefined }
      execute_academic_year_transition: {
        Args: {
          p_academic_year_id: string
          p_class_mappings: Json
          p_notes?: string
          p_teacher_action: string
        }
        Returns: Json
      }
      generate_random_soal_for_paket: {
        Args: {
          p_jumlah_soal: number
          p_kategori: string
          p_paket_id: string
          p_sub_aspek: string
          p_tingkat_kesulitan: string
        }
        Returns: number
      }
      get_class_mapping_suggestion: {
        Args: { p_academic_year_id: string }
        Returns: Json
      }
      get_transition_history: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_transition_preview: {
        Args: { p_academic_year_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_account: { Args: { _user_id: string }; Returns: boolean }
      is_teacher_account: { Args: { _user_id: string }; Returns: boolean }
      is_teacher_diagnostic_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      list_active_teacher_accounts: {
        Args: never
        Returns: {
          email: string
          full_name: string
          role: string
          status: string
          user_id: string
          username: string
        }[]
      }
      list_managed_accounts: {
        Args: never
        Returns: {
          children: string[]
          full_name: string
          is_read_by_admin: boolean
          registered_at: string
          role: string
          status: string
          user_id: string
          username: string
          whatsapp: string
        }[]
      }
      list_students_for_registration: {
        Args: never
        Returns: {
          id: string
          kelas: number
          nama: string
          rombel: string
        }[]
      }
      reject_teacher_student_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: {
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_teacher_student: {
        Args: { p_student_id: string }
        Returns: number
      }
      request_teacher_student: {
        Args: { p_student_id: string }
        Returns: {
          created_at: string
          id: string
          requested_at: string
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "teacher_students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      activity_type:
        | "pindah_rombel"
        | "lulus_ujian"
        | "tidak_lulus_ujian"
        | "nilai_rendah"
        | "catatan_progres"
        | "naik_level"
        | "naik_kelas"
        | "lulus_alumni"
        | "keluar_sekolah"
        | "pindah_sekolah"
      app_role: "admin" | "guru" | "parent"
      diagnostic_level_awal:
        | "belum_bisa_baca"
        | "iqro_1"
        | "iqro_2"
        | "iqro_3"
        | "iqro_4"
        | "iqro_5"
        | "iqro_6"
        | "tahsin_lanjutan"
        | "tahfizh"
      evaluation_status:
        | "belum_dievaluasi"
        | "sudah_dievaluasi"
        | "perlu_evaluasi_ulang"
      exam_result: "Lulus" | "Tidak Lulus"
      exam_schedule_type:
        | "tahsin_dasar_ke_lanjutan"
        | "tahsin_lanjutan_ke_tahfizh"
        | "ujian_sertifikat_tahfizh"
      reading_level:
        | "Iqro 1"
        | "Iqro 2"
        | "Iqro 3"
        | "Iqro 4"
        | "Iqro 5"
        | "Iqro 6"
        | "Tahsin Dasar"
        | "Tahsin Lanjutan"
        | "Tahfizh"
      reading_status: "Lancar" | "Cukup" | "Perlu Latihan" | "Terbata-bata"
      student_status: "aktif" | "alumni" | "keluar" | "pindah"
      tajwid_skor: "belum" | "mulai" | "baik" | "menguasai"
      transition_status:
        | "draft"
        | "waiting"
        | "processing"
        | "completed"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "pindah_rombel",
        "lulus_ujian",
        "tidak_lulus_ujian",
        "nilai_rendah",
        "catatan_progres",
        "naik_level",
        "naik_kelas",
        "lulus_alumni",
        "keluar_sekolah",
        "pindah_sekolah",
      ],
      app_role: ["admin", "guru", "parent"],
      diagnostic_level_awal: [
        "belum_bisa_baca",
        "iqro_1",
        "iqro_2",
        "iqro_3",
        "iqro_4",
        "iqro_5",
        "iqro_6",
        "tahsin_lanjutan",
        "tahfizh",
      ],
      evaluation_status: [
        "belum_dievaluasi",
        "sudah_dievaluasi",
        "perlu_evaluasi_ulang",
      ],
      exam_result: ["Lulus", "Tidak Lulus"],
      exam_schedule_type: [
        "tahsin_dasar_ke_lanjutan",
        "tahsin_lanjutan_ke_tahfizh",
        "ujian_sertifikat_tahfizh",
      ],
      reading_level: [
        "Iqro 1",
        "Iqro 2",
        "Iqro 3",
        "Iqro 4",
        "Iqro 5",
        "Iqro 6",
        "Tahsin Dasar",
        "Tahsin Lanjutan",
        "Tahfizh",
      ],
      reading_status: ["Lancar", "Cukup", "Perlu Latihan", "Terbata-bata"],
      student_status: ["aktif", "alumni", "keluar", "pindah"],
      tajwid_skor: ["belum", "mulai", "baik", "menguasai"],
      transition_status: [
        "draft",
        "waiting",
        "processing",
        "completed",
        "failed",
      ],
    },
  },
} as const
