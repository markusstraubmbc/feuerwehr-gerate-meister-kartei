
import { Equipment } from "@/hooks/useEquipment";

// Barcode-URL (SVG-Format) für PDF-Export
function getBarcodeSvgUrl(data: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    data
  )}&scale=2&height=16&includetext=true&textxalign=center&backgroundcolor=FFFFFF&format=svg`;
}

// Hilfsfunktion SVG in Base64-Daten-URL wandeln
async function svgUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const svgText = await response.text();
  // Wir entfernen ggf. Header
  const base64 = btoa(unescape(encodeURIComponent(svgText)));
  return `data:image/svg+xml;base64,${base64}`;
}

// Konvertiere Einträge für AutoTable (Strichcode als SVG-Bild)
export async function getEquipmentAutoTableData(
  equipments: Equipment[]
): Promise<(string | { image: string; width: number; height: number } | "-")[][]> {
  return await Promise.all(
    equipments.map(async item => {
      const barcodeText = item.barcode || "-";
      let barcodeImgBase64 = "";
      if (item.barcode) {
        try {
          const svgUrl = getBarcodeSvgUrl(item.barcode);
          barcodeImgBase64 = await svgUrlToBase64(svgUrl);
        } catch {
          barcodeImgBase64 = "";
        }
      }
      return [
        barcodeText,
        barcodeImgBase64
          ? { image: barcodeImgBase64, width: 70, height: 18 }
          : "-",
        item.name || "-",
        item.inventory_number || "-",
        item.manufacturer || "-"
      ];
    })
  );
}
