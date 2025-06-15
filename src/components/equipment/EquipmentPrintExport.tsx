import { Equipment } from "@/hooks/useEquipment";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";
import { RefObject } from "react";

// Hilfsfunktionen zum Gruppieren & Sortieren
function groupEquipment(equipment: Equipment[]) {
  // Gruppen: Kategorie -> Standort -> Liste mit sortierten Einträgen
  // leere Strings für fehlende Werte
  const group: Record<string, Record<string, Equipment[]>> = {};
  for (const item of equipment) {
    const category = item.category?.name || "Keine Kategorie";
    const location = item.location?.name || "Kein Standort";
    group[category] = group[category] || {};
    group[category][location] = group[category][location] || [];
    group[category][location].push(item);
  }
  // Sortiere Einträge pro Standortgruppe nach Barcode, Name, Inventarnummer, Hersteller
  for (const cat in group) {
    for (const loc in group[cat]) {
      group[cat][loc].sort((a, b) => {
        const fields: (keyof Equipment)[] = ["barcode", "name", "inventory_number", "manufacturer"];
        for (const field of fields) {
          const vA = (a[field] || "").toString().toLowerCase();
          const vB = (b[field] || "").toString().toLowerCase();
          if (vA < vB) return -1;
          if (vA > vB) return 1;
        }
        return 0;
      });
    }
  }
  return group;
}

interface EquipmentPrintExportProps {
  equipment: Equipment[];
  printRef?: RefObject<HTMLDivElement>;
}

export const useEquipmentPrintExport = ({ equipment, printRef }: EquipmentPrintExportProps) => {
  const handlePrint = useReactToPrint({
    content: () => printRef?.current,
    documentTitle: `Ausrüstungsliste-${new Date().toLocaleDateString('de-DE')}`,
    pageStyle: `
      @page { 
        size: A4 landscape; 
        margin: 15mm; 
      } 
      @media print { 
        body { 
          font-size: 10pt; 
          -webkit-print-color-adjust: exact;
        }
        .no-print, .print\\:hidden { 
          display: none !important; 
        }
        table {
          width: 100% !important;
          font-size: 9pt !important;
          border-collapse: collapse !important;
        }
        th, td {
          padding: 3px 6px !important;
          border: 1px solid #333 !important;
          text-align: left !important;
        }
        th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
        }
        .print-title {
          display: block !important;
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 15px;
          page-break-after: avoid;
        }
        .print-info {
          display: block !important;
          text-align: center;
          font-size: 10pt;
          margin-bottom: 10px;
          color: #666;
        }
      }
    `,
    onBeforePrint: () => {
      if (!printRef?.current) {
        toast.error("Drucken konnte nicht gestartet werden", {
          description: "Es gab ein Problem beim Vorbereiten der Druckansicht."
        });
      } else {
        console.log('Printing equipment list...');
      }
    }
  });

  const handlePdfDownload = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Titel
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Ausrüstungsliste (gruppiert nach Kategorie, Standort)', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      doc.text(`Anzahl Einträge: ${equipment.length}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      const grouped = groupEquipment(equipment);

      let startY = 45;

      // Für jede Kategorie
      Object.keys(grouped).sort().forEach(category => {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Kategorie: ${category}`, 12, startY);

        startY += 7;

        // Innerhalb jeder Kategorie die Standorte durchgehen
        Object.keys(grouped[category]).sort().forEach(location => {
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`Standort: ${location}`, 18, startY);

          startY += 7;

          // Kopfzeile der jeweiligen Tabelle
          const headers = [
            "Barcode",
            "Name",
            "Inventarnummer",
            "Hersteller",
          ];

          // Daten für die aktuelle Standortgruppe
          const bodyData = grouped[category][location].map(item => [
            item.barcode || "-",
            item.name || "-",
            item.inventory_number || "-",
            item.manufacturer || "-"
          ]);

          // Tabelle der Standortgruppe
          autoTable(doc, {
            head: [headers],
            body: bodyData,
            startY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              halign: 'left'
            },
            headStyles: {
              fillColor: [240, 240, 240],
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [250, 250, 250]
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.1,
            margin: { left: 10, right: 10 }
          });

          // autoTable passt den Y Wert nach unten automatisch an:
          startY = (doc as any).lastAutoTable.finalY + 8;
        });

        // nach jedem Kategorie-Abschnitt etwas vertikalen Abstand
        startY += 3;
      });

      // PDF speichern
      const fileName = `Ausrüstungsliste-gruppiert-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      toast.success(`PDF wurde als ${fileName} heruntergeladen`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Fehler beim Erstellen der PDF-Datei");
    }
  };

  return {
    handlePrint,
    handlePdfDownload
  };
};
