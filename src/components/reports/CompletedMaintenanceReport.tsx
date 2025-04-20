
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletedMaintenanceReportProps {
  records: MaintenanceRecord[];
  templateName: string;
  startDate?: Date;
  endDate?: Date;
}

export function CompletedMaintenanceReport({
  records,
  templateName,
  startDate,
  endDate
}: CompletedMaintenanceReportProps) {
  const totalMinutes = records.reduce(
    (total, record) => total + (record.minutes_spent || 0), 
    0
  );
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Report generation date
  const generationDate = format(new Date(), "dd.MM.yyyy HH:mm", { locale: de });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Abgeschlossene Wartungen Bericht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Wartungsvorlage:</strong></div>
              <div>{templateName}</div>
              <div><strong>Zeitraum:</strong></div>
              <div>
                {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Unbegrenzt"} bis {" "}
                {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Heute"}
              </div>
              <div><strong>Anzahl Wartungen:</strong></div>
              <div>{records.length}</div>
              <div><strong>Gesamtzeit:</strong></div>
              <div>{hours}h {minutes}min</div>
              <div><strong>Bericht erstellt am:</strong></div>
              <div>{generationDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {records.length > 0 ? (
        records.map(record => (
          <Card key={record.id} className="page-break-inside-avoid">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap justify-between items-center">
                <CardTitle className="text-lg">
                  {record.equipment.name} - {record.template?.name || "Keine Vorlage"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {record.performed_date && format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div><strong>Inventarnummer:</strong> {record.equipment.inventory_number || "Keine"}</div>
                    <div><strong>Verantwortlich:</strong> {record.performer ? 
                      `${record.performer.first_name} ${record.performer.last_name}` : 
                      "Nicht zugewiesen"}</div>
                    <div><strong>Zeit (Minuten):</strong> {record.minutes_spent || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <div><strong>Standort:</strong> {record.equipment.location_id ? 
                      (record.equipment.location?.name || "Nicht zugewiesen") : "Nicht zugewiesen"}</div>
                    <div><strong>Kategorie:</strong> {record.equipment.category_id ? 
                      (record.equipment.category?.name || "Nicht zugewiesen") : "Nicht zugewiesen"}</div>
                    <div><strong>Ausgeführt am:</strong> {record.performed_date ? 
                      format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : 
                      "-"}</div>
                  </div>
                </div>
                
                {record.notes && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold mb-1">Anmerkungen:</h4>
                    <div className="border rounded p-2 whitespace-pre-wrap text-sm">{record.notes}</div>
                  </div>
                )}
                
                {record.documentation_image_url && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold mb-1">Dokumentation:</h4>
                    <img 
                      src={record.documentation_image_url} 
                      alt="Dokumentation"
                      className="border rounded max-h-[300px] object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Keine abgeschlossenen Wartungen gefunden für diesen Zeitraum
          </CardContent>
        </Card>
      )}
      
      <style>{`
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }

        @media print {
          .print-container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
