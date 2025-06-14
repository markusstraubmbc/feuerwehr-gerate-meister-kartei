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
    // Prüfe ob Push-Benachrichtigungen unterstützt werden
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      console.log('Push-Benachrichtigungen werden unterstützt');
      
      // Prüfe bestehende Subscription
      checkExistingSubscription();
    } else {
      console.log('Push-Benachrichtigungen werden nicht unterstützt');
      setPushSupported(false);
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setPushEnabled(true);
            localStorage.setItem('pushSubscription', JSON.stringify(subscription));
            console.log('Bestehende Push-Subscription gefunden:', subscription);
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Prüfen der bestehenden Subscription:', error);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      return;
    }

    setIsSubscribing(true);

    try {
      // Schritt 1: Service Worker registrieren
      console.log('Registriere Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker erfolgreich registriert:', registration);
      
      // Warten bis Service Worker aktiv ist
      if (registration.installing) {
        console.log('Service Worker wird installiert...');
        await new Promise<void>((resolve) => {
          const checkState = () => {
            if (registration.installing?.state === 'installed') {
              resolve();
            } else {
              registration.installing?.addEventListener('statechange', checkState);
            }
          };
          checkState();
        });
      }
      
      await navigator.serviceWorker.ready;
      console.log('Service Worker ist bereit');
      
      // Schritt 2: Notification-Berechtigung anfordern
      console.log('Fordere Notification-Berechtigung an...');
      const permission = await Notification.requestPermission();
      console.log('Notification-Berechtigung:', permission);
      
      if (permission === 'granted') {
        try {
          // Schritt 3: Push-Subscription erstellen
          console.log('Erstelle Push-Subscription...');
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_CONFIG.publicKey)
          });

          console.log('Push-Subscription erfolgreich erstellt:', subscription);
          
          // Subscription speichern
          localStorage.setItem('pushSubscription', JSON.stringify(subscription));
          setPushEnabled(true);
          
          toast.success('Push-Benachrichtigungen wurden erfolgreich aktiviert!');
          
          // Test-Benachrichtigung anzeigen
          showTestNotification();
          
        } catch (subscriptionError) {
          console.error('Fehler beim Erstellen der Push-Subscription:', subscriptionError);
          toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen: ' + subscriptionError.message);
        }
      } else if (permission === 'denied') {
        toast.error('Push-Benachrichtigungen wurden abgelehnt. Bitte aktivieren Sie diese in den Browser-Einstellungen.');
      } else {
        toast.error('Push-Benachrichtigungen wurden nicht gewährt.');
      }
    } catch (error) {
      console.error('Allgemeiner Fehler bei Push-Setup:', error);
      toast.error('Fehler beim Setup der Push-Benachrichtigungen: ' + (error as Error).message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const disablePushNotifications = async () => {
    try {
      console.log('Deaktiviere Push-Benachrichtigungen...');
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('Push-Subscription erfolgreich entfernt');
        }
      }
      
      localStorage.removeItem('pushSubscription');
      setPushEnabled(false);
      toast.success('Push-Benachrichtigungen wurden deaktiviert');
    } catch (error) {
      console.error('Fehler beim Deaktivieren der Push-Benachrichtigungen:', error);
      // Trotzdem als deaktiviert markieren
      setPushEnabled(false);
      localStorage.removeItem('pushSubscription');
      toast.success('Push-Benachrichtigungen wurden deaktiviert');
    }
  };

  const showTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Feuerwehr Inventar', {
        body: 'Push-Benachrichtigungen sind jetzt aktiv! 🚒',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'activation-notification'
      });
    }
  };

  const testNotification = async () => {
    if (!pushEnabled) {
      toast.error('Push-Benachrichtigungen sind nicht aktiviert');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('Test Benachrichtigung', {
          body: 'Dies ist eine Test-Benachrichtigung für Ihr Feuerwehr Inventar System 🔧',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: true
        });
        
        toast.success('Test-Benachrichtigung wurde gesendet!');
      }
    } catch (error) {
      console.error('Fehler beim Anzeigen der Test-Benachrichtigung:', error);
      toast.error('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4" />
        <h3 className="font-medium">Push-Benachrichtigungen</h3>
      </div>
      
      {!pushSupported ? (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm text-orange-700">
            Push-Benachrichtigungen werden von diesem Browser nicht unterstützt.
            Bitte verwenden Sie einen modernen Browser wie Chrome, Firefox oder Safari.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-enabled">Push-Benachrichtigungen aktivieren</Label>
              <p className="text-xs text-muted-foreground">
                Erhalten Sie wichtige Wartungserinnerungen direkt auf Ihr Gerät
              </p>
            </div>
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
              className="w-full"
            >
              {isSubscribing ? 'Aktiviere Push-Benachrichtigungen...' : 'Jetzt Push-Benachrichtigungen aktivieren'}
            </Button>
          )}

          {pushEnabled && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">
                  ✅ Push-Benachrichtigungen sind aktiv
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Sie erhalten automatisch Benachrichtigungen für anstehende Wartungen
                </p>
              </div>
              
              <Button 
                onClick={testNotification}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Test-Benachrichtigung senden
              </Button>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>Hinweis:</strong> Für Push-Benachrichtigungen muss die Website in einem Tab geöffnet bleiben oder der Service Worker aktiv sein.</p>
            <p className="mt-1"><strong>Kontakt:</strong> {VAPID_CONFIG.subject.replace('mailto:', '')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
