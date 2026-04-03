const EMOJIS = ['👍','❤️','😂','😮','🙏','✅','🔥','👏'];
const CHAN_COLORS = {
  general: '#2563eb', tour13: '#7c3aed', tour15: '#ea580c',
  tour17: '#16a34a', tour19: '#d97706', cs: '#dc2626', feed: '#2563eb'
};

const FEED_COMPOSE_CAT_KEY = 'coprosync_feed_compose_cat_v1';
/** Rubriques filtre + publication (activité = auto : signalements, votes…) */
const FEED_COMMUNITY_CATS = [
  { id: 'tout', label: 'Tout le quartier', emoji: '🏘️', filterOnly: true },
  { id: 'panneau', label: 'Panneau officiel', emoji: '📌', managerOnly: true, board: true },
  { id: 'entraide', label: 'Entraide', emoji: '🤝' },
  { id: 'petites_annonces', label: 'Petites annonces', emoji: '🧺' },
  { id: 'vie_quartier', label: 'Vie du quartier', emoji: '☕' },
  { id: 'evenements', label: 'Événements', emoji: '🎉' },
  { id: 'pratique', label: 'Infos pratiques', emoji: '📋' },
  { id: 'activite', label: 'Vie de la copro', emoji: '🏢', filterOnly: true },
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
    !c.filterOnly && (!c.managerOnly || canManageAnnonces())
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

// State global messagerie
let _msgState = {
  conversations: [], messages: [],
  activeConvId: null, activeChanType: 'feed', // 'feed' | 'chan' | 'dm'
  channel: null, feedChannel: null,
  replyTo: null, // { id, auteur, texte }
  feed: [], feedReactions: {}, feedComments: {},
  feedFilter: 'tout',
  feedComposeCategory: 'entraide',
  typingTimeout: null,
  convFilter: '',
  unreadByConv: {},
  readCursorByConv: {},
  drafts: {},
  /** IDs des posts dont le fil commentaires est ouvert (temps réel + re-render) */
  feedOpenCommentIds: new Set(),
  /** Pour éviter les re-render “visuels” quand rien n'a changé */
  feedCommentSigByPost: {},
  /** Compteur des commentaires reçus depuis la dernière ouverture du fil */
  feedCommentUnreadByPost: {},
  /** Thread commentaires du mur : conversation dédiée par post */
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

/** Ré-ouvre les fils commentaires marqués après re-render du DOM */
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
  const input = _msgState.activeChanType === 'feed' ? $('feed-input') : $('chat-input');
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
  const input = _msgState.activeChanType === 'feed' ? $('feed-input') : $('chat-input');
  if (!input) return;
  input.value = val;
  if (val && _msgState.activeChanType !== 'feed') {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
}

// ── RENDER MESSAGES PAGE ──
async function renderMessages() {
  const page = $('page');
  loadMsgDrafts();
  page.innerHTML = `<div class="msg-layout" id="msg-layout">

    <!-- SIDEBAR GAUCHE -->
    <div class="msg-sidebar" id="msg-sidebar">
      <div class="msg-sidebar-header">
        <span>CoproSync</span>
        <button class="btn btn-ghost btn-sm" onclick="openNewDM()" title="Message privé" style="padding:4px 6px;font-size:16px;">✏️</button>
      </div>
      <div style="padding:8px 12px 4px;">
        <input class="input" id="msg-search-conv" placeholder="Rechercher un canal ou un DM..."
          oninput="onMsgConvSearchInput(event)" style="height:34px;font-size:13px;">
      </div>
      <div class="msg-sidebar-scroll">

        <!-- Feed -->
        <div class="msg-section-label">Communauté</div>
        <div class="msg-chan-item ${_msgState.activeChanType==='feed'?'active':''}" id="chan-feed" onclick="openFeed()">
          <div class="msg-chan-ico">🏘️</div>
          <div class="msg-chan-name">Communauté & panneau</div>
        </div>

        <!-- Canaux groupes -->
        <div class="msg-section-label">Canaux</div>
        <div id="chan-list-groups"></div>

        <!-- Messages privés -->
        <div class="msg-section-label">
          Messages privés
        </div>
        <div id="chan-list-dms"></div>

      </div>
    </div>

    <!-- ZONE PRINCIPALE -->
    <div class="msg-main" id="msg-main">
      <div class="chat-empty" id="msg-welcome">
        <div style="font-size:48px;margin-bottom:12px;">🏢</div>
        <div style="font-family:var(--font-head);font-size:18px;font-weight:800;margin-bottom:6px;">Bienvenue sur CoproSync</div>
        <div style="font-size:13px;color:var(--text-3);">Panneau du quartier, rubriques et messages privés</div>
      </div>
    </div>

  </div>`;

  await loadConversations();
  renderSidebarGroups();
  renderSidebarDMs();
  startMsgRealtime();
  startFeedRealtime();

  // Ouvre le feed par défaut
  if (_msgState.activeChanType === 'feed') {
    openFeed();
  } else if (_msgState.activeConvId) {
    openConv(_msgState.activeConvId);
  }
}

// ── SIDEBAR ──
function renderSidebarGroups() {
  const el = $('chan-list-groups');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const convs = filterConvsByRole(_msgState.conversations)
    .filter(c => !c.type || c.type === 'groupe')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));
  el.innerHTML = convs.map(c => {
    const emoji = c.titre?.split(' ')[0] || '💬';
    const titre = c.titre?.substring(c.titre.indexOf(' ') + 1) || c.titre;
    const isActive = _msgState.activeConvId === c.id && _msgState.activeChanType === 'chan';
    const unread = _msgState.unreadByConv?.[c.id] || 0;
    return `<div class="msg-chan-item ${isActive?'active':''}" id="chan-${c.id}" onclick="openConv('${c.id}')">
      <div class="msg-chan-ico">${emoji}</div>
      <div class="msg-chan-name">${escHtml(titre)}</div>
      ${unread > 0 ? `<div class="msg-chan-badge">${unread > 9 ? '9+' : unread}</div>` : ''}
    </div>`;
  }).join('') || '<div style="padding:4px 16px;font-size:12px;color:var(--text-3);">Aucun canal</div>';
}

function renderSidebarDMs() {
  const el = $('chan-list-dms');
  if (!el) return;
  const q = _msgState.convFilter || '';
  const dms = _msgState.conversations
    .filter(c => c.type === 'prive')
    .filter(c => !q || (c.titre || '').toLowerCase().includes(q));
  if (!dms.length) {
    el.innerHTML = `<div style="padding:4px 16px 8px;font-size:12px;color:var(--text-3);">
      Aucun message privé<br>
      <span style="cursor:pointer;color:var(--accent);" onclick="openNewDM()">Démarrer une conversation →</span>
    </div>`;
    return;
  }
  el.innerHTML = dms.map(c => {
    const isActive = _msgState.activeConvId === c.id;
    // Nom de l'autre personne
    const autreNom = c.titre?.replace(/^🔒\s*/, '') || 'Privé';
    const initiale = autreNom.charAt(0).toUpperCase();
    const color = avatarColor(autreNom);
    const unread = _msgState.unreadByConv?.[c.id] || 0;
    return `<div class="msg-dm-item ${isActive?'active':''}" id="chan-${c.id}" onclick="openConv('${c.id}')">
      <div class="msg-dm-av" style="background:${color};">${initiale}</div>
      <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(autreNom)}</div>
      ${unread > 0 ? `<div class="msg-chan-badge">${unread > 9 ? '9+' : unread}</div>` : ''}
    </div>`;
  }).join('');
}

function onMsgConvSearchInput(e) {
  _msgState.convFilter = (e.target.value || '').toLowerCase().trim();
  renderSidebarGroups();
  renderSidebarDMs();
}

function escHtml(t) {
  return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function avatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#ea580c','#16a34a','#d97706','#dc2626','#0891b2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ── FEED COMMUNAUTAIRE ──
function setFeedFilter(cat) {
  _msgState.feedFilter = cat;
  document.querySelectorAll('.feed-cat-chip').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
    el.setAttribute('aria-pressed', el.dataset.cat === cat ? 'true' : 'false');
  });
  renderFeed();
}

function setFeedComposeCategory(cat) {
  const ok = feedComposeCatsForUser().some(c => c.id === cat);
  if (!ok) return;
  _msgState.feedComposeCategory = cat;
  try { localStorage.setItem(FEED_COMPOSE_CAT_KEY, cat); } catch { /* ignore */ }
  document.querySelectorAll('.feed-compose-cat').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  const tr = $('feed-titre-panneau-row');
  const inp = $('feed-titre-panneau');
  const showTitre = cat === 'panneau';
  if (tr) tr.style.display = showTitre ? '' : 'none';
  if (inp && !showTitre) inp.value = '';
  const ph = $('feed-input');
  if (ph) {
    const hints = {
      panneau: 'Message officiel visible par toute la résidence…',
      entraide: 'Demande ou offre d’aide entre voisins…',
      petites_annonces: 'Don, vente, service, à donner…',
      vie_quartier: 'Un mot sympa, idée de rencontre, café ensemble…',
      evenements: 'Fête des voisins, AG conviviale, date à retenir…',
      pratique: 'Horaires, accès, contact utile…',
    };
    ph.placeholder = hints[cat] || 'Écrire…';
  }
}

function onFeedComposeCatRowClick(e) {
  const btn = e.target.closest('.feed-compose-cat');
  if (!btn || !btn.dataset.cat) return;
  setFeedComposeCategory(btn.dataset.cat);
}

async function openFeed() {
  saveCurrentDraft();
  _msgState.activeChanType = 'feed';
  _msgState.activeConvId = null;
  _msgState.feedComposeCategory = readStoredFeedComposeCat();

  // Update sidebar active
  document.querySelectorAll('.msg-chan-item,.msg-dm-item').forEach(el => el.classList.remove('active'));
  $('chan-feed')?.classList.add('active');

  // Mobile slide
  mobileShowMain();

  const main = $('msg-main');
  if (!main) return;

  // Reset thread state/layout de droite (evite un état résiduel sur mobile)
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

  const composeCatHtml = feedComposeCatsForUser().map(c => {
    const on = _msgState.feedComposeCategory === c.id;
    return `<button type="button" class="feed-compose-cat ${on ? 'active' : ''}" data-cat="${c.id}">${c.emoji} ${escHtml(c.label)}</button>`;
  }).join('');

  main.innerHTML = `
    <div class="msg-chan-header feed-header-compact">
      <button class="msg-back-btn" onclick="mobileShowSidebar()">←</button>
      <div style="font-size:20px;margin-right:2px;">🏘️</div>
      <div>
        <div class="msg-chan-title">Vie du quartier</div>
        <div class="msg-chan-desc">Panneau d’affichage numérique & échanges entre voisins</div>
      </div>
    </div>

    <div class="feed-hub">
      <div class="feed-hub-inner">
        <div class="feed-hub-kicker">Ensemble</div>
        <h2 class="feed-hub-title">Le mur des voisins</h2>
        <p class="feed-hub-desc">Annonces officielles, petits mots, coups de main et vie de la copropriété — tout se passe ici.</p>
      </div>
    </div>

    <div class="feed-categories-bar">
      <div class="feed-cat-chips-scroll" id="feed-cat-chips">${chipHtml}</div>
    </div>

    <div class="feed-split" id="feed-split">
      <div class="feed-left-pane" id="feed-left-pane">
        <div class="feed-compose feed-compose--community" id="feed-compose">
          <div class="feed-compose-ribbon"><span>✏️</span> Publier dans une rubrique</div>
          <div class="feed-compose-cats" id="feed-compose-cats" onclick="onFeedComposeCatRowClick(event)">${composeCatHtml}</div>
          <div class="feed-compose-box">
            <div class="feed-compose-av" style="background:${avatarColor(displayNameFromProfile(profile,user?.email))}">
              ${(profile?.prenom||profile?.nom||user?.email||'?').charAt(0).toUpperCase()}
            </div>
            <div class="feed-compose-fields">
              <div class="feed-titre-panneau-row" id="feed-titre-panneau-row" style="display:${_msgState.feedComposeCategory === 'panneau' ? '' : 'none'};">
                <input type="text" class="feed-titre-panneau-input" id="feed-titre-panneau" maxlength="120"
                  placeholder="Titre de l’affiche (ex. Travaux ascenseur — semaine du 12)">
              </div>
              <textarea class="feed-compose-input" id="feed-input" placeholder="…" rows="1"
                oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';saveCurrentDraft()"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey&&window.innerWidth>768){event.preventDefault();publishFeedPost();}"></textarea>
            </div>
          </div>
          <div class="feed-compose-actions">
            <span class="feed-compose-hint">Entrée pour envoyer · Maj+Entrée pour sauter une ligne</span>
            <div style="display:flex;gap:8px;align-items:center;">
              <button type="button" class="btn btn-ghost btn-sm" onclick="pickFeedEmoji(event)">😊</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="publishFeedPost()">Publier dans la communauté</button>
            </div>
          </div>
        </div>

        <div class="feed-scroll feed-scroll--community" id="feed-left-scroll">
          <div style="text-align:center;padding:32px;color:var(--text-3);">Chargement du fil…</div>
        </div>
      </div>

      <div class="feed-thread-pane" id="feed-thread-pane">
        <div class="feed-thread-empty" id="feed-thread-empty">
          <div style="font-size:42px;margin-bottom:10px;">💬</div>
          <div style="font-family:var(--font-head);font-weight:800;font-size:16px;margin-bottom:6px;">Ouvrez un message</div>
          <div style="font-size:13px;color:var(--text-3);line-height:1.5;">
            Sélectionnez un post à gauche pour voir la conversation et les nouveaux commentaires.
          </div>
        </div>
      </div>
    </div>`;

  setFeedComposeCategory(_msgState.feedComposeCategory);
  await loadFeed();
  restoreCurrentDraft();
}

async function loadFeed() {
  const { data: posts } = await sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .neq('type', 'comment')
    .order('created_at', { ascending: false })
    .limit(120);

  const { data: reactions } = await sb.from('reactions')
    .select('*')
    .eq('target_type', 'post');

  // Groupe les réactions par post (clés string)
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

  const prunableVisible = new Set(rows.filter(inFilter).map(p => String(p.id)));
  for (const cid of [..._msgState.feedOpenCommentIds]) {
    if (!prunableVisible.has(String(cid))) _msgState.feedOpenCommentIds.delete(cid);
  }

  const filtered = rows.filter(inFilter);
  if (!filtered.length) {
    _msgState.feedOpenCommentIds.clear();
    const cm = feedCatMeta(f);
    el.innerHTML = `<div class="feed-empty-cat">
      <div class="feed-empty-cat-ico">${cm.emoji}</div>
      <div class="feed-empty-cat-title">${f === 'tout' ? 'Soyez le premier à poster !' : `Pas encore de message dans « ${escHtml(cm.label)} »`}</div>
      <div class="feed-empty-cat-desc">${f === 'tout'
        ? 'Une annonce, une question aux voisins, un bon plan — tout le monde vous lit ici.'
        : 'Essayez une autre rubrique ou publiez : votre message apparaîtra dans cette section.'}</div>
    </div>`;
    return;
  }

  const pinnedBlock = filtered.filter(p => p.epingle && p.type === 'post');
  const rest = filtered.filter(p => !(p.epingle && p.type === 'post'));
  const showBoard = pinnedBlock.length && (f === 'tout' || f === 'panneau');

  let html = '';
  if (showBoard) {
    html += `<section class="feed-board-section" aria-label="Panneau — messages épinglés">
      <header class="feed-board-head">
        <span class="feed-board-pin" aria-hidden="true">📌</span>
        <div>
          <div class="feed-board-head-title">Panneau d’affichage</div>
          <div class="feed-board-head-sub">À lire en priorité — infos pour tout le monde</div>
        </div>
      </header>
      <div class="feed-board-posts">${pinnedBlock.map(p => renderFeedPost(p)).join('')}</div>
    </section>`;
  }

  if (rest.length) {
    if (showBoard) {
      html += `<div class="feed-timeline-label"><span>Fil du quartier</span></div>`;
    }
    html += rest.map(p => renderFeedPost(p)).join('');
  } else if (showBoard) {
    html += `<div class="feed-timeline-end">— Rien d’autre pour le moment dans cette vue —</div>`;
  }

  el.innerHTML = html;
  restoreFeedOpenCommentThreads();
}

function renderFeedPost(p) {
  const auteur = p.profiles ? displayName(p.profiles.prenom, p.profiles.nom, p.profiles.email, 'Résident') : 'Résident';
  const initiale = auteur.charAt(0).toUpperCase();
  const color = avatarColor(auteur);
  const time = depuisJours(p.created_at);
  const isMine = p.auteur_id === user?.id;
  const cat = feedPostCategory(p);
  const cmeta = feedCatMeta(cat);
  const affiche = p.epingle && p.type === 'post';
  const accent = feedCatAccent(cat);
  const badge = `<span class="feed-post-cat-badge" style="--feed-cat:${accent}">${cmeta.emoji} ${escHtml(cmeta.label)}</span>`;
  const unread = _msgState.feedCommentUnreadByPost[String(p.id)] || 0;

  // Réactions groupées par emoji (clé string = ids Supabase)
  const reacts = _msgState.feedReactions[String(p.id)] || [];
  const reactGroups = {};
  reacts.forEach(r => {
    if (!reactGroups[r.emoji]) reactGroups[r.emoji] = { count: 0, mine: false };
    reactGroups[r.emoji].count++;
    if (r.user_id === user?.id) reactGroups[r.emoji].mine = true;
  });
  const reactHtml = Object.entries(reactGroups).map(([emoji, data]) =>
    `<div class="feed-reaction ${data.mine?'mine':''}" onclick="toggleFeedReaction('${p.id}','${emoji}')">
      <span>${emoji}</span>
      <span class="feed-reaction-count">${data.count}</span>
    </div>`
  ).join('');

  // Contenu selon type
  let body = '';
  if (p.type === 'post') {
    const titreBloc = p.titre_panneau
      ? `<div class="feed-post-affiche-titre">${escHtml(p.titre_panneau)}</div>`
      : '';
    body = `${titreBloc}<div class="feed-post-body">${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'ticket') {
    body = `<div class="feed-event-card ticket">🔧 ${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'resolved') {
    body = `<div class="feed-event-card resolved">✅ ${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'vote') {
    body = `<div class="feed-event-card vote">🗳️ ${escHtml(p.contenu)}</div>`;
  } else if (p.type === 'member') {
    body = `<div class="feed-event-card member">👋 ${escHtml(p.contenu)}</div>`;
  }

  const pinBtn = canManageAnnonces() && p.type === 'post'
    ? `<button type="button" class="btn btn-ghost btn-sm feed-pin-btn" title="${p.epingle ? 'Retirer du panneau' : 'Épingler au panneau'}" onclick="event.preventDefault();toggleFeedPin('${p.id}')">${p.epingle ? '📌' : '📍'}<span class="feed-pin-lbl">${p.epingle ? 'Épinglé' : 'Épingler'}</span></button>`
    : '';

  return `<div class="feed-post ${affiche ? 'feed-post--affiche' : ''}" id="post-${p.id}" data-feed-cat="${cat}">
    <div class="feed-post-header">
      <div class="feed-post-av" style="background:${color};">${initiale}</div>
      <div class="feed-post-meta">
        <div class="feed-post-author-line">
          <span class="feed-post-author">${escHtml(auteur)}</span>
          ${badge}
        </div>
        <div class="feed-post-time">${time}</div>
      </div>
      <div class="feed-post-header-actions">
        ${pinBtn}
        ${isMine ? `<button type="button" class="btn btn-ghost btn-sm feed-del-btn" onclick="deleteFeedPost('${p.id}')" title="Supprimer">✕</button>` : ''}
      </div>
    </div>
    ${body}
    ${reactHtml ? `<div class="feed-reactions">${reactHtml}</div>` : ''}
    <div class="feed-post-actions">
      ${EMOJIS.slice(0,4).map(e =>
        `<button class="feed-action-btn" onclick="toggleFeedReaction('${p.id}','${e}')">${e}</button>`
      ).join('')}
      <button class="feed-action-btn" onclick="openFeedThread('${p.id}')">
        💬 Commenter
        <span class="feed-unread-comment-badge" id="feed-unread-${p.id}" style="display:${unread>0 ? 'inline-flex' : 'none'};">${unread>0 ? unread : ''}</span>
      </button>
    </div>
  </div>`;
}

function closeFeedThread() {
  _msgState.activeFeedThreadPostId = null;
  _msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
  _msgState.feedThreadRenderedCommentIds = new Set();
  const split = $('feed-split');
  if (split) split.classList.remove('thread-active');
  const pane = $('feed-thread-pane');
  if (!pane) return;
  pane.innerHTML = `
    <div class="feed-thread-empty" id="feed-thread-empty">
      <div style="font-size:42px;margin-bottom:10px;">💬</div>
      <div style="font-family:var(--font-head);font-weight:800;font-size:16px;margin-bottom:6px;">Ouvrez un message</div>
      <div style="font-size:13px;color:var(--text-3);line-height:1.5;">
        Sélectionnez un post à gauche pour voir la conversation et les nouveaux commentaires.
      </div>
    </div>
  `;
}

function renderFeedThreadPostHeader(p) {
  const auteur = p.profiles ? displayName(p.profiles.prenom, p.profiles.nom, p.profiles.email, 'Résident') : 'Résident';
  const initiale = auteur.charAt(0).toUpperCase();
  const time = depuisJours(p.created_at);
  const cat = feedPostCategory(p);
  const cmeta = feedCatMeta(cat);
  const accent = feedCatAccent(cat);
  const badge = `<span class="feed-post-cat-badge" style="--feed-cat:${accent}">${cmeta.emoji} ${escHtml(cmeta.label)}</span>`;

  const affiche = p.epingle && p.type === 'post';
  const titreBloc = p.type === 'post' && p.titre_panneau
    ? `<div class="feed-post-affiche-titre" style="margin-bottom:10px;">${escHtml(p.titre_panneau)}</div>`
    : '';

  const isMine = p.auteur_id === user?.id;
  const pinBtn = canManageAnnonces() && p.type === 'post'
    ? `<button type="button" class="btn btn-ghost btn-sm" style="padding:4px 8px;" onclick="toggleFeedPin('${p.id}')">${p.epingle ? '📌' : '📍'} ${p.epingle ? 'Épinglé' : 'Épingler'}</button>`
    : '';
  const delBtn = isMine
    ? `<button type="button" class="btn btn-ghost btn-sm" style="padding:4px 8px;" onclick="deleteFeedPost('${p.id}')">✕ Supprimer</button>`
    : '';

  const backBtn = `<button class="msg-back-btn feed-thread-back-btn" onclick="closeFeedThread()" title="Retour">←</button>`;

  return `
    <div class="feed-thread-header">
      ${backBtn}
      <div class="feed-thread-head-left">
        <div class="feed-post-av" style="background:${avatarColor(auteur)}; width:42px; height:42px; font-size:18px;">${initiale}</div>
        <div class="feed-thread-head-meta">
          <div class="feed-thread-head-author">${escHtml(auteur)} ${badge}</div>
          <div class="feed-thread-head-time">${time}</div>
        </div>
      </div>
      <div class="feed-thread-head-actions">
        ${pinBtn}
        ${delBtn}
      </div>
    </div>
    <div class="feed-thread-post-body ${affiche ? 'feed-post--affiche' : ''}">
      ${titreBloc}
      ${p.type === 'post'
        ? `<div class="feed-post-body" style="margin:0;">${escHtml(p.contenu)}</div>`
        : p.type === 'ticket'
          ? `<div class="feed-event-card ticket">🔧 ${escHtml(p.contenu)}</div>`
          : p.type === 'resolved'
            ? `<div class="feed-event-card resolved">✅ ${escHtml(p.contenu)}</div>`
            : p.type === 'vote'
              ? `<div class="feed-event-card vote">🗳️ ${escHtml(p.contenu)}</div>`
              : p.type === 'member'
                ? `<div class="feed-event-card member">👋 ${escHtml(p.contenu)}</div>`
                : `<div class="feed-post-body" style="margin:0;">${escHtml(p.contenu)}</div>`
      }
    </div>
  `;
}

function renderFeedCommentLine(c) {
  const auteur = c.profiles ? displayName(c.profiles.prenom, c.profiles.nom, c.profiles.email, 'Résident') : 'Résident';
  const color = avatarColor(auteur);
  return `<div class="feed-comment">
    <div class="feed-comment-av" style="background:${color};">${auteur.charAt(0).toUpperCase()}</div>
    <div class="feed-comment-bubble">
      <div class="feed-comment-author">${escHtml(auteur)} <span style="font-weight:400;color:var(--text-3);">${depuisJours(c.created_at)}</span></div>
      ${escHtml(c.contenu)}
    </div>
  </div>`;
}

function setFeedThreadHasMore(hasMore, oldestLoadedAt) {
  _msgState.feedThreadState.hasMore = !!hasMore;
  _msgState.feedThreadState.oldestLoadedAt = oldestLoadedAt || null;
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
    listEl.innerHTML = `<div style="text-align:center;padding:18px;color:var(--text-3);">Chargement des commentaires…</div>`;
  }

  const baseQ = sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .eq('reference_id', sid)
    .eq('type', 'comment');

  let q = baseQ;
  if (older && _msgState.feedThreadState.oldestLoadedAt) {
    q = q.lt('created_at', _msgState.feedThreadState.oldestLoadedAt);
  }

  const { data } = await q
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = data || [];
  if (!rows.length) {
    if (!older) listEl.innerHTML = '<div style="padding:10px 0 6px;font-size:12px;color:var(--text-3);">Aucun commentaire pour le moment.</div>';
    setFeedThreadHasMore(false, null);
    btnEl.style.display = 'none';
    return;
  }

  const commentsAsc = [...rows].reverse();
  const hasMore = rows.length === limit;
  const oldest = commentsAsc[0]?.created_at || null;
  setFeedThreadHasMore(hasMore, oldest);
  btnEl.style.display = hasMore ? 'block' : 'none';

  const newIds = commentsAsc.map(x => String(x.id));
  newIds.forEach(id => _msgState.feedThreadRenderedCommentIds.add(id));

  if (!older) {
    listEl.innerHTML = commentsAsc.map(renderFeedCommentLine).join('');
    return;
  }

  // Pré-pend en gardant la position de scroll
  const prevScrollTop = scrollEl.scrollTop;
  const prevScrollHeight = scrollEl.scrollHeight;
  listEl.insertAdjacentHTML('afterbegin', commentsAsc.map(renderFeedCommentLine).join(''));
  const newScrollHeight = scrollEl.scrollHeight;
  scrollEl.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
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

  // reset unread badge (si jamais)
  _msgState.feedCommentUnreadByPost[sid] = 0;
  const ub = $(`feed-unread-${sid}`);
  if (ub) ub.style.display = 'none';
}

async function openFeedThread(postId) {
  const sid = String(postId);
  _msgState.activeFeedThreadPostId = sid;
  _msgState.feedThreadRenderedCommentIds = new Set();
  _msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
  _msgState.feedCommentUnreadByPost[sid] = 0;

  const split = $('feed-split');
  if (split) split.classList.add('thread-active');

  // Reset unread badge on left card
  const ub = $(`feed-unread-${sid}`);
  if (ub) ub.style.display = 'none';

  let post = _msgState.feed.find(p => String(p.id) === sid);
  if (!post) {
    const { data } = await sb.from('feed_posts')
      .select('*, profiles(id,prenom,nom,email)')
      .eq('id', sid).single();
    post = data;
  }
  if (!post) return;

  const threadPane = $('feed-thread-pane');
  if (!threadPane) return;

  threadPane.innerHTML = `
    <div class="feed-thread-wrap">
      ${renderFeedThreadPostHeader(post)}
      <div class="feed-thread-scroll" id="feed-thread-scroll">
        <div class="feed-thread-comments">
          <div id="feed-thread-comments-list"></div>
          <div style="padding:10px 0;text-align:center;">
            <button class="btn btn-secondary btn-sm" id="feed-thread-load-more-btn" onclick="loadFeedThreadOlder()">Charger plus</button>
          </div>
        </div>
      </div>
      <div class="feed-thread-composer">
        <div class="feed-thread-composer-box">
          <textarea class="feed-compose-input" id="feed-thread-comment-input" placeholder="Écrire un commentaire…"
            rows="1"
            oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFeedThreadComment();}"></textarea>
          <button class="chat-send" style="width:44px;height:44px;" onclick="sendFeedThreadComment()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  // cache: ré-après re-render DOM
  await loadFeedThreadComments(sid, { older: false });
}

function loadFeedThreadOlder() {
  const sid = _msgState.activeFeedThreadPostId;
  if (!sid) return;
  loadFeedThreadComments(sid, { older: true });
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

  // Insert + récupère profils pour rendu immédiat
  const { data: newC, error } = await sb.from('feed_posts')
    .insert({
      auteur_id: user.id,
      contenu,
      type: 'comment',
      reference_id: sid,
    })
    .select('*, profiles(id,prenom,nom,email)')
    .single();

  if (error) { toast('Erreur commentaire', 'err'); return; }

  // Ajout optimiste (anti-doublon par Set)
  const withRef = { ...newC, reference_id: sid };
  await appendFeedThreadComment(withRef);
}

async function publishFeedPost() {
  const input = $('feed-input');
  const contenu = input?.value.trim();
  if (!contenu) return;
  let cat = _msgState.feedComposeCategory;
  if (!feedComposeCatsForUser().some(c => c.id === cat)) cat = (feedComposeCatsForUser()[0] || { id: 'entraide' }).id;

  const titreInp = $('feed-titre-panneau');
  let titre_panneau = (titreInp?.value || '').trim();
  if (cat !== 'panneau') titre_panneau = '';

  input.value = '';
  if (titreInp) titreInp.value = '';
  input.style.height = 'auto';
  saveCurrentDraft();

  const row = { auteur_id: user.id, contenu, type: 'post', categorie: cat };
  if (titre_panneau) row.titre_panneau = titre_panneau;

  const { data: newPost, error } = await insertFeedPostRow(row, { selectProfiles: true });

  if (error) { toast('Erreur publication', 'err'); return; }
  if (newPost) {
    if (!newPost.profiles) newPost.profiles = { id: user.id, prenom: profile?.prenom, nom: profile?.nom, email: user.email };
    _msgState.feed = sortFeedPosts([newPost, ..._msgState.feed.filter(x => x.id !== newPost.id)]);
  }
  renderFeed();
  toast('Publié — merci de faire vivre le quartier !', 'ok');
}

async function toggleFeedPin(postId) {
  if (!canManageAnnonces()) return;
  const post = _msgState.feed.find(p => p.id === postId);
  if (!post || post.type !== 'post') return;
  const next = !post.epingle;
  const { error } = await sb.from('feed_posts').update({ epingle: next }).eq('id', postId);
  if (error) {
    toast('Épinglage : colonne « epingle » absente ? Exécutez supabase_feed_community.sql', 'warn');
    return;
  }
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
    reacts = _msgState.feedReactions[sid];
  }
  const postEl = $(`post-${sid}`);
  const post = _msgState.feed.find(p => String(p.id) === sid);
  const keepComments = _msgState.feedOpenCommentIds.has(sid);
  if (postEl && post) {
    postEl.outerHTML = renderFeedPost(post);
    if (keepComments) {
      const box = $(`feed-comments-${sid}`);
      if (box) {
        box.style.display = 'block';
        await loadFeedComments(sid);
      }
    }
  }
}

async function toggleFeedComments(postId) {
  if (String(postId).startsWith('tmp-')) return;
  const sid = String(postId);
  const el = $(`feed-comments-${sid}`);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    _msgState.feedOpenCommentIds.add(sid);
    // Une fois le fil ouvert, on considère les commentaires comme lus
    _msgState.feedCommentUnreadByPost[sid] = 0;
    const ub = $(`feed-unread-${sid}`);
    if (ub) ub.style.display = 'none';
    await loadFeedComments(sid);
  } else {
    _msgState.feedOpenCommentIds.delete(sid);
  }
}

async function loadFeedComments(postId) {
  if (!postId || String(postId).startsWith('tmp-')) return;
  const sid = String(postId);
  const listEl = $(`feed-comments-list-${sid}`);
  if (!listEl) return;
  const { data } = await sb.from('feed_posts')
    .select('*, profiles(id,prenom,nom,email)')
    .eq('reference_id', sid)
    .eq('type', 'comment')
    .order('created_at', { ascending: true });
  const last = data?.length ? data[data.length - 1] : null;
  const sig = `${data?.length || 0}|${last?.id || ''}|${last?.created_at || ''}`;
  if (_msgState.feedCommentSigByPost[sid] === sig) return;

  _msgState.feedCommentSigByPost[sid] = sig;

  if (!data?.length) {
    listEl.innerHTML = '<div style="padding:4px 0 8px;font-size:12px;color:var(--text-3);">Aucun commentaire — soyez le premier !</div>';
    return;
  }

  const prevScrollTop = listEl.scrollTop;
  listEl.innerHTML = data.map(c => {
    const auteur = c.profiles ? displayName(c.profiles.prenom, c.profiles.nom, c.profiles.email, 'Résident') : 'Résident';
    const color = avatarColor(auteur);
    return `<div class="feed-comment">
      <div class="feed-comment-av" style="background:${color};">${auteur.charAt(0).toUpperCase()}</div>
      <div class="feed-comment-bubble">
        <div class="feed-comment-author">${escHtml(auteur)} <span style="font-weight:400;color:var(--text-3);">${depuisJours(c.created_at)}</span></div>
        ${escHtml(c.contenu)}
      </div>
    </div>`;
  }).join('');

  // Ré-essaie de garder la position de scroll (évite le “saut” visuel)
  listEl.scrollTop = prevScrollTop;
}

async function sendFeedComment(postId) {
  const sid = String(postId);
  const input = $(`feed-comment-input-${sid}`);
  const contenu = input?.value.trim();
  if (!contenu) return;
  input.value = '';
  await sb.from('feed_posts').insert({
    auteur_id: user.id, contenu, type: 'comment', reference_id: sid
  });
  await loadFeedComments(sid);
}

async function deleteFeedPost(postId) {
  if (!confirm('Supprimer ce post ?')) return;
  await sb.from('feed_posts').delete().eq('id', postId);
  _msgState.feed = _msgState.feed.filter(p => p.id !== postId);
  renderFeed();
}

function startFeedRealtime() {
  if (_msgState.feedChannel) return;
  _msgState.feedChannel = sb.channel('feed-global')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, async payload => {
      const p = payload.new;
      if (p.type === 'comment') {
        const parentId = p.reference_id != null ? String(p.reference_id) : '';
        if (!parentId) return;

        const isThreadActive = _msgState.activeFeedThreadPostId
          && String(_msgState.activeFeedThreadPostId) === parentId;

        if (isThreadActive) {
          // Append dans le thread ouvert
          const { data: prof } = await sb.from('profiles')
            .select('id,prenom,nom,email')
            .eq('id', p.auteur_id)
            .single();
          const commentRow = { ...p, profiles: prof, reference_id: parentId };
          await appendFeedThreadComment(commentRow);

          _msgState.feedCommentUnreadByPost[parentId] = 0;
          const ub = $(`feed-unread-${parentId}`);
          if (ub) ub.style.display = 'none';
        } else {
          // Compteur sur la carte du post
          _msgState.feedCommentUnreadByPost[parentId] = (_msgState.feedCommentUnreadByPost[parentId] || 0) + 1;
          const ub = $(`feed-unread-${parentId}`);
          if (ub) {
            ub.textContent = _msgState.feedCommentUnreadByPost[parentId];
            ub.style.display = 'inline-flex';
          }
        }
        return;
      }
      if (p.auteur_id === user.id) return;
      const { data: prof } = await sb.from('profiles').select('id,prenom,nom,email').eq('id', p.auteur_id).single();
      const post = { ...p, profiles: prof };
      _msgState.feed = sortFeedPosts([post, ..._msgState.feed.filter(x => x.id !== post.id)]);
      if (_msgState.activeChanType === 'feed') renderFeed();
      else toast('🏘️ Nouveau message sur le mur des voisins', 'ok');
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
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, payload => {
      const r = payload.new;
      if (r.target_type === 'post' && r.user_id !== user.id) {
        const tid = String(r.target_id);
        if (!_msgState.feedReactions[tid]) _msgState.feedReactions[tid] = [];
        _msgState.feedReactions[tid].push(r);
        const post = _msgState.feed.find(p => String(p.id) === tid);
        const postEl = $(`post-${tid}`);
        if (postEl && post) postEl.outerHTML = renderFeedPost(post);
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'feed_posts' }, payload => {
      const oldRow = payload.old;
      const id = oldRow?.id;
      if (!id) return;
      if (oldRow.type === 'comment' && oldRow.reference_id != null) {
        const pid = String(oldRow.reference_id);
        if (_msgState.activeFeedThreadPostId && String(_msgState.activeFeedThreadPostId) === pid) {
          // Rechargement thread (rare) : évite les états incohérents
          loadFeedThreadComments(pid, { older: false });
        }
        return;
      }
      _msgState.feed = _msgState.feed.filter(x => String(x.id) !== String(id));
      if (_msgState.activeChanType === 'feed') renderFeed();
    })
    .subscribe();
}

// Publie dans le feed depuis l'app (tickets, votes, membres)
async function publishFeedEvent(type, contenu) {
  const catMap = { ticket: 'pratique', resolved: 'pratique', vote: 'evenements', member: 'vie_quartier' };
  const categorie = catMap[type] || 'activite';
  try {
    const res = await insertFeedPostRowSimple({ auteur_id: user.id, contenu, type, categorie });
    if (res.error) console.warn('[feed]', res.error.message);
  } catch (e) { console.warn('[feed]', e.message); }
}

// ── CANAUX DE DISCUSSION ──
async function loadConversations() {
  // Charge uniquement les conversations dont l'utilisateur est membre
  const { data: memberships } = await sb.from('conversation_membres')
    .select('conversation_id,lu_jusqu_a').eq('user_id', user.id);
  const ids = (memberships || []).map(m => m.conversation_id);
  _msgState.readCursorByConv = Object.fromEntries((memberships || []).map(m => [m.conversation_id, m.lu_jusqu_a || null]));
  if (!ids.length) { _msgState.conversations = []; renderSidebarGroups(); renderSidebarDMs(); return; }

  const { data, error } = await sb.from('conversations')
    .select('*').in('id', ids).order('created_at');
  if (error) { console.warn('[msg] loadConversations:', error.message); return; }
  _msgState.conversations = data || [];
  await computeUnreadByConversation();
  renderSidebarGroups();
  renderSidebarDMs();
}

async function computeUnreadByConversation() {
  const convs = _msgState.conversations || [];
  const out = {};
  for (const c of convs) {
    const cursor = _msgState.readCursorByConv[c.id];
    let q = sb.from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', c.id)
      .neq('auteur_id', user.id);
    if (cursor) q = q.gt('created_at', cursor);
    const { count } = await q;
    out[c.id] = count || 0;
  }
  _msgState.unreadByConv = out;
}

async function openConv(convId) {
  saveCurrentDraft();
  stopFeedCommentsPoll();
  _msgState.activeConvId = convId;
  _msgState.activeChanType = _msgState.conversations.find(c=>c.id===convId)?.type === 'prive' ? 'dm' : 'chan';

  // Update sidebar
  document.querySelectorAll('.msg-chan-item,.msg-dm-item').forEach(el => el.classList.remove('active'));
  $(`chan-feed`)?.classList.remove('active');
  $(`chan-${convId}`)?.classList.add('active');

  // Mobile
  mobileShowMain();

  const conv = _msgState.conversations.find(c => c.id === convId);
  if (!conv) return;
  const emoji = conv.titre?.split(' ')[0] || '💬';
  const titre = conv.titre?.substring(conv.titre.indexOf(' ') + 1) || conv.titre;
  const isPrive = conv.type === 'prive';

  const main = $('msg-main');
  if (!main) return;
  main.innerHTML = `
    <div class="msg-chan-header">
      <button class="msg-back-btn" onclick="mobileShowSidebar()">←</button>
      <div style="font-size:20px;margin-right:2px;">${emoji}</div>
      <div class="chat-header-info">
        <div class="msg-chan-title">${escHtml(titre)}</div>
        <div class="msg-chan-desc" id="chat-members-count">${isPrive ? '🔒 Conversation privée' : 'Canal'}</div>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages">
      <div style="text-align:center;padding:24px;color:var(--text-3);font-size:13px;">Chargement…</div>
    </div>
    <div class="msg-reply-bar" id="msg-reply-bar" style="display:none;">
      <span style="color:var(--text-3);">↩️ Répondre à</span>
      <div class="msg-reply-bar-content" id="msg-reply-bar-content"></div>
      <button class="msg-reply-bar-close" onclick="clearReply()">✕</button>
    </div>
    <div class="chat-typing" id="chat-typing"></div>
    <div class="chat-input-bar">
      <div class="chat-input-wrap">
        <textarea class="chat-input" id="chat-input" placeholder="Message…" rows="1"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';onChatInput(event);saveCurrentDraft();"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey&&window.innerWidth>768){event.preventDefault();sendMessage();}"></textarea>
        <div id="chat-mention-list" class="chat-mention-pop" style="display:none;"></div>
      </div>
      <button class="chat-send" onclick="sendMessage()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
      </button>
    </div>`;

  await loadMessages(convId);
  restoreCurrentDraft();
  _msgState.unreadByConv[convId] = 0;
  renderSidebarGroups();
  renderSidebarDMs();
  markConvRead(convId);
}

function mobileShowMain() {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (window.innerWidth <= 768) {
    if (sidebar) sidebar.classList.add('hidden');
    if (main) main.classList.add('visible');
  }
}

function mobileShowSidebar() {
  const sidebar = $('msg-sidebar');
  const main = $('msg-main');
  if (sidebar) sidebar.classList.remove('hidden');
  if (main) main.classList.remove('visible');
  _msgState.activeConvId = null;
}

// ── MESSAGES ──
async function loadMessages(convId) {
  const { data, error } = await sb.from('messages')
    .select('*, profiles(nom, prenom), reply:reply_to_id(texte, profiles(prenom,nom))')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) { console.warn('[msg] loadMessages:', error.message); return; }
  _msgState.messages = data || [];

  // Charge les réactions des messages
  const msgIds = (data||[]).map(m => m.id).filter(id => !id.startsWith('tmp-'));
  if (msgIds.length) {
    const { data: reacts } = await sb.from('reactions')
      .select('*').in('target_id', msgIds).eq('target_type', 'message');
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
    el.innerHTML = '<div style="text-align:center;padding:48px 24px;"><div style="font-size:40px;margin-bottom:10px;">👋</div><div style="font-size:14px;color:var(--text-3);">Soyez le premier à écrire !</div></div>';
    return;
  }
  let lastDate = null, lastAuteur = null;
  const html = [];
  msgs.forEach(m => {
    const isMine = m.auteur_id === user.id;
    const auteur = m.profiles ? displayName(m.profiles.prenom, m.profiles.nom, null, '?') : '?';
    const d = new Date(m.created_at);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    const showSender = !isMine && auteur !== lastAuteur;

    if (dateStr !== lastDate) {
      lastDate = dateStr; lastAuteur = null;
      html.push(`<div class="msg-date-sep">${dateStr}</div>`);
    }

    // Reply preview
    let replyHtml = '';
    if (m.reply) {
      const replyAuteur = m.reply.profiles ? displayName(m.reply.profiles.prenom, m.reply.profiles.nom, null, '?') : '?';
      replyHtml = `<div class="msg-reply-preview">↩️ ${escHtml(replyAuteur)} : ${escHtml((m.reply.texte||'').substring(0,60))}</div>`;
    }

    // Réactions
    const reacts = (_msgState.msgReactions || {})[m.id] || [];
    const rGroups = {};
    reacts.forEach(r => {
      if (!rGroups[r.emoji]) rGroups[r.emoji] = { count:0, mine:false };
      rGroups[r.emoji].count++;
      if (r.user_id === user.id) rGroups[r.emoji].mine = true;
    });
    const reactHtml = Object.entries(rGroups).map(([e, d]) =>
      `<div class="msg-reaction ${d.mine?'mine':''}" onclick="toggleMsgReaction('${m.id}','${e}')">
        <span>${e}</span><span class="msg-reaction-count">${d.count}</span>
      </div>`
    ).join('');

    const texteHtml = escHtml(m.texte||'').replace(/@(\S+)/g, '<span class="msg-mention-tag">@$1</span>');

    html.push(`<div class="msg-group ${isMine?'mine':'theirs'}" id="msg-${m.id}">
      ${showSender ? `<div class="msg-sender-name">${escHtml(auteur)}</div>` : ''}
      <div style="position:relative;">
        <div class="msg-bubble ${isMine?'mine':'theirs'}">
          ${replyHtml}
          ${texteHtml}
        </div>
        <div class="msg-actions">
          ${EMOJIS.slice(0,3).map(e => `<button class="msg-action-btn" onclick="toggleMsgReaction('${m.id}','${e}')">${e}</button>`).join('')}
          <button class="msg-action-btn" title="Répondre" onclick="setReply('${m.id}','${escHtml(auteur)}','${escHtml((m.texte||'').substring(0,50)).replace(/'/g,"\\'")}')">↩️</button>
        </div>
      </div>
      ${reactHtml ? `<div class="msg-reactions">${reactHtml}</div>` : ''}
      <div class="msg-time-row">${timeStr}</div>
    </div>`);
    lastAuteur = auteur;
  });
  el.innerHTML = html.join('');
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

async function markConvRead(convId) {
  await sb.from('conversation_membres').upsert({
    conversation_id: convId, user_id: user.id,
    lu_jusqu_a: new Date().toISOString()
  }, { onConflict: 'conversation_id,user_id' });
}

// ── REALTIME MESSAGES ──
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
        toast('💬 Nouveau message', 'ok');
      }
    })
    .subscribe();
}

// ── MENTIONS ──
async function onChatInput(e) {
  const ta = e.target;
  const val = ta.value;
  const cursor = ta.selectionStart;
  const before = val.substring(0, cursor);
  const atMatch = before.match(/@(\w*)$/);
  const ml = $('chat-mention-list');
  if (!atMatch) { if (ml) ml.style.display = 'none'; return; }
  const query = atMatch[1].toLowerCase();
  const { data: profs } = await sb.from('profiles').select('id,nom,prenom,role')
    .or(`prenom.ilike.${query}%,nom.ilike.${query}%`).neq('id', user.id).limit(5);
  const list = profs || [];
  if (!ml || !list.length) { if (ml) ml.style.display = 'none'; return; }
  const roleL = { administrateur:'Admin', syndic:'Syndic', membre_cs:'CS', 'copropriétaire':'Copro' };
  ml.innerHTML = list.map(p => `
    <div class="mention-item" onclick="insertChatMention('${p.id}','${(p.prenom||p.nom||'').replace(/'/g,"\\'")}','${(p.nom||'').replace(/'/g,"\\'")}')">
      <div class="mention-av">${(p.prenom||p.nom||'?').charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:600;">${displayName(p.prenom,p.nom,null,'?')}</div>
        <div style="font-size:11px;color:var(--text-3);">${roleL[p.role]||p.role}</div>
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
  const newBefore = val.substring(0, cursor).replace(/@\w*$/, `@${name} `);
  ta.value = newBefore + val.substring(cursor);
  ta.focus();
  if (ml) ml.style.display = 'none';
  if (!_msgState.pendingMentions) _msgState.pendingMentions = [];
  _msgState.pendingMentions.push({ userId, name });
}

// ── DM PRIVÉ ──
async function openNewDM() {
  const { data: users } = await sb.from('profiles')
    .select('id,nom,prenom,email').eq('actif', true).neq('id', user.id).order('prenom');
  if (!users?.length) { toast('Aucun autre utilisateur', 'warn'); return; }

  // Modale de sélection
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'dm-modal';
  overlay.innerHTML = `<div class="modal" style="max-width:400px;">
    <div class="mh"><span class="mh-title">💬 Nouveau message privé</span>
      <button class="mclose" onclick="$('dm-modal').remove()">×</button></div>
    <div class="mb">
      <input class="input" id="dm-search" placeholder="Rechercher un résident…"
        oninput="filterDMList()" style="margin-bottom:12px;">
      <div id="dm-user-list">
        ${users.map(u => {
          const nom = displayName(u.prenom, u.nom, u.email, 'Résident');
          const color = avatarColor(nom);
          return `<div class="msg-dm-item" style="padding:8px 4px;border-radius:8px;" onclick="startDM('${u.id}','${nom.replace(/'/g,"\\'")}')">
            <div class="msg-dm-av" style="background:${color};width:36px;height:36px;font-size:14px;">${nom.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;font-size:14px;">${escHtml(nom)}</div>
              <div style="font-size:11px;color:var(--text-3);">${u.email}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function filterDMList() {
  const q = $('dm-search')?.value.toLowerCase() || '';
  document.querySelectorAll('#dm-user-list .msg-dm-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

async function startDM(targetId, targetNom) {
  $('dm-modal')?.remove();
  // Vérifie si un DM existe déjà
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
