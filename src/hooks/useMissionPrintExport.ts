import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Mission } from "./useMissions";
import { MissionEquipment } from "./useMissionEquipment";

interface MissionPrintExportProps {
  mission: Mission;
  missionEquipment: MissionEquipment[];
}

export const useMissionPrintExport = () => {
  const handlePdfDownload = ({ mission, missionEquipment }: MissionPrintExportProps) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const titleText = mission.mission_type === 'einsatz' ? 'Einsatzbericht' : 'Übungsbericht';
      doc.text(titleText, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      // Mission title
      doc.setFontSize(14);
      doc.text(mission.title, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

      // Basic information section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Grundinformationen:', 20, 50);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      let yPos = 60;
      
      // Mission details
      if (mission.mission_type) {
        doc.text(`Typ: ${mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}`, 20, yPos);
        yPos += 6;
      }
      doc.text(`Datum: ${format(new Date(mission.mission_date), 'dd.MM.yyyy (EEEE)', { locale: de })}`, 20, yPos);
      yPos += 6;
      if (mission.start_time) {
        doc.text(`Startzeit: ${mission.start_time}`, 20, yPos);
        yPos += 6;
      }
      if (mission.end_time) {
        doc.text(`Endzeit: ${mission.end_time}`, 20, yPos);
        yPos += 6;
      }
      if (mission.location) {
        doc.text(`Ort: ${mission.location}`, 20, yPos);
        yPos += 6;
      }
      if (mission.responsible_persons) {
        const responsibleLines = doc.splitTextToSize(`Verantwortlich: ${mission.responsible_persons}`, 170);
        doc.text(responsibleLines, 20, yPos);
        yPos += (responsibleLines.length * 4) + 2;
      }
       if (mission.vehicles) {
        const vehicleLines = doc.splitTextToSize(`Fahrzeuge: ${mission.vehicles}`, 170);
        doc.text(vehicleLines, 20, yPos);
        yPos += (vehicleLines.length * 4) + 2;
      }
      
      // Description if available
      if (mission.description) {
        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Beschreibung:', 20, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        // Split long description text
        const descriptionLines = doc.splitTextToSize(mission.description, 170);
        doc.text(descriptionLines, 20, yPos);
        yPos += (descriptionLines.length * 4) + 10;
      }

      // Equipment section
      yPos += 10;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Verwendete Einsatzmittel:', 20, yPos);
      yPos += 10;

      // Debug-Log für Einsatzmittel (wichtig für Fehleranalyse)
      console.log("MissionEquipment for PDF export:", missionEquipment);

      // Prüfen auf valide Einsatzmittel (nur solche, die ein equipment-Objekt haben)
      const filteredEquipment = Array.isArray(missionEquipment)
        ? missionEquipment.filter(e => !!e.equipment)
        : [];

      if (filteredEquipment.length > 0) {
        // Prepare equipment table data
        const equipmentTableData = filteredEquipment.map(item => [
          item.equipment?.inventory_number || '-',
          item.equipment?.name || '-',
          item.equipment?.category?.name || '-',
          item.equipment?.location?.name || '-',
          item.added_by_person 
            ? `${item.added_by_person.first_name} ${item.added_by_person.last_name}`
            : '-',
          format(new Date(item.added_at), 'dd.MM.yyyy HH:mm', { locale: de }),
          item.notes || '-'
        ]);

        // Equipment table headers
        const equipmentHeaders = [
          'Inventarnr.',
          'Name',
          'Kategorie',
          'Standort',
          'Hinzugefügt von',
          'Hinzugefügt am',
          'Notizen'
        ];

        // Generate equipment table
        autoTable(doc, {
          head: [equipmentHeaders],
          body: equipmentTableData,
          startY: yPos,
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
          margin: { left: 15, right: 15 }
        });
      } else {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(
          'Keine Einsatzmittel dokumentiert oder nicht geladen.',
          20,
          yPos
        );
      }

      // Footer with generation timestamp
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`,
        doc.internal.pageSize.getWidth() / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Save the PDF
      const fileName = `${mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung'}-${mission.title.replace(/[^a-zA-Z0-9]/g, '_')}-${format(new Date(mission.mission_date), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF wurde als ${fileName} heruntergeladen`);
    } catch (error) {
      console.error('Error generating mission PDF:', error);
      toast.error("Fehler beim Erstellen der PDF-Datei");
    }
  };

  return {
    handlePdfDownload
  };
};
