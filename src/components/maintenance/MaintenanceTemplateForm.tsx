
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { MaintenanceTemplate } from "@/hooks/useMaintenanceTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, FileUp, X, Plus, Trash } from "lucide-react";

interface MaintenanceTemplateFormProps {
  template?: MaintenanceTemplate;
  onSuccess?: () => void;
}

export function MaintenanceTemplateForm({ template, onSuccess }: MaintenanceTemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: persons } = usePersons();

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [intervalMonths, setIntervalMonths] = useState(template?.interval_months?.toString() || "1");
  const [categoryId, setCategoryId] = useState(template?.category_id || "none");
  const [responsiblePersonId, setResponsiblePersonId] = useState(template?.responsible_person_id || "none");
  const [estimatedMinutes, setEstimatedMinutes] = useState(template?.estimated_minutes?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [existingChecklist, setExistingChecklist] = useState(template?.checklist_url || null);
  const [checklistUploadProgress, setChecklistUploadProgress] = useState(0);
  const [checks, setChecks] = useState<string[]>(template?.checks || []);
  const [newCheck, setNewCheck] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setChecklistFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setChecklistFile(null);
  };

  const handleRemoveExistingChecklist = () => {
    setExistingChecklist(null);
  };

  const handleAddCheck = () => {
    if (newCheck.trim()) {
      setChecks([...checks, newCheck.trim()]);
      setNewCheck("");
    }
  };

  const handleRemoveCheck = (index: number) => {
    setChecks(checks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      let checklistUrl = existingChecklist;
      
      if (checklistFile) {
        const fileName = `template_${Date.now()}_${checklistFile.name.replace(/\s+/g, '_')}`;
        
        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checklists')
          .upload(fileName, checklistFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('checklists')
          .getPublicUrl(fileName);
          
        checklistUrl = publicUrlData.publicUrl;
      }
      
      // Prepare data with null for "none" values
      const dataToSubmit = {
        name,
        description,
        interval_months: parseInt(intervalMonths),
        category_id: categoryId === "none" ? null : categoryId,
        responsible_person_id: responsiblePersonId === "none" ? null : responsiblePersonId,
        checklist_url: checklistUrl,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        checks: checks.length > 0 ? JSON.stringify(checks) : null,
      };
      
      if (template?.id) {
        const { error } = await supabase
          .from("maintenance_templates")
          .update(dataToSubmit)
          .eq("id", template.id);
          
        if (error) throw error;
        
        toast({
          title: "Wartungsvorlage aktualisiert",
          description: "Die Wartungsvorlage wurde erfolgreich aktualisiert.",
        });
      } else {
        const { error } = await supabase.from("maintenance_templates").insert(dataToSubmit);
          
        if (error) throw error;
        
        toast({
          title: "Wartungsvorlage erstellt",
          description: "Die Wartungsvorlage wurde erfolgreich erstellt.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["maintenance-templates"] });
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: `Ein Fehler ist aufgetreten: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
      setChecklistUploadProgress(0);
    }
  };

  // Manually update progress to simulate upload progress
  useEffect(() => {
    if (isSubmitting && checklistFile) {
      const interval = setInterval(() => {
        setChecklistUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isSubmitting, checklistFile]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung der Wartungsvorlage..."
        />
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interval_months">Intervall (Monate) <span className="text-red-500">*</span></Label>
          <Input
            id="interval_months"
            name="interval_months"
            type="number"
            min="1"
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="estimated_minutes">Geschätzte Zeit (Minuten)</Label>
          <Input
            id="estimated_minutes"
            name="estimated_minutes"
            type="number"
            min="1"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="Geschätzte Dauer der Wartung"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Kategorie auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Kategorie</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="responsible_person">Verantwortliche Person</Label>
          <Select value={responsiblePersonId} onValueChange={setResponsiblePersonId}>
            <SelectTrigger id="responsible_person">
              <SelectValue placeholder="Person auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Person</SelectItem>
              {persons?.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.first_name} {person.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Durchzuführende Prüfungen</Label>
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={check} readOnly className="flex-grow" />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemoveCheck(index)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Neue Prüfung hinzufügen" 
              value={newCheck}
              onChange={(e) => setNewCheck(e.target.value)}
              className="flex-grow"
            />
            <Button 
              type="button" 
              onClick={handleAddCheck} 
              variant="outline" 
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="checklist">Checkliste (PDF)</Label>
        
        {existingChecklist && !checklistFile && (
          <div className="flex items-center justify-between p-2 border rounded-md">
            <a 
              href={existingChecklist} 
              target="_blank" 
              rel="noreferrer"
              className="text-sm text-blue-500 hover:underline truncate max-w-xs"
            >
              Vorhandene Checkliste anzeigen
            </a>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={handleRemoveExistingChecklist}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {!existingChecklist && !checklistFile && (
          <div className="relative">
            <Input
              id="checklist"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
        )}
        
        {checklistFile && (
          <div className="flex items-center justify-between p-2 border rounded-md">
            <span className="text-sm truncate max-w-xs">
              {checklistFile.name}
            </span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {checklistUploadProgress > 0 && checklistUploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${checklistUploadProgress}%` }}
            >
            </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          Laden Sie eine PDF-Checkliste hoch, die von Wartungspersonal verwendet werden kann.
        </p>
      </div>
      
      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={!name || !intervalMonths || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {template?.id ? "Aktualisiere..." : "Erstelle..."}
          </>
        ) : template?.id ? (
          "Vorlage aktualisieren"
        ) : (
          "Vorlage erstellen"
        )}
      </Button>
    </form>
  );
}
