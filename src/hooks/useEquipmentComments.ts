
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentComment {
  id: string;
  equipment_id: string;
  person_id: string;
  comment: string;
  created_at: string;
  action_id?: string | null;
  person: {
    id: string;
    first_name: string;
    last_name: string;
  };
  action?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export const useEquipmentComments = (equipmentId: string) => {
  return useQuery({
    queryKey: ["equipment-comments", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_comments")
        .select(`
          *,
          person:person_id (
            id,
            first_name,
            last_name
          ),
          action:action_id (
            id,
            name,
            description
          )
        `)
        .eq("equipment_id", equipmentId)
        .order("created_at", { ascending: false });
      
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
          *,
          person:person_id (
            id,
            first_name,
            last_name
          ),
          action:action_id (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EquipmentComment[];
    },
  });
};
