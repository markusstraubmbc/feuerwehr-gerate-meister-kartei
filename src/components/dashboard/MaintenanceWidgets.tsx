
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useEquipment } from "@/hooks/useEquipment";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";

export const MaintenanceWidgets = () => {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const { data: equipment = [] } = useEquipment();

  // Filter for pending maintenance
  const pendingMaintenance = maintenanceRecords
    .filter(record => record.status !== "abgeschlossen")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // Calculate total estimated time for pending maintenance
  const totalEstimatedMinutes = pendingMaintenance.reduce((total, record) => {
    return total + (record.template?.estimated_minutes || 0);
  }, 0);

  // Urgent maintenance (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const urgentMaintenance = pendingMaintenance.filter(record => {
    const dueDate = new Date(record.due_date);
    return dueDate <= nextWeek;
  });

  // Overdue maintenance
  const overdueMaintenance = pendingMaintenance.filter(record => {
    const dueDate = new Date(record.due_date);
    return dueDate < today;
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Wartungszeiten
          </CardTitle>
          <CardDescription>Geschätzter Zeitbedarf für anstehende Wartungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gesamtzeit (ausstehend)</span>
            <span className="font-semibold text-lg">{formatTime(totalEstimatedMinutes)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Anzahl Wartungen</span>
            <span className="font-medium">{pendingMaintenance.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Durchschnitt pro Wartung</span>
            <span className="font-medium">
              {pendingMaintenance.length > 0 
                ? formatTime(Math.round(totalEstimatedMinutes / pendingMaintenance.length))
                : "0min"
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Wartungsstatus
          </CardTitle>
          <CardDescription>Übersicht über dringende und überfällige Wartungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Überfällig</span>
            <span className={`font-semibold ${overdueMaintenance.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueMaintenance.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Dringend (7 Tage)</span>
            <span className={`font-semibold ${urgentMaintenance.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {urgentMaintenance.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gesamt ausstehend</span>
            <span className="font-medium">{pendingMaintenance.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
