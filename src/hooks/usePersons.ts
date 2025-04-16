
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Person = Database["public"]["Tables"]["persons"]["Row"];

export const usePersons = () => {
  return useQuery({
    queryKey: ["persons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("persons")
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return data as Person[];
    },
  });
};
