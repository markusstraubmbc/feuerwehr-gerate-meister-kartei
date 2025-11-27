import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCronJobLogs } from "@/hooks/useCronJobLogs";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data: logs, isLoading } = useCronJobLogs(undefined, 200);

  // Filter for email-related jobs
  const emailLogs = logs?.filter(log => 
    log.job_name.includes('report') || 
    log.job_name.includes('email') ||
    log.job_name.includes('notification')
  ) || [];

  const getJobDisplayName = (jobName: string) => {
    if (jobName.includes('monthly-maintenance-report')) return 'Monatlicher Wartungsbericht';
    if (jobName.includes('send-mission-report')) return 'Einsatzbericht';
    if (jobName.includes('weekly-report')) return 'Wochenbericht';
    if (jobName.includes('maintenance-notifications')) return 'Wartungsbenachrichtigungen';
    return jobName;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Erfolgreich</Badge>;
      case 'error':
        return <Badge variant="destructive">Fehler</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Läuft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings/email-actions-overview")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Versandhistorie</h1>
          <p className="text-muted-foreground">
            Übersicht über versendete Berichte und Benachrichtigungen
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Versendete Berichte
          </CardTitle>
          <CardDescription>
            Chronologische Auflistung aller versendeten E-Mail-Berichte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Lade Versandhistorie...
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Berichte versendet
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getJobDisplayName(log.job_name)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.started_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </div>
                      {log.details?.message && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {log.details.message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {log.duration_seconds && (
                      <div className="text-xs text-muted-foreground">
                        {log.duration_seconds.toFixed(1)}s
                      </div>
                    )}
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedLog && getJobDisplayName(selectedLog.job_name)}
            </DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zum Versand
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedLog && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Zeitpunkt</div>
                      <div className="mt-1 text-sm">
                        {format(new Date(selectedLog.started_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                      </div>
                    </div>
                    {selectedLog.duration_seconds && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Dauer</div>
                        <div className="mt-1 text-sm">
                          {selectedLog.duration_seconds.toFixed(2)} Sekunden
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLog.details && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Details</div>
                      <div className="p-4 bg-muted rounded-lg">
                        {selectedLog.details.message && (
                          <div className="mb-3">
                            <span className="font-medium">Nachricht: </span>
                            {selectedLog.details.message}
                          </div>
                        )}
                        {selectedLog.details.recipients && Array.isArray(selectedLog.details.recipients) && (
                          <div className="mb-3">
                            <span className="font-medium">Empfänger: </span>
                            {selectedLog.details.recipients.join(", ")}
                          </div>
                        )}
                        {selectedLog.details.emails_sent && Array.isArray(selectedLog.details.emails_sent) && (
                          <div>
                            <span className="font-medium">Empfänger:</span>
                            <div className="mt-2 space-y-2">
                              {selectedLog.details.emails_sent.map((email: any, idx: number) => (
                                <div key={idx} className="p-2 bg-background rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{email.name || email.email}</span>
                                    {email.status === 'success' ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">{email.email}</div>
                                  {email.items_count && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {email.items_count} Wartungen
                                    </div>
                                  )}
                                  {email.error && (
                                    <div className="text-xs text-red-600 mt-1">
                                      Fehler: {email.error}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedLog.details.total_maintenance_items && (
                          <div className="mt-2">
                            <span className="font-medium">Gesamt Wartungen: </span>
                            {selectedLog.details.total_maintenance_items}
                          </div>
                        )}
                        {selectedLog.details.stats && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {selectedLog.details.stats.overdue !== undefined && (
                              <div className="text-sm">
                                <span className="font-medium">Überfällig: </span>
                                {selectedLog.details.stats.overdue}
                              </div>
                            )}
                            {selectedLog.details.stats.upcoming !== undefined && (
                              <div className="text-sm">
                                <span className="font-medium">Anstehend: </span>
                                {selectedLog.details.stats.upcoming}
                              </div>
                            )}
                            {selectedLog.details.stats.completed !== undefined && (
                              <div className="text-sm">
                                <span className="font-medium">Abgeschlossen: </span>
                                {selectedLog.details.stats.completed}
                              </div>
                            )}
                            {selectedLog.details.stats.equipmentIssues !== undefined && (
                              <div className="text-sm">
                                <span className="font-medium">Probleme: </span>
                                {selectedLog.details.stats.equipmentIssues}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLog.error_message && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Fehlermeldung</div>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        {selectedLog.error_message}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationHistory;
