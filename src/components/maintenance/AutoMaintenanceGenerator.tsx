import { useState } from "react";
import { Calendar, Clock, Play, AlertTriangle, CalendarRange, Copy, Check, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addMonths, format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { useCronJobLogs } from "@/hooks/useCronJobLogs";

export function AutoMaintenanceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingYear, setIsGeneratingYear] = useState(false);
  const [generationReport, setGenerationReport] = useState<{
    created: number;
    skipped: number;
    errors: number;
    type: 'manual' | 'yearly';
  } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testingFunction, setTestingFunction] = useState<string | null>(null);

  const { data: equipment = [] } = useEquipment();
  const { data: templates = [] } = useMaintenanceTemplates();
  const { data: cronLogs = [] } = useCronJobLogs(undefined, 20);
  const queryClient = useQueryClient();

  const generateMaintenanceRecords = async (generateForYear = false) => {
    const setLoading = generateForYear ? setIsGeneratingYear : setIsGenerating;
    setLoading(true);
    setGenerationReport(null);

    try {
      let created = 0;
      let skipped = 0;
      let errors = 0;

      const now = new Date();
      const endDate = generateForYear ? addDays(now, 180) : addMonths(now, 3);

      for (const item of equipment) {
        try {
          // ALLE passenden Templates pro Kategorie finden (Refaktoring!)
          const matchingTemplates = templates.filter(
            t => t.category_id === item.category_id
          );

          if (matchingTemplates.length === 0) {
            console.log(`No template found for equipment ${item.name}`);
            skipped++;
            continue;
          }

          // Jetzt für ALLE passenden Templates iterieren
          for (const template of matchingTemplates) {
            // Calculate maintenance dates
            const baseDate = item.last_check_date
              ? new Date(item.last_check_date)
              : item.purchase_date
              ? new Date(item.purchase_date)
              : new Date();

            const maintenanceDates = [];
            let currentDate = new Date(baseDate);

            if (generateForYear) {
              while (currentDate <= endDate) {
                currentDate = new Date(currentDate);
                currentDate.setMonth(currentDate.getMonth() + template.interval_months);
                if (currentDate <= endDate) {
                  maintenanceDates.push(new Date(currentDate));
                }
              }
            } else {
              const nextDueDate = addMonths(baseDate, template.interval_months);
              if (nextDueDate <= endDate) {
                maintenanceDates.push(nextDueDate);
              }
            }

            for (const dueDate of maintenanceDates) {
              const startOfDay = new Date(dueDate);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(dueDate);
              endOfDay.setHours(23, 59, 59, 999);

              const { data: existingRecords } = await supabase
                .from("maintenance_records")
                .select("id")
                .eq("equipment_id", item.id)
                .eq("template_id", template.id)
                .gte("due_date", startOfDay.toISOString())
                .lte("due_date", endOfDay.toISOString());

              if (existingRecords && existingRecords.length > 0) {
                console.log(
                  `Maintenance already exists for ${item.name} / ${template.name} on ${dueDate.toDateString()}`
                );
                skipped++;
                continue;
              }

              const { error } = await supabase.from("maintenance_records").insert({
                equipment_id: item.id,
                template_id: template.id,
                due_date: dueDate.toISOString(),
                status: "ausstehend",
                performed_by: template.responsible_person_id,
              });

              if (error) {
                console.error(
                  `Error creating maintenance for ${item.name} / ${template.name} on ${dueDate.toDateString()}:`,
                  error
                );
                errors++;
              } else {
                created++;
              }
            }
          }
        } catch (error) {
          console.error(`Error processing equipment ${item.name}:`, error);
          errors++;
        }
      }

      setGenerationReport({
        created,
        skipped,
        errors,
        type: generateForYear ? "yearly" : "manual",
      });

      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
        toast.success(`${created} neue Wartungstermine wurden erstellt`);
      } else {
        toast.info("Keine neuen Wartungstermine erforderlich");
      }
    } catch (error) {
      console.error("Error generating maintenance records:", error);
      toast.error("Fehler beim Generieren der Wartungstermine");
    } finally {
      setLoading(false);
    }
  };

  const generateYearlyMaintenanceViaFunction = async () => {
    setIsGeneratingYear(true);
    setGenerationReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('maintenance-auto-generator');
      
      if (error) {
        console.error('Edge function error:', error);
        toast.error('Fehler beim Generieren der Wartungstermine über Edge Function');
        return;
      }

      if (data) {
        setGenerationReport({ 
          created: data.created || 0, 
          skipped: data.skipped || 0, 
          errors: data.errors || 0,
          type: 'yearly'
        });
        
        if (data.created > 0) {
          queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
          toast.success(`${data.created} neue Wartungstermine wurden über Edge Function erstellt`);
        } else {
          toast.info('Keine neuen Wartungstermine über Edge Function erforderlich');
        }
      }
    } catch (error) {
      console.error('Error calling edge function:', error);
      toast.error('Fehler beim Aufruf der Edge Function');
    } finally {
      setIsGeneratingYear(false);
    }
  };

  const getEquipmentWithoutTemplates = () => {
    return equipment.filter(item => 
      !templates.some(template => template.category_id === item.category_id)
    );
  };

  const equipmentWithoutTemplates = getEquipmentWithoutTemplates();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const cronJobUrls = [
    {
      name: "Automatische Wartungsgenerierung",
      function: "maintenance-auto-generator",
      description: "Generiert Wartungstermine für die nächsten 180 Tage"
    },
    {
      name: "E-Mail Scheduler",
      function: "email-scheduler",
      description: "Versendet geplante E-Mail-Benachrichtigungen"
    },
    {
      name: "Wartungs-Benachrichtigungen",
      function: "maintenance-notifications",
      description: "Sendet Benachrichtigungen für fällige Wartungen"
    },
    {
      name: "Wochenbericht",
      function: "weekly-report",
      description: "Generiert und sendet wöchentliche Berichte"
    },
    {
      name: "Alle Cron-Jobs auf einmal",
      function: "run-all-cron-jobs",
      description: "Führt alle Cron-Jobs nacheinander aus",
      isMain: true
    }
  ];

  const copyToClipboard = async (url: string, functionName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(functionName);
      toast.success("URL in Zwischenablage kopiert");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("Fehler beim Kopieren der URL");
    }
  };

  const testCronFunction = async (functionName: string) => {
    setTestingFunction(functionName);
    try {
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) {
        console.error(`Edge function error for ${functionName}:`, error);
        toast.error(`Fehler beim Testen von ${functionName}`);
        return;
      }

      toast.success(`${functionName} erfolgreich getestet`);
      queryClient.invalidateQueries({ queryKey: ["cron-job-logs"] });
      
      if (functionName === 'maintenance-auto-generator') {
        queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      }
    } catch (error) {
      console.error(`Error testing function ${functionName}:`, error);
      toast.error(`Fehler beim Testen der Funktion`);
    } finally {
      setTestingFunction(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // --- NEU: Reset-Funktion für alle offenen Wartungen ---
  const resetAndRegenerateMaintenance = async () => {
    setIsResetting(true);
    try {
      // 1. Lösche alle ausstehenden & geplanten Wartungen
      const { error: deleteError } = await supabase
        .from("maintenance_records")
        .delete()
        .in("status", ["ausstehend", "geplant"]);

      if (deleteError) {
        toast.error("Fehler beim Löschen der offenen Wartungen");
        setIsResetting(false);
        return;
      }

      toast.info("Alle offenen Wartungen wurden gelöscht. Neue Wartungen werden generiert...");

      // 2. Edge Function aufrufen zur automatischen Generierung
      const { data, error } = await supabase.functions.invoke('maintenance-auto-generator');

      if (error) {
        toast.error("Fehler beim Generieren der neuen Wartungen");
        setIsResetting(false);
        return;
      }

      if (data) {
        setGenerationReport({
          created: data.created || 0,
          skipped: data.skipped || 0,
          errors: data.errors || 0,
          type: "yearly",
        });

        if (data.created > 0) {
          queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
          toast.success(`${data.created} neue Wartungstermine wurden erstellt`);
        } else {
          toast.info("Keine neuen Wartungstermine erforderlich");
        }
      }
    } catch (error) {
      toast.error("Fehler beim Reset/Neuerzeugen.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automatische Wartungsgenerierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generiert automatisch Wartungstermine basierend auf den definierten Intervallen und der letzten Wartung oder dem Kaufdatum der Ausrüstung.
        </p>

        {equipmentWithoutTemplates.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Fehlende Wartungsvorlagen</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {equipmentWithoutTemplates.length} Ausrüstungsgegenstände haben keine passende Wartungsvorlage. 
              Diese werden übersprungen.
            </p>
            <ul className="text-xs text-amber-600 mt-2">
              {equipmentWithoutTemplates.slice(0, 3).map(item => (
                <li key={item.id}>• {item.name}</li>
              ))}
              {equipmentWithoutTemplates.length > 3 && (
                <li>• und {equipmentWithoutTemplates.length - 3} weitere...</li>
              )}
            </ul>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-800">{equipment.length}</div>
            <div className="text-sm text-blue-600">Ausrüstungsgegenstände</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-800">{templates.length}</div>
            <div className="text-sm text-green-600">Wartungsvorlagen</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-800">
              {equipment.length - equipmentWithoutTemplates.length}
            </div>
            <div className="text-sm text-purple-600">Abgedeckte Gegenstände</div>
          </div>
        </div>

        {generationReport && (
          <div className="p-3 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2">
              Generierungsbericht ({generationReport.type === 'yearly' ? '180 Tage' : 'Einzeltermine'}):
            </h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="text-green-700">
                ✓ {generationReport.created} erstellt
              </div>
              <div className="text-yellow-700">
                ⊘ {generationReport.skipped} übersprungen
              </div>
              <div className="text-red-700">
                ✗ {generationReport.errors} Fehler
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Button 
            onClick={() => generateMaintenanceRecords(false)}
            disabled={isGenerating || isGeneratingYear}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generiere nächste Termine...' : 'Nächste Wartungstermine generieren'}
          </Button>

          <Button 
            onClick={() => generateMaintenanceRecords(true)}
            disabled={isGenerating || isGeneratingYear}
            variant="outline"
            className="w-full"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            {isGeneratingYear ? 'Generiere für 180 Tage...' : 'Alle Termine für nächste 180 Tage'}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h4 className="font-medium mb-2">Automatisierung via Cron-Job</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Verwende die Edge Function für automatische tägliche Generierung via Cron-Job.
          </p>
          <Button 
            onClick={generateYearlyMaintenanceViaFunction}
            disabled={isGenerating || isGeneratingYear}
            variant="secondary"
            className="w-full"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {isGeneratingYear ? 'Edge Function läuft...' : 'Edge Function für 180 Tage ausführen'}
          </Button>
          {/* --- NEUER BUTTON --- */}
          <Button
            onClick={resetAndRegenerateMaintenance}
            disabled={isGenerating || isGeneratingYear || isResetting}
            variant="destructive"
            className="w-full mt-2"
          >
            {isResetting ? "Setze und generiere neu..." : "Alle offenen Wartungen löschen & neu generieren"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Nächste Termine:</strong> Generiert nur die unmittelbar anstehenden Wartungstermine (nächste 3 Monate)</p>
          <p>• <strong>180 Tage:</strong> Generiert alle fehlenden Wartungstermine für die nächsten 180 Tage</p>
          <p>• <strong>Edge Function:</strong> Kann als Cron-Job konfiguriert werden für automatische tägliche Ausführung</p>
          <p>• <strong>Duplikate:</strong> Bereits existierende Termine werden übersprungen</p>
          <p>• <strong>Verantwortliche:</strong> Automatisch aus der Wartungsvorlage übernommen</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Cron-Job URLs für automatische Ausführung</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Diese URLs können in einem externen Cron-Job Service (z.B. cron-job.org) eingetragen werden, 
            um die automatische Ausführung zu planen.
          </p>
          
          <div className="space-y-3">
            {cronJobUrls.map((job) => {
              const url = `${SUPABASE_URL}/functions/v1/${job.function}`;
              const isCopied = copiedUrl === job.function;
              const isTesting = testingFunction === job.function;
              
              return (
                <div 
                  key={job.function} 
                  className={`p-3 rounded-lg space-y-2 ${
                    job.isMain 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${job.isMain ? 'text-blue-900' : ''}`}>
                        {job.name}
                        {job.isMain && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                            Empfohlen
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{job.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testCronFunction(job.function)}
                        disabled={isTesting || testingFunction !== null}
                        className="shrink-0"
                      >
                        {isTesting ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(url, job.function)}
                        className="shrink-0"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-background p-2 rounded border text-xs font-mono break-all">
                    {url}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>Hinweis:</strong> Alle Cron-Job URLs können ohne Authentifizierung aufgerufen werden. 
              Sie benötigen keinen Authorization Header mehr und können direkt per HTTP GET/POST Aufruf genutzt werden.
            </p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Letzte Cron-Job Ausführungen</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cronLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Ausführungen gefunden</p>
            ) : (
              cronLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{log.job_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.started_at), "PPpp", { locale: de })}
                        {log.duration_seconds && (
                          <span className="ml-2">
                            • Dauer: {log.duration_seconds}s
                          </span>
                        )}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${getStatusBadgeColor(log.status)}`}>
                      {log.status === 'success' ? 'Erfolgreich' :
                       log.status === 'error' ? 'Fehler' : 
                       log.status === 'running' ? 'Läuft' : log.status}
                    </span>
                  </div>
                  {log.details && (
                    <div className="mt-2 text-xs bg-background p-2 rounded border">
                      <pre className="whitespace-pre-wrap break-all">
                        {typeof log.details === 'string' 
                          ? log.details 
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
