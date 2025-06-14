
import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode("");
      onOpenChange(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // For demonstration - in a real app, you'd use a QR code scanning library
      toast.info("QR-Code-Scanning über Datei-Upload ist in Entwicklung");
    } catch (error) {
      console.error("QR scan error:", error);
      toast.error("Fehler beim Scannen des QR-Codes");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR-Code / Barcode Scanner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Kamera-Scanner wird in einer zukünftigen Version verfügbar sein
            </p>
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              <Camera className="mr-2 h-4 w-4" />
              Foto aufnehmen
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-barcode">Oder manuell eingeben:</Label>
            <div className="flex gap-2">
              <Input
                id="manual-barcode"
                placeholder="Barcode oder QR-Code eingeben..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
                Scannen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
