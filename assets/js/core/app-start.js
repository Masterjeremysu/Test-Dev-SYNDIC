// ── INIT ──
let _initDone = false; // bloque le listener jusqu'au signOut initial

sb.auth.onAuthStateChange(async (event, session) => {
  dbg('[auth]', event, !!session?.user, '| initDone:', _initDone);

  // Ignorer tous les events avant que le signOut initial soit terminé
  if (!_initDone) return;

  if (!session?.user || event === 'SIGNED_OUT') {
    _appStarted = false;
    $('login-screen').style.display = 'flex';
    $('app').style.display = 'none';
    user = null; profile = null;
    return;
  }
  // Reset bouton dans tous les cas
  $('auth-btn').disabled = false;
  $('auth-btn-text').textContent = 'Se connecter';

  if (_appStarted) { dbg('[auth] already started, skip'); return; }
  user = session.user;
  await loadProfile();

  // Vérifie si le compte est suspendu
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
      banner.textContent = '⚠ Connexion perdue - mode degrade';
      banner.classList.add('show', 'offline');
      banner.classList.remove('online');
      return;
    }
    if (_connWasOffline) {
      banner.textContent = '✓ Connexion retablie';
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
    initUI();
    initConnectionStatus();
    await loadAll();
    nav('dashboard');
    registerSW();
    startRealtime();
    initSwipeToClose();
    initPullToRefresh();
    setTimeout(checkOnboarding, 1500);

    // Vérifie toutes les 2 minutes si le compte est toujours actif
    setInterval(async () => {
      const { data } = await sb.from('profiles').select('actif').eq('id', user.id).single();
      if (data?.actif === false) {
        await sb.auth.signOut();
        location.reload();
      }
    }, 2 * 60 * 1000);
  } catch(e) {
    err('[startApp] ERREUR:', e);
    showAuthError('Erreur au demarrage de l\'application. Reessayez dans quelques secondes.');
    toast('Erreur demarrage: ' + (e?.message || 'inconnue'), 'err');
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
    const { data, error } = await Promise.race([query, timeout]);
    dbg('[loadProfile] data=', data, 'error=', error);
    if (data) {
      profile = data;
    } else {
      // Pas de profil en base — profil minimal SANS forcer le rôle
      // Le rôle vient de user_metadata si dispo
      const meta = user.user_metadata || {};
      profile = {
        id: user.id,
        email: user.email,
        nom: meta.nom || null,
        prenom: meta.prenom || null,
        role: meta.role || 'copropriétaire',
        tour: meta.tour || null,
        lot: meta.lot || null,
      };
    }
    dbg('[loadProfile] role =', profile.role);
  } catch(e) {
    err('[loadProfile] CRASH/TIMEOUT:', e.message);
    // En cas de timeout → réessaie une fois sans timeout
    try {
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) { profile = data; return; }
    } catch {}
    const meta = user.user_metadata || {};
    profile = {
      id: user.id, email: user.email,
      nom: meta.nom || null, prenom: meta.prenom || null,
      role: meta.role || 'copropriétaire',
    };
  }
}

function initUI() {
  if (!profile) return;
  const init = (profile.nom || '').charAt(0).toUpperCase() + (profile.prenom || '').charAt(0).toUpperCase();
  const avEl = $('nav-av');
  avEl.textContent = init || '?';
  const roleCls = { administrateur:'role-admin', syndic:'role-syndic', membre_cs:'role-cs' };
  avEl.className = `user-av ${roleCls[profile.role] || ''}`;
  $('nav-nom').textContent = displayNameFromProfile(profile, user?.email);
  const roleLabels = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
  $('nav-role').textContent = roleLabels[profile.role] || profile.role;

  // Visibilité du menu selon le rôle
  if (isSyndicExterne()) {
    // Syndic externe : uniquement le Rapport syndic
    document.querySelectorAll('.nav-item, .nav-section').forEach(el => {
      const page = el.getAttribute('data-page');
      if (page !== 'rapport' && !el.classList.contains('nav-brand')) {
        el.style.display = 'none';
      }
    });
    // Affiche le rapport immédiatement
    setTimeout(() => nav('rapport'), 100);
  } else if (!isManager()) {
    document.querySelectorAll('.nav-manager-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-admin-only').forEach(el => el.style.display = 'none');
  } else if (!isAdmin()) {
    document.querySelectorAll('.nav-admin-only').forEach(el => el.style.display = 'none');
  }
}

async function loadAll() {
  try {
    // Syndic externe → charge uniquement tickets et contrats pour le rapport
    if (isSyndicExterne()) {
      await Promise.all([loadTickets(), loadContrats()]);
      updateBadges();
      if (currentPage === 'rapport') renderRapport();
      return;
    }

    // Charge les tickets en priorité → dashboard s'affiche immédiatement
    await loadTickets();
    if (currentPage === 'dashboard') renderDashboard();

    // Charge le reste en parallèle en arrière-plan
    const tasks = [];
    if (isManager()) tasks.push(loadContrats());
    tasks.push(loadCles());
    tasks.push(loadAnnonceCache());
    tasks.push(loadEvenementsCache());
    tasks.push(loadContactsCache());
    await Promise.all(tasks);
    if (isManager()) await loadJournal();
    updateBadges();
    checkNotifications();
    // Re-render dashboard complet avec tous les widgets
    if (currentPage === 'dashboard') renderDashboard();
  } catch(e) {
    err('loadAll error:', e);
  }
}
