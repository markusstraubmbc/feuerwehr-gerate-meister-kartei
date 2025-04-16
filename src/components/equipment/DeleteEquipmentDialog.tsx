
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Equipment } from "@/hooks/useEquipment";

interface DeleteEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
}

export function DeleteEquipmentDialog({
  open,
  onOpenChange,
  equipment,
}: DeleteEquipmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", equipment.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Ausrüstung erfolgreich gelöscht");
      onOpenChange(false);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Fehler beim Löschen der Ausrüstung");
      setIsLoading(false);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ausrüstung löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Sind Sie sicher, dass Sie diese Ausrüstung löschen möchten?
            <div className="mt-2 font-semibold">{equipment.name}</div>
            {equipment.inventory_number && (
              <div className="text-sm text-muted-foreground">
                Inventarnummer: {equipment.inventory_number}
              </div>
            )}
            <div className="mt-4 text-sm">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Löschen..." : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
