
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileDown,
  FileUp,
  Plus
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
import { useIsMobile } from "@/hooks/use-mobile";
import { ImportEquipmentDialog } from "@/components/equipment/ImportEquipmentDialog";
import { EquipmentFilters } from "@/components/equipment/EquipmentFilters";
import { useEquipmentFilters } from "@/hooks/useEquipmentFilters";
import { exportEquipmentToExcel } from "@/components/equipment/EquipmentExport";

const EquipmentManagement = () => {
  const isMobile = useIsMobile();
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: locations } = useLocations();
  
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const {
    searchTerm,
    selectedLocation,
    selectedCategory,
    selectedPerson,
    selectedStatus,
    setSelectedLocation,
    handleFilterChange,
    resetFilters
  } = useEquipmentFilters();

  const handleExportToExcel = () => {
    if (!equipment) return;
    
    exportEquipmentToExcel({
      equipment,
      locations,
      selectedLocation,
      searchTerm,
      selectedCategory,
      selectedPerson,
      selectedStatus
    });
  };
  
  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Ausrüstungsverwaltung</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            {isMobile ? '' : 'Excel Export'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            {isMobile ? '' : 'Importieren'}
          </Button>
          <Button size="sm" onClick={() => setIsNewEquipmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? '' : 'Neue Ausrüstung'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ausrüstung verwalten</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentFilters 
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            selectedPerson={selectedPerson}
            selectedStatus={selectedStatus}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
          />
          <EquipmentList 
            equipment={equipment || []} 
            statusFilter={selectedStatus || undefined}
            categoryFilter={selectedCategory || undefined}
            personFilter={selectedPerson || undefined}
            onFilterChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      <Drawer open={isNewEquipmentOpen} onOpenChange={setIsNewEquipmentOpen}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
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
      
      <ImportEquipmentDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen} 
      />
    </div>
  );
};

export default EquipmentManagement;
