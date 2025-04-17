
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${
    encodeURIComponent(equipment.barcode || equipment.inventory_number || equipment.id)
  }`;
  
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
            <div className="text-center mb-2">
              <p className="text-sm font-medium">Inventarnummer: {equipment.inventory_number || "-"}</p>
              <p className="text-sm text-muted-foreground">{equipment.name}</p>
            </div>
            
            <TabsContent value="barcode" className="mt-2">
              <div className="flex flex-col items-center gap-4">
                <div className="h-40 w-full flex items-center justify-center border rounded bg-white">
                  {equipment.barcode ? (
                    <div className="text-center">
                      <svg id="barcode"></svg>
                      {/* We'll use JsBarcode to render this in useEffect */}
                      <img 
                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${
                          encodeURIComponent(equipment.barcode)
                        }&scale=3&includetext=true&textxalign=center`} 
                        alt="Barcode" 
                        className="max-w-full max-h-32"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Kein Barcode verfügbar</span>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="qrcode" className="mt-2">
              <div className="flex flex-col items-center gap-4">
                <div className="h-40 w-full flex items-center justify-center border rounded bg-white">
                  {equipment.barcode || equipment.inventory_number ? (
                    <img 
                      src={qrCodeUrl}
                      alt="QR Code" 
                      className="max-h-32"
                    />
                  ) : (
                    <span className="text-muted-foreground">Kein QR-Code verfügbar</span>
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
              href={activeTab === "barcode" 
                ? `https://bwipjs-api.metafloor.com/?bcid=code128&text=${
                    encodeURIComponent(equipment.barcode || equipment.inventory_number || "")
                  }&scale=3&includetext=true&textxalign=center` 
                : qrCodeUrl} 
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
