
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Equipment } from "@/hooks/useEquipment";
import { useCommentOperations, Comment } from "@/hooks/useCommentOperations";
import { CommentItem } from "./CommentItem";
import { AddCommentForm } from "./AddCommentForm";
import { DeleteCommentDialog } from "./DeleteCommentDialog";

interface CommentsDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentsDialog({ equipment, open, onOpenChange }: CommentsDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  
  const {
    comments,
    isSubmitting,
    isDeleting,
    loadComments,
    addComment,
    deleteComment
  } = useCommentOperations(equipment?.id);

  useEffect(() => {
    if (open && equipment) {
      loadComments();
    }
  }, [open, equipment]);

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    const success = await deleteComment(commentToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const openDeleteDialog = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aktionen für {equipment?.name}</DialogTitle>
            <DialogDescription>
              Inventarnummer: {equipment?.inventory_number || "Nicht angegeben"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-4 max-h-[40vh] overflow-y-auto p-2 border rounded-md">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Keine Aktionen vorhanden
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={openDeleteDialog}
                  />
                ))
              )}
            </div>

            <AddCommentForm
              onSubmit={addComment}
              isSubmitting={isSubmitting}
            />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteCommentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        comment={commentToDelete}
        onConfirm={handleDeleteComment}
        isDeleting={isDeleting}
      />
    </>
  );
}
