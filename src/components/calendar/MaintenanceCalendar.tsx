
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { isAfter, isBefore, format } from "date-fns";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarExport } from "./CalendarExport";
import { UpcomingMaintenanceCard } from "./UpcomingMaintenanceCard";
import { CompletedMaintenanceCard } from "./CompletedMaintenanceCard";
import { MaintenanceTimeline } from "./MaintenanceTimeline";
import type { CalendarFilters as CalendarFiltersType } from "./CalendarFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MaintenanceCalendar() {
  const { data: allRecords = [] } = useMaintenanceRecords();
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<number>(currentYear);
  const [filters, setFilters] = useState<CalendarFiltersType>({
    includeCompleted: true,
    includeOverdue: true,
    includeUpcoming: true
  });

  // Generate year options (current year ± 5 years)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Apply year filter
  const maintenanceRecords = allRecords.filter(record => {
    const dueYear = new Date(record.due_date).getFullYear();
    const performedYear = record.performed_date ? new Date(record.performed_date).getFullYear() : null;
    return dueYear === yearFilter || performedYear === yearFilter;
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
      <div className="flex items-center gap-4">
        <CalendarFilters 
          currentFilters={filters}
          onFiltersChange={setFilters}
        />
        
        <Select value={yearFilter.toString()} onValueChange={(val) => setYearFilter(parseInt(val))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Jahr" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <MaintenanceTimeline 
            records={filteredRecords}
            filters={filters}
          />
        </TabsContent>

        <TabsContent value="list">
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
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Wartungskalender Export
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
