import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipmentTemplates, useTemplateEquipmentItems } from "@/hooks/useEquipmentTemplates";
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Package, FileText } from "lucide-react";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  missionTitle: string;
}

export function TemplateSelector({
  open,
  onOpenChange,
  missionId,
  missionTitle,
}: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { data: templates = [] } = useEquipmentTemplates();
  const { data: templateItems = [] } = useTemplateEquipmentItems(selectedTemplateId);
  const { data: existingEquipment = [] } = useMissionEquipment(missionId);

  // Filter out equipment that's already added to the mission
  const existingEquipmentIds = existingEquipment.map(item => item.equipment_id);
  const newEquipmentItems = templateItems.filter(
    item => !existingEquipmentIds.includes(item.equipment_id)
  );

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || templateItems.length === 0) {
      toast.error("Bitte wählen Sie eine Vorlage mit Ausrüstung aus");
      return;
    }

    if (newEquipmentItems.length === 0) {
      toast.error("Alle Ausrüstungen aus dieser Vorlage wurden bereits hinzugefügt");
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = newEquipmentItems.map(item => ({
        mission_id: missionId,
        equipment_id: item.equipment_id,
        added_by: addedBy || null,
        notes: item.notes,
      }));

      const { error } = await supabase
        .from("mission_equipment")
        .insert(insertData);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["mission-equipment", missionId] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });

      const skippedCount = templateItems.length - newEquipmentItems.length;
      if (skippedCount > 0) {
        toast.success(
          `${newEquipmentItems.length} Ausrüstungsgegenstände hinzugefügt. ${skippedCount} bereits vorhanden.`
        );
      } else {
        toast.success(`${newEquipmentItems.length} Ausrüstungsgegenstände aus Vorlage hinzugefügt`);
      }
      
      setSelectedTemplateId("");
      setAddedBy("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Fehler beim Anwenden der Vorlage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ausrüstungs-Vorlage anwenden</DialogTitle>
          <p className="text-sm text-muted-foreground">{missionTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template-select">Vorlage auswählen</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Vorlage wählen..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                      {template.vehicle_reference && (
                        <span className="text-xs text-muted-foreground">
                          ({template.vehicle_reference})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplateId && (
            <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  Ausrüstung ({newEquipmentItems.length} neue, {templateItems.length - newEquipmentItems.length} bereits vorhanden)
                </span>
              </div>
              {templateItems.map((item) => {
                const isAlreadyAdded = existingEquipmentIds.includes(item.equipment_id);
                return (
                  <div 
                    key={item.id} 
                    className={`text-sm p-2 rounded ${isAlreadyAdded ? 'bg-muted/50 opacity-50' : 'bg-muted'}`}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {item.equipment?.name}
                      {isAlreadyAdded && (
                        <span className="text-xs text-muted-foreground">(bereits hinzugefügt)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.equipment?.category?.name} • {item.equipment?.location?.name}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Notiz: {item.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplateId || templateItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Anwenden..." : "Vorlage anwenden"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
