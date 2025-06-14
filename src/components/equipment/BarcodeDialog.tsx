
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Equipment } from "@/hooks/useEquipment";
import { Printer, Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BarcodeDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeDialog({ equipment, open, onOpenChange }: BarcodeDialogProps) {
  const [activeTab, setActiveTab] = useState("barcode");
  const printRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Barcode-${equipment.inventory_number || equipment.name}`,
  });

  // Generate URL for QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${
    encodeURIComponent(equipment.barcode || equipment.inventory_number || equipment.id)
  }`;

  // Generate URL for Barcode with better parameters
  const barcodeUrl = equipment.barcode ? 
    `https://bwipjs-api.metafloor.com/?bcid=code128&text=${
      encodeURIComponent(equipment.barcode)
    }&scale=2&height=10&includetext=true&textxalign=center&backgroundcolor=FFFFFF` : null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode & QR-Code</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
            <TabsTrigger value="qrcode">QR-Code</TabsTrigger>
          </TabsList>
          
          <div ref={printRef} className="p-4">
            <div className="text-center mb-4">
              <p className="text-sm font-medium">{equipment.name}</p>
              <p className="text-xs text-muted-foreground">Inventarnummer: {equipment.inventory_number || "-"}</p>
            </div>
            
            <TabsContent value="barcode" className="mt-2">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full min-h-[120px] flex items-center justify-center border rounded bg-white p-2">
                  {barcodeUrl ? (
                    <div className="text-center w-full">
                      <img 
                        src={barcodeUrl}
                        alt="Barcode" 
                        className="max-w-full h-auto mx-auto"
                        style={{ maxHeight: '100px', width: 'auto' }}
                        onError={(e) => {
                          console.error("Barcode loading error:", e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-xs mt-2 font-mono">{equipment.barcode}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Kein Barcode verfügbar</span>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="qrcode" className="mt-2">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full min-h-[120px] flex items-center justify-center border rounded bg-white p-2">
                  {equipment.barcode || equipment.inventory_number ? (
                    <div className="text-center">
                      <img 
                        src={qrCodeUrl}
                        alt="QR Code" 
                        className="mx-auto"
                        style={{ width: '150px', height: '150px' }}
                        onError={(e) => {
                          console.error("QR Code loading error:", e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-xs mt-2 font-mono">
                        {equipment.barcode || equipment.inventory_number}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Kein QR-Code verfügbar</span>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="flex gap-2 mt-2">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a 
              href={activeTab === "barcode" && barcodeUrl ? barcodeUrl : qrCodeUrl} 
              download={`${activeTab}-${equipment.inventory_number || equipment.name}.png`}
            >
              <Download className="mr-2 h-4 w-4" />
              Herunterladen
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
