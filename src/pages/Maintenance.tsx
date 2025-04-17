
import { useState, useRef } from "react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { useEquipment } from "@/hooks/useEquipment";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Filter, Calendar, Printer } from "lucide-react";
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
import { format, addMonths, isBefore } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Maintenance = () => {
  const { data: records = [], isLoading: recordsLoading, error: recordsError } = useMaintenanceRecords();
  const { data: templates = [], isLoading: templatesLoading } = useMaintenanceTemplates();
  const { data: equipmentList = [], isLoading: equipmentLoading } = useEquipment();
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  
  const upcomingMaintenanceRef = useRef<HTMLDivElement>(null);

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
    const now = new Date();
    const upcomingMaintenance = [];
    
    // For each equipment with a template, calculate next due date
    for (const equipment of equipmentList) {
      // Get all maintenance templates
      for (const template of templates) {
        if (!template.interval_months) continue;
        
        // Find the most recent maintenance record for this equipment+template combination
        const relatedRecords = records.filter(
          record => record.equipment_id === equipment.id && record.template_id === template.id
        ).sort((a, b) => 
          new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime()
        );
        
        const lastRecord = relatedRecords[0];
        
        // Calculate next due date based on last performed date or current date
        let lastDate;
        if (lastRecord?.performed_date) {
          lastDate = new Date(lastRecord.performed_date);
        } else {
          // If no record exists or no performed date, use today as reference
          lastDate = now;
        }
        
        const nextDueDate = addMonths(lastDate, template.interval_months);
        const daysRemaining = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include if it's a future date or within 30 days overdue
        if (daysRemaining > -30) {
          upcomingMaintenance.push({
            equipment: equipment,
            template: template,
            lastDate,
            nextDueDate,
            daysRemaining,
            existingRecord: relatedRecords.find(r => 
              format(new Date(r.due_date), "yyyy-MM-dd") === format(nextDueDate, "yyyy-MM-dd")
            )
          });
        }
      }
    }
    
    return upcomingMaintenance.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  };
  
  const upcomingMaintenance = calculateUpcomingMaintenance();

  const handlePrintUpcoming = useReactToPrint({
    content: () => upcomingMaintenanceRef.current,
    documentTitle: 'Anstehende_Wartungen',
  });

  const handleExportUpcoming = () => {
    try {
      const exportData = upcomingMaintenance.map(item => ({
        'Ausrüstung': item.equipment.name,
        'Wartungsvorlage': item.template.name,
        'Letzte Wartung': format(item.lastDate, "dd.MM.yyyy", { locale: de }),
        'Nächste Wartung': format(item.nextDueDate, "dd.MM.yyyy", { locale: de }),
        'Verbleibende Tage': item.daysRemaining,
        'Status': item.existingRecord ? 'Geplant' : 'Nicht geplant'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Anstehende Wartungen');
      
      XLSX.writeFile(workbook, `Anstehende-Wartungen-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export erfolgreich abgeschlossen");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Fehler beim Exportieren der Daten");
    }
  };

  // Mutation to create new maintenance record
  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: { 
      equipment_id: string; 
      template_id: string; 
      due_date: string;
    }) => {
      const { error } = await supabase
        .from('maintenance_records')
        .insert([{
          equipment_id: data.equipment_id,
          template_id: data.template_id,
          due_date: data.due_date,
          status: 'ausstehend'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast.success("Wartung erfolgreich geplant");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Fehler beim Planen der Wartung");
    }
  });

  const handleCreateMaintenance = (
    equipmentId: string, 
    templateId: string, 
    dueDate: Date
  ) => {
    createMaintenanceMutation.mutate({
      equipment_id: equipmentId,
      template_id: templateId,
      due_date: dueDate.toISOString()
    });
  };

  // Create all pending maintenance records in bulk
  const createAllPendingMaintenance = () => {
    const pendingMaintenance = upcomingMaintenance.filter(item => !item.existingRecord);
    
    if (pendingMaintenance.length === 0) {
      toast.info("Keine ausstehenden Wartungen zum Erstellen");
      return;
    }
    
    let created = 0;
    
    pendingMaintenance.forEach(item => {
      createMaintenanceMutation.mutate({
        equipment_id: item.equipment.id,
        template_id: item.template.id,
        due_date: item.nextDueDate.toISOString()
      });
      created++;
    });
    
    toast.success(`${created} Wartungen wurden erfolgreich geplant`);
  };

  if (recordsLoading || templatesLoading || equipmentLoading) {
    return <div>Lädt...</div>;
  }

  if (recordsError) {
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anstehende Wartungen basierend auf Intervallen</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportUpcoming}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintUpcoming}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
            <Button size="sm" onClick={createAllPendingMaintenance}>
              <Plus className="h-4 w-4 mr-2" />
              Alle planen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={upcomingMaintenanceRef} className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Ausrüstung</th>
                  <th className="text-left py-2 px-4">Wartungsvorlage</th>
                  <th className="text-left py-2 px-4">Letzte Wartung</th>
                  <th className="text-left py-2 px-4">Nächste Wartung</th>
                  <th className="text-left py-2 px-4">Verbleibende Tage</th>
                  <th className="text-left py-2 px-4">Aktionen</th>
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
                    <td className="py-2 px-4">
                      {item.existingRecord ? (
                        <span className="text-green-500">Geplant</span>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateMaintenance(
                            item.equipment.id, 
                            item.template.id, 
                            item.nextDueDate
                          )}
                          disabled={createMaintenanceMutation.isPending}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Planen
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {upcomingMaintenance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      Keine anstehenden Wartungen basierend auf Intervallen
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
