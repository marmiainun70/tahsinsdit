import { supabase } from "@/integrations/supabase/client";
import { format, differenceInBusinessDays, parseISO, isValid } from "date-fns";

export type HariEfektifResult = {
  aktual: number;
  standar: number;
  persentase: number;
};

/**
 * Mendapatkan hari efektif pembinaan berdasarkan rentang tanggal.
 * Menggunakan prinsip Single Source of Truth dari tabel academic_calendar_days.
 * 
 * @param tanggalMulai YYYY-MM-DD
 * @param tanggalSelesai YYYY-MM-DD
 */
export async function getHariEfektifPembinaan(
  tanggalMulai: string,
  tanggalSelesai: string
): Promise<HariEfektifResult> {
  const tglMulai = parseISO(tanggalMulai);
  const tglSelesai = parseISO(tanggalSelesai);
  
  if (!isValid(tglMulai) || !isValid(tglSelesai)) {
    throw new Error("Format tanggal tidak valid");
  }

  // Standar: jumlah hari Senin-Jumat murni dalam rentang (date math)
  // differenceInBusinessDays menghitung jumlah hari bisnis di antara dua tanggal.
  // Pastikan menambahkan 1 hari jika rentang bersifat inklusif (tergantung kebutuhan, di sini asumsi inklusif).
  // Catatan: differenceInBusinessDays (end, start) menghitung selisih.
  let standar = differenceInBusinessDays(tglSelesai, tglMulai);
  
  // differenceInBusinessDays does not include the start day if it's a business day in its count in a way that matches inclusive ranges,
  // Let's implement a simple loop for safety to be exact about inclusive boundaries
  standar = 0;
  const current = new Date(tglMulai);
  while (current <= tglSelesai) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      standar++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Aktual: query dari database untuk status = 'efektif'
  const { count, error } = await supabase
    .from("academic_calendar_days")
    .select("*", { count: "exact", head: true })
    .gte("tanggal", tanggalMulai)
    .lte("tanggal", tanggalSelesai)
    .eq("status", "efektif");

  if (error) {
    console.error("Error fetching hari efektif aktual:", error);
    throw error;
  }

  const aktual = count || 0;
  
  // Persentase
  const persentase = standar > 0 ? (aktual / standar) * 100 : 0;

  return {
    aktual,
    standar,
    persentase,
  };
}

/**
 * Fungsi untuk menarik data dari Tanggal Merah API
 * Endpoint: https://tanggalmerah.upset.dev/api/holidays?year={tahun}
 */
export async function fetchHolidaysFromAPI(year: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout

  try {
    // Menggunakan API libur.deno.dev sebagai pengganti karena upset.dev 404
    const response = await fetch(`https://libur.deno.dev/api?year=${year}`, {
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map response dari libur.deno.dev ke format yang diharapkan aplikasi
    // Asumsi: data adalah array [{ date, name, is_national_holiday }, ...]
    return data.map((item: any) => ({
      date: item.date,
      name: item.name,
      type: item.is_national_holiday ? "holiday" : "cuti_bersama"
    }));
  } catch (error) {
    console.error(`Gagal mengambil data libur tahun ${year}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
