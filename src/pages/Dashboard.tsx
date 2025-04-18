import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowDown, 
  ArrowUp,
  Calendar,
  Filter
} from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CompleteMaintenanceDialog } from "@/components/maintenance/CompleteMaintenanceDialog";
import { SELECT_ALL_VALUE } from "@/lib/constants";

const Dashboard = () => {
  const { data: equipment = [] } = useEquipment();
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  
  const filteredEquipment = equipment.filter(item => {
    if (selectedCategoryId && selectedCategoryId !== SELECT_ALL_VALUE && item.category_id !== selectedCategoryId) {
      return false;
    }
    
    if (selectedPersonId && selectedPersonId !== SELECT_ALL_VALUE && item.responsible_person_id !== selectedPersonId) {
      return false;
    }
    
    return true;
  });
  
  const filteredMaintenanceRecords = maintenanceRecords.filter(record => {
    const equipmentItem = equipment.find(item => item.id === record.equipment_id);
    
    if (selectedCategoryId && equipmentItem?.category_id !== selectedCategoryId) {
      return false;
    }
    
    if (selectedPersonId && record.performed_by !== selectedPersonId) {
      return false;
    }
    
    return true;
  });
  
  const totalEquipment = filteredEquipment.length;
  const readyEquipment = filteredEquipment.filter(item => item.status === "einsatzbereit").length;
  const maintenanceNeeded = filteredEquipment.filter(item => item.status === "prüfung fällig").length;
  const inMaintenance = filteredEquipment.filter(item => item.status === "wartung").length;
  
  const pendingMaintenance = filteredMaintenanceRecords
    .filter(record => record.status !== "abgeschlossen")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);
  
  const categoryStats = categories.map(category => {
    const categoryEquipment = filteredEquipment.filter(item => item.category_id === category.id);
    const total = categoryEquipment.length;
    const ready = categoryEquipment.filter(item => item.status === "einsatzbereit").length;
    const status = total > 0 ? (ready / total) * 100 : 0;
    const change = Math.floor(Math.random() * 10) - 5;
    
    return {
      name: category.name,
      status,
      total,
      change,
      changeColor: change >= 0 ? "text-green-500" : "text-red-500"
    };
  }).filter(cat => cat.total > 0);
  
  const urgentMaintenanceCount = filteredMaintenanceRecords.filter(record => {
    const dueDate = new Date(record.due_date);
    const today = new Date();
    const sevenDaysLater = addDays(today, 7);
    return record.status !== "abgeschlossen" && dueDate <= sevenDaysLater;
  }).length;

  const handleCompleteMaintenance = (record: any) => {
    setSelectedRecord(record);
    setIsCompleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Kategorie" />
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
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Person" />
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
            <Button variant="outline" size="sm" className="h-10" onClick={() => {
              setSelectedCategoryId("");
              setSelectedPersonId("");
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </div>
      </div>
      
      {urgentMaintenanceCount > 0 && (
        <Alert className="border-fire-red bg-fire-red/10">
          <AlertTriangle className="h-4 w-4 text-fire-red" />
          <AlertTitle>Achtung</AlertTitle>
          <AlertDescription>
            Es gibt {urgentMaintenanceCount} Wartung{urgentMaintenanceCount !== 1 ? 'en' : ''}, die in den nächsten 7 Tagen durchgeführt werden {urgentMaintenanceCount !== 1 ? 'müssen' : 'muss'}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Gesamt Ausrüstung" 
          value={totalEquipment.toString()} 
          description="Alle Ausrüstungsgegenstände"
          icon={<Package className="h-4 w-4 text-fire-red" />} 
        />
        <StatsCard 
          title="Wartungsbedarf" 
          value={maintenanceNeeded.toString()} 
          description="Prüfung fällig"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} 
        />
        <StatsCard 
          title="Einsatzbereit" 
          value={readyEquipment.toString()} 
          description="Vollständig funktionstüchtig"
          icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
        />
        <StatsCard 
          title="In Wartung" 
          value={inMaintenance.toString()} 
          description="Aktuell in Reparatur"
          icon={<Clock className="h-4 w-4 text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inventar Status</CardTitle>
            <CardDescription>Status der verschiedenen Kategorien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{category.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${category.changeColor}`}>
                        {category.change >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                        {Math.abs(category.change)}%
                      </span>
                      <span className="text-xs text-muted-foreground">{category.total} Artikel</span>
                    </div>
                  </div>
                  <Progress value={category.status} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Keine Kategoriedaten verfügbar</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anstehende Wartungen</CardTitle>
            <CardDescription>In den nächsten 30 Tagen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingMaintenance.length > 0 ? (
              pendingMaintenance.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium">{item.equipment?.name || "Unbekannte Ausrüstung"}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>{format(new Date(item.due_date), "dd.MM.yyyy", { locale: de })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MaintenanceStatusBadge status={getMaintenanceStatusDisplay(item.status)} />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      title="Wartung durchführen"
                      onClick={() => handleCompleteMaintenance(item)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Keine anstehenden Wartungen</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedRecord && (
        <CompleteMaintenanceDialog
          record={selectedRecord}
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
        />
      )}
    </div>
  );
};

function getMaintenanceStatusDisplay(status: string): "dringend" | "geplant" | "optional" {
  switch (status) {
    case "ausstehend":
      return "dringend";
    case "geplant":
      return "geplant";
    case "in_bearbeitung":
      return "optional";
    default:
      return "geplant";
  }
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MaintenanceStatusBadge({ status }: { status: "dringend" | "geplant" | "optional" }) {
  const statusStyles = {
    dringend: "bg-red-100 text-red-800 border-red-200",
    geplant: "bg-amber-100 text-amber-800 border-amber-200",
    optional: "bg-blue-100 text-blue-800 border-blue-200"
  };

  return (
    <span 
      className={`px-2 py-1 text-xs rounded-md border ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default Dashboard;
