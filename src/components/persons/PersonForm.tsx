
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

const formSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich").optional().or(z.literal("")),
  phone: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface PersonFormProps {
  initialData: { id: string; first_name: string; last_name: string; email?: string; phone?: string } | null;
  onSuccess: () => void;
}

export function PersonForm({ initialData, onSuccess }: PersonFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const defaultValues = {
    first_name: initialData?.first_name || "",
    last_name: initialData?.last_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || ""
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure required fields are explicitly included
      const formattedValues = {
        first_name: values.first_name, // Required field
        last_name: values.last_name,   // Required field
        email: values.email || null,
        phone: values.phone || null
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("persons")
          .update(formattedValues)
          .eq("id", initialData!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("persons").insert(formattedValues);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success(isEditMode ? "Person erfolgreich aktualisiert" : "Person erfolgreich erstellt");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error(isEditMode ? "Fehler beim Aktualisieren der Person" : "Fehler beim Erstellen der Person");
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
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vorname *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nachname *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefonnummer</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
