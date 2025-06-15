import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { AutoMaintenanceGenerator } from "@/components/maintenance/AutoMaintenanceGenerator";
import { SystemNameSettings } from "./SystemNameSettings";
import { LogoSettings } from "./LogoSettings";
import { MenuColorSettings } from "./MenuColorSettings";
import { CronJobMonitoring } from "./CronJobMonitoring";
import { SystemBackupSettings } from "./SystemBackupSettings";

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
      <SystemNameSettings 
        systemName={systemName}
        onSystemNameChange={setSystemName}
      />

      <LogoSettings
        logoPreview={logoPreview}
        logoSize={logoSize}
        onLogoChange={handleLogoChange}
        onLogoSizeChange={setLogoSize}
      />

      <MenuColorSettings
        backgroundColor={backgroundColor}
        textColor={textColor}
        selectedColor={selectedColor}
        onBackgroundColorChange={setBackgroundColor}
        onTextColorChange={setTextColor}
        onSelectedColorChange={setSelectedColor}
      />

      <AutoMaintenanceGenerator />

      <CronJobMonitoring />

      {/* --- Backup/Restore Section --- */}
      <SystemBackupSettings />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
