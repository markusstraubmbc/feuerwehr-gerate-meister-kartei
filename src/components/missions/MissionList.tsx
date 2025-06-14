
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Clock, User } from "lucide-react";
import { Mission } from "@/hooks/useMissions";
import { useState } from "react";
import { ViewMissionDialog } from "./ViewMissionDialog";

interface MissionListProps {
  missions: Mission[];
  isLoading: boolean;
}

export const MissionList = ({ missions, isLoading }: MissionListProps) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission) => (
          <Card key={mission.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{mission.title}</CardTitle>
                <Badge 
                  variant={mission.mission_type === 'einsatz' ? 'destructive' : 'default'}
                >
                  {mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {format(new Date(mission.mission_date), 'dd.MM.yyyy', { locale: de })}
                {mission.start_time && ` - ${mission.start_time}`}
              </div>
              
              {mission.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {mission.location}
                </div>
              )}
              
              {mission.responsible_person && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  {mission.responsible_person.first_name} {mission.responsible_person.last_name}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {mission.equipment_count || 0} Ausrüstungsgegenstände
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedMission(mission)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMission && (
        <ViewMissionDialog
          mission={selectedMission}
          open={!!selectedMission}
          onOpenChange={(open) => !open && setSelectedMission(null)}
        />
      )}
    </>
  );
};
