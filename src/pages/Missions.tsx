import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMissions } from "@/hooks/useMissions";
import { MissionList } from "@/components/missions/MissionList";
import { NewMissionDialog } from "@/components/missions/NewMissionDialog";

const Missions = () => {
  const [showNewMissionDialog, setShowNewMissionDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { data: missions, isLoading } = useMissions();

  // Alle Jahre aus den Missionen berechnen
  const years = useMemo(() => {
    if (!missions) return [];
    const uniqueYears = Array.from(
      new Set(missions.map((m) => new Date(m.mission_date).getFullYear()))
    ).sort((a, b) => b - a);
    return uniqueYears;
  }, [missions]);

  // Missions nach ausgewähltem Jahr filtern
  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    if (selectedYear === "all") return missions;
    return missions.filter(
      (m) => new Date(m.mission_date).getFullYear().toString() === selectedYear
    );
  }, [missions, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-3xl font-bold">Einsätze & Übungen</h1>
        <div className="flex items-center gap-3">
          {/* Jahresfilter */}
          {years.length > 0 && (
            <select
              className="border px-2 py-1 rounded bg-background text-base"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">Alle Jahre</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowNewMissionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Einsatz/Übung
          </Button>
        </div>
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

      {/* MissionList mit Missions gefiltert nach Jahr */}
      <MissionList missions={filteredMissions || []} isLoading={isLoading} />

      <NewMissionDialog 
        open={showNewMissionDialog}
        onOpenChange={setShowNewMissionDialog}
      />
    </div>
  );
};

export default Missions;
