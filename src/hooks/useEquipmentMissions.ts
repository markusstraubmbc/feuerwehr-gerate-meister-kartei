import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mission } from "./useMissions";

export interface EquipmentMission {
  id: string;
  mission_id: string;
  equipment_id: string;
  added_at: string;
  added_by: string | null;
  notes: string | null;
  mission: Mission;
  added_by_person?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const useEquipmentMissions = (equipmentId: string) => {
  return useQuery({
    queryKey: ["equipment-missions", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_equipment")
        .select(`
          *,
          mission:mission_id(*),
          added_by_person:added_by(id, first_name, last_name)
        `)
        .eq('equipment_id', equipmentId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as EquipmentMission[];
    },
    enabled: !!equipmentId,
  });
};
