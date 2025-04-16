
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";

interface MaintenanceListProps {
  records: MaintenanceRecord[];
}

export const MaintenanceList = ({ records }: MaintenanceListProps) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fällig am</TableHead>
            <TableHead>Ausrüstung</TableHead>
            <TableHead>Wartungstyp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verantwortlich</TableHead>
            <TableHead>Durchgeführt am</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
              </TableCell>
              <TableCell>{record.equipment.name}</TableCell>
              <TableCell>{record.template?.name || "Keine Vorlage"}</TableCell>
              <TableCell>
                <MaintenanceStatusBadge status={record.status} />
              </TableCell>
              <TableCell>
                {record.performer ? 
                  `${record.performer.first_name} ${record.performer.last_name}` : 
                  "Nicht zugewiesen"
                }
              </TableCell>
              <TableCell>
                {record.performed_date ? 
                  format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : 
                  "-"
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
