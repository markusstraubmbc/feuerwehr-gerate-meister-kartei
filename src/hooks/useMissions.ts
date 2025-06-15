
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Mission = Database["public"]["Tables"]["missions"]["Row"] & {
  // responsible_person is removed since responsible_person_id is dropped
  equipment_count?: number;
};

export const useMissions = () => {
  return useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          *,
          mission_equipment(count)
        `)
        .order('mission_date', { ascending: false });

      if (error) throw error;
      return data.map(mission => ({
        ...mission,
        equipment_count: mission.mission_equipment?.[0]?.count || 0
      })) as Mission[];
    },
  });
};
