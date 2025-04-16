
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings as SettingsIcon, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lagerorteverwaltung
            </CardTitle>
            <CardDescription>
              Lagerorte erstellen und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen und bearbeiten Sie Lagerorte für Ihre Ausrüstung.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => navigate('/locations')}
            >
              Lagerorte verwalten
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personenverwaltung
            </CardTitle>
            <CardDescription>
              Personen erstellen und verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen und bearbeiten Sie verantwortliche Personen für Ihre Ausrüstung.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => navigate('/person-management')}
            >
              Personen verwalten
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Allgemeine Einstellungen
            </CardTitle>
            <CardDescription>
              Anpassen der Anwendungseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Passen Sie allgemeine Einstellungen und Konfigurationen an.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Einstellungen anpassen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
