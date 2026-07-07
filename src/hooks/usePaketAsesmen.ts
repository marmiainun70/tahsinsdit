import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaketAsesmen, PaketAsesmenInput, PaketAsesmenFilter } from '@/types/paketAsesmen';
import { toast } from '@/hooks/use-toast';

export const usePaketAsesmen = (filters: PaketAsesmenFilter, page: number, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['paket-asesmen', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('paket_asesmen')
        .select('*', { count: 'exact' });

      if (filters.jenis_asesmen) {
        query = query.eq('jenis_asesmen', filters.jenis_asesmen);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('nama_paket', `%${filters.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      return {
        data: data as PaketAsesmen[],
        count: count || 0,
      };
    },
  });
};

export const useCreatePaketAsesmen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PaketAsesmenInput) => {
      const { data, error } = await supabase
        .from('paket_asesmen')
        .insert([input])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PaketAsesmen;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paket-asesmen'] });
      toast({ title: "Berhasil", description: "Paket asesmen baru berhasil ditambahkan." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdatePaketAsesmen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<PaketAsesmenInput> }) => {
      const { data, error } = await supabase
        .from('paket_asesmen')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PaketAsesmen;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paket-asesmen'] });
      toast({ title: "Berhasil", description: "Paket asesmen berhasil diperbarui." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeletePaketAsesmen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('paket_asesmen')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paket-asesmen'] });
      toast({ title: "Berhasil", description: "Paket asesmen berhasil dihapus." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useGenerateSoalOtomatis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paketId,
      kategori,
      subAspek,
      tingkatKesulitan,
      jumlahSoal
    }: {
      paketId: string;
      kategori?: string;
      subAspek?: string;
      tingkatKesulitan?: string;
      jumlahSoal: number;
    }) => {
      const { data, error } = await supabase.rpc('generate_random_soal_for_paket', {
        p_paket_id: paketId,
        p_kategori: kategori || null,
        p_sub_aspek: subAspek || null,
        p_tingkat_kesulitan: tingkatKesulitan || null,
        p_jumlah_soal: jumlahSoal
      });

      if (error) throw new Error(error.message);
      return data as number; // returns inserted_count
    },
    onSuccess: (count) => {
      // Invalidate queries that fetch the questions for this package
      queryClient.invalidateQueries({ queryKey: ['paket-asesmen-soal'] });
      toast({ title: "Berhasil", description: `${count} soal berhasil digenerate dan ditambahkan ke paket.` });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};
