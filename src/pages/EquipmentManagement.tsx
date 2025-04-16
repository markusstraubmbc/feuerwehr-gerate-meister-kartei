
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Package,
  Plus,
  FileDown,
  ArrowLeft
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

const EquipmentManagement = () => {
  const navigate = useNavigate();
  const { data: equipment, isLoading, error } = useEquipment();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  
  const filteredEquipment = equipment?.filter(
    (item) =>
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
          <Button variant="outline" size="sm">
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
