
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationTypes {
  overdue: boolean;
  upcoming: boolean;
  missions: boolean;
  equipment: boolean;
}

export function NotificationTypesSettings() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationTypes>({
    overdue: true,
    upcoming: true,
    missions: true,
    equipment: false
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedTypes = localStorage.getItem('notificationTypes');
    if (savedTypes) {
      try {
        setNotificationTypes(JSON.parse(savedTypes));
      } catch (error) {
        console.error('Error loading notification types:', error);
      }
    }
  }, []);

  const updateNotificationType = (type: keyof NotificationTypes, enabled: boolean) => {
    const newTypes = { ...notificationTypes, [type]: enabled };
    setNotificationTypes(newTypes);
    localStorage.setItem('notificationTypes', JSON.stringify(newTypes));
    
    const typeNames = {
      overdue: 'Überfällige Wartungen',
      upcoming: 'Anstehende Wartungen',
      missions: 'Neue Einsätze/Übungen',
      equipment: 'Neue Ausrüstung'
    };
    
    toast.success(`${typeNames[type]} ${enabled ? 'aktiviert' : 'deaktiviert'}`);
  };

  const resetToDefaults = () => {
    const defaultTypes = {
      overdue: true,
      upcoming: true,
      missions: true,
      equipment: false
    };
    setNotificationTypes(defaultTypes);
    localStorage.setItem('notificationTypes', JSON.stringify(defaultTypes));
    toast.success('Benachrichtigungstypen auf Standard zurückgesetzt');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <h3 className="font-medium">Benachrichtigungstypen</h3>
        </div>
        <Button onClick={resetToDefaults} variant="outline" size="sm">
          Standard wiederherstellen
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="overdue-notifications">Überfällige Wartungen</Label>
          <Switch 
            id="overdue-notifications" 
            checked={notificationTypes.overdue}
            onCheckedChange={(checked) => updateNotificationType('overdue', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="upcoming-notifications">Anstehende Wartungen (7 Tage vorher)</Label>
          <Switch 
            id="upcoming-notifications" 
            checked={notificationTypes.upcoming}
            onCheckedChange={(checked) => updateNotificationType('upcoming', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="mission-notifications">Neue Einsätze/Übungen</Label>
          <Switch 
            id="mission-notifications" 
            checked={notificationTypes.missions}
            onCheckedChange={(checked) => updateNotificationType('missions', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="equipment-notifications">Neue Ausrüstung hinzugefügt</Label>
          <Switch 
            id="equipment-notifications" 
            checked={notificationTypes.equipment}
            onCheckedChange={(checked) => updateNotificationType('equipment', checked)}
          />
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Diese Einstellungen bestimmen, für welche Ereignisse Sie Benachrichtigungen erhalten möchten.</p>
      </div>
    </div>
  );
}
