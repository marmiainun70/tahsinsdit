import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  full_name: string;
  role: string;
}

export const useProfiles = () =>
  useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, role");
      if (error) throw error;
      return data as Profile[];
    },
  });

export const useProfileMap = () => {
  const { data: profiles = [] } = useProfiles();
  const map = new Map<string, string>();
  for (const p of profiles) {
    map.set(p.user_id, p.full_name);
  }
  return map;
};
