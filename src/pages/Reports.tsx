
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Reports = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Berichte</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Berichtsübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier können Sie verschiedene Berichte erstellen und exportieren.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
