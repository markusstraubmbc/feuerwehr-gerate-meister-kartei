import { useState } from "react";
import { Calendar, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarFilters, CalendarFilterProps } from "./CalendarFilters";

interface CalendarFilters {
  personId?: string;
  templateId?: string;
  includeCompleted: boolean;
  includeOverdue: boolean;
  includeUpcoming: boolean;
}

export function MaintenanceCalendar() {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
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

  const generateICalendar = () => {
    setIsGenerating(true);
    
    try {
      const now = new Date();
      const calendarData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Feuerwehr Inventar//Wartungskalender//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Feuerwehr Wartungskalender',
        'X-WR-CALDESC:Wartungstermine für Feuerwehr-Ausrüstung',
      ];

      filteredRecords.forEach((record, index) => {
        const dueDate = new Date(record.due_date);
        const startDate = format(dueDate, 'yyyyMMdd');
        const endDate = format(addDays(dueDate, 1), 'yyyyMMdd');
        const timestamp = format(now, 'yyyyMMddTHHmmss') + 'Z';
        
        const status = record.status === 'abgeschlossen' ? 'COMPLETED' : 'NEEDS-ACTION';
        const summary = `${record.status === 'abgeschlossen' ? '[ERLEDIGT] ' : ''}Wartung: ${record.equipment.name}`;
        const description = [
          `Ausrüstung: ${record.equipment.name}`,
          `Barcode: ${record.equipment.barcode || 'Nicht verfügbar'}`,
          `Wartungstyp: ${record.template?.name || 'Keine Vorlage'}`,
          `Status: ${record.status}`,
          `Verantwortlich: ${record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen'}`,
          record.notes ? `Notizen: ${record.notes}` : '',
          record.performed_date ? `Durchgeführt am: ${format(new Date(record.performed_date), 'dd.MM.yyyy', { locale: de })}` : ''
        ].filter(Boolean).join('\\n');

        calendarData.push(
          'BEGIN:VEVENT',
          `UID:maintenance-${record.id}@feuerwehr-inventar.local`,
          `DTSTAMP:${timestamp}`,
          `DTSTART;VALUE=DATE:${startDate}`,
          `DTEND;VALUE=DATE:${endDate}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          `STATUS:${status}`,
          `CATEGORIES:Wartung,Feuerwehr`,
          'END:VEVENT'
        );
      });

      calendarData.push('END:VCALENDAR');

      const blob = new Blob([calendarData.join('\n')], { 
        type: 'text/calendar;charset=utf-8' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filterSuffix = filters.personId || filters.templateId ? '-gefiltert' : '';
      link.download = `feuerwehr-wartungskalender${filterSuffix}-${format(now, 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();

      toast.success('Gefilterte Kalender-Datei wurde heruntergeladen');
    } catch (error) {
      console.error('Calendar generation error:', error);
      toast.error('Fehler beim Erstellen der Kalender-Datei');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWebcalUrl = () => {
    // In einer echten Anwendung würde hier eine URL zu einem gehosteten Kalender-Feed stehen
    const webcalUrl = `webcal://your-domain.com/api/maintenance-calendar.ics`;
    
    navigator.clipboard.writeText(webcalUrl).then(() => {
      toast.success('Webcal-URL wurde in die Zwischenablage kopiert');
    }).catch(() => {
      toast.error('Fehler beim Kopieren der URL');
    });
  };

  const upcomingMaintenance = filteredRecords
    .filter(record => record.status !== 'abgeschlossen')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const completedMaintenance = filteredRecords
    .filter(record => record.status === 'abgeschlossen')
    .sort((a, b) => new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime())
    .slice(0, 5);

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
            {(filters.personId || filters.templateId) && (
              <span className="text-sm font-normal text-muted-foreground">
                (gefiltert: {filteredRecords.length} von {maintenanceRecords.length} Terminen)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exportieren Sie Ihre {filteredRecords.length > 0 ? 'gefilterten ' : ''}Wartungstermine als Kalender-Datei für Apple Calendar, Google Calendar oder Outlook.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateICalendar} disabled={isGenerating || filteredRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generiere...' : 'iCal herunterladen'}
            </Button>
            
            <Button variant="outline" onClick={generateWebcalUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Webcal-URL kopieren
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>iCal herunterladen:</strong> Lädt eine .ics Datei herunter, die Sie in jeden Kalender importieren können</p>
            <p>• <strong>Webcal-URL:</strong> Für automatische Synchronisation (erfordert Server-Setup)</p>
            <p>• <strong>Filter:</strong> Nur die aktuell gefilterten Termine werden exportiert</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
}
