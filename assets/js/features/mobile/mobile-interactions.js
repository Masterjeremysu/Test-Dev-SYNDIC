// ════════════════════════════════════════════════════════════════
//  INTERACTIONS MOBILES (Swipe, Pull-to-Refresh)
//  assets/js/features/mobile/mobile-interactions.js
// ════════════════════════════════════════════════════════════════

// ── SWIPE TO CLOSE — Ferme les modals en glissant vers le bas avec fluidité ──
function initSwipeToClose() {
  document.addEventListener('touchstart', e => {
    const modal = e.target.closest('.modal');
    // On s'assure qu'on ne swipe pas sur un textarea ou un slider par erreur
    if (!modal || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    modal._touchStartY = e.touches[0].clientY;
    modal._touchStartScroll = modal.scrollTop;
    modal._overlay = modal.closest('.overlay'); // Pour gérer l'opacité
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    const modal = e.target.closest('.modal');
    if (!modal || modal._touchStartY === undefined) return;
    
    const dy = e.touches[0].clientY - modal._touchStartY;
    
    // Swipe vers le bas uniquement si on est tout en haut du contenu du modal
    if (dy > 0 && modal._touchStartScroll === 0) {
      // Effet de résistance (ralentit la descente)
      const translateY = dy * 0.5;
      modal.style.transform = `translateY(${translateY}px)`;
      modal.style.transition = 'none';
      
      // Amélioration PRO : L'arrière-plan devient transparent en descendant
      if (modal._overlay) {
        const opacity = Math.max(1 - (dy / 300), 0);
        modal._overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.5})`;
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const modal = e.target.closest('.modal');
    if (!modal || modal._touchStartY === undefined) return;
    
    const dy = e.changedTouches[0].clientY - modal._touchStartY;
    modal.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'; // Courbe fluide native
    
    if (dy > 100 && modal._touchStartScroll === 0) {
      // Swipe réussi : on jette le modal vers le bas
      modal.style.transform = 'translateY(100vh)';
      if (modal._overlay) modal._overlay.style.backgroundColor = 'transparent';
      
      // Fermeture propre après l'animation en utilisant la logique existante de l'app
      setTimeout(() => {
        modal.style.transform = '';
        if (modal._overlay) modal._overlay.style.backgroundColor = ''; // Reset CSS
        
        // Clic virtuel sur le bouton "Fermer" pour déclencher vos fonctions de nettoyage
        const closeBtn = modal.querySelector('.mclose');
        if (closeBtn) {
          closeBtn.click();
        } else if (typeof closeModal === 'function' && modal._overlay.id) {
          closeModal(modal._overlay.id);
        } else {
          modal._overlay.classList.remove('open');
          modal._overlay.style.display = 'none';
        }
      }, 250);
      
    } else {
      // Annulation du swipe : le modal rebondit à sa place
      modal.style.transform = 'translateY(0)';
      if (modal._overlay) modal._overlay.style.backgroundColor = '';
      setTimeout(() => { modal.style.transform = ''; }, 300);
    }
    
    modal._touchStartY = undefined;
    modal._overlay = undefined;
  }, { passive: true });
}

// ── PULL TO REFRESH — Avec physique native et retour haptique ──
// ── PULL TO REFRESH — Avec "Vraie Intention" (Longue distance) ──
function initPullToRefresh() {
  let startY = 0;
  let startX = 0;
  let pulling = false;
  let activated = false;

  const page = document.getElementById('page') || document.body;
  if (!page) return;

  // Création unique de l'indicateur SVG (Bulles de chargement)
  let ind = document.getElementById('ptr-indicator');
  if (!ind) {
    ind = document.createElement('div');
    ind.id = 'ptr-indicator';
    ind.style.cssText = `
      position: fixed; top: 60px; left: 50%;
      transform: translate(-50%, -60px) scale(0.8);
      background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb);
      border-radius: 50%; width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); pointer-events: none;
      z-index: 500; opacity: 0; transition: opacity 0.2s; color: var(--text-3, #9ca3af);
    `;
    ind.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="ptr-icon"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.1-5.9L2 9"/></svg>`;
    document.body.appendChild(ind);
  }
  const ptrIcon = document.getElementById('ptr-icon');

  // LA RÈGLE D'OR : Distance physique requise pour valider l'intention (160px)
  const INTENT_THRESHOLD = 160;

  page.addEventListener('touchstart', e => {
    // Déclenche UNIQUEMENT si on est tout en haut
    if (window.scrollY <= 2 && page.scrollTop <= 2) {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      pulling = true;
      activated = false;
    }
  }, { passive: true });

  page.addEventListener('touchmove', e => {
    if (!pulling) return;
    
    const dy = e.touches[0].clientY - startY;
    const dx = Math.abs(e.touches[0].clientX - startX);

    if (dx > 30 && dy < 40) { pulling = false; return; }
    if (dy < 10) return;

    // --- LE CORRECTIF MAGIQUE EST ICI ---
    // On annule le rafraîchissement natif du navigateur de force !
    if (e.cancelable) {
        e.preventDefault(); 
    }
    // ------------------------------------

    ind.style.opacity = '1';

    const pullDistance = Math.min(dy * 0.4, 70); 
    ind.style.transform = `translate(-50%, ${pullDistance}px) scale(1)`;
    ind.style.transition = 'none';

    ptrIcon.style.transform = `rotate(${dy * 1.2}deg)`;
    ptrIcon.style.transition = 'none';

    if (dy > INTENT_THRESHOLD && !activated) {
      activated = true;
      ptrIcon.style.color = 'var(--accent, #2563eb)';
      if (navigator.vibrate) navigator.vibrate(20);
    } else if (dy <= INTENT_THRESHOLD && activated) {
      activated = false;
      ptrIcon.style.color = 'var(--text-3, #9ca3af)';
    }
  }, { passive: false }); // ATTENTION: Il faut remplacer passive: true par passive: false ici !

  page.addEventListener('touchend', e => {
    if (!pulling) return;
    pulling = false;

    if (activated) {
      // Intention confirmée : On lance le rechargement
      ind.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
      ind.style.transform = 'translate(-50%, 50px) scale(1)';
      ptrIcon.style.animation = 'spin 0.8s linear infinite';
      
      // Appel de votre mécanique interne SPA (sans rafraîchir le navigateur complet)
      if (typeof loadAll === 'function') {
        loadAll().then(() => {
          if (typeof currentPage !== 'undefined' && currentPage === 'dashboard' && typeof renderDashboard === 'function') {
            renderDashboard();
          }
          // Disparition douce après succès
          ind.style.transform = 'translate(-50%, -60px) scale(0.8)';
          ind.style.opacity = '0';
          setTimeout(() => { ptrIcon.style.animation = 'none'; ptrIcon.style.transform = 'rotate(0)'; ptrIcon.style.color = 'var(--text-3)'; }, 300);
          if (typeof toast === 'function') toast('Actualisé ✓', 'ok');
        });
      } else {
        // Fallback de sécurité : rechargement natif de la page si loadAll n'existe pas
        window.location.reload();
      }
    } else {
      // Annulation : l'utilisateur a relâché avant les 160px
      ind.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s';
      ind.style.transform = 'translate(-50%, -60px) scale(0.8)';
      ind.style.opacity = '0';
    }

    activated = false;
    startY = 0;
  }, { passive: true });
}

// Règle de rotation
if (!document.getElementById('ptr-styles')) {
  const style = document.createElement('style');
  style.id = 'ptr-styles';
  style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
