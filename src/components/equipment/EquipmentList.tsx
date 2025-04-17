
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Barcode } from "lucide-react";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import type { Equipment } from "@/hooks/useEquipment";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentDialog } from "./DeleteEquipmentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeDialog } from "./BarcodeDialog";

interface EquipmentListProps {
  equipment: Equipment[];
}

export function EquipmentList({ equipment }: EquipmentListProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);

  const handleEdit = (item: Equipment) => {
    setCurrentEquipment(item);
    setEditDialogOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    setCurrentEquipment(item);
    setDeleteDialogOpen(true);
  };

  const handleShowBarcode = (item: Equipment) => {
    setCurrentEquipment(item);
    setBarcodeDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inventarnummer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Letzte Prüfung</TableHead>
              <TableHead>Nächste Prüfung</TableHead>
              <TableHead>Standort</TableHead>
              <TableHead>Verantwortlich</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length > 0 ? (
              equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.inventory_number || "-"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.barcode || "-"}</TableCell>
                  <TableCell>
                    {item.category?.name ? (
                      <Badge variant="outline">{item.category.name}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <EquipmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.last_check_date
                      ? format(new Date(item.last_check_date), "dd.MM.yyyy", {
                          locale: de,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {item.next_check_date
                      ? format(new Date(item.next_check_date), "dd.MM.yyyy", {
                          locale: de,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>{item.location?.name || "-"}</TableCell>
                  <TableCell>
                    {item.responsible_person
                      ? `${item.responsible_person.first_name} ${item.responsible_person.last_name}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowBarcode(item)}
                      >
                        <Barcode className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                  Keine Ausrüstung gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ausrüstung bearbeiten</DialogTitle>
          </DialogHeader>
          {currentEquipment && (
            <EditEquipmentForm 
              equipment={currentEquipment} 
              onSuccess={() => setEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {currentEquipment && (
        <DeleteEquipmentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          equipment={currentEquipment}
        />
      )}

      {currentEquipment && (
        <BarcodeDialog
          open={barcodeDialogOpen}
          onOpenChange={setBarcodeDialogOpen}
          equipment={currentEquipment}
        />
      )}
    </>
  );
}
