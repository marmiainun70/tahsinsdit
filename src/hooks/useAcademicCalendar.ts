import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHolidaysFromAPI } from "@/services/calendarService";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export type StatusHari = "efektif" | "tidak_efektif" | "menunggu_konfirmasi";
export type JenisHari = "reguler" | "weekend" | "libur_nasional" | "cuti_bersama" | "pts" | "pas" | "kegiatan_khusus";
export type SourceHari = "sistem_default" | "api_libur" | "admin_override" | "sistem_fallback";

export interface AcademicYear {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: "draft" | "aktif" | "selesai";
  created_at: string;
}

export interface CalendarDay {
  id: string;
  tanggal: string;
  status: StatusHari;
  jenis: JenisHari;
  keterangan: string | null;
  source: SourceHari;
  is_override: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarSettings {
  id: number;
  cutover_date: string | null;
  last_api_sync_at: string | null;
  updated_at: string;
}

export interface SyncHistory {
  id: string;
  triggered_by: string | null;
  triggered_by_role: string;
  trigger_type: string;
  tahun_yang_disync: string;
  status: string;
  jumlah_ditambah: number;
  jumlah_diupdate: number;
  jumlah_dilewati: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

// ─── Fungsi Helper Generate Hari Default ──────────────────────────────────────

function generateDefaultDays(startDate: string, endDate: string): Omit<CalendarDay, "id" | "created_at" | "updated_at">[] {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return days.map((d) => {
    const dayOfWeek = d.getDay(); // 0=Minggu, 6=Sabtu
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return {
      tanggal: format(d, "yyyy-MM-dd"),
      status: isWeekend ? "tidak_efektif" : "efektif",
      jenis: isWeekend ? "weekend" : "reguler",
      keterangan: null,
      source: "sistem_default",
      is_override: false,
      last_synced_at: null,
    };
  });
}

// ─── Hooks: Tahun Ajaran ──────────────────────────────────────────────────────

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic_years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("tanggal_mulai", { ascending: false });
      if (error) throw error;
      return data as AcademicYear[];
    },
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nama,
      tanggal_mulai,
      tanggal_selesai,
      userId,
    }: {
      nama: string;
      tanggal_mulai: string;
      tanggal_selesai: string;
      userId: string;
    }) => {
      // 1. Buat baris academic_years dengan status draft
      const { data: yearData, error: yearError } = await supabase
        .from("academic_years")
        .insert({ nama, tanggal_mulai, tanggal_selesai, created_by: userId, status: "draft" })
        .select()
        .single();
      if (yearError) throw yearError;

      // 2. Generate hari default
      const defaultDays = generateDefaultDays(tanggal_mulai, tanggal_selesai);

      // Insert hanya tanggal yang belum ada (upsert dengan onConflict ignore)
      const { error: daysError } = await supabase
        .from("academic_calendar_days")
        .upsert(defaultDays, { onConflict: "tanggal", ignoreDuplicates: true });
      if (daysError) throw daysError;

      // 3. Sinkronisasi API libur
      const startYear = new Date(tanggal_mulai).getFullYear();
      const endYear = new Date(tanggal_selesai).getFullYear();
      const yearsToSync = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

      let jumlah_ditambah = 0;
      let jumlah_diupdate = 0;
      let jumlah_dilewati = 0;
      let syncStatus: "sukses" | "gagal" | "sebagian_gagal" = "sukses";
      let errorMsg: string | null = null;

      const syncStart = new Date().toISOString();

      try {
        for (const yr of yearsToSync) {
          const holidays = await fetchHolidaysFromAPI(yr);
          for (const h of holidays) {
            const jenisHari: JenisHari = h.type === "holiday" ? "libur_nasional" : "cuti_bersama";
            const statusHari: StatusHari = h.type === "holiday" ? "tidak_efektif" : "menunggu_konfirmasi";

            // Cek apakah tanggal ini punya is_override
            const { data: existing } = await supabase
              .from("academic_calendar_days")
              .select("id, is_override")
              .eq("tanggal", h.date)
              .single();

            if (!existing) {
              // Insert baru
              await supabase.from("academic_calendar_days").insert({
                tanggal: h.date,
                status: statusHari,
                jenis: jenisHari,
                keterangan: h.name,
                source: "api_libur",
                is_override: false,
                last_synced_at: new Date().toISOString(),
              });
              jumlah_ditambah++;
            } else if (!existing.is_override) {
              // Update
              await supabase
                .from("academic_calendar_days")
                .update({
                  status: statusHari,
                  jenis: jenisHari,
                  keterangan: h.name,
                  source: "api_libur",
                  last_synced_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("tanggal", h.date);
              jumlah_diupdate++;
            } else {
              jumlah_dilewati++;
            }
          }
        }
      } catch (apiErr: unknown) {
        syncStatus = "gagal";
        errorMsg = apiErr instanceof Error ? apiErr.message : "Gagal menghubungi API";
      }

      // 4. Catat riwayat sinkronisasi
      await supabase.from("academic_calendar_sync_history").insert({
        triggered_by: userId,
        triggered_by_role: "koordinator",
        trigger_type: "auto_generate_tahun_ajaran",
        tahun_yang_disync: yearsToSync.join(","),
        status: syncStatus,
        jumlah_ditambah,
        jumlah_diupdate,
        jumlah_dilewati,
        error_message: errorMsg,
        started_at: syncStart,
        finished_at: new Date().toISOString(),
      });

      // 5. Update academic_calendar_settings last_api_sync_at
      await supabase
        .from("academic_calendar_settings")
        .upsert({ id: 1, last_api_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "id" });

      // 6. Aktifkan tahun ajaran
      await supabase.from("academic_years").update({ status: "aktif" }).eq("id", yearData.id);

      return { yearData, syncStatus, errorMsg };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["academic_years"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_days"] });
      queryClient.invalidateQueries({ queryKey: ["sync_history"] });
      if (result.syncStatus === "gagal") {
        toast({
          title: "Tahun ajaran dibuat, tapi sinkronisasi libur gagal",
          description: result.errorMsg || "Periksa koneksi internet Anda.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Tahun ajaran baru berhasil dibuat & diaktifkan!" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat tahun ajaran", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAcademicYearStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "aktif" | "selesai" }) => {
      const { error } = await supabase.from("academic_years").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_years"] });
      toast({ title: "Status tahun ajaran berhasil diperbarui" });
    },
  });
}

// ─── Hooks: Hari Kalender ─────────────────────────────────────────────────────

export function useCalendarDays(month: Date) {
  const startDate = format(startOfMonth(month), "yyyy-MM-dd");
  const endDate = format(endOfMonth(month), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["calendar_days", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_calendar_days")
        .select("*")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal");
      if (error) throw error;
      return data as CalendarDay[];
    },
  });
}

export function usePendingConfirmationDays() {
  return useQuery({
    queryKey: ["calendar_days_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_calendar_days")
        .select("*")
        .eq("status", "menunggu_konfirmasi")
        .order("tanggal");
      if (error) throw error;
      return data as CalendarDay[];
    },
  });
}

export function useUpdateCalendarDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tanggal,
      updates,
      changedByRole,
      changedBy,
      alasan,
      batchId,
    }: {
      tanggal: string;
      updates: Partial<Pick<CalendarDay, "status" | "jenis" | "keterangan">>;
      changedByRole: string;
      changedBy: string;
      alasan?: string;
      batchId?: string;
    }) => {
      // Ambil data lama untuk audit log
      const { data: existing } = await supabase
        .from("academic_calendar_days")
        .select("*")
        .eq("tanggal", tanggal)
        .single();

      if (!existing) throw new Error("Tanggal tidak ditemukan");

      // Update hari
      const { error } = await supabase
        .from("academic_calendar_days")
        .update({
          ...updates,
          source: "admin_override",
          is_override: true,
          updated_at: new Date().toISOString(),
        })
        .eq("tanggal", tanggal);
      if (error) throw error;

      // Catat audit log untuk setiap field yang berubah
      const auditEntries = [];
      for (const [field, newVal] of Object.entries(updates)) {
        const oldVal = existing[field as keyof CalendarDay];
        if (String(oldVal) !== String(newVal)) {
          auditEntries.push({
            modul: "kalender_akademik",
            entity_id: tanggal,
            field_changed: field,
            old_value: String(oldVal ?? ""),
            new_value: String(newVal ?? ""),
            changed_by: changedBy,
            changed_by_role: changedByRole,
            alasan: alasan ?? null,
            batch_id: batchId ?? null,
          });
        }
      }
      if (auditEntries.length > 0) {
        await supabase.from("config_audit_log").insert(auditEntries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_days"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_days_pending"] });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal menyimpan perubahan", description: err.message, variant: "destructive" });
    },
  });
}

// Batch update (pilih banyak hari / rentang tanggal)
export function useBatchUpdateCalendarDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tanggals,
      updates,
      changedByRole,
      changedBy,
      alasan,
    }: {
      tanggals: string[];
      updates: Partial<Pick<CalendarDay, "status" | "jenis" | "keterangan">>;
      changedByRole: string;
      changedBy: string;
      alasan?: string;
    }) => {
      const batchId = crypto.randomUUID();

      for (const tanggal of tanggals) {
        const { data: existing } = await supabase
          .from("academic_calendar_days")
          .select("*")
          .eq("tanggal", tanggal)
          .single();

        if (existing) {
          await supabase
            .from("academic_calendar_days")
            .update({
              ...updates,
              source: "admin_override",
              is_override: true,
              updated_at: new Date().toISOString(),
            })
            .eq("tanggal", tanggal);

          const auditEntries = [];
          for (const [field, newVal] of Object.entries(updates)) {
            const oldVal = existing[field as keyof CalendarDay];
            if (String(oldVal) !== String(newVal)) {
              auditEntries.push({
                modul: "kalender_akademik",
                entity_id: tanggal,
                field_changed: field,
                old_value: String(oldVal ?? ""),
                new_value: String(newVal ?? ""),
                changed_by: changedBy,
                changed_by_role: changedByRole,
                alasan: alasan ?? null,
                batch_id: batchId,
              });
            }
          }
          if (auditEntries.length > 0) {
            await supabase.from("config_audit_log").insert(auditEntries);
          }
        } else {
          // Tanggal belum ada (misal, di luar rentang tahun ajaran) — insert baru
          await supabase.from("academic_calendar_days").insert({
            tanggal,
            ...updates,
            source: "admin_override",
            is_override: true,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_days"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_days_pending"] });
      toast({ title: "Perubahan massal berhasil disimpan" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal menyimpan perubahan massal", description: err.message, variant: "destructive" });
    },
  });
}

// Rekap bulanan — fallback menunggu_konfirmasi → tidak_efektif
export function useRunMonthlyRecap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, changedBy }: { month: Date; changedBy: string }) => {
      const startDate = format(startOfMonth(month), "yyyy-MM-dd");
      const endDate = format(endOfMonth(month), "yyyy-MM-dd");

      const { data: pendingDays, error } = await supabase
        .from("academic_calendar_days")
        .select("*")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .eq("status", "menunggu_konfirmasi");
      if (error) throw error;

      const batchId = crypto.randomUUID();
      for (const day of pendingDays || []) {
        await supabase
          .from("academic_calendar_days")
          .update({
            status: "tidak_efektif",
            source: "sistem_fallback",
            updated_at: new Date().toISOString(),
          })
          .eq("tanggal", day.tanggal);

        await supabase.from("config_audit_log").insert({
          modul: "kalender_akademik",
          entity_id: day.tanggal,
          field_changed: "status",
          old_value: "menunggu_konfirmasi",
          new_value: "tidak_efektif",
          changed_by: changedBy,
          changed_by_role: "system",
          alasan: "Rekap bulanan — fallback otomatis",
          batch_id: batchId,
        });
      }

      return pendingDays?.length ?? 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["calendar_days"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_days_pending"] });
      toast({ title: `Rekap selesai: ${count} hari otomatis diubah ke tidak efektif` });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal rekap bulanan", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Hooks: Sinkronisasi Manual ───────────────────────────────────────────────

export function useSyncHolidays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ years, userId, userRole }: { years: number[]; userId: string; userRole: string }) => {
      let jumlah_ditambah = 0;
      let jumlah_diupdate = 0;
      let jumlah_dilewati = 0;
      let syncStatus: "sukses" | "gagal" | "sebagian_gagal" = "sukses";
      let errorMsg: string | null = null;
      const syncStart = new Date().toISOString();

      try {
        for (const yr of years) {
          const holidays = await fetchHolidaysFromAPI(yr);
          for (const h of holidays) {
            const jenisHari: JenisHari = h.type === "holiday" ? "libur_nasional" : "cuti_bersama";
            const statusHari: StatusHari = h.type === "holiday" ? "tidak_efektif" : "menunggu_konfirmasi";

            const { data: existing } = await supabase
              .from("academic_calendar_days")
              .select("id, is_override")
              .eq("tanggal", h.date)
              .single();

            if (!existing) {
              await supabase.from("academic_calendar_days").insert({
                tanggal: h.date,
                status: statusHari,
                jenis: jenisHari,
                keterangan: h.name,
                source: "api_libur",
                is_override: false,
                last_synced_at: new Date().toISOString(),
              });
              jumlah_ditambah++;
            } else if (!existing.is_override) {
              await supabase
                .from("academic_calendar_days")
                .update({
                  status: statusHari,
                  jenis: jenisHari,
                  keterangan: h.name,
                  source: "api_libur",
                  last_synced_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("tanggal", h.date);
              jumlah_diupdate++;
            } else {
              jumlah_dilewati++;
            }
          }
        }
      } catch (apiErr: unknown) {
        syncStatus = "gagal";
        errorMsg = apiErr instanceof Error ? apiErr.message : "Gagal menghubungi API";
      }

      await supabase.from("academic_calendar_sync_history").insert({
        triggered_by: userId,
        triggered_by_role: userRole,
        trigger_type: "manual",
        tahun_yang_disync: years.join(","),
        status: syncStatus,
        jumlah_ditambah,
        jumlah_diupdate,
        jumlah_dilewati,
        error_message: errorMsg,
        started_at: syncStart,
        finished_at: new Date().toISOString(),
      });

      await supabase
        .from("academic_calendar_settings")
        .upsert({ id: 1, last_api_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "id" });

      return { syncStatus, errorMsg, jumlah_ditambah, jumlah_diupdate, jumlah_dilewati };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["calendar_days"] });
      queryClient.invalidateQueries({ queryKey: ["sync_history"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_days_pending"] });
      if (result.syncStatus === "gagal") {
        toast({ title: "Sinkronisasi gagal", description: result.errorMsg || "", variant: "destructive" });
      } else {
        toast({
          title: "Sinkronisasi berhasil",
          description: `+${result.jumlah_ditambah} baru, ~${result.jumlah_diupdate} diperbarui, ${result.jumlah_dilewati} dilewati`,
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Sinkronisasi gagal", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Hooks: Riwayat Sinkronisasi ─────────────────────────────────────────────

export function useSyncHistory() {
  return useQuery({
    queryKey: ["sync_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_calendar_sync_history")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as SyncHistory[];
    },
  });
}

// ─── Hooks: Settings ──────────────────────────────────────────────────────────

export function useCalendarSettings() {
  return useQuery({
    queryKey: ["calendar_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_calendar_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as CalendarSettings | null;
    },
  });
}
