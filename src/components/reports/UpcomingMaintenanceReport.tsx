
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";
import { MaintenanceTemplate } from "@/hooks/useMaintenanceTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePersons } from "@/hooks/usePersons";
import { useEquipment } from "@/hooks/useEquipment";

interface UpcomingMaintenanceReportProps {
  templates: MaintenanceTemplate[];
  timeframe: string;
  endDate: Date;
  records: MaintenanceRecord[];
}

type UpcomingMaintenance = {
  equipment: any;
  template: MaintenanceTemplate;
  nextDueDate: Date;
  responsiblePerson: any;
  existingRecord: MaintenanceRecord | undefined;
  daysRemaining: number;
};

export function UpcomingMaintenanceReport({
  templates,
  timeframe,
  endDate,
  records
}: UpcomingMaintenanceReportProps) {
  const { data: persons = [] } = usePersons();
  const { data: equipmentList = [] } = useEquipment();
  
  // Calculate upcoming maintenance
  const calculateUpcomingMaintenance = (): UpcomingMaintenance[] => {
    const now = new Date();
    const upcomingMaintenance: UpcomingMaintenance[] = [];
    
    for (const equipment of equipmentList) {
      const relevantTemplates = equipment.category_id 
        ? templates.filter(template => 
            template.category_id === equipment.category_id || 
            !template.category_id
          )
        : templates;
      
      for (const template of relevantTemplates) {
        if (!template.interval_months) continue;
        
        const relatedRecords = records.filter(
          record => record.equipment_id === equipment.id && record.template_id === template.id
        ).sort((a, b) => 
          new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime()
        );
        
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
              persons.find(person => person.id === template.responsible_person_id) : null
          });
        }
      }
    }
    
    return upcomingMaintenance.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  };
  
  const upcomingMaintenance = calculateUpcomingMaintenance();
  
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
  
  // Report generation date
  const generationDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: de });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Anstehende Wartungen Bericht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Zeitraum:</strong></div>
              <div>{getTimeframeLabel()} (bis {format(endDate, "dd.MM.yyyy", { locale: de })})</div>
              <div><strong>Wartungsvorlagen:</strong></div>
              <div>
                {templates.length === 1 
                  ? templates[0].name 
                  : `Alle (${templates.length} Vorlagen)`}
              </div>
              <div><strong>Anzahl anstehende Wartungen:</strong></div>
              <div>{upcomingMaintenance.length}</div>
              <div><strong>Bericht erstellt am:</strong></div>
              <div>{generationDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste anstehender Wartungen</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMaintenance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fällig am</TableHead>
                  <TableHead>Ausrüstung</TableHead>
                  <TableHead>Wartungstyp</TableHead>
                  <TableHead>Verantwortlich</TableHead>
                  <TableHead>Tage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingMaintenance.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(item.nextDueDate, "dd.MM.yyyy", { locale: de })}</TableCell>
                    <TableCell>{item.equipment.name}</TableCell>
                    <TableCell>{item.template.name}</TableCell>
                    <TableCell>
                      {item.responsiblePerson 
                        ? `${item.responsiblePerson.first_name} ${item.responsiblePerson.last_name}`
                        : "Nicht zugewiesen"}
                    </TableCell>
                    <TableCell>
                      <span className={item.daysRemaining < 7 ? "text-red-500 font-bold" : ""}>
                        {item.daysRemaining}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.existingRecord ? (
                        <span className="text-green-600">Geplant</span>
                      ) : (
                        <span className="text-amber-600">Nicht geplant</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              Keine anstehenden Wartungen gefunden für diesen Zeitraum
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
