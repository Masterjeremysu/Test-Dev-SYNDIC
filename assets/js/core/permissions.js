// ════════════════════════════════════════════════════════════════
//  COPROSYNC — Moteur de permissions dynamiques
//  assets/js/core/permissions.js
//
//  DOIT être chargé AVANT helpers.js dans index.html.
//  Expose l'objet global window.Permissions.
// ════════════════════════════════════════════════════════════════

window.Permissions = (function () {

  let _cache   = {};      // { permId: boolean }
  let _locked  = false;   // true = rôle verrouillé, aucune permission
  let _loaded  = false;
  let _catalog = [];      // liste complète des permissions (pour la page admin)
  let _rtChan  = null;    // canal Realtime

  // ── Mapping module → pages de navigation ─────────────────────
  const MODULE_TO_PAGES = {
    dashboard:   ['dashboard'],
    tickets:     ['tickets'],
    map:         ['map'],
    messages:    ['messages'],
    annonces:    ['annonces'],
    agenda:      ['agenda'],
    contacts:    ['contacts'],
    faq:         ['faq'],
    documents:   ['documents'],
    votes:       ['votes'],
    rapport:     ['rapport'],
    contrats:    ['contrats'],
    cles:        ['cles'],
    journal:     ['journal'],
    users:       ['users'],
    permissions: ['permissions'],
  };

  // ────────────────────────────────────────────────────────────
  //  CHARGEMENT
  // ────────────────────────────────────────────────────────────

  async function load() {
  const role = profile?.role;   // pas window.profile
  if (!role) return;
  if (role === 'administrateur') {
    _locked = false;
    _loaded = true;
    return;
  }

    try {
      // 1. Vérification verrou de rôle
      const { data: lockData } = await sb
        .from('role_locks')
        .select('locked')
        .eq('role', role)
        .maybeSingle();

      _locked = lockData?.locked === true;

      if (_locked) {
        _cache = {};
        _loaded = true;
        return;
      }

      // 2. Chargement des permissions du rôle
      const { data: rpData } = await sb
        .from('role_permissions')
        .select('permission, granted')
        .eq('role', role);

      _cache = {};
      (rpData || []).forEach(rp => { _cache[rp.permission] = rp.granted === true; });
      _loaded = true;

    } catch (e) {
      console.error('[Permissions.load]', e.message);
      _cache  = {};
      _loaded = true;
    }
  }

  async function loadCatalog() {
    const { data } = await sb
      .from('permissions')
      .select('*')
      .order('module')
      .order('action');
    _catalog = data || [];
    return _catalog;
  }

  // ────────────────────────────────────────────────────────────
  //  VÉRIFICATION
  // ────────────────────────────────────────────────────────────

  function has(permId) {
    if (profile?.role === 'administrateur') return true;
    if (_locked) return false;
    return _cache[permId] === true;
  }

  // ────────────────────────────────────────────────────────────
  //  NAVIGATION
  // ────────────────────────────────────────────────────────────

  function getAccessiblePages() {
  if (profile?.role === 'administrateur') {
    return [
      'dashboard','tickets','map','messages',
      'annonces','agenda','contacts','faq','documents','votes',
      'rapport','contrats','cles','journal','users','permissions',
      'profile','notifications'
    ];
  }
  if (_locked) return ['profile', 'notifications'];
  const pages = new Set(['profile', 'notifications']);
  Object.entries(MODULE_TO_PAGES).forEach(([mod, modPages]) => {
    if (has(mod + '.view')) modPages.forEach(p => pages.add(p));
  });
  return [...pages];
}

  function getDefaultPage() {
  if (profile?.role === 'administrateur') return 'dashboard';
  if (has('dashboard.view')) return 'dashboard';
  if (has('tickets.view'))   return 'tickets';
  if (has('rapport.view'))   return 'rapport';
  return 'profile';
}

  // ────────────────────────────────────────────────────────────
  //  REALTIME
  // ────────────────────────────────────────────────────────────

  function startRealtime() {
    const role = profile?.role;
    if (!role || role === 'administrateur' || _rtChan) return;

    _rtChan = sb.channel('perm-watch-' + role)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'role_permissions',
        filter: 'role=eq.' + role
      }, async () => {
        await load();
        _applyToCurrentUI();
        if (typeof window.toast === 'function') window.toast('⚡ Vos permissions ont été mises à jour', 'warn');
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'role_locks',
        filter: 'role=eq.' + role
      }, async (payload) => {
        _locked = payload.new?.locked === true;
        if (_locked) {
          _cache = {};
          if (typeof window.toast === 'function') window.toast('🔒 Votre accès a été temporairement suspendu', 'err');
        } else {
          await load();
          if (typeof window.toast === 'function') window.toast('🔓 Votre accès a été rétabli', 'ok');
        }
        _applyToCurrentUI();
      })
      .subscribe();
  }

  function _applyToCurrentUI() {
    if (typeof window.initUI === 'function') window.initUI();
    const accessible = getAccessiblePages();
    if (!accessible.includes(window.currentPage)) {
      if (typeof window.nav === 'function') window.nav(getDefaultPage());
    } else {
      if (typeof window.renderPage === 'function') window.renderPage(window.currentPage);
    }
  }

  function stopRealtime() {
    if (_rtChan) { sb.removeChannel(_rtChan); _rtChan = null; }
  }

  // ────────────────────────────────────────────────────────────
  //  API ADMIN
  // ────────────────────────────────────────────────────────────

  async function setPermission(role, permId, granted) {
    if (profile?.role !== 'administrateur') return false;
    const { error } = await sb.from('role_permissions').upsert(
      { role, permission: permId, granted, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'role,permission' }
    );
    if (error) { if (typeof window.toast === 'function') window.toast('Erreur : ' + error.message, 'err'); return false; }
    await sb.from('permission_changes_log').insert({
      admin_id: user.id,
      admin_nom: typeof window.displayNameFromProfile === 'function' ? window.displayNameFromProfile(profile, user?.email) : 'Admin',
      role, permission: permId, action: granted ? 'granted' : 'revoked'
    });
    return true;
  }

  async function setRoleLock(role, locked, reason) {
    if (profile?.role !== 'administrateur') return false;
    const { error } = await sb.from('role_locks').upsert(
      { role, locked, locked_by: locked ? user.id : null, locked_at: locked ? new Date().toISOString() : null, reason: locked ? (reason || null) : null },
      { onConflict: 'role' }
    );
    if (error) return false;
    await sb.from('permission_changes_log').insert({
      admin_id: user.id,
      admin_nom: typeof window.displayNameFromProfile === 'function' ? window.displayNameFromProfile(profile, user?.email) : 'Admin',
      role, permission: '*', action: locked ? 'role_locked' : 'role_unlocked'
    });
    return true;
  }

  async function getPermissionsForRole(role) {
    const { data } = await sb.from('role_permissions').select('permission, granted').eq('role', role);
    const map = {};
    (data || []).forEach(rp => { map[rp.permission] = rp.granted === true; });
    return map;
  }

  async function getRoleLocks() {
    const { data } = await sb.from('role_locks').select('*');
    const map = {};
    (data || []).forEach(rl => { map[rl.role] = rl; });
    return map;
  }

  async function getChangeLog(limit) {
    const { data } = await sb.from('permission_changes_log')
      .select('*').order('created_at', { ascending: false }).limit(limit || 100);
    return data || [];
  }

  // ────────────────────────────────────────────────────────────
  //  API PUBLIQUE
  // ────────────────────────────────────────────────────────────
  return {
    load, loadCatalog,
    has,
    getAccessiblePages, getDefaultPage,
    startRealtime, stopRealtime,
    setPermission, setRoleLock,
    getPermissionsForRole, getRoleLocks, getChangeLog,
    getCatalog: () => _catalog,
    isLoaded:   () => _loaded,
    isLocked:   () => _locked,
  };
})();
