
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface Comment {
  id: string;
  equipment_id: string;
  person_id: string;
  comment: string;
  created_at: string;
  action_id?: string | null;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  action?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export const useCommentOperations = (equipmentId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const loadComments = async () => {
    if (!equipmentId) return;

    try {
      const { data, error } = await supabase.rpc('get_equipment_comments', { 
        equipment_id_param: equipmentId 
      });
      
      if (error) {
        console.error("Error loading comments:", error);
        toast.error("Fehler beim Laden der Kommentare");
        return;
      }

      if (data && Array.isArray(data)) {
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

  const addComment = async (commentText: string, personId: string, actionId?: string) => {
    if (!commentText.trim() || !personId || !equipmentId) {
      toast.error("Bitte geben Sie einen Kommentar ein und wählen Sie eine Person aus");
      return false;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('add_equipment_comment', {
        equipment_id_param: equipmentId,
        person_id_param: personId,
        comment_param: commentText.trim(),
        action_id_param: actionId || null
      });

      if (error) {
        console.error("Error adding comment:", error);
        toast.error("Fehler beim Hinzufügen des Kommentars");
        return false;
      }

      toast.success("Kommentar erfolgreich hinzugefügt");
      loadComments();
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Fehler beim Hinzufügen des Kommentars");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("equipment_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("Error deleting comment:", error);
        toast.error("Fehler beim Löschen des Kommentars");
        return false;
      }

      toast.success("Kommentar erfolgreich gelöscht");
      loadComments();
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Fehler beim Löschen des Kommentars");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    comments,
    isSubmitting,
    isDeleting,
    loadComments,
    addComment,
    deleteComment
  };
};
