import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AsesmenSession, AsesmenJawaban, SoalCBT } from '@/types/cbt';
import { toast } from '@/hooks/use-toast';

// 1. Fetch ujian yang ditugaskan ke guru login
export const useCBTDashboard = () => {
  return useQuery({
    queryKey: ['cbt-dashboard'],
    queryFn: async () => {
      // Dapatkan data guru login
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Tidak ada user login");

      const { data: profile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);

      if (!profile) return [];

      // Join peserta_asesmen dan paket_asesmen
      const { data, error } = await supabase
        .from('peserta_asesmen')
        .select(`
          id,
          status,
          waktu_mulai,
          waktu_selesai,
          nilai_akhir,
          paket:paket_asesmen (
            id,
            nama_paket,
            kode_paket,
            jenis_asesmen,
            tanggal_mulai,
            tanggal_selesai,
            durasi_menit,
            jumlah_soal,
            status
          )
        `)
        .eq('guru_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      // Pastikan mereturn paket yang masih Aktif, atau tampilkan semua untuk riwayat
      return data;
    },
  });
};

// 2. Inisialisasi atau Lanjutkan Sesi
export const formatIndonesianError = (error: Error): string => {
  const msg = (error?.message || String(error)).toLowerCase();
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "Data dengan kode atau informasi yang sama sudah ada di dalam sistem. Silakan gunakan kode atau informasi yang berbeda.";
  }
  if (msg.includes("not null")) {
    return "Ada kolom isian wajib yang masih kosong atau tidak valid.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Terjadi masalah jaringan. Silakan periksa koneksi internet Anda.";
  }
  if (msg.includes("foreign key")) {
    return "Data terkait tidak ditemukan di dalam sistem.";
  }
  return "Terjadi kesalahan: " + (error?.message || "Kesalahan sistem tidak diketahui.");
};

function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

export const useInitSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pesertaAsesmenId, durasiMenit }: { pesertaAsesmenId: string, durasiMenit: number }) => {
      // Cek apakah session sudah ada
      const { data: existing } = await supabase
        .from('asesmen_session')
        .select('*')
        .eq('peserta_asesmen_id', pesertaAsesmenId)
        .maybeSingle();

      if (existing) {
        return existing as AsesmenSession;
      }

      // Buat baru jika belum ada
      const { data, error } = await supabase
        .from('asesmen_session')
        .insert([{ 
          peserta_asesmen_id: pesertaAsesmenId,
          remaining_time: durasiMenit * 60
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as AsesmenSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt-dashboard'] });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

// 3. Fetch soal dan jawaban tersimpan untuk suatu sesi (dan paket)
export const useCBTData = (sessionId: string, paketId: string) => {
  return useQuery({
    queryKey: ['cbt-data', sessionId],
    enabled: !!sessionId && !!paketId,
    queryFn: async () => {
      // Ambil soal yang berelasi dengan paket
      const { data: relasi, error: relasiError } = await supabase
        .from('paket_asesmen_soal')
        .select('soal:soal_id (id, soal, tipe_soal, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, pembahasan, bobot)')
        .eq('paket_id', paketId);

      if (relasiError) throw new Error(relasiError.message);

      const { data: paketData } = await supabase
        .from('paket_asesmen')
        .select('acak_soal, acak_opsi')
        .eq('id', paketId)
        .maybeSingle();

      let soalList = (relasi.map(r => r.soal) as unknown as SoalCBT[])
        .filter((soal) => {
          const tipe = soal.tipe_soal?.toLowerCase() || "";
          return !tipe.includes("reflektif");
        });

      if (paketData?.acak_soal) {
        const seedGen = xmur3(sessionId);
        const rand = mulberry32(seedGen());
        
        let currentIndex = soalList.length;
        while (currentIndex !== 0) {
          const randomIndex = Math.floor(rand() * currentIndex);
          currentIndex--;
          [soalList[currentIndex], soalList[randomIndex]] = [soalList[randomIndex], soalList[currentIndex]];
        }
      }

      if (paketData?.acak_opsi) {
        soalList = soalList.map(soal => {
           if (!soal.opsi_a && !soal.opsi_b) return soal;
           
           const seedGen = xmur3(sessionId + soal.id);
           const rand = mulberry32(seedGen());
           
           const opts = [
             { key: "A", val: soal.opsi_a },
             { key: "B", val: soal.opsi_b },
             { key: "C", val: soal.opsi_c },
             { key: "D", val: soal.opsi_d },
           ].filter(o => o.val !== null && o.val !== undefined && o.val !== "");
           
           for (let i = opts.length - 1; i > 0; i--) {
               const j = Math.floor(rand() * (i + 1));
               [opts[i], opts[j]] = [opts[j], opts[i]];
           }
           
           const newSoal = { ...soal, opsi_a: null, opsi_b: null, opsi_c: null, opsi_d: null };
           if (opts[0]) newSoal.opsi_a = opts[0].val;
           if (opts[1]) newSoal.opsi_b = opts[1].val;
           if (opts[2]) newSoal.opsi_c = opts[2].val;
           if (opts[3]) newSoal.opsi_d = opts[3].val;
           return newSoal as SoalCBT;
        });
      }

      // Ambil jawaban tersimpan
      const { data: jawaban, error: jawabanError } = await supabase
        .from('asesmen_jawaban')
        .select('*')
        .eq('session_id', sessionId);

      if (jawabanError) throw new Error(jawabanError.message);

      return {
        soal: soalList,
        jawaban: (jawaban || []) as AsesmenJawaban[]
      };
    },
  });
};

// 4. Auto Save Jawaban
export const useAutoSaveJawaban = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, soalId, jawaban, lastQuestion }: { sessionId: string, soalId: string, jawaban: string, lastQuestion: number }) => {
      // Upsert jawaban
      const { error: ansError } = await supabase
        .from('asesmen_jawaban')
        .upsert({ session_id: sessionId, soal_id: soalId, jawaban }, { onConflict: 'session_id, soal_id' });

      if (ansError) throw new Error(ansError.message);

      return { soalId, jawaban };
    },
    onSuccess: (data, variables) => {
      // Update cache optimistically if needed, or just let it be. We don't want to refetch on every keystroke/click.
      // But we update the local cache so UI reflects immediately.
    },
  });
};

// 5. Submit Asesmen
export const useSubmitAsesmen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, remainingTime, paketId, finalAnswers }: { sessionId: string, remainingTime: number, paketId: string, finalAnswers: Record<string, string> }) => {
      // 1. Fetch Soal
      const { data: relasi, error: relasiError } = await supabase
        .from('paket_asesmen_soal')
        .select('soal:soal_id (id, tipe_soal, jawaban_benar, opsi_a, opsi_b, opsi_c, opsi_d)')
        .eq('paket_id', paketId);

      if (relasiError) throw new Error(relasiError.message);

      const { data: paketData } = await supabase
        .from('paket_asesmen')
        .select('acak_opsi')
        .eq('id', paketId)
        .single();
      
      const acakOpsi = paketData?.acak_opsi;

      const soalList = (relasi.map(r => r.soal) as unknown as SoalCBT[])
        .filter((soal) => {
          const tipe = soal.tipe_soal?.toLowerCase() || "";
          return !tipe.includes("reflektif");
        });

      // 2. Hitung Nilai berdasarkan finalAnswers dari frontend
      let jumlahBenar = 0;
      let jumlahSalah = 0;
      const totalSoal = soalList.length;

      const updates = [];

      for (const soal of soalList) {
        const jawabanUser = (finalAnswers[soal.id] || "").trim();
        let jawabanBenar = soal.jawaban_benar?.trim() || "";

        if (acakOpsi) {
           const seedGen = xmur3(sessionId + soal.id);
           const rand = mulberry32(seedGen());
           const opts = [
             { key: "A", val: soal.opsi_a },
             { key: "B", val: soal.opsi_b },
             { key: "C", val: soal.opsi_c },
             { key: "D", val: soal.opsi_d },
           ].filter(o => o.val !== null && o.val !== undefined && o.val !== "");
           
           for (let i = opts.length - 1; i > 0; i--) {
               const j = Math.floor(rand() * (i + 1));
               [opts[i], opts[j]] = [opts[j], opts[i]];
           }
           
           const newCorrectIndex = opts.findIndex(o => o.key.toLowerCase() === jawabanBenar.toLowerCase());
           if (newCorrectIndex !== -1) {
              jawabanBenar = ["A", "B", "C", "D"][newCorrectIndex];
           }
        }

        let isBenar = false;
        let skor = 0;

        if (jawabanUser && jawabanBenar && jawabanUser.toLowerCase() === jawabanBenar.toLowerCase()) {
          isBenar = true;
          skor = 1;
          jumlahBenar++;
        } else {
          jumlahSalah++;
        }

        updates.push({
          session_id: sessionId,
          soal_id: soal.id,
          jawaban: jawabanUser || null, // null if empty string
          benar: isBenar,
          skor: skor
        });
      }

      // Pastikan soal esai juga ikut di-upsert (tidak ikut dinilai di sini)
      Object.keys(finalAnswers).forEach(soalId => {
        if (!updates.find(u => u.soal_id === soalId)) {
          updates.push({
            session_id: sessionId,
            soal_id: soalId,
            jawaban: finalAnswers[soalId] || null,
            benar: null,
            skor: null
          });
        }
      });

      const nilai = totalSoal > 0 ? (jumlahBenar / totalSoal) * 100 : 0;

      // 4. Update jawaban di DB secara bulk (menggunakan upsert)
      if (updates.length > 0) {
         const { error: upsertError } = await supabase
           .from('asesmen_jawaban')
           .upsert(updates, { onConflict: 'session_id, soal_id' });
         if (upsertError) throw new Error(upsertError.message);
      }

      // 5. Update asesmen_session
      const { data, error } = await supabase
        .from('asesmen_session')
        .update({ 
          status: 'Selesai', 
          finished_at: new Date().toISOString(),
          remaining_time: remainingTime,
          total_soal: totalSoal,
          jumlah_benar: jumlahBenar,
          jumlah_salah: jumlahSalah,
          nilai: nilai
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cbt-dashboard'] });
      toast({ title: "Ujian Selesai", description: "Terima kasih, jawaban Anda telah tersimpan." });
    },
  });
};

export type CBTResultDetailData = {
  soal: SoalCBT;
  jawabanUserText: string | null;
  jawabanBenarText: string | null;
  isBenar: boolean;
  skor: number;
  jawabanUserKey: string | null;
  jawabanBenarKey: string | null;
};

export const useCBTResultDetails = (pesertaId: string) => {
  return useQuery({
    queryKey: ['cbt-result-details', pesertaId],
    queryFn: async () => {
      const { data: peserta, error: pesertaError } = await supabase
        .from('peserta_asesmen')
        .select(`
          id, paket_id, status,
          paket:paket_asesmen(id, nama_paket, acak_opsi, acak_soal)
        `)
        .eq('id', pesertaId)
        .single();
        
      if (pesertaError) throw new Error(pesertaError.message);
      
      const { data: session, error: sessionError } = await supabase
        .from('asesmen_session')
        .select('*')
        .eq('peserta_id', pesertaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (sessionError) throw new Error(sessionError.message);
      if (!session) throw new Error("Sesi ujian tidak ditemukan.");
      
      const sessionId = session.id;
      
      const { data: relasi, error: relasiError } = await supabase
        .from('paket_asesmen_soal')
        .select('soal:soal_id (id, tipe_soal, soal, jawaban_benar, opsi_a, opsi_b, opsi_c, opsi_d)')
        .eq('paket_id', peserta.paket_id);
        
      if (relasiError) throw new Error(relasiError.message);
      
      const soalList = (relasi.map(r => r.soal) as unknown as SoalCBT[])
        .filter((soal) => {
          const tipe = soal.tipe_soal?.toLowerCase() || "";
          return !tipe.includes("reflektif");
        });
        
      const { data: jawabanData, error: jawabanError } = await supabase
        .from('asesmen_jawaban')
        .select('*')
        .eq('session_id', sessionId);
        
      if (jawabanError) throw new Error(jawabanError.message);
      
      const acakOpsi = peserta.paket?.acak_opsi;
      const details: CBTResultDetailData[] = [];
      
      for (const soal of soalList) {
        const jwb = jawabanData?.find(j => j.soal_id === soal.id);
        const jawabanUser = jwb?.jawaban || null;
        const jawabanBenarAsli = soal.jawaban_benar?.trim() || "";
        
        let jawabanUserText = null;
        let jawabanBenarText = null;
        let jawabanBenarKey = jawabanBenarAsli;
        
        if (acakOpsi) {
           const seedGen = xmur3(sessionId + soal.id);
           const rand = mulberry32(seedGen());
           const opts = [
             { key: "A", val: soal.opsi_a },
             { key: "B", val: soal.opsi_b },
             { key: "C", val: soal.opsi_c },
             { key: "D", val: soal.opsi_d },
           ].filter(o => o.val !== null && o.val !== undefined && o.val !== "");
           
           for (let i = opts.length - 1; i > 0; i--) {
               const j = Math.floor(rand() * (i + 1));
               [opts[i], opts[j]] = [opts[j], opts[i]];
           }
           
           if (jawabanUser) {
             const userOptIndex = ["A", "B", "C", "D"].indexOf(jawabanUser.toUpperCase());
             if (userOptIndex !== -1 && opts[userOptIndex]) {
               jawabanUserText = opts[userOptIndex].val;
             }
           }
           
           const newCorrectIndex = opts.findIndex(o => o.key.toLowerCase() === jawabanBenarAsli.toLowerCase());
           if (newCorrectIndex !== -1) {
              jawabanBenarKey = ["A", "B", "C", "D"][newCorrectIndex];
              jawabanBenarText = opts[newCorrectIndex].val;
           }
        } else {
           if (jawabanUser) {
             if (jawabanUser.toUpperCase() === "A") jawabanUserText = soal.opsi_a;
             if (jawabanUser.toUpperCase() === "B") jawabanUserText = soal.opsi_b;
             if (jawabanUser.toUpperCase() === "C") jawabanUserText = soal.opsi_c;
             if (jawabanUser.toUpperCase() === "D") jawabanUserText = soal.opsi_d;
           }
           if (jawabanBenarAsli.toUpperCase() === "A") jawabanBenarText = soal.opsi_a;
           if (jawabanBenarAsli.toUpperCase() === "B") jawabanBenarText = soal.opsi_b;
           if (jawabanBenarAsli.toUpperCase() === "C") jawabanBenarText = soal.opsi_c;
           if (jawabanBenarAsli.toUpperCase() === "D") jawabanBenarText = soal.opsi_d;
        }
        
        details.push({
          soal,
          jawabanUserText,
          jawabanBenarText,
          isBenar: jwb?.benar || false,
          skor: jwb?.skor || 0,
          jawabanUserKey: jawabanUser,
          jawabanBenarKey: jawabanBenarKey
        });
      }
      
      return {
        session,
        details,
        paket: peserta.paket
      };
    },
    enabled: !!pesertaId
  });
};

