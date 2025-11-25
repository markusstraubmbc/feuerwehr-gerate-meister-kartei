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
import { Search, ScanLine } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { QRScanner } from "@/components/equipment/QRScanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReplacementEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (equipmentId: string) => void;
  currentEquipmentId?: string;
}

export function ReplacementEquipmentDialog({
  open,
  onOpenChange,
  onSelect,
  currentEquipmentId,
}: ReplacementEquipmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: equipment = [] } = useEquipment();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();

  const filteredEquipment = equipment
    .filter(item => item.id !== currentEquipmentId && item.status === "einsatzbereit")
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

  const handleScan = (barcode: string) => {
    const scannedEquipment = equipment.find(
      eq => eq.barcode === barcode && eq.id !== currentEquipmentId && eq.status === "einsatzbereit"
    );

    if (scannedEquipment) {
      onSelect(scannedEquipment.id);
      setScannerOpen(false);
      onOpenChange(false);
    } else {
      setSearchTerm(barcode);
      setScannerOpen(false);
    }
  };

  const handleSelect = (equipmentId: string) => {
    onSelect(equipmentId);
    setSearchTerm("");
    setCategoryFilter("");
    setLocationFilter("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ersatzausrüstung auswählen</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search with Scanner */}
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
                onClick={() => setScannerOpen(true)}
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Kategorie</Label>
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
                <Label>Standort</Label>
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
            </div>

            {/* Equipment list */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleSelect(item.id)}
                    >
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
                      <Button variant="outline" size="sm">
                        Auswählen
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Keine passende Ausrüstung gefunden
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <QRScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
      />
    </>
  );
}
