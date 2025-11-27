import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { usePersons } from "@/hooks/usePersons";
import { AddCommentForm } from "@/components/equipment/AddCommentForm";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusOptions = [
  { value: "all", label: "Alle Status" },
  { value: "einsatzbereit", label: "Einsatzbereit" },
  { value: "defekt", label: "Defekt" },
  { value: "prüfung fällig", label: "Prüfung fällig" },
  { value: "wartung", label: "Wartung" },
];

const ActionsCenter = () => {
  const { data: equipment = [], isLoading, error } = useEquipment();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { data: persons = [] } = usePersons();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const filteredEquipment = equipment.filter((item) => {
    if (
      searchTerm &&
      !(
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }

    if (categoryFilter !== "all" && item.category_id !== categoryFilter) {
      return false;
    }

    if (locationFilter !== "all" && item.location_id !== locationFilter) {
      return false;
    }

    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const toggleSelectEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredEquipment.map((item) => item.id);
    const allSelected = filteredIds.every((id) => selectedEquipmentIds.includes(id));

    setSelectedEquipmentIds(allSelected ? [] : filteredIds);
  };

  const handleBulkActionSubmit = async (
    comment: string,
    personId: string,
    actionId?: string
  ): Promise<boolean> => {
    if (selectedEquipmentIds.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Ausrüstung aus");
      return false;
    }

    try {
      setIsSubmitting(true);

      for (const equipmentId of selectedEquipmentIds) {
        const { error } = await supabase.rpc("add_equipment_comment", {
          equipment_id_param: equipmentId,
          person_id_param: personId,
          comment_param: comment.trim(),
          action_id_param: actionId || null,
        });

        if (error) {
          console.error("Error adding bulk action:", error);
          toast.error("Fehler beim Hinzufügen der Aktion");
          return false;
        }
      }

      toast.success("Aktion für ausgewählte Ausrüstungen hinzugefügt");
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      return true;
    } catch (error) {
      console.error("Error adding bulk action:", error);
      toast.error("Fehler beim Hinzufügen der Aktion");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aktionsbereich</h1>
          <p className="text-muted-foreground text-sm">
            Führen Sie Aktionen schnell für mehrere Ausrüstungen gleichzeitig durch.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedEquipmentIds.length} Ausrüstung(en) ausgewählt
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ausrüstung auswählen</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ausrüstung, Inventarnummer oder Barcode suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilter}
              onValueChange={(value) => setLocationFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Standorte</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEquipment.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Keine Ausrüstung gefunden
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          filteredEquipment.length > 0 &&
                          filteredEquipment.every((item) =>
                            selectedEquipmentIds.includes(item.id)
                          )
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Alle auswählen"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Inventarnummer</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEquipmentIds.includes(item.id)}
                          onCheckedChange={() => toggleSelectEquipment(item.id)}
                          aria-label={`Ausrüstung ${item.name} auswählen`}
                        />
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.inventory_number || "-"}</TableCell>
                      <TableCell>{item.category?.name || "-"}</TableCell>
                      <TableCell>{item.location?.name || "-"}</TableCell>
                      <TableCell className="capitalize">{item.status}</TableCell>
                    </TableCell>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktion auf ausgewählte Ausrüstungen anwenden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Wählen Sie oben die gewünschten Ausrüstungen und legen Sie hier die
            Aktion, Person und Beschreibung fest. Die Aktion wird für alle
            ausgewählten Ausrüstungen erstellt.
          </p>
          <AddCommentForm onSubmit={handleBulkActionSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionsCenter;
