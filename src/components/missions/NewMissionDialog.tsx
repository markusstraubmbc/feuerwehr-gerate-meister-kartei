
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const missionSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  mission_type: z.enum(["einsatz", "übung"]),
  mission_date: z.date({ required_error: "Datum ist erforderlich" }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  responsible_persons: z.string().optional(),
  vehicles: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

interface NewMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewMissionDialog = ({ open, onOpenChange }: NewMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      title: "",
      description: "",
      mission_type: "übung",
      location: "",
      start_time: "",
      end_time: "",
      responsible_persons: "",
      vehicles: "",
    },
  });

  const onSubmit = async (data: MissionFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("missions")
        .insert({
          title: data.title,
          description: data.description,
          mission_type: data.mission_type,
          mission_date: format(data.mission_date, 'yyyy-MM-dd'),
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          location: data.location || null,
          responsible_persons: data.responsible_persons || null,
          vehicles: data.vehicles || null,
        });

      if (error) throw error;

      toast.success(`${data.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'} erfolgreich erstellt`);
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating mission:', error);
      toast.error("Fehler beim Erstellen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuer Einsatz / Übung</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel *</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Brandeinsatz Hauptstraße" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="einsatz">Einsatz</SelectItem>
                        <SelectItem value="übung">Übung</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details zum Einsatz/Übung..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mission_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Datum wählen</span>
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
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startzeit</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endzeit</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ort</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Hauptstraße 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="responsible_persons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verantwortliche Person(en)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Max Mustermann, Jane Doe..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            <FormField
                control={form.control}
                name="vehicles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fahrzeuge</FormLabel>
                    <FormControl>
                      <Textarea placeholder="HLF 20, ELW 1..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
