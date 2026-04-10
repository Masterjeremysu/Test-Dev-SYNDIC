// CoproSync Service Worker v6 PRO — Cache SPA & Push Notifications
const CACHE_NAME = 'coprosync-v6'; // <-- V6 pour forcer la purge de l'ancien code buggé
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/app.css',
  '/icon-192.png',
  '/favicon-32.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// ── STRATÉGIE DE CACHE & ROUTAGE SPA ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Ignorer Supabase et les extensions
  if (url.hostname.includes('supabase.co')) return;
  if (url.protocol === 'chrome-extension:') return;

  // 2. Navigation SPA (Network First)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(networkResponse => {
        // 🔥 On clone IMMÉDIATEMENT la réponse
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 3. Assets (JS, CSS, Images) -> Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cachedResponse => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          // 🔥 FIX CRITIQUE : Cloner la réponse de façon synchrone AVANT l'ouverture asynchrone du cache
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse; // On retourne l'original au navigateur
      }).catch(error => {
        console.warn('[SW] Fetch failed:', error);
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'info', ticketId: null };
  try { 
    if (e.data) data = { ...data, ...e.data.json() }; 
  } catch(_) {}

  const icons = { critique:'🔴', mention:'🏷', commentaire:'💬', statut_change:'📋', nouveau_ticket:'🚨' };
  const icon = icons[data.type] || '🔔';

  e.waitUntil(
    self.registration.showNotification(`${icon} ${data.title}`, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: data.ticketId || 'coprosync_general',
      data: { ticketId: data.ticketId },
      vibrate: [200, 100, 200],
      requireInteraction: data.type === 'critique' || data.type === 'mention',
    })
  );
});

// ── CLIC SUR NOTIF → Ouvre l'app ou focus l'onglet existant ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  
  const ticketId = e.notification.data?.ticketId;
  const url = ticketId ? `/?p=tickets&open=${ticketId}` : '/';
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (ticketId) {
            client.postMessage({ type: 'OPEN_TICKET', ticketId });
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
