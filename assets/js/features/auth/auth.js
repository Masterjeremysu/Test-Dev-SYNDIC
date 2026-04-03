// ── AUTH ──
let _authMode = 'login';
function toggleAuthMode(e) {
  e.preventDefault();
  _authMode = _authMode === 'login' ? 'signup' : 'login';
  const isSignup = _authMode === 'signup';

  // Titre et bouton
  $('auth-btn-text').textContent = isSignup ? 'Créer mon compte' : 'Se connecter';

  // Lien toggle avec innerHTML pour le span coloré
  $('auth-toggle-link').innerHTML = isSignup
    ? `Déjà un compte ? <span style="color:rgba(59,130,246,.8);text-decoration:underline;">Se connecter</span>`
    : `Pas encore de compte ? <span style="color:rgba(59,130,246,.8);text-decoration:underline;">Créer un compte</span>`;

  // Affiche/cache les champs supplémentaires d'inscription
  const extraFields = $('auth-extra-fields');
  if (extraFields) extraFields.style.display = isSignup ? 'block' : 'none';

  $('auth-error').style.display = 'none';
}

async function doAuth() {
  const email = $('auth-email')?.value.trim();
  const pass  = $('auth-pass')?.value.trim();
  if (!email || !pass) { showAuthError('Email et mot de passe requis'); return; }

  $('auth-btn').disabled = true;
  $('auth-btn-text').textContent = '...';
  $('auth-error').style.display = 'none';

  if (_authMode === 'login') {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      const msgs = {
        'Invalid login credentials': 'Email ou mot de passe incorrect.',
        'Email not confirmed':        'Email non confirmé — vérifiez vos spams.',
        'Too many requests':          'Trop de tentatives, attendez quelques minutes.',
      };
      showAuthError(msgs[error.message] || error.message);
      $('auth-btn').disabled = false;
      $('auth-btn-text').textContent = 'Se connecter';
    }
    // Succès → onAuthStateChange prend le relais automatiquement

  } else {
    const prenom = $('auth-prenom')?.value.trim() || null;
    const nom    = $('auth-nom')?.value.trim() || null;
    const tour   = $('auth-tour')?.value || null;
    const lot    = $('auth-lot')?.value.trim() || null;

    const { data, error } = await sb.auth.signUp({
      email, password: pass,
      options: { data: { prenom, nom, tour, lot, role: 'copropriétaire' } }
    });
    $('auth-btn').disabled = false;
    $('auth-btn-text').textContent = 'Créer mon compte';
    if (error) { showAuthError(error.message); return; }

    // Sauvegarde le profil immédiatement si l'user est créé
    if (data?.user) {
      await sb.from('profiles').upsert({
        id: data.user.id, email,
        prenom: prenom || null, nom: nom || null,
        tour: tour || null, lot: lot || null,
        role: 'copropriétaire', actif: true
      }, { onConflict: 'id' });
    }

    $('auth-error').style.color = '#4ade80';
    showAuthError('✅ Compte créé ! Vérifiez votre email puis connectez-vous.');
  }
}

async function forgotPassword(e) {
  e.preventDefault();
  const email = $('auth-email').value.trim();
  if (!email) { showAuthError('Entrez votre email ci-dessus d\'abord'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href
  });
  if (error) { showAuthError(error.message); return; }
  toast('Email de réinitialisation envoyé !', 'ok');
}

function showAuthError(msg) {
  $('auth-error').textContent = msg;
  $('auth-error').style.display = 'block';
}

async function doLogout() {
  await sb.auth.signOut();
  location.reload();
}
