
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import type { CalendarFilters } from "./CalendarFilters";

interface UpcomingMaintenanceCardProps {
  records: MaintenanceRecord[];
  filters: CalendarFilters;
}

export function UpcomingMaintenanceCard({ records, filters }: UpcomingMaintenanceCardProps) {
  const upcomingMaintenance = records
    .filter(record => record.status !== 'abgeschlossen')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Anstehende Wartungen</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMaintenance.length > 0 ? (
          <div className="space-y-3">
            {upcomingMaintenance.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                <div>
                  <p className="font-medium text-sm">{record.equipment.name}</p>
                  <p className="text-xs text-muted-foreground">{record.template?.name}</p>
                  {record.performer && (
                    <p className="text-xs text-muted-foreground">
                      Verantwortlich: {record.performer.first_name} {record.performer.last_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(record.due_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {filters.personId || filters.templateId ? 'Keine anstehenden Wartungen mit den aktuellen Filtern' : 'Keine anstehenden Wartungen'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
