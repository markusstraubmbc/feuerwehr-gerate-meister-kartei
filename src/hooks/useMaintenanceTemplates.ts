
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Category } from "./useCategories";
import { Person } from "./usePersons";

export type MaintenanceTemplate = Database["public"]["Tables"]["maintenance_templates"]["Row"] & {
  category?: Category | null;
  responsible_person?: Person | null;
  checklist_url?: string | null;
  average_minutes_spent?: number;
  estimated_minutes?: number;
  checks?: string[];
};

export const useMaintenanceTemplates = () => {
  return useQuery({
    queryKey: ["maintenance-templates"],
    queryFn: async () => {
      // First get the templates
      const { data: templates, error } = await supabase
        .from("maintenance_templates")
        .select(`
          *,
          category:category_id (*),
          responsible_person:responsible_person_id (*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      // Now get the average minutes spent for each template
      const templatesWithStats = await Promise.all(
        templates.map(async (template) => {
          const { data: records, error: recordsError } = await supabase
            .from("maintenance_records")
            .select("minutes_spent")
            .eq("template_id", template.id)
            .eq("status", "abgeschlossen")
            .not("minutes_spent", "is", null);

          if (recordsError) console.error("Error fetching template stats:", recordsError);

          let average_minutes_spent = 0;
          if (records && records.length > 0) {
            const total = records.reduce((sum, record) => sum + (record.minutes_spent || 0), 0);
            average_minutes_spent = Math.round(total / records.length);
          }

          // Parse the checks JSON field if it exists
          let checks: string[] = [];
          if (template.checks) {
            try {
              checks = JSON.parse(template.checks as string);
            } catch (e) {
              console.error("Error parsing checks:", e);
            }
          }

          return {
            ...template,
            average_minutes_spent,
            checks: checks
          };
        })
      );

      return templatesWithStats as MaintenanceTemplate[];
    },
  });
};
