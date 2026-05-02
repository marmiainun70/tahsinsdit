import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InstitutionSettings {
  id: string;
  nama_lembaga: string;
  alamat: string;
  logo_url: string | null;
  koordinator_nama: string;
  koordinator_ttd_url: string | null;
  kepsek_nama: string;
  kepsek_ttd_url: string | null;
  updated_at: string;
  updated_by: string | null;
}

const sb = supabase as any;

export const useInstitutionSettings = () =>
  useQuery({
    queryKey: ["institution_settings"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("institution_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as InstitutionSettings | null;
    },
  });

export const useUpdateInstitutionSettings = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<InstitutionSettings> & { id?: string }) => {
      const { id, ...rest } = patch;
      const payload = { ...rest, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };
      if (id) {
        const { data, error } = await sb.from("institution_settings").update(payload).eq("id", id).select().single();
        if (error) throw error;
        return data as InstitutionSettings;
      }
      const { data, error } = await sb.from("institution_settings").insert(payload).select().single();
      if (error) throw error;
      return data as InstitutionSettings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution_settings"] }),
  });
};

/** Upload PNG/JPG ke bucket `institution`, return public URL */
export const uploadInstitutionAsset = async (file: File, kind: "logo" | "koordinator" | "kepsek"): Promise<string> => {
  const ext = file.name.split(".").pop() || "png";
  const path = `${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("institution").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("institution").getPublicUrl(path);
  return data.publicUrl;
};
