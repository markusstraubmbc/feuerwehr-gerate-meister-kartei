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
            Übersicht über automatisch generierte E-Mail-Benachrichtigungen mit Details zu Empfängern und Inhalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emailLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine E-Mail-Aktivitäten gefunden</p>
            ) : (
              <div className="space-y-3">
                {emailLogs.slice(0, 20).map((log) => {
                  // Extract email details from log.details
                  const details = log.details as any;
                  const emailDetails = details?.details || details?.result?.details || [];
                  const messageInfo = details?.message || details?.result?.message || '';
                  
                  return (
                    <div 
                      key={log.id} 
                      className="p-4 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{log.job_name}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.status === 'success' ? 'bg-green-100 text-green-800' :
                              log.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {log.status === 'success' ? 'Erfolgreich' :
                               log.status === 'error' ? 'Fehler' : 'Läuft'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.started_at), "PPpp", { locale: de })}
                          </p>
                          {messageInfo && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {messageInfo}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email Details */}
                      {Array.isArray(emailDetails) && emailDetails.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Versendete E-Mails ({emailDetails.length}):
                          </p>
                          <div className="space-y-2">
                            {emailDetails.map((detail: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="p-2 bg-background rounded border text-xs"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Empfänger:</span>{' '}
                                    <span className="text-muted-foreground">
                                      {detail.name || 'Unbekannt'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">E-Mail:</span>{' '}
                                    <span className="text-muted-foreground">
                                      {detail.email || 'Keine E-Mail'}
                                    </span>
                                  </div>
                                  {detail.equipment && (
                                    <div>
                                      <span className="font-medium">Ausrüstung:</span>{' '}
                                      <span className="text-muted-foreground">
                                        {detail.equipment}
                                      </span>
                                    </div>
                                  )}
                                  {detail.barcode && (
                                    <div>
                                      <span className="font-medium">Barcode:</span>{' '}
                                      <span className="text-muted-foreground">
                                        {detail.barcode}
                                      </span>
                                    </div>
                                  )}
                                  {detail.status && (
                                    <div>
                                      <span className="font-medium">Status:</span>{' '}
                                      <span className={
                                        detail.status === 'success' 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }>
                                        {detail.status === 'success' ? '✓ Gesendet' : '✗ Fehler'}
                                      </span>
                                    </div>
                                  )}
                                  {detail.error && (
                                    <div className="col-span-2">
                                      <span className="font-medium text-red-600">Fehler:</span>{' '}
                                      <span className="text-red-600 text-xs">
                                        {detail.error}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error message if present */}
                      {log.error_message && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-800">
                            <span className="font-medium">Fehler:</span> {log.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailActionsOverview;
