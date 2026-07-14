import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PesertaAsesmenDetail, PesertaAsesmenInput } from '@/types/pesertaAsesmen';
import { toast } from '@/hooks/use-toast';

export const usePesertaAsesmen = (paketId: string) => {
  return useQuery({
    queryKey: ['peserta-asesmen', paketId],
    enabled: !!paketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_peserta_asesmen_detail')
        .select('*')
        .eq('paket_id', paketId)
        .order('nama_guru', { ascending: true });

      if (error) throw new Error(error.message);
      return data as PesertaAsesmenDetail[];
    },
  });
};

export const useAddPeserta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: PesertaAsesmenInput[]) => {
      // Upsert to handle unique constraint (paket_id, guru_id) gracefully
      const { data, error } = await supabase
        .from('peserta_asesmen')
        .upsert(inputs, { onConflict: 'paket_id, guru_id', ignoreDuplicates: true })
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['peserta-asesmen', variables[0].paket_id] });
      }
      toast({ title: "Berhasil", description: `${variables.length} guru berhasil ditambahkan sebagai peserta.` });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeletePeserta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paketId }: { id: string, paketId: string }) => {
      const { error } = await supabase
        .from('peserta_asesmen')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return paketId;
    },
    onSuccess: (paketId) => {
      queryClient.invalidateQueries({ queryKey: ['peserta-asesmen', paketId] });
      toast({ title: "Berhasil", description: "Peserta berhasil dihapus dari paket." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

// Hook to fetch all active teachers for the dropdown/selection
export const useActiveTeachersForPeserta = () => {
  return useQuery({
    queryKey: ['active-teachers-for-peserta'],
    queryFn: async () => {
      // 1. Dapatkan daftar user_id yang statusnya approved (bukan parent)
      const { data: allActiveProfiles, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('status', 'approved');

      if (profileErr) throw new Error(profileErr.message);

      if (!allActiveProfiles || allActiveProfiles.length === 0) return [];

      const activeProfiles = allActiveProfiles.filter(p => p.role !== 'parent');
      
      if (activeProfiles.length === 0) return [];

      // 2. Pastikan mereka memiliki entri di teacher_profiles
      // (Bypass masalah foreign key jika admin belum membuat profil gurunya)
      const upsertData = activeProfiles.map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        specialization: []
      }));

      const { error: upsertErr } = await supabase
        .from('teacher_profiles')
        .upsert(upsertData, { onConflict: 'user_id', ignoreDuplicates: true });

      if (upsertErr) {
        toast({ title: "Gagal sinkronisasi profil guru", description: upsertErr.message, variant: "destructive" });
        console.warn("Gagal sinkronisasi otomatis teacher_profiles:", upsertErr);
      }

      const activeUserIds = new Set(activeProfiles.map(p => p.user_id));

      // 3. Dapatkan semua profil guru
      const { data: teachers, error: teacherErr } = await supabase
        .from('teacher_profiles')
        .select('id, full_name, user_id')
        .order('full_name', { ascending: true });

      if (teacherErr) throw new Error(teacherErr.message);

      // 4. Filter guru yang statusnya aktif dan perannya sesuai
      return teachers.filter(t => activeUserIds.has(t.user_id));
    },
  });
};

// Hook to fetch detailed results for a specific test participant
export const useDetailHasilAsesmen = (pesertaAsesmenId: string | null) => {
  return useQuery({
    queryKey: ['detail-hasil-asesmen', pesertaAsesmenId],
    enabled: !!pesertaAsesmenId,
    queryFn: async () => {
      if (!pesertaAsesmenId) return null;

      // 1. Get session
      const { data: session, error: sessionErr } = await supabase
        .from('asesmen_session')
        .select('*')
        .eq('peserta_asesmen_id', pesertaAsesmenId)
        .maybeSingle();

      if (sessionErr) throw new Error(sessionErr.message);
      if (!session) return null;

      // 2. Get answers with related questions
      const { data: answers, error: answersErr } = await supabase
        .from('asesmen_jawaban')
        .select('id, jawaban, benar, skor, soal_id, bank_soal:soal_id(soal, jawaban_benar, tipe_soal, bobot, opsi_a, opsi_b, opsi_c, opsi_d)')
        .eq('session_id', session.id);

      if (answersErr) throw new Error(answersErr.message);

      return {
        session,
        jawaban: answers
      };
    },
  });
};

export const useUpdateNilaiAkhir = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nilaiAkhir, paketId }: { id: string, nilaiAkhir: number, paketId: string }) => {
      const { data, error } = await supabase
        .from('peserta_asesmen')
        .update({ nilai_akhir: nilaiAkhir })
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return { data, paketId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['peserta-asesmen', result.paketId] });
    },
  });
};
