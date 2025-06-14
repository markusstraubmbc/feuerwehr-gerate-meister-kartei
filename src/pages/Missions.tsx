
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMissions } from "@/hooks/useMissions";
import { MissionList } from "@/components/missions/MissionList";
import { NewMissionDialog } from "@/components/missions/NewMissionDialog";

const Missions = () => {
  const [showNewMissionDialog, setShowNewMissionDialog] = useState(false);
  const { data: missions, isLoading } = useMissions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Einsätze & Übungen</h1>
        <Button onClick={() => setShowNewMissionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Einsatz/Übung
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Einsätze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missions?.filter(m => m.mission_type === 'einsatz').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Übungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missions?.filter(m => m.mission_type === 'übung').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diesen Monat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missions?.filter(m => {
                const missionDate = new Date(m.mission_date);
                const now = new Date();
                return missionDate.getMonth() === now.getMonth() && 
                       missionDate.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausrüstung verwendet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missions?.reduce((sum, m) => sum + (m.equipment_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <MissionList missions={missions || []} isLoading={isLoading} />

      <NewMissionDialog 
        open={showNewMissionDialog}
        onOpenChange={setShowNewMissionDialog}
      />
    </div>
  );
};

export default Missions;
