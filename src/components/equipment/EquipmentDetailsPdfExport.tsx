import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Equipment } from "@/hooks/useEquipment";
import { EquipmentComment } from "@/hooks/useEquipmentComments";
import { EquipmentMission } from "@/hooks/useEquipmentMissions";
import { MaintenanceRecord } from "@/hooks/useMaintenanceRecords";

interface EquipmentDetailsPdfExportProps {
  equipment: Equipment;
  comments: EquipmentComment[];
  missions: EquipmentMission[];
  maintenanceRecords: MaintenanceRecord[];
}

export const generateEquipmentDetailsPdf = ({
  equipment,
  comments,
  missions,
  maintenanceRecords
}: EquipmentDetailsPdfExportProps) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Ausrüstungsdetails', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Equipment basic info
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Grundinformationen', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const basicInfo = [
      ['Name', equipment.name],
      ['Inventarnummer', equipment.inventory_number || 'Nicht zugewiesen'],
      ['Seriennummer', equipment.serial_number || 'Nicht zugewiesen'],
      ['Barcode', equipment.barcode || 'Nicht zugewiesen'],
      ['Hersteller', equipment.manufacturer || 'Nicht angegeben'],
      ['Modell', equipment.model || 'Nicht angegeben'],
      ['Kategorie', equipment.category?.name || 'Keine Kategorie'],
      ['Status', equipment.status],
      ['Standort', equipment.location?.name || 'Kein Standort'],
      ['Verantwortlich', equipment.responsible_person 
        ? `${equipment.responsible_person.first_name} ${equipment.responsible_person.last_name}`
        : 'Niemand zugewiesen'],
      ['Kaufdatum', equipment.purchase_date ? format(new Date(equipment.purchase_date), 'dd.MM.yyyy', { locale: de }) : 'Nicht angegeben'],
      ['Ersatzdatum', equipment.replacement_date ? format(new Date(equipment.replacement_date), 'dd.MM.yyyy', { locale: de }) : 'Nicht angegeben'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: basicInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Comments Section
    if (comments.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Kommentare (${comments.length})`, margin, yPosition);
      yPosition += 10;

      const commentsData = comments.map(comment => [
        format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: de }),
        `${comment.person.first_name} ${comment.person.last_name}`,
        comment.action?.name || '-',
        comment.comment
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Datum', 'Person', 'Aktion', 'Kommentar']],
        body: commentsData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Missions Section
    if (missions.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Einsätze & Übungen (${missions.length})`, margin, yPosition);
      yPosition += 10;

      const missionsData = missions.map(mission => [
        format(new Date(mission.mission.mission_date), 'dd.MM.yyyy', { locale: de }),
        mission.mission.mission_type === 'einsatz' ? 'Einsatz' : 'Übung',
        mission.mission.title,
        mission.mission.location || '-',
        mission.mission.responsible_persons || '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Datum', 'Typ', 'Titel', 'Ort', 'Verantwortlich']],
        body: missionsData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Filter maintenance records
    const completedMaintenance = maintenanceRecords.filter(record => record.status === 'abgeschlossen');
    const upcomingMaintenance = maintenanceRecords.filter(record => 
      record.status === 'ausstehend' || record.status === 'geplant' || record.status === 'in_bearbeitung'
    );

    // Completed Maintenance Section
    if (completedMaintenance.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Abgeschlossene Wartungen (${completedMaintenance.length})`, margin, yPosition);
      yPosition += 10;

      const completedData = completedMaintenance.map(record => [
        record.template?.name || 'Wartung',
        record.performed_date ? format(new Date(record.performed_date), 'dd.MM.yyyy', { locale: de }) : '-',
        record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : '-',
        record.minutes_spent ? `${record.minutes_spent} Min` : '-',
        record.notes || '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Wartungstyp', 'Durchgeführt', 'Durchgeführt von', 'Dauer', 'Notizen']],
        body: completedData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Upcoming Maintenance Section
    if (upcomingMaintenance.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Geplante Wartungen (${upcomingMaintenance.length})`, margin, yPosition);
      yPosition += 10;

      const upcomingData = upcomingMaintenance.map(record => [
        record.template?.name || 'Wartung',
        format(new Date(record.due_date), 'dd.MM.yyyy', { locale: de }),
        record.status,
        record.performer ? `${record.performer.first_name} ${record.performer.last_name}` : 'Nicht zugewiesen',
        record.template?.estimated_minutes ? `${record.template.estimated_minutes} Min` : '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Wartungstyp', 'Fällig am', 'Status', 'Zugewiesen an', 'Geschätzte Dauer']],
        body: upcomingData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Erstellt am: ${new Date().toLocaleDateString('de-DE')} | Seite ${i} von ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `Ausrüstungsdetails-${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    toast.success(`PDF-Bericht wurde als ${fileName} heruntergeladen`);
  } catch (error) {
    console.error('Error generating equipment details PDF:', error);
    toast.error("Fehler beim Erstellen der PDF-Datei");
  }
};
