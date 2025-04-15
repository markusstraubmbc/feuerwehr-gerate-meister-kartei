
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Scanner = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Barcode Scanner</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gerät Scannen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Scannen Sie einen Barcode um das entsprechende Gerät zu öffnen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scanner;
