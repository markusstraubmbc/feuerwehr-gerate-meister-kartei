
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Barcode } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { CompleteMaintenanceDialog } from "./CompleteMaintenanceDialog";
import { toast } from "sonner";

interface QuickCompleteMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickCompleteMaintenanceDialog = ({
  open,
  onOpenChange,
}: QuickCompleteMaintenanceDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaintenanceRecord, setSelectedMaintenanceRecord] = useState(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  
  const { data: equipment = [] } = useEquipment();
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();

  // Filter equipment based on search term (barcode, inventory number, or name)
  const filteredEquipment = equipment.filter(item => {
    if (!searchTerm) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.barcode && item.barcode.toLowerCase().includes(searchLower)) ||
      (item.inventory_number && item.inventory_number.toLowerCase().includes(searchLower)) ||
      (item.name && item.name.toLowerCase().includes(searchLower))
    );
  });

  // Get pending maintenance records for the filtered equipment
  const getMaintenanceRecordsForEquipment = (equipmentId: string) => {
    return maintenanceRecords.filter(record => 
      record.equipment_id === equipmentId && 
      record.status !== "abgeschlossen"
    );
  };

  const handleCompleteMaintenanceRecord = (record: any) => {
    setSelectedMaintenanceRecord(record);
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteDialogClose = () => {
    setIsCompleteDialogOpen(false);
    setSelectedMaintenanceRecord(null);
    // Also close the main dialog when maintenance is completed
    onOpenChange(false);
    setSearchTerm("");
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Wartung schnell abschließen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Ausrüstung suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Barcode, Inventarnummer oder Name eingeben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Geben Sie den Barcode, die Inventarnummer oder den Namen der Ausrüstung ein
              </p>
            </div>

            {searchTerm && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Suchergebnisse ({filteredEquipment.length})</Label>
                  {filteredEquipment.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClearSearch}>
                      Suche leeren
                    </Button>
                  )}
                </div>
                
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Ausrüstung mit "{searchTerm}" gefunden
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredEquipment.map((item) => {
                      const pendingRecords = getMaintenanceRecordsForEquipment(item.id);
                      
                      return (
                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.inventory_number && `Inv.: ${item.inventory_number} • `}
                                {item.barcode && `Barcode: ${item.barcode}`}
                              </p>
                            </div>
                          </div>
                          
                          {pendingRecords.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Keine ausstehenden Wartungen für diese Ausrüstung
                            </p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Ausstehende Wartungen ({pendingRecords.length}):
                              </p>
                              {pendingRecords.map((record) => (
                                <div key={record.id} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {record.template?.name || "Keine Vorlage"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Fällig: {new Date(record.due_date).toLocaleDateString('de-DE')}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCompleteMaintenanceRecord(record)}
                                  >
                                    Abschließen
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedMaintenanceRecord && (
        <CompleteMaintenanceDialog
          record={selectedMaintenanceRecord}
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
          onSuccess={handleCompleteDialogClose}
        />
      )}
    </>
  );
};
