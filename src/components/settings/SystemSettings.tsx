import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Palette } from "lucide-react";
import { toast } from "sonner";

const SystemSettings = () => {
  const [systemName, setSystemName] = useState(
    localStorage.getItem('systemName') || 'Feuerwehr Inventar'
  );
  const [logoUrl, setLogoUrl] = useState(
    localStorage.getItem('systemLogo') || ''
  );
  const [menuBackgroundColor, setMenuBackgroundColor] = useState(
    localStorage.getItem('menuBackgroundColor') || '#1e293b'
  );
  const [menuTextColor, setMenuTextColor] = useState(
    localStorage.getItem('menuTextColor') || '#ffffff'
  );

  const handleSystemNameSave = () => {
    localStorage.setItem('systemName', systemName);
    toast.success('Systemname wurde gespeichert');
    window.dispatchEvent(new CustomEvent('systemNameChanged', { detail: systemName }));
  };

  const handleColorsSave = () => {
    localStorage.setItem('menuBackgroundColor', menuBackgroundColor);
    localStorage.setItem('menuTextColor', menuTextColor);
    toast.success('Farbeinstellungen wurden gespeichert');
    window.dispatchEvent(new CustomEvent('systemColorsChanged', { 
      detail: { backgroundColor: menuBackgroundColor, textColor: menuTextColor }
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Bitte wählen Sie eine Bilddatei aus');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Datei ist zu groß. Maximale Größe: 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        localStorage.setItem('systemLogo', result);
        toast.success('Logo wurde hochgeladen');
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('systemLogoChanged', { detail: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setLogoUrl('');
    localStorage.removeItem('systemLogo');
    toast.success('Logo wurde entfernt');
    window.dispatchEvent(new CustomEvent('systemLogoChanged', { detail: '' }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Systemname</CardTitle>
          <CardDescription>
            Passen Sie den Namen der Anwendung an, der im Menü angezeigt wird
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemName">Anwendungsname</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Feuerwehr Inventar"
            />
          </div>
          <Button onClick={handleSystemNameSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Logo</CardTitle>
          <CardDescription>
            Laden Sie ein Logo hoch, das im Menü angezeigt wird (max. 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="space-y-2">
              <Label>Aktuelles Logo</Label>
              <div className="flex items-center gap-4">
                <img 
                  src={logoUrl} 
                  alt="System Logo" 
                  className="h-12 w-12 object-contain rounded border"
                />
                <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                  Entfernen
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="logoUpload">Logo hochladen</Label>
            <div className="flex items-center gap-2">
              <Input
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('logoUpload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Logo auswählen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Menü-Farbeinstellungen
          </CardTitle>
          <CardDescription>
            Passen Sie die Farben des Menüs an Ihre Corporate Identity an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menuBackgroundColor">Hintergrundfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="menuBackgroundColor"
                  type="color"
                  value={menuBackgroundColor}
                  onChange={(e) => setMenuBackgroundColor(e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={menuBackgroundColor}
                  onChange={(e) => setMenuBackgroundColor(e.target.value)}
                  placeholder="#1e293b"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="menuTextColor">Textfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="menuTextColor"
                  type="color"
                  value={menuTextColor}
                  onChange={(e) => setMenuTextColor(e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={menuTextColor}
                  onChange={(e) => setMenuTextColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded border" style={{ 
            backgroundColor: menuBackgroundColor, 
            color: menuTextColor 
          }}>
            <p className="text-sm">Vorschau des Menüs mit den gewählten Farben</p>
          </div>
          
          <Button onClick={handleColorsSave}>
            <Save className="h-4 w-4 mr-2" />
            Farbeinstellungen speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
