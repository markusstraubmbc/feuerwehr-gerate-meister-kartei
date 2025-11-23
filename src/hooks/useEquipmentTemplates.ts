import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EquipmentTemplate {
  id: string;
  name: string;
  vehicle_reference: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateEquipmentItem {
  id: string;
  template_id: string;
  equipment_id: string;
  notes: string | null;
  created_at: string;
  equipment?: {
    id: string;
    name: string;
    category?: { id: string; name: string };
    location?: { id: string; name: string };
  };
}

export const useEquipmentTemplates = () => {
  return useQuery({
    queryKey: ["equipment-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_equipment_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as EquipmentTemplate[];
    },
  });
};

export const useTemplateEquipmentItems = (templateId: string) => {
  return useQuery({
    queryKey: ["template-equipment-items", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_equipment_items")
        .select(`
          *,
          equipment:equipment_id(
            id,
            name,
            category:category_id(id, name),
            location:location_id(id, name)
          )
        `)
        .eq("template_id", templateId)
        .order("created_at");

      if (error) throw error;
      return data as TemplateEquipmentItem[];
    },
    enabled: !!templateId,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: { name: string; vehicle_reference?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("mission_equipment_templates")
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-templates"] });
      toast.success("Vorlage erstellt");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Fehler beim Erstellen der Vorlage");
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("mission_equipment_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-templates"] });
      toast.success("Vorlage gelöscht");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Fehler beim Löschen");
    },
  });
};

export const useAddEquipmentToTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { template_id: string; equipment_id: string; notes?: string }) => {
      const { error } = await supabase
        .from("template_equipment_items")
        .insert(item);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["template-equipment-items", variables.template_id] });
      toast.success("Ausrüstung zur Vorlage hinzugefügt");
    },
    onError: (error) => {
      console.error("Error adding equipment to template:", error);
      toast.error("Fehler beim Hinzufügen");
    },
  });
};

export const useRemoveEquipmentFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, templateId }: { itemId: string; templateId: string }) => {
      const { error } = await supabase
        .from("template_equipment_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return templateId;
    },
    onSuccess: (templateId) => {
      queryClient.invalidateQueries({ queryKey: ["template-equipment-items", templateId] });
      toast.success("Ausrüstung aus Vorlage entfernt");
    },
    onError: (error) => {
      console.error("Error removing equipment from template:", error);
      toast.error("Fehler beim Entfernen");
    },
  });
};
