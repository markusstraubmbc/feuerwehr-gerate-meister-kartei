
import { useState, useRef, useEffect } from "react";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { useEquipment } from "@/hooks/useEquipment";
import { usePersons } from "@/hooks/usePersons";
import { useCategories } from "@/hooks/useCategories";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";
import { NewMaintenanceForm } from "@/components/maintenance/NewMaintenanceForm";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  FileDown, 
  Filter, 
  Calendar, 
  Printer, 
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft
} from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, addMonths, isBefore } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { SELECT_ALL_VALUE, SELECT_NONE_VALUE } from "@/lib/constants";

const Maintenance = () => {
  const { data: records = [], isLoading: recordsLoading, error: recordsError } = useMaintenanceRecords();
  const { data: templates = [], isLoading: templatesLoading } = useMaintenanceTemplates();
  const { data: equipmentList = [], isLoading: equipmentLoading } = useEquipment();
  const { data: persons = [], isLoading: personsLoading } = usePersons();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [completedTab, setCompletedTab] = useState("recent");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [upcomingMaintenanceFilter, setUpcomingMaintenanceFilter] = useState("unplanned");
  const [upcomingMaintenanceSearchTerm, setUpcomingMaintenanceSearchTerm] = useState("");
  const [maintenanceSearchTerm, setMaintenanceSearchTerm] = useState("");
  const [completedSearchTerm, setCompletedSearchTerm] = useState("");
  const [isUpcomingMaintenanceOpen, setIsUpcomingMaintenanceOpen] = useState(true);
  const [isMaintenanceIntervalsOpen, setIsMaintenanceIntervalsOpen] = useState(true);
  
  const queryClient = useQueryClient();
  const upcomingMaintenanceRef = useRef<HTMLDivElement>(null);
  const completedMaintenanceRef = useRef<HTMLDivElement>(null);

  const activeRecords = records.filter(record => record.status !== "abgeschlossen");
  const completedRecords = records.filter(record => record.status === "abgeschlossen");

  const filteredActiveRecords = activeRecords.filter(record => {
    if (activeTab === "pending" && record.status !== "ausstehend") {
      return false;
    } else if (activeTab === "scheduled" && record.status !== "geplant") {
      return false;
    } else if (activeTab === "in-progress" && record.status !== "in_bearbeitung") {
      return false;
    }
    
    if (selectedPersonId && selectedPersonId !== SELECT_ALL_VALUE && record.performed_by !== selectedPersonId) {
      return false;
    }
    
    if (selectedCategoryId && selectedCategoryId !== SELECT_ALL_VALUE) {
      const relatedEquipment = equipmentList.find(e => e.id === record.equipment_id);
      if (relatedEquipment?.category_id !== selectedCategoryId) {
        return false;
      }
    }
    
    if (selectedTemplateId && selectedTemplateId !== SELECT_ALL_VALUE && record.template_id !== selectedTemplateId) {
      return false;
    }
    
    if (maintenanceSearchTerm) {
      const searchLower = maintenanceSearchTerm.toLowerCase();
      const equipmentNameMatches = record.equipment?.name?.toLowerCase().includes(searchLower);
      const templateNameMatches = record.template?.name?.toLowerCase().includes(searchLower);
      const notesMatch = record.notes?.toLowerCase().includes(searchLower);
      
      if (!equipmentNameMatches && !templateNameMatches && !notesMatch) {
        return false;
      }
    }
    
    return true;
  });

  const filteredCompletedRecords = completedRecords.filter(record => {
    if (completedTab === "recent") {
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (!record.performed_date || new Date(record.performed_date) < thirtyDaysAgo) {
        return false;
      }
    } else if (completedTab === "last-quarter") {
      // Last quarter (3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (!record.performed_date || new Date(record.performed_date) < threeMonthsAgo) {
        return false;
      }
    } else if (completedTab === "last-year") {
      // Last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (!record.performed_date || new Date(record.performed_date) < oneYearAgo) {
        return false;
      }
    }
    
    if (selectedPersonId && selectedPersonId !== SELECT_ALL_VALUE && record.performed_by !== selectedPersonId) {
      return false;
    }
    
    if (selectedCategoryId && selectedCategoryId !== SELECT_ALL_VALUE) {
      const relatedEquipment = equipmentList.find(e => e.id === record.equipment_id);
      if (relatedEquipment?.category_id !== selectedCategoryId) {
        return false;
      }
    }
    
    if (selectedTemplateId && selectedTemplateId !== SELECT_ALL_VALUE && record.template_id !== selectedTemplateId) {
      return false;
    }
    
    if (completedSearchTerm) {
      const searchLower = completedSearchTerm.toLowerCase();
      const equipmentNameMatches = record.equipment?.name?.toLowerCase().includes(searchLower);
      const templateNameMatches = record.template?.name?.toLowerCase().includes(searchLower);
      const notesMatch = record.notes?.toLowerCase().includes(searchLower);
      
      if (!equipmentNameMatches && !templateNameMatches && !notesMatch) {
        return false;
      }
    }
    
    return true;
  });

  const calculateUpcomingMaintenance = () => {
    const now = new Date();
    const upcomingMaintenance = [];
    
    for (const equipment of equipmentList) {
      // Only get templates for this equipment's category
      const relevantTemplates = equipment.category_id 
        ? templates.filter(template => 
            template.category_id === equipment.category_id || 
            !template.category_id
          )
        : templates;
      
      for (const template of relevantTemplates) {
        if (!template.interval_months) continue;
        
        const relatedRecords = records.filter(
          record => record.equipment_id === equipment.id && record.template_id === template.id
        ).sort((a, b) => 
          new Date(b.performed_date || b.due_date).getTime() - new Date(a.performed_date || a.due_date).getTime()
        );
        
        const lastRecord = relatedRecords[0];
        
        let lastDate;
        if (lastRecord?.performed_date) {
          lastDate = new Date(lastRecord.performed_date);
        } else {
          lastDate = now;
        }
        
        const nextDueDate = addMonths(lastDate, template.interval_months);
        const daysRemaining = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > -30) {
          upcomingMaintenance.push({
            equipment: equipment,
            template: template,
            lastDate,
            nextDueDate,
            daysRemaining,
            existingRecord: relatedRecords.find(r => 
              format(new Date(r.due_date), "yyyy-MM-dd") === format(nextDueDate, "yyyy-MM-dd")
            ),
            responsiblePerson: template.responsible_person_id ? 
              persons.find(person => person.id === template.responsible_person_id) : null
          });
        }
      }
    }
    
    return upcomingMaintenance.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  };
  
  const allUpcomingMaintenance = calculateUpcomingMaintenance();
  
  const filteredUpcomingMaintenance = allUpcomingMaintenance.filter(item => {
    if (upcomingMaintenanceFilter === "planned" && !item.existingRecord) {
      return false;
    }
    if (upcomingMaintenanceFilter === "unplanned" && item.existingRecord) {
      return false;
    }
    
    if (selectedCategoryId && selectedCategoryId !== SELECT_ALL_VALUE && item.equipment.category_id !== selectedCategoryId) {
      return false;
    }
    
    if (upcomingMaintenanceSearchTerm) {
      const searchLower = upcomingMaintenanceSearchTerm.toLowerCase();
      const equipmentNameMatches = item.equipment.name.toLowerCase().includes(searchLower);
      const templateNameMatches = item.template.name.toLowerCase().includes(searchLower);
      
      if (!equipmentNameMatches && !templateNameMatches) {
        return false;
      }
    }
    
    if (selectedPersonId && selectedPersonId !== SELECT_ALL_VALUE) {
      if (item.template.responsible_person_id !== selectedPersonId) {
        return false;
      }
    }
    
    return true;
  });

  const handlePrintUpcoming = useReactToPrint({
    content: () => upcomingMaintenanceRef.current,
    documentTitle: 'Anstehende_Wartungen',
    pageStyle: '@page { size: auto; margin: 10mm; } @media print { body { font-size: 12pt; } }',
    onBeforePrint: () => {
      if (!upcomingMaintenanceRef.current) {
        toast.error("Drucken konnte nicht gestartet werden");
      }
    }
  });
  
  const handlePrintCompleted = useReactToPrint({
    content: () => completedMaintenanceRef.current,
    documentTitle: 'Abgeschlossene_Wartungen',
    pageStyle: '@page { size: auto; margin: 10mm; } @media print { body { font-size: 12pt; } }',
    onBeforePrint: () => {
      if (!completedMaintenanceRef.current) {
        toast.error("Drucken konnte nicht gestartet werden");
      }
    }
  });

  const handleExportUpcoming = () => {
    try {
      const exportData = filteredUpcomingMaintenance.map(item => ({
        'Ausrüstung': item.equipment.name,
        'Wartungsvorlage': item.template.name,
        'Letzte Wartung': format(item.lastDate, "dd.MM.yyyy", { locale: de }),
        'Nächste Wartung': format(item.nextDueDate, "dd.MM.yyyy", { locale: de }),
        'Verbleibende Tage': item.daysRemaining,
        'Status': item.existingRecord ? 'Geplant' : 'Nicht geplant',
        'Verantwortlich': item.responsiblePerson ? 
          `${item.responsiblePerson.first_name} ${item.responsiblePerson.last_name}` : 
          'Nicht zugewiesen'
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
  
  const handleExportCompleted = () => {
    try {
      const exportData = filteredCompletedRecords.map(record => ({
        'Ausrüstung': record.equipment.name,
        'Wartungsvorlage': record.template?.name || 'Keine Vorlage',
        'Fällig am': format(new Date(record.due_date), "dd.MM.yyyy", { locale: de }),
        'Durchgeführt am': record.performed_date ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : '-',
        'Verantwortlich': record.performer ? 
          `${record.performer.first_name} ${record.performer.last_name}` : 
          'Nicht zugewiesen',
        'Zeit (Minuten)': record.minutes_spent || '-',
        'Notizen': record.notes || ''
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Abgeschlossene Wartungen');
      
      XLSX.writeFile(workbook, `Abgeschlossene-Wartungen-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export erfolgreich abgeschlossen");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Fehler beim Exportieren der Daten");
    }
  };

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: { 
      equipment_id: string; 
      template_id: string; 
      due_date: string;
      performed_by?: string | null;
    }) => {
      const { error } = await supabase
        .from('maintenance_records')
        .insert([{
          equipment_id: data.equipment_id,
          template_id: data.template_id,
          due_date: data.due_date,
          status: 'ausstehend',
          performed_by: data.performed_by || null
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
    dueDate: Date,
    responsiblePersonId?: string
  ) => {
    createMaintenanceMutation.mutate({
      equipment_id: equipmentId,
      template_id: templateId,
      due_date: dueDate.toISOString(),
      performed_by: responsiblePersonId
    });
  };

  const createAllPendingMaintenance = () => {
    const pendingMaintenance = filteredUpcomingMaintenance.filter(item => !item.existingRecord);
    
    if (pendingMaintenance.length === 0) {
      toast.info("Keine ausstehenden Wartungen zum Erstellen");
      return;
    }
    
    let created = 0;
    
    pendingMaintenance.forEach(item => {
      createMaintenanceMutation.mutate({
        equipment_id: item.equipment.id,
        template_id: item.template.id,
        due_date: item.nextDueDate.toISOString(),
        performed_by: item.template.responsible_person_id
      });
      created++;
    });
    
    toast.success(`${created} Wartungen wurden erfolgreich geplant`);
  };

  if (recordsLoading || templatesLoading || equipmentLoading || personsLoading || categoriesLoading) {
    return <div>Lädt...</div>;
  }

  if (recordsError) {
    return <div>Fehler beim Laden der Wartungsaufzeichnungen</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Wartung</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsNewMaintenanceOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Wartung
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Person</label>
          <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Personen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Personen</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Kategorie</label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Kategorien</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Wartungsvorlage</label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Vorlagen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Vorlagen</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Aktive Wartungen</h2>
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Ausstehend</TabsTrigger>
              <TabsTrigger value="scheduled">Geplant</TabsTrigger>
              <TabsTrigger value="in-progress">In Bearbeitung</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <MaintenanceList 
                records={filteredActiveRecords} 
                responsiblePersonId={selectedPersonId === SELECT_NONE_VALUE ? "" : selectedPersonId}
                filterTerm={maintenanceSearchTerm}
                onFilterChange={setMaintenanceSearchTerm}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Abgeschlossene Wartungen</h2>
          <Tabs defaultValue="recent" value={completedTab} onValueChange={setCompletedTab}>
            <TabsList>
              <TabsTrigger value="recent">Letzte 30 Tage</TabsTrigger>
              <TabsTrigger value="last-quarter">Letztes Quartal</TabsTrigger>
              <TabsTrigger value="last-year">Letztes Jahr</TabsTrigger>
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>
            <TabsContent value={completedTab} className="mt-4">
              <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
                <Input 
                  placeholder="In abgeschlossenen Wartungen suchen..." 
                  value={completedSearchTerm} 
                  onChange={(e) => setCompletedSearchTerm(e.target.value)}
                  className="sm:max-w-sm" 
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCompleted}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportieren
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintCompleted}>
                    <Printer className="mr-2 h-4 w-4" />
                    Drucken
                  </Button>
                </div>
              </div>
              
              <div ref={completedMaintenanceRef} className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Durchgeführt am</TableHead>
                      <TableHead>Ausrüstung</TableHead>
                      <TableHead>Wartungstyp</TableHead>
                      <TableHead>Verantwortlich</TableHead>
                      <TableHead>Zeit (Min)</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompletedRecords.length > 0 ? (
                      filteredCompletedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.performed_date ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : "-"}
                          </TableCell>
                          <TableCell>{record.equipment.name}</TableCell>
                          <TableCell>{record.template?.name || "Keine Vorlage"}</TableCell>
                          <TableCell>
                            {record.performer ? 
                              `${record.performer.first_name} ${record.performer.last_name}` : 
                              "Nicht zugewiesen"
                            }
                          </TableCell>
                          <TableCell>{record.minutes_spent || "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Keine abgeschlossenen Wartungen gefunden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Collapsible 
        open={isUpcomingMaintenanceOpen} 
        onOpenChange={setIsUpcomingMaintenanceOpen}
        className="border rounded-lg"
      >
        <div className="px-4 py-2 flex items-center justify-between bg-muted/30">
          <div className="flex items-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                {isUpcomingMaintenanceOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <h3 className="text-lg font-semibold ml-2">Anstehende Wartungen basierend auf Intervallen</h3>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={upcomingMaintenanceFilter} onValueChange={setUpcomingMaintenanceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle anzeigen</SelectItem>
                    <SelectItem value="planned">Geplante</SelectItem>
                    <SelectItem value="unplanned">Nicht geplante</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suchen..."
                    className="pl-8"
                    value={upcomingMaintenanceSearchTerm}
                    onChange={(e) => setUpcomingMaintenanceSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
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
            </div>
            
            <div ref={upcomingMaintenanceRef} className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Ausrüstung</th>
                    <th className="text-left py-2 px-4">Wartungsvorlage</th>
                    <th className="text-left py-2 px-4">Letzte Wartung</th>
                    <th className="text-left py-2 px-4">Nächste Wartung</th>
                    <th className="text-left py-2 px-4">Verbleibende Tage</th>
                    <th className="text-left py-2 px-4">Verantwortlich</th>
                    <th className="text-left py-2 px-4">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUpcomingMaintenance.map((item, index) => (
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
                        {item.responsiblePerson 
                          ? `${item.responsiblePerson.first_name} ${item.responsiblePerson.last_name}`
                          : "Nicht zugewiesen"}
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
                              item.nextDueDate,
                              item.template.responsible_person_id
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
                  {filteredUpcomingMaintenance.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-muted-foreground">
                        Keine anstehenden Wartungen basierend auf Intervallen
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible 
        open={isMaintenanceIntervalsOpen} 
        onOpenChange={setIsMaintenanceIntervalsOpen}
        className="border rounded-lg"
      >
        <div className="px-4 py-2 flex items-center justify-between bg-muted/30">
          <div className="flex items-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                {isMaintenanceIntervalsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <h3 className="text-lg font-semibold ml-2">Wartungsintervalle</h3>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Template</th>
                  <th className="text-left py-2 px-4">Intervall (Monate)</th>
                  <th className="text-left py-2 px-4">Kategorie</th>
                  <th className="text-left py-2 px-4">Verantwortlich</th>
                  <th className="text-left py-2 px-4">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{template.name}</td>
                    <td className="py-2 px-4">{template.interval_months}</td>
                    <td className="py-2 px-4">{template.category?.name || "-"}</td>
                    <td className="py-2 px-4">
                      {template.responsible_person 
                        ? `${template.responsible_person.first_name} ${template.responsible_person.last_name}`
                        : "-"}
                    </td>
                    <td className="py-2 px-4">{template.description || "-"}</td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Keine Wartungsvorlagen verfügbar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
      
      {selectedRecord && isViewDialogOpen && (
        <ViewMaintenanceDialog
          record={selectedRecord}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
};

const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <table className={`w-full border-collapse ${className || ''}`} {...props} />
);

const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={`bg-slate-50 ${className || ''}`} {...props} />
);

const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={`border-b hover:bg-slate-50 ${className || ''}`} {...props} />
);

const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={`h-10 px-4 text-left align-middle font-medium text-slate-500 ${className || ''}`} {...props} />
);

const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={className} {...props} />
);

const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={`p-4 align-middle ${className || ''}`} {...props} />
);

export default Maintenance;
