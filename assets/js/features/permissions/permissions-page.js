// ── PAGE ADMIN : GESTION DES PERMISSIONS ──
// assets/js/features/permissions/permissions-page.js

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire'];

const PERM_ROLE_LABELS = {
  syndic: 'Syndic',
  membre_cs: 'Conseil Syndical',
  'copropriétaire': 'Copropriétaire',
};

const PERM_ROLE_COLORS = {
  syndic:           { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  membre_cs:        { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  'copropriétaire': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
};

const PERM_MODULE_LABELS = {
  dashboard:   '🏠 Tableau de bord',
  tickets:     '🔧 Signalements',
  map:         '🗺️ Carte',
  messages:    '💬 Messagerie',
  annonces:    '📢 Annonces',
  agenda:      '📅 Agenda',
  contacts:    '📞 Contacts',
  faq:         '❓ FAQ',
  documents:   '📄 Documents',
  votes:       '🗳️ Votes',
  rapport:     '📊 Rapport syndic',
  contrats:    '📋 Contrats',
  cles:        '🔑 Clés',
  journal:     '📒 Journal',
  users:       '👥 Utilisateurs',
  permissions: '🛡️ Permissions',
};

let _pp = {
  catalog:    [],
  byModule:   {},
  rolePerms:  {},
  locks:      {},
  changelog:  [],
  activeRole: 'syndic',
  saving:     new Set(),
  viewAsReal: null,  // profil réel pendant la simulation
};

// ── RENDER PRINCIPAL ─────────────────────────────────────────────

async function renderPermissionsPage() {
  if (!isAdmin()) { nav(Permissions.getDefaultPage()); return; }

  $('page').innerHTML = `
  <div style="padding:16px 20px 80px;">

    <!-- En-tête + View As -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <h1 style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.3px;margin-bottom:4px;">🛡️ Gestion des permissions</h1>
        <p style="font-size:13px;color:var(--text-2);margin:0;">Configurez en temps réel ce que chaque rôle peut voir et faire dans CoproSync.</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;color:var(--text-3);font-weight:600;white-space:nowrap;">Simuler la vue de :</span>
        <select id="view-as-select" class="select" style="width:180px;font-size:13px;" onchange="ppSimulateAs(this.value)">
          <option value="">— Choisir un rôle —</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
        <button id="view-as-stop" class="btn btn-danger btn-sm" style="display:none;" onclick="ppStopSimulation()">✕ Arrêter</button>
      </div>
    </div>

    <!-- Bannière simulation -->
    <div id="view-as-banner" style="display:none;margin-bottom:16px;padding:12px 16px;background:var(--amber-light);border:1px solid var(--amber-border);border-radius:var(--r-md);">
      <strong>👁️ Mode simulation</strong> — Vous voyez l'application comme un <strong id="view-as-label"></strong>.
      <div style="font-size:12px;color:var(--text-2);margin-top:4px;">Naviguez librement. Cliquez "Arrêter" pour revenir à votre compte admin.</div>
    </div>

    <!-- Onglets -->
    <div style="display:flex;border-bottom:1px solid var(--border);margin-bottom:20px;">
      <button class="pp-tab active" data-tab="matrix" onclick="ppTab('matrix')">Matrice</button>
      <button class="pp-tab" data-tab="locks" onclick="ppTab('locks')">Verrous d'urgence</button>
      <button class="pp-tab" data-tab="log" onclick="ppTab('log')">Journal</button>
    </div>

    <div id="pp-tab-matrix"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
    <div id="pp-tab-locks" style="display:none;"></div>
    <div id="pp-tab-log"   style="display:none;"></div>
  </div>

  <style>
    .pp-tab{padding:10px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--text-2);border-bottom:2px solid transparent;margin-bottom:-1px;font-family:var(--font-body);transition:color .12s;}
    .pp-tab.active{color:var(--text);border-bottom-color:var(--text);}
    .pp-tab:hover{color:var(--text);}
    .pp-switch{position:relative;width:40px;height:22px;background:var(--border);border-radius:11px;cursor:pointer;border:none;transition:background .18s;flex-shrink:0;}
    .pp-switch::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .18s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
    .pp-switch.on{background:var(--green);}
    .pp-switch.on::after{transform:translateX(18px);}
    .pp-switch.saving{opacity:.5;pointer-events:none;}
    .pp-switch.hard{background:var(--border-strong);cursor:not-allowed;opacity:.5;}
    .pp-mod-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:10px;overflow:hidden;}
    .pp-mod-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface-2);border-bottom:1px solid var(--border);cursor:pointer;user-select:none;}
    .pp-mod-head:hover{background:var(--bg);}
    .pp-perm-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);transition:background .1s;}
    .pp-perm-row:last-child{border-bottom:none;}
    .pp-perm-row:hover{background:var(--surface-2);}
    .pp-action-badge{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;background:var(--surface-2);color:var(--text-3);flex-shrink:0;}
    .pp-lock-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;}
    .pp-lock-card.locked{border-color:var(--red-border);background:var(--red-light);}
    .pp-log-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:12px;}
    .pp-log-row:last-child{border-bottom:none;}
  </style>`;

  await _ppLoad();
  _ppRenderMatrix();
  _ppRenderLocks();
  _ppRenderLog();
}

// ── CHARGEMENT ────────────────────────────────────────────────────

async function _ppLoad() {
  const [catalog, locks, changelog] = await Promise.all([
    Permissions.loadCatalog(),
    Permissions.getRoleLocks(),
    Permissions.getChangeLog(50),
  ]);
  _pp.catalog   = catalog;
  _pp.locks     = locks;
  _pp.changelog = changelog;
  _pp.byModule  = {};
  catalog.forEach(p => {
    if (!_pp.byModule[p.module]) _pp.byModule[p.module] = [];
    _pp.byModule[p.module].push(p);
  });
  await Promise.all(PERM_ROLES_LIST.map(async r => {
    _pp.rolePerms[r] = await Permissions.getPermissionsForRole(r);
  }));
}

// ── ONGLETS ───────────────────────────────────────────────────────

function ppTab(tab) {
  document.querySelectorAll('.pp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  ['matrix','locks','log'].forEach(t => {
    const el = document.getElementById('pp-tab-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
}

// ── MATRICE ──────────────────────────────────────────────────────

function _ppRenderMatrix() {
  const el = document.getElementById('pp-tab-matrix');
  if (!el) return;
  const role = _pp.activeRole;
  const c    = PERM_ROLE_COLORS[role] || {};
  const isLocked = _pp.locks[role]?.locked === true;

  el.innerHTML = `
    <!-- Sélecteur rôle -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;align-items:center;">
      <span style="font-size:12px;color:var(--text-3);font-weight:600;margin-right:4px;">Configurer :</span>
      ${PERM_ROLES_LIST.map(r => {
        const rc = PERM_ROLE_COLORS[r];
        const active = r === role;
        return `<button style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;border:1.5px solid ${active ? rc.border : 'var(--border)'};background:${active ? rc.bg : 'var(--surface)'};color:${active ? rc.text : 'var(--text-2)'};cursor:pointer;" onclick="ppSelectRole('${r}')">${r === role ? '● ' : ''}${PERM_ROLE_LABELS[r]}</button>`;
      }).join('')}
    </div>

    ${isLocked ? `
    <div style="padding:10px 14px;background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--r-md);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <span style="font-size:13px;font-weight:700;color:var(--red);">🔒 Ce rôle est verrouillé — toutes les permissions sont suspendues.</span>
      <button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;" onclick="ppToggleLock('${role}', false)">Déverrouiller</button>
    </div>` : ''}

    <div id="pp-modules">
      ${Object.entries(_pp.byModule)
        .filter(([mod]) => PERM_MODULE_LABELS[mod])
        .map(([mod, perms]) => _ppModuleCard(mod, perms, role))
        .join('')}
    </div>`;
}

function _ppModuleCard(mod, perms, role) {
  const granted = perms.filter(p => _pp.rolePerms[role]?.[p.id] === true).length;
  const rows = perms.map(p => {
    const isOn      = _pp.rolePerms[role]?.[p.id] === true;
    const isSaving  = _pp.saving.has(role + ':' + p.id);
    const isHard    = p.hardcoded === true;
    const aLabel    = { view: 'Voir', create: 'Créer', edit: 'Modifier', delete: 'Supprimer', read: 'Lire' }[p.action] || p.action;
    return `
      <div class="pp-perm-row">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;color:var(--text);font-weight:500;">${escHtml(p.label)}</div>
          ${p.description ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px;">${escHtml(p.description)}</div>` : ''}
        </div>
        <span class="pp-action-badge">${aLabel}</span>
        ${isHard
          ? `<button class="pp-switch hard" title="Système — non modifiable" disabled></button>`
          : `<button class="pp-switch ${isOn ? 'on' : ''} ${isSaving ? 'saving' : ''}"
              title="${isOn ? 'Cliquer pour révoquer' : 'Cliquer pour accorder'}"
              onclick="ppToggle('${role}','${p.id}',${!isOn})"></button>`}
      </div>`;
  }).join('');

  return `
    <div class="pp-mod-card">
      <div class="pp-mod-head" onclick="ppToggleModule('${mod}')">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text);">${PERM_MODULE_LABELS[mod] || mod}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${granted}/${perms.length} permission${perms.length > 1 ? 's' : ''} accordée${granted > 1 ? 's' : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${granted === perms.length ? `<span style="font-size:11px;background:var(--green-light);color:var(--green);padding:2px 8px;border-radius:8px;font-weight:700;">Tout accordé</span>` : ''}
          ${granted === 0 ? `<span style="font-size:11px;background:var(--surface-2);color:var(--text-3);padding:2px 8px;border-radius:8px;font-weight:700;">Tout refusé</span>` : ''}
          <svg id="pp-chev-${mod}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3);transition:transform .2s"><polyline points="6,9 12,15 18,9"/></svg>
        </div>
      </div>
      <div id="pp-body-${mod}">${rows}</div>
    </div>`;
}

function ppToggleModule(mod) {
  const body = document.getElementById('pp-body-' + mod);
  const chev = document.getElementById('pp-chev-' + mod);
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  if (chev) chev.style.transform = hidden ? '' : 'rotate(-90deg)';
}

async function ppToggle(role, permId, granted) {
  const key = role + ':' + permId;
  _pp.saving.add(key);
  // Met le switch en état saving
  document.querySelectorAll('.pp-switch:not(.hard)').forEach(btn => {
    if (btn.getAttribute('onclick')?.includes("'" + permId + "'") && btn.getAttribute('onclick')?.includes("'" + role + "'")) {
      btn.classList.add('saving');
    }
  });

  const ok = await Permissions.setPermission(role, permId, granted);
  _pp.saving.delete(key);

  if (ok) {
    if (!_pp.rolePerms[role]) _pp.rolePerms[role] = {};
    _pp.rolePerms[role][permId] = granted;
    // Met à jour le switch sans re-render toute la matrice
    document.querySelectorAll('.pp-switch:not(.hard)').forEach(btn => {
      if (btn.getAttribute('onclick')?.includes("'" + permId + "'") && btn.getAttribute('onclick')?.includes("'" + role + "'")) {
        btn.classList.remove('saving');
        btn.classList.toggle('on', granted);
        btn.setAttribute('onclick', "ppToggle('" + role + "','" + permId + "'," + !granted + ")");
        btn.title = granted ? 'Cliquer pour révoquer' : 'Cliquer pour accorder';
      }
    });
    // Refresh log en arrière-plan
    Permissions.getChangeLog(50).then(log => { _pp.changelog = log; });
  } else {
    // Échec : re-render pour restaurer l'état
    _ppRenderMatrix();
  }
}

function ppSelectRole(role) {
  _pp.activeRole = role;
  _ppRenderMatrix();
}

// ── VERROUS ───────────────────────────────────────────────────────

function _ppRenderLocks() {
  const el = document.getElementById('pp-tab-locks');
  if (!el) return;

  el.innerHTML = `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:4px;font-family:var(--font-head);">Master Switch — Verrous d'urgence</h2>
      <p style="font-size:13px;color:var(--text-2);">Verrouiller un rôle suspend instantanément toutes ses permissions pour les utilisateurs connectés.</p>
    </div>

    ${PERM_ROLES_LIST.map(role => {
      const lock = _pp.locks[role] || {};
      const isLocked = lock.locked === true;
      return `
        <div class="pp-lock-card ${isLocked ? 'locked' : ''}">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:${isLocked ? '6' : '0'}px;">
              <span style="font-size:14px;font-weight:700;color:var(--text);">${PERM_ROLE_LABELS[role]}</span>
              ${isLocked ? `<span style="font-size:11px;font-weight:700;background:var(--red);color:#fff;padding:2px 8px;border-radius:8px;">🔒 VERROUILLÉ</span>` : ''}
            </div>
            <div style="font-size:12px;color:${isLocked ? 'var(--red)' : 'var(--text-3)'};margin-top:2px;">
              ${isLocked ? 'Toutes les permissions suspendues.' + (lock.reason ? ' Raison : ' + escHtml(lock.reason) : '') : 'Ce rôle est actif — ses permissions s\'appliquent normalement.'}
            </div>
          </div>
          ${isLocked
            ? `<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;" onclick="ppToggleLock('${role}', false)">🔓 Déverrouiller</button>`
            : `<button class="btn btn-sm btn-danger" onclick="ppToggleLock('${role}', true)">🔒 Verrouiller</button>`}
        </div>`;
    }).join('')}

    <div style="margin-top:24px;padding:14px 16px;background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--r-md);">
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:6px;">🚨 Verrouillage global</div>
      <div style="font-size:12px;color:var(--text-2);margin-bottom:12px;">Verrouille instantanément tous les rôles non-admin. Mode audit ou maintenance d'urgence.</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-danger" onclick="ppLockAll()">🔒 Verrouiller tout</button>
        <button class="btn btn-secondary" onclick="ppUnlockAll()">🔓 Tout déverrouiller</button>
      </div>
    </div>`;
}

async function ppToggleLock(role, locked) {
  let reason = '';
  if (locked) {
    reason = (await askTextModal({ title: 'Raison du verrouillage', label: 'Raison (optionnel)', placeholder: 'Ex : Maintenance en cours' })) || '';
  }
  const ok = await Permissions.setRoleLock(role, locked, reason);
  if (!ok) return;
  _pp.locks = await Permissions.getRoleLocks();
  _ppRenderLocks();
  _ppRenderMatrix();
  toast(locked ? '🔒 Rôle "' + PERM_ROLE_LABELS[role] + '" verrouillé' : '🔓 Rôle "' + PERM_ROLE_LABELS[role] + '" déverrouillé', locked ? 'warn' : 'ok');
}

async function ppLockAll() {
  if (!confirm('Verrouiller TOUS les rôles ? Les utilisateurs ne pourront plus rien faire.')) return;
  await Promise.all(PERM_ROLES_LIST.map(r => Permissions.setRoleLock(r, true, 'Verrouillage global')));
  _pp.locks = await Permissions.getRoleLocks();
  _ppRenderLocks();
  toast('🔒 Tous les rôles verrouillés', 'warn');
}

async function ppUnlockAll() {
  if (!confirm('Déverrouiller tous les rôles ?')) return;
  await Promise.all(PERM_ROLES_LIST.map(r => Permissions.setRoleLock(r, false)));
  _pp.locks = await Permissions.getRoleLocks();
  _ppRenderLocks();
  toast('🔓 Tous les rôles déverrouillés', 'ok');
}

// ── JOURNAL ───────────────────────────────────────────────────────

function _ppRenderLog() {
  const el = document.getElementById('pp-tab-log');
  if (!el) return;
  const log = _pp.changelog;
  const ACTION_ICO = { granted: '✅', revoked: '❌', role_locked: '🔒', role_unlocked: '🔓' };
  const ACTION_TXT = { granted: 'Permission accordée', revoked: 'Permission révoquée', role_locked: 'Rôle verrouillé', role_unlocked: 'Rôle déverrouillé' };
  const permLabel  = id => _pp.catalog.find(p => p.id === id)?.label || id;

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="font-size:15px;font-weight:700;font-family:var(--font-head);margin-bottom:2px;">Journal des modifications</h2>
        <p style="font-size:12px;color:var(--text-3);margin:0;">${log.length} entrée${log.length > 1 ? 's' : ''} — immuable</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="ppRefreshLog()">Actualiser</button>
    </div>
    <div class="pp-mod-card" style="padding:0 16px;">
      ${!log.length
        ? `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">Aucune modification enregistrée.</div>`
        : log.map(entry => {
          const rc = PERM_ROLE_COLORS[entry.role] || {};
          return `
            <div class="pp-log-row">
              <div style="font-size:18px;flex-shrink:0;">${ACTION_ICO[entry.action] || '📝'}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:600;color:var(--text);">
                  ${ACTION_TXT[entry.action] || entry.action}
                  ${entry.permission !== '*' ? `<span style="color:var(--text-3);font-weight:400;"> — ${escHtml(permLabel(entry.permission))}</span>` : ''}
                </div>
                <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
                  <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;background:${rc.bg || 'var(--surface-2)'};color:${rc.text || 'var(--text-3)'};">${PERM_ROLE_LABELS[entry.role] || entry.role}</span>
                  <span style="font-size:11px;color:var(--text-3);">par ${escHtml(entry.admin_nom || 'Admin')}</span>
                  <span style="font-size:11px;color:var(--text-3);">${fmt(entry.created_at)}</span>
                </div>
              </div>
            </div>`;
        }).join('')}
    </div>`;
}

async function ppRefreshLog() {
  _pp.changelog = await Permissions.getChangeLog(50);
  _ppRenderLog();
}

// ── SIMULATEUR VIEW AS ────────────────────────────────────────────

async function ppSimulateAs(role) {
  if (!role) { ppStopSimulation(); return; }

  // Sauvegarde du vrai profil
  if (!_pp.viewAsReal) _pp.viewAsReal = { ...profile };

  // Modification temporaire du profil en mémoire
  profile = { ..._pp.viewAsReal, role };

  // Rechargement des permissions pour ce rôle
  await Permissions.load();
  initUI();

  // Affichage bannière
  document.getElementById('view-as-banner').style.display = '';
  document.getElementById('view-as-label').textContent  = PERM_ROLE_LABELS[role] || role;
  document.getElementById('view-as-stop').style.display = '';

  // Navigation vers la page par défaut du rôle simulé
  nav(Permissions.getDefaultPage());
  toast('👁️ Simulation : vous voyez l\'app comme "' + (PERM_ROLE_LABELS[role] || role) + '"', 'warn');
}

async function ppStopSimulation() {
  if (!_pp.viewAsReal) return;

  // Restauration du vrai profil
  profile = { ..._pp.viewAsReal };
  _pp.viewAsReal = null;

  // Rechargement des vraies permissions (admin)
  await Permissions.load();
  initUI();

  // Nettoyage UI
  const banner = document.getElementById('view-as-banner');
  const select = document.getElementById('view-as-select');
  const stop   = document.getElementById('view-as-stop');
  if (banner) banner.style.display = 'none';
  if (select) select.value = '';
  if (stop)   stop.style.display = 'none';

  nav('permissions');
  toast('✓ Simulation arrêtée — retour à votre compte admin', 'ok');
}
