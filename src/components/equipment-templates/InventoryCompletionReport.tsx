import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface InventoryCompletionReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: any;
  checkedItems: any[];
  templateItems: any[];
}

export function InventoryCompletionReport({
  open,
  onOpenChange,
  check,
  checkedItems,
  templateItems,
}: InventoryCompletionReportProps) {
  
  const generateCompletionPdf = () => {
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

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: infoData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Statistics
    const present = checkedItems.filter((i) => i.status === "present").length;
    const missing = checkedItems.filter((i) => i.status === "missing").length;
    const replaced = checkedItems.filter((i) => i.status === "replaced").length;
    
    const templateEquipmentIds = templateItems.map(t => t.equipment_id);
    const addedEquipment = checkedItems.filter(
      item => !templateEquipmentIds.includes(item.equipment_id)
    );
    
    const total = templateItems.length;

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

    autoTable(doc, {
      startY: yPosition,
      head: [["Kategorie", "Anzahl"]],
      body: statsData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 20, right: 20 },
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

    autoTable(doc, {
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
        4: { cellWidth: 55 },
      },
      margin: { left: 20, right: 20 },
    });

    // Missing Items Section (if any)
    if (missing > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text("Fehlende Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 7;

      const missingData = checkedItems
        .filter((i) => i.status === "missing")
        .map((item) => [
          item.equipment?.name || "Unbekannt",
          item.equipment?.inventory_number || "-",
          item.notes || "-"
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Ausrüstung", "Inv.Nr.", "Notizen"]],
        body: missingData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 80 },
        },
        margin: { left: 20, right: 20 },
      });
    }

    // Replaced Items Section (if any)
    if (replaced > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(234, 179, 8);
      doc.text("Ersetzte Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 7;

      const replacedData = checkedItems
        .filter((i) => i.status === "replaced")
        .map((item) => [
          item.equipment?.name || "Unbekannt",
          item.equipment?.inventory_number || "-",
          item.replacement_equipment?.name || "-",
          item.replacement_equipment?.inventory_number || "-",
          item.notes || "-"
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Alt", "Alt Inv.Nr.", "Neu", "Neu Inv.Nr.", "Notizen"]],
        body: replacedData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
        },
        margin: { left: 20, right: 20 },
      });
    }

    // Newly Added Items Section (if any)
    if (addedEquipment.length > 0) {
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text("Neu hinzugefügte Ausrüstung", 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 7;

      const addedData = addedEquipment.map((item) => [
        item.equipment?.name || "Unbekannt",
        item.equipment?.inventory_number || "-",
        item.equipment?.barcode || "-",
        item.notes || "-"
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Ausrüstung", "Inv.Nr.", "Barcode", "Notizen"]],
        body: addedData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 55 },
        },
        margin: { left: 20, right: 20 },
      });
    }

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

  const present = checkedItems.filter((i) => i.status === "present").length;
  const missing = checkedItems.filter((i) => i.status === "missing").length;
  const replaced = checkedItems.filter((i) => i.status === "replaced").length;
  const templateEquipmentIds = templateItems.map(t => t.equipment_id);
  const addedEquipment = checkedItems.filter(
    item => !templateEquipmentIds.includes(item.equipment_id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Inventur abgeschlossen
          </DialogTitle>
          <DialogDescription>
            Die Inventur wurde erfolgreich abgeschlossen. Hier ist eine Zusammenfassung:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{present}</div>
              <div className="text-xs text-muted-foreground mt-1">Vorhanden</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{missing}</div>
              <div className="text-xs text-muted-foreground mt-1">Fehlt</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{replaced}</div>
              <div className="text-xs text-muted-foreground mt-1">Ersetzt</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{addedEquipment.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Neu</div>
            </div>
          </div>

          {/* Info */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vorlage:</span>
                <span className="font-medium">{check?.template?.name || 'Unbekannt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Geprüft von:</span>
                <span className="font-medium">
                  {check?.checked_by_person 
                    ? `${check.checked_by_person.first_name} ${check.checked_by_person.last_name}`
                    : 'Unbekannt'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum:</span>
                <span className="font-medium">{format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button onClick={generateCompletionPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Abschlussbericht herunterladen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
