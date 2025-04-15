
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ImportExport = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Import/Export</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Datenimport und -export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier können Sie Daten importieren und exportieren.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExport;
