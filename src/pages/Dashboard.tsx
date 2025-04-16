
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowDown, 
  ArrowUp, 
  HelpCircle 
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Gesamt Ausrüstung" 
          value="248" 
          description="Alle Ausrüstungsgegenstände"
          icon={<Package className="h-4 w-4 text-fire-red" />} 
        />
        <StatsCard 
          title="Wartungsbedarf" 
          value="14" 
          description="Prüfung fällig"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} 
        />
        <StatsCard 
          title="Einsatzbereit" 
          value="225" 
          description="Vollständig funktionstüchtig"
          icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
        />
        <StatsCard 
          title="In Wartung" 
          value="9" 
          description="Aktuell in Reparatur"
          icon={<Clock className="h-4 w-4 text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inventar Status</CardTitle>
            <CardDescription>Status der verschiedenen Kategorien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{category.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${category.changeColor}`}>
                      {category.change >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                      {Math.abs(category.change)}%
                    </span>
                    <span className="text-xs text-muted-foreground">{category.total} Artikel</span>
                  </div>
                </div>
                <Progress value={category.status} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anstehende Wartungen</CardTitle>
            <CardDescription>In den nächsten 30 Tagen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{item.date}</span>
                  </div>
                </div>
                <MaintenanceStatusBadge status={item.status as "dringend" | "geplant" | "optional"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <Alert className="border-fire-red bg-fire-red/10">
        <AlertTriangle className="h-4 w-4 text-fire-red" />
        <AlertTitle>Achtung</AlertTitle>
        <AlertDescription>
          Es gibt 3 Atemschutzgeräte, deren Prüfung sofort durchgeführt werden muss.
        </AlertDescription>
      </Alert>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Update the interface to match the data
type MaintenanceStatus = "dringend" | "geplant" | "optional";

function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const statusStyles = {
    dringend: "bg-red-100 text-red-800 border-red-200",
    geplant: "bg-amber-100 text-amber-800 border-amber-200",
    optional: "bg-blue-100 text-blue-800 border-blue-200"
  };

  return (
    <span 
      className={`px-2 py-1 text-xs rounded-md border ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

// Update the type definition in the sample data
interface MaintenanceItem {
  id: number;
  name: string;
  date: string;
  status: MaintenanceStatus;
}

// Sample data
const categories = [
  { name: "Atemschutzgeräte", status: 85, total: 42, change: 2, changeColor: "text-green-500" },
  { name: "Schläuche & Armaturen", status: 93, total: 86, change: 1, changeColor: "text-green-500" },
  { name: "Funkgeräte", status: 78, total: 24, change: -3, changeColor: "text-red-500" },
  { name: "Hydraulische Rettungsgeräte", status: 95, total: 15, change: 0, changeColor: "text-gray-500" },
  { name: "Persönliche Schutzausrüstung", status: 90, total: 52, change: 4, changeColor: "text-green-500" }
];

const maintenanceItems: MaintenanceItem[] = [
  { id: 1, name: "Atemschutzgerät #A-12", date: "24.04.2025", status: "dringend" },
  { id: 2, name: "Hydrauliksatz Zeus-7000", date: "28.04.2025", status: "geplant" },
  { id: 3, name: "Funkgerät Motorola #F-23", date: "02.05.2025", status: "geplant" },
  { id: 4, name: "Schlauch 20m #S-124", date: "10.05.2025", status: "optional" },
  { id: 5, name: "Kompressor #K-8", date: "15.05.2025", status: "optional" },
];

export default Dashboard;
