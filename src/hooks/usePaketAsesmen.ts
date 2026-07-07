import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaketAsesmen, PaketAsesmenInput, PaketAsesmenFilter } from '@/types/paketAsesmen';
import { toast } from '@/hooks/use-toast';

type GenerateSoalArgs = {
  paketId: string;
  kategori?: string;
  subAspek?: string;
  tingkatKesulitan?: string;
  tipeSoal?: string;
  jumlahSoal: number;
};

function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
      tipeSoal,
      jumlahSoal,
    }: GenerateSoalArgs) => {
      let query = supabase
        .from('bank_soal')
        .select('id, tipe_soal')
        .eq('aktif', true);

      if (kategori) {
        query = query.eq('kategori', kategori);
      }
      if (subAspek) {
        query = query.eq('sub_aspek', subAspek);
      }
      if (tingkatKesulitan) {
        query = query.eq('tingkat_kesulitan', tingkatKesulitan);
      }
      if (tipeSoal && tipeSoal !== 'all') {
        query = query.eq('tipe_soal', tipeSoal);
      }

      const { data: existingRows, error: existingError } = await supabase
        .from('paket_asesmen_soal')
        .select('soal_id')
        .eq('paket_id', paketId);

      if (existingError) throw new Error(existingError.message);

      const existingIds = new Set((existingRows ?? []).map((row) => row.soal_id));
      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const available = shuffleArray((data ?? []).filter((row) => !existingIds.has(row.id)));
      const selected = available.slice(0, jumlahSoal);

      if (selected.length === 0) {
        return 0;
      }

      const payload = selected.map((row) => ({
        paket_id: paketId,
        soal_id: row.id,
      }));

      const { error: insertError } = await supabase
        .from('paket_asesmen_soal')
        .insert(payload);

      if (insertError) throw new Error(insertError.message);
      return payload.length;
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
