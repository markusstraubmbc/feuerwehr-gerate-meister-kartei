import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentCommentRecord {
  id: string;
  comment: string;
  created_at: string;
  equipment_id: string;
  person_id: string;
  action_id: string | null;
  equipment?: {
    id: string;
    name: string;
    inventory_number: string | null;
    category_id: string | null;
  };
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  action?: {
    id: string;
    name: string;
  };
}

export const useEquipmentCommentRecords = () => {
  return useQuery({
    queryKey: ["equipment-comment-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_comments")
        .select(`
          *,
          equipment:equipment_id(id, name, inventory_number, category_id),
          person:person_id(id, first_name, last_name),
          action:action_id(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EquipmentCommentRecord[];
    },
  });
};
