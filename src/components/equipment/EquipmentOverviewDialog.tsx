
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "@/hooks/useEquipment";
import { useEquipmentComments } from "@/hooks/useEquipmentComments";
import { useEquipmentMissions } from "@/hooks/useEquipmentMissions";
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, MessageSquare, Wrench, MapPin, Target, FileDown } from "lucide-react";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { MaintenanceStatusBadge } from "@/components/maintenance/MaintenanceStatusBadge";
import { EquipmentMissionsTab } from "./EquipmentMissionsTab";
import { generateEquipmentDetailsPdf } from "./EquipmentDetailsPdfExport";

interface EquipmentOverviewDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentOverviewDialog({
  equipment,
  open,
  onOpenChange,
}: EquipmentOverviewDialogProps) {
  const { data: comments = [] } = useEquipmentComments(equipment.id);
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();
  const { data: equipmentMissions = [] } = useEquipmentMissions(equipment.id);
  
  // Filter maintenance records for this equipment
  const equipmentMaintenance = maintenanceRecords.filter(
    record => record.equipment_id === equipment.id
  );
  
  const completedMaintenance = equipmentMaintenance.filter(
    record => record.status === 'abgeschlossen'
  );
  
  const upcomingMaintenance = equipmentMaintenance.filter(
    record => record.status === 'ausstehend' || record.status === 'geplant'
  );

  const handlePdfExport = () => {
    generateEquipmentDetailsPdf({
      equipment,
      comments,
      missions: equipmentMissions,
      maintenanceRecords: equipmentMaintenance
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>{equipment.name}</span>
                <EquipmentStatusBadge status={equipment.status} />
              </DialogTitle>
              <DialogDescription>
                Detaillierte Übersicht für {equipment.inventory_number || "Keine Inventarnummer"}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePdfExport}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF Export
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grundinformationen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grundinformationen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Inventarnummer:</span>
                <p>{equipment.inventory_number || "Nicht zugewiesen"}</p>
              </div>
              <div>
                <span className="font-medium">Seriennummer:</span>
                <p>{equipment.serial_number || "Nicht zugewiesen"}</p>
              </div>
              <div>
                <span className="font-medium">Kategorie:</span>
                <p>{equipment.category?.name || "Keine Kategorie"}</p>
              </div>
              <div>
                <span className="font-medium">Standort:</span>
                <p>{equipment.location?.name || "Kein Standort"}</p>
              </div>
              <div>
                <span className="font-medium">Verantwortlich:</span>
                <p>
                  {equipment.responsible_person 
                    ? `${equipment.responsible_person.first_name} ${equipment.responsible_person.last_name}`
                    : "Niemand zugewiesen"
                  }
                </p>
              </div>
              <div>
                <span className="font-medium">Hersteller:</span>
                <p>{equipment.manufacturer || "Nicht angegeben"}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Kommentare ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Wrench className="h-4 w-4 mr-2" />
                Wartungen ({equipmentMaintenance.length})
              </TabsTrigger>
              <TabsTrigger value="missions">
                <Target className="h-4 w-4 mr-2" />
                Einsätze/Übungen ({equipmentMissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4">
              {comments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      Keine Kommentare vorhanden
                    </p>
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">
                          {comment.person.first_name} {comment.person.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Anstehende Wartungen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Anstehende Wartungen ({upcomingMaintenance.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingMaintenance.length === 0 ? (
                      <p className="text-muted-foreground">Keine anstehenden Wartungen</p>
                    ) : (
                      upcomingMaintenance.map((record) => (
                        <div key={record.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">
                              {record.template?.name || "Wartung"}
                            </span>
                            <MaintenanceStatusBadge status={record.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Fällig: {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
                          </p>
                          {record.performer && (
                            <p className="text-sm">
                              Verantwortlich: {record.performer.first_name} {record.performer.last_name}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Abgeschlossene Wartungen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Abgeschlossene Wartungen ({completedMaintenance.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {completedMaintenance.length === 0 ? (
                      <p className="text-muted-foreground">Keine abgeschlossenen Wartungen</p>
                    ) : (
                      completedMaintenance.slice(0, 5).map((record) => (
                        <div key={record.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">
                              {record.template?.name || "Wartung"}
                            </span>
                            <MaintenanceStatusBadge status={record.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Durchgeführt: {record.performed_date 
                              ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de })
                              : "Unbekannt"
                            }
                          </p>
                          {record.performer && (
                            <p className="text-sm">
                              Durchgeführt von: {record.performer.first_name} {record.performer.last_name}
                            </p>
                          )}
                          {record.minutes_spent && (
                            <p className="text-sm">
                              Dauer: {record.minutes_spent} Minuten
                            </p>
                          )}
                        </div>
                      ))
                    )}
                    {completedMaintenance.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... und {completedMaintenance.length - 5} weitere
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="missions" className="space-y-4">
              <EquipmentMissionsTab equipmentId={equipment.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
