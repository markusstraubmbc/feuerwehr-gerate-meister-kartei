import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { FileCheck, Eye, Printer } from "lucide-react";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { CompleteMaintenanceDialog } from "./CompleteMaintenanceDialog";
import { ViewMaintenanceDialog } from "./ViewMaintenanceDialog";
import { useReactToPrint } from "react-to-print";
import React from "react";

interface MaintenanceListProps {
  records: MaintenanceRecord[];
}

export const MaintenanceList = ({ records }: MaintenanceListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const printRef = React.useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Wartungsaufzeichnungen',
    onBeforePrint: () => console.log('Before printing...'),
    onAfterPrint: () => console.log('After printing...'),
  });

  const handleComplete = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsCompleteDialogOpen(true);
  };
  
  const handleView = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Drucken
        </Button>
      </div>
      
      <div ref={printRef}>
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
                <TableHead>Aktionen</TableHead>
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
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => handleView(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {record.status !== "abgeschlossen" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleComplete(record)}
                        >
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Keine Wartungsaufzeichnungen gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      
      {selectedRecord && (
        <>
          <CompleteMaintenanceDialog 
            record={selectedRecord} 
            open={isCompleteDialogOpen}
            onOpenChange={setIsCompleteDialogOpen}
          />
          
          <ViewMaintenanceDialog
            record={selectedRecord}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        </>
      )}
    </>
  );
};
