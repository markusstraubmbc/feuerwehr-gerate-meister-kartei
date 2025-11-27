import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MissionReportEmailSettings } from "@/components/settings/MissionReportEmailSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCronJobLogs } from "@/hooks/useCronJobLogs";
import { Mail } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const EmailActionsOverview = () => {
  const navigate = useNavigate();
  const { data: cronLogs = [] } = useCronJobLogs(undefined, 100);

  // Filter email-related cron jobs
  const emailLogs = cronLogs.filter(log => 
    log.job_name.includes('email') || 
    log.job_name.includes('report') ||
    log.job_name.includes('notification')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">E-Mail & Aktionen Übersicht</h1>
      </div>

      <MissionReportEmailSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gesendete E-Mails
          </CardTitle>
          <CardDescription>
            Übersicht über automatisch generierte E-Mail-Benachrichtigungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emailLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine E-Mail-Aktivitäten gefunden</p>
            ) : (
              <div className="space-y-2">
                {emailLogs.slice(0, 20).map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{log.job_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.started_at), "PPpp", { locale: de })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' :
                        log.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status === 'success' ? 'Erfolgreich' :
                         log.status === 'error' ? 'Fehler' : 'Läuft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailActionsOverview;
