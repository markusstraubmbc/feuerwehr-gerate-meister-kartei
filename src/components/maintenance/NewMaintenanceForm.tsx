
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

import { useEquipment } from "@/hooks/useEquipment";
import { useMaintenanceTemplates } from "@/hooks/useMaintenanceTemplates";
import { usePersons } from "@/hooks/usePersons";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  equipment_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  status: z.enum(["ausstehend", "geplant", "in_bearbeitung", "abgeschlossen"]).default("ausstehend"),
  due_date: z.date(),
  performed_date: z.date().optional(),
  performed_by: z.string().uuid().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewMaintenanceFormProps {
  onSuccess: () => void;
}

export function NewMaintenanceForm({ onSuccess }: NewMaintenanceFormProps) {
  const queryClient = useQueryClient();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();
  const { data: templates, isLoading: templatesLoading } = useMaintenanceTemplates();
  const { data: persons, isLoading: personsLoading } = usePersons();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "ausstehend",
      due_date: new Date(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Konvertiere Datumsfelder zu ISO-Strings für Supabase
      const formattedValues = {
        ...values,
        due_date: values.due_date.toISOString(),
        performed_date: values.performed_date ? values.performed_date.toISOString() : null,
      };
      
      const { error } = await supabase.from("maintenance_records").insert(formattedValues);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Wartung erfolgreich angelegt");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Fehler beim Anlegen der Wartung");
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  if (equipmentLoading || templatesLoading || personsLoading) {
    return <div>Daten werden geladen...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-2">
        <FormField
          control={form.control}
          name="equipment_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ausrüstung</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Ausrüstung auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipment?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="template_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Wartungsvorlage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wartungsvorlage auswählen (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fällig am</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "dd.MM.yyyy", { locale: de })
                      ) : (
                        <span>Datum auswählen</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ausstehend">Ausstehend</SelectItem>
                  <SelectItem value="geplant">Geplant</SelectItem>
                  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="performed_by"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Durchgeführt von</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Person auswählen (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {persons?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>{`${person.first_name} ${person.last_name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="performed_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Durchgeführt am</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "dd.MM.yyyy", { locale: de })
                      ) : (
                        <span>Datum auswählen (optional)</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={(date) => field.onChange(date)}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notizen zur Wartung (optional)"
                  {...field}
                />
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
            {createMutation.isPending ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
