
import { useAllEquipmentComments } from "@/hooks/useEquipmentComments";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface EquipmentCommentsInfoProps {
  equipmentId: string;
}

export function EquipmentCommentsInfo({ equipmentId }: EquipmentCommentsInfoProps) {
  const { data: allComments } = useAllEquipmentComments();
  
  const equipmentComments = allComments?.filter(comment => comment.equipment_id === equipmentId) || [];
  const commentsCount = equipmentComments.length;
  const lastComment = equipmentComments[0]; // Already sorted by created_at DESC
  
  if (commentsCount === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <div className="text-sm">
      <div className="font-medium">{commentsCount} Kommentar{commentsCount !== 1 ? 'e' : ''}</div>
      {lastComment && (
        <div className="text-muted-foreground text-xs">
          {format(new Date(lastComment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
        </div>
      )}
    </div>
  );
}
