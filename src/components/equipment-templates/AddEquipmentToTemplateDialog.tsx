import { useState } from "react";
import * as React from "react";
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
import { Search, Package, Filter } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { useTemplateEquipmentItems, useAddEquipmentToTemplate } from "@/hooks/useEquipmentTemplates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddEquipmentToTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

export function AddEquipmentToTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: AddEquipmentToTemplateDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  
  // Quick filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: equipment = [] } = useEquipment();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { data: existingItems = [] } = useTemplateEquipmentItems(templateId);
  const addEquipment = useAddEquipmentToTemplate();

  // Filter equipment based on search term and exclude already added equipment
  const existingEquipmentIds = existingItems.map(item => item.equipment_id);
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
      if (categoryFilter && categoryFilter !== "all_categories" && item.category?.id !== categoryFilter) {
        return false;
      }

      // Location filter
      if (locationFilter && locationFilter !== "all_locations" && item.location?.id !== locationFilter) {
        return false;
      }

      return true;
    });

  // Auto-add when filtered to exactly 1 equipment
  const autoAddEquipment = async (equipmentId: string) => {
    addEquipment.mutate(
      {
        template_id: templateId,
        equipment_id: equipmentId,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          // Clear search to show next items
          setSearchTerm("");
          setCategoryFilter("");
          setLocationFilter("");
          setNotes("");
        }
      }
    );
  };

  // Check if we should auto-add
  React.useEffect(() => {
    if (filteredEquipment.length === 1 && (searchTerm || categoryFilter || locationFilter)) {
      const equipmentId = filteredEquipment[0].id;
      // Small delay to allow user to see what's happening
      const timer = setTimeout(() => {
        autoAddEquipment(equipmentId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filteredEquipment.length, searchTerm, categoryFilter, locationFilter]);

  const handleSubmit = async () => {
    if (selectedEquipment.length === 0) return;

    for (const equipmentId of selectedEquipment) {
      addEquipment.mutate({
        template_id: templateId,
        equipment_id: equipmentId,
        notes: notes || undefined,
      });
    }
    
    // Reset form
    setSelectedEquipment([]);
    setNotes("");
    setSearchTerm("");
    setCategoryFilter("");
    setLocationFilter("");
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ausrüstung zur Vorlage hinzufügen</DialogTitle>
          <p className="text-sm text-muted-foreground">{templateName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
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
          </div>

          {/* Quick filters */}
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <Label htmlFor="category-filter">Kategorie</Label>
              <Select value={categoryFilter || "all_categories"} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">Alle Kategorien</SelectItem>
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
              <Select value={locationFilter || "all_locations"} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Standorte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_locations">Alle Standorte</SelectItem>
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notizen für alle ausgewählten (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Zusätzliche Informationen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedEquipment.length === 0}
          >
            {selectedEquipment.length} Hinzufügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
