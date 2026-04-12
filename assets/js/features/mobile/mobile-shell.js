(function CoproSyncMobileShell() {
  'use strict';

  const MOBILE_BREAKPOINT = 768;
  const KEYBOARD_THRESHOLD = 160;

  const css = `
@media (max-width: 768px) {
  :root {
    --mobile-topbar-base: 56px;
    --mobile-topbar-total: calc(var(--mobile-topbar-base) + env(safe-area-inset-top));
    --mobile-nav-base: 74px;
    --mobile-nav-height: calc(var(--mobile-nav-base) + env(safe-area-inset-bottom));
    --mobile-page-gutter: 14px;
    --mobile-page-bottom: calc(var(--mobile-nav-height) + 18px);
    --mobile-surface-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }

  html,
  body {
    height: 100%;
    max-width: 100%;
    overflow-x: hidden !important;
    overscroll-behavior-y: none;
  }

  body {
    min-height: var(--app-height, 100dvh);
  }

  #app,
  #main {
    min-height: var(--app-height, 100dvh) !important;
  }

  #main {
    width: 100%;
    background:
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 251, 1));
  }

  [data-theme="dark"] #main {
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
      linear-gradient(180deg, rgba(20, 24, 32, 0.98), rgba(10, 14, 20, 1));
  }

  #topbar {
    position: sticky !important;
    top: 0;
    height: var(--mobile-topbar-total) !important;
    min-height: var(--mobile-topbar-total) !important;
    padding: env(safe-area-inset-top) 14px 0 !important;
    gap: 10px !important;
    align-items: center !important;
    background: rgba(255, 255, 255, 0.92) !important;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);
  }

  [data-theme="dark"] #topbar {
    background: rgba(17, 24, 39, 0.9) !important;
    border-bottom-color: rgba(71, 85, 105, 0.4) !important;
  }

  .topbar-title {
    font-size: 15px !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em;
  }

  #topbar .topbar-actions,
  #topbar > div:last-child {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  #menu-btn,
  .notif-btn,
  #theme-btn {
    width: 40px;
    height: 40px;
    padding: 0 !important;
    border-radius: 14px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    background: rgba(148, 163, 184, 0.12);
  }

  [data-theme="dark"] #menu-btn,
  [data-theme="dark"] .notif-btn,
  [data-theme="dark"] #theme-btn {
    background: rgba(51, 65, 85, 0.32);
  }

  #page {
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total));
    max-width: none !important;
    width: 100%;
    padding:
      var(--mobile-page-gutter)
      var(--mobile-page-gutter)
      var(--mobile-page-bottom) !important;
    box-sizing: border-box;
    overflow-x: clip;
    scroll-padding-top: calc(var(--mobile-topbar-total) + 12px);
    scroll-padding-bottom: calc(var(--mobile-page-bottom) + 16px);
  }

  body[data-page="messages"] #page {
    padding: 0 !important;
    height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height));
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height));
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  body[data-page="map"] #page {
    padding: 0 !important;
    height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height));
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height));
    overflow: hidden !important;
  }

  body.keyboard-open[data-page="messages"] #page,
  body.keyboard-open[data-page="map"] #page {
    height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total));
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total));
  }

  body[data-page="messages"] #page.page-messages {
    height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height)) !important;
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total) - var(--mobile-nav-height)) !important;
  }

  body.keyboard-open[data-page="messages"] #page.page-messages {
    height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total)) !important;
    min-height: calc(var(--app-height, 100dvh) - var(--mobile-topbar-total)) !important;
  }

  /* Messagerie : le shell impose position:relative, donc il faut annuler les translateX d'app.css
     et gérer la visibilité avec display (sinon le fil / canaux / privé restent hors écran). */
  body[data-page="messages"] #msg-inner-tabs,
  body[data-page="messages"] .msg-inner-tabs {
    flex-shrink: 0 !important;
    position: relative !important;
    z-index: 6 !important;
  }

  body[data-page="messages"] .msg-layout {
    position: relative !important;
    inset: auto !important;
    flex: 1 1 0 !important;
    min-height: 0 !important;
    height: auto !important;
    max-height: none !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    overflow: hidden !important;
  }

  body[data-page="messages"] .msg-sidebar {
    position: relative !important;
    inset: auto !important;
    flex: 1 1 0 !important;
    min-height: 0 !important;
    min-width: 0 !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    max-height: none !important;
    transform: none !important;
    transition: none !important;
  }

  body[data-page="messages"] .msg-sidebar.hidden {
    display: none !important;
    pointer-events: none !important;
  }

  body[data-page="messages"] .msg-main,
  body[data-page="messages"] #msg-main {
    position: relative !important;
    inset: auto !important;
    flex: 1 1 0 !important;
    min-height: 0 !important;
    min-width: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    transform: none !important;
    transition: opacity 0.2s ease !important;
  }

  body[data-page="messages"] .msg-main:not(.visible) {
    display: none !important;
  }

  body[data-page="messages"] .msg-main.visible {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  body[data-page="messages"] .feed-split {
    flex: 1 1 0 !important;
    min-height: 0 !important;
  }

  body[data-page="messages"] .feed-left-pane {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  body[data-page="messages"] .feed-scroll--community,
  body[data-page="messages"] #feed-left-scroll {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }

  /* Discussion ouverte : la zone messages doit laisser la place au compositeur en bas */
  body[data-page="messages"] .msg-main.visible .chat-messages,
  body[data-page="messages"] #msg-main.visible #chat-messages {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }

  body[data-page="messages"] .msg-main.visible .chat-input-bar,
  body[data-page="messages"] .msg-main.visible .msg-shell-chat-composer {
    flex-shrink: 0 !important;
  }

  /*
   * Compositeur « collé » au-dessus de la bottom-nav : sinon overflow:hidden + hauteur
   * mal résolue sur flex auto masque la zone de saisie (canaux / privé).
   */
  body[data-page="messages"] .msg-main.visible .msg-shell-chat-composer.chat-input-bar,
  body[data-page="messages"] #msg-main.visible .msg-shell-chat-composer.chat-input-bar {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: var(--mobile-nav-height) !important;
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    z-index: 1150 !important;
    margin: 0 !important;
  }

  body[data-page="messages"] .msg-main.visible #msg-reply-bar,
  body[data-page="messages"] #msg-main.visible #msg-reply-bar {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: calc(var(--mobile-nav-height) + 58px) !important;
    z-index: 1149 !important;
    box-sizing: border-box !important;
  }

  body[data-page="messages"] .msg-main.visible #chat-messages,
  body[data-page="messages"] #msg-main.visible #chat-messages {
    padding-bottom: calc(var(--mobile-nav-height) + 80px) !important;
  }

  body[data-page="map"] #page > div:first-child {
    height: 100%;
  }

  .ph {
    margin-bottom: 16px !important;
  }

  .ph h1 {
    font-size: 20px !important;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  .ph p {
    font-size: 13px !important;
    line-height: 1.5;
    max-width: 38ch;
  }

  .card,
  .stat,
  .tbl-wrap tr {
    border-radius: 22px !important;
    box-shadow: var(--mobile-surface-shadow);
  }

  .card-header,
  .card-body,
  .stat {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .card-header {
    padding-top: 14px !important;
    padding-bottom: 14px !important;
  }

  .card-body,
  .stat {
    padding-top: 16px !important;
    padding-bottom: 16px !important;
  }

  .btn,
  .input,
  .select,
  .textarea {
    border-radius: 14px !important;
  }

  .btn {
    min-height: 46px !important;
  }

  .input,
  .select,
  .textarea {
    min-height: 46px;
  }

  .g2,
  .g3,
  .fg-row,
  .fg-row-3 {
    grid-template-columns: 1fr !important;
  }

  #sidebar {
    width: min(88vw, 360px) !important;
    max-width: 360px;
    padding-bottom: calc(var(--mobile-nav-height) + 24px);
    box-shadow: 24px 0 48px rgba(15, 23, 42, 0.18);
  }

  .sidebar-brand {
    padding-top: calc(18px + env(safe-area-inset-top)) !important;
  }

  .sidebar-footer {
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }

  #so {
    background: rgba(15, 23, 42, 0.38) !important;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  #bottom-nav {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    align-items: end;
    height: var(--mobile-nav-height) !important;
    padding: 8px 8px env(safe-area-inset-bottom) !important;
    background: rgba(255, 255, 255, 0.94) !important;
    border-top: 1px solid rgba(148, 163, 184, 0.18) !important;
    box-shadow: 0 -12px 32px rgba(15, 23, 42, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }

  [data-theme="dark"] #bottom-nav {
    background: rgba(15, 23, 42, 0.94) !important;
    border-top-color: rgba(71, 85, 105, 0.45) !important;
  }

  .bn-item {
    min-width: 0;
    min-height: 58px;
    padding: 6px 0 4px !important;
    border-radius: 18px;
    gap: 3px !important;
    font-size: 10px !important;
  }

  .bn-item svg {
    width: 22px !important;
    height: 22px !important;
  }

  .bn-signaler {
    transform: translateY(-10px);
  }

  .bn-signaler-ico {
    width: 50px !important;
    height: 50px !important;
    margin-bottom: 2px !important;
    border-radius: 18px !important;
    border-width: 3px !important;
    transform: none !important;
  }

  .bn-badge {
    top: 5px !important;
  }

  .overlay {
    padding-bottom: 0 !important;
  }

  .modal {
    max-height: min(92dvh, calc(var(--app-height, 100dvh) - 8px)) !important;
  }

  .mf,
  .feed-thread-composer,
  .chat-input-bar,
  .feed-compose-bar {
    padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
  }

  .feed-thread-scroll,
  #chat-messages,
  .chat-messages,
  #page {
    scroll-padding-bottom: calc(var(--mobile-page-bottom) + 12px);
  }

  body.keyboard-open #bottom-nav {
    transform: translateY(calc(100% + env(safe-area-inset-bottom)));
    opacity: 0;
    pointer-events: none;
  }

  body.keyboard-open #page {
    padding-bottom: 18px !important;
  }

  body.keyboard-open .modal {
    max-height: min(92dvh, calc(var(--app-height, 100dvh) - 4px)) !important;
  }
}
`;

  function ensureStyle() {
    if (document.getElementById('coprosync-mobile-shell-css')) return;
    const style = document.createElement('style');
    style.id = 'coprosync-mobile-shell-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function syncViewport() {
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) return;

    const vv = window.visualViewport;
    const height = Math.round(vv ? vv.height : window.innerHeight);
    const layoutHeight = Math.round(window.innerHeight);
    const keyboardOpen = isMobile() && vv && (layoutHeight - vv.height) > KEYBOARD_THRESHOLD;

    root.style.setProperty('--app-height', `${height}px`);
    body.classList.toggle('keyboard-open', Boolean(keyboardOpen));
    body.classList.toggle('mobile-shell-active', isMobile());
  }

  function syncPageDataset(page) {
    const nextPage = page || window.currentPage || 'dashboard';
    document.body?.setAttribute('data-page', nextPage);
    document.documentElement?.setAttribute('data-page', nextPage);
  }

  function enhanceTopbar() {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    const actions = topbar.lastElementChild;
    if (actions) actions.classList.add('topbar-actions');
  }

  function syncPageState(page) {
    const nextPage = page || window.currentPage || 'dashboard';
    const pageEl = document.getElementById('page');
    if (pageEl) pageEl.classList.toggle('page-messages', nextPage === 'messages');
  }

  function patchNavigation() {
    if (typeof window.nav !== 'function' || window.nav.__mobileShellPatched) return;

    const originalNav = window.nav;
    const wrappedNav = function wrappedNav(page, noClose, isBackNavigation) {
      syncPageDataset(page);
      const result = originalNav.call(this, page, noClose, isBackNavigation);
      requestAnimationFrame(() => {
        enhanceTopbar();
        syncViewport();
        syncPageDataset(window.currentPage || page);
        syncPageState(window.currentPage || page);
      });
      return result;
    };

    wrappedNav.__mobileShellPatched = true;
    window.nav = wrappedNav;
  }

  function patchFeedThread() {
    if (
      typeof window.openFeedThread !== 'function' ||
      typeof window.closeFeedThread !== 'function' ||
      window.openFeedThread.__mobileShellPatched
    ) {
      return;
    }

    const originalOpenFeedThread = window.openFeedThread;
    const originalCloseFeedThread = window.closeFeedThread;

    window.openFeedThread = async function patchedOpenFeedThread(postId) {
      if (!isMobile()) return originalOpenFeedThread.call(this, postId);

      const sid = String(postId);

      if (window._msgState) {
        window._msgState.activeFeedThreadPostId = sid;
        window._msgState.feedThreadRenderedCommentIds = new Set();
        window._msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
        window._msgState.feedCommentUnreadByPost[sid] = 0;
      }

      const split = document.getElementById('feed-split');
      if (split) split.classList.add('thread-active');

      let post = (window._msgState?.feed || []).find((item) => String(item.id) === sid);
      if (!post && window.sb) {
        try {
          const { data } = await window.sb
            .from('feed_posts')
            .select('*, profiles(id,prenom,nom,email)')
            .eq('id', sid)
            .single();
          post = data;
        } catch (error) {
          console.warn('[mobile-shell] openFeedThread', error);
        }
      }
      if (!post) return;

      const threadPane = document.getElementById('feed-thread-pane');
      if (!threadPane) return;

      const auteur = post.profiles
        ? (typeof window.displayName === 'function'
          ? window.displayName(post.profiles.prenom, post.profiles.nom, post.profiles.email, 'Resident')
          : (post.profiles.prenom || post.profiles.nom || 'Resident'))
        : 'Resident';
      const initiale = auteur.charAt(0).toUpperCase();
      const color = typeof window.avatarColor === 'function' ? window.avatarColor(auteur) : '#2563eb';
      const timeStr = typeof window.depuisJours === 'function' ? window.depuisJours(post.created_at) : '';
      const titrePanneau = post.titre_panneau
        ? `<div style="font-family:var(--font-head); font-weight:800; font-size:15px; color:var(--orange); margin-bottom:6px;">${typeof window.escHtml === 'function' ? window.escHtml(post.titre_panneau) : post.titre_panneau}</div>`
        : '';
      const bodyHtml = `${titrePanneau}<div style="font-size:14px; line-height:1.6; color:var(--text);">${typeof window.formatRichText === 'function' ? window.formatRichText(post.contenu || '') : (typeof window.escHtml === 'function' ? window.escHtml(post.contenu || '') : (post.contenu || ''))}</div>`;

      threadPane.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--surface);">
          <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid var(--border); background:var(--surface); flex-shrink:0;">
            <button type="button" class="feed-thread-back-btn" onclick="closeFeedThread()">←</button>
            <div style="flex:1; min-width:0;">
              <div style="font-family:var(--font-head); font-size:15px; font-weight:800; letter-spacing:-0.02em;">Discussion</div>
              <div style="font-size:11px; color:var(--text-3); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${typeof window.escHtml === 'function' ? window.escHtml(auteur) : auteur}${timeStr ? ` · ${timeStr}` : ''}</div>
            </div>
          </div>

          <div style="flex-shrink:0; max-height:30vh; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:12px 14px; border-bottom:1px solid var(--border); background:var(--surface-2);">
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <div style="width:34px; height:34px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0;">${initiale}</div>
              <div style="flex:1; min-width:0;">${bodyHtml}</div>
            </div>
          </div>

          <div style="flex-shrink:0; padding:8px 14px 4px; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-3); background:var(--surface);">
            Commentaires
          </div>

          <div id="feed-thread-scroll" style="flex:1 1 0; min-height:0; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding:4px 0 10px; background:var(--bg-2);">
            <button id="feed-thread-load-more-btn" class="btn btn-ghost btn-sm" style="display:none; width:calc(100% - 28px); margin:4px 14px 8px;" onclick="loadFeedThreadOlder()">Charger les plus anciens</button>
            <div id="feed-thread-comments-list" style="display:flex; flex-direction:column; gap:12px; padding:0 14px;">
              <div style="padding:24px 0; text-align:center; font-size:13px; color:var(--text-3);">Chargement...</div>
            </div>
          </div>

          <div class="feed-thread-composer" style="padding:10px 14px; background:var(--surface); border-top:1px solid var(--border); box-shadow:0 -4px 16px rgba(0,0,0,0.04);">
            <div style="display:flex; align-items:flex-end; gap:10px; background:var(--surface-2); border:1px solid var(--border); border-radius:22px; padding:4px 4px 4px 14px;">
              <textarea id="feed-thread-comment-input" style="flex:1; border:none; background:transparent; padding:8px 0; font-size:14px; resize:none; max-height:120px; outline:none;" placeholder="Ecrire une reponse..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFeedThreadComment();}"></textarea>
              <button type="button" style="width:38px; height:38px; border-radius:50%; background:var(--primary); color:white; border:none; display:flex; align-items:center; justify-content:center; flex-shrink:0; cursor:pointer;" onclick="sendFeedThreadComment()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
              </button>
            </div>
          </div>
        </div>`;

      if (typeof window.loadFeedThreadComments === 'function') {
        await window.loadFeedThreadComments(sid, { older: false });
      }
    };

    window.openFeedThread.__mobileShellPatched = true;

    window.closeFeedThread = function patchedCloseFeedThread() {
      if (!isMobile()) return originalCloseFeedThread.call(this);

      const split = document.getElementById('feed-split');
      if (split) split.classList.remove('thread-active');
      if (window._msgState) window._msgState.activeFeedThreadPostId = null;

      const pane = document.getElementById('feed-thread-pane');
      if (pane) {
        pane.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-3); padding:32px 24px; text-align:center;">
            <div style="font-size:56px; margin-bottom:14px; opacity:0.45;">💬</div>
            <div style="font-family:var(--font-head); font-weight:800; font-size:18px; margin-bottom:8px; color:var(--text-2);">Ouvrez une discussion</div>
            <div style="font-size:14px; max-width:260px; line-height:1.55;">
              Touchez "Commenter" sous un message pour voir le fil complet sans quitter la page.
            </div>
          </div>`;
      }
    };
  }

  function patchDeferredFeatures() {
    patchNavigation();
    patchFeedThread();
    syncPageState();
  }

  function init() {
    ensureStyle();
    enhanceTopbar();
    syncPageDataset();
    syncViewport();
    patchDeferredFeatures();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncViewport, 120), { passive: true });
  window.addEventListener('focusin', syncViewport, { passive: true });
  window.addEventListener('focusout', () => setTimeout(syncViewport, 120), { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', syncViewport, { passive: true });
  }

  setTimeout(init, 250);
  setTimeout(patchDeferredFeatures, 600);
})();
