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
          tanggal?: string
          updated_at?: string
          waktu_mulai?: string
          waktu_selesai?: string | null
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
          month: number
          notes: string | null
          pages_read: number
          program_type: string
          start_page: number
          student_id: string
          target_pages: number
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
          month: number
          notes?: string | null
          pages_read?: number
          program_type?: string
          start_page?: number
          student_id: string
          target_pages?: number
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
          month?: number
          notes?: string | null
          pages_read?: number
          program_type?: string
          start_page?: number
          student_id?: string
          target_pages?: number
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
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
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
      students: {
        Row: {
          catatan_perhatian: string | null
          created_at: string
          created_by: string | null
          halaman_terakhir: number
          id: string
          kelas: number
          level: Database["public"]["Enums"]["reading_level"]
          nama: string
          perlu_perhatian: boolean
          rombel: string
          status_bacaan: Database["public"]["Enums"]["reading_status"]
          updated_at: string
        }
        Insert: {
          catatan_perhatian?: string | null
          created_at?: string
          created_by?: string | null
          halaman_terakhir?: number
          id?: string
          kelas: number
          level?: Database["public"]["Enums"]["reading_level"]
          nama: string
          perlu_perhatian?: boolean
          rombel?: string
          status_bacaan?: Database["public"]["Enums"]["reading_status"]
          updated_at?: string
        }
        Update: {
          catatan_perhatian?: string | null
          created_at?: string
          created_by?: string | null
          halaman_terakhir?: number
          id?: string
          kelas?: number
          level?: Database["public"]["Enums"]["reading_level"]
          nama?: string
          perlu_perhatian?: boolean
          rombel?: string
          status_bacaan?: Database["public"]["Enums"]["reading_status"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      app_role: "admin" | "guru" | "parent"
      exam_result: "Lulus" | "Tidak Lulus"
      exam_schedule_type:
        | "tahsin_dasar_ke_lanjutan"
        | "tahsin_lanjutan_ke_tahfizh"
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
      ],
      app_role: ["admin", "guru", "parent"],
      exam_result: ["Lulus", "Tidak Lulus"],
      exam_schedule_type: [
        "tahsin_dasar_ke_lanjutan",
        "tahsin_lanjutan_ke_tahfizh",
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
    },
  },
} as const
