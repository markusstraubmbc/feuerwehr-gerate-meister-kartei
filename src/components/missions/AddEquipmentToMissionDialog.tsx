
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { QrCode, Package, Plus, Search } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { usePersons } from "@/hooks/usePersons";
import { Mission } from "@/hooks/useMissions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddEquipmentToMissionDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddEquipmentToMissionDialog = ({ mission, open, onOpenChange }: AddEquipmentToMissionDialogProps) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: equipment } = useEquipment();
  const { data: persons } = usePersons();
  const queryClient = useQueryClient();

  // Filter equipment based on search query
  const filteredEquipment = equipment?.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inventory_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleBarcodeAdd = () => {
    if (!barcodeInput.trim()) return;

    const foundEquipment = equipment?.find(item => 
      item.barcode === barcodeInput.trim() || 
      item.inventory_number === barcodeInput.trim()
    );

    if (foundEquipment) {
      if (!selectedEquipment.includes(foundEquipment.id)) {
        setSelectedEquipment(prev => [...prev, foundEquipment.id]);
        toast.success(`${foundEquipment.name} hinzugefügt`);
      } else {
        toast.info("Ausrüstung bereits ausgewählt");
      }
      setBarcodeInput("");
    } else {
      toast.error("Ausrüstung mit diesem Barcode/Inventarnummer nicht gefunden");
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedEquipment.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Ausrüstung aus");
      return;
    }

    setIsSubmitting(true);
    try {
      const insertData = selectedEquipment.map(equipmentId => ({
        mission_id: mission.id,
        equipment_id: equipmentId,
        added_by: addedBy || null,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from("mission_equipment")
        .insert(insertData);

      if (error) throw error;

      toast.success(`${selectedEquipment.length} Ausrüstungsgegenstand${selectedEquipment.length > 1 ? 'e' : ''} hinzugefügt`);
      
      // Reset form
      setSelectedEquipment([]);
      setNotes("");
      setBarcodeInput("");
      setSearchQuery("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["mission-equipment", mission.id] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error("Fehler beim Hinzufügen der Ausrüstung");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ausrüstung zu "{mission.title}" hinzufügen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Barcode/Quick Add Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center">
              <QrCode className="h-4 w-4 mr-2" />
              Schnell hinzufügen (Barcode/Inventarnummer)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Barcode oder Inventarnummer scannen/eingeben..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeAdd();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleBarcodeAdd} disabled={!barcodeInput.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>

          <Separator />

          {/* Search and Mass Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Ausrüstung durchsuchen und auswählen
            </Label>
            <div className="flex gap-2">
              <Search className="h-4 w-4 mt-3 text-muted-foreground" />
              <Input
                placeholder="Nach Name, Inventarnummer, Barcode oder Kategorie suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Equipment List */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredEquipment.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? "Keine Ausrüstung gefunden" : "Geben Sie einen Suchbegriff ein"}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleEquipmentToggle(item.id)}
                    >
                      <Checkbox
                        checked={selectedEquipment.includes(item.id)}
                        onChange={() => handleEquipmentToggle(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.category?.name} • {item.location?.name}
                          {item.inventory_number && ` • ${item.inventory_number}`}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Equipment Display */}
          {selectedEquipment.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Ausgewählte Ausrüstung ({selectedEquipment.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedEquipment.map((equipmentId) => {
                  const item = equipment?.find(e => e.id === equipmentId);
                  return (
                    <Badge
                      key={equipmentId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleEquipmentToggle(equipmentId)}
                    >
                      {item?.name} ✕
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addedBy">Hinzugefügt von</Label>
                <Select value={addedBy} onValueChange={setAddedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Person auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {persons?.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.first_name} {person.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                placeholder="Zusätzliche Informationen zur Verwendung..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedEquipment.length === 0 || isSubmitting}
            >
              {isSubmitting 
                ? "Wird hinzugefügt..." 
                : `${selectedEquipment.length} Ausrüstung${selectedEquipment.length > 1 ? 'sgegenstände' : 'sgegenstand'} hinzufügen`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
