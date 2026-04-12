// CoproSync SW v5 — Cache Stratégique + Offline First
// Remplace sw.js à la racine du projet

const CACHE_STATIC  = 'coprosync-static-v6';
const CACHE_RUNTIME = 'coprosync-runtime-v6';
const MAX_RUNTIME   = 60;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/app.css',
  '/assets/js/core/config.js',
  '/assets/js/core/helpers.js',
  '/assets/js/core/state.js',
  '/assets/js/core/permissions.js',
  '/assets/js/core/app-start.js',
  '/assets/js/services/data-loaders.js',
  '/assets/js/features/navigation/navigation.js',
  '/assets/js/features/ui/modal.js',
  '/assets/js/features/ui/render-router.js',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
];

// ── INSTALL ──────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  const VALID = new Set([CACHE_STATIC, CACHE_RUNTIME]);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !VALID.has(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // POST/non-GET → toujours réseau
  if (request.method !== 'GET') return;

  // Supabase API → Network First (données toujours fraîches)
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(networkFirst(request, false));
    return;
  }

  // Fonts Google → Cache First longue durée
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    e.respondWith(cacheFirst(request, CACHE_RUNTIME));
    return;
  }

  // CDN tiers (Leaflet, Supabase JS, QRCode, XLSX...) → Cache First
  if (
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('unpkg.com')
  ) {
    e.respondWith(cacheFirst(request, CACHE_RUNTIME));
    return;
  }

  // Assets locaux JS/CSS → Cache First avec revalidation
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Navigation HTML → Network First avec fallback offline
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request, true));
    return;
  }

  // Photos/Storage Supabase → Cache puis réseau
  if (url.hostname.includes('storage')) {
    e.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Tout le reste → Stale While Revalidate
  e.respondWith(staleWhileRevalidate(request));
});

// ── STRATÉGIES ────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await putInCache(cacheName, request, response.clone());
    return response;
  } catch {
    return offlineFallback(request);
  }
}

async function networkFirst(request, isNavigation) {
  try {
    const response = await fetch(request);
    if (response.ok) await putInCache(CACHE_RUNTIME, request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isNavigation) {
      const fallback = await caches.match('/index.html');
      return fallback || offlineFallback(request);
    }
    return offlineFallback(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_RUNTIME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(async response => {
    if (response.ok) {
      await pruneCache(cache);
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached || offlineFallback(request));
  return cached || fetchPromise;
}

async function putInCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await pruneCache(cache);
  await cache.put(request, response);
}

async function pruneCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME) {
    // Supprimer les 5 plus vieilles entrées
    await Promise.all(keys.slice(0, 5).map(k => cache.delete(k)));
  }
}

function offlineFallback(request) {
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f5f4f1"/><text x="50" y="55" text-anchor="middle" fill="#9b9890" font-size="12">Hors ligne</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  if (request.headers.get('Accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Vous êtes hors ligne' }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 }
    );
  }
  return new Response('Hors ligne — CoproSync', { status: 503 });
}

// ── PUSH NOTIFICATIONS ───────────────────────────────────────────────
const NOTIF_ICONS = {
  ticket_critique: '🔴', nouveau_ticket: '🚨', commentaire: '💬',
  mention: '🏷️', statut_change: '📋', message_prive: '🔒',
  message_canal: '💬', vote: '🗳️', annonce: '📢', document: '📄',
};

self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'default', ticketId: null };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch(_) {}

  const icon = NOTIF_ICONS[data.type] || '🔔';
  e.waitUntil(
    self.registration.showNotification(`${icon} ${data.title}`, {
      body:               data.body,
      icon:               '/icon-192.png',
      badge:              '/favicon-32.png',
      tag:                data.ticketId || `coprosync-${data.type}`,
      data:               { ticketId: data.ticketId, type: data.type },
      vibrate:            [200, 100, 200],
      requireInteraction: data.type === 'ticket_critique' || data.type === 'mention',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { ticketId, type } = e.notification.data || {};
  const urlMap = {
    ticket_critique:  ticketId ? `/?ticket=${ticketId}` : '/',
    nouveau_ticket:   ticketId ? `/?ticket=${ticketId}` : '/',
    statut_change:    ticketId ? `/?ticket=${ticketId}` : '/',
    commentaire:      ticketId ? `/?ticket=${ticketId}` : '/',
    mention:          ticketId ? `/?ticket=${ticketId}` : '/',
    message_prive:    '/?page=messages',
    message_canal:    '/?page=messages',
    feed_commentaire: '/?page=messages',
    vote:             '/?page=votes',
    annonce:          '/?page=annonces',
    document:         '/?page=documents',
  };
  const targetUrl = urlMap[type] || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if (ticketId) existing.postMessage({ type: 'OPEN_TICKET', ticketId });
        else if (type) existing.postMessage({ type: 'OPEN_PAGE', page: targetUrl.replace('/?page=', '') });
        return;
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── MESSAGE depuis l'app ──────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CACHE_URLS') {
    const urls = e.data.urls || [];
    caches.open(CACHE_RUNTIME).then(c => c.addAll(urls));
  }
});
