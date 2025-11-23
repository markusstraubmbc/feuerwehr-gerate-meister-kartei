
import { useMissionEquipment } from "@/hooks/useMissionEquipment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { FileDown, Eye, Calendar, PackagePlus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Mission } from "@/hooks/useMissions";
import { useMissionPrintExport } from "@/hooks/useMissionPrintExport";
import { useState } from "react";
import { AddEquipmentToMissionDialog } from "./AddEquipmentToMissionDialog";

interface MissionListRowProps {
  mission: Mission;
  onView: (mission: Mission) => void;
  exporting: boolean;
  setExporting: (id: string | null) => void;
}

export const MissionListRow = ({
  mission,
  onView,
  exporting,
  setExporting,
}: MissionListRowProps) => {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const { data, isLoading } = useMissionEquipment(mission.id);
  const { handlePdfDownload } = useMissionPrintExport();

  const handleExportPdf = () => {
    setExporting(mission.id);
    handlePdfDownload({
      mission,
      missionEquipment: data || []
    });
    setExporting(null);
  };

  const equipmentCount = data ? data.filter(x => !!x.equipment).length : 0;

  return (
    <TableRow key={mission.id}>
      <TableCell className="font-medium">{mission.title}</TableCell>
      <TableCell>
        <Badge 
          variant={mission.mission_type === 'einsatz' ? 'destructive' : 'default'}
        >
          {mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {format(new Date(mission.mission_date), 'dd.MM.yyyy', { locale: de })}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {mission.start_time && mission.end_time 
          ? `${mission.start_time} - ${mission.end_time}`
          : mission.start_time || "-"}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {mission.location || "-"}
      </TableCell>
      <TableCell>
        {mission.responsible_persons || "-"}
      </TableCell>
      <TableCell>
        {mission.vehicles || "-"}
      </TableCell>
      <TableCell>
        {isLoading
          ? <span className="text-xs text-muted-foreground">...</span>
          : equipmentCount || 0}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddEquipment(true)}
            title="Ausrüstung schnell hinzufügen"
          >
            <PackagePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPdf}
            title="Als PDF exportieren"
            disabled={exporting}
          >
            <FileDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(mission)}
            title="Details anzeigen"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      
      <AddEquipmentToMissionDialog
        missionId={mission.id}
        missionTitle={mission.title}
        open={showAddEquipment}
        onOpenChange={setShowAddEquipment}
      />
    </TableRow>
  );
};
