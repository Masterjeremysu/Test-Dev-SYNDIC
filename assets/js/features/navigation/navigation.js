// ════════════════════════════════════════════════════════════════
//  NAVIGATION ROUTER (SPA PWA)
//  assets/js/features/navigation/navigation.js
// ════════════════════════════════════════════════════════════════

function nav(page, noClose, isBackNavigation = false) {
  // 1. CLEANUP — Destruction propre avant de quitter une page
  if (typeof currentPage !== 'undefined') {
    // Nettoyage de la Carte
    if (currentPage === 'map' && page !== 'map') {
      const mapEl = $('map');
      if (mapEl?._resizeObserver) mapEl._resizeObserver.disconnect();
      if (typeof mapInstance !== 'undefined' && mapInstance) { 
        mapInstance.remove(); 
        mapInstance = null; 
        if (typeof mapMarkers !== 'undefined') mapMarkers = []; 
      }
    }
    
    // 🔥 FIX REGISTRE : Nettoyage de la connexion Realtime
    if (currentPage === 'registre' && page !== 'registre') {
      if (typeof _realtimeChan !== 'undefined' && _realtimeChan) {
        if (typeof unsubscribePassages === 'function') {
          unsubscribePassages(_realtimeChan);
        }
        _realtimeChan = null;
      }
    }
  }

  currentPage = page;
  document.body?.setAttribute('data-page', page);
  document.documentElement?.setAttribute('data-page', page);
  if (!noClose) closeSidebar();
  
  // 2. GESTION DU LAYOUT (Padding / MaxWidth)
  const pageEl = $('page');
  if (!pageEl) return;
  
  if (page === 'messages' || page === 'map') {
    pageEl.style.padding = '0';
    pageEl.style.maxWidth = 'none';
  } else {
    pageEl.style.padding = '';
    pageEl.style.maxWidth = '';
  }

  // 3. ANIMATION DE TRANSITION (Effet Fade-in SPA Native)
  pageEl.style.opacity = '0';
  setTimeout(() => {
    pageEl.style.transition = 'opacity 0.25s ease-in-out';
    pageEl.style.opacity = '1';
    setTimeout(() => { pageEl.style.transition = ''; }, 250); // Nettoyage CSS
  }, 30);

  // 4. RESET DU SCROLL (Retour en haut de page fluide)
  const mainEl = $('main');
  if (mainEl && mainEl.scrollTop > 0) {
    mainEl.scrollTo({ top: 0, behavior: 'smooth' }); // Desktop/PWA
  } else if (window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Mobile fallback
  }

  // 5. UPDATE UI (Menu actif & Accessibilité)
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    el.removeAttribute('aria-current');
  });
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (active) {
    active.classList.add('active');
    active.setAttribute('aria-current', 'page'); // A11y standard
  }

  // Barre de navigation du bas (Mobile)
  document.querySelectorAll('.bn-item').forEach(el => el.classList.remove('active'));
  const bnMap = { dashboard:'bn-dashboard', tickets:'bn-tickets', map:'bn-map', messages:'bn-messages' };
  if (bnMap[page]) {
    const bnEl = $(bnMap[page]);
    if (bnEl) bnEl.classList.add('active');
  }

  // 6. TITRE DE LA TOPBAR
  const titles = {
    dashboard:'Vue d\'ensemble', tickets:'Signalements', map:'Carte',
    contrats:'Contrats', cles:'Clés', journal:'Journal', users:'Utilisateurs',
    admin:'Admin · Accès & visibilité', rapport:'Rapport syndic', notifications:'Notifications', profile:'Mon profil',
    messages:'Messages', annonces:'Annonces', agenda:'Agenda',
    contacts:'Contacts & Urgences', documents:'Documents', votes:'Votes & Sondages',
    faq:'FAQ'
  };
  const topbarTitle = $('topbar-title');
  if (topbarTitle) topbarTitle.textContent = titles[page] || page;

  // 7. HISTORIQUE DU NAVIGATEUR (Support du bouton "Retour" natif)
  if (!isBackNavigation && window.history && window.history.pushState) {
    // Si l'utilisateur clique normalement, on crée une nouvelle entrée dans l'historique
    const stateUrl = `?p=${page}`;
    window.history.pushState({ page: page }, titles[page] || page, stateUrl);
  }

  // 8. RENDU FINAL DE LA PAGE
  if (typeof renderPage === 'function') {
    renderPage(page);
  } else {
    console.warn('[nav] renderPage est introuvable.');
  }
}

// ── ÉCOUTEUR BOUTON RETOUR (Mobile & Desktop Back Button) ──
window.addEventListener('popstate', (event) => {
  // Déclenché quand l'utilisateur utilise le bouton retour/suivant du navigateur
  if (event.state && event.state.page) {
    // On passe `true` à `isBackNavigation` pour ne pas recréer d'historique en boucle
    nav(event.state.page, true, true);
  } else {
    // Fallback de sécurité (retour à l'accueil si on a tout remonté)
    nav('dashboard', true, true);
  }
});

// ── SIDEBAR INTERACTIONS ──

function toggleSidebar() {
  const sb = $('sidebar');
  const so = $('so'); // sidebar-overlay
  if (!sb || !so) return;
  
  const isOpen = sb.classList.contains('open');
  if (isOpen) {
    closeSidebar();
  } else {
    sb.classList.add('open');
    so.classList.add('open');
    
    // Bloque le scroll de la page arrière sur mobile pour éviter l'effet élastique iOS
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
  }
}

function closeSidebar() {
  const sb = $('sidebar');
  const so = $('so');
  
  if (sb) sb.classList.remove('open');
  if (so) so.classList.remove('open');
  
  // Rétablit le scroll normal
  document.body.style.overflow = '';
}

// Optionnel: Init History on load (pour gérer l'URL direct comme monsite.com/?p=tickets)
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (p && window.history && window.history.replaceState) {
    // Remplace l'état initial par la vraie page chargée
    window.history.replaceState({ page: p }, '', window.location.href);
  }
});
