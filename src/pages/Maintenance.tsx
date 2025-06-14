
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { AutoMaintenanceGenerator } from "@/components/maintenance/AutoMaintenanceGenerator";

const Maintenance = () => {
  const [showNewForm, setShowNewForm] = useState(false);

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

      <AutoMaintenanceGenerator />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle Wartungen</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
          <TabsTrigger value="overdue">Überfällig</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MaintenanceList />
        </TabsContent>

        <TabsContent value="pending">
          <MaintenanceList statusFilter="ausstehend" />
        </TabsContent>

        <TabsContent value="completed">
          <MaintenanceList statusFilter="abgeschlossen" />
        </TabsContent>

        <TabsContent value="overdue">
          <MaintenanceList statusFilter="ausstehend" showOverdueOnly />
        </TabsContent>
      </Tabs>

      <NewMaintenanceForm 
        open={showNewForm} 
        onOpenChange={setShowNewForm}
      />
    </div>
  );
};

export default Maintenance;
