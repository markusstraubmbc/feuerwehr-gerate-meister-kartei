
import { Equipment } from "@/hooks/useEquipment";

// QR-Code-URL generieren für PDF-Export (PNG)
function getQrCodeUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&format=png&data=${encodeURIComponent(data)}`;
}

// Konvertiere Einträge für AutoTable (QR statt Barcode-Bild)
export async function getEquipmentAutoTableData(
  equipments: Equipment[]
): Promise<(string | { image: string; width: number; height: number } | "-")[][]> {
  return await Promise.all(
    equipments.map(async item => {
      const barcodeText = item.barcode || "-";
      // Wir nehmen barcode; falls nicht vorhanden, Inventarnummer oder ID
      const qrValue = item.barcode || item.inventory_number || item.id;
      let qrImgBase64 = "";
      if (qrValue) {
        try {
          const response = await fetch(getQrCodeUrl(qrValue));
          const blob = await response.blob();
          qrImgBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          qrImgBase64 = "";
        }
      }
      return [
        barcodeText,
        qrImgBase64 ? { image: qrImgBase64, width: 18, height: 18 } : "-",
        item.name || "-",
        item.inventory_number || "-",
        item.manufacturer || "-"
      ];
    })
  );
}
