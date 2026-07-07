import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BankSoal, BankSoalInput, BankSoalFilter } from '@/types/bankSoal';
import { toast } from '@/hooks/use-toast';

export const useBankSoal = (filters: BankSoalFilter, page: number, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['bank-soal', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('bank_soal')
        .select('*', { count: 'exact' });

      if (filters.kategori) {
        if (filters.kategori === 'Tahsin Dasar') {
          query = query.in('kategori', ['Tahsin Dasar', 'Makhraj']);
        } else if (filters.kategori === 'Tahsin Lanjutan') {
          query = query.in('kategori', ['Tahsin Lanjutan', 'Tajwid', 'Tajwid Lanjutan']);
        } else if (filters.kategori === 'Tahfizh') {
          query = query.in('kategori', ['Tahfizh', 'Metodologi Tahfizh']);
        } else {
          query = query.eq('kategori', filters.kategori);
        }
      }
      if (filters.sub_aspek) {
        query = query.eq('sub_aspek', filters.sub_aspek);
      }
      if (filters.tingkat_kesulitan) {
        query = query.eq('tingkat_kesulitan', filters.tingkat_kesulitan);
      }
      if (filters.level_kognitif) {
        query = query.eq('level_kognitif', filters.level_kognitif);
      }
      if (filters.search) {
        query = query.ilike('soal', `%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data as BankSoal[],
        count: count || 0,
      };
    },
  });
};

export const useBankSoalDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['bank-soal-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_soal')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as BankSoal;
    },
  });
};

export const useCreateBankSoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BankSoalInput) => {
      const { data, error } = await supabase
        .from('bank_soal')
        .insert([input])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BankSoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal'] });
      toast({ title: "Berhasil", description: "Soal baru berhasil ditambahkan." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateBankSoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BankSoalInput> }) => {
      const { data, error } = await supabase
        .from('bank_soal')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as BankSoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', data.id] });
      toast({ title: "Berhasil", description: "Soal berhasil diperbarui." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteBankSoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_soal')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal'] });
      toast({ title: "Berhasil", description: "Soal berhasil dihapus." });
    },
    onError: (error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
};
