
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentComment {
  id: string;
  equipment_id: string;
  person_id: string;
  comment: string;
  created_at: string;
  person: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const useEquipmentComments = (equipmentId: string) => {
  return useQuery({
    queryKey: ["equipment-comments", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_equipment_comments', {
        equipment_id_param: equipmentId
      });
      
      if (error) throw error;
      return data as EquipmentComment[];
    },
    enabled: !!equipmentId,
  });
};

export const useAllEquipmentComments = () => {
  return useQuery({
    queryKey: ["all-equipment-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_comments")
        .select(`
          id,
          equipment_id,
          person_id,
          comment,
          created_at,
          person:person_id(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
