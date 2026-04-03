// ── ANNONCES — filtrage mémoire, visibilité par rôle active, notifications complètes
const ANNONCE_TYPES = {
  urgent:    { label:'🚨 Urgent',    color:'red',    ico:'🚨' },
  important: { label:'⚠️ Important', color:'orange', ico:'⚠️' },
  info:      { label:'ℹ️ Info',      color:'info',   ico:'📢' },
};

const ROLE_LABELS = {
  copropriétaire: 'Copropriétaires',
  membre_cs:      'Conseil syndical',
  syndic:         'Syndic',
  administrateur: 'Administrateurs',
};

let _annTab        = 'publie';
let _annFilter     = 'all';
let _annSearch     = '';
let _annRawData    = [];      // données brutes chargées une fois
let _annDebounce   = null;    // timer debounce recherche

// ── VISIBILITÉ ──────────────────────────────────────────────────────────────

function onAnnonceVisModeChange() {
  const mode = $('anc-vis-mode')?.value;
  const box  = $('anc-vis-roles');
  if (box) box.style.display = mode === 'roles' ? 'block' : 'none';
}

function annonceVisPreset(preset) {
  const mode = $('anc-vis-mode');
  if (mode) mode.value = 'roles';
  onAnnonceVisModeChange();
  document.querySelectorAll('.anc-role-cb').forEach(cb => { cb.checked = false; });
  const map = {
    gestion:    ['membre_cs', 'syndic', 'administrateur'],
    residents:  ['copropriétaire'],
    tous_roles: ['copropriétaire', 'membre_cs', 'syndic', 'administrateur'],
  };
  (map[preset] || []).forEach(r => {
    const cb = document.querySelector(`.anc-role-cb[value="${r}"]`);
    if (cb) cb.checked = true;
  });
}

// ── FILTRES UI ──────────────────────────────────────────────────────────────

function setAnnoncesTab(tab) {
  _annTab = tab;
  document.querySelectorAll('.ann2-tab').forEach(btn => {
    const t = btn.getAttribute('data-ann-tab');
    if (t) btn.classList.toggle('active', t === tab);
  });
  _renderAnnoncesList();
}

function setAnnoncesFilter(f) {
  _annFilter = f;
  document.querySelectorAll('.ann2-chip[data-ann-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ann-filter') === f);
  });
  _renderAnnoncesList();
}

function setAnnoncesSearch(val) {
  _annSearch = (val || '').trim().toLowerCase();
  clearTimeout(_annDebounce);
  _annDebounce = setTimeout(_renderAnnoncesList, 200);
}

function toggleAnnonceBody(id) {
  const wrap = $('ann-body-' + id);
  const btn  = wrap?.nextElementSibling;
  if (!wrap) return;
  const collapsed = wrap.classList.toggle('ann2-body-collapsed');
  if (btn?.classList.contains('ann2-toggle')) {
    btn.textContent = collapsed ? 'Lire la suite ↓' : 'Réduire ↑';
  }
}

function annonceContenuBlock(contenu, id) {
  if (!contenu) return '';
  const esc  = escHtml(contenu);
  const long = contenu.length > 240;
  return `<div class="${long ? 'ann2-body ann2-body-collapsed' : 'ann2-body'}" id="ann-body-${id}">
    <div class="ann2-body-inner">${esc}</div>
  </div>
  ${long ? `<button type="button" class="btn btn-ghost btn-sm ann2-toggle" onclick="toggleAnnonceBody('${id}')">Lire la suite ↓</button>` : ''}`;
}

// ── RENDER PAGE ─────────────────────────────────────────────────────────────

async function renderAnnonces() {
  _annTab    = 'publie';
  _annFilter = 'all';
  _annSearch = '';
  _annRawData = [];

  $('page').innerHTML = `
    <div class="ann2-page">
      <div class="ann2-head">
        <div class="ann2-head-text">
          <h1>Annonces</h1>
          <p>Fil d'infos officiel de la résidence.</p>
        </div>
        ${canManageAnnonces() ? `
          <button type="button" class="btn btn-primary" onclick="openNewAnnonce()">+ Nouvelle annonce</button>
        ` : ''}
      </div>

      ${canManageAnnonces() ? `
      <div class="ann2-tabs">
        <button type="button" class="ann2-tab active" data-ann-tab="publie"   onclick="setAnnoncesTab('publie')">Publiées</button>
        <button type="button" class="ann2-tab"        data-ann-tab="brouillon" onclick="setAnnoncesTab('brouillon')">Brouillons</button>
      </div>` : ''}

      <div class="ann2-toolbar">
        <div class="ann2-chips">
          <button type="button" class="ann2-chip active" data-ann-filter="all"       onclick="setAnnoncesFilter('all')">Toutes</button>
          <button type="button" class="ann2-chip"        data-ann-filter="epingle"   onclick="setAnnoncesFilter('epingle')">📌 Épinglées</button>
          <button type="button" class="ann2-chip"        data-ann-filter="urgent"    onclick="setAnnoncesFilter('urgent')">🚨 Urgentes</button>
          <button type="button" class="ann2-chip"        data-ann-filter="important" onclick="setAnnoncesFilter('important')">⚠️ Importantes</button>
          <button type="button" class="ann2-chip"        data-ann-filter="info"      onclick="setAnnoncesFilter('info')">ℹ️ Infos</button>
        </div>
        <div style="position:relative;">
          <input type="search" class="input ann2-search" id="ann-inline-search"
            placeholder="Filtrer par mot-clé…" value=""
            oninput="setAnnoncesSearch(this.value)">
        </div>
      </div>

      <div id="annonces-list"><div class="ann2-loading">Chargement…</div></div>
    </div>`;

  await _loadAnnoncesData();
}

// ── CHARGEMENT UNIQUE ────────────────────────────────────────────────────────

async function _loadAnnoncesData() {
  const { data, error } = await sb
    .from('annonces')
    .select('*, profiles(nom, prenom)')
    .order('epingle',     { ascending: false })
    .order('created_at',  { ascending: false });

  if (error) {
    console.warn('[annonces]', error.message);
    const el = $('annonces-list');
    if (el) el.innerHTML = emptyState('⚠️', 'Erreur de chargement', error.message);
    return;
  }

  _annRawData     = data || [];
  cache.annonces  = _annRawData;          // met à jour le cache global
  if (typeof updateBadges === 'function') updateBadges();
  _updateChipCounts();
  _renderAnnoncesList();
}

// ── FILTRAGE EN MÉMOIRE ──────────────────────────────────────────────────────

function _annoncesApplyFilters() {
  let out = _annRawData.filter(a => annonceReaderCanSee(a));

  // Onglet publiées / brouillons (gestionnaires seulement)
  if (canManageAnnonces()) {
    const isDraft = _annTab === 'brouillon';
    out = out.filter(a => {
      const draft = a.brouillon === true || a.brouillon === 'true';
      return isDraft ? draft : !draft;
    });
  }

  // Filtre chip
  if (_annFilter === 'epingle') {
    out = out.filter(a => a.epingle);
  } else if (_annFilter !== 'all') {
    out = out.filter(a => a.type === _annFilter);
  }

  // Recherche texte
  if (_annSearch) {
    const s = _annSearch;
    out = out.filter(a =>
      (a.titre   || '').toLowerCase().includes(s) ||
      (a.contenu || '').toLowerCase().includes(s)
    );
  }

  // Tri : épinglées d'abord, puis date desc
  out.sort((a, b) => {
    if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return out;
}

// Met à jour les compteurs sur les chips (sans re-fetch)
function _updateChipCounts() {
  const base = _annRawData.filter(a => annonceReaderCanSee(a) && !(a.brouillon === true || a.brouillon === 'true'));
  const counts = {
    all:       base.length,
    epingle:   base.filter(a => a.epingle).length,
    urgent:    base.filter(a => a.type === 'urgent').length,
    important: base.filter(a => a.type === 'important').length,
    info:      base.filter(a => a.type === 'info').length,
  };
  document.querySelectorAll('.ann2-chip[data-ann-filter]').forEach(btn => {
    const f   = btn.getAttribute('data-ann-filter');
    const cnt = counts[f] ?? 0;
    // Ajoute/met à jour un badge discret si > 0
    let badge = btn.querySelector('.ann-chip-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ann-chip-count';
      badge.style.cssText = 'font-size:10px;opacity:.6;margin-left:3px;';
      btn.appendChild(badge);
    }
    badge.textContent = cnt > 0 ? `(${cnt})` : '';
  });
}

// ── RENDER LISTE (100% mémoire) ──────────────────────────────────────────────

function _renderAnnoncesList() {
  const el = $('annonces-list');
  if (!el) return;

  const list = _annoncesApplyFilters();

  if (!list.length) {
    const isDraft  = _annTab === 'brouillon';
    const hasSearch = !!_annSearch;
    el.innerHTML = emptyState(
      '📢',
      hasSearch ? 'Aucun résultat' : isDraft ? 'Aucun brouillon' : 'Aucune annonce',
      hasSearch
        ? 'Essayez un autre mot-clé ou réinitialisez les filtres.'
        : isDraft
          ? 'Les brouillons enregistrés apparaîtront ici.'
          : 'Les annonces officielles de la résidence apparaîtront ici.',
      canManageAnnonces() && !isDraft
        ? '<button type="button" class="btn btn-primary btn-sm" onclick="openNewAnnonce()">+ Publier une annonce</button>'
        : ''
    );
    return;
  }

  el.innerHTML = list.map(a => _renderAnnonceCard(a)).join('');
}

function _renderAnnonceCard(a) {
  const t      = ANNONCE_TYPES[a.type] || ANNONCE_TYPES.info;
  const auteur = a.profiles ? displayName(a.profiles.prenom, a.profiles.nom, null, '—') : '—';
  const date   = new Date(a.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const vis    = annonceVisibilityLabel(a);

  return `<article class="ann2-card ann2-type-${a.type}${a.epingle ? ' ann2-epingle' : ''}${a.brouillon ? ' ann2-is-draft' : ''}">
    <div class="ann2-card-top">
      <div class="ann2-card-ico">${a.epingle ? '📌' : t.ico}</div>
      <div class="ann2-card-main">
        <div class="ann2-card-titre-row">
          <h2 class="ann2-card-titre">${escHtml(a.titre)}</h2>
          <span class="ann2-badge-type ${a.type}">${t.label}</span>
        </div>
        <div class="ann2-meta">
          <span>Par ${escHtml(auteur)}</span>
          <span class="ann2-meta-dot">·</span>
          <span>${date}</span>
          <span class="${vis.cls}">${vis.text}</span>
        </div>
      </div>
    </div>
    ${a.contenu ? annonceContenuBlock(a.contenu, a.id) : ''}
    ${canManageAnnonces() ? `
    <div class="ann2-actions no-print">
      <button type="button" class="btn btn-ghost btn-sm" onclick="toggleEpingle('${a.id}',${!a.epingle})">
        ${a.epingle ? '📌 Désépingler' : '📌 Épingler'}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" onclick="editAnnonce('${a.id}')">✏️ Modifier</button>
      <button type="button" class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteAnnonce('${a.id}')">🗑 Supprimer</button>
    </div>` : ''}
  </article>`;
}

// ── MODAL CRÉATION / ÉDITION ─────────────────────────────────────────────────

function openNewAnnonce(existing) {
  const isEdit   = !!existing;
  const mode     = existing?.visibility_mode || 'public';
  const roles    = normalizeAnnonceRoles(existing?.visibility_roles);

  const roleChecks = ['copropriétaire', 'membre_cs', 'syndic', 'administrateur'].map(r =>
    `<label class="ann2-role-label">
      <input type="checkbox" class="anc-role-cb" value="${r}" ${roles.includes(r) ? 'checked' : ''}>
      <span>${ROLE_LABELS[r] || r}</span>
    </label>`
  ).join('');

  // Sécurisation complète du contenu existant pour le textarea
  const safeTitre   = (existing?.titre   || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const safeContenu = (existing?.contenu || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const html = `
    <div class="fg">
      <label class="label">Titre *</label>
      <input type="text" id="anc-titre" class="input"
        placeholder="Ex: Travaux ascenseur Tour 17" value="${safeTitre}">
    </div>

    <div class="fg-row">
      <div class="fg" style="margin:0;flex:1;">
        <label class="label">Type</label>
        <select id="anc-type" class="select" style="width:100%;">
          ${Object.entries(ANNONCE_TYPES).map(([k,v]) =>
            `<option value="${k}" ${existing?.type === k ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>
      ${canManageAnnonces() ? `
      <div class="fg" style="margin:0;flex:1;">
        <label class="label">Visibilité</label>
        <select id="anc-vis-mode" class="select" style="width:100%;" onchange="onAnnonceVisModeChange()">
          <option value="public" ${mode === 'public' ? 'selected' : ''}>👥 Tous les résidents</option>
          <option value="roles"  ${mode === 'roles'  ? 'selected' : ''}>🔒 Rôles spécifiques…</option>
        </select>
      </div>` : ''}
    </div>

    ${canManageAnnonces() ? `
    <div class="fg ann2-vis-box" id="anc-vis-roles"
      style="display:${mode === 'roles' ? 'block' : 'none'};
             background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;">
      <label class="label">Rôles autorisés à lire</label>
      <div class="ann2-role-grid">${roleChecks}</div>
      <div class="ann2-presets" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);">
        <span class="ann2-presets-label" style="font-size:11px;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Préréglages :</span>
        <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('tous_roles')">Tous les rôles</button>
        <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('gestion')">Gestion seulement</button>
        <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('residents')">Résidents seulement</button>
      </div>
    </div>` : ''}

    <div class="fg">
      <label class="label">Contenu</label>
      <textarea id="anc-contenu" class="textarea" rows="6"
        placeholder="Détails, dates, consignes…">${safeContenu}</textarea>
    </div>

    <div class="fg" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;">
      <label class="ann2-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
        <input type="checkbox" id="anc-epingle" ${existing?.epingle ? 'checked' : ''}>
        <span>📌 Épingler en tête de liste</span>
      </label>
      ${canManageAnnonces() ? `
      <label class="ann2-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
        <input type="checkbox" id="anc-brouillon" ${existing?.brouillon ? 'checked' : ''}>
        <span>📝 Brouillon (invisible résidents)</span>
      </label>` : ''}
    </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-annonce';
  overlay.innerHTML = `
    <div class="modal ann2-modal" style="max-width:560px;">
      <div class="mh">
        <span class="mh-title">${isEdit ? "Modifier l'annonce" : 'Nouvelle annonce'}</span>
        <button type="button" class="mclose" onclick="document.getElementById('modal-annonce')?.remove()">×</button>
      </div>
      <div class="mb">${html}</div>
      <div class="mf">
        <button type="button" class="btn btn-secondary"
          onclick="document.getElementById('modal-annonce')?.remove()">Annuler</button>
        <button type="button" class="btn btn-primary"
          onclick="saveAnnonce('${existing?.id || ''}')">
          ${isEdit ? 'Enregistrer' : 'Publier'}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  onAnnonceVisModeChange();
}

// ── SAUVEGARDE ───────────────────────────────────────────────────────────────

async function saveAnnonce(id) {
  const titre = $('anc-titre')?.value.trim();
  if (!titre) { toast('Titre requis', 'err'); return; }

  const type    = $('anc-type')?.value || 'info';
  const visMode = canManageAnnonces() ? ($('anc-vis-mode')?.value || 'public') : 'public';

  let visRoles = [];
  if (visMode === 'roles') {
    visRoles = [...document.querySelectorAll('.anc-role-cb:checked')].map(cb => cb.value);
    if (!visRoles.length) {
      toast('Choisis au moins un rôle pour une annonce restreinte.', 'warn');
      return;
    }
  }

  const isBrouillon = canManageAnnonces() ? ($('anc-brouillon')?.checked || false) : false;

  const payload = {
    titre,
    type,
    contenu:          $('anc-contenu')?.value.trim() || null,
    epingle:          $('anc-epingle')?.checked || false,
    auteur_id:        user.id,
    visibility_mode:  visMode,
    visibility_roles: visRoles,
    visible_pour:     annonceVisiblePourFromForm(visMode, visRoles),
    brouillon:        isBrouillon,
  };

  const btn = document.querySelector('#modal-annonce .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  let error, data;
  if (id) {
    ({ error, data } = await sb.from('annonces').update(payload).eq('id', id).select().single());
  } else {
    ({ error, data } = await sb.from('annonces').insert(payload).select().single());
  }

  if (btn) { btn.disabled = false; btn.textContent = id ? 'Enregistrer' : 'Publier'; }

  if (error) {
    console.warn('[annonces save]', error);
    if (error.message?.includes('visibility_mode') || error.message?.includes('column')) {
      toast('⚠️ Colonnes manquantes en BDD — exécutez migration_annonces.sql dans Supabase.', 'err');
    } else {
      toast('Erreur sauvegarde : ' + error.message, 'err');
    }
    return;
  }

  document.getElementById('modal-annonce')?.remove();
  toast(id ? 'Annonce modifiée ✓' : 'Annonce publiée ✓', 'ok');

  // Recharge les données et re-render
  await _loadAnnoncesData();

  // Notifications uniquement pour les nouvelles annonces publiées
  if (!id && data && !isBrouillon) {
    await _notifierNouvelleAnnonce(data, type, titre, visMode, visRoles, payload.contenu);
  }
}

// ── NOTIFICATIONS (factorisée) ───────────────────────────────────────────────

async function _notifierNouvelleAnnonce(row, type, titre, visMode, visRoles, contenu) {
  if (!row?.id) return;

  // Construit la liste des rôles cibles
  const annMeta    = { visibility_mode: visMode, visibility_roles: visRoles, brouillon: false };
  const targetRoles = new Set(annonceTargetRoles(annMeta));

  // Charge tous les utilisateurs actifs en une seule requête
  const { data: allUsers } = await sb
    .from('profiles')
    .select('id, email, role')
    .eq('actif', true);

  const destinataires = (allUsers || []).filter(u =>
    u.id !== user.id && targetRoles.has(u.role)
  );

  if (!destinataires.length) return;

  const subjects = {
    urgent:    `🚨 Annonce urgente : ${titre}`,
    important: `⚠️ Annonce importante : ${titre}`,
    info:      `📢 Nouvelle annonce : ${titre}`,
  };

  // Notifs in-app
  const notifs = destinataires.map(u => ({
    destinataire_id:    u.id,
    destinataire_email: u.email || '',
    sujet:              subjects[type] || subjects.info,
    corps:              contenu || '',
    type:               type === 'urgent' ? 'urgent' : 'statut_change',
    reference_id:       row.id,
    lu:                 false,
  }));

  const { error: notifErr } = await sb.from('notifications').insert(notifs);
  if (notifErr) console.warn('[annonces notif]', notifErr.message);

  // Emails — pour urgent et important
  if (type === 'urgent' || type === 'important') {
    const emails = destinataires.map(u => u.email).filter(Boolean);
    if (emails.length) {
      await sendEmailDirect('nouvelle_annonce', emails, { titre, type, contenu });
    }
  }

  // Push local si urgent
  if (type === 'urgent') {
    await pushNotif('🚨 Annonce urgente', titre, 'critique', null);
  }
}

// ── ACTIONS RAPIDES ──────────────────────────────────────────────────────────

async function editAnnonce(annonceId) {
  const { data } = await sb.from('annonces').select('*').eq('id', annonceId).single();
  if (data) openNewAnnonce(data);
}

async function toggleEpingle(annonceId, val) {
  const { error } = await sb.from('annonces').update({ epingle: val }).eq('id', annonceId);
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  // Mise à jour locale sans re-fetch
  const idx = _annRawData.findIndex(a => a.id === annonceId);
  if (idx !== -1) _annRawData[idx].epingle = val;
  _renderAnnoncesList();
  toast(val ? '📌 Épinglée' : 'Désépinglée', 'ok');
}

async function deleteAnnonce(annonceId) {
  if (!confirm('Supprimer cette annonce ?')) return;
  const { error } = await sb.from('annonces').delete().eq('id', annonceId);
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  // Retire du cache local sans re-fetch
  _annRawData = _annRawData.filter(a => a.id !== annonceId);
  cache.annonces = _annRawData;
  _updateChipCounts();
  _renderAnnoncesList();
  toast('Annonce supprimée', 'ok');
}

// ── AGENDA ──
