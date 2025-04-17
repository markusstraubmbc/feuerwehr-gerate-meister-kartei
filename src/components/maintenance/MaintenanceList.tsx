
import { useState, useRef } from "react";
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
import { FileCheck, Eye, Printer, FileDown } from "lucide-react";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { CompleteMaintenanceDialog } from "./CompleteMaintenanceDialog";
import { ViewMaintenanceDialog } from "./ViewMaintenanceDialog";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceListProps {
  records: MaintenanceRecord[];
}

export const MaintenanceList = ({ records }: MaintenanceListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  
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

  const handleExportToExcel = () => {
    try {
      const exportData = records.map(record => ({
        'Ausrüstung': record.equipment?.name || '',
        'Wartungstyp': record.template?.name || 'Keine Vorlage',
        'Status': record.status,
        'Fällig am': record.due_date ? format(new Date(record.due_date), "dd.MM.yyyy", { locale: de }) : '-',
        'Durchgeführt am': record.performed_date ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : '-',
        'Verantwortlich': record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen',
        'Notizen': record.notes || ''
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Wartungen');
      
      // Generate filename with current date
      const fileName = `Wartungsaufzeichnungen-${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      toast.success('Export erfolgreich abgeschlossen');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  };

  const downloadChecklist = async (record: MaintenanceRecord) => {
    try {
      if (record.template?.checklist_url) {
        const { data, error } = await supabase
          .storage
          .from('checklists')
          .download(record.template.checklist_url);

        if (error) {
          throw error;
        }

        // Create a download link and trigger download
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Checkliste-${record.template.name}.pdf`;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
        
        toast.success('Checkliste wurde heruntergeladen');
      } else {
        toast.error('Keine Checkliste für diese Wartungsvorlage verfügbar');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Fehler beim Herunterladen der Checkliste');
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportToExcel}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportieren
        </Button>
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
                      {record.template?.checklist_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => downloadChecklist(record)}
                        >
                          <FileDown className="h-4 w-4" />
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
