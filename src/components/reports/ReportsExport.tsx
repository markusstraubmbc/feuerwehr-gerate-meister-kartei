
import * as XLSX from 'xlsx';
import { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { MaintenanceTemplate } from "@/hooks/useMaintenanceTemplates";
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Equipment } from "@/hooks/useEquipment";
import { supabase } from "@/integrations/supabase/client";

interface ExportCompletedReportsProps {
  records: MaintenanceRecord[];
  reportType: 'completed';
  templateName?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ExportUpcomingReportsProps {
  templates: MaintenanceTemplate[];
  reportType: 'upcoming';
  timeframe: string;
  endDate: Date;
}

type ExportReportsProps = ExportCompletedReportsProps | ExportUpcomingReportsProps;

export const exportReportsToExcel = (props: ExportReportsProps) => {
  if (props.reportType === 'completed') {
    exportCompletedReports(props);
  } else {
    exportUpcomingReports(props);
  }
};

const exportCompletedReports = ({ records, templateName, startDate, endDate }: ExportCompletedReportsProps) => {
  // Basic report info
  const exportData = records.map(record => ({
    'Ausrüstung': record.equipment.name,
    'Wartungsvorlage': record.template?.name || 'Keine Vorlage',
    'Durchgeführt am': record.performed_date ? 
      format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : '-',
    'Verantwortlich': record.performer ? 
      `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen',
    'Zeit (Minuten)': record.minutes_spent || '-',
    'Geplant für': format(new Date(record.due_date), "dd.MM.yyyy", { locale: de }),
    'Inventarnummer': record.equipment.inventory_number || '-',
    'Standort': record.equipment.location_id ? 
      (record.equipment?.location?.name || 'Nicht zugewiesen') : 'Nicht zugewiesen',
    'Kategorie': record.equipment.category_id ?
      (record.equipment?.category?.name || 'Nicht zugewiesen') : 'Nicht zugewiesen',
    'Notizen': record.notes || '-'
  }));
  
  // Create worksheet with data
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Add report metadata at the top
  const metadataWs = XLSX.utils.aoa_to_sheet([
    ['Abgeschlossene Wartungen Bericht'],
    [''],
    ['Wartungsvorlage:', templateName || 'Alle'],
    ['Zeitraum:', `${startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : 'Unbegrenzt'} bis ${endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : 'Heute'}`],
    ['Anzahl Wartungen:', records.length.toString()],
    ['Gesamtzeit (Minuten):', records.reduce((total, record) => total + (record.minutes_spent || 0), 0).toString()],
    ['Bericht erstellt am:', format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })],
    [''],
  ]);
  
  // Create workbook and append both sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, metadataWs, 'Übersicht');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wartungsdaten');
  
  // Generate filename
  const dateString = format(new Date(), "yyyy-MM-dd", { locale: de });
  const fileName = `Abgeschlossene-Wartungen-${templateName ? templateName.replace(/\s+/g, '-') : 'Alle'}-${dateString}.xlsx`;
  
  // Write file
  XLSX.writeFile(workbook, fileName);
  toast.success(`Bericht wurde als ${fileName} exportiert`);
};

const exportUpcomingReports = async ({ templates, timeframe, endDate }: ExportUpcomingReportsProps) => {
  // This needs to be calculated here since we're outside of a React component
  try {
    const { data: equipmentList, error: equipmentError } = await supabase
      .from("equipment")
      .select(`
        *,
        category:category_id (*),
        location:location_id (*)
      `)
      .order('name', { ascending: true });
      
    if (equipmentError) throw equipmentError;
    
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("*")
      .order('last_name', { ascending: true });
      
    if (personsError) throw personsError;
    
    const { data: records, error: recordsError } = await supabase
      .from("maintenance_records")
      .select(`
        *,
        equipment:equipment_id (*),
        template:template_id (*),
        performer:performed_by (*)
      `);
      
    if (recordsError) throw recordsError;
    
    const now = new Date();
    const upcomingMaintenance: any[] = [];
    
    for (const equipment of equipmentList || []) {
      const relevantTemplates = equipment.category_id 
        ? templates.filter(template => 
            template.category_id === equipment.category_id || 
            !template.category_id
          )
        : templates;
      
      for (const template of relevantTemplates) {
        if (!template.interval_months) continue;
        
        const relatedRecords = records?.filter(
          record => record.equipment_id === equipment.id && record.template_id === template.id
        ).sort((a, b) => 
          new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime()
        ) || [];
        
        const lastRecord = relatedRecords[0];
        
        let lastDate;
        if (lastRecord?.performed_date) {
          lastDate = new Date(lastRecord.performed_date);
        } else {
          lastDate = now;
        }
        
        const nextDueDate = addMonths(lastDate, template.interval_months);
        
        // Only include if due date is before end date
        if (nextDueDate <= endDate) {
          const daysRemaining = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          upcomingMaintenance.push({
            equipment,
            template,
            nextDueDate,
            daysRemaining,
            existingRecord: relatedRecords.find(r => 
              format(new Date(r.due_date), "yyyy-MM-dd") === format(nextDueDate, "yyyy-MM-dd")
            ),
            responsiblePerson: template.responsible_person_id ? 
              persons?.find(person => person.id === template.responsible_person_id) : null
          });
        }
      }
    }
    
    const sortedMaintenance = upcomingMaintenance.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
    
    if (sortedMaintenance.length === 0) {
      toast.info("Keine anstehenden Wartungen für den gewählten Zeitraum gefunden");
      return;
    }
    
    // Create worksheet with data
    const exportData = sortedMaintenance.map(item => ({
      'Fällig am': format(item.nextDueDate, "dd.MM.yyyy", { locale: de }),
      'Ausrüstung': item.equipment.name,
      'Inventarnummer': item.equipment.inventory_number || '-',
      'Wartungsvorlage': item.template.name,
      'Verantwortlich': item.responsiblePerson ? 
        `${item.responsiblePerson.first_name} ${item.responsiblePerson.last_name}` : 
        'Nicht zugewiesen',
      'Verbleibende Tage': item.daysRemaining,
      'Status': item.existingRecord ? 'Geplant' : 'Nicht geplant',
      'Standort': item.equipment?.location?.name || 'Nicht zugewiesen',
      'Kategorie': item.equipment?.category?.name || 'Nicht zugewiesen',
      'Intervall (Monate)': item.template.interval_months
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Format timeframe for display
    const getTimeframeLabel = () => {
      switch (timeframe) {
        case "week": return "nächste Woche";
        case "month": return "nächster Monat";
        case "quarter": return "nächstes Quartal";
        case "year": return "nächstes Jahr";
        default: return "nächster Monat";
      }
    };
    
    // Add report metadata at the top
    const metadataWs = XLSX.utils.aoa_to_sheet([
      ['Anstehende Wartungen Bericht'],
      [''],
      ['Zeitraum:', `${getTimeframeLabel()} (bis ${format(endDate, "dd.MM.yyyy", { locale: de })})`],
      ['Wartungsvorlagen:', templates.length === 1 
        ? templates[0].name 
        : `Alle (${templates.length} Vorlagen)`],
      ['Anzahl anstehende Wartungen:', sortedMaintenance.length.toString()],
      ['Bericht erstellt am:', format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })],
      [''],
    ]);
    
    // Create workbook and append both sheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, metadataWs, 'Übersicht');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Anstehende Wartungen');
    
    // Generate filename
    const dateString = format(new Date(), "yyyy-MM-dd", { locale: de });
    const fileName = `Anstehende-Wartungen-${timeframe}-${dateString}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, fileName);
    toast.success(`Bericht wurde als ${fileName} exportiert`);
  } catch (error) {
    console.error("Error exporting upcoming maintenance report:", error);
    toast.error("Fehler beim Exportieren des Berichts");
  }
};
