// CoproSync SW v3 — Push Notifications
const V = 'coprosync-v3';
const CACHE = ['/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'info', ticketId: null };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch(_) {}

  const icons = { critique:'🔴', mention:'🏷', commentaire:'💬', statut_change:'📋', nouveau_ticket:'🚨' };
  const icon = icons[data.type] || '🔔';

  e.waitUntil(
    self.registration.showNotification(`${icon} ${data.title}`, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: data.ticketId || 'coprosync',
      data: { ticketId: data.ticketId },
      vibrate: [200, 100, 200],
      requireInteraction: data.type === 'critique' || data.type === 'mention',
    })
  );
});

// ── CLIC SUR NOTIF → ouvre l'app ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const ticketId = e.notification.data?.ticketId;
  const url = ticketId ? `/?ticket=${ticketId}` : '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'OPEN_TICKET', ticketId });
        return;
      }
      return clients.openWindow(url);
    })
  );
});
