
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Category } from "./useCategories";

export type MaintenanceTemplate = Database["public"]["Tables"]["maintenance_templates"]["Row"] & {
  category?: Category | null;
};

export const useMaintenanceTemplates = () => {
  return useQuery({
    queryKey: ["maintenance-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_templates")
        .select(`
          *,
          category:category_id (*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MaintenanceTemplate[];
    },
  });
};
