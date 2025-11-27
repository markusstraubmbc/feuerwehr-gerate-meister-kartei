
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  responsible_person?: Database["public"]["Tables"]["persons"]["Row"] | null;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          responsible_person:responsible_person_id (*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};
