
import React, { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { Equipment } from "@/hooks/useEquipment";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import { BarcodeDialog } from "./BarcodeDialog";
import { DuplicateEquipmentDialog } from "./DuplicateEquipmentDialog";
import { CommentsDialog } from "./CommentsDialog";
import { EquipmentOverviewDialog } from "./EquipmentOverviewDialog";
import { EquipmentTableRow } from "./EquipmentTableRow";
import { useEquipmentPrintExport } from "./EquipmentPrintExport";
import { useEquipmentCommentCounts } from "@/hooks/useEquipmentCommentCounts";
import { useEquipmentPdfExport } from "@/hooks/useEquipmentPdfExport";

interface EquipmentListProps {
  equipment: Equipment[];
  statusFilter?: string;
  categoryFilter?: string;
  personFilter?: string;
  searchTerm?: string;
  onFilterChange?: (filters: {
    status?: string;
    category?: string;
    person?: string;
    search?: string;
  }) => void;
}

export function EquipmentList({ 
  equipment,
  statusFilter,
  categoryFilter,
  personFilter,
  searchTerm = "",
  onFilterChange
}: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  // Apply filters to get filtered equipment
  const filteredEquipment = equipment.filter(item => {
    if (statusFilter && statusFilter !== "status_all" && item.status !== statusFilter) {
      return false;
    }
    
    if (categoryFilter && item.category_id !== categoryFilter) {
      return false;
    }
    
    if (personFilter && item.responsible_person_id !== personFilter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.inventory_number && item.inventory_number.toLowerCase().includes(searchLower)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const { handlePdfDownload } = useEquipmentPrintExport({ 
    equipment: filteredEquipment, 
    printRef 
  });

  const { commentCounts } = useEquipmentCommentCounts(filteredEquipment);
  const { handlePdfExportForEquipment } = useEquipmentPdfExport();

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsEditFormOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsDeleteDialogOpen(true);
  };

  const handleBarcode = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsBarcodeDialogOpen(true);
  };
  
  const handleDuplicate = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsDuplicateDialogOpen(true);
  };

  const handleComments = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsCommentsDialogOpen(true);
  };

  const handleOverview = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsOverviewDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handlePdfDownload}>
          <FileDown className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div ref={printRef}>
          <div className="print-title" style={{ display: 'none' }}>
            Ausrüstungsliste - {new Date().toLocaleDateString('de-DE')}
          </div>
          <div className="print-info" style={{ display: 'none' }}>
            {filteredEquipment.length !== equipment.length && (
              <>Gefilterte Ansicht: {filteredEquipment.length} von {equipment.length} Einträgen</>
            )}
            {filteredEquipment.length === equipment.length && (
              <>Gesamt: {equipment.length} Einträge</>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inv.-Nr.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Standort</TableHead>
                <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Anzahl Kommentare</TableHead>
                <TableHead className="hidden md:table-cell">Ersetzt am</TableHead>
                <TableHead className="hidden md:table-cell">Letzte Wartung</TableHead>
                <TableHead className="hidden md:table-cell">Nächste Wartung</TableHead>
                <TableHead className="text-right print:hidden">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Keine Ausrüstung gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item) => (
                  <EquipmentTableRow
                    key={item.id}
                    item={item}
                    commentCount={commentCounts[item.id] || 0}
                    onPdfExport={handlePdfExportForEquipment}
                    onOverview={handleOverview}
                    onBarcode={handleBarcode}
                    onComments={handleComments}
                    onDuplicate={handleDuplicate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedEquipment && (
        <>
          {isEditFormOpen && (
            <EditEquipmentForm
              equipment={selectedEquipment}
              onSuccess={() => setIsEditFormOpen(false)}
            />
          )}
          <DeleteEquipmentDialog
            equipment={selectedEquipment}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          />
          <BarcodeDialog
            equipment={selectedEquipment}
            open={isBarcodeDialogOpen}
            onOpenChange={setIsBarcodeDialogOpen}
          />
          <DuplicateEquipmentDialog
            equipment={selectedEquipment}
            open={isDuplicateDialogOpen}
            onOpenChange={setIsDuplicateDialogOpen}
          />
          <CommentsDialog
            equipment={selectedEquipment}
            open={isCommentsDialogOpen}
            onOpenChange={setIsCommentsDialogOpen}
          />
          <EquipmentOverviewDialog
            equipment={selectedEquipment}
            open={isOverviewDialogOpen}
            onOpenChange={setIsOverviewDialogOpen}
          />
        </>
      )}
    </>
  );
}
