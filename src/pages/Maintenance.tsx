
import { useState } from "react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Filter, Calendar } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";

const Maintenance = () => {
  const { data: records = [], isLoading, error } = useMaintenanceRecords();
  const { data: templates = [] } = useMaintenanceTemplates();
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filteredRecords = records.filter(record => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return record.status === "ausstehend";
    if (activeTab === "scheduled") return record.status === "geplant";
    if (activeTab === "in-progress") return record.status === "in_bearbeitung";
    if (activeTab === "completed") return record.status === "abgeschlossen";
    return true;
  });

  // Calculate upcoming maintenance based on intervals
  const calculateUpcomingMaintenance = () => {
    const upcomingMaintenance = [];
    
    // For each equipment with a template and last maintenance date
    for (const record of records) {
      if (record.equipment && record.template && record.performed_date) {
        const lastDate = new Date(record.performed_date);
        const intervalMonths = record.template.interval_months || 0;
        const nextDueDate = addMonths(lastDate, intervalMonths);
        
        upcomingMaintenance.push({
          equipment: record.equipment,
          template: record.template,
          lastDate,
          nextDueDate,
          daysRemaining: Math.floor((nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    return upcomingMaintenance.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  };
  
  const upcomingMaintenance = calculateUpcomingMaintenance();

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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="pending">Ausstehend</TabsTrigger>
          <TabsTrigger value="scheduled">Geplant</TabsTrigger>
          <TabsTrigger value="in-progress">In Bearbeitung</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <MaintenanceList records={filteredRecords} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Wartungsintervalle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Template</th>
                  <th className="text-left py-2 px-4">Intervall (Monate)</th>
                  <th className="text-left py-2 px-4">Kategorie</th>
                  <th className="text-left py-2 px-4">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{template.name}</td>
                    <td className="py-2 px-4">{template.interval_months}</td>
                    <td className="py-2 px-4">{template.category?.name || "-"}</td>
                    <td className="py-2 px-4">{template.description || "-"}</td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      Keine Wartungsvorlagen verfügbar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anstehende Wartungen basierend auf Intervallen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Ausrüstung</th>
                  <th className="text-left py-2 px-4">Wartungsvorlage</th>
                  <th className="text-left py-2 px-4">Letzte Wartung</th>
                  <th className="text-left py-2 px-4">Nächste Wartung</th>
                  <th className="text-left py-2 px-4">Verbleibende Tage</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMaintenance.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{item.equipment.name}</td>
                    <td className="py-2 px-4">{item.template.name}</td>
                    <td className="py-2 px-4">{format(item.lastDate, "dd.MM.yyyy", { locale: de })}</td>
                    <td className="py-2 px-4">{format(item.nextDueDate, "dd.MM.yyyy", { locale: de })}</td>
                    <td className="py-2 px-4">
                      <span className={item.daysRemaining < 7 ? "text-red-500 font-bold" : ""}>
                        {item.daysRemaining}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcomingMaintenance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Keine anstehenden Wartungen basierend auf Intervallen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
