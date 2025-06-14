import { useState, useEffect } from "react";
import { Bell, Smartphone, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PersonalizedNotificationSettings } from "./PersonalizedNotificationSettings";

// VAPID configuration
const VAPID_CONFIG = {
  subject: "mailto:Markus@straub-it.de",
  publicKey: "BHelbGy6nyzF3RegIl3ETlXIn-iPLf90FNCrDqL58PxnLaiJxqaNkUmvpa6_MiZAdPtJ3UtkSVVpSHvjSnYi3-E",
  privateKey: "lS1qvgHyJIPc8tH4MCj0xqcqvPmuCjSD_IdzLIlH7Z0"
};

export function NotificationSettings() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      
      // Check current permission status
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      }
    }
  }, []);

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      return;
    }

    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Push-Benachrichtigungen wurden aktiviert');
        
        // Register service worker and create push subscription
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_CONFIG.publicKey)
        });

        // Store subscription in localStorage for now (in production, send to server)
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        console.log('Push subscription created:', subscription);
        
        // Show a test notification
        new Notification('Feuerwehr Inventar', {
          body: 'Push-Benachrichtigungen sind jetzt aktiv!',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
        
      } else {
        toast.error('Push-Benachrichtigungen wurden abgelehnt');
      }
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
    } finally {
      setIsSubscribing(false);
    }
  };

  const disablePushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          localStorage.removeItem('pushSubscription');
        }
      }
      setPushEnabled(false);
      toast.success('Push-Benachrichtigungen wurden deaktiviert');
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      setPushEnabled(false);
      toast.success('Push-Benachrichtigungen wurden deaktiviert');
    }
  };

  const saveEmailSettings = () => {
    // In a real app, you would save these settings to your backend
    localStorage.setItem('emailNotifications', JSON.stringify({
      enabled: emailNotifications,
      email: notificationEmail
    }));
    toast.success('E-Mail-Einstellungen wurden gespeichert');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Allgemeine Benachrichtigungseinstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <h3 className="font-medium">Push-Benachrichtigungen</h3>
            </div>
            
            {!pushSupported ? (
              <p className="text-sm text-muted-foreground">
                Push-Benachrichtigungen werden von diesem Browser nicht unterstützt
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled">Push-Benachrichtigungen aktivieren</Label>
                  <Switch
                    id="push-enabled"
                    checked={pushEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        requestPushPermission();
                      } else {
                        disablePushNotifications();
                      }
                    }}
                    disabled={isSubscribing}
                  />
                </div>
                
                {!pushEnabled && (
                  <Button 
                    onClick={requestPushPermission}
                    disabled={isSubscribing}
                    variant="outline"
                    size="sm"
                  >
                    {isSubscribing ? 'Aktiviere...' : 'Push-Benachrichtigungen aktivieren'}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Erhalten Sie Push-Benachrichtigungen für wichtige Wartungstermine und Erinnerungen direkt auf Ihr Gerät.
                </p>
                
                <div className="text-xs text-muted-foreground">
                  <strong>Kontakt:</strong> {VAPID_CONFIG.subject.replace('mailto:', '')}
                </div>
              </div>
            )}
          </div>

          {/* Email Notifications */}
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

          {/* Notification Types */}
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
        </CardContent>
      </Card>

      <PersonalizedNotificationSettings />
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
