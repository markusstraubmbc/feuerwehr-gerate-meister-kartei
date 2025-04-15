
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRecord } from "@/types/maintenance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  overdue: "bg-red-500",
};

export function MaintenanceTable() {
  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          equipment:equipment(name)
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-4">
          Lade Wartungen...
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Gerät</TableHead>
          <TableHead>Art der Wartung</TableHead>
          <TableHead>Letzte Prüfung</TableHead>
          <TableHead>Nächste Prüfung</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!maintenanceRecords?.length ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
              Keine Wartungen vorhanden
            </TableCell>
          </TableRow>
        ) : (
          maintenanceRecords.map((record: any) => (
            <TableRow key={record.id}>
              <TableCell>{record.equipment?.name}</TableCell>
              <TableCell>{record.maintenance_type}</TableCell>
              <TableCell>
                {record.performed_at
                  ? format(new Date(record.performed_at), "dd.MM.yyyy")
                  : "-"}
              </TableCell>
              <TableCell>{format(new Date(record.due_date), "dd.MM.yyyy")}</TableCell>
              <TableCell>
                <Badge className={statusColors[record.status]}>
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
