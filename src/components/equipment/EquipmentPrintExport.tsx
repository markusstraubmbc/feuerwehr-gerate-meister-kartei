
import { Equipment } from "@/hooks/useEquipment";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";
import { RefObject } from "react";

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

      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Ausrüstungsliste', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      // Date and count info
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      doc.text(`Anzahl Einträge: ${equipment.length}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      // Prepare table data
      const tableData = equipment.map(item => [
        item.inventory_number || '-',
        item.name || '-',
        item.location?.name || '-',
        item.category?.name || '-',
        item.status || '-',
        item.last_check_date ? format(new Date(item.last_check_date), "dd.MM.yyyy") : '-',
        item.next_check_date ? format(new Date(item.next_check_date), "dd.MM.yyyy") : '-',
        item.responsible_person 
          ? `${item.responsible_person.first_name} ${item.responsible_person.last_name}`
          : '-'
      ]);

      // Table headers
      const headers = [
        'Inventarnr.',
        'Name', 
        'Standort',
        'Kategorie',
        'Status',
        'Letzte Prüfung',
        'Nächste Prüfung',
        'Verantwortlich'
      ];

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
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

      // Save the PDF
      const fileName = `Ausrüstungsliste-${new Date().toISOString().slice(0, 10)}.pdf`;
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
