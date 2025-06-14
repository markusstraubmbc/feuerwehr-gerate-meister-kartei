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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Equipment } from "@/hooks/useEquipment";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { usePersons } from "@/hooks/usePersons";
import { Database } from "@/integrations/supabase/types";

type EquipmentStatus = Database["public"]["Enums"]["equipment_status"];

interface EditEquipmentFormProps {
  equipment: Equipment;
  onSuccess: () => void;
}

export function EditEquipmentForm({ equipment, onSuccess }: EditEquipmentFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { data: persons = [] } = usePersons();

  const [formData, setFormData] = useState({
    name: equipment.name || "",
    inventory_number: equipment.inventory_number || "",
    serial_number: equipment.serial_number || "",
    manufacturer: equipment.manufacturer || "",
    model: equipment.model || "",
    category_id: equipment.category_id || "",
    location_id: equipment.location_id || "",
    responsible_person_id: equipment.responsible_person_id || "",
    status: equipment.status || "einsatzbereit" as EquipmentStatus,
    purchase_date: equipment.purchase_date || "",
    replacement_date: equipment.replacement_date || "",
    notes: equipment.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("equipment")
        .update({
          name: formData.name,
          inventory_number: formData.inventory_number || null,
          serial_number: formData.serial_number || null,
          manufacturer: formData.manufacturer || null,
          model: formData.model || null,
          category_id: formData.category_id || null,
          location_id: formData.location_id || null,
          responsible_person_id: formData.responsible_person_id || null,
          status: formData.status,
          purchase_date: formData.purchase_date || null,
          replacement_date: formData.replacement_date || null,
          notes: formData.notes || null,
        })
        .eq("id", equipment.id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Ausrüstung wurde erfolgreich aktualisiert.",
      });

      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      onSuccess();
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren der Ausrüstung.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ausrüstung bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details für {equipment.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="inventory_number">Inventarnummer</Label>
              <Input
                id="inventory_number"
                value={formData.inventory_number}
                onChange={(e) => setFormData({ ...formData, inventory_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="serial_number">Seriennummer</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Hersteller</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="model">Modell</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine Kategorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Standort</Label>
              <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Standort auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Standort</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsible_person">Verantwortliche Person</Label>
              <Select value={formData.responsible_person_id} onValueChange={(value) => setFormData({ ...formData, responsible_person_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Person auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine Person</SelectItem>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as EquipmentStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einsatzbereit">Einsatzbereit</SelectItem>
                  <SelectItem value="prüfung fällig">Prüfung fällig</SelectItem>
                  <SelectItem value="wartung">Wartung</SelectItem>
                  <SelectItem value="defekt">Defekt</SelectItem>
                  <SelectItem value="aussortiert">Aussortiert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchase_date">Kaufdatum</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="replacement_date">Ersatzdatum</Label>
              <Input
                id="replacement_date"
                type="date"
                value={formData.replacement_date}
                onChange={(e) => setFormData({ ...formData, replacement_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
