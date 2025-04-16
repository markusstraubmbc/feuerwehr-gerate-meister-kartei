
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Plus,
  FileDown,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentList } from "@/components/equipment/EquipmentList";
import { NewEquipmentForm } from "@/components/equipment/NewEquipmentForm";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocations } from "@/hooks/useLocations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EquipmentManagement = () => {
  const navigate = useNavigate();
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: locations } = useLocations();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const filteredEquipment = equipment?.filter(
    (item) => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesLocation = !selectedLocation || item.location_id === selectedLocation;
      
      return matchesSearch && matchesLocation;
    }
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleLocationFilter = (locationId: string) => {
    setSelectedLocation(locationId === "all" ? null : locationId);
  };

  const handlePrintByLocation = () => {
    // Implementation for printing by location will be added later
    console.log("Print by location");
    // In a real application, this would generate a print-friendly view
    // filtered by the currently selected location
  };

  const handleExportToExcel = () => {
    // Implementation for Excel export will be added later
    console.log("Export to Excel");
    // In a real application, this would generate an Excel file
    // with the equipment data
  };
  
  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/equipment')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Ausrüstungsverwaltung</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintByLocation}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken nach Lagerort
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
          <Button size="sm" onClick={() => setIsNewEquipmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Ausrüstung
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ausrüstung verwalten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Suche nach ID, Name, Seriennummer oder Barcode..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Select onValueChange={handleLocationFilter} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Standort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Standorte</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <EquipmentList equipment={filteredEquipment || []} />
        </CardContent>
      </Card>

      <Drawer open={isNewEquipmentOpen} onOpenChange={setIsNewEquipmentOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Neue Ausrüstung anlegen</DrawerTitle>
            <DrawerDescription>
              Bitte füllen Sie alle erforderlichen Felder aus.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <NewEquipmentForm onSuccess={() => setIsNewEquipmentOpen(false)} />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EquipmentManagement;
