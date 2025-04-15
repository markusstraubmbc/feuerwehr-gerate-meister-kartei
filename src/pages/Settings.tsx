
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Systemeinstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier werden die Systemeinstellungen verwaltet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
