
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Equipment } from "@/hooks/useEquipment";

interface DuplicateEquipmentDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateEquipmentDialog({
  equipment,
  open,
  onOpenChange,
}: DuplicateEquipmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [count, setCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 100) { // Begrenzen auf max. 100 Duplikate
      setCount(value);
    }
  };

  const handleDuplicate = async () => {
    if (count <= 0) {
      setError("Bitte geben Sie eine positive Zahl ein.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const duplicates = [];
      
      for (let i = 0; i < count; i++) {
        // Erstelle ein neues Objekt ohne die ID
        const {id, created_at, updated_at, ...equipmentData} = equipment;
        
        duplicates.push({
          ...equipmentData,
          name: `${equipment.name} #${i + 1}`,
          // Entferne eindeutige Werte
          inventory_number: null, 
          barcode: null,
          serial_number: null
        });
      }
      
      // Alle Duplikate in einem Batch einfügen
      const { error: insertError } = await supabase
        .from("equipment")
        .insert(duplicates);
        
      if (insertError) throw insertError;
      
      toast({
        title: "Ausrüstung dupliziert",
        description: `${count} ${count === 1 ? 'Duplikat wurde' : 'Duplikate wurden'} erfolgreich erstellt.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Fehler beim Duplizieren:", err);
      setError(`Ein Fehler ist aufgetreten: ${err.message}`);
      
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Ausrüstung konnte nicht dupliziert werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ausrüstung duplizieren</DialogTitle>
          <DialogDescription>
            Geben Sie an, wie viele Kopien von "{equipment.name}" erstellt werden sollen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="count">Anzahl der Kopien</Label>
            <Input 
              id="count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={handleCountChange}
            />
            <p className="text-sm text-muted-foreground">
              Die duplizierten Ausrüstungen erhalten automatisch eine fortlaufende Nummer.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleDuplicate} disabled={isLoading || count < 1}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird dupliziert...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Duplizieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
