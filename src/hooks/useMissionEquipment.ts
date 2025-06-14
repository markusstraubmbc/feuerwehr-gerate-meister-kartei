
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Equipment } from "./useEquipment";
import { Person } from "./usePersons";

export type MissionEquipment = Database["public"]["Tables"]["mission_equipment"]["Row"] & {
  equipment?: Equipment;
  added_by_person?: Person;
};

export const useMissionEquipment = (missionId: string) => {
  return useQuery({
    queryKey: ["mission-equipment", missionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_equipment")
        .select(`
          *,
          equipment:equipment_id(*,
            category:category_id(id, name),
            location:location_id(id, name)
          ),
          added_by_person:added_by(id, first_name, last_name)
        `)
        .eq('mission_id', missionId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as MissionEquipment[];
    },
    enabled: !!missionId,
  });
};
