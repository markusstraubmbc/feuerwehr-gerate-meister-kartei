import React from "react";
import { Equipment } from "@/hooks/useEquipment";
import { groupEquipment } from "./groupEquipment";

// Barcode-URL für Anzeige im Print
function getBarcodeUrl(barcode: string) {
  return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
    barcode
  )}&scale=2&height=12&includetext=true&textxalign=center&backgroundcolor=FFFFFF`;
}

export const EquipmentPrintExportHtml: React.FC<{ equipment: Equipment[] }> = ({ equipment }) => {
  const grouped = groupEquipment(equipment);

  return (
    <div>
      <div className="print-title">
        Ausrüstungsliste (gruppiert nach Kategorie, Standort)
      </div>
      <div className="print-info">
        Erstellt am: {new Date().toLocaleDateString("de-DE")} - Anzahl Einträge: {equipment.length}
      </div>
      {Object.keys(grouped).sort().map(cat => (
        <div key={cat} className="mb-6">
          <div className="font-bold text-lg mb-2">Kategorie: {cat}</div>
          {Object.keys(grouped[cat]).sort().map(loc => (
            <div key={loc} className="mb-4">
              <div className="font-semibold mb-1">Standort: {loc}</div>
              <table className="w-full border-collapse text-[9pt] mb-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Barcode (Text)</th>
                    <th className="border px-2 py-1">Strichcode</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Inventarnummer</th>
                    <th className="border px-2 py-1">Hersteller</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[cat][loc].map(item => (
                    <tr key={item.id}>
                      <td className="border px-2 py-1 align-middle">{item.barcode || "-"}</td>
                      <td className="border px-2 py-1 align-middle">
                        {typeof item.barcode === "string" && item.barcode.trim() !== "" ? (
                          <img
                            src={getBarcodeUrl(item.barcode)}
                            alt="Barcode"
                            style={{ maxHeight: 32, maxWidth: 140, background: "#FFF" }}
                            className="mx-auto d-block"
                          />
                        ) : "-"}
                      </td>
                      <td className="border px-2 py-1 align-middle">{item.name || "-"}</td>
                      <td className="border px-2 py-1 align-middle">{item.inventory_number || "-"}</td>
                      <td className="border px-2 py-1 align-middle">{item.manufacturer || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
