
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, Trash2, Check } from "lucide-react";
import { MaintenanceTemplate } from "@/hooks/useMaintenanceTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MaintenanceTemplateFormProps {
  template?: MaintenanceTemplate;
  onSuccess: () => void;
}

export function MaintenanceTemplateForm({ template, onSuccess }: MaintenanceTemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();

  const [formData, setFormData] = useState({
    name: template?.name || "",
    interval_months: template?.interval_months || 6,
    category_id: template?.category_id || "",
    responsible_person_id: template?.responsible_person_id || "",
    description: template?.description || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState<File | null>(null);
  const [existingChecklist, setExistingChecklist] = useState(template?.checklist_url || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setChecklist(e.target.files[0]);
    }
  };

  const removeExistingChecklist = async () => {
    if (!template || !existingChecklist) return;
    
    try {
      // Remove the file from storage
      const { error } = await supabase.storage
        .from('checklists')
        .remove([`template-${template.id}`]);
      
      if (error) throw error;

      // Update the template in the database
      const { error: updateError } = await supabase
        .from('maintenance_templates')
        .update({ checklist_url: null })
        .eq('id', template.id);
      
      if (updateError) throw updateError;
      
      setExistingChecklist(null);
      toast({
        title: "Checkliste entfernt",
        description: "Die Checkliste wurde erfolgreich entfernt."
      });
      
      queryClient.invalidateQueries({ queryKey: ["maintenance-templates"] });
    } catch (error) {
      console.error("Error removing checklist:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Checkliste konnte nicht entfernt werden."
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!formData.name) {
        throw new Error("Name ist erforderlich");
      }
      
      let checklistUrl = template?.checklist_url;
      
      // Handle form submission
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from("maintenance_templates")
          .update({
            name: formData.name,
            interval_months: formData.interval_months,
            category_id: formData.category_id || null,
            responsible_person_id: formData.responsible_person_id || null,
            description: formData.description || null,
          })
          .eq("id", template.id);
          
        if (error) throw error;
        
        // Upload new checklist if selected
        if (checklist) {
          const { error: uploadError, data } = await supabase.storage
            .from("checklists")
            .upload(`template-${template.id}`, checklist, {
              cacheControl: "3600",
              upsert: true,
              onUploadProgress: (progress) => {
                setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
              }
            });
            
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from("checklists")
            .getPublicUrl(`template-${template.id}`);
            
          checklistUrl = publicUrl.publicUrl;
          
          // Update template with checklist URL
          const { error: updateError } = await supabase
            .from("maintenance_templates")
            .update({ checklist_url: checklistUrl })
            .eq("id", template.id);
            
          if (updateError) throw updateError;
        }
      } else {
        // Create new template
        const { data, error } = await supabase
          .from("maintenance_templates")
          .insert({
            name: formData.name,
            interval_months: formData.interval_months,
            category_id: formData.category_id || null,
            responsible_person_id: formData.responsible_person_id || null,
            description: formData.description || null,
          })
          .select();
          
        if (error) throw error;
        
        // Upload checklist if selected
        if (checklist && data && data[0]) {
          const templateId = data[0].id;
          const { error: uploadError } = await supabase.storage
            .from("checklists")
            .upload(`template-${templateId}`, checklist, {
              cacheControl: "3600",
              onUploadProgress: (progress) => {
                setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
              }
            });
            
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from("checklists")
            .getPublicUrl(`template-${templateId}`);
            
          checklistUrl = publicUrl.publicUrl;
          
          // Update template with checklist URL
          const { error: updateError } = await supabase
            .from("maintenance_templates")
            .update({ checklist_url: checklistUrl })
            .eq("id", templateId);
            
          if (updateError) throw updateError;
        }
      }
      
      toast({
        title: template ? "Wartungsvorlage aktualisiert" : "Wartungsvorlage erstellt",
        description: `Die Wartungsvorlage wurde erfolgreich ${template ? "aktualisiert" : "erstellt"}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["maintenance-templates"] });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message || "Beim Speichern ist ein Fehler aufgetreten.",
      });
      console.error("Error saving maintenance template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interval_months">Intervall (Monate) <span className="text-red-500">*</span></Label>
          <Input
            id="interval_months"
            name="interval_months"
            type="number"
            min="1"
            value={formData.interval_months}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategorie</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => handleSelectChange("category_id", value)}
          >
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Kategorie auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">- Keine -</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="responsible_person_id">Verantwortliche Person</Label>
          <Select
            value={formData.responsible_person_id}
            onValueChange={(value) => handleSelectChange("responsible_person_id", value)}
          >
            <SelectTrigger id="responsible_person_id">
              <SelectValue placeholder="Person auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">- Keine -</SelectItem>
              {persons.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="checklist">Checkliste (PDF)</Label>
        {existingChecklist ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 border rounded p-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Vorhandene Checkliste</span>
              </div>
              <div>
                <a 
                  href={existingChecklist} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline mr-2"
                >
                  Anzeigen
                </a>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={removeExistingChecklist}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Input
              id="checklist"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </div>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {checklist && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Neue Checkliste ausgewählt: {checklist.name}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Speichern..." : template ? "Aktualisieren" : "Erstellen"}
        </Button>
      </div>
    </form>
  );
}
