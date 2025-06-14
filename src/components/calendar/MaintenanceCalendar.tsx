
import { useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { isAfter, isBefore, format } from "date-fns";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarExport } from "./CalendarExport";
import { UpcomingMaintenanceCard } from "./UpcomingMaintenanceCard";
import { CompletedMaintenanceCard } from "./CompletedMaintenanceCard";
import type { CalendarFilters as CalendarFiltersType } from "./CalendarFilters";

export function MaintenanceCalendar() {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const [filters, setFilters] = useState<CalendarFiltersType>({
    includeCompleted: true,
    includeOverdue: true,
    includeUpcoming: true
  });

  const filterRecords = (records: typeof maintenanceRecords) => {
    return records.filter(record => {
      // Person filter
      if (filters.personId && record.performer?.id !== filters.personId) {
        return false;
      }

      // Template filter
      if (filters.templateId && record.template?.id !== filters.templateId) {
        return false;
      }

      // Status filter
      const now = new Date();
      const dueDate = new Date(record.due_date);
      const isCompleted = record.status === 'abgeschlossen';
      const isOverdue = !isCompleted && isBefore(dueDate, now);
      const isUpcoming = !isCompleted && (isAfter(dueDate, now) || format(dueDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'));

      if (isCompleted && !filters.includeCompleted) return false;
      if (isOverdue && !filters.includeOverdue) return false;
      if (isUpcoming && !filters.includeUpcoming) return false;

      return true;
    });
  };

  const filteredRecords = filterRecords(maintenanceRecords);

  return (
    <div className="space-y-6">
      <CalendarFilters 
        currentFilters={filters}
        onFiltersChange={setFilters}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wartungskalender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarExport 
            filteredRecords={filteredRecords}
            filters={filters}
            totalRecords={maintenanceRecords.length}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingMaintenanceCard 
          records={filteredRecords}
          filters={filters}
        />
        <CompletedMaintenanceCard 
          records={filteredRecords}
          filters={filters}
        />
      </div>
    </div>
  );
}
