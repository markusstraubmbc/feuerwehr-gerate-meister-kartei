
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Equipment } from "@/hooks/useEquipment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DuplicateEquipmentDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateEquipmentDialog({ equipment, open, onOpenChange }: DuplicateEquipmentDialogProps) {
  const [duplicateName, setDuplicateName] = useState(`${equipment?.name || ''} (Kopie)`);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const handleDuplicate = async () => {
    if (!equipment || !duplicateName.trim()) return;

    setIsProcessing(true);
    try {
      // Create a clean copy of the equipment object for duplication
      const equipmentToDuplicate: any = {};
      
      // Copy only the fields we want to duplicate
      // This avoids issues with nested objects that cause problems with supabase insert
      equipmentToDuplicate.name = duplicateName.trim();
      equipmentToDuplicate.inventory_number = equipment.inventory_number;
      equipmentToDuplicate.barcode = equipment.barcode;
      equipmentToDuplicate.serial_number = equipment.serial_number;
      equipmentToDuplicate.manufacturer = equipment.manufacturer;
      equipmentToDuplicate.model = equipment.model;
      equipmentToDuplicate.status = equipment.status;
      equipmentToDuplicate.notes = equipment.notes;
      equipmentToDuplicate.purchase_date = equipment.purchase_date;
      equipmentToDuplicate.replacement_date = equipment.replacement_date;
      equipmentToDuplicate.last_check_date = equipment.last_check_date;
      equipmentToDuplicate.next_check_date = equipment.next_check_date;
      equipmentToDuplicate.category_id = equipment.category_id;
      equipmentToDuplicate.location_id = equipment.location_id;
      equipmentToDuplicate.responsible_person_id = equipment.responsible_person_id;
      
      const { data, error } = await supabase
        .from("equipment")
        .insert(equipmentToDuplicate)
        .select()
        .single();

      if (error) {
        console.error("Fehler beim Duplizieren:", error);
        toast.error("Die Ausrüstung konnte nicht dupliziert werden.");
        return;
      }

      toast.success("Ausrüstung erfolgreich dupliziert.");
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Fehler beim Duplizieren:", error);
      toast.error("Die Ausrüstung konnte nicht dupliziert werden.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ausrüstung duplizieren</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Kopie dieser Ausrüstung mit einem neuen Namen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Neuer Name</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Name für die duplizierte Ausrüstung"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Alle Eigenschaften des Originals werden in die neue Ausrüstung übernommen, außer der Name.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleDuplicate} 
            disabled={isProcessing || !duplicateName.trim()}
          >
            {isProcessing ? "Wird dupliziert..." : "Duplizieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
