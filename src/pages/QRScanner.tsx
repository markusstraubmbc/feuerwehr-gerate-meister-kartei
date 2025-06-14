
import { QRScanner } from "@/components/equipment/QRScanner";

const QRScannerPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR-Code Scanner</h1>
        <p className="text-muted-foreground">
          Scannen Sie QR-Codes zur schnellen Ausrüstungsidentifikation
        </p>
      </div>
      
      <QRScanner />
    </div>
  );
};

export default QRScannerPage;
