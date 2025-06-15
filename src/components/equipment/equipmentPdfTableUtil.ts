
import { Equipment } from "@/hooks/useEquipment";

// Barcode-URL wie gehabt
function getBarcodeUrl(barcode: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    barcode
  )}&scale=2&height=12&includetext=true&textxalign=center&backgroundcolor=FFFFFF`;
}

// Konvertiere einzelne Einträge für AutoTable
export async function getEquipmentAutoTableData(
  equipments: Equipment[]
): Promise<(string | { image: string; width: number; height: number } | "-")[][]> {
  return await Promise.all(
    equipments.map(async item => {
      const barcodeText = item.barcode || "-";
      let barcodeImgBase64 = "";
      if (item.barcode) {
        try {
          const response = await fetch(getBarcodeUrl(item.barcode));
          const blob = await response.blob();
          barcodeImgBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          barcodeImgBase64 = "";
        }
      }
      return [
        barcodeText,
        barcodeImgBase64 ? { image: barcodeImgBase64, width: 70, height: 18 } : "-",
        item.name || "-",
        item.inventory_number || "-",
        item.manufacturer || "-"
      ];
    })
  );
}
