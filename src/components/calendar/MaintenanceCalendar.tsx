
import { useState } from "react";
import { Calendar, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

export function MaintenanceCalendar() {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
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

      maintenanceRecords.forEach((record, index) => {
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
      link.download = `feuerwehr-wartungskalender-${format(now, 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();

      toast.success('Kalender-Datei wurde heruntergeladen');
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

  const upcomingMaintenance = maintenanceRecords
    .filter(record => record.status !== 'abgeschlossen')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const completedMaintenance = maintenanceRecords
    .filter(record => record.status === 'abgeschlossen')
    .sort((a, b) => new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wartungskalender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exportieren Sie Ihre Wartungstermine als Kalender-Datei für Apple Calendar, Google Calendar oder Outlook.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateICalendar} disabled={isGenerating}>
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
              <p className="text-sm text-muted-foreground">Keine anstehenden Wartungen</p>
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
              <p className="text-sm text-muted-foreground">Keine abgeschlossenen Wartungen</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
