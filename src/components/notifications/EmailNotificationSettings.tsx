
import { useState } from "react";
import { Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EmailNotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");

  const saveEmailSettings = () => {
    localStorage.setItem('emailNotifications', JSON.stringify({
      enabled: emailNotifications,
      email: notificationEmail
    }));
    toast.success('E-Mail-Einstellungen wurden gespeichert');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <h3 className="font-medium">E-Mail-Benachrichtigungen</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled">E-Mail-Benachrichtigungen aktivieren</Label>
          <Switch
            id="email-enabled"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
        
        {emailNotifications && (
          <div className="space-y-2">
            <Label htmlFor="notification-email">E-Mail-Adresse</Label>
            <div className="flex gap-2">
              <Input
                id="notification-email"
                type="email"
                placeholder="ihre.email@feuerwehr.de"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
              />
              <Button onClick={saveEmailSettings} variant="outline" size="sm">
                Speichern
              </Button>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Erhalten Sie E-Mail-Benachrichtigungen für überfällige Wartungen und wichtige Erinnerungen.
        </p>
      </div>
    </div>
  );
}
