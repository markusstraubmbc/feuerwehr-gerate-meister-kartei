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

// Hilfsfunktion: Barcode-URL generieren (wie auch im Einzel-Export verwendet)
function getBarcodeUrl(barcode: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    barcode
  )}&scale=2&height=12&includetext=true&textxalign=center&backgroundcolor=FFFFFF`;
}

// Importiere neue Util-Funktion
import { getEquipmentAutoTableData } from "./equipmentPdfTableUtil";

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

  const handlePdfDownload = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Ausrüstungsliste (gruppiert nach Kategorie, Standort)', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      doc.text(`Anzahl Einträge: ${equipment.length}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      const grouped = groupEquipment(equipment);

      let startY = 45;
      for (const category of Object.keys(grouped).sort()) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Kategorie: ${category}`, 12, startY);

        startY += 7;

        for (const location of Object.keys(grouped[category]).sort()) {
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`Standort: ${location}`, 18, startY);

          startY += 7;

          const headers = [
            "Barcode (Text)",
            "Strichcode",
            "Name",
            "Inventarnummer",
            "Hersteller",
          ];

          // Nutze die neue Hilfsfunktion für die korrekten Tabellen-Daten
          const bodyData = await getEquipmentAutoTableData(grouped[category][location]);

          autoTable(doc, {
            head: [headers],
            body: bodyData,
            startY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              halign: 'left',
              valign: 'middle'
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

          startY = (doc as any).lastAutoTable.finalY + 8;
        }

        startY += 3;
      }

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

// Neue React-Komponente für den Print-Export als HTML-Tabelle mit Strichcode-Bildern
// Der printRef verweist im UI auf diese Komponente
import React from "react";

export const EquipmentPrintExportHtml: React.FC<{ equipment: Equipment[] }> = ({ equipment }) => {
  const grouped = groupEquipment(equipment);

  return (
    <div>
      <div className="print-title">
        Ausrüstungsliste (gruppiert nach Kategorie, Standort)
      </div>
      <div className="print-info">
        Erstellt am: {new Date().toLocaleDateString("de-DE")} - Anzahl Einträge: {equipment.length}
      </div>
      {Object.keys(grouped).sort().map(cat => (
        <div key={cat} className="mb-6">
          <div className="font-bold text-lg mb-2">Kategorie: {cat}</div>
          {Object.keys(grouped[cat]).sort().map(loc => (
            <div key={loc} className="mb-4">
              <div className="font-semibold mb-1">Standort: {loc}</div>
              <table className="w-full border-collapse text-[9pt] mb-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Barcode (Text)</th>
                    <th className="border px-2 py-1">Strichcode</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Inventarnummer</th>
                    <th className="border px-2 py-1">Hersteller</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[cat][loc].map(item => (
                    <tr key={item.id}>
                      <td className="border px-2 py-1 align-middle">{item.barcode || "-"}</td>
                      <td className="border px-2 py-1 align-middle">
                        {item.barcode ? (
                          <img
                            src={getBarcodeUrl(item.barcode)}
                            alt="Barcode"
                            style={{ maxHeight: 32, maxWidth: 140, background: "#FFF" }}
                            className="mx-auto d-block"
                          />
                        ) : "-"}
                      </td>
                      <td className="border px-2 py-1 align-middle">{item.name || "-"}</td>
                      <td className="border px-2 py-1 align-middle">{item.inventory_number || "-"}</td>
                      <td className="border px-2 py-1 align-middle">{item.manufacturer || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
