
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MaintenanceRecord = Database["public"]["Tables"]["maintenance_records"]["Row"] & {
  equipment: Database["public"]["Tables"]["equipment"]["Row"];
  template: Database["public"]["Tables"]["maintenance_templates"]["Row"] | null;
  performer: Database["public"]["Tables"]["persons"]["Row"] | null;
  documentation_image_url?: string | null;
  minutes_spent?: number | null;
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

// Function to get checklist URL for a template
export const getTemplateChecklistUrl = async (templateId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .storage
      .from('checklists')
      .createSignedUrl(`templates/${templateId}.pdf`, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    return data?.signedUrl || null;
  } catch (error) {
    console.error("Error getting checklist URL:", error);
    return null;
  }
};

// Function to generate custom checklist
export const generateCustomChecklist = async (record: MaintenanceRecord): Promise<Blob | null> => {
  try {
    // This is a simplified example. In a real-world scenario, you would use a PDF generation 
    // library like jspdf or pdfmake, or call a serverless function to generate the PDF.
    // Since we're in a browser environment, we'll create a simple PDF-like blob
    
    const text = `
      WARTUNGSCHECKLISTE
      
      Ausrüstung: ${record.equipment.name}
      Inventarnummer: ${record.equipment.inventory_number || 'N/A'}
      Wartungstyp: ${record.template?.name || 'Keine Vorlage'}
      Fällig am: ${new Date(record.due_date).toLocaleDateString('de-DE')}
      Verantwortlich: ${record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen'}
      
      DURCHZUFÜHRENDE PRÜFUNGEN:
      - Sichtprüfung
      - Funktionsprüfung
      - Sicherheitsprüfung
      
      Bestätigung der Durchführung: __________________
      
      Datum: __________________
    `;
    
    const blob = new Blob([text], { type: 'application/pdf' });
    return blob;
  } catch (error) {
    console.error("Error generating custom checklist:", error);
    return null;
  }
};
