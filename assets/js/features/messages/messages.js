// ════════════════════════════════════════════════════════════════
//  MESSAGERIE & COMMUNAUTÉ (Refonte Pro - Smart Forms & Native UI)
//  assets/js/features/messages/messages.js
// ════════════════════════════════════════════════════════════════

const EMOJIS = ['👍','❤️','😂','😮','🙏','✅','🔥','👏'];
const CHAN_COLORS = {
  general: '#2563eb', tour13: '#7c3aed', tour15: '#ea580c',
  tour17: '#16a34a', tour19: '#d97706', cs: '#dc2626', feed: '#2563eb'
};

const FEED_COMPOSE_CAT_KEY = 'coprosync_feed_compose_cat_v1';

/** Rubriques filtre + publication */
const FEED_COMMUNITY_CATS = [
  { id: 'tout', label: 'Tout', emoji: '🏘️', filterOnly: true },
  { id: 'panneau', label: 'Panneau', emoji: '📌', managerOnly: true, board: true },
  { id: 'entraide', label: 'Entraide', emoji: '🤝' },
  { id: 'petites_annonces', label: 'Annonces', emoji: '🧺' },
  { id: 'vie_quartier', label: 'Quartier', emoji: '☕' },
  { id: 'evenements', label: 'Événements', emoji: '🎉' },
  { id: 'pratique', label: 'Pratique', emoji: '📋' },
  { id: 'activite', label: 'Copro', emoji: '🏢', filterOnly: true },
];

function feedCatMeta(id) {
  return FEED_COMMUNITY_CATS.find(c => c.id === id) || { id, label: id, emoji: '💬' };
}

function feedPostCategory(p) {
  if (!p) return 'vie_quartier';
  if (p.type && ['ticket', 'resolved', 'vote', 'member'].includes(p.type)) return 'activite';
  return p.categorie || 'vie_quartier';
}

function sortFeedPosts(arr) {
  return [...arr].sort((a, b) => {
    const pa = a.epingle ? 1 : 0;
    const pb = b.epingle ? 1 : 0;
    if (pb !== pa) return pb - pa;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function feedCountForFilter(catId) {
  const rows = (_msgState.feed || []).filter(p => p.type !== 'comment');
  if (catId === 'tout') return rows.length;
  return rows.filter(p => feedPostCategory(p) === catId).length;
}

function feedComposeCatsForUser() {
  return FEED_COMMUNITY_CATS.filter(c =>
    !c.filterOnly && (!c.managerOnly || (typeof canManageAnnonces === 'function' && canManageAnnonces()))
  );
}

function readStoredFeedComposeCat() {
  try {
    const v = localStorage.getItem(FEED_COMPOSE_CAT_KEY);
    const ok = feedComposeCatsForUser().some(c => c.id === v);
    if (ok) return v;
  } catch { /* ignore */ }
  const pick = feedComposeCatsForUser().find(c => c.id === 'entraide') || feedComposeCatsForUser()[0];
  return pick ? pick.id : 'entraide';
}

async function insertFeedPostRow(row, opts = {}) {
  const { selectProfiles } = opts;
  let q = sb.from('feed_posts').insert(row);
  if (selectProfiles) q = q.select('*, profiles(id,prenom,nom,email)').single();
  let res = await q;
  if (res.error && /categorie|titre_panneau|epingle|column|schema/i.test(String(res.error.message))) {
    const minimal = { auteur_id: row.auteur_id, contenu: row.contenu, type: row.type };
    if (row.reference_id != null) minimal.reference_id = row.reference_id;
    q = sb.from('feed_posts').insert(minimal);
    if (selectProfiles) q = q.select('*, profiles(id,prenom,nom,email)').single();
    res = await q;
  }
  return res;
}

async function insertFeedPostRowSimple(row) {
  let res = await sb.from('feed_posts').insert(row);
  if (res.error && /categorie|titre_panneau|epingle|column|schema/i.test(String(res.error.message))) {
    const minimal = { auteur_id: row.auteur_id, contenu: row.contenu, type: row.type };
    if (row.reference_id != null) minimal.reference_id = row.reference_id;
    res = await sb.from('feed_posts').insert(minimal);
  }
  return res;
}

// ─── UTILS : Formatage de texte riche (Markdown léger) ───
function formatRichText(text) {
  if (!text) return '';
  let html = typeof escHtml === 'function' ? escHtml(text) : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  html = html.replace(/^### (.*$)/gim, '<h4 style="margin:12px 0 6px; font-weight:800; color:var(--text-1); font-size:14px;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="margin:14px 0 6px; font-weight:800; color:var(--text-1); font-size:16px;">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="margin:16px 0 8px; font-weight:800; color:var(--text-1); font-size:18px;">$1</h2>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/@(\S+)/g, '<span style="color:var(--primary); font-weight:700; background:var(--primary-light); padding:2px 6px; border-radius:8px;">@$1</span>');
  
  html = html.replace(/\n/g, '<br>');
  return html;
}

// ─── État global messagerie ───────────────────────────────────────────────────
let _msgState = {
  conversations: [], messages: [],
  activeConvId: null,
  activeChanType: 'feed', // 'feed' | 'chan' | 'dm'
  activeMobileTab: 'feed',
  channel: null, feedChannel: null,
  replyTo: null,
  feed: [], feedReactions: {}, feedComments: {},
  feedFilter: 'tout',
  feedComposeCategory: 'entraide',
  typingTimeout: null,
  convFilter: '',
  unreadByConv: {},
  readCursorByConv: {},
  drafts: {},
  feedOpenCommentIds: new Set(),
  feedCommentSigByPost: {},
  feedCommentUnreadByPost: {},
  activeFeedThreadPostId: null,
  feedThreadState: { loaded: false, oldestLoadedAt: null, hasMore: false },
  feedThreadRenderedCommentIds: new Set(),
};

const MSG_DRAFTS_KEY = 'coprosync_msg_drafts_v1';
let _feedCommentsPollTimer = null;

function startFeedCommentsPoll() {
  stopFeedCommentsPoll();
  _feedCommentsPollTimer = setInterval(() => {
    if (_msgState.activeChanType !== 'feed') return;
    if (!_msgState.feedOpenCommentIds.size) return;
    _msgState.feedOpenCommentIds.forEach(sid => {
      const listEl = $(`feed-comments-list-${sid}`);
      if (listEl) loadFeedComments(sid);
    });
  }, 8000);
}

function stopFeedCommentsPoll() {
  if (_feedCommentsPollTimer) {
    clearInterval(_feedCommentsPollTimer);
    _feedCommentsPollTimer = null;
  }
}

function restoreFeedOpenCommentThreads() {
  _msgState.feedOpenCommentIds.forEach(sid => {
    const box = $(`feed-comments-${sid}`);
    if (box) {
      box.style.display = 'block';
      loadFeedComments(sid);
    }
  });
}

function loadMsgDrafts() {
  try {
    const raw = localStorage.getItem(MSG_DRAFTS_KEY);
    _msgState.drafts = raw ? JSON.parse(raw) : {};
  } catch {
    _msgState.drafts = {};
  }
}

function saveMsgDrafts() {
  try { localStorage.setItem(MSG_DRAFTS_KEY, JSON.stringify(_msgState.drafts || {})); } catch {}
}

function draftKeyForCurrentContext() {
  return _msgState.activeChanType === 'feed' ? 'feed' : `conv:${_msgState.activeConvId || 'none'}`;
}

function saveCurrentDraft() {
  const key = draftKeyForCurrentContext();
  if (key === 'conv:none') return;
  const input = _msgState.activeChanType === 'feed' ? $('feed-compose-modal-input') || $('feed-input') : $('chat-input');
  if (!input) return;
  const v = (input.value || '').trim();
  if (!_msgState.drafts) _msgState.drafts = {};
  if (v) _msgState.drafts[key] = v;
  else delete _msgState.drafts[key];
  saveMsgDrafts();
}

function restoreCurrentDraft() {
  const key = draftKeyForCurrentContext();
  const val = (_msgState.drafts || {})[key] || '';
  const input = _msgState.activeChanType === 'feed' ? $('feed-compose-modal-input') || $('feed-input') : $('chat-input');
  if (!input) return;
  input.value = val;
  if (val && _msgState.activeChanType !== 'feed') {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  RENDER MESSAGES PAGE — Design Google Messages
// ═══════════════════════════════════════════════════════════════════════
async function renderMessages() {
  const page = $('page');
  loadMsgDrafts();

  page.innerHTML = `
    <div class="msg-inner-tabs" id="msg-inner-tabs" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); z-index: 20;">
      <button class="msg-inner-tab ${_msgState.activeMobileTab === 'feed' ? 'active' : ''}" onclick="switchMobileTab('feed')">
        <span class="msg-inner-tab-ico">🏘️</span><span>Communauté</span>
      </button>
      <button class="msg-inner-tab ${_msgState.activeMobileTab === 'channels' ? 'active' : ''}" onclick="switchMobileTab('channels')" id="msg-tab-channels">
        <span class="msg-inner-tab-ico">💬</span><span>Canaux</span>
        <span class="msg-inner-tab-badge" id="tab-badge-channels" style="display:none;"></span>
      </button>
      <button class="msg-inner-tab ${_msgState.activeMobileTab === 'dms' ? 'active' : ''}" onclick="switchMobileTab('dms')" id="msg-tab-dms">
        <span class="msg-inner-tab-ico">🔒</span><span>Privé</span>
        <span class="msg-inner-tab-badge" id="tab-badge-dms" style="display:none;"></span>
      </button>
    </div>

    <div class="msg-layout" id="msg-layout">
      <div class="msg-sidebar" id="msg-sidebar" style="background:var(--surface);">
        <div style="padding:16px 20px 8px;">
          <h2 style="font-family:var(--font-head); font-size:22px; font-weight:800; margin-bottom:12px;">Discussions</h2>
          <div style="position:relative;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px; opacity:0.5;">🔍</span>
            <input class="input" id="msg-search-conv" placeholder="Rechercher..." oninput="onMsgConvSearchInput(event)" style="padding-left:36px; border-radius:20px; background:var(--bg-2); border:none;">
          </div>
        </div>
        
        <div class="msg-sidebar-scroll" style="padding:0;">
          <div class="msg-section-label" style="padding:12px 20px 4px;">Communauté</div>
          <div class="msg-chan-item ${_msgState.activeChanType==='feed'?'active':''}" id="chan-feed" onclick="openFeed()" style="margin:0 12px; border-radius:12px;">
            <div class="msg-chan-ico" style="background:var(--blue-light); font-size:20px; width:44px; height:44px; border-radius:50%;">🏘️</div>
            <div style="flex:1;">
              <div class="msg-chan-name" style="font-size:15px;">Fil du quartier</div>
              <div style="font-size:12px; color:var(--text-3); font-weight:500;">Annonces et entraide</div>
            </div>
          </div>
          
          <div class="msg-section-label" style="padding:16px 20px 4px;">Groupes & Canaux</div>
          <div id="chan-list-groups" style="padding:0 12px;"></div>
          
          <div class="msg-section-label" style="padding:16px 20px 4px; display:flex; justify-content:space-between; align-items:center;">
            Messages privés
            <button class="btn btn-ghost btn-sm" onclick="openNewDM()" style="padding:4px 8px; border-radius:20px; background:var(--bg-2);">+ Nouveau</button>
          </div>
          <div id="chan-list-dms" style="padding:0 12px; padding-bottom:80px;"></div>
        </div>

        <button class="msg-fab-mobile" onclick="openNewDM()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
        </button>
      </div>

      <div class="msg-main" id="msg-main" style="background:var(--bg-1);">
        <div class="chat-empty" id="msg-welcome">
          <div style="font-size:56px; margin-bottom:16px; animation:bounce 2s infinite;">👋</div>
          <div style="font-family:var(--font-head); font-size:22px; font-weight:800; margin-bottom:8px; color:var(--text-1);">Vos discussions</div>
          <div style="font-size:14px; color:var(--text-3); max-width:300px; line-height:1.5;">Sélectionnez une conversation sur la gauche ou explorez le fil du quartier.</div>
        </div>
      </div>
    </div>`;

  await loadConversations();
  renderSidebarGroups();
  renderSidebarDMs();
  if (typeof startMsgRealtime === 'function') startMsgRealtime();
  if (typeof startFeedRealtime === 'function') startFeedRealtime();
  _updateMobileTabBadges();

  if (_msgState.activeMobileTab === 'feed' || _msgState.activeChanType === 'feed') {
    openFeed();
  } else if (_msgState.activeConvId) {
    openConv(_msgState.activeConvId);
  } else {
    openFeed();
  }
}

// ─── TAB MOBILES ─────────────────────────────────────────────────────────────
function switchMobileTab(tab) {
  _msgState.activeMobileTab = tab;
  document.querySelectorAll('.msg-inner-tab').forEach((t, i) => {
    const tabs = ['feed', 'channels', 'dms'];
    t.classList.toggle('active', tabs[i] === tab);
  });

  if (tab === 'feed') {
    openFeed();
  } else if (tab === 'channels') {
    _showMobileSidebarFiltered('groupe');
  } else if (tab === 'dms') {
    _showMobileSidebarFiltered('prive');
  }
}

function _showMobileSidebarFiltered(type) {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (window.innerWidth <= 768) {
    if (sidebar) {
      sidebar.classList.remove('hidden');
      sidebar.style.display = 'flex';
      sidebar.style.width = '100%';
    }
    if (main) main.classList.remove('visible');
    
    // Filtre visuel de la liste
    const groupsLabel = document.querySelectorAll('.msg-section-label')[1];
    const dmsLabel = document.querySelectorAll('.msg-section-label')[2];
    
    if (type === 'groupe') {
      $('chan-list-groups').style.display = 'block';
      $('chan-list-dms').style.display = 'none';
      if (groupsLabel) groupsLabel.style.display = 'block';
      if (dmsLabel) dmsLabel.style.display = 'none';
    } else {
      $('chan-list-groups').style.display = 'none';
      $('chan-list-dms').style.display = 'block';
      if (groupsLabel) groupsLabel.style.display = 'none';
      if (dmsLabel) dmsLabel.style.display = 'flex';
    }
  }
}

function _updateMobileTabBadges() {
  const chanUnread = _msgState.conversations.filter(c => c.type !== 'prive').reduce((sum, c) => sum + (_msgState.unreadByConv[c.id] || 0), 0);
  const chanBadge = $('tab-badge-channels');
  if (chanBadge) { chanBadge.textContent = chanUnread > 9 ? '9+' : chanUnread; chanBadge.style.display = chanUnread > 0 ? 'flex' : 'none'; }

  const dmUnread = _msgState.conversations.filter(c => c.type === 'prive').reduce((sum, c) => sum + (_msgState.unreadByConv[c.id] || 0), 0);
  const dmBadge = $('tab-badge-dms');
  if (dmBadge) { dmBadge.textContent = dmUnread > 9 ? '9+' : dmUnread; dmBadge.style.display = dmUnread > 0 ? 'flex' : 'none'; }
}

// ─── RENDU SIDEBAR ───────────────────────────────────────────────────────────
function renderSidebarGroups() {
  const el = $('chan-list-groups');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const convs = filterConvsByRole(_msgState.conversations)
    .filter(c => !c.type || c.type === 'groupe')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));

  const userTour = typeof profile !== 'undefined' ? profile?.tour : null;
  const sorted = [...convs].sort((a, b) => {
    const aIsTour = userTour && (a.titre || '').includes(userTour);
    const bIsTour = userTour && (b.titre || '').includes(userTour);
    if (aIsTour && !bIsTour) return -1;
    if (!aIsTour && bIsTour) return 1;
    return 0;
  });

  el.innerHTML = sorted.map(c => {
    const emoji = c.titre?.split(' ')[0] || '💬';
    const titre = c.titre?.substring(c.titre.indexOf(' ') + 1) || c.titre;
    const isActive = _msgState.activeConvId === c.id && _msgState.activeChanType === 'chan';
    const unread = _msgState.unreadByConv?.[c.id] || 0;
    const isMaTour = userTour && (c.titre || '').includes(userTour);
    
    return `
    <div class="msg-dm-item ${isActive?'active':''}" id="chan-${c.id}" onclick="openConv('${c.id}')" style="border-radius:12px; margin-bottom:2px; padding:10px 12px; gap:14px;">
      <div class="msg-dm-av" style="background:var(--bg-2); border:1px solid var(--border); font-size:20px; width:48px; height:48px; border-radius:50%;">
        ${emoji}
      </div>
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
          <div style="font-weight:700; font-size:15px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escHtml(titre)}
            ${isMaTour ? '<span style="font-size:9px; background:var(--primary-light); color:var(--primary); padding:2px 6px; border-radius:6px; margin-left:6px; vertical-align:middle;">MA TOUR</span>' : ''}
          </div>
        </div>
        <div style="font-size:13px; color:${unread > 0 ? 'var(--text-1)' : 'var(--text-3)'}; font-weight:${unread > 0 ? '700' : '500'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          Canal de discussion...
        </div>
      </div>
      ${unread > 0 ? `<div style="background:var(--primary); color:white; font-size:11px; font-weight:800; height:20px; min-width:20px; padding:0 6px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${unread > 9 ? '9+' : unread}</div>` : ''}
    </div>`;
  }).join('') || '<div style="padding:12px 16px;font-size:13px;color:var(--text-3);text-align:center;">Aucun canal disponible</div>';
}

function renderSidebarDMs() {
  const el = $('chan-list-dms');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const dms = _msgState.conversations
    .filter(c => c.type === 'prive')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));

  if (!dms.length) {
    el.innerHTML = `
      <div style="padding:24px 16px; text-align:center;">
        <div style="font-size:24px; margin-bottom:8px;">📬</div>
        <div style="font-size:13px; color:var(--text-2); margin-bottom:12px;">Aucun message privé</div>
        <button class="btn btn-secondary btn-sm" onclick="openNewDM()" style="margin:0 auto;">Nouvelle discussion</button>
      </div>`;
    return;
  }
  
  el.innerHTML = dms.map(c => {
    const isActive = _msgState.activeConvId === c.id;
    const autreNom = c.titre?.replace(/^🔒\s*/, '') || 'Privé';
    const initiale = autreNom.charAt(0).toUpperCase();
    const color = avatarColor(autreNom);
    const unread = _msgState.unreadByConv?.[c.id] || 0;

    return `
    <div class="msg-dm-item ${isActive?'active':''}" id="chan-${c.id}" onclick="openConv('${c.id}')" style="border-radius:12px; margin-bottom:2px; padding:10px 12px; gap:14px;">
      <div class="msg-dm-av" style="background:${color}; width:48px; height:48px; font-size:20px; font-weight:800; border-radius:50%; box-shadow:0 2px 6px ${color}44;">
        ${initiale}
      </div>
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
          <div style="font-weight:700; font-size:15px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escHtml(autreNom)}
          </div>
        </div>
        <div style="font-size:13px; color:${unread > 0 ? 'var(--text-1)' : 'var(--text-3)'}; font-weight:${unread > 0 ? '700' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          Message privé...
        </div>
      </div>
      ${unread > 0 ? `<div style="background:var(--primary); color:white; font-size:11px; font-weight:800; height:20px; min-width:20px; padding:0 6px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${unread > 9 ? '9+' : unread}</div>` : ''}
    </div>`;
  }).join('');
}

function onMsgConvSearchInput(e) {
  _msgState.convFilter = (e.target.value || '').toLowerCase().trim();
  renderSidebarGroups();
  renderSidebarDMs();
}

function avatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#ea580c','#16a34a','#d97706','#dc2626','#0891b2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ─── CHARGEMENT DES CONVERSATIONS ────────────────────────────────────────────
async function loadConversations() {
  const { data: memberships } = await sb.from('conversation_membres')
    .select('conversation_id,lu_jusqu_a').eq('user_id', user.id);
  const ids = (memberships || []).map(m => m.conversation_id);
  _msgState.readCursorByConv = Object.fromEntries((memberships || []).map(m => [m.conversation_id, m.lu_jusqu_a || null]));
  
  if (!ids.length) { _msgState.conversations = []; renderSidebarGroups(); renderSidebarDMs(); return; }

  const { data, error } = await sb.from('conversations').select('*').in('id', ids).order('created_at');
  if (error) { console.warn('[msg] loadConversations:', error.message); return; }
  
  _msgState.conversations = data || [];
  await computeUnreadByConversation();
}

async function computeUnreadByConversation() {
  const convs = _msgState.conversations || [];
  const out = {};
  for (const c of convs) {
    const cursor = _msgState.readCursorByConv[c.id];
    let q = sb.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).neq('auteur_id', user.id);
    if (cursor) q = q.gt('created_at', cursor);
    const { count } = await q;
    out[c.id] = count || 0;
  }
  _msgState.unreadByConv = out;
}

// ─── FONCTIONS NAVIGATION MOBILE ─────────────────────────────────────────────
function mobileShowMain() {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (window.innerWidth <= 768) {
    if (sidebar) { sidebar.classList.add('hidden'); sidebar.style.display = ''; }
    if (main) main.classList.add('visible');
  }
}

function mobileShowSidebar() {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (sidebar) { sidebar.classList.remove('hidden'); sidebar.style.display = ''; }
  if (main) main.classList.remove('visible');
  _msgState.activeConvId = null;
}

function mobileBackToChannelList() {
  if (window.innerWidth <= 768) {
    _showMobileSidebarFiltered(_msgState.activeChanType === 'dm' ? 'prive' : 'groupe');
  } else {
    mobileShowSidebar();
  }
}

// ─── OUVERTURE D'UN CANAL/DM ─────────────────────────────────────────────────
async function openConv(convId) {
  saveCurrentDraft();
  stopFeedCommentsPoll();
  _msgState.activeConvId = convId;
  _msgState.activeChanType = _msgState.conversations.find(c=>c.id===convId)?.type === 'prive' ? 'dm' : 'chan';
  _msgState.activeMobileTab = _msgState.activeChanType === 'dm' ? 'dms' : 'channels';

  document.querySelectorAll('.msg-chan-item,.msg-dm-item').forEach(el => el.classList.remove('active'));
  $(`chan-feed`)?.classList.remove('active');
  $(`chan-${convId}`)?.classList.add('active');

  document.querySelectorAll('.msg-inner-tab').forEach((t, i) => {
    const tabs = ['feed', 'channels', 'dms'];
    t.classList.toggle('active', tabs[i] === _msgState.activeMobileTab);
  });

  mobileShowMain();

  const conv = _msgState.conversations.find(c => c.id === convId);
  if (!conv) return;
  const emoji = conv.titre?.split(' ')[0] || '💬';
  const titre = conv.titre?.substring(conv.titre.indexOf(' ') + 1) || conv.titre;
  const isPrive = conv.type === 'prive';

  const main = $('msg-main');
  if (!main) return;
  
  main.innerHTML = `
    <div class="msg-chan-header" style="background:var(--surface); border-bottom:1px solid var(--border); padding:12px 16px;">
      <button class="msg-back-btn" onclick="mobileBackToChannelList()">←</button>
      <div style="font-size:24px; margin-right:12px; background:var(--bg-2); width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center;">${emoji}</div>
      <div class="chat-header-info">
        <div class="msg-chan-title" style="font-size:18px; font-weight:800;">${escHtml(titre)}</div>
        <div class="msg-chan-desc" style="color:var(--text-3);">${isPrive ? '🔒 Conversation privée' : 'Canal'}</div>
      </div>
    </div>
    
    <div class="chat-messages" id="chat-messages" style="flex:1; overflow-y:auto; padding:16px;">
      <div style="text-align:center;padding:40px;"><div class="spinner"></div></div>
    </div>
    
    <div class="msg-reply-bar" id="msg-reply-bar" style="display:none; background:var(--surface-2); border-top:1px solid var(--border); padding:8px 16px; align-items:center; justify-content:space-between;">
      <div style="font-size:12px; color:var(--text-2);">
        <span style="color:var(--primary); font-weight:700;">↩️ Réponse à :</span>
        <span id="msg-reply-bar-content" style="margin-left:8px; font-style:italic;"></span>
      </div>
      <button onclick="clearReply()" style="background:none; border:none; cursor:pointer; color:var(--text-3); font-size:16px;">✕</button>
    </div>
    
    <div class="chat-input-bar" style="background:var(--surface); border-top:1px solid var(--border); padding:12px 16px;">
      <div class="chat-input-wrap" style="background:var(--bg-2); border-radius:24px; padding:4px 4px 4px 16px; border:1px solid var(--border); display:flex; align-items:center;">
        <button class="btn btn-ghost btn-sm" onclick="pickFeedEmoji(event)" style="padding:4px; font-size:20px; color:var(--text-3); margin-right:8px;">😀</button>
        <textarea class="chat-input" id="chat-input" placeholder="Message…" rows="1"
          style="flex:1; border:none; background:transparent; padding:10px 0; font-size:15px; resize:none; max-height:120px; outline:none;"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';onChatInput(event);saveCurrentDraft();"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}"></textarea>
        
        <div id="chat-mention-list" class="chat-mention-pop" style="display:none; position:absolute; bottom:100%; left:16px; right:16px; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:0 -4px 16px rgba(0,0,0,0.1); margin-bottom:8px; z-index:10;"></div>
        
        <button class="chat-send" style="width:40px; height:40px; border-radius:50%; background:var(--primary); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; margin-left:8px;" onclick="sendMessage()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
        </button>
      </div>
    </div>`;

  await loadMessages(convId);
  restoreCurrentDraft();
  _msgState.unreadByConv[convId] = 0;
  renderSidebarGroups();
  renderSidebarDMs();
  _updateMobileTabBadges();
  markConvRead(convId);
}

async function loadMessages(convId) {
  const { data, error } = await sb.from('messages')
    .select('*, profiles(nom, prenom), reply:reply_to_id(texte, profiles(prenom,nom))')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) { console.warn('[msg] loadMessages:', error.message); return; }
  _msgState.messages = data || [];

  const msgIds = (data||[]).map(m => m.id).filter(id => !String(id).startsWith('tmp-'));
  if (msgIds.length) {
    const { data: reacts } = await sb.from('reactions').select('*').in('target_id', msgIds).eq('target_type', 'message');
    _msgState.msgReactions = {};
    (reacts||[]).forEach(r => {
      if (!_msgState.msgReactions[r.target_id]) _msgState.msgReactions[r.target_id] = [];
      _msgState.msgReactions[r.target_id].push(r);
    });
  }

  renderMessageBubbles();
}

function renderMessageBubbles() {
  const el = $('chat-messages');
  if (!el) return;
  const msgs = _msgState.messages;
  
  if (!msgs.length) {
    el.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--text-3);"><div style="font-size:48px; margin-bottom:16px;">💬</div><div style="font-weight:700; font-size:16px; color:var(--text-1);">Nouvelle discussion</div><div>Soyez le premier à envoyer un message !</div></div>';
    return;
  }
  
  let lastDate = null, lastAuteur = null;
  const html = [];
  
  msgs.forEach((m, idx) => {
    const isMine = m.auteur_id === user.id;
    const auteur = m.profiles ? displayName(m.profiles.prenom, m.profiles.nom, null, '?') : '?';
    const d = new Date(m.created_at);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    
    const showSender = !isMine && auteur !== lastAuteur;
    const isConsecutive = auteur === lastAuteur && dateStr === lastDate;

    if (dateStr !== lastDate) {
      html.push(`<div style="display:flex; justify-content:center; margin:24px 0 16px;"><span style="background:var(--bg-2); border:1px solid var(--border); color:var(--text-3); font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 12px; border-radius:12px; letter-spacing:0.05em;">${dateStr}</span></div>`);
      lastDate = dateStr; 
      lastAuteur = null;
    }

    let replyHtml = '';
    if (m.reply) {
      const replyAuteur = m.reply.profiles ? displayName(m.reply.profiles.prenom, m.reply.profiles.nom, null, '?') : '?';
      replyHtml = `
      <div style="background:rgba(0,0,0,0.05); border-left:3px solid ${isMine ? 'rgba(255,255,255,0.5)' : 'var(--primary)'}; padding:6px 10px; border-radius:6px; margin-bottom:6px; font-size:12px; opacity:0.9;">
        <div style="font-weight:800; margin-bottom:2px;">${escHtml(replyAuteur)}</div>
        <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${formatRichText((m.reply.texte||'').substring(0,60))}</div>
      </div>`;
    }

    const texteHtml = formatRichText(m.texte || '');
    const color = avatarColor(auteur);

    const reacts = (_msgState.msgReactions || {})[m.id] || [];
    const rGroups = {};
    reacts.forEach(r => {
      if (!rGroups[r.emoji]) rGroups[r.emoji] = { count:0, mine:false };
      rGroups[r.emoji].count++;
      if (r.user_id === user.id) rGroups[r.emoji].mine = true;
    });
    const reactHtml = Object.entries(rGroups).map(([e, d]) =>
      `<div class="msg-reaction ${d.mine?'mine':''}" onclick="toggleMsgReaction('${m.id}','${e}')" style="background:${d.mine?'var(--primary-light)':'var(--surface)'}; border:1px solid ${d.mine?'var(--primary)':'var(--border)'}; padding:2px 6px; border-radius:12px; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
        <span>${e}</span><span style="color:${d.mine?'var(--primary)':'var(--text-3)'};">${d.count}</span>
      </div>`
    ).join('');

    html.push(`
    <div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin-bottom:${isConsecutive ? '4px' : '16px'}; max-width:85%; align-self:${isMine ? 'flex-end' : 'flex-start'}; position:relative;" class="msg-hover-zone">
      ${showSender ? `<div style="font-size:11px; font-weight:600; color:var(--text-3); margin-bottom:4px; padding-left:44px;">${escHtml(auteur)}</div>` : ''}
      <div style="display:flex; align-items:flex-end; gap:8px;">
        ${!isMine ? `<div style="width:28px; height:28px; border-radius:50%; background:${isConsecutive ? 'transparent' : color}; color:white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0;">${isConsecutive ? '' : auteur.charAt(0).toUpperCase()}</div>` : ''}
        
        <div style="position:relative;">
          <div style="background:${isMine ? 'var(--primary)' : 'var(--surface)'}; color:${isMine ? 'white' : 'var(--text-1)'}; padding:10px 14px; border-radius:18px; border-bottom-${isMine ? 'right' : 'left'}-radius:${isConsecutive ? '18px' : '4px'}; border:1px solid ${isMine ? 'var(--primary)' : 'var(--border)'}; font-size:14.5px; line-height:1.4; box-shadow:0 1px 2px rgba(0,0,0,0.05); word-break:break-word;">
            ${replyHtml}
            ${texteHtml}
          </div>
          
          <div class="msg-floating-actions" style="position:absolute; ${isMine ? 'right:100%; margin-right:8px;' : 'left:100%; margin-left:8px;'} top:50%; transform:translateY(-50%); display:flex; gap:4px; background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:4px; box-shadow:0 4px 12px rgba(0,0,0,0.1); opacity:0; transition:opacity 0.2s; pointer-events:none;">
             <button style="border:none; background:transparent; font-size:16px; cursor:pointer; padding:4px;" onclick="setReply('${m.id}','${escHtml(auteur).replace(/'/g,"\\'")}', '...')">↩️</button>
             ${EMOJIS.slice(0,3).map(e => `<button style="border:none; background:transparent; font-size:16px; cursor:pointer; padding:4px;" onclick="toggleMsgReaction('${m.id}','${e}')">${e}</button>`).join('')}
          </div>
        </div>
      </div>
      ${reactHtml ? `<div style="display:flex; gap:4px; margin-top:4px; ${isMine ? 'padding-right:4px;' : 'padding-left:44px;'}">${reactHtml}</div>` : ''}
      <div style="font-size:10px; color:var(--text-3); margin-top:4px; ${isMine ? 'padding-right:4px;' : 'padding-left:44px;'}">${timeStr}</div>
    </div>`);
    
    lastAuteur = auteur;
  });
  
  if (!document.getElementById('msg-hover-css')) {
    const s = document.createElement('style');
    s.id = 'msg-hover-css';
    s.innerHTML = `@media(min-width:769px){ .msg-hover-zone:hover .msg-floating-actions { opacity:1 !important; pointer-events:auto !important; } }`;
    document.head.appendChild(s);
  }

  el.innerHTML = `<div style="display:flex; flex-direction:column; padding:16px;">${html.join('')}</div>`;
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}

function setReply(msgId, auteur, texte) {
  _msgState.replyTo = { id: msgId, auteur, texte };
  const bar = $('msg-reply-bar');
  const content = $('msg-reply-bar-content');
  if (bar) bar.style.display = 'flex';
  if (content) content.textContent = `${auteur} : ${texte}`;
  $('chat-input')?.focus();
}

function clearReply() {
  _msgState.replyTo = null;
  const bar = $('msg-reply-bar');
  if (bar) bar.style.display = 'none';
}

async function sendMessage() {
  const input = $('chat-input');
  const texte = input?.value.trim();
  if (!texte || !_msgState.activeConvId) return;
  
  const replyState = _msgState.replyTo ? { ..._msgState.replyTo } : null;
  input.value = ''; input.style.height = 'auto';
  saveCurrentDraft();

  const payload = {
    conversation_id: _msgState.activeConvId,
    auteur_id: user.id,
    texte,
    reply_to_id: replyState?.id || null,
    reply_preview: replyState ? `${replyState.auteur} : ${replyState.texte}` : null,
  };

  clearReply();

  const { data: inserted, error } = await sb.from('messages')
    .insert(payload)
    .select('*, profiles(nom, prenom), reply:reply_to_id(texte, profiles(prenom,nom))')
    .single();
    
  if (error) { toast('Erreur envoi', 'err'); return; }

  _msgState.messages.push(inserted || {
    ...payload, id: 'tmp-' + Date.now(),
    created_at: new Date().toISOString(),
    profiles: { prenom: profile?.prenom, nom: profile?.nom },
    reply: replyState ? { texte: replyState.texte, profiles: { prenom: replyState.auteur } } : null,
  });
  
  renderMessageBubbles();
  markConvRead(_msgState.activeConvId);
}

async function toggleMsgReaction(msgId, emoji) {
  if (!_msgState.msgReactions) _msgState.msgReactions = {};
  const reacts = _msgState.msgReactions[msgId] || [];
  const existing = reacts.find(r => r.user_id === user.id && r.emoji === emoji);
  
  if (existing) {
    await sb.from('reactions').delete().eq('id', existing.id);
    _msgState.msgReactions[msgId] = reacts.filter(r => r.id !== existing.id);
  } else {
    const { data } = await sb.from('reactions').insert({
      user_id: user.id, target_id: msgId, target_type: 'message', emoji
    }).select().single();
    if (!_msgState.msgReactions[msgId]) _msgState.msgReactions[msgId] = [];
    if (data) _msgState.msgReactions[msgId].push(data);
  }
  renderMessageBubbles();
}

async function markConvRead(convId) {
  await sb.from('conversation_membres').upsert({
    conversation_id: convId, user_id: user.id,
    lu_jusqu_a: new Date().toISOString()
  }, { onConflict: 'conversation_id,user_id' });
}

// ─── MENTIONS ET DM PRIVÉ ────────────────────────────────────────────────────
async function onChatInput(e) {
  const ta = e.target;
  const val = ta.value;
  const cursor = ta.selectionStart;
  const before = val.substring(0, cursor);
  const atMatch = before.match(/@([a-zA-ZÀ-ÿ-]*)$/);
  const ml = $('chat-mention-list');
  
  if (!atMatch) { if (ml) ml.style.display = 'none'; return; }
  
  const query = atMatch[1].toLowerCase();
  const { data: profs } = await sb.from('profiles').select('id,nom,prenom,role')
    .or(`prenom.ilike.${query}%,nom.ilike.${query}%`).neq('id', user.id).limit(5);
    
  const list = profs || [];
  if (!ml || !list.length) { if (ml) ml.style.display = 'none'; return; }
  
  const roleL = { administrateur:'Admin', syndic:'Syndic', membre_cs:'CS', 'copropriétaire':'Copro' };
  
  ml.innerHTML = list.map(p => `
    <div class="mention-item" onclick="insertChatMention('${p.id}','${(p.prenom||p.nom||'').replace(/'/g,"\\'")}','${(p.nom||'').replace(/'/g,"\\'")}')" style="display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border);">
      <div style="width:24px; height:24px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">${(p.prenom||p.nom||'?').charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:600; font-size:13px; color:var(--text-1);">${displayName(p.prenom,p.nom,null,'?')}</div>
        <div style="font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.05em;">${roleL[p.role]||p.role}</div>
      </div>
    </div>`).join('');
  ml.style.display = 'block';
}

function insertChatMention(userId, prenom, nom) {
  const ta = $('chat-input');
  const ml = $('chat-mention-list');
  if (!ta) return;
  const val = ta.value;
  const cursor = ta.selectionStart;
  const name = displayName(prenom, nom, null, prenom);
  const newBefore = val.substring(0, cursor).replace(/@[a-zA-ZÀ-ÿ-]*$/, `@${name} `);
  ta.value = newBefore + val.substring(cursor);
  ta.selectionStart = ta.selectionEnd = newBefore.length;
  ta.focus();
  if (ml) ml.style.display = 'none';
}

async function openNewDM() {
  const { data: users } = await sb.from('profiles')
    .select('id,nom,prenom,email').eq('actif', true).neq('id', user.id).order('prenom');
  if (!users?.length) { toast('Aucun autre utilisateur', 'warn'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'dm-modal';
  overlay.innerHTML = `
  <div class="modal" style="max-width:400px; border-radius:16px;">
    <div class="mh" style="border-bottom:1px solid var(--border); padding:16px 20px;">
      <span class="mh-title" style="font-size:18px; font-weight:800;">Nouveau Message</span>
      <button class="mclose" onclick="$('dm-modal').remove()">×</button>
    </div>
    <div class="mb" style="padding:20px;">
      <div style="position:relative; margin-bottom:16px;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px; opacity:0.5;">🔍</span>
        <input class="input" id="dm-search" placeholder="Rechercher un résident…" oninput="filterDMList()" style="margin:0; padding-left:36px; border-radius:12px;">
      </div>
      <div id="dm-user-list" style="max-height:300px; overflow-y:auto; margin:0 -20px; padding:0 20px;">
        ${users.map(u => {
          const nom = displayName(u.prenom, u.nom, u.email, 'Résident');
          const color = avatarColor(nom);
          return `
          <div class="msg-dm-item" style="padding:10px 12px; border-radius:12px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'" onclick="startDM('${u.id}','${nom.replace(/'/g,"\\'")}')">
            <div style="background:${color}; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:16px; font-weight:800; flex-shrink:0;">${nom.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:700; font-size:14px; color:var(--text-1);">${escHtml(nom)}</div>
              <div style="font-size:11px; color:var(--text-3);">${u.email}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => $('dm-search')?.focus(), 50);
}

function filterDMList() {
  const q = $('dm-search')?.value.toLowerCase() || '';
  document.querySelectorAll('#dm-user-list .msg-dm-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
  });
}

async function startDM(targetId, targetNom) {
  $('dm-modal')?.remove();
  const existing = _msgState.conversations.find(c =>
    c.type === 'prive' && (c.membre_a === targetId || c.membre_b === targetId)
  );
  if (existing) { openConv(existing.id); return; }

  const titre = `🔒 ${targetNom}`;
  const { data: conv } = await sb.from('conversations')
    .insert({ titre, type: 'prive', created_by: user.id, membre_a: user.id, membre_b: targetId })
    .select().single();
    
  if (conv) {
    await sb.from('conversation_membres').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetId }
    ]);
    await loadConversations();
    openConv(conv.id);
  }
}

function filterConvsByRole(convs) {
  return convs.filter(c => {
    if (c.titre?.includes('Conseil Syndical')) {
      return ['administrateur','syndic','membre_cs'].includes(profile?.role);
    }
    return true;
  });
}

function pickFeedEmoji(e) {
  const btn = e.target.closest('button');
  const existing = document.querySelector('.emoji-picker');
  if (existing) { existing.remove(); return; }
  const picker = document.createElement('div');
  picker.className = 'emoji-picker';
  picker.style.cssText = 'position:fixed; z-index:200; background:var(--surface); border:1px solid var(--border); padding:8px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.1); display:flex; gap:4px;';
  const rect = btn.getBoundingClientRect();
  picker.style.left = rect.left + 'px';
  picker.style.top = (rect.top - 48) + 'px';
  picker.innerHTML = EMOJIS.map(e =>
    `<button style="border:none; background:transparent; font-size:20px; cursor:pointer; padding:4px; border-radius:8px;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'" onclick="insertFeedEmoji('${e}')">${e}</button>`
  ).join('');
  document.body.appendChild(picker);
  setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 10);
}

function insertFeedEmoji(emoji) {
  const input = $('feed-compose-modal-input') || $('chat-input');
  if (input) {
    const pos = input.selectionStart || input.value.length;
    input.value = input.value.slice(0, pos) + emoji + input.value.slice(pos);
    input.focus();
  }
}

// ─── FILTER ───
function setFeedFilter(cat) {
  _msgState.feedFilter = cat;
  document.querySelectorAll('.feed-cat-chip').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
    el.setAttribute('aria-pressed', el.dataset.cat === cat ? 'true' : 'false');
  });
  renderFeed();
}

// ─── SMART COMPOSER (Formulaires Spécifiques) ────────────────────────────────
function renderSmartComposerForm(cat) {
  const container = $('smart-compose-fields');
  if (!container) return;

  const phMap = {
    panneau: 'Message officiel visible par toute la résidence…',
    entraide: 'Demande ou offre d\'aide entre voisins…',
    vie_quartier: 'Un mot sympa, idée de rencontre…',
    pratique: 'Horaires, accès, info utile…',
  };
  const ph = phMap[cat] || 'Écrire un message...';

  let html = '';

  const toolbar = `
    <div style="display:flex; gap:4px; padding:8px 12px; background:var(--surface-2); border-radius:12px 12px 0 0; border:1px solid var(--border); border-bottom:none;">
      <button class="btn btn-ghost btn-sm" onclick="insertMarkdown('**', '**')" style="padding:4px 8px; font-weight:800;" title="Gras">B</button>
      <button class="btn btn-ghost btn-sm" onclick="insertMarkdown('*', '*')" style="padding:4px 8px; font-style:italic;" title="Italique">I</button>
      <button class="btn btn-ghost btn-sm" onclick="insertMarkdown('### ', '')" style="padding:4px 8px; font-weight:800;" title="Titre">T</button>
      <div style="width:1px; background:var(--border); margin:0 4px;"></div>
      <button class="btn btn-ghost btn-sm" onclick="pickFeedEmoji(event)" style="padding:4px 8px;" title="Emoji">😀</button>
    </div>`;

  if (cat === 'petites_annonces') {
    html = `
      <div class="fg-row" style="margin-bottom:12px;">
        <div class="fg" style="flex:2; margin:0;"><input type="text" id="fc-titre" class="input" placeholder="Titre de l'annonce *" style="font-weight:700;"></div>
        <div class="fg" style="flex:1; margin:0;"><input type="text" id="fc-prix" class="input" placeholder="Prix (€) ou Don"></div>
      </div>
      ${toolbar}
      <textarea id="feed-compose-modal-input" class="input" rows="4" placeholder="Description de l'objet ou du service..." style="resize:none; min-height:100px; border-radius:0 0 12px 12px; margin-top:0;" oninput="saveCurrentDraft()"></textarea>
    `;
  } else if (cat === 'evenements') {
    html = `
      <div class="fg" style="margin-bottom:12px;"><input type="text" id="fc-titre" class="input" placeholder="Nom de l'événement *" style="font-weight:700;"></div>
      <div class="fg-row" style="margin-bottom:12px;">
        <div class="fg" style="flex:1; margin:0;"><input type="datetime-local" id="fc-date" class="input"></div>
        <div class="fg" style="flex:1; margin:0;"><input type="text" id="fc-lieu" class="input" placeholder="Lieu (ex: Hall, Parc)"></div>
      </div>
      ${toolbar}
      <textarea id="feed-compose-modal-input" class="input" rows="3" placeholder="Informations complémentaires..." style="resize:none; min-height:80px; border-radius:0 0 12px 12px; margin-top:0;" oninput="saveCurrentDraft()"></textarea>
    `;
  } else if (cat === 'panneau') {
    html = `
      <div class="fg" style="margin-bottom:12px;"><input type="text" id="fc-titre" class="input" placeholder="Titre de l'affiche officielle *" style="font-weight:800; font-size:16px; border-color:var(--orange); color:var(--orange);"></div>
      ${toolbar}
      <textarea id="feed-compose-modal-input" class="input" rows="6" placeholder="${ph}" style="resize:none; min-height:140px; border-radius:0 0 12px 12px; margin-top:0;" oninput="saveCurrentDraft()"></textarea>
    `;
  } else {
    html = `
      ${toolbar}
      <textarea id="feed-compose-modal-input" class="input" rows="5" placeholder="${ph}" style="resize:none; min-height:120px; border-radius:0 0 12px 12px; margin-top:0;" oninput="saveCurrentDraft()"></textarea>
    `;
  }

  container.innerHTML = html;
  setTimeout(() => $('fc-titre') ? $('fc-titre').focus() : $('feed-compose-modal-input')?.focus(), 50);
}

function insertMarkdown(prefix, suffix) {
  const ta = $('feed-compose-modal-input') || $('chat-input');
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selectedText = text.substring(start, end);
  
  ta.value = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
  ta.focus();
  if (!selectedText) ta.selectionEnd = start + prefix.length;
}

// ─── Modale Compose (Ouverture / Fermeture / Publication) ───
function setFeedComposeCategory(cat) {
  const ok = feedComposeCatsForUser().some(c => c.id === cat);
  if (!ok) return;
  _msgState.feedComposeCategory = cat;
  try { localStorage.setItem(FEED_COMPOSE_CAT_KEY, cat); } catch { }
  
  document.querySelectorAll('.feed-modal-cat').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  
  renderSmartComposerForm(cat);
}

function openFeedComposeModal() {
  $('feed-compose-modal-overlay')?.remove();

  const cat = _msgState.feedComposeCategory || readStoredFeedComposeCat();
  const composeCatHtml = feedComposeCatsForUser().map(c => {
    const on = cat === c.id;
    return `<button type="button" class="feed-modal-cat ${on ? 'active' : ''}" data-cat="${c.id}"
      onclick="setFeedComposeCategory('${c.id}')" style="padding:8px 12px; font-size:13px; font-weight:600;">${c.emoji} ${escHtml(c.label)}</button>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'feed-compose-modal-overlay';
  overlay.id = 'feed-compose-modal-overlay';
  overlay.innerHTML = `
    <div class="feed-compose-modal" id="feed-compose-modal" style="border-radius:20px; max-width:600px;">
      <div class="feed-compose-modal-header" style="border-bottom:1px solid var(--border); padding:16px 24px;">
        <span class="feed-compose-modal-title" style="font-size:18px; font-weight:800;">Publier un message</span>
        <button class="feed-compose-modal-close" style="font-size:24px; color:var(--text-3);" onclick="closeFeedComposeModal()">×</button>
      </div>
      <div class="feed-compose-modal-body" style="padding:20px 24px;">
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:10px;">Catégorie</div>
          <div class="feed-modal-cats" style="display:flex; flex-wrap:wrap; gap:8px;">${composeCatHtml}</div>
        </div>
        <div id="smart-compose-fields"></div>
      </div>
      <div class="feed-compose-modal-footer" style="padding:16px 24px; border-top:1px solid var(--border); background:var(--bg-2);">
        <button type="button" class="btn btn-secondary" onclick="closeFeedComposeModal()">Annuler</button>
        <button id="btn-publish-feed" type="button" class="btn btn-primary" style="padding:10px 24px; font-size:15px; border-radius:12px;" onclick="publishFeedPost()">Publier</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeFeedComposeModal(); });
  renderSmartComposerForm(cat);
}

function closeFeedComposeModal() {
  const overlay = $('feed-compose-modal-overlay');
  if (!overlay) return;
  overlay.style.animation = 'fadeOut .15s ease forwards';
  setTimeout(() => overlay.remove(), 150);
}

async function publishFeedPost() {
  const cat = _msgState.feedComposeCategory;
  const input = $('feed-compose-modal-input');
  let contenu = input?.value.trim() || '';
  
  const btn = $('btn-publish-feed');
  if (btn) { btn.disabled = true; btn.textContent = 'Publication...'; }

  let titre_panneau = '';
  
  if (cat === 'petites_annonces') {
    const t = $('fc-titre')?.value.trim();
    const p = $('fc-prix')?.value.trim();
    if (!t) { toast('Titre de l\'annonce requis', 'err'); btn.disabled=false; return; }
    contenu = `### 🏷️ ${t}\n${p ? `**Prix / Modalité :** ${p}\n` : ''}\n${contenu}`;
  } 
  else if (cat === 'evenements') {
    const t = $('fc-titre')?.value.trim();
    const d = $('fc-date')?.value;
    const l = $('fc-lieu')?.value.trim();
    if (!t) { toast('Nom de l\'événement requis', 'err'); btn.disabled=false; return; }
    const dateStr = d ? new Date(d).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'}) : '';
    contenu = `### 🎉 ${t}\n${dateStr ? `📅 **Quand :** ${dateStr}\n` : ''}${l ? `📍 **Lieu :** ${l}\n` : ''}\n${contenu}`;
  }
  else if (cat === 'panneau') {
    const t = $('fc-titre')?.value.trim();
    if (!t) { toast('Titre officiel requis', 'err'); btn.disabled=false; return; }
    titre_panneau = t;
  }

  if (!contenu && cat !== 'panneau') { 
    toast('Le message ne peut pas être vide', 'err'); 
    if(btn) btn.disabled=false; 
    return; 
  }

  const row = { auteur_id: user.id, contenu, type: 'post', categorie: cat };
  if (titre_panneau) row.titre_panneau = titre_panneau;

  const { data: newPost, error } = await insertFeedPostRow(row, { selectProfiles: true });

  if (error) { 
    toast('Erreur publication', 'err'); 
    if(btn) { btn.disabled=false; btn.textContent='Publier'; }
    return; 
  }
  
  if (newPost) {
    if (!newPost.profiles) newPost.profiles = { id: user.id, prenom: profile?.prenom, nom: profile?.nom, email: user.email };
    _msgState.feed = sortFeedPosts([newPost, ..._msgState.feed.filter(x => x.id !== newPost.id)]);
  }
  
  closeFeedComposeModal();
  renderFeed();
  toast('Publié avec succès !', 'ok');
}

// ─── RENDER FEED ────────────────────────────────────────────────────────────
async function openFeed() {
  saveCurrentDraft();
  _msgState.activeChanType = 'feed';
  _msgState.activeConvId = null;
  _msgState.activeMobileTab = 'feed';
  _msgState.feedComposeCategory = readStoredFeedComposeCat();

  document.querySelectorAll('.msg-chan-item,.msg-dm-item').forEach(el => el.classList.remove('active'));
  $('chan-feed')?.classList.add('active');

  document.querySelectorAll('.msg-inner-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });

  mobileShowMain();

  const main = $('msg-main');
  if (!main) return;

  const split = $('feed-split');
  if (split) split.classList.remove('thread-active');

  const chipHtml = FEED_COMMUNITY_CATS.map(c => {
    const active = _msgState.feedFilter === c.id;
    const cnt = feedCountForFilter(c.id);
    return `<button type="button" class="feed-cat-chip ${active ? 'active' : ''}" data-cat="${c.id}"
      aria-pressed="${active ? 'true' : 'false'}" onclick="setFeedFilter('${c.id}')">
      <span class="feed-cat-chip-ico">${c.emoji}</span>
      <span class="feed-cat-chip-lbl">${escHtml(c.label)}</span>
      <span class="feed-cat-chip-badge" id="feed-cat-count-${c.id}" style="${cnt > 0 ? '' : 'display:none;'}">${cnt > 0 ? cnt : ''}</span>
    </button>`;
  }).join('');

  main.innerHTML = `
    <div class="msg-chan-header feed-header-compact" style="background:var(--surface); border-bottom:1px solid var(--border);">
      <button class="msg-back-btn" onclick="mobileShowSidebar()">←</button>
      <div style="font-size:24px;margin-right:8px; background:var(--blue-light); padding:8px; border-radius:12px;">🏘️</div>
      <div>
        <div class="msg-chan-title" style="font-size:18px;">Fil du quartier</div>
        <div class="msg-chan-desc">Espace d'échange et petites annonces</div>
      </div>
    </div>

    <div class="feed-categories-bar" style="background:var(--bg-1);">
      <div class="feed-cat-chips-scroll" id="feed-cat-chips" style="padding:12px 16px;">${chipHtml}</div>
    </div>

    <button class="feed-fab-mobile" onclick="openFeedComposeModal()" style="
      position:fixed; bottom:24px; right:24px; width:60px; height:60px; border-radius:30px;
      background:var(--primary); color:white; border:none; box-shadow:0 8px 24px rgba(59,130,246,0.4);
      display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100; font-size:28px;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>

    <div class="feed-split" id="feed-split">
      <div class="feed-left-pane" id="feed-left-pane" style="background:var(--bg-2);">
        
        <div class="feed-compose-desktop" style="background:var(--surface); padding:16px; margin:16px; border-radius:16px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,0.02); display:none; align-items:center; gap:16px; cursor:text;" onclick="openFeedComposeModal()">
          <div style="width:40px;height:40px;background:var(--primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">${(profile?.prenom||'U').charAt(0)}</div>
          <div style="flex:1; color:var(--text-3); font-size:15px; font-weight:500;">Partager avec vos voisins...</div>
          <div style="background:var(--bg-2); padding:8px; border-radius:50%;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        </div>

        <div class="feed-scroll feed-scroll--community" id="feed-left-scroll">
          <div style="text-align:center;padding:40px;"><div class="spinner"></div></div>
        </div>
      </div>

      <div class="feed-thread-pane" id="feed-thread-pane" style="background:var(--surface);">
        <div class="feed-thread-empty" id="feed-thread-empty" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-3);">
          <div style="font-size:64px;margin-bottom:16px; opacity:0.5;">💬</div>
          <div style="font-family:var(--font-head);font-weight:800;font-size:18px;margin-bottom:8px; color:var(--text-2);">Ouvrez une discussion</div>
          <div style="font-size:14px; max-width:250px; text-align:center; line-height:1.5;">
            Cliquez sur "Commenter" sous un message pour afficher les réponses ici.
          </div>
        </div>
      </div>
    </div>`;

  const style = document.createElement('style');
  style.innerHTML = `@media(min-width:769px) { .feed-compose-desktop { display:flex !important; } .feed-fab-mobile { display:none !important; } }`;
  $('msg-main').appendChild(style);

  await loadFeed();
}

async function loadFeed() {
  const { data: posts } = await sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .neq('type', 'comment')
    .order('created_at', { ascending: false })
    .limit(120);

  const { data: reactions } = await sb.from('reactions').select('*').eq('target_type', 'post');

  _msgState.feedReactions = {};
  (reactions || []).forEach(r => {
    const tid = String(r.target_id);
    if (!_msgState.feedReactions[tid]) _msgState.feedReactions[tid] = [];
    _msgState.feedReactions[tid].push(r);
  });

  _msgState.feed = sortFeedPosts(posts || []);
  renderFeed();
}

function feedCatAccent(cat) {
  const m = {
    panneau: '#ea580c', entraide: '#2563eb', petites_annonces: '#7c3aed',
    vie_quartier: '#059669', evenements: '#db2777', pratique: '#0d9488', activite: '#64748b',
  };
  return m[cat] || 'var(--accent)';
}

function renderFeed() {
  const el = $('feed-left-scroll');
  if (!el) return;
  const rows = sortFeedPosts((_msgState.feed || []).filter(p => p.type !== 'comment'));
  const f = _msgState.feedFilter || 'tout';
  const inFilter = p => f === 'tout' || feedPostCategory(p) === f;

  FEED_COMMUNITY_CATS.forEach(c => {
    const badge = $(`feed-cat-count-${c.id}`);
    if (!badge) return;
    const n = feedCountForFilter(c.id);
    badge.textContent = n > 0 ? String(n) : '';
    badge.style.display = n > 0 ? '' : 'none';
  });

  const filtered = rows.filter(inFilter);
  if (!filtered.length) {
    el.innerHTML = `
      <div style="text-align:center; padding:60px 20px; background:var(--surface); margin:16px; border-radius:16px; border:1px dashed var(--border);">
        <div style="font-size:48px; margin-bottom:16px;">🌱</div>
        <div style="font-family:var(--font-head); font-weight:800; font-size:18px; color:var(--text-1); margin-bottom:8px;">C'est bien calme par ici</div>
        <div style="color:var(--text-3); font-size:14px; max-width:300px; margin:0 auto;">Soyez le premier à partager une annonce ou une information dans cette rubrique.</div>
      </div>`;
    return;
  }

  const pinnedBlock = filtered.filter(p => p.epingle && p.type === 'post');
  const rest = filtered.filter(p => !(p.epingle && p.type === 'post'));
  const showBoard = pinnedBlock.length && (f === 'tout' || f === 'panneau');

  let html = '';
  if (showBoard) {
    html += `<section class="feed-board-section" style="margin:16px; background:var(--amber-light); border:1px solid var(--amber-border); border-radius:16px; padding:16px;">
      <header style="display:flex; gap:12px; align-items:center; margin-bottom:16px;">
        <span style="font-size:24px;">📌</span>
        <div>
          <div style="font-weight:800; font-size:16px; color:var(--amber);">Panneau d'affichage</div>
          <div style="font-size:12px; font-weight:600; color:var(--text-2); opacity:0.8;">Informations importantes de la résidence</div>
        </div>
      </header>
      <div class="feed-board-posts">${pinnedBlock.map(p => renderFeedPost(p, true)).join('')}</div>
    </section>`;
  }

  if (rest.length) {
    html += `<div style="padding:0 16px;">` + rest.map(p => renderFeedPost(p)).join('') + `</div>`;
  }

  el.innerHTML = html;
  restoreFeedOpenCommentThreads();
}

function renderFeedPost(p, isPinnedBoard = false) {
  const auteur = p.profiles ? displayName(p.profiles.prenom, p.profiles.nom, p.profiles.email, 'Résident') : 'Résident';
  const initiale = auteur.charAt(0).toUpperCase();
  const color = avatarColor(auteur);
  const time = typeof depuisJours === 'function' ? depuisJours(p.created_at) : '';
  const isMine = p.auteur_id === user?.id;
  const cat = feedPostCategory(p);
  const cmeta = feedCatMeta(cat);
  const affiche = p.epingle && p.type === 'post';
  const accent = feedCatAccent(cat);
  const badge = `<span style="background:${accent}15; color:${accent}; font-size:10px; font-weight:800; padding:3px 8px; border-radius:10px; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">${cmeta.emoji} ${escHtml(cmeta.label)}</span>`;
  const unread = _msgState.feedCommentUnreadByPost[String(p.id)] || 0;

  const reacts = _msgState.feedReactions[String(p.id)] || [];
  const reactGroups = {};
  reacts.forEach(r => {
    if (!reactGroups[r.emoji]) reactGroups[r.emoji] = { count: 0, mine: false };
    reactGroups[r.emoji].count++;
    if (r.user_id === user?.id) reactGroups[r.emoji].mine = true;
  });
  
  const reactHtml = Object.entries(reactGroups).map(([emoji, data]) =>
    `<div class="feed-reaction ${data.mine?'mine':''}" onclick="toggleFeedReaction('${p.id}','${emoji}')" style="background:${data.mine?'var(--primary-light)':'var(--bg-2)'}; border:1px solid ${data.mine?'var(--primary)':'var(--border)'}; padding:4px 8px; border-radius:16px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
      <span>${emoji}</span> <span style="color:${data.mine?'var(--primary)':'var(--text-2)'};">${data.count}</span>
    </div>`
  ).join('');

  let body = '';
  if (p.type === 'post') {
    const titreBloc = p.titre_panneau ? `<div style="font-family:var(--font-head); font-size:18px; font-weight:800; color:var(--text-1); margin-bottom:8px;">${escHtml(p.titre_panneau)}</div>` : '';
    body = `${titreBloc}<div style="font-size:14.5px; line-height:1.6; color:var(--text-1); word-break:break-word;">${formatRichText(p.contenu)}</div>`;
  } else if (p.type === 'ticket') {
    body = `<div style="background:var(--blue-light); border:1px solid var(--blue-border); padding:12px; border-radius:10px; color:var(--accent); font-weight:600;">🔧 ${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'resolved') {
    body = `<div style="background:var(--green-light); border:1px solid var(--green-border); padding:12px; border-radius:10px; color:var(--green); font-weight:600;">✅ ${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'vote') {
    body = `<div style="background:var(--purple-light); border:1px solid #c4b5fd; padding:12px; border-radius:10px; color:#6d28d9; font-weight:600;">🗳️ ${escHtml(p.contenu)}</div>`;
  }

  const pinBtn = (typeof canManageAnnonces === 'function' && canManageAnnonces()) && p.type === 'post' && !isPinnedBoard
    ? `<button class="btn btn-ghost btn-sm" style="padding:4px;" onclick="event.preventDefault();toggleFeedPin('${p.id}')">${p.epingle ? '📌' : '📍'}</button>` : '';

  return `
  <div class="card" id="post-${p.id}" style="padding:16px 20px; margin-bottom:16px; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.02); ${affiche ? 'border:1px solid var(--amber-border);' : 'border:1px solid var(--border);'}">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="width:40px; height:40px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800;">${initiale}</div>
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; font-size:15px; color:var(--text-1);">${escHtml(auteur)}</span>
            ${badge}
          </div>
          <div style="font-size:11px; font-weight:600; color:var(--text-3); margin-top:2px;">🕒 ${time}</div>
        </div>
      </div>
      <div style="display:flex; gap:4px;">
        ${pinBtn}
        ${isMine ? `<button class="btn btn-ghost btn-sm" style="padding:4px; color:var(--text-3);" onclick="deleteFeedPost('${p.id}')" title="Supprimer">✕</button>` : ''}
      </div>
    </div>
    
    <div style="margin-bottom:16px;">${body}</div>
    
    ${reactHtml ? `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">${reactHtml}</div>` : ''}
    
    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:12px;">
      <div style="display:flex; gap:8px;">
        ${EMOJIS.slice(0,3).map(e => `<button class="btn btn-ghost btn-sm" style="padding:6px 10px; font-size:16px; background:var(--bg-2);" onclick="toggleFeedReaction('${p.id}','${e}')">${e}</button>`).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" style="border-radius:20px; padding:6px 16px; font-weight:700; color:var(--text-2);" onclick="openFeedThread('${p.id}')">
        💬 Commenter
        ${unread > 0 ? `<span style="background:var(--primary); color:white; font-size:10px; padding:2px 6px; border-radius:10px; margin-left:6px;">${unread}</span>` : ''}
      </button>
    </div>
  </div>`;
}

// ─── ACTIONS SUR LE FEED (Suppression, Epinglage, Réactions) ─────────────────
async function deleteFeedPost(postId) {
  if (!confirm('Voulez-vous vraiment supprimer ce post et tous ses commentaires ?')) return;
  await sb.from('feed_posts').delete().eq('id', postId);
  _msgState.feed = _msgState.feed.filter(p => p.id !== postId);
  renderFeed();
}

async function toggleFeedPin(postId) {
  if (typeof canManageAnnonces === 'function' && !canManageAnnonces()) return;
  const post = _msgState.feed.find(p => p.id === postId);
  if (!post || post.type !== 'post') return;
  const next = !post.epingle;
  const { error } = await sb.from('feed_posts').update({ epingle: next }).eq('id', postId);
  if (error) return;
  post.epingle = next;
  _msgState.feed = sortFeedPosts(_msgState.feed);
  renderFeed();
}

async function toggleFeedReaction(postId, emoji) {
  const sid = String(postId);
  let reacts = _msgState.feedReactions[sid] || [];
  const existing = reacts.find(r => r.user_id === user.id && r.emoji === emoji);
  if (existing) {
    await sb.from('reactions').delete().eq('id', existing.id);
    reacts = reacts.filter(r => r.id !== existing.id);
    _msgState.feedReactions[sid] = reacts;
  } else {
    const { data } = await sb.from('reactions').insert({
      user_id: user.id, target_id: sid, target_type: 'post', emoji
    }).select().single();
    if (!_msgState.feedReactions[sid]) _msgState.feedReactions[sid] = [];
    if (data) _msgState.feedReactions[sid].push(data);
  }
  const postEl = $(`post-${sid}`);
  const post = _msgState.feed.find(p => String(p.id) === sid);
  if (postEl && post) {
    postEl.outerHTML = renderFeedPost(post, _msgState.feedFilter === 'tout' || _msgState.feedFilter === 'panneau');
  }
}

// ─── THREAD (Fil de commentaires) ──────────────────────────────────────────
async function openFeedThread(postId) {
  const sid = String(postId);
  _msgState.activeFeedThreadPostId = sid;
  _msgState.feedThreadRenderedCommentIds = new Set();
  _msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
  _msgState.feedCommentUnreadByPost[sid] = 0;

  const split = $('feed-split');
  if (split) split.classList.add('thread-active');

  let post = _msgState.feed.find(p => String(p.id) === sid);
  if (!post) {
    const { data } = await sb.from('feed_posts').select('*, profiles(id,prenom,nom,email)').eq('id', sid).single();
    post = data;
  }
  if (!post) return;

  const threadPane = $('feed-thread-pane');
  if (!threadPane) return;

  const postHtml = renderFeedPost(post).replace('border-top:1px solid var(--border); padding-top:12px;', 'display:none;');

  threadPane.innerHTML = `
    <div style="display:flex; flex-direction:column; height:100%; background:var(--surface);">
      <div style="display:flex; align-items:center; padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg-1); gap:16px; z-index:10; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <button class="btn btn-ghost btn-sm" style="padding:8px; font-size:18px;" onclick="closeFeedThread()">←</button>
        <h3 style="font-family:var(--font-head); font-size:16px; font-weight:800; margin:0;">Discussion</h3>
      </div>
      
      <div id="feed-thread-scroll" style="flex:1; overflow-y:auto; padding:16px; background:var(--bg-2);">
        <div style="opacity:0.8; margin-bottom:24px;">${postHtml}</div>
        
        <div style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:16px; padding-left:8px;">Commentaires</div>
        <div id="feed-thread-comments-list" style="display:flex; flex-direction:column; gap:12px;"></div>
        
        <div style="text-align:center; margin-top:16px;">
          <button id="feed-thread-load-more-btn" class="btn btn-ghost btn-sm" style="display:none;" onclick="loadFeedThreadOlder()">Charger plus anciens</button>
        </div>
      </div>
      
      <div style="padding:12px 16px; background:var(--surface); border-top:1px solid var(--border);">
        <div style="display:flex; align-items:flex-end; gap:12px; background:var(--bg-2); border:1px solid var(--border); border-radius:24px; padding:4px 4px 4px 16px;">
          <textarea id="feed-thread-comment-input" style="flex:1; border:none; background:transparent; padding:8px 0; font-size:14px; resize:none; max-height:120px; outline:none;" placeholder="Écrire une réponse..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFeedThreadComment();}"></textarea>
          <button style="width:36px; height:36px; border-radius:50%; background:var(--primary); color:white; border:none; display:flex; align-items:center; justify-content:center; flex-shrink:0; cursor:pointer;" onclick="sendFeedThreadComment()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  await loadFeedThreadComments(sid, { older: false });
}

function closeFeedThread() {
  _msgState.activeFeedThreadPostId = null;
  const split = $('feed-split');
  if (split) split.classList.remove('thread-active');
  const pane = $('feed-thread-pane');
  if (pane) pane.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-3);"><div style="font-size:64px;margin-bottom:16px; opacity:0.5;">💬</div><div style="font-family:var(--font-head);font-weight:800;font-size:18px;">Ouvrez une discussion</div></div>`;
}

function renderFeedCommentLine(c) {
  const auteur = c.profiles ? displayName(c.profiles.prenom, c.profiles.nom, c.profiles.email, 'Résident') : 'Résident';
  const color = avatarColor(auteur);
  const timeStr = typeof depuisJours === 'function' ? depuisJours(c.created_at) : '';
  const isMe = c.auteur_id === (typeof user !== 'undefined' ? user.id : null);
  
  return `
  <div style="display:flex; gap:12px; align-items:flex-end; align-self:${isMe ? 'flex-end' : 'flex-start'}; max-width:85%;">
    ${!isMe ? `<div style="width:28px; height:28px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0;">${auteur.charAt(0).toUpperCase()}</div>` : ''}
    
    <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'};">
      <div style="font-size:11px; font-weight:600; color:var(--text-3); margin-bottom:4px; padding:0 4px;">
        ${isMe ? timeStr : `${escHtml(auteur)} • ${timeStr}`}
      </div>
      <div style="background:${isMe ? 'var(--primary)' : 'var(--surface)'}; color:${isMe ? 'white' : 'var(--text-1)'}; padding:10px 14px; border-radius:16px; border-bottom-${isMe ? 'right' : 'left'}-radius:4px; font-size:13.5px; line-height:1.4; border:1px solid ${isMe ? 'var(--primary)' : 'var(--border)'}; box-shadow:0 1px 2px rgba(0,0,0,0.05); word-break:break-word;">
        ${formatRichText(c.contenu)}
      </div>
    </div>
  </div>`;
}

function setFeedThreadHasMore(hasMore, oldestLoadedAt) {
  _msgState.feedThreadState.hasMore = !!hasMore;
  _msgState.feedThreadState.oldestLoadedAt = oldestLoadedAt || null;
}

function loadFeedThreadOlder() {
  const sid = _msgState.activeFeedThreadPostId;
  if (!sid) return;
  loadFeedThreadComments(sid, { older: true });
}

async function loadFeedThreadComments(postId, { older = false } = {}) {
  const sid = String(postId);
  const listEl = $('feed-thread-comments-list');
  const scrollEl = $('feed-thread-scroll');
  const btnEl = $('feed-thread-load-more-btn');
  if (!listEl || !btnEl || !scrollEl) return;

  const limit = 30;

  if (!older) {
    _msgState.feedThreadRenderedCommentIds = new Set();
    listEl.innerHTML = `<div style="text-align:center;padding:18px;color:var(--text-3);">Chargement…</div>`;
  }

  const baseQ = sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .eq('reference_id', sid)
    .eq('type', 'comment');

  let q = baseQ;
  if (older && _msgState.feedThreadState.oldestLoadedAt) {
    q = q.lt('created_at', _msgState.feedThreadState.oldestLoadedAt);
  }

  const { data } = await q.order('created_at', { ascending: false }).limit(limit);

  const rows = data || [];
  if (!rows.length) {
    if (!older) listEl.innerHTML = '<div style="padding:24px 0; text-align:center; font-size:13px; color:var(--text-3); font-style:italic;">Aucun commentaire. Soyez le premier à répondre !</div>';
    setFeedThreadHasMore(false, null);
    btnEl.style.display = 'none';
    return;
  }

  const commentsAsc = [...rows].reverse();
  const hasMore = rows.length === limit;
  const oldest = commentsAsc[0]?.created_at || null;
  setFeedThreadHasMore(hasMore, oldest);
  btnEl.style.display = hasMore ? 'inline-block' : 'none';

  const newIds = commentsAsc.map(x => String(x.id));
  newIds.forEach(id => _msgState.feedThreadRenderedCommentIds.add(id));

  if (!older) {
    listEl.innerHTML = commentsAsc.map(renderFeedCommentLine).join('');
    return;
  }

  const prevScrollTop = scrollEl.scrollTop;
  const prevScrollHeight = scrollEl.scrollHeight;
  listEl.insertAdjacentHTML('afterbegin', commentsAsc.map(renderFeedCommentLine).join(''));
  const newScrollHeight = scrollEl.scrollHeight;
  scrollEl.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
}

async function sendFeedThreadComment() {
  const sid = _msgState.activeFeedThreadPostId;
  if (!sid) return;
  const input = $('feed-thread-comment-input');
  if (!input) return;
  const contenu = (input.value || '').trim();
  if (!contenu) return;
  input.value = '';
  input.style.height = 'auto';

  const { data: newC, error } = await sb.from('feed_posts')
    .insert({ auteur_id: user.id, contenu, type: 'comment', reference_id: sid })
    .select('*, profiles(id,prenom,nom,email)')
    .single();

  if (error) { toast('Erreur commentaire', 'err'); return; }

  const withRef = { ...newC, reference_id: sid };
  await appendFeedThreadComment(withRef);
}

async function appendFeedThreadComment(c) {
  const sid = String(_msgState.activeFeedThreadPostId || '');
  if (!sid || String(c.reference_id) !== sid) return;
  const id = String(c.id);
  if (_msgState.feedThreadRenderedCommentIds.has(id)) return;

  _msgState.feedThreadRenderedCommentIds.add(id);
  const listEl = $('feed-thread-comments-list');
  const scrollEl = $('feed-thread-scroll');
  if (!listEl || !scrollEl) return;

  const oldIsAtBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 30;
  listEl.insertAdjacentHTML('beforeend', renderFeedCommentLine(c));
  if (oldIsAtBottom) scrollEl.scrollTop = scrollEl.scrollHeight;

  _msgState.feedCommentUnreadByPost[sid] = 0;
  const ub = $(`feed-unread-${sid}`);
  if (ub) ub.style.display = 'none';
}

// ─── REALTIME WEBSOCKETS (CANAUX + FEED) ──────────────────────────────────────
function startMsgRealtime() {
  if (_msgState.channel) return;
  _msgState.channel = sb.channel('messages-global')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      const m = payload.new;
      if (m.conversation_id === _msgState.activeConvId) {
        if (m.auteur_id === user.id) return;
        sb.from('profiles').select('nom,prenom').eq('id', m.auteur_id).single().then(({ data }) => {
          _msgState.messages.push({ ...m, profiles: data });
          renderMessageBubbles();
          markConvRead(m.conversation_id);
        });
      } else if (m.auteur_id !== user.id) {
        _msgState.unreadByConv[m.conversation_id] = (_msgState.unreadByConv[m.conversation_id] || 0) + 1;
        renderSidebarGroups();
        renderSidebarDMs();
        _updateMobileTabBadges();
        if (typeof toast === 'function') toast('💬 Nouveau message', 'ok');
      }
    })
    .subscribe();
}

function startFeedRealtime() {
  if (_msgState.feedChannel) return;
  _msgState.feedChannel = sb.channel('feed-global')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, async payload => {
      const p = payload.new;
      if (p.type === 'comment') {
        const parentId = p.reference_id != null ? String(p.reference_id) : '';
        if (!parentId) return;

        const isThreadActive = _msgState.activeFeedThreadPostId && String(_msgState.activeFeedThreadPostId) === parentId;
        if (isThreadActive) {
          const { data: prof } = await sb.from('profiles').select('id,prenom,nom,email').eq('id', p.auteur_id).single();
          const commentRow = { ...p, profiles: prof, reference_id: parentId };
          await appendFeedThreadComment(commentRow);
        } else {
          _msgState.feedCommentUnreadByPost[parentId] = (_msgState.feedCommentUnreadByPost[parentId] || 0) + 1;
          renderFeed(); // Met à jour le compteur sur la carte
        }
        return;
      }
      
      if (p.auteur_id === user.id) return;
      
      const { data: prof } = await sb.from('profiles').select('id,prenom,nom,email').eq('id', p.auteur_id).single();
      const post = { ...p, profiles: prof };
      _msgState.feed = sortFeedPosts([post, ..._msgState.feed.filter(x => x.id !== post.id)]);
      
      if (_msgState.activeChanType === 'feed') renderFeed();
      else if (typeof toast === 'function') toast('🏘️ Nouveau message sur le fil du quartier', 'ok');
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_posts' }, payload => {
      const p = payload.new;
      if (p.type === 'comment') return;
      const idx = _msgState.feed.findIndex(x => x.id === p.id);
      if (idx >= 0) {
        const prev = _msgState.feed[idx];
        _msgState.feed[idx] = { ...prev, ...p, profiles: prev.profiles };
        _msgState.feed = sortFeedPosts(_msgState.feed);
        if (_msgState.activeChanType === 'feed') renderFeed();
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'feed_posts' }, payload => {
      const id = payload.old?.id;
      if (!id) return;
      if (payload.old.type === 'comment' && payload.old.reference_id != null) {
        const pid = String(payload.old.reference_id);
        if (_msgState.activeFeedThreadPostId && String(_msgState.activeFeedThreadPostId) === pid) {
          loadFeedThreadComments(pid, { older: false });
        }
        return;
      }
      _msgState.feed = _msgState.feed.filter(x => String(x.id) !== String(id));
      if (_msgState.activeChanType === 'feed') renderFeed();
    })
    .subscribe();
}

async function publishFeedEvent(type, contenu) {
  const catMap = { ticket: 'pratique', resolved: 'pratique', vote: 'evenements', member: 'vie_quartier' };
  const categorie = catMap[type] || 'activite';
  try {
    const res = await insertFeedPostRowSimple({ auteur_id: user.id, contenu, type, categorie });
    if (res.error) console.warn('[feed]', res.error.message);
  } catch (e) { console.warn('[feed]', e.message); }
}

// Overrides UX/UI vNext - Messages & Communaute
function _msgIsMobile() {
  return window.innerWidth <= 768;
}

function _msgConversationKind(conv) {
  return conv?.type === 'prive' ? 'dm' : 'chan';
}

function _msgConversationTitle(conv) {
  if (!conv) return 'Discussion';
  const raw = conv.titre || 'Discussion';
  const idx = raw.indexOf(' ');
  return idx > 0 ? raw.substring(idx + 1) : raw;
}

function _msgConversationEmoji(conv) {
  if (!conv || !conv.titre) return conv?.type === 'prive' ? '🔒' : '💬';
  const first = conv.titre.split(' ')[0] || '';
  return first.length <= 3 ? first : (conv.type === 'prive' ? '🔒' : '💬');
}

function _msgSidebarPreview(conv) {
  if (!conv) return '';
  if (conv.type === 'prive') return 'Conversation privee';
  if ((conv.titre || '').includes(profile?.tour || '__')) return 'Canal prioritaire pour votre tour';
  return 'Canal de discussion residence';
}

function _msgShellWelcome() {
  return `
    <div class="chat-empty msg-shell-welcome" id="msg-welcome">
      <div class="msg-shell-welcome-ico">👋</div>
      <div class="msg-shell-welcome-kicker">Boite de reception</div>
      <div class="msg-shell-welcome-title">Choisissez une discussion</div>
      <div class="msg-shell-welcome-copy">Ouvrez un canal, un message prive ou le fil de communaute pour echanger dans une interface plus claire et plus mobile-native.</div>
    </div>`;
}

function _msgSetActiveTabUI() {
  document.querySelectorAll('.msg-inner-tab').forEach((t, i) => {
    const tabs = ['feed', 'channels', 'dms'];
    t.classList.toggle('active', tabs[i] === _msgState.activeMobileTab);
  });
}

function _msgSyncMobilePanels(mode) {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (!sidebar || !main) return;

  const showMain = mode === 'main';
  sidebar.classList.toggle('hidden', showMain && _msgIsMobile());
  main.classList.toggle('visible', showMain || !_msgIsMobile());

  if (!_msgIsMobile()) {
    sidebar.style.display = '';
    $('chan-list-groups') && ($('chan-list-groups').style.display = 'block');
    $('chan-list-dms') && ($('chan-list-dms').style.display = 'block');
    return;
  }

  const groupsLabel = document.querySelectorAll('.msg-section-label')[1];
  const dmsLabel = document.querySelectorAll('.msg-section-label')[2];
  if (mode === 'groups') {
    $('chan-list-groups') && ($('chan-list-groups').style.display = 'block');
    $('chan-list-dms') && ($('chan-list-dms').style.display = 'none');
    if (groupsLabel) groupsLabel.style.display = 'block';
    if (dmsLabel) dmsLabel.style.display = 'none';
  } else if (mode === 'dms') {
    $('chan-list-groups') && ($('chan-list-groups').style.display = 'none');
    $('chan-list-dms') && ($('chan-list-dms').style.display = 'block');
    if (groupsLabel) groupsLabel.style.display = 'none';
    if (dmsLabel) dmsLabel.style.display = 'flex';
  } else {
    $('chan-list-groups') && ($('chan-list-groups').style.display = 'block');
    $('chan-list-dms') && ($('chan-list-dms').style.display = 'block');
    if (groupsLabel) groupsLabel.style.display = 'block';
    if (dmsLabel) dmsLabel.style.display = 'flex';
  }
}

/** Mobile shell (position:relative) n'utilise pas translateX : appliquer tout de suite l'onglet courant. */
function _msgApplyInitialMobilePanels() {
  if (typeof _msgIsMobile !== 'function' || !_msgIsMobile()) return;
  const tab = _msgState.activeMobileTab || 'feed';
  if (tab === 'feed') _msgSyncMobilePanels('main');
  else if (tab === 'channels') _msgSyncMobilePanels('groups');
  else _msgSyncMobilePanels('dms');
}

function _msgScrollToBottom(force = false) {
  const el = $('chat-messages');
  if (!el) return;
  const shouldStick = force || (el.scrollHeight - el.scrollTop - el.clientHeight < 100);
  if (!shouldStick) return;
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
  });
}

renderMessages = function renderMessagesVNext() {
  const page = $('page');
  loadMsgDrafts();

  page.innerHTML = `
    <div class="msg-inner-tabs msg-shell-tabs" id="msg-inner-tabs">
      <button type="button" class="msg-inner-tab ${_msgState.activeMobileTab === 'feed' ? 'active' : ''}" onclick="switchMobileTab('feed')">
        <span class="msg-inner-tab-ico">🏘️</span><span>Communauté</span>
      </button>
      <button type="button" class="msg-inner-tab ${_msgState.activeMobileTab === 'channels' ? 'active' : ''}" onclick="switchMobileTab('channels')" id="msg-tab-channels">
        <span class="msg-inner-tab-ico">💬</span><span>Canaux</span>
        <span class="msg-inner-tab-badge" id="tab-badge-channels" style="display:none;"></span>
      </button>
      <button type="button" class="msg-inner-tab ${_msgState.activeMobileTab === 'dms' ? 'active' : ''}" onclick="switchMobileTab('dms')" id="msg-tab-dms">
        <span class="msg-inner-tab-ico">🔒</span><span>Privé</span>
        <span class="msg-inner-tab-badge" id="tab-badge-dms" style="display:none;"></span>
      </button>
    </div>

    <div class="msg-layout msg-shell" id="msg-layout">
      <div class="msg-sidebar msg-shell-sidebar" id="msg-sidebar">
        <div class="msg-shell-sidebar-top">
          <div class="msg-shell-brand">
            <div class="msg-shell-brand-kicker">Messagerie</div>
            <div class="msg-shell-brand-title">Discussions</div>
            <div class="msg-shell-brand-copy">Canaux de residence, conversations privees et communaute locale dans une seule vue plus nette.</div>
          </div>
          <label class="msg-shell-search" for="msg-search-conv">
            <span class="msg-shell-search-ico">🔍</span>
            <input class="input" id="msg-search-conv" placeholder="Rechercher une conversation..." oninput="onMsgConvSearchInput(event)">
          </label>
        </div>

        <div class="msg-sidebar-scroll msg-shell-sidebar-scroll">
          <div class="msg-section-label msg-shell-section-label">Communaute</div>
          <div class="msg-chan-item msg-shell-community-card ${_msgState.activeChanType==='feed'?'active':''}" id="chan-feed" onclick="openFeed()">
            <div class="msg-shell-community-icon">🏘️</div>
            <div class="msg-shell-community-copy">
              <div class="msg-chan-name msg-shell-community-title">Le fil du quartier</div>
              <div class="msg-shell-community-sub">Annonces, entraide et infos residence</div>
            </div>
          </div>

          <div class="msg-section-label msg-shell-section-label">Groupes & Canaux</div>
          <div id="chan-list-groups" class="msg-shell-list"></div>

          <div class="msg-section-label msg-shell-section-label msg-shell-section-row">
            Messages prives
            <button class="btn btn-ghost btn-sm msg-shell-inline-btn" onclick="openNewDM()">+ Nouveau</button>
          </div>
          <div id="chan-list-dms" class="msg-shell-list msg-shell-list-last"></div>
        </div>

        <button type="button" class="msg-fab-mobile msg-shell-fab" onclick="openNewDM()" title="Nouvelle conversation" aria-label="Nouvelle conversation privée">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
        </button>
      </div>

      <div class="msg-main msg-shell-main" id="msg-main">
        ${_msgShellWelcome()}
      </div>
    </div>`;

  _msgApplyInitialMobilePanels();

  loadConversations()
    .catch((err) => { console.warn('[msg] loadConversations', err); })
    .then(() => {
      renderSidebarGroups();
      renderSidebarDMs();
      if (typeof startMsgRealtime === 'function') startMsgRealtime();
      if (typeof startFeedRealtime === 'function') startFeedRealtime();
      _updateMobileTabBadges();

      if (_msgState.activeMobileTab === 'feed' || _msgState.activeChanType === 'feed') openFeed();
      else if (_msgState.activeConvId) openConv(_msgState.activeConvId);
      else openFeed();
    });
};

switchMobileTab = function switchMobileTabVNext(tab) {
  _msgState.activeMobileTab = tab;
  _msgSetActiveTabUI();

  if (tab === 'feed') {
    openFeed();
  } else if (tab === 'channels') {
    _msgSyncMobilePanels('groups');
  } else {
    _msgSyncMobilePanels('dms');
  }
};

_showMobileSidebarFiltered = function showMobileSidebarFilteredVNext(type) {
  _msgSyncMobilePanels(type === 'prive' ? 'dms' : 'groups');
};

mobileShowMain = function mobileShowMainVNext() {
  _msgSyncMobilePanels('main');
};

mobileShowSidebar = function mobileShowSidebarVNext() {
  _msgSyncMobilePanels(_msgState.activeChanType === 'dm' ? 'dms' : 'groups');
  _msgState.activeConvId = null;
};

mobileBackToChannelList = function mobileBackToChannelListVNext() {
  mobileShowSidebar();
};

renderSidebarGroups = function renderSidebarGroupsVNext() {
  const el = $('chan-list-groups');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const convs = filterConvsByRole(_msgState.conversations)
    .filter(c => !c.type || c.type === 'groupe')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));

  const userTour = profile?.tour || null;
  const sorted = [...convs].sort((a, b) => {
    const aIsTour = userTour && (a.titre || '').includes(userTour);
    const bIsTour = userTour && (b.titre || '').includes(userTour);
    if (aIsTour && !bIsTour) return -1;
    if (!aIsTour && bIsTour) return 1;
    return 0;
  });

  el.innerHTML = sorted.map(c => {
    const isActive = _msgState.activeConvId === c.id && _msgState.activeChanType === 'chan';
    const unread = _msgState.unreadByConv?.[c.id] || 0;
    const isMyTower = userTour && (c.titre || '').includes(userTour);
    return `
      <button class="msg-shell-item ${isActive ? 'active' : ''}" id="chan-${c.id}" onclick="openConv('${c.id}')">
        <span class="msg-shell-item-icon">${_msgConversationEmoji(c)}</span>
        <span class="msg-shell-item-copy">
          <span class="msg-shell-item-title">${escHtml(_msgConversationTitle(c))}${isMyTower ? '<span class="msg-shell-item-tag">Ma tour</span>' : ''}</span>
          <span class="msg-shell-item-sub">${_msgSidebarPreview(c)}</span>
        </span>
        ${unread > 0 ? `<span class="msg-shell-item-badge">${unread > 9 ? '9+' : unread}</span>` : ''}
      </button>`;
  }).join('') || '<div class="msg-shell-empty-list">Aucun canal disponible</div>';
};

renderSidebarDMs = function renderSidebarDMsVNext() {
  const el = $('chan-list-dms');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const dms = _msgState.conversations
    .filter(c => c.type === 'prive')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));

  if (!dms.length) {
    el.innerHTML = '<div class="msg-shell-empty-list">Aucun message prive pour le moment.</div>';
    return;
  }

  el.innerHTML = dms.map(c => {
    const isActive = _msgState.activeConvId === c.id && _msgState.activeChanType === 'dm';
    const unread = _msgState.unreadByConv?.[c.id] || 0;
    const title = _msgConversationTitle(c).replace(/^🔒\s*/, '');
    return `
      <button class="msg-shell-item ${isActive ? 'active' : ''}" id="chan-${c.id}" onclick="openConv('${c.id}')">
        <span class="msg-shell-item-icon msg-shell-item-icon-avatar" style="background:${avatarColor(title)};">${title.charAt(0).toUpperCase()}</span>
        <span class="msg-shell-item-copy">
          <span class="msg-shell-item-title">${escHtml(title)}</span>
          <span class="msg-shell-item-sub">Conversation privee</span>
        </span>
        ${unread > 0 ? `<span class="msg-shell-item-badge">${unread > 9 ? '9+' : unread}</span>` : ''}
      </button>`;
  }).join('');
};

openConv = async function openConvVNext(convId) {
  saveCurrentDraft();
  stopFeedCommentsPoll();

  const conv = _msgState.conversations.find(c => c.id === convId);
  if (!conv) return;

  _msgState.activeConvId = convId;
  _msgState.activeChanType = _msgConversationKind(conv);
  _msgState.activeMobileTab = _msgState.activeChanType === 'dm' ? 'dms' : 'channels';

  document.querySelectorAll('.msg-chan-item,.msg-dm-item,.msg-shell-item').forEach(el => el.classList.remove('active'));
  $('chan-feed')?.classList.remove('active');
  $(`chan-${convId}`)?.classList.add('active');
  _msgSetActiveTabUI();

  mobileShowMain();

  const emoji = _msgConversationEmoji(conv);
  const title = _msgConversationTitle(conv);
  const isPrivate = conv.type === 'prive';

  const main = $('msg-main');
  if (!main) return;

  main.innerHTML = `
    <div class="msg-chan-header msg-shell-chat-header">
      <button class="msg-back-btn" onclick="mobileBackToChannelList()">←</button>
      <div class="msg-shell-chat-avatar">${emoji}</div>
      <div class="msg-shell-chat-head-copy msg-header-titles">
        <div class="msg-chan-title msg-shell-chat-title">${escHtml(title)}</div>
        <div class="msg-chan-desc msg-shell-chat-desc">${isPrivate ? 'Conversation privee' : 'Canal de residence'}</div>
      </div>
      <button type="button" class="btn btn-ghost msg-header-new-dm" onclick="openNewDM()" title="Nouvelle conversation" aria-label="Nouvelle conversation privée">＋</button>
    </div>

    <div class="chat-messages msg-shell-chat-stream" id="chat-messages">
      <div style="text-align:center;padding:40px;"><div class="spinner"></div></div>
    </div>

    <div class="msg-reply-bar" id="msg-reply-bar" style="display:none;">
      <div class="msg-reply-bar-content" id="msg-reply-bar-content"></div>
      <button class="msg-reply-bar-close" onclick="clearReply()">×</button>
    </div>

    <div class="chat-input-bar msg-shell-chat-composer">
      <div class="chat-input-wrap msg-shell-chat-input-wrap">
        <button class="btn btn-ghost btn-sm msg-shell-emoji-btn" onclick="pickFeedEmoji(event)">☺</button>
        <textarea class="chat-input msg-shell-chat-input" id="chat-input" placeholder="Ecrire un message..." rows="1"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';onChatInput(event);saveCurrentDraft();"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}"></textarea>
        <div id="chat-mention-list" class="chat-mention-pop" style="display:none;"></div>
      </div>
      <button class="chat-send msg-shell-chat-send" onclick="sendMessage()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
      </button>
    </div>`;

  await loadMessages(convId);
  restoreCurrentDraft();
  _msgState.unreadByConv[convId] = 0;
  renderSidebarGroups();
  renderSidebarDMs();
  _updateMobileTabBadges();
  markConvRead(convId);
};

renderMessageBubbles = function renderMessageBubblesVNext() {
  const el = $('chat-messages');
  if (!el) return;
  const msgs = _msgState.messages || [];
  const keepBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

  if (!msgs.length) {
    el.innerHTML = `
      <div class="msg-shell-empty-chat">
        <div class="msg-shell-empty-chat-ico">💬</div>
        <div class="msg-shell-empty-chat-title">Nouvelle discussion</div>
        <div class="msg-shell-empty-chat-copy">Soyez le premier a envoyer un message dans cette conversation.</div>
      </div>`;
    return;
  }

  let lastDate = null;
  let lastAuteur = null;
  const html = [];

  msgs.forEach((m) => {
    const isMine = m.auteur_id === user.id;
    const auteur = m.profiles ? displayName(m.profiles.prenom, m.profiles.nom, null, '?') : '?';
    const dt = new Date(m.created_at);
    const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const showSender = !isMine && auteur !== lastAuteur;
    const isConsecutive = auteur === lastAuteur && dateStr === lastDate;

    if (dateStr !== lastDate) {
      html.push(`<div class="msg-date-sep"><span>${dateStr}</span></div>`);
      lastDate = dateStr;
      lastAuteur = null;
    }

    let replyHtml = '';
    if (m.reply) {
      const replyAuteur = m.reply.profiles ? displayName(m.reply.profiles.prenom, m.reply.profiles.nom, null, '?') : '?';
      replyHtml = `
        <div class="msg-reply-preview">
          <strong>${escHtml(replyAuteur)}</strong>
          <span>${formatRichText((m.reply.texte || '').substring(0, 60))}</span>
        </div>`;
    }

    const reacts = (_msgState.msgReactions || {})[m.id] || [];
    const grouped = {};
    reacts.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
      grouped[r.emoji].count++;
      if (r.user_id === user.id) grouped[r.emoji].mine = true;
    });

    const reactHtml = Object.entries(grouped).map(([emoji, data]) => `
      <button class="msg-reaction ${data.mine ? 'mine' : ''}" onclick="toggleMsgReaction('${m.id}','${emoji}')">
        <span>${emoji}</span>
        <span class="msg-reaction-count">${data.count}</span>
      </button>`).join('');

    html.push(`
      <div class="msg-group ${isMine ? 'mine' : 'theirs'}">
        ${showSender ? `<div class="msg-sender-name">${escHtml(auteur)}</div>` : ''}
        <div class="msg-shell-bubble-row ${isMine ? 'mine' : 'theirs'}">
          ${!isMine ? `<div class="msg-shell-bubble-avatar ${isConsecutive ? 'ghost' : ''}" style="background:${avatarColor(auteur)};">${isConsecutive ? '' : auteur.charAt(0).toUpperCase()}</div>` : ''}
          <div class="msg-shell-bubble-stack">
            <div class="msg-bubble ${isMine ? 'mine' : 'theirs'} ${isConsecutive ? 'is-consecutive' : ''}">
              ${replyHtml}
              ${formatRichText(m.texte || '')}
            </div>
            ${reactHtml ? `<div class="msg-reactions">${reactHtml}</div>` : ''}
            <div class="msg-time-row">${timeStr}</div>
          </div>
        </div>
      </div>`);

    lastAuteur = auteur;
  });

  el.innerHTML = `<div class="msg-shell-chat-list">${html.join('')}</div>`;
  _msgScrollToBottom(keepBottom);
};

renderFeed = function renderFeedVNext() {
  const el = $('feed-left-scroll');
  if (!el) return;
  const rows = sortFeedPosts((_msgState.feed || []).filter(p => p.type !== 'comment'));
  const f = _msgState.feedFilter || 'tout';
  const inFilter = p => f === 'tout' || feedPostCategory(p) === f;

  FEED_COMMUNITY_CATS.forEach(c => {
    const badge = $(`feed-cat-count-${c.id}`);
    if (!badge) return;
    const n = feedCountForFilter(c.id);
    badge.textContent = n > 0 ? String(n) : '';
    badge.style.display = n > 0 ? '' : 'none';
  });

  const filtered = rows.filter(inFilter);
  if (!filtered.length) {
    el.innerHTML = `
      <div class="feed-empty-cat">
        <div class="feed-empty-cat-ico">🌿</div>
        <div class="feed-empty-cat-title">Le fil est encore calme</div>
        <div class="feed-empty-cat-desc">Lancez la premiere conversation utile du quartier ou partagez une info pour la residence.</div>
      </div>`;
    return;
  }

  const pinnedBlock = filtered.filter(p => p.epingle && p.type === 'post');
  const rest = filtered.filter(p => !(p.epingle && p.type === 'post'));
  const showBoard = pinnedBlock.length && (f === 'tout' || f === 'panneau');

  let html = '';
  if (showBoard) {
    html += `
      <section class="feed-board-section">
        <header class="feed-board-head">
          <div class="feed-board-pin">📌</div>
          <div>
            <div class="feed-board-head-title">Panneau d'affichage</div>
            <div class="feed-board-head-sub">Les informations importantes a lire en premier</div>
          </div>
        </header>
        <div class="feed-board-posts">${pinnedBlock.map(p => renderFeedPost(p, true)).join('')}</div>
      </section>`;
  }

  if (rest.length) {
    html += `
      <div class="feed-timeline-label"><span>Dernieres conversations</span></div>
      <div class="msg-shell-feed-list">${rest.map(p => renderFeedPost(p)).join('')}</div>`;
  }

  el.innerHTML = html;
  restoreFeedOpenCommentThreads();
};

renderFeedPost = function renderFeedPostVNext(p, isPinnedBoard = false) {
  const auteur = p.profiles ? displayName(p.profiles.prenom, p.profiles.nom, p.profiles.email, 'Resident') : 'Resident';
  const initiale = auteur.charAt(0).toUpperCase();
  const color = avatarColor(auteur);
  const time = typeof depuisJours === 'function' ? depuisJours(p.created_at) : '';
  const isMine = p.auteur_id === user?.id;
  const cat = feedPostCategory(p);
  const cmeta = feedCatMeta(cat);
  const accent = feedCatAccent(cat);
  const affiche = p.epingle && p.type === 'post';
  const unread = _msgState.feedCommentUnreadByPost[String(p.id)] || 0;

  const reacts = _msgState.feedReactions[String(p.id)] || [];
  const reactGroups = {};
  reacts.forEach(r => {
    if (!reactGroups[r.emoji]) reactGroups[r.emoji] = { count: 0, mine: false };
    reactGroups[r.emoji].count++;
    if (r.user_id === user?.id) reactGroups[r.emoji].mine = true;
  });

  const reactHtml = Object.entries(reactGroups).map(([emoji, data]) => `
    <button class="feed-reaction ${data.mine ? 'mine' : ''}" onclick="toggleFeedReaction('${p.id}','${emoji}')">
      <span>${emoji}</span>
      <span class="feed-reaction-count">${data.count}</span>
    </button>`).join('');

  let body = '';
  if (p.type === 'post') {
    body = `
      ${p.titre_panneau ? `<div class="feed-post-affiche-titre">${escHtml(p.titre_panneau)}</div>` : ''}
      <div class="feed-post-body">${formatRichText(p.contenu || '')}</div>`;
  } else if (p.type === 'ticket') {
    body = `<div class="feed-event-card ticket">🔧 ${escHtml(p.contenu || '')}</div>`;
  } else if (p.type === 'resolved') {
    body = `<div class="feed-event-card resolved">✅ ${escHtml(p.contenu || '')}</div>`;
  } else if (p.type === 'vote') {
    body = `<div class="feed-event-card vote">🗳️ ${escHtml(p.contenu || '')}</div>`;
  } else {
    body = `<div class="feed-post-body">${formatRichText(p.contenu || '')}</div>`;
  }

  const pinBtn = (typeof canManageAnnonces === 'function' && canManageAnnonces()) && p.type === 'post' && !isPinnedBoard
    ? `<button class="btn btn-ghost btn-sm feed-pin-btn" onclick="event.preventDefault();toggleFeedPin('${p.id}')">${p.epingle ? '📌' : '📍'}<span class="feed-pin-lbl">${p.epingle ? 'Epingle' : 'Epingler'}</span></button>`
    : '';

  return `
    <article class="feed-post ${affiche ? 'feed-post--affiche' : ''}" id="post-${p.id}">
      <div class="feed-post-header">
        <div class="feed-post-av" style="background:${color};">${initiale}</div>
        <div class="feed-post-meta">
          <div class="feed-post-author-line">
            <span class="feed-post-author">${escHtml(auteur)}</span>
            <span class="feed-post-cat-badge" style="background:${accent}15; color:${accent};">${cmeta.emoji} ${escHtml(cmeta.label)}</span>
          </div>
          <div class="feed-post-time">${time}</div>
        </div>
        <div class="feed-post-header-actions">
          ${pinBtn}
          ${isMine ? `<button class="btn btn-ghost btn-sm feed-del-btn" onclick="deleteFeedPost('${p.id}')" title="Supprimer">✕</button>` : ''}
        </div>
      </div>

      ${body}

      ${reactHtml ? `<div class="feed-reactions">${reactHtml}</div>` : ''}

      <div class="feed-post-actions">
        ${EMOJIS.slice(0, 3).map(e => `<button class="feed-action-btn" onclick="toggleFeedReaction('${p.id}','${e}')">${e}</button>`).join('')}
        <button class="feed-action-btn" onclick="openFeedThread('${p.id}')">Repondre ${unread > 0 ? `<span class="feed-unread-comment-badge" id="feed-unread-${p.id}">${unread}</span>` : ''}</button>
      </div>
    </article>`;
};

openFeedThread = async function openFeedThreadVNext(postId) {
  const sid = String(postId);
  _msgState.activeFeedThreadPostId = sid;
  _msgState.feedThreadRenderedCommentIds = new Set();
  _msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
  _msgState.feedCommentUnreadByPost[sid] = 0;

  const split = $('feed-split');
  if (split) split.classList.add('thread-active');

  let post = _msgState.feed.find(p => String(p.id) === sid);
  if (!post) {
    const { data } = await sb.from('feed_posts').select('*, profiles(id,prenom,nom,email)').eq('id', sid).single();
    post = data;
  }
  if (!post) return;

  const auteur = post.profiles ? displayName(post.profiles.prenom, post.profiles.nom, post.profiles.email, 'Resident') : 'Resident';
  const color = avatarColor(auteur);
  const initiale = auteur.charAt(0).toUpperCase();
  const time = typeof depuisJours === 'function' ? depuisJours(post.created_at) : '';
  const threadPane = $('feed-thread-pane');
  if (!threadPane) return;

  threadPane.innerHTML = `
    <div class="feed-thread-wrap">
      <div class="feed-thread-header">
        <div class="feed-thread-head-left">
          <button class="feed-thread-back-btn" onclick="closeFeedThread()">←</button>
          <div class="feed-post-av" style="background:${color}; width:34px; height:34px; font-size:13px;">${initiale}</div>
          <div class="feed-thread-head-meta">
            <div class="feed-thread-head-author">${escHtml(auteur)}</div>
            <div class="feed-thread-head-time">${time}</div>
          </div>
        </div>
      </div>

      <div class="feed-thread-post-body">
        ${post.titre_panneau ? `<div class="feed-post-affiche-titre">${escHtml(post.titre_panneau)}</div>` : ''}
        <div class="feed-post-body">${formatRichText(post.contenu || '')}</div>
      </div>

      <div class="feed-thread-scroll" id="feed-thread-scroll">
        <div class="feed-timeline-label"><span>Commentaires</span></div>
        <div style="text-align:center;">
          <button id="feed-thread-load-more-btn" class="btn btn-ghost btn-sm" style="display:none;" onclick="loadFeedThreadOlder()">Charger les plus anciens</button>
        </div>
        <div class="feed-thread-comments" id="feed-thread-comments-list"></div>
      </div>

      <div class="feed-thread-composer">
        <div class="feed-thread-composer-box">
          <textarea id="feed-thread-comment-input" class="feed-compose-input" placeholder="Ecrire une reponse..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFeedThreadComment();}"></textarea>
          <button class="chat-send" onclick="sendFeedThreadComment()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  await loadFeedThreadComments(sid, { older: false });
};

closeFeedThread = function closeFeedThreadVNext() {
  _msgState.activeFeedThreadPostId = null;
  const split = $('feed-split');
  if (split) split.classList.remove('thread-active');
  const pane = $('feed-thread-pane');
  if (pane) {
    pane.innerHTML = `
      <div class="feed-thread-empty">
        <div class="msg-shell-welcome-ico">💬</div>
        <div class="msg-shell-welcome-title">Ouvrez une discussion</div>
        <div class="msg-shell-welcome-copy">Touchez repondre sous un message pour suivre le fil complet ici.</div>
      </div>`;
  }
};

renderFeedCommentLine = function renderFeedCommentLineVNext(c) {
  const auteur = c.profiles ? displayName(c.profiles.prenom, c.profiles.nom, c.profiles.email, 'Resident') : 'Resident';
  const color = avatarColor(auteur);
  const timeStr = typeof depuisJours === 'function' ? depuisJours(c.created_at) : '';
  const isMe = c.auteur_id === user?.id;

  return `
    <div class="feed-comment ${isMe ? 'mine' : ''}">
      ${!isMe ? `<div class="feed-comment-av" style="background:${color};">${auteur.charAt(0).toUpperCase()}</div>` : ''}
      <div class="feed-comment-bubble">
        <div class="feed-comment-author">${isMe ? 'Vous' : escHtml(auteur)} · ${timeStr}</div>
        <div>${formatRichText(c.contenu || '')}</div>
      </div>
    </div>`;
};

loadFeedThreadComments = async function loadFeedThreadCommentsVNext(postId, { older = false } = {}) {
  const sid = String(postId);
  const listEl = $('feed-thread-comments-list');
  const scrollEl = $('feed-thread-scroll');
  const btnEl = $('feed-thread-load-more-btn');
  if (!listEl || !btnEl || !scrollEl) return;

  const limit = 30;

  if (!older) {
    _msgState.feedThreadRenderedCommentIds = new Set();
    listEl.innerHTML = '<div class="msg-shell-empty-list">Chargement...</div>';
  }

  const baseQ = sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .eq('reference_id', sid)
    .eq('type', 'comment');

  let q = baseQ;
  if (older && _msgState.feedThreadState.oldestLoadedAt) q = q.lt('created_at', _msgState.feedThreadState.oldestLoadedAt);

  const { data } = await q.order('created_at', { ascending: false }).limit(limit);
  const rows = data || [];

  if (!rows.length) {
    if (!older) listEl.innerHTML = '<div class="msg-shell-empty-list">Aucun commentaire. Soyez le premier a repondre.</div>';
    setFeedThreadHasMore(false, null);
    btnEl.style.display = 'none';
    return;
  }

  const commentsAsc = [...rows].reverse();
  const hasMore = rows.length === limit;
  const oldest = commentsAsc[0]?.created_at || null;
  setFeedThreadHasMore(hasMore, oldest);
  btnEl.style.display = hasMore ? 'inline-flex' : 'none';

  const newIds = commentsAsc.map(x => String(x.id));
  newIds.forEach(id => _msgState.feedThreadRenderedCommentIds.add(id));

  if (!older) {
    listEl.innerHTML = commentsAsc.map(renderFeedCommentLine).join('');
    requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
    return;
  }

  const prevScrollTop = scrollEl.scrollTop;
  const prevScrollHeight = scrollEl.scrollHeight;
  listEl.insertAdjacentHTML('afterbegin', commentsAsc.map(renderFeedCommentLine).join(''));
  const newScrollHeight = scrollEl.scrollHeight;
  scrollEl.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
};

appendFeedThreadComment = async function appendFeedThreadCommentVNext(c) {
  const sid = String(_msgState.activeFeedThreadPostId || '');
  if (!sid || String(c.reference_id) !== sid) return;
  const id = String(c.id);
  if (_msgState.feedThreadRenderedCommentIds.has(id)) return;

  _msgState.feedThreadRenderedCommentIds.add(id);
  const listEl = $('feed-thread-comments-list');
  const scrollEl = $('feed-thread-scroll');
  if (!listEl || !scrollEl) return;

  const oldIsAtBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 60;
  listEl.insertAdjacentHTML('beforeend', renderFeedCommentLine(c));
  if (oldIsAtBottom) requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; });

  _msgState.feedCommentUnreadByPost[sid] = 0;
  const ub = $(`feed-unread-${sid}`);
  if (ub) ub.style.display = 'none';
};

openFeed = async function openFeedVNext() {
  saveCurrentDraft();
  _msgState.activeChanType = 'feed';
  _msgState.activeConvId = null;
  _msgState.activeMobileTab = 'feed';
  _msgState.feedComposeCategory = readStoredFeedComposeCat();

  document.querySelectorAll('.msg-chan-item,.msg-dm-item,.msg-shell-item').forEach(el => el.classList.remove('active'));
  $('chan-feed')?.classList.add('active');
  _msgSetActiveTabUI();
  mobileShowMain();

  const main = $('msg-main');
  if (!main) return;

  const split = $('feed-split');
  if (split) split.classList.remove('thread-active');

  const chipHtml = FEED_COMMUNITY_CATS.map(c => {
    const active = _msgState.feedFilter === c.id;
    const cnt = feedCountForFilter(c.id);
    return `<button type="button" class="feed-cat-chip ${active ? 'active' : ''}" data-cat="${c.id}" aria-pressed="${active ? 'true' : 'false'}" onclick="setFeedFilter('${c.id}')">
      <span class="feed-cat-chip-ico">${c.emoji}</span>
      <span class="feed-cat-chip-lbl">${escHtml(c.label)}</span>
      <span class="feed-cat-chip-badge" id="feed-cat-count-${c.id}" style="${cnt > 0 ? '' : 'display:none;'}">${cnt > 0 ? cnt : ''}</span>
    </button>`;
  }).join('');

  main.innerHTML = `
    <div class="msg-chan-header msg-shell-chat-header">
      <button class="msg-back-btn" onclick="mobileShowSidebar()">←</button>
      <div class="msg-shell-chat-avatar">🏘️</div>
      <div class="msg-shell-chat-head-copy">
        <div class="msg-chan-title msg-shell-chat-title">Fil du quartier</div>
        <div class="msg-chan-desc msg-shell-chat-desc">Un espace plus editorial pour les residents, l'entraide et les infos utiles.</div>
      </div>
    </div>

    <div class="feed-hub">
      <div class="feed-hub-inner">
        <div class="feed-hub-kicker">Residence</div>
        <h2 class="feed-hub-title">Les nouvelles, l'entraide et les petites annonces de la copro</h2>
        <p class="feed-hub-desc">Un fil plus lisible pour suivre ce qui compte, sans perdre les discussions importantes dans le bruit.</p>
      </div>
    </div>

    <div class="feed-categories-bar">
      <div class="feed-cat-chips-scroll" id="feed-cat-chips">${chipHtml}</div>
    </div>

    <button class="feed-fab-mobile msg-shell-fab" onclick="openFeedComposeModal()" style="position:fixed; bottom:24px; right:24px; width:60px; height:60px; border-radius:22px; background:var(--accent); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:100;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>

    <div class="feed-split" id="feed-split">
      <div class="feed-left-pane" id="feed-left-pane">
        <div class="feed-compose-desktop card" style="padding:18px; margin:16px; display:none; align-items:center; gap:14px; cursor:text;" onclick="openFeedComposeModal()">
          <div class="feed-post-av" style="background:var(--accent);">${(profile?.prenom || 'U').charAt(0).toUpperCase()}</div>
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--text);">Partager une nouvelle utile au quartier</div>
            <div style="font-size:12px; color:var(--text-3); margin-top:3px;">Annonce, entraide, evenement ou note pratique</div>
          </div>
        </div>

        <div class="feed-scroll feed-scroll--community" id="feed-left-scroll">
          <div style="text-align:center;padding:40px;"><div class="spinner"></div></div>
        </div>
      </div>

      <div class="feed-thread-pane" id="feed-thread-pane">
        <div class="feed-thread-empty">
          <div class="msg-shell-welcome-ico">💬</div>
          <div class="msg-shell-welcome-title">Ouvrez une discussion</div>
          <div class="msg-shell-welcome-copy">Touchez repondre sous un message pour afficher le fil complet ici sans quitter la communaute.</div>
        </div>
      </div>
    </div>`;

  const style = document.createElement('style');
  style.innerHTML = `@media(min-width:769px){ .feed-compose-desktop{display:flex !important;} .feed-fab-mobile{display:none !important;} }`;
  $('msg-main').appendChild(style);

  try {
    await loadFeed();
  } catch (err) {
    console.warn('[feed] loadFeed', err);
    const scrollEl = $('feed-left-scroll');
    if (scrollEl) {
      scrollEl.innerHTML = `
        <div class="feed-empty-cat">
          <div class="feed-empty-cat-ico">⚠️</div>
          <div class="feed-empty-cat-title">Impossible de charger le fil</div>
          <div class="feed-empty-cat-desc">Vérifiez la connexion puis réessayez. Si le problème continue, contactez le support.</div>
          <button type="button" class="btn btn-primary btn-sm" style="margin-top:16px;" onclick="openFeed()">Réessayer</button>
        </div>`;
    }
  }
};
