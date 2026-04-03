// ── SWIPE TO CLOSE — ferme les modals en glissant vers le bas ──
function initSwipeToClose() {
  document.addEventListener('touchstart', e => {
    const modal = e.target.closest('.modal');
    if (!modal) return;
    modal._touchStartY = e.touches[0].clientY;
    modal._touchStartScroll = modal.scrollTop;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    const modal = e.target.closest('.modal');
    if (!modal || modal._touchStartY === undefined) return;
    const dy = e.touches[0].clientY - modal._touchStartY;
    // Swipe vers le bas uniquement si on est en haut du modal
    if (dy > 0 && modal._touchStartScroll === 0) {
      modal.style.transform = `translateY(${Math.min(dy * 0.4, 120)}px)`;
      modal.style.transition = 'none';
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const modal = e.target.closest('.modal');
    if (!modal || modal._touchStartY === undefined) return;
    const dy = e.changedTouches[0].clientY - modal._touchStartY;
    modal.style.transition = 'transform .25s cubic-bezier(.4,0,.2,1)';
    if (dy > 80 && modal._touchStartScroll === 0) {
      // Ferme le modal
      modal.style.transform = 'translateY(100%)';
      setTimeout(() => {
        modal.style.transform = '';
        const overlay = modal.closest('.overlay');
        if (overlay) overlay.classList.remove('open');
      }, 250);
    } else {
      modal.style.transform = '';
    }
    modal._touchStartY = undefined;
  }, { passive: true });
}

// ── PULL TO REFRESH ──
function initPullToRefresh() {
  let startY = 0;
  let startX = 0;
  let pulling = false;
  let activated = false;

  const page = $('page');
  if (!page) return;

  page.addEventListener('touchstart', e => {
    // Déclenche UNIQUEMENT si on est vraiment tout en haut (scrollTop < 2px)
    if (page.scrollTop < 2) {
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

    // Ignore si c'est un scroll horizontal (messages, etc.)
    if (dx > 30) { pulling = false; return; }

    // Doit être un vrai geste vers le bas (au moins 15px)
    // ET le scroll doit toujours être à 0
    if (dy < 15 || page.scrollTop > 2) { return; }

    let ind = $('ptr-indicator');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'ptr-indicator';
      ind.style.cssText = `
        position: fixed; top: 56px; left: 50%;
        transform: translateX(-50%) translateY(-60px);
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600;
        color: var(--text-2); z-index: 500;
        display: flex; align-items: center; gap: 6px;
        box-shadow: var(--shadow-md); pointer-events: none;
      `;
      document.body.appendChild(ind);
    }

    const progress = Math.min(dy - 15, 80);
    ind.style.transform = `translateX(-50%) translateY(${progress * 0.6}px)`;
    ind.style.transition = 'none';

    if (progress > 55) {
      ind.innerHTML = '↑ Relâcher pour actualiser';
      activated = true;
    } else {
      ind.innerHTML = '↓ Tirer pour actualiser';
      activated = false;
    }
  }, { passive: true });

  page.addEventListener('touchend', e => {
    if (!pulling) return;
    pulling = false;

    const ind = $('ptr-indicator');
    if (!ind) return;

    if (activated) {
      ind.style.transition = 'transform .2s ease';
      ind.style.transform = 'translateX(-50%) translateY(44px)';
      ind.innerHTML = '⟳ Actualisation…';
      loadAll().then(() => {
        if (currentPage === 'dashboard') renderDashboard();
        setTimeout(() => ind?.remove(), 600);
        toast('Actualisé ✓', 'ok');
      });
    } else {
      ind.style.transition = 'transform .2s ease';
      ind.style.transform = 'translateX(-50%) translateY(-60px)';
      setTimeout(() => ind?.remove(), 200);
    }

    activated = false;
    startY = 0;
  }, { passive: true });
}
