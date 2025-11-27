import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Users, Plus, Trash2, Package, FileDown, Pen, FileText } from "lucide-react";
import { Mission } from "@/hooks/useMissions";
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { useMissionPrintExport } from "@/hooks/useMissionPrintExport";
import { useSendMissionReport } from "@/hooks/useSendMissionReport";
import { AddEquipmentToMissionDialog } from "./AddEquipmentToMissionDialog";
import { TemplateSelector } from "./TemplateSelector";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ViewMissionDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewMissionDialog = ({ mission, open, onOpenChange }: ViewMissionDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editablePersons, setEditablePersons] = useState("");
  const [editableVehicles, setEditableVehicles] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { data: missionEquipment, isLoading } = useMissionEquipment(mission.id);
  const { handlePdfDownload } = useMissionPrintExport();
  const { sendMissionReport } = useSendMissionReport();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (mission) {
      setEditablePersons(mission.responsible_persons || "");
      setEditableVehicles(mission.vehicles || "");
    }
  }, [mission]);

  const handleCancelEdit = () => {
    if (mission) {
      setEditablePersons(mission.responsible_persons || "");
      setEditableVehicles(mission.vehicles || "");
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("missions")
        .update({
          responsible_persons: editablePersons.trim(),
          vehicles: editableVehicles.trim(),
        })
        .eq("id", mission.id);

      if (error) throw error;

      toast.success("Einsatzdetails aktualisiert");
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setIsEditing(false);

      // Send mission report via email
      if (missionEquipment) {
        await sendMissionReport({
          mission: {
            ...mission,
            responsible_persons: editablePersons.trim(),
            vehicles: editableVehicles.trim(),
          },
          missionEquipment,
        });
      }
    } catch (error) {
      console.error("Error updating mission:", error);
      toast.error("Fehler beim Speichern der Details");
    }
  };

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
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Details</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Pen className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                  )}
                </div>
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
                
                {isEditing ? (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="responsible_persons">Verantwortlich</Label>
                      <Textarea
                        id="responsible_persons"
                        value={editablePersons}
                        onChange={(e) => setEditablePersons(e.target.value)}
                        placeholder="z.B. Max Mustermann, Erika Mustermann"
                        className="min-h-[80px]"
                      />
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor="vehicles">Fahrzeuge</Label>
                      <Textarea
                        id="vehicles"
                        value={editableVehicles}
                        onChange={(e) => setEditableVehicles(e.target.value)}
                        placeholder="z.B. HLF 20, DLK 23/12"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {mission.responsible_persons && (
                      <div className="flex items-start text-sm">
                        <Users className="h-4 w-4 mr-2 mt-1 shrink-0 text-muted-foreground" />
                        <div>
                          <strong className="mr-2">Verantwortlich:</strong>
                          <span className="whitespace-pre-wrap">{mission.responsible_persons}</span>
                        </div>
                      </div>
                    )}

                    {mission.vehicles && (
                      <div className="flex items-start text-sm">
                        <Package className="h-4 w-4 mr-2 mt-1 shrink-0 text-muted-foreground" />
                        <div>
                          <strong className="mr-2">Fahrzeuge:</strong>
                           <span className="whitespace-pre-wrap">{mission.vehicles}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {mission.description && (
                  <div className="pt-2">
                    <strong className="text-sm">Beschreibung:</strong>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{mission.description}</p>
                  </div>
                )}
              </CardContent>
              {isEditing && (
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleCancelEdit}>Abbrechen</Button>
                  <Button onClick={handleSave}>Speichern</Button>
                </CardFooter>
              )}
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTemplateSelector(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Vorlage anwenden
                    </Button>
                    <Button onClick={() => setShowAddEquipment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ausrüstung hinzufügen
                    </Button>
                  </div>
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

      <TemplateSelector
        missionId={mission.id}
        missionTitle={mission.title}
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
      />
    </>
  );
};
