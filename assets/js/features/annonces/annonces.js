// ════════════════════════════════════════════════════════════════
//  ANNONCES FEATURE (Native Dark Mode Support)
//  assets/js/features/annonces/annonces.js
// ════════════════════════════════════════════════════════════════

const ANNONCE_TYPES = {
  urgent:    { label:'URGENT',    color:'var(--red)',     bg:'var(--red-light)',     border:'var(--red-border)' },
  important: { label:'IMPORTANT', color:'var(--orange)',  bg:'var(--orange-light)',  border:'var(--orange-border)' },
  info:      { label:'INFO',      color:'var(--accent)',  bg:'var(--accent-light)',  border:'var(--accent-hover)' }, // Utilisation de var(--accent)
};

const ROLE_LABELS = {
  copropriétaire: 'Résidents',
  membre_cs:      'Conseil Syndical',
  syndic:         'Syndic',
  administrateur: 'Administrateurs',
};

let _annTab        = 'publie'; // publie | brouillon | archive
let _annFilter     = 'all';
let _annSearch     = '';
let _annRawData    = [];      
let _annDebounce   = null;    

// ── CSS STRICTEMENT LIÉ AUX VARIABLES GLOBALES ────────────────────────────────
(function injectAnnoncesCSS() {
  if (document.getElementById('saas-annonces-css')) return;
  const s = document.createElement('style');
  s.id = 'saas-annonces-css';
  s.textContent = `
    .anc-container { padding: 32px 24px; max-width: 900px; margin: 0 auto; animation: pageIn 0.3s ease; }
    
    .anc-page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .anc-page-title { font-family: var(--font-head); font-size: 32px; font-weight: 800; letter-spacing: -1px; color: var(--text); margin: 0 0 8px 0; }
    .anc-page-sub { font-size: 14px; color: var(--text-2); font-weight: 500; margin: 0; }
    
    /* Tabs */
    .anc-tabs { display: flex; gap: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; }
    .anc-tabs::-webkit-scrollbar { display: none; }
    .anc-tab { padding: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-3); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; margin-bottom: -1px; white-space: nowrap; }
    .anc-tab:hover { color: var(--text); }
    .anc-tab.active { color: var(--text); border-bottom-color: var(--text); }
    
    /* Toolbar & Chips */
    .anc-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }
    .anc-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    
    /* Chips parfaits pour Dark Mode */
    .anc-chip { padding: 8px 16px; font-size: 12.5px; font-weight: 700; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow); }
    .anc-chip:hover { border-color: var(--border-strong); background: var(--surface); color: var(--text); }
    .anc-chip.active { background: var(--text); color: var(--surface); border-color: var(--text); }
    
    /* Recherche */
    .anc-search-wrap { position: relative; min-width: 280px; flex: 1; max-width: 400px; }
    .anc-search-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-3); }
    .anc-search { width: 100%; border: 1px solid var(--border); background: var(--surface); padding: 10px 16px 10px 40px; border-radius: 12px; font-size: 13.5px; color: var(--text); transition: all 0.2s; outline: none; }
    .anc-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
    .anc-search::placeholder { color: var(--text-3); }
    
    /* Cards */
    .anc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 24px; box-shadow: var(--shadow); transition: border-color 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
    .anc-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
    .anc-card.pinned { border-color: var(--orange); }
    .anc-card.pinned::after { content: ''; position: absolute; top: 0; right: 0; border-width: 0 40px 40px 0; border-style: solid; border-color: transparent var(--orange-light) transparent transparent; pointer-events: none; }
    .anc-card.pinned::before { content: '📌'; position: absolute; top: 6px; right: 8px; font-size: 12px; z-index: 1; pointer-events: none; }
    .anc-card.archived { opacity: 0.7; filter: grayscale(50%); border-style: dashed; }
    
    .anc-header { padding: 20px 24px; display: flex; gap: 16px; align-items: flex-start; border-bottom: 1px solid var(--border); }
    .anc-av { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white; flex-shrink: 0; }
    
    .anc-title { font-family: var(--font-head); font-size: 18px; font-weight: 800; color: var(--text); margin: 0 0 8px 0; line-height: 1.3; word-break: break-word; }
    .anc-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-3); font-weight: 600; flex-wrap: wrap; }
    
    .anc-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 20px; border: 1px solid currentColor; background: currentColor; }
    
    .anc-body { padding: 20px 24px; font-size: 14.5px; line-height: 1.6; color: var(--text-2); }
    .anc-body-content { max-height: 150px; overflow: hidden; position: relative; transition: max-height 0.3s ease; }
    .anc-body-content.expanded { max-height: 3000px; }
    .anc-fade { position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(to bottom, transparent, var(--surface)); pointer-events: none; }
    .anc-body-content.expanded .anc-fade { display: none; }
    
    .anc-footer { padding: 12px 24px; background: var(--surface-2); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
    
    /* Rich Text Render */
    .rt-content h3 { font-size: 16px; font-weight: 800; color: var(--text); margin: 16px 0 8px; }
    .rt-content h4 { font-size: 14px; font-weight: 800; color: var(--text); margin: 14px 0 6px; }
    .rt-content p { margin: 0 0 12px 0; }
    .rt-content ul { margin: 0 0 12px 20px; padding: 0; }
    .rt-content li { margin-bottom: 6px; }
    .rt-content strong { color: var(--text); font-weight: 800; }
    
    /* Toolbar Modal */
    .md-toolbar { display: flex; gap: 4px; padding: 8px; background: var(--surface-2); border: 1px solid var(--border); border-bottom: none; border-radius: 12px 12px 0 0; overflow-x: auto; }
    .md-btn { background: transparent; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; color: var(--text-2); font-size: 13px; font-weight: 700; transition: all 0.15s; white-space: nowrap; }
    .md-btn:hover { background: var(--bg); color: var(--text); box-shadow: var(--shadow); }

    /* === RESPONSIVE MOBILE === */
    @media (max-width: 768px) {
      .anc-container { padding: 20px 16px; }
      .anc-page-header { flex-direction: column; align-items: stretch; gap: 16px; }
      
      .anc-search-wrap { width: 100%; max-width: 100%; }
      .anc-header { padding: 16px; flex-direction: column; gap: 12px; }
      .anc-body { padding: 16px; }
      
      /* Grille 2x2 pour les boutons du footer sur mobile */
      .anc-footer { padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .anc-footer .btn { width: 100%; justify-content: center; font-size: 12.5px; padding: 8px; margin: 0; }
    }
  `;
  document.head.appendChild(s);
})();

// ── FILTRES UI ──────────────────────────────────────────────────────────────

function setAnnoncesTab(tab) {
  _annTab = tab;
  _annSearch = ''; 
  const searchInput = $('ann-inline-search');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.anc-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ann-tab') === tab);
  });
  _renderAnnoncesList();
}

function setAnnoncesFilter(f) {
  _annFilter = f;
  document.querySelectorAll('.anc-chip[data-ann-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ann-filter') === f);
  });
  _renderAnnoncesList();
}

function setAnnoncesSearch(val) {
  _annSearch = (val || '').trim().toLowerCase();
  
  // Désactive visuellement les onglets en mode recherche globale
  document.querySelectorAll('.anc-tab').forEach(btn => {
    btn.style.opacity = _annSearch.length > 0 ? '0.4' : '1';
  });

  clearTimeout(_annDebounce);
  _annDebounce = setTimeout(_renderAnnoncesList, 250);
}

function toggleAnnonceBody(id) {
  const content = $('ann-content-' + id);
  const btn = $('ann-btn-' + id);
  if (!content) return;
  const isExpanded = content.classList.toggle('expanded');
  if (btn) btn.innerHTML = isExpanded ? 'Réduire l\'annonce ↑' : 'Lire la suite ↓';
}

// ── FORMATAGE TEXTE RICHE & DATES ───────────────────────────────────────────

function formatRichText(text) {
  if (!text) return '';
  let html = escHtml(text);
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\n<ul>/g, '\n'); 
  html = html.replace(/\n/g, '<br>');
  return html;
}

function insertMD(prefix, suffix) {
  const ta = $('anc-contenu');
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selectedText = text.substring(start, end);
  ta.value = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
  ta.focus();
  if (!selectedText) ta.selectionEnd = start + prefix.length;
}

function _formatAnnonceDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0 && now.getDate() === d.getDate()) return "Aujourd'hui à " + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
  if (diffDays === 1 || (diffDays === 0 && now.getDate() !== d.getDate())) return "Hier";
  if (diffDays > 1 && diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
}

// ── RENDER PAGE ─────────────────────────────────────────────────────────────

async function renderAnnonces() {
  _annTab    = 'publie';
  _annFilter = 'all';
  _annSearch = '';
  _annRawData = [];

  const isManagerUser = typeof canManageAnnonces === 'function' ? canManageAnnonces() : false;

  $('page').innerHTML = `
    <div class="anc-container">
      
      <div class="anc-page-header">
        <div>
          <h1 class="anc-page-title">Panneau d'affichage</h1>
          <p class="anc-page-sub">Informations et communications officielles de la résidence.</p>
        </div>
        ${isManagerUser ? `
          <button type="button" class="btn btn-primary" style="font-weight:800; padding:10px 20px;" onclick="openNewAnnonce()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Rédiger une annonce
          </button>
        ` : ''}
      </div>

      ${isManagerUser ? `
      <div class="anc-tabs">
        <button type="button" class="anc-tab active" data-ann-tab="publie" onclick="setAnnoncesTab('publie')">Publiées</button>
        <button type="button" class="anc-tab" data-ann-tab="brouillon" onclick="setAnnoncesTab('brouillon')">Brouillons</button>
        <button type="button" class="anc-tab" data-ann-tab="archive" onclick="setAnnoncesTab('archive')">Archives</button>
      </div>` : ''}

      <div class="anc-toolbar">
        <div class="anc-chips">
          <button type="button" class="anc-chip active" data-ann-filter="all" onclick="setAnnoncesFilter('all')">Toutes</button>
          <button type="button" class="anc-chip" data-ann-filter="epingle" onclick="setAnnoncesFilter('epingle')">📌 Épinglées</button>
          <button type="button" class="anc-chip" data-ann-filter="urgent" onclick="setAnnoncesFilter('urgent')">🚨 Urgentes</button>
          <button type="button" class="anc-chip" data-ann-filter="important" onclick="setAnnoncesFilter('important')">⚠️ Importantes</button>
          <button type="button" class="anc-chip" data-ann-filter="info" onclick="setAnnoncesFilter('info')">ℹ️ Infos</button>
        </div>
        <div class="anc-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="search" class="anc-search" id="ann-inline-search" placeholder="Rechercher partout..." oninput="setAnnoncesSearch(this.value)">
        </div>
      </div>

      <div id="annonces-list">
        <div style="padding:60px; text-align:center;"><div class="spinner"></div></div>
      </div>
    </div>`;

  await _loadAnnoncesData();
}

// ── CHARGEMENT & FILTRES ────────────────────────────────────────────────────

async function _loadAnnoncesData() {
  try {
    const { data, error } = await sb
      .from('annonces')
      .select('*, profiles(nom, prenom)')
      .order('epingle',  { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    _annRawData     = data || [];
    cache.annonces  = _annRawData;
    if (typeof updateBadges === 'function') updateBadges();
    _updateChipCounts();
    _renderAnnoncesList();
  } catch (error) {
    console.error('[annonces]', error.message);
    $('annonces-list').innerHTML = `<div style="padding:40px; text-align:center; color:var(--red); font-weight:700;">Impossible de charger les annonces.</div>`;
  }
}

function _annoncesApplyFilters() {
  const isManagerUser = typeof canManageAnnonces === 'function' ? canManageAnnonces() : false;
  
  let out = _annRawData.filter(a => typeof annonceReaderCanSee === 'function' ? annonceReaderCanSee(a) : true);

  // RECHERCHE GLOBALE : Cherche dans Publiées + Archives
  if (_annSearch) {
    const s = _annSearch;
    out = out.filter(a => 
      ((a.titre||'').toLowerCase().includes(s) || (a.contenu||'').toLowerCase().includes(s)) &&
      (isManagerUser || !a.brouillon) // Résident n'a pas accès aux brouillons
    );
  } else {
    // FILTRES D'ONGLETS NORMAUX
    if (isManagerUser) {
      if (_annTab === 'brouillon') {
        out = out.filter(a => a.brouillon === true);
      } else if (_annTab === 'archive') {
        out = out.filter(a => a.archive === true);
      } else {
        out = out.filter(a => !a.brouillon && !a.archive);
      }
    } else {
      out = out.filter(a => !a.brouillon && !a.archive);
    }
  }

  // Filtres par Tags (Urgent, etc.)
  if (_annFilter === 'epingle') out = out.filter(a => a.epingle);
  else if (_annFilter !== 'all') out = out.filter(a => a.type === _annFilter);

  // Tri
  out.sort((a, b) => {
    if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return out;
}

function _updateChipCounts() {
  const base = _annRawData.filter(a => (typeof annonceReaderCanSee === 'function' ? annonceReaderCanSee(a) : true) && !a.brouillon && !a.archive);
  const counts = {
    all:       base.length,
    epingle:   base.filter(a => a.epingle).length,
    urgent:    base.filter(a => a.type === 'urgent').length,
    important: base.filter(a => a.type === 'important').length,
    info:      base.filter(a => a.type === 'info').length,
  };
  
  document.querySelectorAll('.anc-chip[data-ann-filter]').forEach(btn => {
    const f = btn.getAttribute('data-ann-filter');
    const cnt = counts[f] ?? 0;
    let badge = btn.querySelector('.ann-chip-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ann-chip-count';
      badge.style.cssText = 'margin-left:6px; opacity:0.6;';
      btn.appendChild(badge);
    }
    badge.textContent = cnt > 0 ? cnt : '';
  });
}

// ── RENDER LISTE ────────────────────────────────────────────────────────────

function _renderAnnoncesList() {
  const el = $('annonces-list');
  if (!el) return;

  const list = _annoncesApplyFilters();
  const isManagerUser = typeof canManageAnnonces === 'function' ? canManageAnnonces() : false;

  if (!list.length) {
    const msgMap = {
      publie: "Aucune annonce officielle publiée pour le moment.",
      brouillon: "Vous n'avez aucun brouillon en attente.",
      archive: "Les archives sont vides."
    };
    el.innerHTML = `
      <div style="padding:60px 20px; text-align:center; background:var(--surface); border:1px dashed var(--border); border-radius:16px;">
        <div style="font-size:40px; margin-bottom:16px; opacity:0.5;">📭</div>
        <div style="font-size:16px; font-weight:800; color:var(--text); margin-bottom:8px;">${_annSearch ? 'Aucun résultat trouvé' : 'Rien à afficher'}</div>
        <div style="font-size:14px; color:var(--text-2); max-width:300px; margin:0 auto;">${_annSearch ? 'Votre recherche n\'a donné aucun résultat, même dans les archives.' : msgMap[_annTab] || ''}</div>
      </div>`;
    return;
  }

  el.innerHTML = list.map(a => {
    const t = ANNONCE_TYPES[a.type] || ANNONCE_TYPES.info;
    const auteur = a.profiles ? (a.profiles.prenom || a.profiles.nom || 'Le Syndic') : 'Le Syndic';
    const dateStr = _formatAnnonceDate(a.created_at);
    
    let visText = 'Public';
    if (a.visibility_mode === 'roles') {
      visText = (a.visibility_roles || []).map(r => ROLE_LABELS[r] || r).join(', ');
    }

    let h = 0; for (let i = 0; i < auteur.length; i++) h = auteur.charCodeAt(i) + ((h << 5) - h);
    const colors = ['#2563eb','#7c3aed','#ea580c','#16a34a','#0891b2'];
    const avColor = colors[Math.abs(h) % colors.length];

    const htmlContent = formatRichText(a.contenu);
    const isLong = (a.contenu || '').length > 250 || (a.contenu?.match(/\n/g) || []).length > 4;

    return `
    <article class="anc-card ${a.epingle ? 'pinned' : ''} ${a.archive ? 'archived' : ''}">
      <div class="anc-header">
        <div class="anc-av" style="background:${avColor};">${auteur.charAt(0).toUpperCase()}</div>
        <div style="flex:1; min-width:0;">
          <h2 class="anc-title">${escHtml(a.titre)}</h2>
          <div class="anc-meta">
            <span class="anc-badge" style="color:${t.color}; background:${t.bg}; border-color:${t.border};">${t.label}</span>
            <span style="color:var(--border-strong);">·</span>
            <span>${escHtml(auteur)}</span>
            <span style="color:var(--border-strong);">·</span>
            <span>${dateStr}</span>
            ${isManagerUser && a.visibility_mode === 'roles' ? `<span style="color:var(--text-3); font-weight:700;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Restreint (${visText})</span>` : ''}
            ${_annSearch && a.archive ? `<span class="anc-badge" style="color:var(--text-3); border-color:var(--text-3); background:var(--surface-2);">ARCHIVÉE</span>` : ''}
          </div>
        </div>
      </div>
      
      ${a.contenu ? `
        <div class="anc-body rt-content">
          <div id="ann-content-${a.id}" class="anc-body-content">
            ${htmlContent}
            ${isLong ? `<div class="anc-fade"></div>` : ''}
          </div>
          ${isLong ? `<button id="ann-btn-${a.id}" class="btn btn-ghost btn-sm" style="margin-top:12px; padding:0; color:var(--text); font-weight:800;" onclick="toggleAnnonceBody('${a.id}')">Lire la suite ↓</button>` : ''}
        </div>
      ` : ''}

      ${isManagerUser ? `
        <div class="anc-footer">
          ${!a.archive ? `
            <button class="btn btn-ghost btn-sm" onclick="toggleEpingle('${a.id}', ${!a.epingle})">${a.epingle ? 'Désépingler' : '📌 Épingler'}</button>
            <button class="btn btn-ghost btn-sm" onclick="editAnnonce('${a.id}')">✏️ Modifier</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--orange);" onclick="toggleArchive('${a.id}', true)">📦 Archiver</button>
          ` : `
            <button class="btn btn-ghost btn-sm" onclick="toggleArchive('${a.id}', false)">↩️ Désarchiver</button>
          `}
          <button class="btn btn-danger btn-sm" onclick="deleteAnnonce('${a.id}')">🗑 Supprimer</button>
        </div>
      ` : ''}
    </article>`;
  }).join('');
}

// ── MODAL CRÉATION / ÉDITION ─────────────────────────────────────────────────

function onAnnonceVisModeChange() {
  const mode = $('anc-vis-mode')?.value;
  const box  = $('anc-vis-roles');
  if (box) box.style.display = mode === 'roles' ? 'block' : 'none';
}

function annonceVisPreset(preset) {
  $('anc-vis-mode').value = 'roles';
  onAnnonceVisModeChange();
  document.querySelectorAll('.anc-role-cb').forEach(cb => cb.checked = false);
  const map = { gestion: ['membre_cs', 'syndic', 'administrateur'], residents: ['copropriétaire'] };
  (map[preset] || []).forEach(r => {
    const cb = document.querySelector(`.anc-role-cb[value="${r}"]`);
    if (cb) cb.checked = true;
  });
}

function openNewAnnonce(existing) {
  const isEdit  = !!existing;
  const mode    = existing?.visibility_mode || 'public';
  const roles   = existing?.visibility_roles || [];
  
  const roleChecks = ['copropriétaire', 'membre_cs', 'syndic', 'administrateur'].map(r =>
    `<label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; cursor:pointer;">
      <input type="checkbox" class="anc-role-cb" value="${r}" ${roles.includes(r) ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--accent);">
      <span>${ROLE_LABELS[r] || r}</span>
    </label>`
  ).join('');

  const safeTitre   = (existing?.titre   || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const safeContenu = (existing?.contenu || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const html = `
    <div class="fg">
      <label class="label">Titre de l'annonce *</label>
      <input type="text" id="anc-titre" class="input" placeholder="Ex: Nettoyage annuel des parkings" value="${safeTitre}" style="font-size:15px; font-weight:700;">
    </div>

    <div class="fg-row">
      <div class="fg" style="margin:0;flex:1;">
        <label class="label">Catégorie</label>
        <select id="anc-type" class="select" style="width:100%;">
          ${Object.entries(ANNONCE_TYPES).map(([k,v]) => `<option value="${k}" ${existing?.type === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
      </div>
      <div class="fg" style="margin:0;flex:1;">
        <label class="label">Visibilité</label>
        <select id="anc-vis-mode" class="select" style="width:100%;" onchange="onAnnonceVisModeChange()">
          <option value="public" ${mode === 'public' ? 'selected' : ''}>👥 Toute la résidence</option>
          <option value="roles"  ${mode === 'roles'  ? 'selected' : ''}>🔒 Rôles spécifiques…</option>
        </select>
      </div>
    </div>

    <div class="fg" id="anc-vis-roles" style="display:${mode === 'roles' ? 'block' : 'none'}; background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:16px;">
      <label class="label">Accès restreint aux rôles suivants :</label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">${roleChecks}</div>
      <div style="display:flex; gap:8px; border-top:1px solid var(--border); padding-top:12px;">
        <button type="button" class="btn btn-ghost btn-xs" style="background:var(--surface);" onclick="annonceVisPreset('gestion')">Équipe Gestion</button>
        <button type="button" class="btn btn-ghost btn-xs" style="background:var(--surface);" onclick="annonceVisPreset('residents')">Résidents seuls</button>
      </div>
    </div>

    <div class="fg">
      <label class="label">Contenu du message</label>
      <div class="md-toolbar">
        <button type="button" class="md-btn" onclick="insertMD('**', '**')" title="Gras">B</button>
        <button type="button" class="md-btn" onclick="insertMD('*', '*')" title="Italique">I</button>
        <button type="button" class="md-btn" onclick="insertMD('### ', '')" title="Titre">T</button>
        <div style="width:1px; background:var(--border); margin:0 4px;"></div>
        <button type="button" class="md-btn" onclick="insertMD('- ', '')" title="Liste">● Liste</button>
      </div>
      <textarea id="anc-contenu" class="input" rows="8" placeholder="Détails, dates, consignes..." style="border-radius:0 0 10px 10px; border-top:none; resize:vertical; font-family:inherit;">${safeContenu}</textarea>
    </div>

    <div class="fg" style="background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border); display:flex; flex-direction:column; gap:12px;">
      <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13.5px; font-weight:600; color:var(--text);">
        <input type="checkbox" id="anc-epingle" ${existing?.epingle ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--orange);">
        <span>📌 Épingler en haut du fil d'actualité</span>
      </label>
      <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13.5px; font-weight:600; color:var(--text);">
        <input type="checkbox" id="anc-brouillon" ${existing?.brouillon ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--accent);">
        <span>📝 Enregistrer comme brouillon (Invisible pour les résidents)</span>
      </label>
    </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-annonce';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="mh">
        <span class="mh-title">${isEdit ? "Modifier l'annonce" : 'Créer une annonce'}</span>
        <button type="button" class="mclose" onclick="document.getElementById('modal-annonce')?.remove()">×</button>
      </div>
      <div class="mb">${html}</div>
      <div class="mf">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-annonce')?.remove()">Annuler</button>
        <button type="button" class="btn btn-primary" onclick="saveAnnonce('${existing?.id || ''}')">
          ${isEdit ? 'Enregistrer' : 'Publier'}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  onAnnonceVisModeChange();
}

// ── ACTIONS (SAUVEGARDE, ARCHIVAGE, SUPPRESSION) ─────────────────────────────

async function saveAnnonce(id) {
  const titre = $('anc-titre')?.value.trim();
  if (!titre) { toast('Le titre est requis', 'err'); return; }

  const type    = $('anc-type')?.value || 'info';
  const visMode = $('anc-vis-mode')?.value || 'public';
  let visRoles = [];
  
  if (visMode === 'roles') {
    visRoles = [...document.querySelectorAll('.anc-role-cb:checked')].map(cb => cb.value);
    if (!visRoles.length) { toast('Choisissez au moins un rôle.', 'warn'); return; }
  }

  const isBrouillon = $('anc-brouillon')?.checked || false;

  const payload = {
    titre,
    type,
    contenu:          $('anc-contenu')?.value.trim() || null,
    epingle:          $('anc-epingle')?.checked || false,
    auteur_id:        user.id,
    visibility_mode:  visMode,
    visibility_roles: visRoles,
    visible_pour:     typeof annonceVisiblePourFromForm === 'function' ? annonceVisiblePourFromForm(visMode, visRoles) : 'all',
    brouillon:        isBrouillon,
  };

  const btn = document.querySelector('#modal-annonce .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

  try {
    let error, data;
    if (id) {
      ({ error, data } = await sb.from('annonces').update(payload).eq('id', id).select().single());
    } else {
      ({ error, data } = await sb.from('annonces').insert(payload).select().single());
    }

    if (error) throw error;

    document.getElementById('modal-annonce')?.remove();
    toast(id ? 'Annonce mise à jour' : 'Annonce publiée', 'ok');

    await _loadAnnoncesData();

    if (!id && data && !isBrouillon && typeof _notifierNouvelleAnnonce === 'function') {
      await _notifierNouvelleAnnonce(data, type, titre, visMode, visRoles, payload.contenu);
    }
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = id ? 'Mettre à jour' : 'Publier'; }
    toast('Erreur lors de la sauvegarde.', 'err');
  }
}

async function editAnnonce(annonceId) {
  try {
    const { data, error } = await sb.from('annonces').select('*').eq('id', annonceId).single();
    if (error) throw error;
    if (data) openNewAnnonce(data);
  } catch (err) { toast('Erreur d\'ouverture', 'err'); }
}

async function toggleEpingle(annonceId, val) {
  try {
    const { error } = await sb.from('annonces').update({ epingle: val }).eq('id', annonceId);
    if (error) throw error;
    const idx = _annRawData.findIndex(a => a.id === annonceId);
    if (idx !== -1) _annRawData[idx].epingle = val;
    _renderAnnoncesList();
  } catch (err) { toast('Erreur', 'err'); }
}

async function toggleArchive(annonceId, isArchived) {
  try {
    const { error } = await sb.from('annonces').update({ archive: isArchived, epingle: false }).eq('id', annonceId);
    
    if (error) {
       toast('⚠️ L\'archivage a échoué. Exécutez le script SQL pour ajouter la colonne "archive".', 'err');
       return;
    }

    const idx = _annRawData.findIndex(a => a.id === annonceId);
    if (idx !== -1) {
      _annRawData[idx].archive = isArchived;
      _annRawData[idx].epingle = false;
    }
    
    _renderAnnoncesList();
    toast(isArchived ? '📦 Annonce archivée' : '↩️ Annonce restaurée', 'ok');
  } catch (err) {
    console.error(err);
  }
}

async function deleteAnnonce(annonceId) {
  if (!confirm('Supprimer définitivement cette annonce ? Cette action est irréversible.')) return;
  try {
    const { error } = await sb.from('annonces').delete().eq('id', annonceId);
    if (error) throw error;
    _annRawData = _annRawData.filter(a => a.id !== annonceId);
    cache.annonces = _annRawData;
    _updateChipCounts();
    _renderAnnoncesList();
    toast('Annonce supprimée', 'ok');
  } catch (err) { toast('Erreur de suppression', 'err'); }
}
