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
      // 1. Dapatkan daftar user_id yang statusnya Aktif
      const { data: activeProfiles, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('status', 'Aktif');

      if (profileErr) throw new Error(profileErr.message);

      const activeUserIds = new Set(activeProfiles.map(p => p.user_id));

      // 2. Dapatkan semua profil guru
      const { data: teachers, error: teacherErr } = await supabase
        .from('teacher_profiles')
        .select('id, full_name, user_id')
        .order('full_name', { ascending: true });

      if (teacherErr) throw new Error(teacherErr.message);

      // 3. Filter guru yang statusnya aktif
      return teachers.filter(t => activeUserIds.has(t.user_id));
    },
  });
};
