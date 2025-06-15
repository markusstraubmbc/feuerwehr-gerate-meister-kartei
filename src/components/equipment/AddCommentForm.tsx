
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePersons } from "@/hooks/usePersons";

interface AddCommentFormProps {
  onSubmit: (comment: string, personId: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function AddCommentForm({ onSubmit, isSubmitting }: AddCommentFormProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { data: persons = [] } = usePersons();

  const handleSubmit = async () => {
    if (!newComment.trim() || !selectedPersonId || selectedPersonId === "no_person") return;
    
    const success = await onSubmit(newComment, selectedPersonId);
    if (success) {
      setNewComment("");
      setSelectedPersonId(null);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">Neuen Kommentar hinzufügen</h3>
      
      <Select 
        value={selectedPersonId || "no_person"} 
        onValueChange={(value) => setSelectedPersonId(value === "no_person" ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Person auswählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no_person">Person auswählen</SelectItem>
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

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !newComment.trim() || !selectedPersonId || selectedPersonId === "no_person"}
        >
          {isSubmitting ? "Speichert..." : "Kommentar hinzufügen"}
        </Button>
      </div>
    </div>
  );
}
