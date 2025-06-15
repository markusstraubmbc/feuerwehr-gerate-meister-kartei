import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Target, FileText, Package } from "lucide-react";
import { useEquipmentMissions } from "@/hooks/useEquipmentMissions";

interface EquipmentMissionsTabProps {
  equipmentId: string;
}

export function EquipmentMissionsTab({ equipmentId }: EquipmentMissionsTabProps) {
  const { data: equipmentMissions = [], isLoading } = useEquipmentMissions(equipmentId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Lade Einsätze und Übungen...</div>
        </CardContent>
      </Card>
    );
  }

  if (equipmentMissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Einsätze & Übungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Noch nicht bei Einsätzen verwendet</h3>
            <p className="text-sm text-muted-foreground">
              Diese Ausrüstung wurde noch bei keinem Einsatz oder keiner Übung dokumentiert.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Einsätze & Übungen ({equipmentMissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipmentMissions.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-lg">{item.mission.title}</h4>
                  <Badge 
                    variant={item.mission.mission_type === 'einsatz' ? 'destructive' : 'default'}
                  >
                    {item.mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {format(new Date(item.mission.mission_date), 'dd.MM.yyyy (EEEE)', { locale: de })}
                      {item.mission.start_time && ` - ${item.mission.start_time}`}
                      {item.mission.end_time && ` bis ${item.mission.end_time}`}
                    </span>
                  </div>
                  
                  {item.mission.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{item.mission.location}</span>
                    </div>
                  )}
                  
                  {item.mission.responsible_persons && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <User className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-medium text-foreground">Verantwortlich: </strong>
                        <span className="whitespace-pre-wrap">{item.mission.responsible_persons}</span>
                      </div>
                    </div>
                  )}

                  {item.mission.vehicles && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <Package className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-medium text-foreground">Fahrzeuge: </strong>
                        <span className="whitespace-pre-wrap">{item.mission.vehicles}</span>
                      </div>
                    </div>
                  )}
                </div>

                {item.mission.description && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Beschreibung:
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.mission.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>
                    Hinzugefügt: {format(new Date(item.added_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    {item.added_by_person && ` von ${item.added_by_person.first_name} ${item.added_by_person.last_name}`}
                  </span>
                </div>
                {item.notes && (
                  <div className="mt-1">
                    <strong>Notiz:</strong> {item.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
