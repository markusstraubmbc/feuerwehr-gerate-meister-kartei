
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
  const [duplicateInventoryNumber, setDuplicateInventoryNumber] = useState(
    equipment?.inventory_number ? `${equipment.inventory_number}-KOPIE` : ''
  );
  const [duplicateBarcode, setDuplicateBarcode] = useState(
    equipment?.barcode ? `${equipment.barcode}-KOPIE` : ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const generateUniqueInventoryNumber = async (baseNumber: string | null): Promise<string | null> => {
    if (!baseNumber) return null;
    
    let counter = 1;
    let newNumber = `${baseNumber}-KOPIE`;
    
    while (counter <= 100) { // Prevent infinite loop
      const { data, error } = await supabase
        .from("equipment")
        .select("id")
        .eq("inventory_number", newNumber)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No record found, this number is available
        return newNumber;
      }
      
      if (data) {
        // Number exists, try next one
        counter++;
        newNumber = `${baseNumber}-KOPIE-${counter}`;
      } else {
        // Some other error occurred
        break;
      }
    }
    
    // If we can't find a unique number, return null
    return null;
  };

  const generateUniqueBarcode = async (baseBarcode: string | null): Promise<string | null> => {
    if (!baseBarcode) return null;
    
    let counter = 1;
    let newBarcode = `${baseBarcode}-KOPIE`;
    
    while (counter <= 100) { // Prevent infinite loop
      const { data, error } = await supabase
        .from("equipment")
        .select("id")
        .eq("barcode", newBarcode)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No record found, this barcode is available
        return newBarcode;
      }
      
      if (data) {
        // Barcode exists, try next one
        counter++;
        newBarcode = `${baseBarcode}-KOPIE-${counter}`;
      } else {
        // Some other error occurred
        break;
      }
    }
    
    // If we can't find a unique barcode, return null
    return null;
  };

  const handleDuplicate = async () => {
    if (!equipment || !duplicateName.trim()) return;

    setIsProcessing(true);
    try {
      // Use user-provided values or generate unique ones if empty
      let finalInventoryNumber = duplicateInventoryNumber.trim() || null;
      let finalBarcode = duplicateBarcode.trim() || null;
      
      // If user provided values, check if they already exist
      if (finalInventoryNumber) {
        const { data: existingByInventory } = await supabase
          .from("equipment")
          .select("id")
          .eq("inventory_number", finalInventoryNumber)
          .single();
        
        if (existingByInventory) {
          toast.error("Diese Inventarnummer existiert bereits. Bitte wählen Sie eine andere.");
          setIsProcessing(false);
          return;
        }
      }
      
      if (finalBarcode) {
        const { data: existingByBarcode } = await supabase
          .from("equipment")
          .select("id")
          .eq("barcode", finalBarcode)
          .single();
        
        if (existingByBarcode) {
          toast.error("Dieser Barcode existiert bereits. Bitte wählen Sie einen anderen.");
          setIsProcessing(false);
          return;
        }
      }
      
      // If no user input, generate unique values
      if (!finalInventoryNumber && equipment.inventory_number) {
        finalInventoryNumber = await generateUniqueInventoryNumber(equipment.inventory_number);
      }
      
      if (!finalBarcode && equipment.barcode) {
        finalBarcode = await generateUniqueBarcode(equipment.barcode);
      }
      
      // Create a clean object for the duplication
      const equipmentToDuplicate = {
        name: duplicateName.trim(),
        inventory_number: finalInventoryNumber,
        barcode: finalBarcode,
        serial_number: equipment.serial_number,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        category_id: equipment.category_id,
        status: equipment.status,
        location_id: equipment.location_id,
        responsible_person_id: equipment.responsible_person_id,
        notes: equipment.notes,
        purchase_date: equipment.purchase_date,
        replacement_date: equipment.replacement_date,
        last_check_date: equipment.last_check_date,
        next_check_date: equipment.next_check_date
      };
      
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ausrüstung duplizieren</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Kopie dieser Ausrüstung. Sie können Name, Inventarnummer und Barcode anpassen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Name *</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Name für die duplizierte Ausrüstung"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duplicate-inventory">Inventarnummer</Label>
            <Input
              id="duplicate-inventory"
              value={duplicateInventoryNumber}
              onChange={(e) => setDuplicateInventoryNumber(e.target.value)}
              placeholder="Neue Inventarnummer (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Original: {equipment?.inventory_number || "Keine"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duplicate-barcode">Barcode</Label>
            <Input
              id="duplicate-barcode"
              value={duplicateBarcode}
              onChange={(e) => setDuplicateBarcode(e.target.value)}
              placeholder="Neuer Barcode (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Original: {equipment?.barcode || "Kein"}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              Alle anderen Eigenschaften des Originals werden übernommen. 
              Wenn Inventarnummer oder Barcode leer gelassen werden, wird automatisch eine eindeutige Nummer generiert.
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
