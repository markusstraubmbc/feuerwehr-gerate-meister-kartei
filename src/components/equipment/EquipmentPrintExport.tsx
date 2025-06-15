import { groupEquipment } from "./groupEquipment";
import { getEquipmentAutoTableData } from "./equipmentPdfTableUtil";
import { Equipment } from "@/hooks/useEquipment";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { RefObject } from "react";

// Hilfsfunktion: Barcode-URL generieren (wie auch im Einzel-Export verwendet)
function getBarcodeUrl(barcode: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    barcode
  )}&scale=2&height=12&includetext=true&textxalign=center&backgroundcolor=FFFFFF`;
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
            "Hersteller"
          ];

          const bodyData = await getEquipmentAutoTableData(grouped[category][location] || []);

          autoTable(doc, {
            head: [headers],
            body: bodyData as any,
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
