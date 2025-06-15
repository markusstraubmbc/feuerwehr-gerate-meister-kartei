
import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Mission } from "@/hooks/useMissions";
import { ViewMissionDialog } from "./ViewMissionDialog";
import { MissionListRow } from "./MissionListRow";

interface MissionListProps {
  missions: Mission[];
  isLoading: boolean;
}

export const MissionList = ({ missions, isLoading }: MissionListProps) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [exportingMissionId, setExportingMissionId] = useState<string | null>(null);

  const handleView = (mission: Mission) => {
    setSelectedMission(mission);
    setIsViewDialogOpen(true);
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
                  <MissionListRow
                    key={mission.id}
                    mission={mission}
                    onView={handleView}
                    exporting={!!exportingMissionId && exportingMissionId === mission.id}
                    setExporting={(id) => setExportingMissionId(id)}
                  />
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
