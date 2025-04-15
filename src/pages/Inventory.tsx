
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Inventory = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventar</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventarübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hier wird die vollständige Inventarübersicht angezeigt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
