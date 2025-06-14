
import { useState, useEffect } from "react";
import { Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VAPID_CONFIG = {
  subject: "mailto:Markus@straub-it.de",
  publicKey: "BHelbGy6nyzF3RegIl3ETlXIn-iPLf90FNCrDqL58PxnLaiJxqaNkUmvpa6_MiZAdPtJ3UtkSVVpSHvjSnYi3-E",
  privateKey: "lS1qvgHyJIPc8tH4MCj0xqcqvPmuCjSD_IdzLIlH7Z0"
};

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

export function PushNotificationSettings() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      
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
        
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_CONFIG.publicKey)
        });

        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        console.log('Push subscription created:', subscription);
        
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

  return (
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
  );
}
