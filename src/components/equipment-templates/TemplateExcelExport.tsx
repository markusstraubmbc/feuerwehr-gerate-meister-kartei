import { Button } from "@/components/ui/button";
import { FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

interface TemplateExcelExportProps {
  templateId?: string;
  templateName?: string;
  templateItems?: any[];
}

export function TemplateExcelExport({ templateId, templateName, templateItems }: TemplateExcelExportProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = () => {
    if (!templateItems || templateItems.length === 0) {
      toast.error("Keine Ausrüstung in der Vorlage");
      return;
    }

    const data = templateItems.map((item) => ({
      "Ausrüstung": item.equipment?.name || "",
      "Inventarnummer": item.equipment?.inventory_number || "",
      "Kategorie": item.equipment?.category?.name || "",
      "Standort": item.equipment?.location?.name || "",
      "Notizen": item.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ausrüstung");

    const fileName = `Vorlage_${templateName || "Export"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel-Datei erstellt");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          toast.error("Keine Daten in der Datei");
          return;
        }

        // Get all equipment to match by name
        const { data: allEquipment, error: equipmentError } = await supabase
          .from("equipment")
          .select("id, name, inventory_number");

        if (equipmentError) throw equipmentError;

        // Match imported items with existing equipment
        const matchedItems = jsonData
          .map((row) => {
            const equipmentName = row["Ausrüstung"];
            const inventoryNumber = row["Inventarnummer"];
            
            const equipment = allEquipment?.find(
              (eq) => eq.name === equipmentName || eq.inventory_number === inventoryNumber
            );

            if (equipment) {
              return {
                equipment_id: equipment.id,
                notes: row["Notizen"] || null,
              };
            }
            return null;
          })
          .filter(Boolean);

        if (matchedItems.length === 0) {
          toast.error("Keine Ausrüstung konnte zugeordnet werden");
          return;
        }

        // If templateId is provided, add to existing template
        if (templateId) {
          const itemsToInsert = matchedItems.map((item) => ({
            template_id: templateId,
            ...item,
          }));

          const { error } = await supabase.from("template_equipment_items").insert(itemsToInsert);

          if (error) throw error;

          queryClient.invalidateQueries({ queryKey: ["template-equipment-items", templateId] });
          toast.success(`${matchedItems.length} Ausrüstungsgegenstände importiert`);
        } else {
          toast.info(
            `${matchedItems.length} Ausrüstungsgegenstände gefunden. Bitte erstellen Sie zuerst eine Vorlage.`
          );
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Fehler beim Importieren");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      {templateItems && templateItems.length > 0 && (
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <FileDown className="h-4 w-4 mr-2" />
          Excel Export
        </Button>
      )}
      {templateId && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Excel Import
          </Button>
        </>
      )}
    </div>
  );
}
