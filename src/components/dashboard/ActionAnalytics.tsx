import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, FileDown, Search, TrendingUp } from "lucide-react";
import { useEquipmentCommentRecords } from "@/hooks/useEquipmentCommentRecords";
import { usePersons } from "@/hooks/usePersons";
import { useCategories } from "@/hooks/useCategories";
import { format, parseISO, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { de } from "date-fns/locale";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export const ActionAnalytics = () => {
  const { data: actions = [], isLoading } = useEquipmentCommentRecords();
  const { data: persons = [] } = usePersons();
  const { data: categories = [] } = useCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !action.comment.toLowerCase().includes(search) &&
          !action.equipment?.name.toLowerCase().includes(search) &&
          !action.action?.name.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Person filter
      if (personFilter !== "all" && action.person_id !== personFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && action.equipment?.category_id !== categoryFilter) {
        return false;
      }

      // Year filter
      const actionDate = parseISO(action.created_at);
      const yearStart = startOfYear(new Date(parseInt(yearFilter), 0, 1));
      const yearEnd = endOfYear(new Date(parseInt(yearFilter), 0, 1));
      if (!isWithinInterval(actionDate, { start: yearStart, end: yearEnd })) {
        return false;
      }

      return true;
    });
  }, [actions, searchTerm, personFilter, categoryFilter, yearFilter]);

  const statistics = useMemo(() => {
    const actionCounts = new Map<string, number>();
    const personCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    filteredActions.forEach((action) => {
      // Count by action type
      const actionName = action.action?.name || "Ohne Aktion";
      actionCounts.set(actionName, (actionCounts.get(actionName) || 0) + 1);

      // Count by person
      const personName = action.person
        ? `${action.person.first_name} ${action.person.last_name}`
        : "Unbekannt";
      personCounts.set(personName, (personCounts.get(personName) || 0) + 1);

      // Count by category
      if (action.equipment?.category_id) {
        const category = categories.find((c) => c.id === action.equipment?.category_id);
        const categoryName = category?.name || "Unbekannt";
        categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
      }
    });

    return {
      total: filteredActions.length,
      byAction: Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1]),
      byPerson: Array.from(personCounts.entries()).sort((a, b) => b[1] - a[1]),
      byCategory: Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [filteredActions, categories]);

  const exportToExcel = () => {
    const data = filteredActions.map((action) => ({
      Datum: format(parseISO(action.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
      Ausrüstung: action.equipment?.name || "-",
      Inventarnummer: action.equipment?.inventory_number || "-",
      Aktion: action.action?.name || "-",
      Person: action.person
        ? `${action.person.first_name} ${action.person.last_name}`
        : "-",
      Kommentar: action.comment,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aktionsanalyse");

    // Add statistics sheet
    const statsData = [
      ["Gesamtzahl Aktionen", statistics.total],
      [""],
      ["Top 5 Aktionen"],
      ...statistics.byAction.slice(0, 5).map(([name, count]) => [name, count]),
      [""],
      ["Top 5 Personen"],
      ...statistics.byPerson.slice(0, 5).map(([name, count]) => [name, count]),
      [""],
      ["Nach Kategorie"],
      ...statistics.byCategory.map(([name, count]) => [name, count]),
    ];
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "Statistik");

    const fileName = `Aktionsanalyse_${yearFilter}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel-Datei erstellt");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Aktionsanalyse", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      `Zeitraum: ${yearFilter} | Erstellt: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // Statistics
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Statistik", 20, yPosition);
    yPosition += 7;

    const statsData = [
      ["Gesamtzahl Aktionen", statistics.total.toString()],
      ["Zeitraum", yearFilter],
      ["Anzahl Personen", new Set(filteredActions.map((a) => a.person_id)).size.toString()],
      ["Anzahl Ausrüstungen", new Set(filteredActions.map((a) => a.equipment_id)).size.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: statsData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Actions
    if (statistics.byAction.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Top 5 Aktionen", 20, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [["Aktion", "Anzahl"]],
        body: statistics.byAction.slice(0, 5).map(([name, count]) => [name, count.toString()]),
        theme: "striped",
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recent Actions
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Letzte Aktionen", 20, yPosition);
    yPosition += 7;

    const recentActions = filteredActions.slice(0, 20).map((action) => [
      format(parseISO(action.created_at), "dd.MM.yyyy", { locale: de }),
      action.equipment?.name || "-",
      action.equipment?.inventory_number || "-",
      action.action?.name || "-",
      action.person ? `${action.person.first_name} ${action.person.last_name}` : "-",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Datum", "Ausrüstung", "Inv.Nr.", "Aktion", "Person"]],
      body: recentActions,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 40 },
        2: { cellWidth: 22 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
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
        `Aktionsanalyse | Seite ${i} von ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const fileName = `Aktionsanalyse_${yearFilter}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF-Bericht erstellt");
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Aktionsanalyse
          </h2>
          <p className="text-muted-foreground text-sm">
            Übersicht und Statistiken zu durchgeführten Aktionen
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Personen</SelectItem>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Personen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredActions.map((a) => a.person_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ausrüstungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredActions.map((a) => a.equipment_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktionstypen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.byAction.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Actions */}
      {statistics.byAction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.byAction.slice(0, 5).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktionen ({filteredActions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Keine Aktionen gefunden
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Ausrüstung</TableHead>
                    <TableHead>Inventarnummer</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Kommentar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.slice(0, 50).map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(action.created_at), "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </TableCell>
                      <TableCell>{action.equipment?.name || "-"}</TableCell>
                      <TableCell>{action.equipment?.inventory_number || "-"}</TableCell>
                      <TableCell>{action.action?.name || "-"}</TableCell>
                      <TableCell>
                        {action.person
                          ? `${action.person.first_name} ${action.person.last_name}`
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {action.comment}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredActions.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Es werden die ersten 50 von {filteredActions.length} Aktionen angezeigt
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
