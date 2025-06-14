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
import { FileCheck, Eye, FileDown, Trash2, PenLine, Filter, RotateCcw } from "lucide-react";
import type { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { generateCustomChecklist } from "@/hooks/useMaintenanceRecords";
import { CompleteMaintenanceDialog } from "./CompleteMaintenanceDialog";
import { ViewMaintenanceDialog } from "./ViewMaintenanceDialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { SELECT_ALL_VALUE } from "@/lib/constants";

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
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filterTerm);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(SELECT_ALL_VALUE);
  
  const queryClient = useQueryClient();
  const { data: templates = [] } = useMaintenanceTemplates();
  
  const handleExportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Wartungsaufzeichnungen', 14, 15);
      
      // Date
      doc.setFontSize(10);
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 25);
      
      // Prepare data for PDF
      const tableData = filteredRecords.map(record => [
        record.due_date ? format(new Date(record.due_date), "dd.MM.yyyy", { locale: de }) : '-',
        record.equipment?.name || '',
        record.equipment?.barcode || '-',
        record.template?.name || 'Keine Vorlage',
        record.status,
        record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen',
        record.performed_date ? format(new Date(record.performed_date), "dd.MM.yyyy", { locale: de }) : '-',
        record.minutes_spent?.toString() || '-'
      ]);
      
      // Add table
      autoTable(doc, {
        head: [['Fällig am', 'Ausrüstung', 'Barcode', 'Wartungstyp', 'Status', 'Verantwortlich', 'Durchgeführt am', 'Zeit (Min)']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { top: 35 }
      });
      
      // Save the PDF
      const fileName = `Wartungsaufzeichnungen-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF wurde erfolgreich erstellt');
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Fehler beim Erstellen der PDF');
    }
  };

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

  const handleReset = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsResetDialogOpen(true);
  };
  
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const equipmentNameMatches = record.equipment?.name?.toLowerCase().includes(searchLower);
        const equipmentBarcodeMatches = record.equipment?.barcode?.toLowerCase().includes(searchLower);
        const templateNameMatches = record.template?.name?.toLowerCase().includes(searchLower);
        const notesMatch = record.notes?.toLowerCase().includes(searchLower);
        
        if (!equipmentNameMatches && !equipmentBarcodeMatches && !templateNameMatches && !notesMatch) {
          return false;
        }
      }
      
      // Filter by template
      if (selectedTemplate && selectedTemplate !== SELECT_ALL_VALUE) {
        if (record.template_id !== selectedTemplate) {
          return false;
        }
      }
      
      return true;
    });
  }, [records, searchTerm, selectedTemplate]);

  const handleExportToExcel = () => {
    try {
      const exportData = filteredRecords.map(record => ({
        'Ausrüstung': record.equipment?.name || '',
        'Barcode': record.equipment?.barcode || '',
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

  const downloadCustomChecklist = async (record: MaintenanceRecord) => {
    try {
      const checklistBlob = await generateCustomChecklist(record);
      
      if (!checklistBlob) {
        toast.error('Fehler beim Generieren der angepassten Checkliste');
        return;
      }
      
      // For HTML blobs, we need to use iframe to display and print
      const url = URL.createObjectURL(checklistBlob);
      
      // Open in new window for easier printing
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // If popup is blocked, offer direct download
        const link = document.createElement('a');
        link.href = url;
        link.download = `Angepasste-Checkliste-${record.equipment.name}-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
      }
      
      toast.success('Angepasste Checkliste wurde geöffnet');
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

  const resetMutation = useMutation({
    mutationFn: async (recordId: string) => {
      setIsResetting(true);
      const { error } = await supabase
        .from("maintenance_records")
        .update({
          status: "geplant",
          performed_date: null,
          performed_by: null,
          minutes_spent: null,
          documentation_image_url: null,
          notes: null
        })
        .eq("id", recordId);
        
      if (error) throw error;
      return recordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Wartung erfolgreich auf 'geplant' zurückgesetzt");
      setIsResetDialogOpen(false);
      setIsResetting(false);
    },
    onError: (error) => {
      console.error("Reset error:", error);
      toast.error("Fehler beim Zurücksetzen der Wartung");
      setIsResetting(false);
    }
  });

  const handleConfirmDelete = () => {
    if (selectedRecord) {
      deleteMutation.mutate(selectedRecord.id);
    }
  };

  const handleConfirmReset = () => {
    if (selectedRecord) {
      resetMutation.mutate(selectedRecord.id);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };
  
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTemplate(SELECT_ALL_VALUE);
    if (onFilterChange) {
      onFilterChange("");
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Suchen..." 
            value={searchTerm} 
            onChange={handleSearchChange}
            className="sm:max-w-sm" 
          />
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="sm:w-60">
              <SelectValue placeholder="Wartungsvorlage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_ALL_VALUE}>Alle Wartungsvorlagen</SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Filter zurücksetzen
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF Export
          </Button>
        </div>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fällig am</TableHead>
              <TableHead>Ausrüstung</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Wartungstyp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verantwortlich</TableHead>
              <TableHead>Durchgeführt am</TableHead>
              <TableHead>Zeit (Min)</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {format(new Date(record.due_date), "dd.MM.yyyy", { locale: de })}
                </TableCell>
                <TableCell>{record.equipment.name}</TableCell>
                <TableCell>{record.equipment.barcode || "-"}</TableCell>
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
                      </>
                    )}
                    
                    {record.status === "abgeschlossen" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50" 
                        onClick={() => handleReset(record)}
                        title="Wartung auf 'geplant' zurücksetzen"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" 
                      onClick={() => handleDelete(record)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => downloadCustomChecklist(record)}
                      title="Angepasste Checkliste herunterladen"
                    >
                      <FileDown className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Keine Wartungsaufzeichnungen gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
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

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wartung zurücksetzen</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie diese abgeschlossene Wartung auf "geplant" zurücksetzen?
                  <div className="mt-2 font-semibold">{selectedRecord.equipment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Wartungstyp: {selectedRecord.template?.name || "Keine Vorlage"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Durchgeführt am: {selectedRecord.performed_date ? format(new Date(selectedRecord.performed_date), "dd.MM.yyyy", { locale: de }) : "-"}
                  </div>
                  <div className="mt-4 text-sm">
                    Alle Durchführungsdaten (Datum, Person, Notizen, etc.) werden entfernt.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmReset}
                  disabled={isResetting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isResetting ? "Zurücksetzen..." : "Zurücksetzen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
};
