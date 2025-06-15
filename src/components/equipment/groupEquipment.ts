
import { Equipment } from "@/hooks/useEquipment";

// Gruppen: Kategorie -> Standort -> Liste mit sortierten Einträgen
export function groupEquipment(equipment: Equipment[]) {
  const group: Record<string, Record<string, Equipment[]>> = {};
  for (const item of equipment) {
    const category = item.category?.name || "Keine Kategorie";
    const location = item.location?.name || "Kein Standort";
    group[category] = group[category] || {};
    group[category][location] = group[category][location] || [];
    group[category][location].push(item);
  }
  // Sortiere Einträge pro Standortgruppe anhand der gewünschten Felder
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
