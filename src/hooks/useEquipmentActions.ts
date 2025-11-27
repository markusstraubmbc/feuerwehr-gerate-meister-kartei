import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type EquipmentAction = Database["public"]["Tables"]["equipment_actions"]["Row"];

export const useEquipmentActions = () => {
  return useQuery({
    queryKey: ["equipment-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_actions")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as EquipmentAction[];
    },
  });
};

export const useCreateAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { error } = await supabase
        .from("equipment_actions")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-actions"] });
      toast.success("Aktion erfolgreich erstellt");
    },
    onError: () => {
      toast.error("Fehler beim Erstellen der Aktion");
    },
  });
};

export const useUpdateAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string }) => {
      const { error } = await supabase
        .from("equipment_actions")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-actions"] });
      toast.success("Aktion erfolgreich aktualisiert");
    },
    onError: () => {
      toast.error("Fehler beim Aktualisieren der Aktion");
    },
  });
};

export const useDeleteAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment_actions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-actions"] });
      toast.success("Aktion erfolgreich gelöscht");
    },
    onError: () => {
      toast.error("Fehler beim Löschen der Aktion");
    },
  });
};
