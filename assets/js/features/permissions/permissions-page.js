// ════════════════════════════════════════════════════════════════
//  PAGE ADMIN : GESTION DES PERMISSIONS GRANULAIRES (V3)
//  assets/js/features/permissions/permissions-page.js
// ════════════════════════════════════════════════════════════════

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire'];

const PERM_ROLE_LABELS = {
  syndic:           'Syndic (Externe)',
  membre_cs:        'Conseil Syndical',
  'copropriétaire': 'Résident / Copro',
};

const PERM_ROLE_META = {
  syndic:           { icon: '🏢', desc: 'Gestionnaire professionnel externe' },
  membre_cs:        { icon: '🤝', desc: 'Membre élu du conseil syndical'     },
  'copropriétaire': { icon: '🏠', desc: 'Résident ou propriétaire'           },
};

const PERM_MODULE_LABELS = {
  dashboard:   'Tableau de bord',
  tickets:     'Signalements',
  map:         'Carte & Plan',
  messages:    'Messagerie',
  annonces:    'Annonces',
  agenda:      'Agenda',
  contacts:    'Contacts',
  faq:         'FAQ',
  documents:   'Documents',
  votes:       'Votes / AG',
  rapport:     'Rapports',
  contrats:    'Contrats',
  cles:        'Gestion des Clés',
  journal:     'Journal d\'audit',
  users:       'Utilisateurs',
  admin:       'Administration',
  registre:    'Registre d\'intervention',
  permissions: 'Permissions'
};

const PERM_MODULE_ICONS = {
  dashboard: '📊', tickets: '🎫', map: '🗺️', messages: '💬',
  annonces: '📢', agenda: '📅', contacts: '👥', faq: '❓',
  documents: '📄', votes: '🗳️', rapport: '📈', contrats: '📝',
  cles: '🔑', journal: '📜', users: '👤', admin: '⚙️',
  registre: '📋', permissions: '🛡️'
};

const ACTIONS_META = {
  view:   { label: 'Voir',  ico: '👁',  colorVar: '--accent',  bgVar: '--accent-light',  borderVar: '--accent-border'  },
  create: { label: 'Créer', ico: '＋',  colorVar: '--green',   bgVar: '--green-light',   borderVar: '--green-border'   },
  edit:   { label: 'Modif', ico: '✏',  colorVar: '--amber',   bgVar: '--amber-light',   borderVar: '--amber-border'   },
  delete: { label: 'Suppr', ico: '✕',  colorVar: '--red',     bgVar: '--red-light',     borderVar: '--red-border'     },
  manage: { label: 'Gérer', ico: '⚙',  colorVar: '--violet',  bgVar: '--violet-light',  borderVar: '--violet-border'  }
};

let _pp = {
  catalog:    [],
  byModule:   {},
  rolePerms:  {},
  locks:      {},
  changelog:  [],
  activeRole: 'copropriétaire',
  saving:     new Set(),
  viewAsReal: null
};

// ── RENDER PRINCIPAL ─────────────────────────────────────────────

async function renderPermissionsPage() {
  if (typeof isAdmin === 'function' && !isAdmin()) { nav('dashboard'); return; }

  $('page').innerHTML = `
  <style>
    .pp-wrap { padding-bottom: 100px; animation: pageIn .22s cubic-bezier(.4,0,.2,1) both; }

    .pp-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
      padding-bottom: 24px; border-bottom: 1px solid var(--border);
    }
    .pp-title {
      font-family: var(--font-head); font-size: 24px; font-weight: 800;
      letter-spacing: -.5px; color: var(--text); margin-bottom: 4px;
    }
    .pp-subtitle { font-size: 13px; color: var(--text-2); }

    .pp-simulate {
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: var(--r-lg); padding: 12px 16px;
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .pp-simulate-lbl {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: var(--text-3); margin-bottom: 1px;
    }
    .pp-simulate-val { font-size: 13px; font-weight: 600; color: var(--text-2); }

    .pp-sim-banner {
      display: none; margin-bottom: 20px; padding: 14px 18px;
      background: var(--orange-light); border: 1px solid var(--orange-border);
      border-radius: var(--r-md);
    }
    .pp-sim-banner-inner {
      display: flex; align-items: center; gap: 10px;
      color: var(--orange); font-size: 13px; font-weight: 700;
    }

    .pp-tabs {
      display: flex; gap: 4px; margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .pp-tab {
      padding: 10px 16px; font-family: var(--font-body); font-size: 13px;
      font-weight: 700; color: var(--text-3); background: none; border: none;
      border-bottom: 2px solid transparent; cursor: pointer; margin-bottom: -1px;
      transition: color var(--t-fast), border-color var(--t-fast);
      display: flex; align-items: center; gap: 7px;
    }
    .pp-tab:hover { color: var(--text-2); }
    .pp-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

    .pp-role-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
      gap: 10px; margin-bottom: 24px;
    }
    .pp-role-card {
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: var(--r-lg); padding: 14px 16px; cursor: pointer;
      transition: border-color var(--t-base), box-shadow var(--t-base), transform var(--t-base);
      display: flex; align-items: center; gap: 10px; position: relative;
    }
    .pp-role-card:hover { border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow); }
    .pp-role-card.active {
      border-color: var(--accent); background: var(--accent-light);
      box-shadow: 0 0 0 3px rgba(37,99,235,.08);
    }
    .pp-role-card.active::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 2px; background: var(--accent);
      border-radius: var(--r-lg) var(--r-lg) 0 0;
    }
    .pp-role-ico {
      width: 36px; height: 36px; border-radius: var(--r-sm);
      background: var(--surface-2); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; flex-shrink: 0;
    }
    .pp-role-card.active .pp-role-ico { background: var(--accent-light); border-color: var(--accent-border); }
    .pp-role-name { font-size: 13px; font-weight: 800; color: var(--text); margin-bottom: 2px; }
    .pp-role-desc { font-size: 11px; color: var(--text-3); }
    .pp-role-check {
      margin-left: auto; width: 18px; height: 18px; border-radius: 50%;
      background: var(--accent); display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: white; opacity: 0;
      transition: opacity var(--t-fast); flex-shrink: 0;
    }
    .pp-role-card.active .pp-role-check { opacity: 1; }

    .pp-registre-info {
      background: var(--amber-light); border: 1px solid var(--amber-border);
      border-radius: var(--r-md); padding: 12px 16px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 12px;
      font-size: 13px; color: var(--amber); font-weight: 600;
    }

    .pp-lock-banner {
      background: var(--red-light); border: 1px solid var(--red-border);
      border-radius: var(--r-md); padding: 12px 18px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 10px;
      color: var(--red); font-size: 13px; font-weight: 700;
    }

    .pp-table-wrap {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--r-lg); overflow: hidden;
    }
    .pp-table-head {
      display: grid; grid-template-columns: 1fr 130px 80px;
      background: var(--surface-2); border-bottom: 1px solid var(--border);
      padding: 10px 20px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .08em; color: var(--text-3);
    }

    .pp-module { border-bottom: 1px solid var(--border); }
    .pp-module:last-child { border-bottom: none; }
    .pp-module-registre { border-left: 3px solid var(--amber); }

    .pp-module-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 20px; cursor: pointer; background: var(--surface-2);
      transition: background var(--t-fast);
    }
    .pp-module-header:hover { background: var(--surface-3); }
    .pp-module-registre .pp-module-header { background: var(--amber-light); }
    .pp-module-registre .pp-module-header:hover { background: var(--amber-light); filter: brightness(.97); }

    .pp-module-left { display: flex; align-items: center; gap: 10px; }
    .pp-module-icon {
      width: 26px; height: 26px; border-radius: 6px;
      background: var(--surface); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }
    .pp-module-registre .pp-module-icon { background: var(--amber-light); border-color: var(--amber-border); }
    .pp-module-name { font-family: var(--font-head); font-size: 13px; font-weight: 700; color: var(--text); }
    .pp-module-count {
      display: inline-flex; align-items: center; padding: 1px 8px;
      border-radius: 999px; font-size: 10.5px; font-weight: 700;
      background: var(--surface-3); color: var(--text-3); border: 1px solid var(--border);
    }
    .pp-module-count.full { background: var(--green-light); color: var(--green); border-color: var(--green-border); }
    .pp-module-count.zero { background: var(--surface-2); color: var(--text-3); }
    .pp-module-new {
      display: inline-flex; align-items: center; padding: 2px 8px;
      border-radius: 999px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; background: var(--amber); color: #fff;
    }
    .pp-module-chevron { color: var(--text-3); transition: transform .2s ease; }
    .pp-module-chevron.open { transform: rotate(180deg); }

    .pp-perm-row {
      display: grid; grid-template-columns: 1fr 130px 80px;
      align-items: center; padding: 11px 20px;
      border-top: 1px solid var(--border);
      transition: background var(--t-fast); gap: 12px;
    }
    .pp-perm-row:hover { background: var(--bg); }
    .pp-perm-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 1px; }
    .pp-perm-desc  { font-size: 11px; color: var(--text-3); }

    .pp-action-tag {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .04em; padding: 3px 9px;
      border-radius: var(--r-xs); border: 1px solid; width: fit-content;
    }

    .pp-toggle {
      width: 42px; height: 22px; border-radius: 11px;
      background: var(--border-strong); border: 1.5px solid var(--border);
      position: relative; cursor: pointer; display: block; margin: 0 auto;
      transition: background .28s cubic-bezier(.175,.885,.32,1.275),
                  border-color .28s ease, box-shadow .28s ease;
    }
    .pp-toggle.on { background: var(--green); border-color: var(--green); box-shadow: 0 0 0 3px var(--green-light); }
    .pp-toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 14px; height: 14px; border-radius: 50%; background: white;
      transition: transform .28s cubic-bezier(.175,.885,.32,1.275);
      box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .pp-toggle.on::after { transform: translateX(20px); }
    .pp-toggle.saving { opacity: .45; pointer-events: none; }

    .pp-emergency-list { display: flex; flex-direction: column; gap: 10px; }
    .pp-emergency-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border: 1.5px solid var(--border);
      border-radius: var(--r-lg); background: var(--surface);
      transition: border-color var(--t-base), background var(--t-base);
    }
    .pp-emergency-card.locked { border-color: var(--red-border); background: var(--red-light); }
    .pp-emergency-left { display: flex; align-items: center; gap: 12px; }
    .pp-emergency-name { font-size: 14px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
    .pp-emergency-status { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
    .pp-emergency-status.ok { color: var(--green); }
    .pp-emergency-status.locked { color: var(--red); }

    .pp-logs-head {
      display: grid; grid-template-columns: 90px 1fr 180px 130px;
      padding: 10px 20px; background: var(--surface-2); border-bottom: 1px solid var(--border);
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3);
    }
    .pp-logs-row {
      display: grid; grid-template-columns: 90px 1fr 180px 130px;
      padding: 11px 20px; border-top: 1px solid var(--border);
      font-size: 12px; align-items: center; transition: background var(--t-fast); color: var(--text);
    }
    .pp-logs-row:hover { background: var(--bg); }
    .pp-log-action {
      display: inline-flex; align-items: center; padding: 2px 8px;
      border-radius: 999px; font-size: 10.5px; font-weight: 800; border: 1px solid;
    }
    .pp-log-action.granted { background: var(--green-light); color: var(--green); border-color: var(--green-border); }
    .pp-log-action.revoked { background: var(--red-light);   color: var(--red);   border-color: var(--red-border);   }

    .pp-section-title {
      font-size: 10px; font-weight: 800; letter-spacing: .1em;
      text-transform: uppercase; color: var(--text-3); margin-bottom: 12px;
    }
    .pp-loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
  </style>

  <div class="pp-wrap">

    <div class="pp-header">
      <div>
        <h1 class="pp-title">🛡️ Gouvernance & Permissions</h1>
        <p class="pp-subtitle">Contrôlez finement l'accès aux données pour chaque profil de la copropriété.</p>
      </div>
      <div class="pp-simulate">
        <div>
          <div class="pp-simulate-lbl">Mode Test</div>
          <div class="pp-simulate-val">Simuler un profil</div>
        </div>
        <select id="view-as-select" class="select" style="width:190px; margin:0;"
                onchange="ppSimulateAs(this.value)">
          <option value="">— Choisir —</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
        <button id="view-as-stop" class="btn btn-danger btn-sm"
                style="display:none;" onclick="ppStopSimulation()">✕ Quitter</button>
      </div>
    </div>

    <div id="view-as-banner" class="pp-sim-banner">
      <div class="pp-sim-banner-inner">
        <span style="font-size:20px;">👁</span>
        <div>SESSION DE SIMULATION ACTIVE —
          Vous naviguez avec les droits d'un
          <strong><span id="view-as-label"></span></strong>.
          Les modifications ne sont pas enregistrées.
        </div>
      </div>
    </div>

    <div class="pp-tabs">
      <button class="pp-tab active" onclick="ppSwitchTab(this, 'matrix')">📊 Matrice des droits</button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'emergency')">🚨 Verrous d'urgence</button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'logs')">📜 Historique</button>
    </div>

    <div id="pp-content-matrix">
      <div class="pp-section-title">Rôle à configurer</div>
      <div class="pp-role-row" id="pp-role-row">
        ${PERM_ROLES_LIST.map(r => {
          const meta = PERM_ROLE_META[r];
          const isActive = r === _pp.activeRole;
          return `
          <div class="pp-role-card ${isActive ? 'active' : ''}"
               data-role="${r}" onclick="ppSelectRole('${r}')">
            <div class="pp-role-ico">${meta.icon}</div>
            <div style="flex:1; min-width:0;">
              <div class="pp-role-name">${PERM_ROLE_LABELS[r]}</div>
              <div class="pp-role-desc">${meta.desc}</div>
            </div>
            <div class="pp-role-check">✓</div>
          </div>`;
        }).join('')}
      </div>
      <div id="pp-matrix-grid">
        <div class="pp-loading"><div class="spin"></div></div>
      </div>
    </div>

    <div id="pp-content-emergency" style="display:none;"></div>
    <div id="pp-content-logs" style="display:none;"></div>

  </div>
  `;

  await _ppLoadAll();
  _ppRenderMatrix();
}

// ── CHARGEMENT ────────────────────────────────────────────────────

async function _ppLoadAll() {
  const [catalog, locks, changelog] = await Promise.all([
    Permissions.loadCatalog(),
    Permissions.getRoleLocks(),
    Permissions.getChangeLog(50)
  ]);

  _pp.catalog   = catalog;
  _pp.locks     = locks;
  _pp.changelog = changelog;

  _pp.byModule = {};
  catalog.forEach(p => {
    if (!_pp.byModule[p.module]) _pp.byModule[p.module] = [];
    _pp.byModule[p.module].push(p);
  });

  _pp.rolePerms[_pp.activeRole] = await Permissions.getPermissionsForRole(_pp.activeRole);
}

// ── TABS ──────────────────────────────────────────────────────────

function ppSwitchTab(btn, target) {
  document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['matrix', 'emergency', 'logs'].forEach(t => {
    $(`pp-content-${t}`).style.display = (t === target) ? 'block' : 'none';
  });
  if (target === 'emergency') _ppRenderEmergency();
  if (target === 'logs')      _ppRenderLogs();
}

// ── SÉLECTION RÔLE ────────────────────────────────────────────────

function ppSelectRole(role) {
  _pp.activeRole = role;
  document.querySelectorAll('.pp-role-card').forEach(c => {
    c.classList.toggle('active', c.dataset.role === role);
  });
  _ppRenderMatrix();
}

// ── MATRICE ───────────────────────────────────────────────────────

async function _ppRenderMatrix() {
  const container = $('pp-matrix-grid');
  const role      = _pp.activeRole;

  if (!_pp.rolePerms[role]) {
    container.innerHTML = '<div class="pp-loading"><div class="spin"></div></div>';
    _pp.rolePerms[role] = await Permissions.getPermissionsForRole(role);
  }

  const isLocked = _pp.locks[role]?.locked === true;

  let html = '';

  if (isLocked) {
    html += `<div class="pp-lock-banner">
      ⚠️ Ce rôle est actuellement verrouillé — toutes les permissions sont révoquées.
    </div>`;
  }

  // Bannière module Registre (nouvellement disponible)
  if (_pp.byModule['registre']) {
    html += `<div class="pp-registre-info">
      <span style="font-size:20px; flex-shrink:0;">📋</span>
      <div>
        <strong>Nouveau — Registre d'intervention.</strong>
        Configurez les permissions d'accès à ce module pour ce rôle.
      </div>
    </div>`;
  }

  html += `<div class="pp-table-wrap">
    <div class="pp-table-head">
      <div>Fonctionnalité / Permission</div>
      <div>Action</div>
      <div style="text-align:center;">Accès</div>
    </div>`;

  // Registre en tête de liste
  const sortedModules = Object.entries(_pp.byModule).sort(([a], [b]) => {
    if (a === 'registre') return -1;
    if (b === 'registre') return  1;
    return 0;
  });

  sortedModules.forEach(([modId, perms]) => {
    const grantedCount = perms.filter(p => _pp.rolePerms[role]?.[p.id]).length;
    const label        = PERM_MODULE_LABELS[modId] || modId;
    const icon         = PERM_MODULE_ICONS[modId]  || '📦';
    const isRegistre   = modId === 'registre';
    const isFull       = grantedCount === perms.length && perms.length > 0;
    const isZero       = grantedCount === 0;
    const countClass   = isFull ? 'full' : isZero ? 'zero' : '';

    html += `
      <div class="pp-module${isRegistre ? ' pp-module-registre' : ''}">
        <div class="pp-module-header" onclick="ppToggleModuleUI('${modId}')">
          <div class="pp-module-left">
            <div class="pp-module-icon">${icon}</div>
            <span class="pp-module-name">${label}</span>
            ${isRegistre ? '<span class="pp-module-new">Nouveau</span>' : ''}
            <span class="pp-module-count ${countClass}">${grantedCount}/${perms.length}</span>
          </div>
          <svg id="pp-chev-${modId}" class="pp-module-chevron open"
               width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        <div id="pp-body-${modId}">
          ${perms.map(p => {
            const isOn = _pp.rolePerms[role]?.[p.id] === true;
            const meta = ACTIONS_META[p.action] || {
              label: p.action, ico: '•',
              colorVar: '--text-2', bgVar: '--surface-2', borderVar: '--border'
            };
            return `
              <div class="pp-perm-row">
                <div>
                  <div class="pp-perm-label">${escHtml(p.label)}</div>
                  <div class="pp-perm-desc">${escHtml(p.description || '')}</div>
                </div>
                <div>
                  <span class="pp-action-tag"
                    style="color:var(${meta.colorVar}); background:var(${meta.bgVar}); border-color:var(${meta.borderVar});">
                    ${meta.ico} ${meta.label}
                  </span>
                </div>
                <div style="text-align:center;">
                  <button class="pp-toggle ${isOn ? 'on' : ''}"
                          onclick="ppTogglePerm('${role}', '${p.id}', ${!isOn})"></button>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function ppToggleModuleUI(modId) {
  const body = $(`pp-body-${modId}`);
  const chev = $(`pp-chev-${modId}`);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', isHidden);
}

async function ppTogglePerm(role, permId, targetState) {
  const { data: ok } = await Permissions.setPermission(role, permId, targetState);
  if (ok !== false) {
    _pp.rolePerms[role][permId] = targetState;
    _ppRenderMatrix();
    toast(`Droits mis à jour — ${PERM_ROLE_LABELS[role]}`, 'ok');
  } else {
    toast('Erreur de sauvegarde', 'err');
  }
}

// ── EMERGENCY LOCKS ───────────────────────────────────────────────

function _ppRenderEmergency() {
  const container = $('pp-content-emergency');
  container.innerHTML = `
    <div style="max-width:680px;">
      <div class="pp-section-title">Arrêt d'urgence par rôle</div>
      <p style="font-size:13px; color:var(--text-2); margin-bottom:20px; line-height:1.6;">
        Suspendez l'accès complet d'un rôle en cas d'abus ou lors d'une maintenance critique.
        Les utilisateurs concernés ne pourront accéder à aucune fonctionnalité.
      </p>
      <div class="pp-emergency-list">
        ${PERM_ROLES_LIST.map(r => {
          const isL  = _pp.locks[r]?.locked;
          const meta = PERM_ROLE_META[r];
          return `
            <div class="pp-emergency-card ${isL ? 'locked' : ''}">
              <div class="pp-emergency-left">
                <div class="pp-role-ico">${meta.icon}</div>
                <div>
                  <div class="pp-emergency-name">${PERM_ROLE_LABELS[r]}</div>
                  <div class="pp-emergency-status ${isL ? 'locked' : 'ok'}">
                    ${isL ? '🚫 Accès suspendu' : '✅ Accès opérationnel'}
                  </div>
                </div>
              </div>
              <button class="btn ${isL ? 'btn-accent' : 'btn-danger'} btn-sm"
                      onclick="ppToggleRoleLock('${r}', ${!isL})">
                ${isL ? '🔓 Rétablir' : '🔒 Verrouiller'}
              </button>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

async function ppToggleRoleLock(role, locked) {
  let reason = '';
  if (locked) reason = prompt('Raison du verrouillage (visible par les résidents) :') || 'Maintenance';
  const ok = await Permissions.setRoleLock(role, locked, reason);
  if (ok) {
    _pp.locks[role] = { locked };
    _ppRenderEmergency();
    _ppRenderMatrix();
    toast('Verrouillage mis à jour', 'warn');
  }
}

// ── SIMULATION ────────────────────────────────────────────────────

async function ppSimulateAs(role) {
  if (!role) { ppStopSimulation(); return; }
  if (!_pp.viewAsReal) _pp.viewAsReal = { ...profile };
  profile = { ..._pp.viewAsReal, role };
  await Permissions.load();
  if (typeof initUI === 'function') initUI();
  $('view-as-banner').style.display = 'block';
  $('view-as-label').textContent    = PERM_ROLE_LABELS[role].toUpperCase();
  $('view-as-stop').style.display   = 'inline-flex';
  $('view-as-select').value         = role;
  toast(`Simulation active : ${PERM_ROLE_LABELS[role]}`, 'warn');
  nav(Permissions.getDefaultPage());
}

async function ppStopSimulation() {
  if (!_pp.viewAsReal) return;
  profile        = { ..._pp.viewAsReal };
  _pp.viewAsReal = null;
  await Permissions.load();
  if (typeof initUI === 'function') initUI();
  $('view-as-banner').style.display = 'none';
  $('view-as-stop').style.display   = 'none';
  $('view-as-select').value         = '';
  nav('permissions');
  toast('Retour au mode Administrateur', 'ok');
}

// ── JOURNAL D'AUDIT ───────────────────────────────────────────────

async function _ppRenderLogs() {
  const container = $('pp-content-logs');
  const logs      = await Permissions.getChangeLog(50);
  container.innerHTML = `
    <div class="pp-table-wrap">
      <div class="pp-logs-head">
        <div>Action</div><div>Cible</div><div>Auteur</div>
        <div style="text-align:right;">Date</div>
      </div>
      ${logs.length ? logs.map(l => `
        <div class="pp-logs-row">
          <div>
            <span class="pp-log-action ${l.action === 'granted' ? 'granted' : 'revoked'}">
              ${l.action === 'granted' ? '✓ Accordé' : '✕ Révoqué'}
            </span>
          </div>
          <div style="font-weight:600;">
            ${l.permission}
            <span style="color:var(--text-3); font-weight:400;"> — ${l.role}</span>
          </div>
          <div style="color:var(--text-2); font-weight:600;">${l.admin_nom}</div>
          <div style="text-align:right; color:var(--text-3);">${fmt(l.created_at)}</div>
        </div>`).join('')
      : `<div style="padding:40px; text-align:center; color:var(--text-3); font-size:14px;">
           Aucun historique disponible.
         </div>`}
    </div>`;
}
