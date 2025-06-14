
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
      
      // Check if notifications are already granted
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
        
        // Check if we have an active subscription
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
              setPushEnabled(true);
              localStorage.setItem('pushSubscription', JSON.stringify(subscription));
            }
          });
        });
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
      // Register service worker first
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_CONFIG.publicKey)
        });

        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        console.log('Push subscription created:', subscription);
        
        setPushEnabled(true);
        toast.success('Push-Benachrichtigungen wurden aktiviert');
        
        // Show test notification
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
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen: ' + error.message);
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
          console.log('Push subscription removed');
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

  const testNotification = () => {
    if (pushEnabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Test Benachrichtigung', {
          body: 'Dies ist eine Test-Benachrichtigung für Ihr Feuerwehr Inventar System',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification'
        });
      });
    } else {
      toast.error('Push-Benachrichtigungen sind nicht aktiviert');
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

          {pushEnabled && (
            <Button 
              onClick={testNotification}
              variant="outline"
              size="sm"
            >
              Test-Benachrichtigung senden
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
