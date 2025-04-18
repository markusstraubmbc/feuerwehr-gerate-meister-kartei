
import { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Barcode,
  Copy,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { Equipment } from "@/hooks/useEquipment";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import { BarcodeDialog } from "./BarcodeDialog";
import { DuplicateEquipmentDialog } from "./DuplicateEquipmentDialog";
import { useReactToPrint } from "react-to-print";

interface EquipmentListProps {
  equipment: Equipment[];
}

export function EquipmentList({ equipment }: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  
  // Add ref for printing
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Ausrüstungsliste',
  });

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

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Drucken
        </Button>
      </div>
      
      <div ref={printRef} className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inventarnummer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Standort</TableHead>
              <TableHead className="hidden md:table-cell">Kategorie</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Keine Ausrüstung gefunden
                </TableCell>
              </TableRow>
            ) : (
              equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.inventory_number || "-"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.location?.name || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.category?.name || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <EquipmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBarcode(item)}
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(item)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        </>
      )}
    </>
  );
}
