
import { Equipment } from "@/hooks/useEquipment";
import { Location } from "@/hooks/useLocations";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

// Hilfsfunktion, um die Barcode-Bild-URL zu erstellen
function getBarcodeUrl(barcode: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    barcode
  )}&scale=2&height=12&includetext=true&textxalign=center&backgroundcolor=FFFFFF`;
}

interface ExportEquipmentProps {
  equipment: Equipment[];
  locations?: Location[];
  selectedLocation: string | null;
  searchTerm: string;
  selectedCategory: string | null;
  selectedPerson: string | null;
  selectedStatus: string | null;
}

export const exportEquipmentToExcel = ({
  equipment,
  locations,
  selectedLocation,
  searchTerm,
  selectedCategory,
  selectedPerson,
  selectedStatus
}: ExportEquipmentProps) => {
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
    'Strichcode-URL': item.barcode ? getBarcodeUrl(item.barcode) : '',
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
  
  const fileName = `Ausrüstungsliste-${
    selectedLocation && locations
      ? locations.find(loc => loc.id === selectedLocation)?.name
      : 'Alle-Standorte'
  }-${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
  toast.success(`Ausrüstungsliste wurde als ${fileName} exportiert`);
};
