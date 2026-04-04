// ── INIT ──
let _initDone = false;

sb.auth.onAuthStateChange(async (event, session) => {
  dbg('[auth]', event, !!session?.user, '| initDone:', _initDone);
  if (!_initDone) return;

  if (!session?.user || event === 'SIGNED_OUT') {
    _appStarted = false;
    $('login-screen').style.display = 'flex';
    $('app').style.display = 'none';
    user = null; profile = null;
    return;
  }
  $('auth-btn').disabled = false;
  $('auth-btn-text').textContent = 'Se connecter';
  if (_appStarted) { dbg('[auth] already started, skip'); return; }
  user = session.user;
  await loadProfile();
  if (profile?.actif === false) {
    await sb.auth.signOut();
    showAuthError('⊘ Votre compte a été suspendu. Contactez le conseil syndical.');
    $('auth-btn').disabled = false;
    $('auth-btn-text').textContent = 'Se connecter';
    return;
  }
  await startApp();
});

let _appStarted = false;
let _connInitDone = false;
let _connWasOffline = false;

function initConnectionStatus() {
  if (_connInitDone) return;
  _connInitDone = true;
  let banner = $('connection-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'connection-banner';
    banner.className = 'connection-banner';
    document.body.appendChild(banner);
  }
  const update = () => {
    const online = navigator.onLine;
    if (!online) {
      _connWasOffline = true;
      banner.textContent = '⚠ Connexion perdue - mode dégradé';
      banner.classList.add('show', 'offline');
      banner.classList.remove('online');
      return;
    }
    if (_connWasOffline) {
      banner.textContent = '✓ Connexion rétablie';
      banner.classList.add('show', 'online');
      banner.classList.remove('offline');
      setTimeout(() => banner.classList.remove('show'), 2200);
      _connWasOffline = false;
    } else {
      banner.classList.remove('show');
    }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

async function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  dbg('[startApp] role:', profile?.role);
  $('auth-btn').disabled = false;
  $('auth-btn-text').textContent = 'Se connecter';
  initTheme();
  try {
    $('login-screen').style.display = 'none';
    $('app').style.display = 'flex';

    // ── Chargement des permissions AVANT initUI ──
    // C'est l'ordre critique : Permissions doit être prêt avant
    // qu'on calcule quels items de menu afficher.
    await Permissions.load();

    initUI();
    initConnectionStatus();

    // Démarrage du Realtime permissions (mises à jour instantanées)
    Permissions.startRealtime();

    await loadAll();
    nav(Permissions.getDefaultPage());
    registerSW();
    startRealtime();
    initSwipeToClose();
    initPullToRefresh();
    setTimeout(checkOnboarding, 1500);

    setInterval(async () => {
      const { data } = await sb.from('profiles').select('actif').eq('id', user.id).single();
      if (data?.actif === false) { await sb.auth.signOut(); location.reload(); }
    }, 2 * 60 * 1000);
  } catch (e) {
    err('[startApp] ERREUR:', e);
    showAuthError('Erreur au démarrage de l\'application. Réessayez dans quelques secondes.');
    toast('Erreur démarrage: ' + (e?.message || 'inconnue'), 'err');
    _appStarted = false;
    $('login-screen').style.display = 'flex';
    $('app').style.display = 'none';
  }
}

async function loadProfile() {
  dbg('[loadProfile] start, user.id=', user?.id);
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
    const query = sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data } = await Promise.race([query, timeout]);
    if (data) {
      profile = data;
    } else {
      const meta = user.user_metadata || {};
      profile = { id: user.id, email: user.email, nom: meta.nom || null, prenom: meta.prenom || null, role: meta.role || 'copropriétaire', tour: meta.tour || null, lot: meta.lot || null };
    }
    dbg('[loadProfile] role =', profile.role);
  } catch (e) {
    err('[loadProfile] CRASH/TIMEOUT:', e.message);
    try { const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle(); if (data) { profile = data; return; } } catch {}
    const meta = user.user_metadata || {};
    profile = { id: user.id, email: user.email, nom: meta.nom || null, prenom: meta.prenom || null, role: meta.role || 'copropriétaire' };
  }
}

function initUI() {
  if (!profile) return;

  // Avatar
  const init = (profile.nom || '').charAt(0).toUpperCase() + (profile.prenom || '').charAt(0).toUpperCase();
  const avEl = $('nav-av');
  if (avEl) {
    avEl.textContent = init || '?';
    const roleCls = { administrateur: 'role-admin', syndic: 'role-syndic', membre_cs: 'role-cs' };
    avEl.className = 'user-av ' + (roleCls[profile.role] || '');
  }
  if ($('nav-nom')) $('nav-nom').textContent = displayNameFromProfile(profile, user?.email);
  const roleLabels = { administrateur: 'Administrateur', syndic: 'Syndic', membre_cs: 'Conseil Syndical', 'copropriétaire': 'Copropriétaire' };
  if ($('nav-role')) $('nav-role').textContent = roleLabels[profile.role] || profile.role;

  // Admin : tout afficher sans condition
  if (profile.role === 'administrateur') {
    document.querySelectorAll('.nav-item').forEach(el => el.style.display = '');
    document.querySelectorAll('.nav-section').forEach(el => el.style.display = '');
    return;
  }

  // Autres rôles : filtre par permissions
  const accessible = Permissions.getAccessiblePages();
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.style.display = accessible.includes(el.getAttribute('data-page')) ? '' : 'none';
  });

  document.querySelectorAll('.nav-section').forEach(section => {
    let next = section.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('nav-section') && !next.classList.contains('sidebar-footer')) {
      if (next.classList.contains('nav-item') && next.style.display !== 'none') { hasVisible = true; break; }
      next = next.nextElementSibling;
    }
    section.style.display = hasVisible ? '' : 'none';
  });

  if (isSyndic()) {
    const topbarBtn = document.querySelector('#topbar .btn-primary');
    if (topbarBtn) topbarBtn.style.display = 'none';
    const bnBtn = document.querySelector('.bn-signaler');
    if (bnBtn) bnBtn.style.display = 'none';
  }
}

async function loadAll() {
  try {
    await loadTickets();
    if (currentPage === 'dashboard') renderDashboard();

    const tasks = [];
    if (Permissions.has('contrats.view'))  tasks.push(loadContrats());
    if (Permissions.has('cles.view'))      tasks.push(loadCles());
    if (Permissions.has('journal.view'))   tasks.push(loadJournal());
    tasks.push(loadAnnonceCache());
    tasks.push(loadEvenementsCache());
    if (Permissions.has('contacts.view')) tasks.push(loadContactsCache());

    await Promise.all(tasks);
    updateBadges();
    checkNotifications();
    if (currentPage === 'dashboard') renderDashboard();
  } catch (e) {
    err('loadAll error:', e);
  }
}
