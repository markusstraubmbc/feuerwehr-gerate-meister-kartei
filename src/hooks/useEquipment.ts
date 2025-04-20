
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Category } from "./useCategories";
import { Location } from "./useLocations";
import { Person } from "./usePersons";

export type Equipment = Database["public"]["Tables"]["equipment"]["Row"] & {
  category?: Category | null;
  location?: Location | null;
  responsible_person?: Person | null;
};

export const useEquipment = () => {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          category:category_id (*),
          location:location_id (*),
          responsible_person:responsible_person_id (*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Equipment[];
    },
  });
};

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from("equipment")
    .select(`
      *,
      category:category_id (*),
      location:location_id (*),
      responsible_person:responsible_person_id (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching equipment:", error);
    return null;
  }

  return data as Equipment;
};
