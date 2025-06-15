
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/hooks/useEquipment";

export const useEquipmentCommentCounts = (equipment: Equipment[]) => {
  const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({});

  // Function to get comment count for an equipment item
  const getCommentCount = async (equipmentId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from("equipment_comments")
        .select("*", { count: "exact", head: true })
        .eq("equipment_id", equipmentId);
      return count || 0;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  };

  // Load comment counts for all equipment
  useEffect(() => {
    const loadCommentCounts = async () => {
      const counts: { [key: string]: number } = {};
      for (const item of equipment) {
        counts[item.id] = await getCommentCount(item.id);
      }
      setCommentCounts(counts);
    };
    
    if (equipment.length > 0) {
      loadCommentCounts();
    }
  }, [equipment]);

  return { commentCounts };
};
