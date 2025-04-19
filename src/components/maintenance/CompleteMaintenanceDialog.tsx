
import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MaintenanceRecord, getTemplateChecklistUrl } from "@/hooks/useMaintenanceRecords";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Camera, FileUp, Loader2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePersons } from "@/hooks/usePersons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

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

interface CompleteMaintenanceDialogProps {
  record: MaintenanceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteMaintenanceDialog({
  record,
  open,
  onOpenChange,
}: CompleteMaintenanceDialogProps) {
  const queryClient = useQueryClient();
  const { data: persons = [] } = usePersons();
  const { data: templates = [] } = useMaintenanceTemplates();
  
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [performerId, setPerformerId] = useState(record.performer?.id || "");
  const [minutesSpent, setMinutesSpent] = useState<string>(
    record.template?.estimated_minutes?.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentComments, setEquipmentComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  useEffect(() => {
    if (record.template_id && open) {
      const template = templates.find(t => t.id === record.template_id);
      if (template && template.estimated_minutes && !minutesSpent) {
        setMinutesSpent(template.estimated_minutes.toString());
      }
    }

    if (open && record.equipment_id) {
      loadEquipmentComments(record.equipment_id);
    }
  }, [record.template_id, record.equipment_id, templates, open, minutesSpent]);
  
  const loadEquipmentComments = async (equipmentId: string) => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase.rpc('get_equipment_comments', { 
        equipment_id_param: equipmentId 
      });
      
      if (error) {
        console.error("Error loading equipment comments:", error);
        return;
      }

      // Convert the JSON data to Comment type and limit to the latest 3
      const comments = (data || []) as unknown as Comment[];
      setEquipmentComments(comments.slice(0, 3));
    } catch (error) {
      console.error("Error loading equipment comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const resetState = useCallback(() => {
    setNotes("");
    setImage(null);
    setImagePreview(null);
    setPerformerId(record.performer?.id || "");
    setMinutesSpent(record.template?.estimated_minutes?.toString() || "");
    setError(null);
    setEquipmentComments([]);
  }, [record]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Die hochgeladene Datei muss ein Bild sein.");
        return;
      }
      
      setImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };
  
  const handleCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const inputElement = e.target as HTMLInputElement;
      if (inputElement.files && inputElement.files[0]) {
        const file = inputElement.files[0];
        
        if (!file.type.startsWith("image/")) {
          setError("Die aufgenommene Datei muss ein Bild sein.");
          return;
        }
        
        setImage(file);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
        setError(null);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    try {
      if (!image) {
        setError("Bitte laden Sie ein Dokumentationsbild hoch.");
        return;
      }
      
      if (!performerId) {
        setError("Bitte wählen Sie eine verantwortliche Person aus.");
        return;
      }
      
      setIsLoading(true);
      
      const timestamp = Date.now();
      const fileExt = image.name.split('.').pop();
      const fileName = `maintenance-${record.id}-${timestamp}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maintenance_docs')
        .upload(fileName, image);
        
      if (uploadError) throw uploadError;
      
      // Create a signed URL with 1 hour expiry
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('maintenance_docs')
        .createSignedUrl(fileName, 60 * 60); // 1 hour in seconds
        
      if (signedUrlError) throw signedUrlError;
        
      const { error: updateError } = await supabase
        .from('maintenance_records')
        .update({
          status: 'abgeschlossen',
          performed_date: new Date().toISOString(),
          performed_by: performerId,
          notes: notes || null,
          minutes_spent: minutesSpent ? parseInt(minutesSpent) : null,
          documentation_image_url: fileName // Store just the filename
        })
        .eq('id', record.id);
        
      if (updateError) throw updateError;
      
      if (record.template_id && minutesSpent) {
        const template = templates.find(t => t.id === record.template_id);
        if (template && (!template.estimated_minutes || template.estimated_minutes.toString() !== minutesSpent)) {
          const { error: templateError } = await supabase
            .from('maintenance_templates')
            .update({ estimated_minutes: parseInt(minutesSpent) })
            .eq('id', record.template_id);
          
          if (templateError) {
            console.error("Error updating template time:", templateError);
          } else {
            queryClient.invalidateQueries({ queryKey: ["maintenance-templates"] });
          }
        }
      }
      
      toast.success("Die Wartung wurde erfolgreich als abgeschlossen markiert.");
      
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      setError(`Fehler: ${err.message}`);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetState();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wartung abschließen</DialogTitle>
          <DialogDescription>
            Dokumentieren Sie die durchgeführte Wartung für {record.equipment.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {equipmentComments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="text-sm font-medium">Letzte Kommentare zur Ausrüstung</h3>
              </div>
              <Card className="p-3">
                <div className="space-y-3 max-h-[150px] overflow-y-auto">
                  {equipmentComments.map((comment) => (
                    <div key={comment.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start text-sm">
                        <div className="font-medium">
                          {comment.person ? `${comment.person.first_name} ${comment.person.last_name}` : "Unbekannt"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd.MM.yyyy")}
                        </div>
                      </div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{comment.comment}</div>
                    </div>
                  ))}
                  {isLoadingComments && <div className="text-center text-sm">Kommentare werden geladen...</div>}
                </div>
              </Card>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="performer">Durchführende Person</Label>
            <Select
              value={performerId}
              onValueChange={setPerformerId}
            >
              <SelectTrigger id="performer">
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minutes_spent">Aufgewendete Zeit (Minuten)</Label>
            <Input
              id="minutes_spent"
              type="number"
              min="1"
              value={minutesSpent}
              onChange={(e) => setMinutesSpent(e.target.value)}
              placeholder="Zeit in Minuten"
            />
            {record.template?.estimated_minutes && (
              <p className="text-xs text-muted-foreground">
                Geschätzte Zeit laut Wartungsvorlage: {record.template.estimated_minutes} Minuten
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Anmerkungen</Label>
            <Textarea 
              id="notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details zur durchgeführten Wartung..."
            />
          </div>
          
          <div className="space-y-2">
            <Label className="block">Dokumentationsbild</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCapture}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Foto aufnehmen
              </Button>
              
              <div className="relative flex-1">
                <Input 
                  id="documentation-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Bild auswählen
                </Button>
              </div>
            </div>
            
            {imagePreview && (
              <div className="mt-4 border rounded-md p-2">
                <img 
                  src={imagePreview} 
                  alt="Vorschau" 
                  className="w-full rounded-md h-auto max-h-60 object-contain" 
                />
              </div>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert
              </>
            ) : "Wartung abschließen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
