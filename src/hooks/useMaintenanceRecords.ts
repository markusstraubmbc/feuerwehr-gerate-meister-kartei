import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { MaintenanceTemplate } from "./useMaintenanceTemplates";

export type MaintenanceRecord = Database["public"]["Tables"]["maintenance_records"]["Row"] & {
  equipment: Database["public"]["Tables"]["equipment"]["Row"];
  template: MaintenanceTemplate | null;
  performer: Database["public"]["Tables"]["persons"]["Row"] | null;
  documentation_image_url?: string | null;
  minutes_spent?: number | null;
};

// Different sorting methods based on status
const getOrderingForStatus = (status: Database["public"]["Enums"]["maintenance_status"] | null) => {
  switch(status) {
    case "abgeschlossen":
      // For completed records, order by performed date descending (newest first)
      return { column: 'performed_date', ascending: false };
    case "ausstehend":
    case "geplant":
    case "in_bearbeitung":
    default:
      // For pending records, order by due date ascending (most urgent first)
      return { column: 'due_date', ascending: true };
  }
};

export const useMaintenanceRecords = (statusFilter?: Database["public"]["Enums"]["maintenance_status"]) => {
  return useQuery({
    queryKey: ["maintenance-records", statusFilter],
    queryFn: async () => {
      const ordering = getOrderingForStatus(statusFilter);
      
      // Build the query with proper sorting based on status
      let query = supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment_id (*),
          template:template_id (*),
          performer:performed_by (*)
        `)
        .order(ordering.column, { ascending: ordering.ascending });
      
      // Apply status filter if provided
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;

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

// Function to get latest comments for an equipment
export const getLatestEquipmentComments = async (equipmentId: string, limit: number = 5): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_equipment_comments', { 
      equipment_id_param: equipmentId 
    });
    
    if (error) {
      console.error("Error loading comments:", error);
      return [];
    }
    
    return Array.isArray(data) ? (data as any[]).slice(0, limit) : [];
  } catch (error) {
    console.error("Error loading comments:", error);
    return [];
  }
};

// Function to generate custom checklist
export const generateCustomChecklist = async (record: MaintenanceRecord): Promise<Blob | null> => {
  try {
    // Get template checks if available
    let checksList = [];
    
    if (record.template?.checks && Array.isArray(record.template.checks)) {
      checksList = record.template.checks;
    } else if (record.template?.checks && typeof record.template.checks === 'string') {
      try {
        checksList = JSON.parse(record.template.checks);
      } catch (e) {
        console.error("Error parsing checks from template:", e);
        checksList = [];
      }
    }
    
    // If no checks, add defaults
    if (!checksList || checksList.length === 0) {
      checksList = [
        "Sichtprüfung durchführen",
        "Funktionsprüfung durchführen",
        "Sicherheitsprüfung durchführen"
      ];
      
      if (record.template?.description) {
        checksList.push(record.template.description);
      }
      
      checksList.push("Dokumentation der Prüfung vervollständigen");
    }

    // Get latest 5 comments for the equipment
    const latestComments = await getLatestEquipmentComments(record.equipment_id, 5);

    // Create check items HTML
    const checksHtml = checksList.map(check => 
      `<div class="check-item">${check}</div>`
    ).join('\n');
    
    // Create comments HTML if there are any
    let commentsHtml = '';
    if (latestComments && latestComments.length > 0) {
      commentsHtml = `
        <h2>LETZTE 5 KOMMENTARE:</h2>
        <div class="comments-section">
          ${latestComments.map(comment => `
            <div class="comment">
              <div class="comment-header">
                <strong>${comment.person?.first_name} ${comment.person?.last_name}</strong> 
                <span class="comment-date">${new Date(comment.created_at).toLocaleDateString('de-DE')}</span>
              </div>
              <div class="comment-content">${comment.comment}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Create a more detailed PDF-like content with proper formatting
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Wartungscheckliste - ${record.equipment.name}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.3; 
              font-size: 8pt; 
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px; 
              font-size: 12pt;
              margin-top: 0;
            }
            h2 { 
              color: #555; 
              margin-top: 15px; 
              font-size: 10pt;
              margin-bottom: 8px;
            }
            .info-section { 
              margin: 15px 0; 
              border: 1px solid #ddd; 
              padding: 10px; 
              border-radius: 4px; 
            }
            .info-row { 
              display: flex; 
              margin-bottom: 6px; 
            }
            .info-label { 
              font-weight: bold; 
              width: 160px; 
            }
            .check-item { 
              margin: 8px 0; 
              padding-left: 25px; 
              position: relative; 
            }
            .check-item:before { 
              content: "☐"; 
              position: absolute; 
              left: 0; 
              top: 0; 
              font-size: 1.1em; 
            }
            .signature-section { 
              margin-top: 25px; 
              border-top: 1px solid #ccc; 
              padding-top: 15px; 
            }
            .signature-line { 
              margin-top: 40px; 
              border-top: 1px solid #000; 
              width: 200px; 
            }
            .time-info { 
              background-color: #f8f9fa; 
              padding: 6px; 
              border-radius: 4px; 
              margin-top: 10px; 
            }
            .comments-section {
              margin-top: 10px;
              border: 1px solid #eee;
              padding: 6px;
              font-size: 7pt;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .comment {
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 1px dotted #ccc;
            }
            .comment:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .comment-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .comment-date {
              color: #777;
              font-size: 6pt;
            }
            .comment-content {
              margin-top: 3px;
            }
            @media print {
                @page { size: portrait; }
                body { font-size: 8pt; }
                .no-print { display: none; }
                .page-break { page-break-after: always; }
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
                <div class="info-label">Seriennummer:</div>
                <div>${record.equipment.serial_number || 'Nicht zugewiesen'}</div>
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
            
            <div class="time-info">
                <div class="info-row">
                    <div class="info-label">Geschätzte Wartungszeit:</div>
                    <div>${record.template?.estimated_minutes ? `${record.template.estimated_minutes} Minuten` : 'Nicht definiert'}</div>
                </div>
            </div>
        </div>
        
        <h2>DURCHZUFÜHRENDE PRÜFUNGEN:</h2>
        
        ${checksHtml}
        
        ${commentsHtml}
        
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
                <div class="info-label">Benötigte Zeit (Min):</div>
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
