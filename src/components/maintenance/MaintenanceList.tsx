
import { useState, useRef, useMemo } from "react";
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
import { FileCheck, Eye, Printer, FileDown, Trash2, PenLine } from "lucide-react";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { getTemplateChecklistUrl, generateCustomChecklist } from "@/hooks/useMaintenanceRecords";
import { CompleteMaintenanceDialog } from "./CompleteMaintenanceDialog";
import { ViewMaintenanceDialog } from "./ViewMaintenanceDialog";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditMaintenanceDialog } from "./EditMaintenanceDialog";

interface MaintenanceListProps {
  records: MaintenanceRecord[];
  responsiblePersonId?: string;
  onFilterChange?: (term: string) => void;
  filterTerm?: string;
}

export const MaintenanceList = ({ 
  records, 
  responsiblePersonId,
  onFilterChange,
  filterTerm = ""
}: MaintenanceListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filterTerm);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Wartungsaufzeichnungen',
    pageStyle: '@page { size: auto; margin: 10mm; } @media print { body { font-size: 12pt; } }',
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

  const handleEdit = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
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
        'Notizen': record.notes || '',
        'Zeit (Minuten)': record.minutes_spent || '-'
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

  const downloadCustomChecklist = async (record: MaintenanceRecord) => {
    try {
      const checklistBlob = await generateCustomChecklist(record);
      
      if (!checklistBlob) {
        toast.error('Fehler beim Generieren der angepassten Checkliste');
        return;
      }
      
      const url = URL.createObjectURL(checklistBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Angepasste-Checkliste-${record.equipment.name}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
      
      toast.success('Angepasste Checkliste wurde heruntergeladen');
    } catch (error) {
      console.error('Custom checklist download error:', error);
      toast.error('Fehler beim Herunterladen der angepassten Checkliste');
    }
  };
  
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      setIsDeleting(true);
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", recordId);
        
      if (error) throw error;
      return recordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Wartung erfolgreich gelöscht");
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Fehler beim Löschen der Wartung");
      setIsDeleting(false);
    }
  });

  const handleConfirmDelete = () => {
    if (selectedRecord) {
      deleteMutation.mutate(selectedRecord.id);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onFilterChange) {
      onFilterChange(e.target.value);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
        <Input 
          placeholder="Suchen..." 
          value={searchTerm} 
          onChange={handleSearchChange}
          className="max-w-sm" 
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportieren
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
        </div>
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
                <TableHead>Zeit (Min)</TableHead>
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
                    {record.minutes_spent || "-"}
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
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleComplete(record)}
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleEdit(record)}
                          >
                            <PenLine className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" 
                            onClick={() => handleDelete(record)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
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
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => downloadCustomChecklist(record)}
                      >
                        <FileDown className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
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
          
          <EditMaintenanceDialog
            record={selectedRecord}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wartung löschen</AlertDialogTitle>
                <AlertDialogDescription>
                  Sind Sie sicher, dass Sie diese Wartung löschen möchten?
                  <div className="mt-2 font-semibold">{selectedRecord.equipment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Wartungstyp: {selectedRecord.template?.name || "Keine Vorlage"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fällig am: {format(new Date(selectedRecord.due_date), "dd.MM.yyyy", { locale: de })}
                  </div>
                  <div className="mt-4 text-sm">
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Löschen..." : "Löschen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
};
