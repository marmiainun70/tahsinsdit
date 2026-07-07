import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaketAsesmen, PaketAsesmenInput, PaketAsesmenFilter } from '@/types/paketAsesmen';
import { toast } from '@/hooks/use-toast';
import { selectSoalForPaket } from '@/lib/paketAsesmenGeneration';

type GenerateSoalArgs = {
  paketId: string;
  kategori?: string;
  subAspek?: string;
  tingkatKesulitan?: string;
  tipeSoal?: string;
  jumlahSoal: number;
};

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
        .select('id, kategori, sub_aspek, tingkat_kesulitan, tipe_soal')
        .eq('aktif', true);

      if (kategori) {
        if (kategori === 'Tahsin Dasar') {
          query = query.in('kategori', ['Tahsin Dasar', 'Makhraj']);
        } else if (kategori === 'Tahsin Lanjutan') {
          query = query.in('kategori', ['Tahsin Lanjutan', 'Tajwid', 'Tajwid Lanjutan']);
        } else if (kategori === 'Tahfizh') {
          query = query.in('kategori', ['Tahfizh', 'Metodologi Tahfizh']);
        } else {
          query = query.eq('kategori', kategori);
        }
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

      const selected = selectSoalForPaket(
        (data ?? []).map((row) => ({
          id: row.id,
          kategori: row.kategori,
          sub_aspek: row.sub_aspek,
          tingkat_kesulitan: row.tingkat_kesulitan,
          tipe_soal: row.tipe_soal,
          aktif: true,
        })),
        existingIds,
        {
          kategori,
          subAspek,
          tingkatKesulitan,
          tipeSoal,
        },
        jumlahSoal,
      );

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
