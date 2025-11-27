import { useState } from "react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CheckCircle2, Search, Package, Filter } from "lucide-react";
import { useCreateInventoryCheckItem, useUpdateInventoryCheck } from "@/hooks/useTemplateInventory";
import { useEquipment } from "@/hooks/useEquipment";
import { useAddEquipmentToTemplate } from "@/hooks/useEquipmentTemplates";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const { mutateAsync: addEquipmentToTemplate } = useAddEquipmentToTemplate();

  // Get items that haven't been checked yet
  const checkedEquipmentIds = checkedItems.map(item => item.equipment_id);
  const missingItems = templateItems.filter(
    item => !checkedEquipmentIds.includes(item.equipment_id)
  );

  // Filter available equipment (not in template and not already checked)
  const templateEquipmentIds = templateItems.map(item => item.equipment_id);
  const availableEquipment = allEquipment.filter(eq => 
    !templateEquipmentIds.includes(eq.id) && 
    !checkedEquipmentIds.includes(eq.id)
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

  const filteredAvailableEquipment = availableEquipment.filter(item => {
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

  const handleAddSelected = async () => {
    if (selectedEquipment.length === 0) return;

    try {
      for (const equipmentId of selectedEquipment) {
        // Add to template
        await addEquipmentToTemplate({
          template_id: templateId,
          equipment_id: equipmentId,
          notes: notes || undefined,
        });
        
        // Mark as present in inventory
        await createItem.mutateAsync({
          inventory_check_id: checkId,
          equipment_id: equipmentId,
          status: "present",
          notes: notes || undefined,
        });
      }
      
      toast.success(`${selectedEquipment.length} Ausrüstung(en) hinzugefügt`);
      setSelectedEquipment([]);
      setNotes("");
      setSearchTerm("");
      setCategoryFilter("");
      setLocationFilter("");
    } catch (error) {
      toast.error("Fehler beim Hinzufügen");
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
    const visibleIds = filteredAvailableEquipment.map(item => item.id);
    setSelectedEquipment(visibleIds);
  };

  const clearSelection = () => {
    setSelectedEquipment([]);
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setLocationFilter("");
    setSearchTerm("");
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
      setIsCompleteDialogOpen(false);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Fehler beim Abschließen");
    }
  };

  const handleCompleteClick = () => {
    setIsCompleteDialogOpen(true);
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

                <div className="space-y-4 pt-4 border-t">
                  <div className="text-sm font-medium">Weitere Ausrüstung hinzufügen</div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nach Name, Barcode oder Inventarnummer suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
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
                        Zurücksetzen
                      </Button>
                    </div>
                  </div>

                  {/* Selection buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllVisible}>
                      <Package className="mr-2 h-4 w-4" />
                      Alle auswählen ({filteredAvailableEquipment.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Auswahl löschen ({selectedEquipment.length})
                    </Button>
                  </div>

                  {/* Equipment list */}
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <div className="p-2 space-y-2">
                      {filteredAvailableEquipment.length > 0 ? (
                        filteredAvailableEquipment.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                            <Checkbox
                              checked={selectedEquipment.includes(item.id)}
                              onCheckedChange={() => handleEquipmentToggle(item.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.barcode ? `Barcode: ${item.barcode}` : ''}
                                {item.barcode && item.inventory_number ? ' • ' : ''}
                                {item.inventory_number ? `Inv-Nr: ${item.inventory_number}` : ''}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          {searchTerm || categoryFilter || locationFilter ? 'Keine passende Ausrüstung gefunden' : 'Keine weitere Ausrüstung verfügbar'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notizen (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notizen für alle ausgewählten..."
                      rows={2}
                    />
                  </div>

                  {/* Add button */}
                  <Button 
                    onClick={handleAddSelected}
                    disabled={selectedEquipment.length === 0}
                    className="w-full"
                  >
                    {selectedEquipment.length} Hinzufügen
                  </Button>
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
            <Button onClick={handleCompleteClick} className="ml-auto">
              Inventur abschließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inventur abschließen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Inventur abschließen möchten? 
              {missingItems.length > 0 && (
                <span className="block mt-2 text-orange-600">
                  Es gibt noch {missingItems.length} nicht geprüfte Position(en).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onComplete(); onOpenChange(false); setIsCompleteDialogOpen(false); }}>
              Ja, abschließen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
