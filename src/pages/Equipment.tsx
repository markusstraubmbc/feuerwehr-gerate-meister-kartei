
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Search, FileDown } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentList } from "@/components/equipment/EquipmentList";
import { NewEquipmentForm } from "@/components/equipment/NewEquipmentForm";
import { useEquipmentComments } from "@/hooks/useEquipmentComments";
import { useEquipmentMissions } from "@/hooks/useEquipmentMissions";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { generateEquipmentDetailsPdf } from "@/components/equipment/EquipmentDetailsPdfExport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Equipment = () => {
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [selectedEquipmentForPdf, setSelectedEquipmentForPdf] = useState<string>("");

  const handlePdfExportForEquipment = async (equipmentId: string) => {
    if (!equipment) return;
    
    const selectedEquipment = equipment.find(item => item.id === equipmentId);
    if (!selectedEquipment) return;

    // Fetch comments and missions for the selected equipment
    const { data: comments = [] } = await useEquipmentComments(equipmentId);
    const { data: missions = [] } = await useEquipmentMissions(equipmentId);
    
    // Filter maintenance records for this equipment
    const equipmentMaintenance = maintenanceRecords.filter(
      record => record.equipment_id === equipmentId
    );

    generateEquipmentDetailsPdf({
      equipment: selectedEquipment,
      comments,
      missions,
      maintenanceRecords: equipmentMaintenance
    });
  };

  const filteredEquipment = equipment?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
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
          <h1 className="text-2xl font-bold tracking-tight">Ausrüstung</h1>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Detailbericht
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>PDF-Detailbericht erstellen</DialogTitle>
                <DialogDescription>
                  Wählen Sie eine Ausrüstung aus, für die ein detaillierter PDF-Bericht erstellt werden soll.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedEquipmentForPdf} onValueChange={setSelectedEquipmentForPdf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ausrüstung auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.inventory_number && `(${item.inventory_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => handlePdfExportForEquipment(selectedEquipmentForPdf)}
                  disabled={!selectedEquipmentForPdf}
                  className="w-full"
                >
                  PDF erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isNewEquipmentOpen} onOpenChange={setIsNewEquipmentOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Neue Ausrüstung
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neue Ausrüstung anlegen</DialogTitle>
                <DialogDescription>
                  Bitte füllen Sie alle erforderlichen Felder aus.
                </DialogDescription>
              </DialogHeader>
              <NewEquipmentForm onSuccess={() => setIsNewEquipmentOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ausrüstung verwalten</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ausrüstung suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <EquipmentList equipment={filteredEquipment || []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Equipment;
