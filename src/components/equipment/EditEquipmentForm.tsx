import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { usePersons } from "@/hooks/usePersons";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/hooks/useEquipment";
import { useState } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { SELECT_NONE_VALUE } from "@/lib/constants";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Der Name muss mindestens 2 Zeichen lang sein.",
  }),
  category_id: z.string().nullable(),
  location_id: z.string().nullable(),
  responsible_person_id: z.string().nullable(),
  inventory_number: z.string().nullable(),
  serial_number: z.string().nullable(),
  barcode: z.string().nullable(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  status: z.enum(["einsatzbereit", "wartung", "defekt", "prüfung fällig"]),
  purchase_date: z.date().nullable(),
  replacement_date: z.date().nullable(),
  last_check_date: z.date().nullable(),
  next_check_date: z.date().nullable(),
  notes: z.string().nullable(),
});

interface Props {
  equipment: Equipment;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditEquipmentForm({ equipment, onSuccess }: Props) {
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const { data: persons } = usePersons();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment.name,
      category_id: equipment.category_id || null,
      location_id: equipment.location_id || null,
      responsible_person_id: equipment.responsible_person_id || null,
      inventory_number: equipment.inventory_number || null,
      serial_number: equipment.serial_number || null,
      barcode: equipment.barcode || null,
      manufacturer: equipment.manufacturer || null,
      model: equipment.model || null,
      status: equipment.status as "einsatzbereit" | "wartung" | "defekt" | "prüfung fällig",
      purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date) : null,
      replacement_date: equipment.replacement_date ? new Date(equipment.replacement_date) : null,
      last_check_date: equipment.last_check_date ? new Date(equipment.last_check_date) : null,
      next_check_date: equipment.next_check_date ? new Date(equipment.next_check_date) : null,
      notes: equipment.notes || null,
    },
  });

  useEffect(() => {
    form.reset({
      name: equipment.name,
      category_id: equipment.category_id || null,
      location_id: equipment.location_id || null,
      responsible_person_id: equipment.responsible_person_id || null,
      inventory_number: equipment.inventory_number || null,
      serial_number: equipment.serial_number || null,
      barcode: equipment.barcode || null,
      manufacturer: equipment.manufacturer || null,
      model: equipment.model || null,
      status: equipment.status as "einsatzbereit" | "wartung" | "defekt" | "prüfung fällig",
      purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date) : null,
      replacement_date: equipment.replacement_date ? new Date(equipment.replacement_date) : null,
      last_check_date: equipment.last_check_date ? new Date(equipment.last_check_date) : null,
      next_check_date: equipment.next_check_date ? new Date(equipment.next_check_date) : null,
      notes: equipment.notes || null,
    });
  }, [equipment, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      // Convert Date objects to ISO strings for the API
      const formattedValues = {
        ...values,
        purchase_date: values.purchase_date?.toISOString() || null,
        replacement_date: values.replacement_date?.toISOString() || null,
        last_check_date: values.last_check_date?.toISOString() || null,
        next_check_date: values.next_check_date?.toISOString() || null
      };

      const { error } = await supabase
        .from("equipment")
        .update(formattedValues)
        .eq("id", equipment.id);

      if (error) {
        toast("Es gab ein Problem beim Aktualisieren des Geräts.");
      } else {
        toast("Das Gerät wurde erfolgreich aktualisiert.");
        onSuccess();
      }
    } catch (error) {
      toast("Es gab ein unerwartetes Problem.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ausrüstungsdetails</CardTitle>
            <CardDescription>
              Bearbeiten Sie die Details der Ausrüstung.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name der Ausrüstung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || SELECT_NONE_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_NONE_VALUE}>Keine Kategorie</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standort</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || SELECT_NONE_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Standort auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_NONE_VALUE}>Kein Standort</SelectItem>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible_person_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verantwortliche Person</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || SELECT_NONE_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Person auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SELECT_NONE_VALUE}>Keine Person</SelectItem>
                        {persons?.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {`${person.first_name} ${person.last_name}`}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="einsatzbereit">Einsatzbereit</SelectItem>
                        <SelectItem value="wartung">Wartung</SelectItem>
                        <SelectItem value="defekt">Defekt</SelectItem>
                        <SelectItem value="prüfung fällig">Prüfung fällig</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventar Details</CardTitle>
            <CardDescription>
              Fügen Sie zusätzliche Inventarinformationen hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inventory_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventarnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Inventarnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seriennummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Seriennummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hersteller</FormLabel>
                    <FormControl>
                      <Input placeholder="Hersteller" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modell</FormLabel>
                  <FormControl>
                    <Input placeholder="Modell" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datum Details</CardTitle>
            <CardDescription>
              Fügen Sie wichtige Daten für die Ausrüstung hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Kaufdatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-[240px] pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Kaufdatum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="replacement_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ersatzdatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-[240px] pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Ersatzdatum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="last_check_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Letztes Checkdatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-[240px] pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Letztes Checkdatum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="next_check_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nächstes Checkdatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-[240px] pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Nächstes Checkdatum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
            <CardDescription>
              Fügen Sie zusätzliche Notizen zur Ausrüstung hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Notizen zur Ausrüstung"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <CardFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Ausrüstung löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Bist du dir wirklich sicher?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten
                  im Zusammenhang mit dieser Ausrüstung werden dauerhaft
                  gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction>
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                Speichern...
                <svg className="animate-spin h-5 w-5 ml-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : (
              "Ausrüstung speichern"
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
