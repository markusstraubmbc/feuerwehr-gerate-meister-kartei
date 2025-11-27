
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { SystemNameSettings } from "./SystemNameSettings";
import { LogoSettings } from "./LogoSettings";
import { MenuColorSettings } from "./MenuColorSettings";
import { SystemBackupSettings } from "./SystemBackupSettings";
import { HelpContactSettings } from "./HelpContactSettings";

const DEFAULT_COLORS = {
  menuBackground: "#1e293b",
  menuText: "#ffffff",
  menuSelected: "#3b82f6",
};

const SystemSettings = () => {
  const { data: settings = {}, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  
  const [systemName, setSystemName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoSize, setLogoSize] = useState('48');
  const [logoWidth, setLogoWidth] = useState('48');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [serviceHours, setServiceHours] = useState('');
  const [otherInfo, setOtherInfo] = useState('');
  const [legalInfo, setLegalInfo] = useState('');

  useEffect(() => {
    if (!isLoading && settings) {
      setSystemName(settings.companyName || 'Feuerwehr Inventar');
      setDomainName(settings.domainName || '');
      setLogoPreview(settings.companyLogo || '');
      setLogoSize(settings.logoSize || '48');
      setLogoWidth(settings.logoWidth || '48');
      setBackgroundColor(settings.menuBackgroundColor || '#1e293b');
      setTextColor(settings.menuTextColor || '#ffffff');
      setSelectedColor(settings.menuSelectedColor || '#3b82f6');
      setContactPerson(settings.contactPerson || 'IT-Support Team');
      setContactPhone(settings.contactPhone || '+49 123 456789');
      setContactEmail(settings.contactEmail || 'support@feuerwehr-inventar.de');
      setServiceHours(settings.serviceHours || 'Mo-Fr: 8:00-17:00 Uhr\nSa: 9:00-13:00 Uhr');
      setOtherInfo(settings.otherInfo || 'Bei technischen Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.\n\nSystem-Version: 1.0.0\nLetztes Update: ' + new Date().toLocaleDateString('de-DE'));
      setLegalInfo(settings.legalInfo || 'Feuerwehr-Inventarsystem\nEntwickelt für die Feuerwehr\n\nDatenschutz: Alle Daten werden DSGVO-konform verarbeitet.\nImpressum: Kontaktieren Sie uns für weitere Informationen.');
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

      // Save domain name
      await updateSetting.mutateAsync({
        key: 'domainName',
        value: domainName
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
      
      // Save logo width
      await updateSetting.mutateAsync({
        key: 'logoWidth',
        value: logoWidth
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
      
      // Save help/contact settings
      await updateSetting.mutateAsync({
        key: 'contactPerson',
        value: contactPerson
      });
      
      await updateSetting.mutateAsync({
        key: 'contactPhone',
        value: contactPhone
      });
      
      await updateSetting.mutateAsync({
        key: 'contactEmail',
        value: contactEmail
      });
      
      await updateSetting.mutateAsync({
        key: 'serviceHours',
        value: serviceHours
      });
      
      await updateSetting.mutateAsync({
        key: 'otherInfo',
        value: otherInfo
      });
      
      await updateSetting.mutateAsync({
        key: 'legalInfo',
        value: legalInfo
      });

      toast.success('Systemeinstellungen wurden gespeichert');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Fehler beim Speichern der Systemeinstellungen');
    }
  };

  const handleReset = () => {
    setBackgroundColor(DEFAULT_COLORS.menuBackground);
    setTextColor(DEFAULT_COLORS.menuText);
    setSelectedColor(DEFAULT_COLORS.menuSelected);
    toast.info("Farben werden beim Speichern zurückgesetzt");
  };

  if (isLoading) {
    return <div>Lade Einstellungen...</div>;
  }

  return (
    <div className="space-y-6">
      <SystemNameSettings 
        systemName={systemName}
        onSystemNameChange={setSystemName}
        domainName={domainName}
        onDomainNameChange={setDomainName}
      />

      <LogoSettings
        logoPreview={logoPreview}
        logoSize={logoSize}
        logoWidth={logoWidth}
        onLogoChange={handleLogoChange}
        onLogoSizeChange={setLogoSize}
        onLogoWidthChange={setLogoWidth}
      />

      <MenuColorSettings
        backgroundColor={backgroundColor}
        textColor={textColor}
        selectedColor={selectedColor}
        onBackgroundColorChange={setBackgroundColor}
        onTextColorChange={setTextColor}
        onSelectedColorChange={setSelectedColor}
        onReset={handleReset}
      />

      <SystemBackupSettings />
      
      <HelpContactSettings
        contactPerson={contactPerson}
        contactPhone={contactPhone}
        contactEmail={contactEmail}
        serviceHours={serviceHours}
        otherInfo={otherInfo}
        legalInfo={legalInfo}
        onContactPersonChange={setContactPerson}
        onContactPhoneChange={setContactPhone}
        onContactEmailChange={setContactEmail}
        onServiceHoursChange={setServiceHours}
        onOtherInfoChange={setOtherInfo}
        onLegalInfoChange={setLegalInfo}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
