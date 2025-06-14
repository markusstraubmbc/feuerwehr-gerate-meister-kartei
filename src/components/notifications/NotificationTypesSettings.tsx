
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationTypesSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <h3 className="font-medium">Benachrichtigungstypen</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="overdue-notifications">Überfällige Wartungen</Label>
          <Switch id="overdue-notifications" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="upcoming-notifications">Anstehende Wartungen (7 Tage vorher)</Label>
          <Switch id="upcoming-notifications" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="mission-notifications">Neue Einsätze/Übungen</Label>
          <Switch id="mission-notifications" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="equipment-notifications">Neue Ausrüstung hinzugefügt</Label>
          <Switch id="equipment-notifications" />
        </div>
      </div>
    </div>
  );
}
