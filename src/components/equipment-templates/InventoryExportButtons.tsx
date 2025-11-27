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

    const excelFileName = `Inventur_${check.template?.name || "Unbekannte_Vorlage"}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, excelFileName);
    toast.success("Excel-Datei erstellt");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Inventurbericht", 20, 20);

    // Info
    doc.setFontSize(12);
    const pdfTemplateName = check?.template?.name || "Unbekannte Vorlage";
    doc.text(`Vorlage: ${pdfTemplateName}`, 20, 35);
    const firstName = check?.checked_by_person?.first_name || "Unbekannt";
    const lastName = check?.checked_by_person?.last_name || "";
    doc.text(`Geprüft von: ${firstName} ${lastName}`, 20, 42);
    const startDate = check?.started_at ? new Date(check.started_at) : new Date();
    doc.text(`Datum: ${format(startDate, "dd.MM.yyyy", { locale: de })}`, 20, 49);
    const statusText = check?.status === "completed" ? "Abgeschlossen" : "In Bearbeitung";
    doc.text(`Status: ${statusText}`, 20, 56);

    // Statistics
    doc.setFontSize(14);
    doc.text("Statistik", 20, 70);

    const present = checkedItems.filter((i) => i.status === "present").length;
    const missing = checkedItems.filter((i) => i.status === "missing").length;
    const replaced = checkedItems.filter((i) => i.status === "replaced").length;
    
    // Find equipment that was added during inventory (not in original template)
    const templateEquipmentIds = templateItems.map(t => t.equipment_id);
    const addedEquipment = checkedItems.filter(
      item => !templateEquipmentIds.includes(item.equipment_id)
    );
    
    const total = templateItems.length;
    const checked = checkedItems.length;

    const statsData = [
      ["Gesamt Positionen (Vorlage)", total.toString()],
      ["Geprüft", checked.toString()],
      ["Vorhanden", present.toString()],
      ["Fehlt", missing.toString()],
      ["Ersetzt", replaced.toString()],
      ["Neu hinzugefügt", addedEquipment.length.toString()],
    ];

    (doc as any).autoTable({
      startY: 75,
      head: [["Kategorie", "Anzahl"]],
      body: statsData,
      margin: { left: 20 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 } },
    });

    // Detailed items overview
    let yPosition = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Detaillierte Übersicht", 20, yPosition);

    const detailedItemsData = checkedItems.map((item) => {
      const statusText = item.status === "present" ? "Vorhanden" : 
                        item.status === "missing" ? "Fehlt" : "Ersetzt";
      const replacementText = item.status === "replaced" && item.replacement_equipment 
        ? item.replacement_equipment.name 
        : "-";
      const isAdded = !templateEquipmentIds.includes(item.equipment_id);
      
      return [
        item.equipment?.name || "Unbekannt",
        item.equipment?.inventory_number || "-",
        item.equipment?.barcode || "-",
        statusText,
        replacementText,
        isAdded ? "Ja" : "-",
        item.notes || "-",
      ];
    });

    (doc as any).autoTable({
      startY: yPosition + 5,
      head: [["Ausrüstung", "Inv.Nr.", "Barcode", "Status", "Ersetzt durch", "Neu", "Notizen"]],
      body: detailedItemsData,
      margin: { left: 20 },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22 },
        4: { cellWidth: 30 },
        5: { cellWidth: 12 },
        6: { cellWidth: 30 },
      },
    });

    // Separate sections for specific statuses
    // Missing items
    if (missing > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38); // red
      doc.text("Fehlende Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);

      const missingData = checkedItems
        .filter((i) => i.status === "missing")
        .map((item) => [
          item.equipment?.name || "Unbekannt",
          item.equipment?.inventory_number || "-",
          item.notes || "-"
        ]);

      (doc as any).autoTable({
        startY: yPosition + 5,
        head: [["Ausrüstung", "Inv.Nr.", "Notizen"]],
        body: missingData,
        margin: { left: 20 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 80 },
        },
      });
    }

    // Replaced items
    if (replaced > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(234, 179, 8); // yellow
      doc.text("Ersetzte Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);

      const replacedData = checkedItems
        .filter((i) => i.status === "replaced")
        .map((item) => [
          item.equipment?.name || "Unbekannt",
          item.equipment?.inventory_number || "-",
          item.replacement_equipment?.name || "-",
          item.replacement_equipment?.inventory_number || "-",
          item.notes || "-"
        ]);

      (doc as any).autoTable({
        startY: yPosition + 5,
        head: [["Alt", "Alt Inv.Nr.", "Neu", "Neu Inv.Nr.", "Notizen"]],
        body: replacedData,
        margin: { left: 20 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
        },
      });
    }

    // Newly added equipment
    if (addedEquipment.length > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94); // green
      doc.text("Neu hinzugefügte Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);

      const addedData = addedEquipment.map((item) => [
        item.equipment?.name || "Unbekannt",
        item.equipment?.inventory_number || "-",
        item.equipment?.barcode || "-",
        item.notes || "-"
      ]);

      (doc as any).autoTable({
        startY: yPosition + 5,
        head: [["Ausrüstung", "Inv.Nr.", "Barcode", "Notizen"]],
        body: addedData,
        margin: { left: 20 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 55 },
        },
      });
    }

    const pdfFileName = `Inventurbericht_${check?.template?.name?.replace(/[^a-zA-Z0-9]/g, '_') || "Unbekannte_Vorlage"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(pdfFileName);
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
