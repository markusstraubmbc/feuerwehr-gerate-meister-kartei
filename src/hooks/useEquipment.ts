
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Category } from "./useCategories";
import { Location } from "./useLocations";
import { Person } from "./usePersons";

export type Equipment = Database["public"]["Tables"]["equipment"]["Row"] & {
  category?: Category;
  location?: Location;
  responsible_person?: Person;
};

export const useEquipment = () => {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          category:category_id(id, name),
          location:location_id(id, name),
          responsible_person:responsible_person_id(id, first_name, last_name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Equipment[];
    },
  });
};
