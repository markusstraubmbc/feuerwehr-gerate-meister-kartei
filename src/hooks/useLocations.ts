
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Location = Database["public"]["Tables"]["locations"]["Row"];

export const useLocations = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Location[];
    },
  });
};
