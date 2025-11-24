import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MaintenanceStatusBadge } from "@/components/maintenance/MaintenanceStatusBadge";
import { ViewMaintenanceDialog } from "@/components/maintenance/ViewMaintenanceDialog";
import { EditMaintenanceDialog } from "@/components/maintenance/EditMaintenanceDialog";
import { CompleteMaintenanceDialog } from "@/components/maintenance/CompleteMaintenanceDialog";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import type { CalendarFilters } from "./CalendarFilters";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MaintenanceTimelineProps {
  records: MaintenanceRecord[];
  filters: CalendarFilters;
}

export function MaintenanceTimeline({ records, filters }: MaintenanceTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [draggedRecord, setDraggedRecord] = useState<MaintenanceRecord | null>(null);
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getRecordsForDay = (day: Date) => {
    return records.filter(record => {
      const dueDate = new Date(record.due_date);
      const performedDate = record.performed_date ? new Date(record.performed_date) : null;
      
      return isSameDay(dueDate, day) || (performedDate && isSameDay(performedDate, day));
    });
  };

  const getRecordStatus = (record: MaintenanceRecord) => {
    if (record.status === 'abgeschlossen') return 'completed';
    const now = new Date();
    const dueDate = new Date(record.due_date);
    
    if (dueDate < now) return 'overdue';
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 7) return 'upcoming';
    return 'planned';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-500 text-green-800';
      case 'overdue': return 'bg-red-100 border-red-500 text-red-800';
      case 'upcoming': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'planned': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const handleDragStart = (record: MaintenanceRecord) => {
    setDraggedRecord(record);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: Date) => {
    if (!draggedRecord) return;

    const newDueDate = format(day, 'yyyy-MM-dd');
    
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .update({ due_date: newDueDate })
        .eq('id', draggedRecord.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success(`Wartung verschoben auf ${format(day, 'dd.MM.yyyy', { locale: de })}`);
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error('Fehler beim Verschieben der Wartung');
    } finally {
      setDraggedRecord(null);
    }
  };

  const handleRecordClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wartungs-Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              ←
            </Button>
            <span className="text-sm font-medium min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              →
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Heute
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday headers */}
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map(day => {
            const dayRecords = getRecordsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  !isSameMonth(day, currentMonth) ? 'bg-muted/50' : 'bg-background'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(day)}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayRecords.map(record => {
                    const status = getRecordStatus(record);
                    return (
                      <div
                        key={record.id}
                        draggable={record.status !== 'abgeschlossen'}
                        onDragStart={() => handleDragStart(record)}
                        onClick={() => handleRecordClick(record)}
                        className={`text-xs p-1 rounded border-l-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(status)}`}
                        title={`${record.equipment.name} - ${record.template?.name || 'Keine Vorlage'}`}
                      >
                        <div className="font-medium truncate">{record.equipment.name}</div>
                        {record.equipment.location && (
                          <div className="flex items-center gap-1 text-[10px] opacity-75">
                            <MapPin className="h-2 w-2" />
                            {record.equipment.location.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <span className="font-medium">Legende:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500"></div>
            <span>Überfällig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500"></div>
            <span>Anstehend (7 Tage)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500"></div>
            <span>Geplant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
            <span>Abgeschlossen</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          💡 Tipp: Ziehen Sie ausstehende Wartungen per Drag & Drop auf einen neuen Tag, um das Fälligkeitsdatum zu ändern.
        </p>
      </CardContent>

      {selectedRecord && (
        <>
          <ViewMaintenanceDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            record={selectedRecord}
          />
          <EditMaintenanceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            record={selectedRecord}
          />
          <CompleteMaintenanceDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            record={selectedRecord}
          />
        </>
      )}
    </Card>
  );
}
