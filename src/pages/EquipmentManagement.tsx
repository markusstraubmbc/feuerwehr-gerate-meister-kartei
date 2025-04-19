
import { useState, useRef, useEffect } from "react";
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
  FileUp,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { ImportEquipmentDialog } from "@/components/equipment/ImportEquipmentDialog";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { SELECT_ALL_VALUE } from "@/lib/constants";
import { useSearchParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";

const EquipmentManagement = () => {
  const isMobile = useIsMobile();
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: locations } = useLocations();
  const { data: categories } = useCategories();
  const { data: persons } = usePersons();
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedPerson, setSelectedPerson] = useState<string | null>(searchParams.get('person'));
  const [selectedStatus, setSelectedStatus] = useState<string | null>(searchParams.get('status'));
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const printRef = useRef(null);
  
  // Apply URL params to filters
  useEffect(() => {
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const person = searchParams.get('person');
    
    if (status) setSelectedStatus(status);
    if (category) setSelectedCategory(category);
    if (person) setSelectedPerson(person);
  }, [searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleLocationFilter = (locationId: string) => {
    setSelectedLocation(locationId === SELECT_ALL_VALUE ? null : locationId);
  };
  
  const handleFilterChange = (filters: {
    status?: string;
    category?: string;
    person?: string;
    search?: string;
  }) => {
    const newSearchParams = new URLSearchParams();
    
    if (filters.status) {
      newSearchParams.set('status', filters.status);
      setSelectedStatus(filters.status);
    } else {
      setSelectedStatus(null);
    }
    
    if (filters.category && filters.category !== SELECT_ALL_VALUE) {
      newSearchParams.set('category', filters.category);
      setSelectedCategory(filters.category);
    } else {
      setSelectedCategory(null);
    }
    
    if (filters.person && filters.person !== SELECT_ALL_VALUE) {
      newSearchParams.set('person', filters.person);
      setSelectedPerson(filters.person);
    } else {
      setSelectedPerson(null);
    }
    
    if (filters.search) {
      setSearchTerm(filters.search);
    }
    
    setSearchParams(newSearchParams);
  };

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
    
    const filteredEquipment = equipment.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesLocation = !selectedLocation || item.location_id === selectedLocation;
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
      const matchesPerson = !selectedPerson || item.responsible_person_id === selectedPerson;
      const matchesStatus = !selectedStatus || item.status === selectedStatus;
      
      return matchesSearch && matchesLocation && matchesCategory && matchesPerson && matchesStatus;
    });
    
    const exportData = filteredEquipment.map(item => ({
      'Inventarnummer': item.inventory_number || '',
      'Name': item.name,
      'Barcode': item.barcode || '',
      'Seriennummer': item.serial_number || '',
      'Hersteller': item.manufacturer || '',
      'Modell': item.model || '',
      'Kategorie': item.category?.name || '',
      'Status': item.status,
      'Letzte Prüfung': item.last_check_date ? new Date(item.last_check_date).toLocaleDateString('de-DE') : '',
      'Nächste Prüfung': item.next_check_date ? new Date(item.next_check_date).toLocaleDateString('de-DE') : '',
      'Standort': item.location?.name || '',
      'Verantwortliche Person': item.responsible_person 
        ? `${item.responsible_person.first_name} ${item.responsible_person.last_name}`
        : '',
      'Kaufdatum': item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('de-DE') : '',
      'Ersatzdatum': item.replacement_date ? new Date(item.replacement_date).toLocaleDateString('de-DE') : '',
      'Notizen': item.notes || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ausrüstung');
    
    // Generate file name with location info if filtered
    const fileName = `Ausrüstungsliste-${
      selectedLocation && locations
        ? locations.find(loc => loc.id === selectedLocation)?.name
        : 'Alle-Standorte'
    }-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`Ausrüstungsliste wurde als ${fileName} exportiert`);
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
      
      <style jsx global>{`
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
      `}</style>
    </div>
  );
};

export default EquipmentManagement;
