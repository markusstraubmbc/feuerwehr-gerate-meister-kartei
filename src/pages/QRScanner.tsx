
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/equipment/QRScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Search } from "lucide-react";
import { toast } from "sonner";

const QRScannerPage = () => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedResults, setScannedResults] = useState<string[]>([]);

  const handleScan = (barcode: string) => {
    console.log("QR Code scanned:", barcode);
    setScannedResults(prev => [barcode, ...prev]);
    toast.success(`QR-Code gescannt: ${barcode}`);
  };

  const clearResults = () => {
    setScannedResults([]);
    toast.info("Scan-Ergebnisse gelöscht");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR-Code Scanner</h1>
        <p className="text-muted-foreground">
          Scannen Sie QR-Codes zur schnellen Ausrüstungsidentifikation
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Klicken Sie auf den Button unten, um mit dem Scannen zu beginnen
            </p>
            
            <Button 
              onClick={() => setIsQRScannerOpen(true)}
              size="lg"
              className="w-full max-w-xs"
            >
              <Search className="mr-2 h-4 w-4" />
              QR-Code scannen
            </Button>
          </div>
        </CardContent>
      </Card>

      {scannedResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gescannte Codes</CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Löschen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scannedResults.map((result, index) => (
                <div 
                  key={index}
                  className="p-3 bg-muted rounded-lg font-mono text-sm"
                >
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <QRScanner 
        open={isQRScannerOpen}
        onOpenChange={setIsQRScannerOpen}
        onScan={handleScan}
      />
    </div>
  );
};

export default QRScannerPage;
