
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { usePersons } from "@/hooks/usePersons";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useEquipment } from "@/hooks/useEquipment";

const formSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  inventory_number: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(["einsatzbereit", "wartung", "defekt", "prüfung fällig"]).default("einsatzbereit"),
  barcode: z.string().min(1, "Barcode ist erforderlich"),
  serial_number: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.date().optional(),
  replacement_date: z.date().optional(),
  location_id: z.string().uuid().optional(),
  responsible_person_id: z.string().uuid().optional(),
  last_check_date: z.date().optional(),
  next_check_date: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewEquipmentFormProps {
  onSuccess: () => void;
}

export function NewEquipmentForm({ onSuccess }: NewEquipmentFormProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const { data: persons } = usePersons();
  const { data: existingEquipment } = useEquipment();
  
  const [manufacturerSuggestions, setManufacturerSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [nextInventoryNumber, setNextInventoryNumber] = useState<string>("");

  useEffect(() => {
    if (existingEquipment && existingEquipment.length > 0) {
      // Extract unique manufacturer and model names
      const manufacturers = [...new Set(existingEquipment
        .filter(item => item.manufacturer)
        .map(item => item.manufacturer as string))];
        
      const models = [...new Set(existingEquipment
        .filter(item => item.model)
        .map(item => item.model as string))];
        
      setManufacturerSuggestions(manufacturers);
      setModelSuggestions(models);
      
      // Generate next inventory number
      const inventoryNumbers = existingEquipment
        .filter(item => item.inventory_number && /^\d+$/.test(item.inventory_number))
        .map(item => parseInt(item.inventory_number as string, 10))
        .sort((a, b) => b - a);
        
      if (inventoryNumbers.length > 0) {
        const nextNumber = (inventoryNumbers[0] + 1).toString().padStart(5, '0');
        setNextInventoryNumber(nextNumber);
        form.setValue("inventory_number", nextNumber);
      } else {
        setNextInventoryNumber("00001");
        form.setValue("inventory_number", "00001");
      }
    }
  }, [existingEquipment]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "einsatzbereit",
      barcode: "",
      name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure required fields are present and properly typed
      const formattedValues = {
        name: values.name, // Explicitly include required field
        barcode: values.barcode || "", // Explicitly include required field with fallback
        status: values.status,
        inventory_number: values.inventory_number || null,
        category_id: values.category_id || null,
        serial_number: values.serial_number || null,
        manufacturer: values.manufacturer || null,
        model: values.model || null,
        purchase_date: values.purchase_date?.toISOString().split('T')[0] || null,
        replacement_date: values.replacement_date?.toISOString().split('T')[0] || null,
        location_id: values.location_id || null,
        responsible_person_id: values.responsible_person_id || null,
        last_check_date: values.last_check_date?.toISOString() || null,
        next_check_date: values.next_check_date?.toISOString() || null,
        notes: values.notes || null,
      };
      
      const { error } = await supabase.from("equipment").insert(formattedValues);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Ausrüstung erfolgreich angelegt");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Fehler beim Anlegen der Ausrüstung");
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            name="inventory_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inventarnummer</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={nextInventoryNumber} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="einsatzbereit">Einsatzbereit</SelectItem>
                    <SelectItem value="wartung">In Wartung</SelectItem>
                    <SelectItem value="defekt">Defekt</SelectItem>
                    <SelectItem value="prüfung fällig">Prüfung fällig</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode *</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
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
                <div className="relative">
                  <Input 
                    {...field} 
                    list="manufacturer-suggestions" 
                  />
                  <datalist id="manufacturer-suggestions">
                    {manufacturerSuggestions.map((manufacturer, idx) => (
                      <option key={idx} value={manufacturer} />
                    ))}
                  </datalist>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modell</FormLabel>
                <div className="relative">
                  <Input 
                    {...field} 
                    list="model-suggestions" 
                  />
                  <datalist id="model-suggestions">
                    {modelSuggestions.map((model, idx) => (
                      <option key={idx} value={model} />
                    ))}
                  </datalist>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      className="p-3 pointer-events-auto"
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
                <FormLabel>Ersetzungsdatum</FormLabel>
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
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Standort auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

          <FormField
            control={form.control}
            name="responsible_person_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verantwortliche Person</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Person auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="last_check_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Letzte Prüfung</FormLabel>
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
                      className="p-3 pointer-events-auto"
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
                <FormLabel>Nächste Prüfung</FormLabel>
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
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notizen</FormLabel>
              <FormControl>
                <Textarea value={field.value || ""} onChange={field.onChange} />
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
