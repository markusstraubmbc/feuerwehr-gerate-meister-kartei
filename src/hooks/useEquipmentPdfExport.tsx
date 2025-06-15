
import { useMaintenanceRecords } from "@/hooks/useMaintenanceRecords";
import { generateEquipmentDetailsPdf } from "@/components/equipment/EquipmentDetailsPdfExport";
import { Equipment } from "@/hooks/useEquipment";
import { supabase } from "@/integrations/supabase/client";

export const useEquipmentPdfExport = () => {
  const { data: maintenanceRecords = [] } = useMaintenanceRecords();

  const handlePdfExportForEquipment = async (equipmentItem: Equipment) => {
    try {
      // Fetch comments for this equipment using Supabase directly
      const { data: comments = [] } = await supabase
        .from("equipment_comments")
        .select(`
          *,
          person:person_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq("equipment_id", equipmentItem.id)
        .order("created_at", { ascending: false });

      // Fetch mission equipment records with all required mission fields
      const { data: missionEquipment = [] } = await supabase
        .from("mission_equipment")
        .select(`
          *,
          mission:mission_id (
            id,
            title,
            mission_date,
            mission_type,
            description,
            location,
            created_at,
            end_time,
            responsible_person_id,
            start_time,
            updated_at
          ),
          added_by_person:added_by (
            id,
            first_name,
            last_name
          )
        `)
        .eq("equipment_id", equipmentItem.id)
        .order("added_at", { ascending: false });

      // Filter maintenance records for this equipment
      const equipmentMaintenance = maintenanceRecords.filter(
        record => record.equipment_id === equipmentItem.id
      );

      generateEquipmentDetailsPdf({
        equipment: equipmentItem,
        comments: comments || [],
        missions: missionEquipment || [],
        maintenanceRecords: equipmentMaintenance
      });
    } catch (error) {
      console.error('Error generating PDF for equipment:', error);
    }
  };

  return { handlePdfExportForEquipment };
};
