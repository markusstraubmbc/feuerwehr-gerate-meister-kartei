import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Tag, MapPin } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { EquipmentComment } from "@/hooks/useEquipmentComments";
import { Equipment } from "@/hooks/useEquipment";

interface ActionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: EquipmentComment | null;
  equipment: Equipment | null;
}

export function ActionDetailDialog({
  open,
  onOpenChange,
  action,
  equipment
}: ActionDetailDialogProps) {
  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aktionsdetails</DialogTitle>
          <DialogDescription>
            Detaillierte Informationen zur durchgeführten Aktion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Equipment Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Ausrüstung</h3>
            <div className="p-3 border rounded-md bg-muted/30">
              <p className="font-medium">{equipment?.name || "Unbekannte Ausrüstung"}</p>
              {equipment?.inventory_number && (
                <p className="text-sm text-muted-foreground">
                  Inventarnummer: {equipment.inventory_number}
                </p>
              )}
            </div>
          </div>

          {/* Action Type */}
          {action.action && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Aktionstyp</h3>
              <Badge variant="outline" className="text-sm">
                {action.action.name}
              </Badge>
              {action.action.description && (
                <p className="text-sm text-muted-foreground">{action.action.description}</p>
              )}
            </div>
          )}

          {/* Comment/Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Beschreibung</h3>
            <div className="p-3 border rounded-md bg-muted/30">
              <p className="text-sm whitespace-pre-wrap">{action.comment}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Weitere Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Durchgeführt von</p>
                  <p className="font-medium">
                    {action.person.first_name} {action.person.last_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Datum & Zeit</p>
                  <p className="font-medium">
                    {format(new Date(action.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
              </div>

              {equipment?.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kategorie</p>
                    <p className="font-medium">{equipment.category.name}</p>
                  </div>
                </div>
              )}

              {equipment?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Standort</p>
                    <p className="font-medium">{equipment.location.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
