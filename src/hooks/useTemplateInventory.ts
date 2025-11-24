import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InventoryCheck = Database["public"]["Tables"]["template_inventory_checks"]["Row"] & {
  template: Database["public"]["Tables"]["mission_equipment_templates"]["Row"];
  checked_by_person: Database["public"]["Tables"]["persons"]["Row"] | null;
};

type InventoryCheckItem = Database["public"]["Tables"]["inventory_check_items"]["Row"] & {
  equipment: Database["public"]["Tables"]["equipment"]["Row"];
  replacement_equipment: Database["public"]["Tables"]["equipment"]["Row"] | null;
};

export const useTemplateInventoryChecks = () => {
  return useQuery({
    queryKey: ["template-inventory-checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_inventory_checks")
        .select(`
          *,
          template:template_id (*),
          checked_by_person:checked_by (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InventoryCheck[];
    },
  });
};

export const useInventoryCheckItems = (checkId: string) => {
  return useQuery({
    queryKey: ["inventory-check-items", checkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_check_items")
        .select(`
          *,
          equipment!inventory_check_items_equipment_id_fkey (*),
          replacement_equipment:equipment!inventory_check_items_replacement_equipment_id_fkey (*)
        `)
        .eq("inventory_check_id", checkId)
        .order("checked_at", { ascending: false });

      if (error) throw error;
      return data as InventoryCheckItem[];
    },
    enabled: !!checkId,
  });
};

export const useCreateInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      template_id: string;
      checked_by: string;
      notes?: string;
    }) => {
      const { data: check, error } = await supabase
        .from("template_inventory_checks")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return check;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-inventory-checks"] });
    },
  });
};

export const useUpdateInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: "in_progress" | "completed" | "cancelled";
      completed_at?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("template_inventory_checks")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-inventory-checks"] });
    },
  });
};

export const useCreateInventoryCheckItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inventory_check_id: string;
      equipment_id: string;
      status: "present" | "missing" | "replaced";
      replacement_equipment_id?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("inventory_check_items")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["inventory-check-items", variables.inventory_check_id] 
      });
    },
  });
};

export const useUpdateInventoryCheckItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      inventory_check_id,
      ...data
    }: {
      id: string;
      inventory_check_id: string;
      status?: "present" | "missing" | "replaced";
      replacement_equipment_id?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("inventory_check_items")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["inventory-check-items", variables.inventory_check_id] 
      });
    },
  });
};
