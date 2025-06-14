
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentList } from "./EquipmentList";
import { NewEquipmentForm } from "./NewEquipmentForm";
import { EquipmentFilters } from "./EquipmentFilters";
import { useEquipmentFilters } from "@/hooks/useEquipmentFilters";

export function EquipmentManagementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const { data: equipment, isLoading, error } = useEquipment();
  
  const {
    searchTerm,
    selectedLocation,
    selectedCategory,
    selectedPerson,
    selectedStatus,
    handleFilterChange,
    resetFilters
  } = useEquipmentFilters();

  const handleNewEquipmentSuccess = () => {
    setActiveTab("list");
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Ausrüstung verwalten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ausrüstungsverwaltung
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Ausrüstung verwalten</TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Neue Ausrüstung
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
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
              searchTerm={searchTerm}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewEquipmentForm onSuccess={handleNewEquipmentSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
