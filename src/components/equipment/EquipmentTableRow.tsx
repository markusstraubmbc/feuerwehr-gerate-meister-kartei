
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { EquipmentStatusBadge } from "./EquipmentStatusBadge";
import { EquipmentActions } from "./EquipmentActions";
import { EquipmentCommentCount } from "./EquipmentCommentCount";
import { Equipment } from "@/hooks/useEquipment";
import { format } from "date-fns";

interface EquipmentTableRowProps {
  item: Equipment;
  commentCount: number;
  onPdfExport: (equipment: Equipment) => void;
  onOverview: (equipment: Equipment) => void;
  onBarcode: (equipment: Equipment) => void;
  onComments: (equipment: Equipment) => void;
  onDuplicate: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

export function EquipmentTableRow({
  item,
  commentCount,
  onPdfExport,
  onOverview,
  onBarcode,
  onComments,
  onDuplicate,
  onEdit,
  onDelete
}: EquipmentTableRowProps) {
  return (
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
      <TableCell className="hidden lg:table-cell">
        <EquipmentCommentCount 
          count={commentCount}
          onViewComments={() => onComments(item)}
        />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {item.replacement_date ? format(new Date(item.replacement_date), "dd.MM.yyyy") : "-"}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {item.last_check_date ? format(new Date(item.last_check_date), "dd.MM.yyyy") : "-"}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {item.next_check_date ? format(new Date(item.next_check_date), "dd.MM.yyyy") : "-"}
      </TableCell>
      <TableCell className="text-right print:hidden">
        <EquipmentActions
          equipment={item}
          onPdfExport={onPdfExport}
          onOverview={onOverview}
          onBarcode={onBarcode}
          onComments={onComments}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
