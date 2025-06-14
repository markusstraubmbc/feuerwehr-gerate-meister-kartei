
import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import type { CalendarFilters } from "./CalendarFilters";

interface CalendarExportProps {
  filteredRecords: MaintenanceRecord[];
  filters: CalendarFilters;
  totalRecords: number;
}

export function CalendarExport({ filteredRecords, filters, totalRecords }: CalendarExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

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
          record.performed_date ? `Durchgeführt am: ${format(new Date(record.performed_date), 'dd.MM.yyyy')}` : ''
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
    const webcalUrl = `webcal://your-domain.com/api/maintenance-calendar.ics`;
    
    navigator.clipboard.writeText(webcalUrl).then(() => {
      toast.success('Webcal-URL wurde in die Zwischenablage kopiert');
    }).catch(() => {
      toast.error('Fehler beim Kopieren der URL');
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wartungskalender Export
          {(filters.personId || filters.templateId) && (
            <span className="text-sm font-normal text-muted-foreground">
              (gefiltert: {filteredRecords.length} von {totalRecords} Terminen)
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
  );
}
