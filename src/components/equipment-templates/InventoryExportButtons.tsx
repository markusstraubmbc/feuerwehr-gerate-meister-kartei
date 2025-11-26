import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface InventoryExportButtonsProps {
  checkId: string;
  check: any;
  checkedItems: any[];
  templateItems: any[];
}

export function InventoryExportButtons({
  checkId,
  check,
  checkedItems,
  templateItems,
}: InventoryExportButtonsProps) {
  const exportToExcel = () => {
    const data = checkedItems.map((item) => ({
      "Ausrüstung": item.equipment?.name || "Unbekannt",
      "Inventarnummer": item.equipment?.inventory_number || "-",
      "Kategorie": item.equipment?.category?.name || "-",
      "Standort": item.equipment?.location?.name || "-",
      "Status": item.status === "present" ? "Vorhanden" : item.status === "missing" ? "Fehlt" : "Ersetzt",
      "Ersetzt durch": item.replacement_equipment?.name || "-",
      "Notizen": item.notes || "-",
      "Geprüft am": format(new Date(item.checked_at), "dd.MM.yyyy HH:mm", { locale: de }),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventur");

    const fileName = `Inventur_${check.template.name}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel-Datei erstellt");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Inventurbericht", 20, 20);

    // Info
    doc.setFontSize(12);
    doc.text(`Vorlage: ${check.template.name}`, 20, 35);
    doc.text(
      `Geprüft von: ${check.checked_by_person?.first_name} ${check.checked_by_person?.last_name}`,
      20,
      42
    );
    doc.text(`Datum: ${format(new Date(check.started_at), "dd.MM.yyyy", { locale: de })}`, 20, 49);
    doc.text(`Status: ${check.status === "completed" ? "Abgeschlossen" : "In Bearbeitung"}`, 20, 56);

    // Statistics
    doc.setFontSize(14);
    doc.text("Statistik", 20, 70);

    const present = checkedItems.filter((i) => i.status === "present").length;
    const missing = checkedItems.filter((i) => i.status === "missing").length;
    const replaced = checkedItems.filter((i) => i.status === "replaced").length;
    const total = templateItems.length;
    const checked = checkedItems.length;

    const statsData = [
      ["Gesamt Positionen", total.toString()],
      ["Geprüft", checked.toString()],
      ["Vorhanden", present.toString()],
      ["Fehlt", missing.toString()],
      ["Ersetzt", replaced.toString()],
    ];

    (doc as any).autoTable({
      startY: 75,
      head: [["Kategorie", "Anzahl"]],
      body: statsData,
      margin: { left: 20 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 } },
    });

    // Items table
    let yPosition = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Geprüfte Positionen", 20, yPosition);

    const itemsData = checkedItems.map((item) => [
      item.equipment?.name || "Unbekannt",
      item.equipment?.inventory_number || "-",
      item.status === "present" ? "Vorhanden" : item.status === "missing" ? "Fehlt" : "Ersetzt",
      item.replacement_equipment?.name || "-",
      item.notes || "-",
    ]);

    (doc as any).autoTable({
      startY: yPosition + 5,
      head: [["Ausrüstung", "Inv.Nr.", "Status", "Ersetzt durch", "Notizen"]],
      body: itemsData,
      margin: { left: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 45 },
      },
    });

    // Missing items
    if (missing > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text("Fehlende Positionen", 20, yPosition);
      doc.setTextColor(0, 0, 0);

      const missingData = checkedItems
        .filter((i) => i.status === "missing")
        .map((item) => [item.equipment?.name || "Unbekannt", item.notes || "-"]);

      (doc as any).autoTable({
        startY: yPosition + 5,
        head: [["Ausrüstung", "Notizen"]],
        body: missingData,
        margin: { left: 20 },
        styles: { fontSize: 9 },
      });
    }

    const fileName = `Inventurbericht_${check.template.name}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF-Bericht erstellt");
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel Export
      </Button>
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <FileDown className="h-4 w-4 mr-2" />
        PDF Bericht
      </Button>
    </div>
  );
}
