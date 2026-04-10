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
    window._currentCoproId = null; // Nettoyage
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

    // ── Patch Dev Expert : Remplacement du Polling par du Realtime ──
    sb.channel('profile-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          if (payload.new && payload.new.actif === false) {
            // Déconnexion propre sans forcer un reload brutal qui casse l'UX
            await sb.auth.signOut();
            window.location.href = '/'; 
          }
        }
      )
      .subscribe();

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
      // 🔥 FIX CRITIQUE : Lier la variable globale au profil pour le Registre
      if (profile.copro_id) {
        window._currentCoproId = profile.copro_id;
      }
    } else {
      const meta = user.user_metadata || {};
      profile = { id: user.id, email: user.email, nom: meta.nom || null, prenom: meta.prenom || null, role: meta.role || 'copropriétaire', tour: meta.tour || null, lot: meta.lot || null };
    }
    dbg('[loadProfile] role =', profile.role);
  } catch (e) {
    err('[loadProfile] CRASH/TIMEOUT:', e.message);
    try { 
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle(); 
      if (data) { 
        profile = data; 
        if (profile.copro_id) window._currentCoproId = profile.copro_id; // Ajout sécurité ici aussi
        return; 
      } 
    } catch {}
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
    // 1. Chargement critique initial
    await loadTickets();
    if (currentPage === 'dashboard') renderDashboard();

    // 2. Tâches de fond
    const tasks = [];
    if (Permissions.has('contrats.view'))  tasks.push(loadContrats());
    if (Permissions.has('cles.view'))      tasks.push(loadCles());
    if (Permissions.has('journal.view'))   tasks.push(loadJournal());
    tasks.push(loadAnnonceCache());
    tasks.push(loadEvenementsCache());
    if (Permissions.has('contacts.view')) tasks.push(loadContactsCache());

    // 🔥 RESTAURATION ANTI-RÉGRESSION : On appelle la VRAIE fonction des votes
    tasks.push((async () => {
      try {
        if (typeof loadVotes === 'function') {
          await loadVotes();
        }
      } catch(e) {
        console.warn('[loadAll] Erreur chargement votes:', e);
      }
    })());

    // On attend que TOUT soit chargé
    await Promise.all(tasks);
    
    // 3. Mise à jour de l'UI globale
    updateBadges();
    checkNotifications();
    
    // 4. On rafraîchit le Dashboard (les Votes apparaîtront, les Annonces seront filtrées, et les Docs se chargeront seuls)
    if (currentPage === 'dashboard') {
        renderDashboard();
        if (typeof loadDashboardWidgets === 'function') {
            loadDashboardWidgets();
        }
    }
  } catch (e) {
    err('loadAll error:', e);
  }
}
