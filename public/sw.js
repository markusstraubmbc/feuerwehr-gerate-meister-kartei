
// Service Worker für Push-Benachrichtigungen - Feuerwehr Inventar System
const CACHE_NAME = 'feuerwehr-inventar-v1';

// VAPID-Konfiguration
const VAPID_CONFIG = {
  subject: "mailto:Markus@straub-it.de",
  publicKey: "BHelbGy6nyzF3RegIl3ETlXIn-iPLf90FNCrDqL58PxnLaiJxqaNkUmvpa6_MiZAdPtJ3UtkSVVpSHvjSnYi3-E",
  privateKey: "lS1qvgHyJIPc8tH4MCj0xqcqvPmuCjSD_IdzLIlH7Z0"
};

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker wird installiert...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache geöffnet:', CACHE_NAME);
      return cache.addAll([
        '/',
        '/favicon.ico'
      ]);
    })
  );
  
  // Sofort aktivieren
  self.skipWaiting();
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
  console.log('Service Worker wird aktiviert...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Lösche alten Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Sofort alle Tabs übernehmen
      return self.clients.claim();
    })
  );
});

// Push-Ereignis behandeln
self.addEventListener('push', (event) => {
  console.log('Push-Benachrichtigung empfangen:', event);
  
  let notificationData = {
    title: 'Feuerwehr Inventar',
    body: 'Sie haben eine neue Benachrichtigung',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'maintenance-notification'
  };

  // Daten aus der Push-Nachricht extrahieren, falls vorhanden
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      console.log('Fehler beim Parsen der Push-Daten:', error);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'Anzeigen',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ],
    requireInteraction: true,
    vibrate: [100, 50, 100],
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification-Click behandeln
self.addEventListener('notificationclick', (event) => {
  console.log('Benachrichtigung wurde geklickt:', event);
  
  // Benachrichtigung schließen
  event.notification.close();
  
  // Je nach Aktion unterschiedlich handeln
  if (event.action === 'view') {
    // App öffnen oder fokussieren
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Prüfen ob die App bereits offen ist
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Neue Instanz öffnen, falls nicht bereits offen
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'close') {
    // Nur schließen - bereits oben erledigt
    console.log('Benachrichtigung wurde geschlossen');
  } else {
    // Standard-Click ohne spezifische Aktion - App öffnen
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Push-Subscription-Change behandeln
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push-Subscription hat sich geändert');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_CONFIG.publicKey)
    }).then(subscription => {
      console.log('Neue Push-Subscription erstellt:', subscription);
      // In einer echten Anwendung würde hier die neue Subscription an den Server gesendet
      return subscription;
    }).catch(error => {
      console.error('Fehler beim Erneuern der Push-Subscription:', error);
    })
  );
});

// Fetch-Events für Caching (optional)
self.addEventListener('fetch', (event) => {
  // Nur für GET-Requests und gleiche Origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache-Hit - gebe gecachte Version zurück
      if (response) {
        return response;
      }

      // Cache-Miss - hole vom Netzwerk und cache es
      return fetch(event.request).then(response => {
        // Prüfe ob wir eine gültige Response haben
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone die Response für den Cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Fallback für Offline-Modus
      return caches.match('/');
    })
  );
});

// Helper-Funktion für VAPID-Key-Konvertierung
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Debugging-Informationen
console.log('Service Worker geladen für Feuerwehr Inventar System');
console.log('VAPID Public Key:', VAPID_CONFIG.publicKey);
