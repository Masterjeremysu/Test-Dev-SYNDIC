// ============================================================================
//  PAGE ADMIN : GESTION DES PERMISSIONS
//  assets/js/features/permissions/permissions-page.js
// ============================================================================

var PERM_ROLES_LIST = ['administrateur', 'membre_cs', 'syndic', 'copropriétaire'];
var PERM_EDITABLE_ROLES = new Set(['membre_cs', 'syndic', 'copropriétaire']);

var PERM_ROLE_LABELS = {
  administrateur: 'Administrateur',
  membre_cs: 'Conseil Syndical',
  syndic: 'Syndic',
  'copropriétaire': 'Coproprietaire'
};

var PERM_ROLE_META = {
  administrateur: { icon: '🛡️', desc: 'Controle total, vue systeme et gouvernance.' },
  membre_cs: { icon: '🤝', desc: 'Pilotage operationnel de la residence.' },
  syndic: { icon: '🏢', desc: 'Suivi externe et coordination des interventions.' },
  'copropriétaire': { icon: '🏠', desc: 'Usage resident, consultation et participation.' }
};

var PERM_MODULE_LABELS = {
  dashboard: 'Tableau de bord',
  tickets: 'Signalements',
  map: 'Carte & plan',
  messages: 'Messagerie',
  annonces: 'Annonces',
  agenda: 'Agenda',
  contacts: 'Contacts',
  faq: 'FAQ',
  documents: 'Documents',
  votes: 'Votes / AG',
  rapport: 'Rapport syndic',
  contrats: 'Contrats',
  cles: 'Gestion des cles',
  journal: 'Journal d audit',
  users: 'Utilisateurs',
  admin: 'Administration',
  registre: 'Registre',
  permissions: 'Permissions',
  profile: 'Profil',
  notifications: 'Notifications'
};

var PERM_MODULE_ICONS = {
  dashboard: '📊',
  tickets: '🎫',
  map: '🗺️',
  messages: '💬',
  annonces: '📢',
  agenda: '📅',
  contacts: '👥',
  faq: '❓',
  documents: '📄',
  votes: '🗳️',
  rapport: '📈',
  contrats: '📝',
  cles: '🔑',
  journal: '📜',
  users: '👤',
  admin: '⚙️',
  registre: '📋',
  permissions: '🔐',
  profile: '🙍',
  notifications: '🔔'
};

var SENSITIVE_MODULES = new Set(['registre', 'journal', 'users', 'permissions', 'admin', 'contrats', 'cles']);

var ACTIONS_META = {
  view:   { label: 'Voir',  ico: '👁', colorVar: '--accent', bgVar: '--accent-light', borderVar: '--accent-border' },
  create: { label: 'Creer', ico: '+',  colorVar: '--green',  bgVar: '--green-light',  borderVar: '--green-border' },
  edit:   { label: 'Modif', ico: '✏', colorVar: '--amber',  bgVar: '--amber-light',  borderVar: '--amber-border' },
  delete: { label: 'Suppr', ico: '✕', colorVar: '--red',    bgVar: '--red-light',    borderVar: '--red-border' },
  manage: { label: 'Gerer', ico: '⚙', colorVar: '--violet', bgVar: '--violet-light', borderVar: '--violet-border' },
  export: { label: 'Export', ico: '⇩', colorVar: '--blue', bgVar: '--blue-light', borderVar: '--blue-border' },
  moderate: { label: 'Prive', ico: '🔒', colorVar: '--orange', bgVar: '--orange-light', borderVar: '--orange-border' }
};

var AUDIT_PERMISSION_CATALOG = [
  { id: 'dashboard.view', module: 'dashboard', action: 'view', label: 'Voir le tableau de bord', description: 'Accede a la vue d ensemble et aux indicateurs clefs.' },
  { id: 'tickets.view', module: 'tickets', action: 'view', label: 'Voir ses signalements', description: 'Consulte les signalements autorises pour son profil.' },
  { id: 'tickets.create', module: 'tickets', action: 'create', label: 'Creer un signalement', description: 'Declare un incident depuis l application.' },
  { id: 'tickets.view_all', module: 'tickets', action: 'manage', label: 'Voir tous les signalements', description: 'Accede a l ensemble des tickets de la residence.' },
  { id: 'tickets.edit_status', module: 'tickets', action: 'edit', label: 'Changer le statut d un signalement', description: 'Traite, transmet ou cloture les interventions.' },
  { id: 'tickets.comment', module: 'tickets', action: 'create', label: 'Commenter un signalement', description: 'Ajoute un suivi visible dans le ticket.' },
  { id: 'tickets.comment_private', module: 'tickets', action: 'moderate', label: 'Voir et ecrire les notes privees', description: 'Reserve les commentaires internes de gestion.' },
  { id: 'tickets.delete', module: 'tickets', action: 'delete', label: 'Supprimer un signalement', description: 'Retire un ticket et son historique associe.' },
  { id: 'tickets.export_pdf', module: 'tickets', action: 'export', label: 'Exporter les signalements', description: 'Genere une sortie PDF ou un partage pour suivi externe.' },

  { id: 'map.view', module: 'map', action: 'view', label: 'Voir la carte des signalements', description: 'Affiche les points d incidents sur le plan.' },

  { id: 'messages.view', module: 'messages', action: 'view', label: 'Voir la messagerie', description: 'Accede aux conversations de la residence.' },
  { id: 'messages.create', module: 'messages', action: 'create', label: 'Envoyer un message', description: 'Peut initier ou repondre a une conversation.' },
  { id: 'messages.manage', module: 'messages', action: 'manage', label: 'Superviser les conversations', description: 'Anime ou cadre les echanges communautaires.' },

  { id: 'annonces.view', module: 'annonces', action: 'view', label: 'Voir les annonces', description: 'Consulte les annonces publiees pour son role.' },
  { id: 'annonces.create', module: 'annonces', action: 'create', label: 'Creer une annonce', description: 'Prepare une communication residentielle.' },
  { id: 'annonces.edit', module: 'annonces', action: 'edit', label: 'Modifier une annonce', description: 'Met a jour le contenu ou la cible de diffusion.' },
  { id: 'annonces.delete', module: 'annonces', action: 'delete', label: 'Supprimer une annonce', description: 'Retire une annonce publiee ou planifiee.' },

  { id: 'agenda.view', module: 'agenda', action: 'view', label: 'Voir l agenda', description: 'Consulte les evenements de la residence.' },
  { id: 'agenda.create', module: 'agenda', action: 'create', label: 'Creer un evenement', description: 'Programme une reunion ou une intervention.' },
  { id: 'agenda.edit', module: 'agenda', action: 'edit', label: 'Modifier ou supprimer un evenement', description: 'Met a jour l organisation de l agenda.' },

  { id: 'contacts.view', module: 'contacts', action: 'view', label: 'Voir les contacts et urgences', description: 'Accede au repertoire utile et aux numeros d urgence.' },
  { id: 'contacts.manage', module: 'contacts', action: 'manage', label: 'Gerer les contacts', description: 'Ajoute, corrige ou retire des contacts utiles.' },

  { id: 'faq.view', module: 'faq', action: 'view', label: 'Voir la FAQ', description: 'Accede a l aide et aux reponses frequentes.' },
  { id: 'faq.manage', module: 'faq', action: 'manage', label: 'Administrer la FAQ', description: 'Maintient la base d aide residentielle.' },

  { id: 'documents.view', module: 'documents', action: 'view', label: 'Voir les documents', description: 'Consulte les documents disponibles pour son role.' },
  { id: 'documents.create', module: 'documents', action: 'create', label: 'Ajouter un document', description: 'Depose un document dans la base partagee.' },
  { id: 'documents.edit', module: 'documents', action: 'edit', label: 'Modifier ou remplacer un document', description: 'Met a jour un document deja publie.' },
  { id: 'documents.delete', module: 'documents', action: 'delete', label: 'Supprimer un document', description: 'Retire un document du portail.' },

  { id: 'votes.view', module: 'votes', action: 'view', label: 'Voir les votes et sondages', description: 'Consulte les consultations en cours ou passees.' },
  { id: 'votes.create', module: 'votes', action: 'create', label: 'Lancer un vote ou sondage', description: 'Prepare une consultation residentielle.' },
  { id: 'votes.edit', module: 'votes', action: 'edit', label: 'Modifier un vote', description: 'Ajuste les options ou la periode d une consultation.' },
  { id: 'votes.delete', module: 'votes', action: 'delete', label: 'Supprimer un vote', description: 'Retire un vote non conforme ou obsolete.' },

  { id: 'rapport.view', module: 'rapport', action: 'view', label: 'Voir le rapport syndic', description: 'Accede au suivi consolide syndic et residence.' },
  { id: 'rapport.create', module: 'rapport', action: 'create', label: 'Produire ou enrichir le rapport', description: 'Alimente le reporting de gestion.' },

  { id: 'contrats.view', module: 'contrats', action: 'view', label: 'Voir les contrats', description: 'Consulte les contrats fournisseurs et leurs echeances.' },
  { id: 'contrats.create', module: 'contrats', action: 'create', label: 'Ajouter un contrat', description: 'Reference un nouveau contrat ou prestataire.' },
  { id: 'contrats.edit', module: 'contrats', action: 'edit', label: 'Modifier un contrat', description: 'Met a jour les montants, dates ou contacts.' },
  { id: 'contrats.delete', module: 'contrats', action: 'delete', label: 'Supprimer un contrat', description: 'Retire un contrat clos ou saisi par erreur.' },

  { id: 'cles.view', module: 'cles', action: 'view', label: 'Voir les cles', description: 'Consulte le parc de cles et leur statut.' },
  { id: 'cles.manage', module: 'cles', action: 'manage', label: 'Gerer les mouvements de cles', description: 'Sortie, retour, perte et tracabilite des cles.' },

  { id: 'journal.view', module: 'journal', action: 'view', label: 'Voir le journal d audit', description: 'Consulte les traces sensibles et les actions de gestion.' },

  { id: 'registre.view', module: 'registre', action: 'view', label: 'Voir le registre', description: 'Consulte l historique des passages et interventions.' },
  { id: 'registre.create', module: 'registre', action: 'create', label: 'Creer une intervention manuelle', description: 'Saisit un passage ou un pointage de rattrapage.' },
  { id: 'registre.edit', module: 'registre', action: 'edit', label: 'Modifier le registre', description: 'Corrige une intervention ou ses metadonnees.' },
  { id: 'registre.delete', module: 'registre', action: 'delete', label: 'Supprimer une intervention', description: 'Retire une ligne du registre.' },
  { id: 'registre.manage', module: 'registre', action: 'manage', label: 'Gerer QR, zones et prestataires', description: 'Pilote les zones de scan, missions et affectations.' },

  { id: 'users.view', module: 'users', action: 'view', label: 'Voir la base residents', description: 'Consulte les comptes, tours et lots.' },
  { id: 'users.create', module: 'users', action: 'create', label: 'Inviter ou ajouter un resident', description: 'Cree une invitation ou un compte de gestion.' },
  { id: 'users.edit', module: 'users', action: 'edit', label: 'Modifier les roles et tours', description: 'Reaffecte un utilisateur et son niveau d acces.' },
  { id: 'users.delete', module: 'users', action: 'delete', label: 'Suspendre ou retirer un acces', description: 'Bloque un compte ou limite l acces a l application.' },

  { id: 'permissions.view', module: 'permissions', action: 'view', label: 'Voir la matrice des permissions', description: 'Consulte la politique d acces par role.' },
  { id: 'permissions.manage', module: 'permissions', action: 'manage', label: 'Modifier les permissions', description: 'Change les acces et verrous par role.' },

  { id: 'admin.view', module: 'admin', action: 'view', label: 'Voir la gouvernance', description: 'Accede au cockpit de securite et de supervision.' },
  { id: 'admin.manage', module: 'admin', action: 'manage', label: 'Administrer la gouvernance', description: 'Pilote les regles globales, les comptes et la securite.' },

  { id: 'profile.view', module: 'profile', action: 'view', label: 'Voir son profil', description: 'Accede a ses informations personnelles.' },
  { id: 'notifications.view', module: 'notifications', action: 'view', label: 'Voir ses notifications', description: 'Consulte les alertes et informations individuelles.' }
];

var _pp = {
  catalog: [],
  byModule: {},
  rolePerms: {},
  locks: {},
  changelog: [],
  activeRole: 'syndic',
  saving: new Set(),
  viewAsReal: null
};

function _ppNormalizeCatalog(dbCatalog) {
  const map = new Map();

  (AUDIT_PERMISSION_CATALOG || []).forEach(item => {
    map.set(item.id, { ...item, auditOnly: false });
  });

  (dbCatalog || []).forEach(item => {
    const previous = map.get(item.id) || {};
    map.set(item.id, {
      ...previous,
      ...item,
      label: item.label || previous.label || item.id,
      description: item.description || previous.description || '',
      auditOnly: false
    });
  });

  return [...map.values()].sort((a, b) => {
    const modA = a.module || '';
    const modB = b.module || '';
    if (modA !== modB) return modA.localeCompare(modB, 'fr');
    return (a.label || a.id).localeCompare(b.label || b.id, 'fr');
  });
}

function _ppModuleOrder(modId) {
  const order = ['dashboard', 'tickets', 'map', 'messages', 'annonces', 'agenda', 'contacts', 'faq', 'documents', 'votes', 'registre', 'contrats', 'cles', 'rapport', 'journal', 'users', 'admin', 'permissions', 'profile', 'notifications'];
  const idx = order.indexOf(modId);
  return idx === -1 ? 999 : idx;
}

function _ppRoleAccessCount(role) {
  if (role === 'administrateur') return _pp.catalog.length;
  return _pp.catalog.filter(item => _pp.rolePerms[role]?.[item.id]).length;
}

function _ppRoleCoverage(role) {
  if (!_pp.catalog.length) return 0;
  return Math.round((_ppRoleAccessCount(role) / _pp.catalog.length) * 100);
}

function _ppCanToggle(role, perm) {
  return PERM_EDITABLE_ROLES.has(role) && !_pp.locks[role]?.locked;
}

function _ppRolePermEnabled(role, permId) {
  if (role === 'administrateur') return true;
  return _pp.rolePerms[role]?.[permId] === true;
}

function _ppRoleStatus(role) {
  if (role === 'administrateur') return 'Acces total';
  if (_pp.locks[role]?.locked) return 'Verrouille';
  const coverage = _ppRoleCoverage(role);
  if (coverage >= 70) return 'Acces etendu';
  if (coverage >= 35) return 'Acces encadre';
  return 'Acces restreint';
}

function _ppModuleRealPerms(perms) {
  return perms || [];
}

function _ppModuleViewPerm(perms) {
  return (perms || []).find(item => item.id === `${item.module}.view`) || null;
}

function _ppModuleActionablePerms(role, perms) {
  return _ppModuleRealPerms(perms).filter(item => _ppCanToggle(role, item));
}

function _ppModuleAllEnabled(role, perms) {
  const actionable = _ppModuleActionablePerms(role, perms);
  if (!actionable.length) return false;
  return actionable.every(item => _ppRolePermEnabled(role, item.id));
}

function _ppActionMeta(action) {
  return ACTIONS_META[action] || {
    label: action || 'Action',
    ico: '•',
    colorVar: '--text-2',
    bgVar: '--surface-2',
    borderVar: '--border'
  };
}

async function renderPermissionsPage() {
  if (typeof isAdmin === 'function' && !isAdmin()) {
    nav('dashboard');
    return;
  }

  $('page').innerHTML = `
  <style>
    .pp-wrap { padding-bottom: 100px; animation: pageIn .22s cubic-bezier(.4,0,.2,1) both; }
    .pp-header {
      display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;
      gap:16px; margin-bottom:28px; padding-bottom:24px; border-bottom:1px solid var(--border);
    }
    .pp-title { font-family:var(--font-head); font-size:26px; font-weight:800; letter-spacing:-.5px; color:var(--text); margin-bottom:4px; }
    .pp-subtitle { font-size:13px; color:var(--text-2); max-width:760px; line-height:1.6; }
    .pp-simulate {
      background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-lg);
      padding:12px 16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;
    }
    .pp-simulate-lbl {
      font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); margin-bottom:1px;
    }
    .pp-simulate-val { font-size:13px; font-weight:600; color:var(--text-2); }
    .pp-sim-banner {
      display:none; margin-bottom:20px; padding:14px 18px; background:var(--orange-light);
      border:1px solid var(--orange-border); border-radius:var(--r-md);
    }
    .pp-sim-banner-inner {
      display:flex; align-items:center; gap:10px; color:var(--orange); font-size:13px; font-weight:700;
    }
    .pp-summary-grid {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:22px;
    }
    .pp-summary-card {
      background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:16px;
      box-shadow:0 2px 8px rgba(0,0,0,.02);
    }
    .pp-summary-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; }
    .pp-summary-role { display:flex; align-items:center; gap:10px; min-width:0; }
    .pp-summary-icon {
      width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center;
      background:var(--surface-2); border:1px solid var(--border); font-size:17px; flex-shrink:0;
    }
    .pp-summary-name { font-size:13px; font-weight:800; color:var(--text); }
    .pp-summary-status { font-size:11px; color:var(--text-3); }
    .pp-summary-count { font-family:var(--font-head); font-size:28px; font-weight:900; letter-spacing:-.03em; color:var(--text); }
    .pp-summary-foot { display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-3); }
    .pp-progress {
      width:100%; height:8px; border-radius:999px; background:var(--surface-3); overflow:hidden; margin-bottom:8px;
    }
    .pp-progress > span { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--accent),var(--green)); }
    .pp-audit-note {
      display:flex; align-items:flex-start; gap:12px; padding:14px 16px; margin-bottom:20px;
      background:var(--surface-2); border:1px solid var(--border); border-radius:16px;
      font-size:13px; color:var(--text-2); line-height:1.6;
    }
    .pp-tabs { display:flex; gap:4px; margin-bottom:24px; border-bottom:1px solid var(--border); }
    .pp-tab {
      padding:10px 16px; font-size:13px; font-weight:700; color:var(--text-3); background:none;
      border:none; border-bottom:2px solid transparent; cursor:pointer; margin-bottom:-1px;
      transition:color var(--t-fast), border-color var(--t-fast); display:flex; align-items:center; gap:7px;
    }
    .pp-tab:hover { color:var(--text-2); }
    .pp-tab.active { color:var(--accent); border-bottom-color:var(--accent); }
    .pp-role-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; margin-bottom:24px; }
    .pp-role-card {
      background:var(--surface); border:1.5px solid var(--border); border-radius:18px; padding:14px 16px; cursor:pointer;
      transition:border-color var(--t-base), box-shadow var(--t-base), transform var(--t-base);
      display:flex; align-items:center; gap:10px; position:relative;
    }
    .pp-role-card:hover { border-color:var(--border-strong); transform:translateY(-1px); box-shadow:var(--shadow); }
    .pp-role-card.active { border-color:var(--accent); background:var(--accent-light); box-shadow:0 0 0 3px rgba(37,99,235,.08); }
    .pp-role-card.active::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--accent); border-radius:18px 18px 0 0;
    }
    .pp-role-ico {
      width:36px; height:36px; border-radius:12px; background:var(--surface-2); border:1px solid var(--border);
      display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0;
    }
    .pp-role-card.active .pp-role-ico { background:var(--accent-light); border-color:var(--accent-border); }
    .pp-role-name { font-size:13px; font-weight:800; color:var(--text); margin-bottom:2px; }
    .pp-role-desc { font-size:11px; color:var(--text-3); }
    .pp-role-check {
      margin-left:auto; width:18px; height:18px; border-radius:50%; background:var(--accent);
      display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:white; opacity:0;
      transition:opacity var(--t-fast); flex-shrink:0;
    }
    .pp-role-card.active .pp-role-check { opacity:1; }
  </style>

  <div class="pp-wrap">
    <div class="pp-header">
      <div>
        <h1 class="pp-title">Gouvernance & permissions</h1>
        <p class="pp-subtitle">Gestion complete des droits par role pour toute la copropriete. Cette vue te permet de couper ou autoriser la visibilite des pages et les actions de chaque role, module par module.</p>
      </div>
      <div class="pp-simulate">
        <div>
          <div class="pp-simulate-lbl">Mode test</div>
          <div class="pp-simulate-val">Simuler un profil</div>
        </div>
        <select id="view-as-select" class="select" style="width:190px; margin:0;" onchange="ppSimulateAs(this.value)">
          <option value="">- Choisir -</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
        <button id="view-as-stop" class="btn btn-danger btn-sm" style="display:none;" onclick="ppStopSimulation()">Quitter</button>
      </div>
    </div>

    <div id="view-as-banner" class="pp-sim-banner">
      <div class="pp-sim-banner-inner">
        <span style="font-size:20px;">👁</span>
        <div>Session de simulation active. Vous naviguez avec les droits du role <strong><span id="view-as-label"></span></strong>. Les modifications de navigation ne changent pas la base.</div>
      </div>
    </div>

    <div class="pp-summary-grid" id="pp-summary-grid"></div>

    <div class="pp-audit-note">
      <span style="font-size:18px; flex-shrink:0;">🧭</span>
      <div><strong>Usage admin :</strong> tout ce qui apparait dans cette page est maintenant pilotable. Les modules sensibles doivent rester limites a la gestion, en particulier <strong>Registre</strong>, <strong>Utilisateurs</strong>, <strong>Journal</strong> et <strong>Permissions</strong>.</div>
    </div>

    <div class="pp-tabs">
      <button class="pp-tab active" onclick="ppSwitchTab(this, 'matrix')">📊 Matrice des droits</button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'emergency')">🚨 Verrous d urgence</button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'logs')">📜 Historique</button>
    </div>

    <div id="pp-content-matrix">
      <div class="pp-section-title">Role a configurer</div>
      <div class="pp-role-row" id="pp-role-row">
        ${PERM_ROLES_LIST.map(r => {
          const meta = PERM_ROLE_META[r];
          return `
            <div class="pp-role-card ${r === _pp.activeRole ? 'active' : ''}" data-role="${r}" onclick="ppSelectRole('${r}')">
              <div class="pp-role-ico">${meta.icon}</div>
              <div style="flex:1; min-width:0;">
                <div class="pp-role-name">${PERM_ROLE_LABELS[r]}</div>
                <div class="pp-role-desc">${meta.desc}</div>
              </div>
              <div class="pp-role-check">✓</div>
            </div>`;
        }).join('')}
      </div>
      <div id="pp-matrix-grid"><div class="pp-loading"><div class="spin"></div></div></div>
    </div>

    <div id="pp-content-emergency" style="display:none;"></div>
    <div id="pp-content-logs" style="display:none;"></div>
  </div>`;

  await _ppLoadAll();
  _ppRenderSummary();
  _ppRenderMatrix();
}

async function _ppLoadAll() {
  const [catalog, locks, changelog] = await Promise.all([
    Permissions.loadCatalog(),
    Permissions.getRoleLocks(),
    Permissions.getChangeLog(50)
  ]);

  _pp.catalog = _ppNormalizeCatalog(catalog);
  _pp.locks = locks || {};
  _pp.changelog = changelog || [];
  _pp.byModule = {};

  _pp.catalog.forEach(item => {
    if (!_pp.byModule[item.module]) _pp.byModule[item.module] = [];
    _pp.byModule[item.module].push(item);
  });

  await Promise.all(PERM_ROLES_LIST.map(async role => {
    _pp.rolePerms[role] = role === 'administrateur'
      ? Object.fromEntries(_pp.catalog.map(item => [item.id, true]))
      : await Permissions.getPermissionsForRole(role);
  }));
}

function _ppRenderSummary() {
  const container = $('pp-summary-grid');
  if (!container) return;

  container.innerHTML = PERM_ROLES_LIST.map(role => {
    const meta = PERM_ROLE_META[role];
    const count = _ppRoleAccessCount(role);
    const coverage = _ppRoleCoverage(role);
    const status = _ppRoleStatus(role);
    const isLocked = _pp.locks[role]?.locked === true;

    return `
      <div class="pp-summary-card">
        <div class="pp-summary-top">
          <div class="pp-summary-role">
            <div class="pp-summary-icon">${meta.icon}</div>
            <div>
              <div class="pp-summary-name">${PERM_ROLE_LABELS[role]}</div>
              <div class="pp-summary-status">${isLocked ? 'Acces suspendu' : status}</div>
            </div>
          </div>
          <div class="pp-summary-count">${count}</div>
        </div>
        <div class="pp-progress"><span style="width:${coverage}%;"></span></div>
        <div class="pp-summary-foot">
          <span>${coverage}% du catalogue</span>
          <span>${count}/${_pp.catalog.length} droits</span>
        </div>
      </div>`;
  }).join('');
}

function ppSwitchTab(btn, target) {
  document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['matrix', 'emergency', 'logs'].forEach(t => {
    $(`pp-content-${t}`).style.display = t === target ? 'block' : 'none';
  });
  if (target === 'emergency') _ppRenderEmergency();
  if (target === 'logs') _ppRenderLogs();
}

function ppSelectRole(role) {
  _pp.activeRole = role;
  document.querySelectorAll('.pp-role-card').forEach(card => {
    card.classList.toggle('active', card.dataset.role === role);
  });
  _ppRenderMatrix();
}

function _ppRenderMatrix() {
  const container = $('pp-matrix-grid');
  const role = _pp.activeRole;
  const isLocked = _pp.locks[role]?.locked === true;
  const isReadOnlyRole = !PERM_EDITABLE_ROLES.has(role);

  const extraCss = `
    <style>
      .pp-focus-banner, .pp-lock-banner {
        border-radius:16px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:flex-start; gap:12px;
        font-size:13px; line-height:1.6;
      }
      .pp-focus-banner { background:var(--amber-light); border:1px solid var(--amber-border); color:var(--amber); }
      .pp-lock-banner { background:var(--red-light); border:1px solid var(--red-border); color:var(--red); font-weight:700; }
      .pp-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
      .pp-table-head {
        display:grid; grid-template-columns:1fr 130px 92px; background:var(--surface-2); border-bottom:1px solid var(--border);
        padding:10px 20px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3);
      }
      .pp-module { border-bottom:1px solid var(--border); }
      .pp-module:last-child { border-bottom:none; }
      .pp-module-sensitive { border-left:3px solid var(--amber); }
      .pp-module-header {
        display:flex; justify-content:space-between; align-items:center; padding:13px 20px; cursor:pointer;
        background:var(--surface-2); transition:background var(--t-fast);
      }
      .pp-module-header:hover { background:var(--surface-3); }
      .pp-module-sensitive .pp-module-header { background:rgba(245,158,11,.06); }
      .pp-module-left { display:flex; align-items:center; gap:10px; }
      .pp-module-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
      .pp-module-icon {
        width:28px; height:28px; border-radius:8px; background:var(--surface); border:1px solid var(--border);
        display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;
      }
      .pp-module-name { font-family:var(--font-head); font-size:13px; font-weight:700; color:var(--text); }
      .pp-module-count, .pp-module-badge {
        display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:700;
        border:1px solid var(--border);
      }
      .pp-module-count { background:var(--surface-3); color:var(--text-3); }
      .pp-module-count.full { background:var(--green-light); color:var(--green); border-color:var(--green-border); }
      .pp-module-count.zero { background:var(--surface-2); color:var(--text-3); }
      .pp-module-badge { background:var(--amber-light); color:var(--amber); border-color:var(--amber-border); }
      .pp-module-quick {
        display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid var(--border);
        background:var(--surface); color:var(--text-2); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
      }
      .pp-module-quick.on { background:var(--green-light); color:var(--green); border-color:var(--green-border); }
      .pp-module-quick.off { background:var(--red-light); color:var(--red); border-color:var(--red-border); }
      .pp-module-quick:disabled { opacity:.5; }
      .pp-module-chevron { color:var(--text-3); transition:transform .2s ease; }
      .pp-module-chevron.open { transform:rotate(180deg); }
      .pp-perm-row {
        display:grid; grid-template-columns:1fr 130px 92px; align-items:center; padding:11px 20px;
        border-top:1px solid var(--border); transition:background var(--t-fast); gap:12px;
      }
      .pp-perm-row:hover { background:var(--bg); }
      .pp-perm-label { font-size:13px; font-weight:700; color:var(--text); margin-bottom:2px; }
      .pp-perm-desc { font-size:11px; color:var(--text-3); line-height:1.5; }
      .pp-perm-flags { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
      .pp-flag {
        display:inline-flex; align-items:center; padding:2px 7px; border-radius:999px;
        font-size:10px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; border:1px solid;
      }
      .pp-action-tag {
        display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:800; text-transform:uppercase;
        letter-spacing:.04em; padding:3px 9px; border-radius:var(--r-xs); border:1px solid; width:fit-content;
      }
      .pp-toggle {
        width:42px; height:22px; border-radius:11px; background:var(--border-strong); border:1.5px solid var(--border);
        position:relative; cursor:pointer; display:block; margin:0 auto; transition:background .28s, border-color .28s, box-shadow .28s;
      }
      .pp-toggle.on { background:var(--green); border-color:var(--green); box-shadow:0 0 0 3px var(--green-light); }
      .pp-toggle::after {
        content:''; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:white;
        transition:transform .28s; box-shadow:0 1px 3px rgba(0,0,0,.2);
      }
      .pp-toggle.on::after { transform:translateX(20px); }
      .pp-toggle.saving, .pp-toggle:disabled { opacity:.45; pointer-events:none; }
      .pp-readonly-note {
        background:var(--surface-2); border:1px solid var(--border); border-radius:16px; padding:14px 16px; margin-bottom:16px;
        font-size:13px; color:var(--text-2); line-height:1.6;
      }
      @media (max-width: 880px) {
        .pp-table-head { display:none; }
        .pp-perm-row { grid-template-columns:1fr; align-items:flex-start; }
        .pp-action-tag { margin-top:4px; }
      }
    </style>`;

  let html = extraCss;

  if (isReadOnlyRole) {
    html += `<div class="pp-readonly-note"><strong>${PERM_ROLE_LABELS[role]} :</strong> ce profil est visible ici comme reference. Son acces reste complet et n est pas configurable depuis cette matrice.</div>`;
  }
  html += `<div class="pp-readonly-note"><strong>Mode admin :</strong> tu configures ici <strong>${PERM_ROLE_LABELS[role]}</strong>. Le role connecte reste administrateur, mais les interrupteurs modifient les droits du role selectionne. Utilise les actions rapides <strong>Page</strong> et <strong>Tout</strong> pour couper un module en un clic.</div>`;

  if (isLocked) {
    html += `<div class="pp-lock-banner"><span style="font-size:18px;">⛔</span><div>Ce role est actuellement verrouille. Toutes les permissions effectives sont suspendues jusqu a reactivation.</div></div>`;
  }

  html += `<div class="pp-focus-banner"><span style="font-size:18px;">🔍</span><div><strong>Point de vigilance :</strong> le <strong>Registre</strong> ne doit pas etre visible par tous. Recommandation metier : reservez le registre, les contrats, le journal, la base residents et les permissions a l administrateur, au conseil syndical et, selon besoin, au syndic. Le coproprietaire doit rester sur un perimetre de consultation resident.</div></div>`;

  html += `<div class="pp-table-wrap">
    <div class="pp-table-head">
      <div>Fonctionnalite / Permission</div>
      <div>Action</div>
      <div style="text-align:center;">Acces</div>
    </div>`;

  const modules = Object.entries(_pp.byModule).sort(([a], [b]) => _ppModuleOrder(a) - _ppModuleOrder(b));

  modules.forEach(([modId, perms]) => {
    const grantedCount = perms.filter(item => _ppRolePermEnabled(role, item.id)).length;
    const isFull = grantedCount === perms.length && perms.length > 0;
    const isZero = grantedCount === 0;
    const countClass = isFull ? 'full' : isZero ? 'zero' : '';
    const label = PERM_MODULE_LABELS[modId] || modId;
    const icon = PERM_MODULE_ICONS[modId] || '📦';
    const sensitive = SENSITIVE_MODULES.has(modId);
    const viewPerm = _ppModuleViewPerm(perms);
    const canQuickView = viewPerm && _ppCanToggle(role, viewPerm);
    const viewEnabled = viewPerm ? _ppRolePermEnabled(role, viewPerm.id) : false;
    const moduleAllEnabled = _ppModuleAllEnabled(role, perms);
    const actionableCount = _ppModuleActionablePerms(role, perms).length;

    html += `
      <div class="pp-module ${sensitive ? 'pp-module-sensitive' : ''}">
        <div class="pp-module-header" onclick="ppToggleModuleUI('${modId}')">
          <div class="pp-module-left">
            <div class="pp-module-icon">${icon}</div>
            <span class="pp-module-name">${label}</span>
            ${sensitive ? '<span class="pp-module-badge">Sensible</span>' : ''}
            <span class="pp-module-count ${countClass}">${grantedCount}/${perms.length}</span>
          </div>
          <div class="pp-module-right">
            ${viewPerm ? `<button class="pp-module-quick ${viewEnabled ? 'on' : 'off'}" ${canQuickView ? `onclick="event.stopPropagation(); ppToggleModuleVisibility('${role}', '${modId}', ${!viewEnabled})"` : 'disabled'}>Page</button>` : ''}
            ${actionableCount ? `<button class="pp-module-quick ${moduleAllEnabled ? 'on' : 'off'}" onclick="event.stopPropagation(); ppToggleModuleAll('${role}', '${modId}', ${!moduleAllEnabled})">Tout</button>` : ''}
            <svg id="pp-chev-${modId}" class="pp-module-chevron open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
        <div id="pp-body-${modId}">
          ${perms.map(item => {
            const enabled = _ppRolePermEnabled(role, item.id);
            const meta = _ppActionMeta(item.action);
            const canToggle = _ppCanToggle(role, item);
            const savingKey = `${role}:${item.id}`;
            const isSaving = _pp.saving.has(savingKey);
            return `
              <div class="pp-perm-row">
                <div>
                  <div class="pp-perm-label">${escHtml(item.label)}</div>
                  <div class="pp-perm-desc">${escHtml(item.description || '')}</div>
                  <div class="pp-perm-flags">
                    ${sensitive ? '<span class="pp-flag" style="background:var(--amber-light); color:var(--amber); border-color:var(--amber-border);">Sensible</span>' : ''}
                    ${modId === 'registre' && role === 'copropriétaire' ? '<span class="pp-flag" style="background:var(--red-light); color:var(--red); border-color:var(--red-border);">A limiter</span>' : ''}
                  </div>
                </div>
                <div>
                  <span class="pp-action-tag" style="color:var(${meta.colorVar}); background:var(${meta.bgVar}); border-color:var(${meta.borderVar});">
                    ${meta.ico} ${meta.label}
                  </span>
                </div>
                <div style="text-align:center;">
                  <button class="pp-toggle ${enabled ? 'on' : ''} ${isSaving ? 'saving' : ''}"
                    ${canToggle ? `onclick="ppTogglePerm('${role}', '${item.id}', ${!enabled})"` : 'disabled'}>
                  </button>
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
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', hidden);
}

async function ppTogglePerm(role, permId, targetState) {
  const perm = _pp.catalog.find(item => item.id === permId);
  if (!perm || !_ppCanToggle(role, perm)) return;

  const key = `${role}:${permId}`;
  _pp.saving.add(key);
  _ppRenderMatrix();

  try {
    const ok = await Permissions.setPermission(role, permId, targetState, perm);
    if (!ok) throw new Error('save_failed');
    _pp.rolePerms[role][permId] = targetState;
    _ppRenderSummary();
    _ppRenderMatrix();
    toast(`Droits mis a jour - ${PERM_ROLE_LABELS[role]}`, 'ok');
  } catch (e) {
    toast('Erreur de sauvegarde', 'err');
  } finally {
    _pp.saving.delete(key);
    _ppRenderMatrix();
  }
}

async function ppToggleModuleVisibility(role, moduleId, targetState) {
  const perms = _pp.byModule[moduleId] || [];
  const viewPerm = _ppModuleViewPerm(perms);
  if (!viewPerm || !_ppCanToggle(role, viewPerm)) return;
  await ppTogglePerm(role, viewPerm.id, targetState);
}

async function ppToggleModuleAll(role, moduleId, targetState) {
  const perms = _pp.byModule[moduleId] || [];
  const actionable = _ppModuleActionablePerms(role, perms);
  if (!actionable.length) return;

  const previous = {};
  actionable.forEach(item => {
    previous[item.id] = _pp.rolePerms[role]?.[item.id] === true;
    _pp.rolePerms[role][item.id] = targetState;
  });
  _ppRenderSummary();
  _ppRenderMatrix();

  try {
    const results = await Promise.all(actionable.map(item =>
      Permissions.setPermission(role, item.id, targetState, item)
    ));
    if (results.some(ok => !ok)) throw new Error('save_failed');
    toast(`Module ${PERM_MODULE_LABELS[moduleId] || moduleId} mis a jour`, 'ok');
  } catch (e) {
    actionable.forEach(item => {
      _pp.rolePerms[role][item.id] = previous[item.id];
    });
    _ppRenderSummary();
    _ppRenderMatrix();
    toast('Erreur de sauvegarde du module', 'err');
  }
}

function _ppRenderEmergency() {
  const container = $('pp-content-emergency');
  container.innerHTML = `
    <style>
      .pp-emergency-list { display:flex; flex-direction:column; gap:10px; }
      .pp-emergency-card {
        display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border:1.5px solid var(--border);
        border-radius:var(--r-lg); background:var(--surface); transition:border-color var(--t-base), background var(--t-base);
      }
      .pp-emergency-card.locked { border-color:var(--red-border); background:var(--red-light); }
      .pp-emergency-left { display:flex; align-items:center; gap:12px; }
      .pp-emergency-name { font-size:14px; font-weight:800; color:var(--text); margin-bottom:3px; }
      .pp-emergency-status { font-size:12px; font-weight:700; display:flex; align-items:center; gap:5px; }
      .pp-emergency-status.ok { color:var(--green); }
      .pp-emergency-status.locked { color:var(--red); }
      @media (max-width: 880px) {
        .pp-emergency-card { align-items:flex-start; gap:12px; flex-direction:column; }
      }
    </style>
    <div style="max-width:720px;">
      <div class="pp-section-title">Arret d urgence par role</div>
      <p style="font-size:13px; color:var(--text-2); margin-bottom:20px; line-height:1.6;">
        Suspendez integralement l acces d un role en cas d abus, de maintenance critique ou de fuite d information.
        Le profil administrateur n apparait pas ici car il ne doit pas etre verrouille a la legere.
      </p>
      <div class="pp-emergency-list">
        ${PERM_ROLES_LIST.filter(role => role !== 'administrateur').map(role => {
          const locked = _pp.locks[role]?.locked === true;
          const meta = PERM_ROLE_META[role];
          return `
            <div class="pp-emergency-card ${locked ? 'locked' : ''}">
              <div class="pp-emergency-left">
                <div class="pp-role-ico">${meta.icon}</div>
                <div>
                  <div class="pp-emergency-name">${PERM_ROLE_LABELS[role]}</div>
                  <div class="pp-emergency-status ${locked ? 'locked' : 'ok'}">
                    ${locked ? '🚫 Acces suspendu' : '✅ Acces operationnel'}
                  </div>
                </div>
              </div>
              <button class="btn ${locked ? 'btn-accent' : 'btn-danger'} btn-sm" onclick="ppToggleRoleLock('${role}', ${!locked})">
                ${locked ? 'Retablir' : 'Verrouiller'}
              </button>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

async function ppToggleRoleLock(role, locked) {
  let reason = '';
  if (locked) reason = prompt('Raison du verrouillage (visible par les residents) :') || 'Maintenance';
  const ok = await Permissions.setRoleLock(role, locked, reason);
  if (!ok) {
    toast('Erreur de sauvegarde', 'err');
    return;
  }

  _pp.locks[role] = { ...( _pp.locks[role] || {} ), locked };
  _ppRenderSummary();
  _ppRenderEmergency();
  _ppRenderMatrix();
  toast('Verrouillage mis a jour', locked ? 'warn' : 'ok');
}

async function ppSimulateAs(role) {
  if (!role) {
    ppStopSimulation();
    return;
  }

  if (!_pp.viewAsReal) _pp.viewAsReal = { ...profile };
  profile = { ..._pp.viewAsReal, role };
  await Permissions.load();
  if (typeof initUI === 'function') initUI();
  $('view-as-banner').style.display = 'block';
  $('view-as-label').textContent = PERM_ROLE_LABELS[role].toUpperCase();
  $('view-as-stop').style.display = 'inline-flex';
  $('view-as-select').value = role;
  toast(`Simulation active : ${PERM_ROLE_LABELS[role]}`, 'warn');
  nav(Permissions.getDefaultPage());
}

async function ppStopSimulation() {
  if (!_pp.viewAsReal) return;
  profile = { ..._pp.viewAsReal };
  _pp.viewAsReal = null;
  await Permissions.load();
  if (typeof initUI === 'function') initUI();
  $('view-as-banner').style.display = 'none';
  $('view-as-stop').style.display = 'none';
  $('view-as-select').value = '';
  nav('permissions');
  toast('Retour au mode administrateur', 'ok');
}

async function _ppRenderLogs() {
  const container = $('pp-content-logs');
  const logs = await Permissions.getChangeLog(50);

  function logMeta(action) {
    if (action === 'granted') return { label: 'Accorde', cls: 'granted' };
    if (action === 'revoked') return { label: 'Revoque', cls: 'revoked' };
    if (action === 'role_locked') return { label: 'Verrouille', cls: 'locked' };
    if (action === 'role_unlocked') return { label: 'Retabli', cls: 'unlocked' };
    return { label: action || 'Action', cls: 'unlocked' };
  }

  container.innerHTML = `
    <style>
      .pp-logs-head {
        display:grid; grid-template-columns:110px 1fr 180px 130px; padding:10px 20px; background:var(--surface-2);
        border-bottom:1px solid var(--border); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3);
      }
      .pp-logs-row {
        display:grid; grid-template-columns:110px 1fr 180px 130px; padding:11px 20px; border-top:1px solid var(--border);
        font-size:12px; align-items:center; transition:background var(--t-fast); color:var(--text);
      }
      .pp-logs-row:hover { background:var(--bg); }
      .pp-log-action {
        display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:800; border:1px solid;
      }
      .pp-log-action.granted { background:var(--green-light); color:var(--green); border-color:var(--green-border); }
      .pp-log-action.revoked { background:var(--red-light); color:var(--red); border-color:var(--red-border); }
      .pp-log-action.locked { background:var(--orange-light); color:var(--orange); border-color:var(--orange-border); }
      .pp-log-action.unlocked { background:var(--accent-light); color:var(--accent); border-color:var(--accent-border); }
      @media (max-width: 880px) {
        .pp-logs-head { display:none; }
        .pp-logs-row { grid-template-columns:1fr; gap:8px; }
      }
    </style>
    <div class="pp-table-wrap">
      <div class="pp-logs-head">
        <div>Action</div>
        <div>Cible</div>
        <div>Auteur</div>
        <div style="text-align:right;">Date</div>
      </div>
      ${logs.length ? logs.map(log => {
        const meta = logMeta(log.action);
        return `
          <div class="pp-logs-row">
            <div><span class="pp-log-action ${meta.cls}">${meta.label}</span></div>
            <div style="font-weight:600;">
              ${escHtml(log.permission || '*')}
              <span style="color:var(--text-3); font-weight:400;"> - ${escHtml(log.role || '')}</span>
            </div>
            <div style="color:var(--text-2); font-weight:600;">${escHtml(log.admin_nom || 'Administrateur')}</div>
            <div style="text-align:right; color:var(--text-3);">${fmt(log.created_at)}</div>
          </div>`;
      }).join('') : `<div style="padding:40px; text-align:center; color:var(--text-3); font-size:14px;">Aucun historique disponible.</div>`}
    </div>`;
}
