import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useInventoryCheckItems, 
  useCreateInventoryCheckItem, 
  useUpdateInventoryCheck,
  useTemplateInventoryChecks 
} from "@/hooks/useTemplateInventory";
import { useTemplateEquipmentItems } from "@/hooks/useEquipmentTemplates";
import { useEquipment } from "@/hooks/useEquipment";
import { CheckCircle2, XCircle, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface InventoryCheckSessionProps {
  checkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryCheckSession({ checkId, open, onOpenChange }: InventoryCheckSessionProps) {
  const { data: checks = [] } = useTemplateInventoryChecks();
  const check = checks.find(c => c.id === checkId);
  const { data: templateItems = [] } = useTemplateEquipmentItems(check?.template_id || "");
  const { data: checkedItems = [] } = useInventoryCheckItems(checkId);
  const { data: allEquipment = [] } = useEquipment();
  const createItem = useCreateInventoryCheckItem();
  const updateCheck = useUpdateInventoryCheck();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"present" | "missing" | "replaced">("present");
  const [replacementId, setReplacementId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const currentItem = templateItems[currentIndex];
  const progress = (checkedItems.length / templateItems.length) * 100;
  const isLastItem = currentIndex === templateItems.length - 1;

  // Check if current item is already checked
  const existingCheck = checkedItems.find(item => item.equipment_id === currentItem?.equipment_id);

  useEffect(() => {
    if (existingCheck) {
      setStatus(existingCheck.status as any);
      setReplacementId(existingCheck.replacement_equipment_id || "");
      setNotes(existingCheck.notes || "");
    } else {
      setStatus("present");
      setReplacementId("");
      setNotes("");
    }
  }, [currentIndex, existingCheck]);

  const handleCheckItem = async () => {
    if (!currentItem) return;

    try {
      await createItem.mutateAsync({
        inventory_check_id: checkId,
        equipment_id: currentItem.equipment_id,
        status,
        replacement_equipment_id: status === "replaced" ? replacementId : undefined,
        notes: notes || undefined,
      });

      toast.success("Position geprüft");

      // Move to next item or complete
      if (isLastItem) {
        await updateCheck.mutateAsync({
          id: checkId,
          status: "completed",
          completed_at: new Date().toISOString(),
        });
        toast.success("Inventur abgeschlossen!");
        onOpenChange(false);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Fehler beim Prüfen");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (!isLastItem) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCancel = async () => {
    try {
      await updateCheck.mutateAsync({
        id: checkId,
        status: "cancelled",
      });
      toast.info("Inventur abgebrochen");
      onOpenChange(false);
    } catch (error) {
      toast.error("Fehler beim Abbrechen");
    }
  };

  if (!check || !currentItem) {
    return null;
  }

  const availableReplacements = allEquipment.filter(eq => 
    eq.id !== currentItem.equipment_id &&
    eq.status === "einsatzbereit"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventur: {check.template.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Prüfung von {check.checked_by_person?.first_name} {check.checked_by_person?.last_name}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Fortschritt</span>
              <span>{checkedItems.length} von {templateItems.length} geprüft</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current item */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{currentItem.equipment?.name}</h3>
              <Badge variant="outline">
                {currentIndex + 1} / {templateItems.length}
              </Badge>
            </div>
            {currentItem.equipment?.category && (
              <p className="text-sm text-muted-foreground">
                Kategorie: {currentItem.equipment.category.name}
              </p>
            )}
            {currentItem.equipment?.location && (
              <p className="text-sm text-muted-foreground">
                Standort: {currentItem.equipment.location.name}
              </p>
            )}
            {currentItem.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                Hinweis: {currentItem.notes}
              </p>
            )}
          </div>

          {/* Status selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Status</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={status === "present" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("present")}
              >
                <CheckCircle2 className="h-6 w-6 mb-1" />
                <span className="text-xs">Vorhanden</span>
              </Button>
              <Button
                variant={status === "missing" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("missing")}
              >
                <XCircle className="h-6 w-6 mb-1" />
                <span className="text-xs">Fehlt</span>
              </Button>
              <Button
                variant={status === "replaced" ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setStatus("replaced")}
              >
                <RefreshCw className="h-6 w-6 mb-1" />
                <span className="text-xs">Ersetzt</span>
              </Button>
            </div>
          </div>

          {/* Replacement selection */}
          {status === "replaced" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ersetzt durch</label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ersatzausrüstung wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableReplacements.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} {eq.inventory_number && `(${eq.inventory_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notizen (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Bemerkungen..."
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLastItem}
              >
                Überspringen
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleCheckItem}
                disabled={status === "replaced" && !replacementId}
              >
                {isLastItem ? "Abschließen" : (
                  <>
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
