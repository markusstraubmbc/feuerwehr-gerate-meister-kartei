
import { useState } from "react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Filter } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const Maintenance = () => {
  const { data: records, isLoading, error } = useMaintenanceRecords();
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Wartungsaufzeichnungen</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wartung</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
          <Button size="sm" onClick={() => setIsNewMaintenanceOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Wartung
          </Button>
        </div>
      </div>

      <MaintenanceList records={records || []} />

      <Drawer open={isNewMaintenanceOpen} onOpenChange={setIsNewMaintenanceOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Neue Wartung anlegen</DrawerTitle>
            <DrawerDescription>
              Bitte füllen Sie alle erforderlichen Felder aus.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <NewMaintenanceForm onSuccess={() => setIsNewMaintenanceOpen(false)} />
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

export default Maintenance;
