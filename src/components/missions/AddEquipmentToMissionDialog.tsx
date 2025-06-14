
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { QrCode, Search, Package, Filter } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { usePersons } from "@/hooks/usePersons";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QRScanner } from "@/components/equipment/QRScanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddEquipmentToMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  missionTitle: string;
}

export function AddEquipmentToMissionDialog({
  open,
  onOpenChange,
  missionId,
  missionTitle,
}: AddEquipmentToMissionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [addedBy, setAddedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const queryClient = useQueryClient();
  const { data: equipment = [] } = useEquipment();
  const { data: persons = [] } = usePersons();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { data: existingEquipment = [] } = useMissionEquipment(missionId);

  // Filter equipment based on search term and exclude already added equipment
  const existingEquipmentIds = existingEquipment.map(item => item.equipment_id);
  const filteredEquipment = equipment
    .filter(item => !existingEquipmentIds.includes(item.id))
    .filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          item.name.toLowerCase().includes(searchLower) ||
          item.barcode?.toLowerCase().includes(searchLower) ||
          item.inventory_number?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter && item.category?.id !== categoryFilter) {
        return false;
      }

      // Location filter
      if (locationFilter && item.location?.id !== locationFilter) {
        return false;
      }

      return true;
    });

  const handleQRScan = (barcode: string) => {
    const foundEquipment = equipment.find(
      item => item.barcode === barcode || item.inventory_number === barcode
    );
    
    if (foundEquipment) {
      if (existingEquipmentIds.includes(foundEquipment.id)) {
        toast.error("Diese Ausrüstung ist bereits zu diesem Einsatz hinzugefügt");
      } else {
        setSelectedEquipment(prev => [...prev, foundEquipment.id]);
        toast.success(`${foundEquipment.name} wurde zur Auswahl hinzugefügt`);
      }
    } else {
      toast.error("Ausrüstung mit diesem Code nicht gefunden");
    }
  };

  const handleSubmit = async () => {
    if (selectedEquipment.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Ausrüstung aus");
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = selectedEquipment.map(equipmentId => ({
        mission_id: missionId,
        equipment_id: equipmentId,
        added_by: addedBy || null,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from("mission_equipment")
        .insert(insertData);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["mission-equipment", missionId] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      
      toast.success(`${selectedEquipment.length} Ausrüstungsgegenstände wurden hinzugefügt`);
      
      // Reset form
      setSelectedEquipment([]);
      setAddedBy("");
      setNotes("");
      setSearchTerm("");
      setCategoryFilter("");
      setLocationFilter("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding equipment:", error);
      toast.error("Fehler beim Hinzufügen der Ausrüstung");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredEquipment.map(item => item.id);
    const newSelection = [...new Set([...selectedEquipment, ...visibleIds])];
    setSelectedEquipment(newSelection);
  };

  const clearSelection = () => {
    setSelectedEquipment([]);
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setLocationFilter("");
    setSearchTerm("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ausrüstung zu Einsatz hinzufügen</DialogTitle>
            <p className="text-sm text-muted-foreground">{missionTitle}</p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search and QR Scanner */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nach Name, Barcode oder Inventarnummer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowQRScanner(true)}
                className="px-3"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick filters */}
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <Label htmlFor="category-filter">Kategorie</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Kategorien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Kategorien</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location-filter">Standort</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Standorte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Standorte</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter zurücksetzen
                </Button>
              </div>
            </div>

            {/* Mass selection buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                <Package className="mr-2 h-4 w-4" />
                Alle sichtbaren auswählen ({filteredEquipment.length})
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Auswahl löschen ({selectedEquipment.length})
              </Button>
            </div>

            {/* Equipment list */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={selectedEquipment.includes(item.id)}
                        onCheckedChange={() => handleEquipmentToggle(item.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.barcode ? `Barcode: ${item.barcode}` : ''}
                          {item.barcode && item.inventory_number ? ' • ' : ''}
                          {item.inventory_number ? `Inv-Nr: ${item.inventory_number}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.category?.name ? `Kategorie: ${item.category.name}` : ''}
                          {item.category?.name && item.location?.name ? ' • ' : ''}
                          {item.location?.name ? `Standort: ${item.location.name}` : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm || categoryFilter || locationFilter ? 'Keine passende Ausrüstung gefunden' : 'Alle verfügbare Ausrüstung ist bereits hinzugefügt'}
                  </p>
                )}
              </div>
            </div>

            {/* Additional information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="added-by">Hinzugefügt von (optional)</Label>
                <Select value={addedBy} onValueChange={setAddedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Person auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.first_name} {person.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notizen (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Zusätzliche Informationen zur Verwendung..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={selectedEquipment.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Hinzufügen...' : `${selectedEquipment.length} Hinzufügen`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRScanner
        open={showQRScanner}
        onOpenChange={setShowQRScanner}
        onScan={handleQRScan}
      />
    </>
  );
}
