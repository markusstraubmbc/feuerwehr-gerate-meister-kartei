import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2, ScanLine } from "lucide-react";
import { useCreateInventoryCheckItem, useUpdateInventoryCheck } from "@/hooks/useTemplateInventory";
import { useEquipment } from "@/hooks/useEquipment";
import { useAddEquipmentToTemplate } from "@/hooks/useEquipmentTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRScanner } from "@/components/equipment/QRScanner";
import type { TemplateEquipmentItem } from "@/hooks/useEquipmentTemplates";

interface AddMissingItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkId: string;
  templateId: string;
  templateItems: TemplateEquipmentItem[];
  checkedItems: any[];
  onComplete: () => void;
}

export function AddMissingItemsDialog({
  open,
  onOpenChange,
  checkId,
  templateId,
  templateItems,
  checkedItems,
  onComplete,
}: AddMissingItemsDialogProps) {
  const createItem = useCreateInventoryCheckItem();
  const updateCheck = useUpdateInventoryCheck();
  const { data: allEquipment = [] } = useEquipment();
  const [notes, setNotes] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const { mutateAsync: addEquipmentToTemplate } = useAddEquipmentToTemplate();

  // Get items that haven't been checked yet
  const checkedEquipmentIds = checkedItems.map(item => item.equipment_id);
  const missingItems = templateItems.filter(
    item => !checkedEquipmentIds.includes(item.equipment_id)
  );

  // Update template when item is missing or replaced
  const updateTemplateForItem = async (item: any) => {
    try {
      if (item.status === "missing") {
        // Remove from template
        await supabase
          .from("template_equipment_items")
          .delete()
          .eq("equipment_id", item.equipment_id)
          .eq("template_id", templateItems[0]?.template_id);
      } else if (item.status === "replaced" && item.replacement_equipment_id) {
        // Replace in template
        await supabase
          .from("template_equipment_items")
          .update({ equipment_id: item.replacement_equipment_id })
          .eq("equipment_id", item.equipment_id)
          .eq("template_id", templateItems[0]?.template_id);
      }
    } catch (error) {
      console.error("Template update error:", error);
    }
  };

  const handleAddMissing = async (equipmentId: string, status: "present" | "missing") => {
    try {
      await createItem.mutateAsync({
        inventory_check_id: checkId,
        equipment_id: equipmentId,
        status,
        notes: notes || undefined,
      });

      const item = { equipment_id: equipmentId, status };
      await updateTemplateForItem(item);

      toast.success(status === "present" ? "Als vorhanden markiert" : "Als fehlend markiert");
      setNotes("");
    } catch (error) {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleScanNewItem = async (barcode: string) => {
    const equipment = allEquipment.find(eq => eq.barcode === barcode);
    if (equipment) {
      // Check if equipment is already in template
      const isInTemplate = templateItems.some(item => item.equipment_id === equipment.id);
      
      if (!isInTemplate && templateId) {
        // Add to template
        try {
          await addEquipmentToTemplate({
            template_id: templateId,
            equipment_id: equipment.id,
            notes: notes || undefined,
          });
          toast.success("Ausrüstung zur Vorlage hinzugefügt und als vorhanden markiert");
        } catch (error) {
          toast.error("Fehler beim Hinzufügen zur Vorlage");
          return;
        }
      }
      
      await handleAddMissing(equipment.id, "present");
      setScannerOpen(false);
    } else {
      toast.error("Ausrüstung nicht gefunden");
    }
  };

  const handleManualAdd = () => {
    // Allow user to search and add equipment manually
    // This will show all equipment that is not already in the check
    const uncheckedEquipment = allEquipment.filter(eq => 
      !checkedEquipmentIds.includes(eq.id) &&
      !templateItems.some(item => item.equipment_id === eq.id)
    );
    
    // For now just show a simple implementation
    // You could expand this with a search dialog
    if (uncheckedEquipment.length === 0) {
      toast.info("Alle Ausrüstungen wurden bereits erfasst");
    }
  };

  const handleCompleteAll = async () => {
    try {
      for (const item of missingItems) {
        await createItem.mutateAsync({
          inventory_check_id: checkId,
          equipment_id: item.equipment_id,
          status: "missing",
        });
        await updateTemplateForItem({ equipment_id: item.equipment_id, status: "missing" });
      }
      
      // Update all checked items with template updates
      for (const item of checkedItems) {
        await updateTemplateForItem(item);
      }
      
      toast.success("Alle nicht geprüften Positionen als fehlend markiert");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Fehler beim Abschließen");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nicht erfasste Geräte</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {missingItems.length === 0
                ? "Alle Positionen wurden geprüft"
                : `${missingItems.length} Position(en) wurden nicht geprüft`}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
            {missingItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-lg font-semibold">Alle Positionen geprüft!</p>
              </div>
            ) : (
              <>
                {missingItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.equipment?.name}</h4>
                        {item.equipment?.category && (
                          <p className="text-sm text-muted-foreground">
                            Kategorie: {item.equipment.category.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Nicht geprüft</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMissing(item.equipment_id, "present")}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Vorhanden
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMissing(item.equipment_id, "missing")}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Fehlt
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Weitere Ausrüstung hinzufügen</div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setScannerOpen(true)}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Ausrüstung scannen
                  </Button>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notizen für neu hinzugefügte Ausrüstung..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Scannen Sie zusätzliche Ausrüstung, die gefunden wurde aber nicht in der Vorlage ist. 
                    Diese wird automatisch zur Vorlage hinzugefügt.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            {missingItems.length > 0 && (
              <Button variant="outline" onClick={handleCompleteAll}>
                Alle als fehlend
              </Button>
            )}
            <Button onClick={() => { onComplete(); onOpenChange(false); }} className="ml-auto">
              Inventur abschließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanNewItem}
      />
    </>
  );
}
