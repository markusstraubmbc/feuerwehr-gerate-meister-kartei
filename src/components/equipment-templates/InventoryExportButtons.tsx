import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, FileCheck } from "lucide-react";
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

  const exportCompletionReport = () => {
    // Calculate statistics
    const present = checkedItems.filter((i) => i.status === "present").length;
    const missing = checkedItems.filter((i) => i.status === "missing").length;
    const replaced = checkedItems.filter((i) => i.status === "replaced").length;
    const templateEquipmentIds = templateItems.map(t => t.equipment_id);
    const addedEquipment = checkedItems.filter(
      item => !templateEquipmentIds.includes(item.equipment_id)
    );
    const total = templateItems.length;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header with Date
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("Inventurabschluss-Bericht", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Datum: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Template and Person Info
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Inventur-Informationen", 20, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const infoData = [
      ['Vorlage', check?.template?.name || 'Unbekannte Vorlage'],
      ['Geprüft von', check?.checked_by_person ? `${check.checked_by_person.first_name} ${check.checked_by_person.last_name}` : 'Unbekannt'],
      ['Begonnen am', check?.started_at ? format(new Date(check.started_at), "dd.MM.yyyy HH:mm", { locale: de }) : '-'],
      ['Abgeschlossen am', check?.completed_at ? format(new Date(check.completed_at), "dd.MM.yyyy HH:mm", { locale: de }) : format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })],
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [],
      body: infoData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Statistics
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Zusammenfassung", 20, yPosition);
    yPosition += 7;

    const statsData = [
      ["Gesamt Positionen (Vorlage)", total.toString()],
      ["Vorhanden", present.toString()],
      ["Fehlt", missing.toString()],
      ["Ersetzt", replaced.toString()],
      ["Neu hinzugefügt", addedEquipment.length.toString()],
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [["Kategorie", "Anzahl"]],
      body: statsData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 
        0: { cellWidth: 80, fontStyle: 'bold' }, 
        1: { cellWidth: 40, halign: 'right' } 
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Overview
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Detaillierte Übersicht", 20, yPosition);
    yPosition += 7;

    const detailedData = checkedItems.map((item) => {
      const statusText = item.status === "present" ? "Vorhanden" : 
                        item.status === "missing" ? "Fehlt" : "Ersetzt";
      const isAdded = !templateEquipmentIds.includes(item.equipment_id);
      
      return [
        item.equipment?.name || "Unbekannt",
        item.equipment?.inventory_number || "-",
        statusText,
        isAdded ? "Ja" : "-",
        item.notes || "-"
      ];
    });

    (doc as any).autoTable({
      startY: yPosition,
      head: [["Ausrüstung", "Inv.Nr.", "Status", "Neu", "Notizen"]],
      body: detailedData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 55 }
      },
      margin: { left: 20, right: 20 }
    });

    // Signature Section
    yPosition = (doc as any).lastAutoTable.finalY + 25;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Unterschrift:", 20, yPosition);
    yPosition += 15;

    // Signature line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 100, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const personName = check?.checked_by_person 
      ? `${check.checked_by_person.first_name} ${check.checked_by_person.last_name}`
      : 'Unbekannt';
    doc.text(personName, 20, yPosition);
    yPosition += 3;
    doc.text(`Datum: ${format(new Date(), "dd.MM.yyyy", { locale: de })}`, 20, yPosition);

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Inventurabschluss-Bericht | Seite ${i} von ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const fileName = `Inventurabschluss_${check?.template?.name?.replace(/[^a-zA-Z0-9]/g, '_') || "Vorlage"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("Inventurabschluss-Bericht erstellt");
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <FileDown className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportCompletionReport}>
        <FileCheck className="h-4 w-4 mr-2" />
        Abschlussbericht
      </Button>
    </div>
  );
}
