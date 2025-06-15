import { useState } from "react";
import { Calendar, Clock, Play, AlertTriangle, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addMonths, format, addDays } from "date-fns";
import { de } from "date-fns/locale";

export function AutoMaintenanceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingYear, setIsGeneratingYear] = useState(false);
  const [generationReport, setGenerationReport] = useState<{
    created: number;
    skipped: number;
    errors: number;
    type: 'manual' | 'yearly';
  } | null>(null);

  const { data: equipment = [] } = useEquipment();
  const { data: templates = [] } = useMaintenanceTemplates();
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

        <div className="border-t pt-4">
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
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Nächste Termine:</strong> Generiert nur die unmittelbar anstehenden Wartungstermine (nächste 3 Monate)</p>
          <p>• <strong>180 Tage:</strong> Generiert alle fehlenden Wartungstermine für die nächsten 180 Tage</p>
          <p>• <strong>Edge Function:</strong> Kann als Cron-Job konfiguriert werden für automatische tägliche Ausführung</p>
          <p>• <strong>Duplikate:</strong> Bereits existierende Termine werden übersprungen</p>
          <p>• <strong>Verantwortliche:</strong> Automatisch aus der Wartungsvorlage übernommen</p>
        </div>
      </CardContent>
    </Card>
  );
}
