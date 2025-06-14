
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
import { Textarea } from "@/components/ui/textarea";
import { Equipment } from "@/hooks/useEquipment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePersons } from "@/hooks/usePersons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  equipment_id: string;
  person_id: string;
  comment: string;
  created_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface CommentsDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentsDialog({ equipment, open, onOpenChange }: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: persons = [] } = usePersons();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && equipment) {
      loadComments();
    }
  }, [open, equipment]);

  const loadComments = async () => {
    if (!equipment?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_equipment_comments', { 
        equipment_id_param: equipment.id 
      });
      
      if (error) {
        console.error("Error loading comments:", error);
        toast.error("Fehler beim Laden der Kommentare");
        return;
      }

      // Properly handle the type conversion for the data returned from Supabase RPC
      if (data && Array.isArray(data)) {
        // Sort comments by created_at in descending order (newest first)
        const sortedComments = (data as unknown as Comment[]).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setComments(sortedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Fehler beim Laden der Kommentare");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPersonId || !equipment?.id) {
      toast.error("Bitte geben Sie einen Kommentar ein und wählen Sie eine Person aus");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('add_equipment_comment', {
        equipment_id_param: equipment.id,
        person_id_param: selectedPersonId,
        comment_param: newComment.trim()
      });

      if (error) {
        console.error("Error adding comment:", error);
        toast.error("Fehler beim Hinzufügen des Kommentars");
        return;
      }

      toast.success("Kommentar erfolgreich hinzugefügt");
      setNewComment("");
      loadComments();
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Fehler beim Hinzufügen des Kommentars");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("equipment_comments")
        .delete()
        .eq("id", commentToDelete.id);

      if (error) {
        console.error("Error deleting comment:", error);
        toast.error("Fehler beim Löschen des Kommentars");
        return;
      }

      toast.success("Kommentar erfolgreich gelöscht");
      loadComments();
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Fehler beim Löschen des Kommentars");
    } finally {
      setIsDeleting(false);
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
            <DialogTitle>Kommentare für {equipment?.name}</DialogTitle>
            <DialogDescription>
              Inventarnummer: {equipment?.inventory_number || "Nicht angegeben"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-4 max-h-[40vh] overflow-y-auto p-2 border rounded-md">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Keine Kommentare vorhanden
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-md p-3 bg-muted/30">
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
                          onClick={() => openDeleteDialog(comment)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap">{comment.comment}</div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Neuen Kommentar hinzufügen</h3>
              
              <Select 
                value={selectedPersonId || ""} 
                onValueChange={(value) => setSelectedPersonId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Person auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Kommentar eingeben..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddComment} 
              disabled={isSubmitting || !newComment.trim() || !selectedPersonId}
            >
              {isSubmitting ? "Speichert..." : "Kommentar hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kommentar löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Kommentar löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
