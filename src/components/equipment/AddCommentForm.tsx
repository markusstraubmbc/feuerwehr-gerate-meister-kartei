
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePersons } from "@/hooks/usePersons";
import { useEquipmentActions } from "@/hooks/useEquipmentActions";
import { Label } from "@/components/ui/label";

interface AddCommentFormProps {
  onSubmit: (comment: string, personId: string, actionId?: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function AddCommentForm({ onSubmit, isSubmitting }: AddCommentFormProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const { data: persons = [] } = usePersons();
  const { data: actions = [] } = useEquipmentActions();

  const handleSubmit = async () => {
    if (!newComment.trim() || !selectedPersonId || selectedPersonId === "no_person") return;
    
    const success = await onSubmit(
      newComment, 
      selectedPersonId, 
      selectedActionId && selectedActionId !== "no_action" ? selectedActionId : undefined
    );
    if (success) {
      setNewComment("");
      setSelectedPersonId(null);
      setSelectedActionId(null);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">Neue Aktion hinzufügen</h3>
      
      <div>
        <Label htmlFor="person">Person *</Label>
        <Select 
          value={selectedPersonId || "no_person"} 
          onValueChange={(value) => setSelectedPersonId(value === "no_person" ? null : value)}
        >
          <SelectTrigger id="person">
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
      </div>

      <div>
        <Label htmlFor="action">Aktion (Optional)</Label>
        <Select 
          value={selectedActionId || "no_action"} 
          onValueChange={(value) => setSelectedActionId(value === "no_action" ? null : value)}
        >
          <SelectTrigger id="action">
            <SelectValue placeholder="Aktion auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_action">Keine Aktion</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action.id} value={action.id}>
                {action.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="comment">Beschreibung *</Label>
        <Textarea
          id="comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Beschreibung eingeben..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !newComment.trim() || !selectedPersonId || selectedPersonId === "no_person"}
        >
          {isSubmitting ? "Speichert..." : "Aktion hinzufügen"}
        </Button>
      </div>
    </div>
  );
}
