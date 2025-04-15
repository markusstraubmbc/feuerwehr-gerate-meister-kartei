
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Maintenance = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wartung</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Wartungsplanung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier wird die Wartungsplanung und -verfolgung angezeigt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;
