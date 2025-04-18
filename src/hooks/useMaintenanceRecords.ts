
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
    // Create a more detailed PDF-like content with proper formatting
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Wartungscheckliste - ${record.equipment.name}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 20px; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { font-weight: bold; width: 200px; }
            .check-item { margin: 15px 0; padding-left: 30px; position: relative; }
            .check-item:before { content: "☐"; position: absolute; left: 0; top: 0; font-size: 1.2em; }
            .signature-section { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
            .signature-line { margin-top: 70px; border-top: 1px solid #000; width: 250px; }
            @media print {
                body { font-size: 12pt; }
                .no-print { display: none; }
            }
        </style>
        <script>
            window.onload = function() {
                // Auto-trigger print dialog when the document is loaded
                window.print();
            };
        </script>
    </head>
    <body>
        <h1>WARTUNGSCHECKLISTE</h1>
        
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Ausrüstung:</div>
                <div>${record.equipment.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Inventarnummer:</div>
                <div>${record.equipment.inventory_number || 'Nicht zugewiesen'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Wartungstyp:</div>
                <div>${record.template?.name || 'Keine Vorlage'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fällig am:</div>
                <div>${new Date(record.due_date).toLocaleDateString('de-DE')}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Verantwortlich:</div>
                <div>${record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen'}</div>
            </div>
        </div>
        
        <h2>DURCHZUFÜHRENDE PRÜFUNGEN:</h2>
        
        <div class="check-item">Sichtprüfung durchführen</div>
        <div class="check-item">Funktionsprüfung durchführen</div>
        <div class="check-item">Sicherheitsprüfung durchführen</div>
        ${record.template?.description ? `<div class="check-item">${record.template.description}</div>` : ''}
        <div class="check-item">Dokumentation der Prüfung vervollständigen</div>
        
        <div class="signature-section">
            <h2>BESTÄTIGUNG:</h2>
            <div class="info-row">
                <div class="info-label">Durchgeführt von:</div>
                <div>________________________</div>
            </div>
            <div class="info-row">
                <div class="info-label">Datum:</div>
                <div>________________________</div>
            </div>
            <div class="info-row">
                <div class="info-label">Unterschrift:</div>
                <div class="signature-line"></div>
            </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Drucken</button>
        </div>
    </body>
    </html>
    `;
    
    // Convert HTML to a Blob
    const blob = new Blob([content], { type: 'text/html' });
    return blob;
  } catch (error) {
    console.error("Error generating custom checklist:", error);
    return null;
  }
};
