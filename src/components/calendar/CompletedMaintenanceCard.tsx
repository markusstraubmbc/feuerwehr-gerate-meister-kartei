
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import type { CalendarFilters } from "./CalendarFilters";

interface CompletedMaintenanceCardProps {
  records: MaintenanceRecord[];
  filters: CalendarFilters;
}

export function CompletedMaintenanceCard({ records, filters }: CompletedMaintenanceCardProps) {
  const completedMaintenance = records
    .filter(record => record.status === 'abgeschlossen')
    .sort((a, b) => new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kürzlich abgeschlossen</CardTitle>
      </CardHeader>
      <CardContent>
        {completedMaintenance.length > 0 ? (
          <div className="space-y-3">
            {completedMaintenance.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div>
                  <p className="font-medium text-sm">{record.equipment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Inv.-Nr.: {record.equipment.inventory_number || "Nicht zugewiesen"}
                  </p>
                  {record.equipment.barcode && (
                    <p className="text-xs text-muted-foreground">
                      Barcode: {record.equipment.barcode}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{record.template?.name}</p>
                  {record.performer && (
                    <p className="text-xs text-muted-foreground">
                      Durchgeführt von: {record.performer.first_name} {record.performer.last_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {record.performed_date ? 
                      format(new Date(record.performed_date), 'dd.MM.yyyy', { locale: de }) :
                      format(new Date(record.due_date), 'dd.MM.yyyy', { locale: de })
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {filters.personId || filters.templateId ? 'Keine abgeschlossenen Wartungen mit den aktuellen Filtern' : 'Keine abgeschlossenen Wartungen'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
