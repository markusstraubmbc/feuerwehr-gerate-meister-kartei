
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
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { usePersons } from "@/hooks/usePersons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

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
      // Use raw query instead of typed query since equipment_comments is not in the types
      const { data, error } = await supabase
        .from("equipment_comments")
        .select(`
          id,
          equipment_id,
          person_id,
          comment,
          created_at,
          person:person_id (id, first_name, last_name)
        `)
        .eq("equipment_id", equipment.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading comments:", error);
        toast.error("Fehler beim Laden der Kommentare");
        return;
      }

      setComments(data as Comment[] || []);
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
      // Use raw insert since equipment_comments is not in the types
      const { error } = await supabase
        .from("equipment_comments")
        .insert({
          equipment_id: equipment.id,
          person_id: selectedPersonId,
          comment: newComment.trim()
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

  return (
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
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm")}
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
  );
}
