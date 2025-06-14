
import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User, Plus, Trash2, Package, FileDown } from "lucide-react";
import { Mission } from "@/hooks/useMissions";
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { useMissionPrintExport } from "@/hooks/useMissionPrintExport";
import { AddEquipmentToMissionDialog } from "./AddEquipmentToMissionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ViewMissionDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewMissionDialog = ({ mission, open, onOpenChange }: ViewMissionDialogProps) => {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const { data: missionEquipment, isLoading } = useMissionEquipment(mission.id);
  const { handlePdfDownload } = useMissionPrintExport();
  const queryClient = useQueryClient();

  const handleRemoveEquipment = async (missionEquipmentId: string) => {
    try {
      const { error } = await supabase
        .from("mission_equipment")
        .delete()
        .eq('id', missionEquipmentId);

      if (error) throw error;

      toast.success("Ausrüstung entfernt");
      queryClient.invalidateQueries({ queryKey: ["mission-equipment", mission.id] });
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    } catch (error) {
      console.error('Error removing equipment:', error);
      toast.error("Fehler beim Entfernen");
    }
  };

  const handleExportPdf = () => {
    handlePdfDownload({
      mission,
      missionEquipment: missionEquipment || []
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{mission.title}</DialogTitle>
                <Badge 
                  variant={mission.mission_type === 'einsatz' ? 'destructive' : 'default'}
                  className="ml-2"
                >
                  {mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF Export
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Mission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong className="mr-2">Datum:</strong>
                  {format(new Date(mission.mission_date), 'dd.MM.yyyy (EEEE)', { locale: de })}
                  {mission.start_time && ` - ${mission.start_time}`}
                  {mission.end_time && ` bis ${mission.end_time}`}
                </div>
                
                {mission.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong className="mr-2">Ort:</strong>
                    {mission.location}
                  </div>
                )}
                
                {mission.responsible_person && (
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong className="mr-2">Verantwortlich:</strong>
                    {mission.responsible_person.first_name} {mission.responsible_person.last_name}
                  </div>
                )}

                {mission.description && (
                  <div className="pt-2">
                    <strong className="text-sm">Beschreibung:</strong>
                    <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Equipment Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Verwendete Ausrüstung ({missionEquipment?.length || 0})
                  </CardTitle>
                  <Button onClick={() => setShowAddEquipment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ausrüstung hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Lade Ausrüstung...</div>
                ) : missionEquipment && missionEquipment.length > 0 ? (
                  <div className="space-y-3">
                    {missionEquipment.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.equipment?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.equipment?.category?.name} • {item.equipment?.location?.name}
                            {item.equipment?.inventory_number && ` • ${item.equipment.inventory_number}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Hinzugefügt: {format(new Date(item.added_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            {item.added_by_person && ` von ${item.added_by_person.first_name} ${item.added_by_person.last_name}`}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Notiz: {item.notes}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEquipment(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Noch keine Ausrüstung zugeordnet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <AddEquipmentToMissionDialog
        missionId={mission.id}
        missionTitle={mission.title}
        open={showAddEquipment}
        onOpenChange={setShowAddEquipment}
      />
    </>
  );
};
