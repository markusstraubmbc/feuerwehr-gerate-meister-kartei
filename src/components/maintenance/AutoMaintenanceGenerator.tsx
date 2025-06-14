
import { useState } from "react";
import { Calendar, Clock, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";
import { de } from "date-fns/locale";

export function AutoMaintenanceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationReport, setGenerationReport] = useState<{
    created: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const { data: equipment = [] } = useEquipment();
  const { data: templates = [] } = useMaintenanceTemplates();
  const queryClient = useQueryClient();

  const generateMaintenanceRecords = async () => {
    setIsGenerating(true);
    setGenerationReport(null);

    try {
      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const item of equipment) {
        try {
          // Find matching template based on category
          const template = templates.find(t => t.category_id === item.category_id);
          
          if (!template) {
            console.log(`No template found for equipment ${item.name}`);
            skipped++;
            continue;
          }

          // Calculate next maintenance date based on last check or purchase date
          const baseDate = item.last_check_date 
            ? new Date(item.last_check_date)
            : item.purchase_date 
            ? new Date(item.purchase_date)
            : new Date();

          const nextDueDate = addMonths(baseDate, template.interval_months);

          // Check if a maintenance record already exists for this equipment and due date
          const { data: existingRecords } = await supabase
            .from('maintenance_records')
            .select('id')
            .eq('equipment_id', item.id)
            .eq('template_id', template.id)
            .gte('due_date', format(nextDueDate, 'yyyy-MM-dd'))
            .lt('due_date', format(addMonths(nextDueDate, 1), 'yyyy-MM-dd'));

          if (existingRecords && existingRecords.length > 0) {
            console.log(`Maintenance already exists for ${item.name}`);
            skipped++;
            continue;
          }

          // Create new maintenance record
          const { error } = await supabase
            .from('maintenance_records')
            .insert({
              equipment_id: item.id,
              template_id: template.id,
              due_date: nextDueDate.toISOString(),
              status: 'ausstehend',
              performed_by: template.responsible_person_id
            });

          if (error) {
            console.error(`Error creating maintenance for ${item.name}:`, error);
            errors++;
          } else {
            created++;
          }
        } catch (error) {
          console.error(`Error processing equipment ${item.name}:`, error);
          errors++;
        }
      }

      setGenerationReport({ created, skipped, errors });
      
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
        toast.success(`${created} neue Wartungstermine wurden erstellt`);
      } else {
        toast.info('Keine neuen Wartungstermine erforderlich');
      }

    } catch (error) {
      console.error('Error generating maintenance records:', error);
      toast.error('Fehler beim Generieren der Wartungstermine');
    } finally {
      setIsGenerating(false);
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
            <h4 className="font-medium mb-2">Generierungsbericht:</h4>
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

        <Button 
          onClick={generateMaintenanceRecords}
          disabled={isGenerating}
          className="w-full"
        >
          <Play className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generiere Wartungstermine...' : 'Wartungstermine generieren'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Berechnung:</strong> Nächster Termin = Letzte Wartung + Intervall (oder Kaufdatum + Intervall)</p>
          <p>• <strong>Duplikate:</strong> Bereits existierende Termine werden übersprungen</p>
          <p>• <strong>Verantwortliche:</strong> Automatisch aus der Wartungsvorlage übernommen</p>
        </div>
      </CardContent>
    </Card>
  );
}
