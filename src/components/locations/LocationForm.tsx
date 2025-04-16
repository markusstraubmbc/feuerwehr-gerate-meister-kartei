
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LocationFormProps {
  initialData?: { id: string; name: string; description?: string } | null;
  onSuccess: () => void;
}

export function LocationForm({ initialData, onSuccess }: LocationFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        // Update
        const { error } = await supabase
          .from("locations")
          .update(values)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        // Create - ensure name is provided
        const { error } = await supabase.from("locations").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success(
        isEditing
          ? "Standort erfolgreich aktualisiert"
          : "Standort erfolgreich angelegt"
      );
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        isEditing
          ? "Fehler beim Aktualisieren des Standorts"
          : "Fehler beim Anlegen des Standorts"
      );
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending
              ? isEditing
                ? "Speichern..."
                : "Erstellen..."
              : isEditing
              ? "Speichern"
              : "Erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
