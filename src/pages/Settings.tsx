
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UsersRound, 
  FolderOpenDot, 
  FileCheck, 
  Mail,
  ArrowLeft,
  Cog,
  Tag,
  PackageSearch,
  ClipboardCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/person-management")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Personen
            </CardTitle>
            <CardDescription>Personen für das System verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Alle Personen anzeigen und verwalten, die für die Wartung und Prüfung der Ausrüstung verantwortlich sind.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/locations")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpenDot className="h-5 w-5" />
              Standorte
            </CardTitle>
            <CardDescription>Lagerorte und Standorte verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Alle Lagerorte und Standorte für die Ausrüstung anzeigen und verwalten.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/categories")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Kategorien
            </CardTitle>
            <CardDescription>Ausrüstungskategorien verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Kategorien für die Ausrüstung erstellen und verwalten.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/maintenance-templates")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Wartungsvorlagen
            </CardTitle>
            <CardDescription>Wartungsvorlagen verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Vorlagen für wiederkehrende Wartungs- und Prüfaufgaben erstellen und verwalten.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/equipment-templates")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5" />
              Ausrüstungs-Vorlagen
            </CardTitle>
            <CardDescription>Vorlagen für Einsatz-Ausrüstung</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Ausrüstungssets für Fahrzeuge und Einsätze definieren und verwalten.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/template-inventory")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Vorlagen-Inventur
            </CardTitle>
            <CardDescription>Inventur für Ausrüstungsvorlagen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Führen Sie Inventuren für Ausrüstungsvorlagen durch und verwalten Sie die Historie.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/email")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Benachrichtigungen
            </CardTitle>
            <CardDescription>E-Mail-Einstellungen verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Konfigurieren Sie die E-Mail-Benachrichtigungen für anstehende Wartungen und monatliche Berichte.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/settings/system")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              System
            </CardTitle>
            <CardDescription>Logo, Anwendungsname und alle Systemeinstellungen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Systemlogo hochladen, Namen der Anwendung anpassen, Farbeinstellungen und Cron-Job Status verwalten.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
