
import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Trash2, FileDown, Target, Calendar, Users } from "lucide-react";
import { Mission } from "@/hooks/useMissions";
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { useMissionPrintExport } from "@/hooks/useMissionPrintExport";
import { ViewMissionDialog } from "./ViewMissionDialog";

interface MissionListProps {
  missions: Mission[];
  isLoading: boolean;
}

export const MissionList = ({ missions, isLoading }: MissionListProps) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { handlePdfDownload } = useMissionPrintExport();

  const handleView = (mission: Mission) => {
    setSelectedMission(mission);
    setIsViewDialogOpen(true);
  };

  const handleExportPdf = async (mission: Mission) => {
    // We need to fetch the mission equipment for this specific mission
    // For now, we'll use an empty array as a placeholder
    handlePdfDownload({
      mission,
      missionEquipment: []
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Lade Einsätze und Übungen...</div>
        </CardContent>
      </Card>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Einsätze & Übungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Noch keine Einsätze oder Übungen</h3>
            <p className="text-muted-foreground">
              Erstelle deinen ersten Einsatz oder deine erste Übung über den Button oben.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Einsätze & Übungen ({missions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="hidden md:table-cell">Datum</TableHead>
                  <TableHead className="hidden md:table-cell">Zeit</TableHead>
                  <TableHead className="hidden lg:table-cell">Ort</TableHead>
                  <TableHead className="hidden lg:table-cell">Verantwortlich</TableHead>
                  <TableHead className="hidden md:table-cell">Ausrüstung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={mission.mission_type === 'einsatz' ? 'destructive' : 'default'}
                      >
                        {mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(mission.mission_date), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {mission.start_time && mission.end_time 
                        ? `${mission.start_time} - ${mission.end_time}`
                        : mission.start_time || "-"
                      }
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {mission.location || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {mission.responsible_person ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {mission.responsible_person.first_name} {mission.responsible_person.last_name}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {mission.equipment_count || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportPdf(mission)}
                          title="Als PDF exportieren"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(mission)}
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedMission && (
        <ViewMissionDialog
          mission={selectedMission}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </>
  );
};
