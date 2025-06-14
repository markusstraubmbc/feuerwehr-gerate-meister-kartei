
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Comment } from "@/hooks/useCommentOperations";

interface CommentItemProps {
  comment: Comment;
  onDelete: (comment: Comment) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/30">
      <div className="flex justify-between items-start">
        <div className="font-medium">
          {comment.person ? `${comment.person.first_name} ${comment.person.last_name}` : "Unbekannte Person"}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm")}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-700"
            onClick={() => onDelete(comment)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="mt-2 whitespace-pre-wrap">{comment.comment}</div>
    </div>
  );
}
