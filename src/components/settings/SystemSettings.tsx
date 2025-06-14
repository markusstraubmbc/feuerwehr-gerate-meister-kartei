
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";

const SystemSettings = () => {
  const { data: settings = {}, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  
  const [systemName, setSystemName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoSize, setLogoSize] = useState('48');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  useEffect(() => {
    if (!isLoading && settings) {
      setSystemName(settings.companyName || 'Feuerwehr Inventar');
      setLogoPreview(settings.companyLogo || '');
      setLogoSize(settings.logoSize || '48');
      setBackgroundColor(settings.menuBackgroundColor || '#1e293b');
      setTextColor(settings.menuTextColor || '#ffffff');
      setSelectedColor(settings.menuSelectedColor || '#3b82f6');
    }
  }, [settings, isLoading]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Save system name
      await updateSetting.mutateAsync({
        key: 'companyName',
        value: systemName
      });
      
      // Save logo if one was selected
      if (logoPreview) {
        await updateSetting.mutateAsync({
          key: 'companyLogo',
          value: logoPreview
        });
      }
      
      // Save logo size
      await updateSetting.mutateAsync({
        key: 'logoSize',
        value: logoSize
      });
      
      // Save colors
      await updateSetting.mutateAsync({
        key: 'menuBackgroundColor',
        value: backgroundColor
      });
      
      await updateSetting.mutateAsync({
        key: 'menuTextColor',
        value: textColor
      });
      
      await updateSetting.mutateAsync({
        key: 'menuSelectedColor',
        value: selectedColor
      });

      toast.success('Systemeinstellungen wurden gespeichert');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Fehler beim Speichern der Systemeinstellungen');
    }
  };

  if (isLoading) {
    return <div>Lade Einstellungen...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Systemname</CardTitle>
          <CardDescription>Anpassen des Systemnamens, der in der Seitenleiste angezeigt wird</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="system-name">Systemname</Label>
            <Input
              id="system-name"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Feuerwehr Inventar"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Upload eines Logos für das System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo-Datei</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo-size">Logo-Größe (Pixel)</Label>
            <Input
              id="logo-size"
              type="number"
              min="16"
              max="200"
              value={logoSize}
              onChange={(e) => setLogoSize(e.target.value)}
              placeholder="48"
            />
            <p className="text-sm text-muted-foreground">
              Empfohlene Größe: 48-96 Pixel
            </p>
          </div>
          
          {logoPreview && (
            <div className="space-y-2">
              <Label>Vorschau</Label>
              <div className="p-4 border rounded-md bg-muted/50">
                <img 
                  src={logoPreview} 
                  alt="Logo Vorschau" 
                  style={{ 
                    width: `${logoSize}px`, 
                    height: `${logoSize}px`,
                    objectFit: 'contain'
                  }}
                  className="rounded"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menü-Farbeinstellungen</CardTitle>
          <CardDescription>Anpassen der Farben für die Seitenleiste</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background-color">Hintergrundfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="background-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-10 p-1 border"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#1e293b"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-color">Textfarbe</Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-16 h-10 p-1 border"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="selected-color">Farbe für ausgewähltes Menü</Label>
            <div className="flex gap-2">
              <Input
                id="selected-color"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-16 h-10 p-1 border"
              />
              <Input
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="p-4 border rounded-md" style={{ backgroundColor }}>
            <div className="space-y-2">
              <div 
                className="p-2 rounded"
                style={{ color: textColor }}
              >
                Normal Menüeintrag
              </div>
              <div 
                className="p-2 rounded"
                style={{ backgroundColor: selectedColor, color: '#ffffff' }}
              >
                Ausgewählter Menüeintrag
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
