// ── INIT — Restaure la session si elle existe ──
(async () => {
  // Mode inscription public
  if (checkRegisterMode()) return;

  // Mode FAQ public (sans connexion requise)
  if (checkFaqMode()) return;

  const authBtn     = $('auth-btn');
  const authBtnText = $('auth-btn-text');
  if (authBtn) { authBtn.disabled = true; authBtnText.textContent = 'Chargement…'; }

  // Vérifie si une session valide existe déjà (retour sur l'app, PWA)
  const { data: { session } } = await sb.auth.getSession();

  if (session?.user) {
    // Session valide → reconnexion automatique sans passer par le login
    dbg('[init] session restauree pour', session.user.email);
    _initDone = true;
    user = session.user;
    await loadProfile();
    await startApp();
  } else {
    // Pas de session → affiche l'écran de connexion
    dbg('[init] aucune session, affichage login');
    _initDone = true;
    if (authBtn) { authBtn.disabled = false; authBtnText.textContent = 'Se connecter'; }
    $('login-screen').style.display = 'flex';
  }
})();
