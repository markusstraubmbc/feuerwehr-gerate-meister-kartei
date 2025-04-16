
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Filter } from "lucide-react";

const Maintenance = () => {
  const { data: records, isLoading, error } = useMaintenanceRecords();

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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Neue Wartung
          </Button>
        </div>
      </div>

      <MaintenanceList records={records || []} />
    </div>
  );
};

export default Maintenance;
