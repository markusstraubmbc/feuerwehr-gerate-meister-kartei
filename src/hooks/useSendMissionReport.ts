import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mission } from "./useMissions";
import { MissionEquipment } from "./useMissionEquipment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SendMissionReportParams {
  mission: Mission;
  missionEquipment: MissionEquipment[];
}

export const useSendMissionReport = () => {
  const generatePdfBase64 = (mission: Mission, missionEquipment: MissionEquipment[]): string => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const titleText = mission.mission_type === "einsatz" ? "Einsatzbericht" : "Übungsbericht";
    doc.text(titleText, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

    // Mission title
    doc.setFontSize(14);
    doc.text(mission.title, doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });

    // Basic information section
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Grundinformationen:", 20, 50);

    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    let yPos = 60;

    // Mission details
    if (mission.mission_type) {
      doc.text(`Typ: ${mission.mission_type === "einsatz" ? "Einsatz" : "Übung"}`, 20, yPos);
      yPos += 6;
    }
    doc.text(`Datum: ${format(new Date(mission.mission_date), "dd.MM.yyyy (EEEE)", { locale: de })}`, 20, yPos);
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
      yPos += responsibleLines.length * 4 + 2;
    }
    if (mission.vehicles) {
      const vehicleLines = doc.splitTextToSize(`Fahrzeuge: ${mission.vehicles}`, 170);
      doc.text(vehicleLines, 20, yPos);
      yPos += vehicleLines.length * 4 + 2;
    }

    // Description if available
    if (mission.description) {
      yPos += 5;
      doc.setFont(undefined, "bold");
      doc.text("Beschreibung:", 20, yPos);
      yPos += 6;
      doc.setFont(undefined, "normal");

      const descriptionLines = doc.splitTextToSize(mission.description, 170);
      doc.text(descriptionLines, 20, yPos);
      yPos += descriptionLines.length * 4 + 10;
    }

    // Equipment section
    yPos += 10;
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Verwendete Einsatzmittel:", 20, yPos);
    yPos += 10;

    const filteredEquipment = Array.isArray(missionEquipment)
      ? missionEquipment.filter((e) => !!e.equipment)
      : [];

    if (filteredEquipment.length > 0) {
      const equipmentTableData = filteredEquipment.map((item) => [
        item.equipment?.inventory_number || "-",
        item.equipment?.name || "-",
        item.equipment?.category?.name || "-",
        item.equipment?.location?.name || "-",
        item.added_by_person
          ? `${item.added_by_person.first_name} ${item.added_by_person.last_name}`
          : "-",
        format(new Date(item.added_at), "dd.MM.yyyy HH:mm", { locale: de }),
        item.notes || "-",
      ]);

      const equipmentHeaders = [
        "Inventarnr.",
        "Name",
        "Kategorie",
        "Standort",
        "Hinzugefügt von",
        "Hinzugefügt am",
        "Notizen",
      ];

      autoTable(doc, {
        head: [equipmentHeaders],
        body: equipmentTableData,
        startY: yPos,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1,
        margin: { left: 15, right: 15 },
      });
    } else {
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text("Keine Einsatzmittel dokumentiert oder nicht geladen.", 20, yPos);
    }

    // Footer with generation timestamp
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(
      `Erstellt am: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Get PDF as base64
    return doc.output("datauristring").split(",")[1];
  };

  const sendMissionReport = async ({ mission, missionEquipment }: SendMissionReportParams) => {
    try {
      console.log("Generating mission report PDF...");
      
      // Generate PDF as base64
      const pdfBase64 = generatePdfBase64(mission, missionEquipment);

      // Extract email addresses from responsible persons if they contain emails
      const responsiblePersonsEmails: string[] = [];
      if (mission.responsible_persons) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const matches = mission.responsible_persons.match(emailRegex);
        if (matches) {
          responsiblePersonsEmails.push(...matches);
        }
      }

      console.log("Sending mission report via edge function...");

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-mission-report", {
        body: {
          missionId: mission.id,
          missionTitle: mission.title,
          missionType: mission.mission_type,
          missionDate: format(new Date(mission.mission_date), "dd.MM.yyyy", { locale: de }),
          pdfBase64,
          responsiblePersonsEmails,
        },
      });

      if (error) throw error;

      if (data?.success) {
        console.log("Mission report sent successfully:", data);
        toast.success("Einsatzbericht per E-Mail versendet");
      } else if (data?.message) {
        console.log("Mission report skipped:", data.message);
        // Don't show toast if no email configured
      }
    } catch (error: any) {
      console.error("Error sending mission report:", error);
      toast.error("Fehler beim Versenden des Berichts: " + error.message);
    }
  };

  return {
    sendMissionReport,
  };
};
