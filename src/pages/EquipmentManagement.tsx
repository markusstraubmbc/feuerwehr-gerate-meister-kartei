
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileDown,
  FileUp,
  Plus,
  Printer
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
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { EquipmentFilters } from "@/components/equipment/EquipmentFilters";
import { useEquipmentFilters } from "@/hooks/useEquipmentFilters";
import { exportEquipmentToExcel } from "@/components/equipment/EquipmentExport";

const EquipmentManagement = () => {
  const isMobile = useIsMobile();
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: locations } = useLocations();
  
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const printRef = useRef(null);
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

  const handlePrintByLocation = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Ausrüstungsliste-${
      selectedLocation && locations
        ? locations.find(loc => loc.id === selectedLocation)?.name
        : 'Alle-Standorte'
    }`,
    pageStyle: '@page { size: auto; margin: 10mm; } @media print { body { font-size: 12pt; } }',
    onBeforePrint: () => {
      if (!printRef.current) {
        toast("Drucken konnte nicht gestartet werden", {
          description: "Es gab ein Problem beim Vorbereiten der Druckansicht."
        });
      } else {
        console.log('Printing equipment list...');
      }
    }
  });

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
          <Button variant="outline" size="sm" onClick={handlePrintByLocation}>
            <Printer className="h-4 w-4 mr-2" />
            {isMobile ? '' : 'Drucken'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            {isMobile ? '' : 'Exportieren'}
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
          <div ref={printRef} className="print-container">
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
          </div>
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
      
      <ImportEquipmentDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen} 
      />
      
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            button, input, select {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EquipmentManagement;
