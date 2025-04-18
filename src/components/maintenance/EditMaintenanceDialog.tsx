import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePersons } from "@/hooks/usePersons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_NONE_VALUE } from "@/lib/constants";

interface EditMaintenanceDialogProps {
  record: MaintenanceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  due_date: z.date({
    required_error: "Fälligkeitsdatum ist erforderlich",
  }),
  performed_by: z.string().optional(),
  minutes_spent: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditMaintenanceDialog({
  record,
  open,
  onOpenChange,
}: EditMaintenanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: persons = [] } = usePersons();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      due_date: new Date(record.due_date),
      performed_by: record.performed_by || undefined,
      minutes_spent: record.minutes_spent || undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("maintenance_records")
        .update({
          due_date: values.due_date.toISOString(),
          performed_by: values.performed_by || null,
          minutes_spent: values.minutes_spent || null,
        })
        .eq("id", record.id);

      if (error) throw error;
      return record.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Wartung erfolgreich aktualisiert");
      onOpenChange(false);
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Fehler beim Aktualisieren der Wartung");
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wartung bearbeiten</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ausrüstung</p>
                <p className="font-medium">{record.equipment.name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Wartungstyp</p>
                <p className="font-medium">{record.template?.name || "Keine Vorlage"}</p>
              </div>

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
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "P", { locale: de })
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
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
                name="performed_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verantwortlich</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || SELECT_NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Person auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_NONE_VALUE}>Keine Zuweisung</SelectItem>
                        {persons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.first_name} {person.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes_spent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer (Minuten)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
