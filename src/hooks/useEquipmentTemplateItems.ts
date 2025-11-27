import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TemplateItem = Database["public"]["Tables"]["template_equipment_items"]["Row"] & {
  template: Database["public"]["Tables"]["mission_equipment_templates"]["Row"];
};

export const useEquipmentTemplateItems = (equipmentId: string) => {
  return useQuery({
    queryKey: ["equipment-template-items", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_equipment_items")
        .select(`
          *,
          template:template_id (*)
        `)
        .eq("equipment_id", equipmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!equipmentId,
  });
};
