
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";

const Maintenance = () => {
  const [showNewForm, setShowNewForm] = useState(false);
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();

  const pendingRecords = maintenanceRecords.filter(record => record.status === 'ausstehend');
  const completedRecords = maintenanceRecords.filter(record => record.status === 'abgeschlossen');
  const overdueRecords = maintenanceRecords.filter(record => 
    record.status === 'ausstehend' && new Date(record.due_date) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wartung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Wartungstermine und -protokolle
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Wartung
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle Wartungen</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
          <TabsTrigger value="overdue">Überfällig</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MaintenanceList records={maintenanceRecords} />
        </TabsContent>

        <TabsContent value="pending">
          <MaintenanceList records={pendingRecords} />
        </TabsContent>

        <TabsContent value="completed">
          <MaintenanceList records={completedRecords} />
        </TabsContent>

        <TabsContent value="overdue">
          <MaintenanceList records={overdueRecords} />
        </TabsContent>
      </Tabs>

      {showNewForm && (
        <NewMaintenanceForm onSuccess={() => setShowNewForm(false)} />
      )}
    </div>
  );
};

export default Maintenance;
