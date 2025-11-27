
import { useAllEquipmentComments } from "@/hooks/useEquipmentComments";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EquipmentCommentsInfoProps {
  equipmentId: string;
  onOpenComments?: () => void;
}

export function EquipmentCommentsInfo({ equipmentId, onOpenComments }: EquipmentCommentsInfoProps) {
  const { data: allComments } = useAllEquipmentComments();
  
  const equipmentComments = allComments?.filter(comment => comment.equipment_id === equipmentId) || [];
  const commentsCount = equipmentComments.length;
  const lastComment = equipmentComments[0]; // Already sorted by created_at DESC
  
  if (commentsCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Keine Aktionen</span>
        {onOpenComments && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpenComments}
            className="h-6 px-2"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Hinzufügen
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{commentsCount} Aktion{commentsCount !== 1 ? 'en' : ''}</span>
          {onOpenComments && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenComments}
              className="h-6 px-2"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Anzeigen
            </Button>
          )}
        </div>
        {lastComment && (
          <div className="text-muted-foreground text-xs space-y-0.5">
            <div>{format(new Date(lastComment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</div>
            {lastComment.action && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {lastComment.action.name}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
