import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSpreadsheet, FileDown, Info } from "lucide-react";
import { useEquipment } from "@/hooks/useEquipment";
import { useCategories } from "@/hooks/useCategories";
import { useLocations } from "@/hooks/useLocations";
import { usePersons } from "@/hooks/usePersons";
import { AddCommentForm } from "@/components/equipment/AddCommentForm";
import { EquipmentOverviewDialog } from "@/components/equipment/EquipmentOverviewDialog";
import { ActionAnalytics } from "@/components/dashboard/ActionAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Equipment } from "@/hooks/useEquipment";

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
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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
      setSelectedEquipmentIds([]);
      return true;
    } catch (error) {
      console.error("Error adding bulk action:", error);
      toast.error("Fehler beim Hinzufügen der Aktion");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedEquipmentIds.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Ausrüstung aus");
      return;
    }

    const selectedEquipment = equipment.filter((item) =>
      selectedEquipmentIds.includes(item.id)
    );

    const data = selectedEquipment.map((item) => ({
      Name: item.name,
      Inventarnummer: item.inventory_number || "-",
      Barcode: item.barcode || "-",
      Kategorie: item.category?.name || "-",
      Standort: item.location?.name || "-",
      Status: item.status,
      Hersteller: item.manufacturer || "-",
      Modell: item.model || "-",
      Seriennummer: item.serial_number || "-",
      Verantwortlich:
        item.responsible_person
          ? `${item.responsible_person.first_name} ${item.responsible_person.last_name}`
          : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ausgewählte Ausrüstung");

    const fileName = `Ausruestung_Auswahl_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel-Datei erstellt");
  };

  const exportSelectedToPDF = () => {
    if (selectedEquipmentIds.length === 0) {
      toast.error("Bitte wählen Sie mindestens eine Ausrüstung aus");
      return;
    }

    const selectedEquipment = equipment.filter((item) =>
      selectedEquipmentIds.includes(item.id)
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Ausgewählte Ausrüstung - Bericht", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      `Datum: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // Summary
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Zusammenfassung", 20, yPosition);
    yPosition += 7;

    const summaryData = [
      ["Anzahl ausgewählter Ausrüstungen", selectedEquipment.length.toString()],
      [
        "Kategorien",
        [
          ...new Set(
            selectedEquipment
              .map((item) => item.category?.name)
              .filter(Boolean)
          ),
        ].join(", ") || "-",
      ],
      [
        "Standorte",
        [
          ...new Set(
            selectedEquipment
              .map((item) => item.location?.name)
              .filter(Boolean)
          ),
        ].join(", ") || "-",
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: summaryData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Equipment Details
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Ausrüstungsdetails", 20, yPosition);
    yPosition += 7;

    const equipmentData = selectedEquipment.map((item) => [
      item.name,
      item.inventory_number || "-",
      item.barcode || "-",
      item.category?.name || "-",
      item.location?.name || "-",
      item.status,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Name", "Inv.Nr.", "Barcode", "Kategorie", "Standort", "Status"]],
      body: equipmentData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 },
      },
      margin: { left: 20, right: 20 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(
        `Ausrüstungsbericht | Seite ${i} von ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const fileName = `Ausruestung_Auswahl_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF-Bericht erstellt");
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Ausrüstung</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktionsbereich</h1>
        <p className="text-muted-foreground text-sm">
          Führen Sie Aktionen für mehrere Ausrüstungen durch und analysieren Sie durchgeführte Aktionen.
        </p>
      </div>

      <Tabs defaultValue="actions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="actions">Sammelaktionen</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedEquipmentIds.length} Ausrüstung(en) ausgewählt
              </div>
              {selectedEquipmentIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSelectedToExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSelectedToPDF}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
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
                        <TableHead className="w-[50px]"></TableHead>
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
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEquipment(item)}
                              aria-label={`Details zu ${item.name} anzeigen`}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
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
        </TabsContent>

        <TabsContent value="analytics">
          <ActionAnalytics />
        </TabsContent>
      </Tabs>

      {selectedEquipment && (
        <EquipmentOverviewDialog
          equipment={selectedEquipment}
          open={!!selectedEquipment}
          onOpenChange={(open) => !open && setSelectedEquipment(null)}
        />
      )}
    </div>
  );
};

export default ActionsCenter;
