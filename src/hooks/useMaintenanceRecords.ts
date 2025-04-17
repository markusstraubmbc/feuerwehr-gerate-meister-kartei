
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MaintenanceRecord = Database["public"]["Tables"]["maintenance_records"]["Row"] & {
  equipment: Database["public"]["Tables"]["equipment"]["Row"];
  template: Database["public"]["Tables"]["maintenance_templates"]["Row"] | null;
  performer: Database["public"]["Tables"]["persons"]["Row"] | null;
  documentation_image_url?: string | null;
};

export const useMaintenanceRecords = () => {
  return useQuery({
    queryKey: ["maintenance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment_id (*),
          template:template_id (*),
          performer:performed_by (*)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Generate signed URLs for documentation images if they exist
      const recordsWithUrls = await Promise.all(
        (data || []).map(async (record) => {
          if (record.documentation_image_url) {
            const { data: signedUrlData } = await supabase
              .storage
              .from('maintenance_docs')
              .createSignedUrl(record.documentation_image_url, 60 * 60); // 1 hour expiry
            
            return { 
              ...record, 
              documentation_image_url: signedUrlData?.signedUrl || record.documentation_image_url 
            };
          }
          return record;
        })
      );
      
      return recordsWithUrls as MaintenanceRecord[];
    },
  });
};
