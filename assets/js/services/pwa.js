function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    dbg('[SW] enregistre');
    // Demande permission notifications après 3s
    setTimeout(() => askNotifPermission(reg), 3000);
  }).catch(() => {});

  // Ecoute les messages du SW (clic notif → ouvre ticket)
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'OPEN_TICKET' && e.data.ticketId) {
      openDetail(e.data.ticketId);
    }
  });

  // Install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      if (deferredPrompt) toast('📱 Installez l\'app pour un accès rapide depuis votre téléphone', 'warn');
    }, 30000);
  });
}

async function askNotifPermission(reg) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    dbg('[Push] permission deja accordee');
    return;
  }
  if (Notification.permission === 'denied') return;
  // Demande discrète
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    dbg('[Push] permission accordee');
    toast('🔔 Notifications activées — vous serez alerté même hors de l\'app !', 'ok');
  }
}

// Envoie une notif push locale via le SW
async function pushNotif(title, body, type, ticketId) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(`${({critique:'🔴',mention:'🏷',commentaire:'💬',statut_change:'📋',nouveau_ticket:'🚨'}[type]||'🔔')} ${title}`, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: ticketId || 'coprosync',
      data: { ticketId },
      vibrate: [200, 100, 200],
      requireInteraction: type === 'critique' || type === 'mention',
    });
  } catch(e) { warn('[Push] erreur:', e); }
}

// Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $('login-screen')?.style.display !== 'none') doAuth();
});
