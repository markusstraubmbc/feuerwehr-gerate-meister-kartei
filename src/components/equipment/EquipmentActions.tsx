
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Barcode,
  Copy,
  MessageCircle,
  FileDown,
  Eye
} from "lucide-react";
import { Equipment } from "@/hooks/useEquipment";

interface EquipmentActionsProps {
  equipment: Equipment;
  onPdfExport: (equipment: Equipment) => void;
  onOverview: (equipment: Equipment) => void;
  onBarcode: (equipment: Equipment) => void;
  onComments: (equipment: Equipment) => void;
  onDuplicate: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

export function EquipmentActions({
  equipment,
  onPdfExport,
  onOverview,
  onBarcode,
  onComments,
  onDuplicate,
  onEdit,
  onDelete
}: EquipmentActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPdfExport(equipment)}
        title="PDF-Detailbericht erstellen"
      >
        <FileDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOverview(equipment)}
        title="Detailübersicht anzeigen"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onBarcode(equipment)}
      >
        <Barcode className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onComments(equipment)}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDuplicate(equipment)}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(equipment)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(equipment)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
