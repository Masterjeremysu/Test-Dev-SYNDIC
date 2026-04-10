// ══════════════════════════════════════════════════════
//  REGISTER PAGE — CoproSync
//  Standalone (no global sb, no global helpers)
//  Fixes: sb scope, profile upsert guard, error handling
// ══════════════════════════════════════════════════════

function checkRegisterMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('register') === '1') {
    showRegisterPage();
    return true;
  }
  return false;
}

function showRegisterPage() {
  document.body.innerHTML = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cream: #f7f3ec;
      --ink:   #1c1a16;
      --muted: #7a7165;
      --line:  #e2ddd4;
      --accent:#2d5be3;
      --red:   #c0392b;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--cream);
      min-height: 100vh;
      min-height: 100dvh;
      color: var(--ink);
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Grain overlay ── */
    body::before {
      content: '';
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    .reg-page {
      position: relative; z-index: 1;
      display: grid;
      grid-template-columns: 1fr 480px;
      min-height: 100dvh;
    }

    /* ── Left panel ── */
    .reg-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px 56px;
      border-right: 1px solid var(--line);
    }

    .reg-wordmark {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      letter-spacing: -0.5px;
      color: var(--ink);
    }

    .reg-hero {
      padding: 20px 0;
    }

    .reg-eyebrow {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .reg-eyebrow::before {
      content: '';
      display: inline-block;
      width: 28px; height: 1px;
      background: var(--muted);
    }

    .reg-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(38px, 4vw, 58px);
      line-height: 1.08;
      letter-spacing: -1.5px;
      color: var(--ink);
      margin-bottom: 28px;
    }

    .reg-title em {
      font-style: italic;
      color: var(--accent);
    }

    .reg-desc {
      font-size: 15px;
      font-weight: 300;
      line-height: 1.7;
      color: var(--muted);
      max-width: 380px;
      margin-bottom: 48px;
    }

    .reg-features {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .reg-feature {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 0;
      border-top: 1px solid var(--line);
    }

    .reg-feature-num {
      font-family: 'DM Serif Display', serif;
      font-size: 11px;
      color: var(--muted);
      padding-top: 2px;
      min-width: 20px;
    }

    .reg-feature-body strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 3px;
    }

    .reg-feature-body span {
      font-size: 13px;
      font-weight: 300;
      color: var(--muted);
    }

    .reg-footer-line {
      font-size: 12px;
      color: var(--muted);
    }

    /* ── Right panel ── */
    .reg-right {
      background: #fff;
      display: flex;
      flex-direction: column;
      padding: 56px 48px;
      border-left: 1px solid var(--line);
      position: relative;
    }

    .reg-form-header {
      margin-bottom: 40px;
    }

    .reg-form-title {
      font-family: 'DM Serif Display', serif;
      font-size: 28px;
      letter-spacing: -0.5px;
      color: var(--ink);
      margin-bottom: 6px;
    }

    .reg-form-sub {
      font-size: 13px;
      font-weight: 300;
      color: var(--muted);
    }

    /* ── Form fields ── */
    .rf-group {
      margin-bottom: 18px;
    }

    .rf-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 7px;
    }

    .rf-input {
      width: 100%;
      padding: 13px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: var(--ink);
      background: #fafaf8;
      outline: none;
      transition: border-color .18s, box-shadow .18s, background .18s;
      -webkit-appearance: none;
      appearance: none;
    }

    .rf-input:focus {
      border-color: var(--accent);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(45, 91, 227, 0.1);
    }

    .rf-input::placeholder { color: #bbb8b2; }

    .rf-input.error {
      border-color: var(--red);
      box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.08);
    }

    .rf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .rf-select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a7165' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      cursor: pointer;
    }

    .rf-select option { background: #fff; color: var(--ink); }

    /* ── Error banner ── */
    .rf-error-banner {
      display: none;
      background: #fef4f3;
      border: 1px solid #f5c4bc;
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 13px;
      color: var(--red);
      font-weight: 500;
      margin-bottom: 20px;
      line-height: 1.45;
    }

    /* ── Submit button ── */
    .rf-submit {
      width: 100%;
      padding: 15px;
      background: var(--ink);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: background .15s, transform .1s;
      margin-top: 6px;
      position: relative;
      overflow: hidden;
    }

    .rf-submit::after {
      content: '';
      position: absolute; inset: 0;
      background: rgba(255,255,255,0);
      transition: background .15s;
    }

    .rf-submit:hover { background: #2d2b27; }
    .rf-submit:active { transform: scale(.99); }

    .rf-submit:disabled {
      opacity: .6;
      cursor: not-allowed;
      transform: none;
    }

    .rf-login-link {
      text-align: center;
      margin-top: 22px;
      font-size: 13px;
      font-weight: 300;
      color: var(--muted);
    }

    .rf-login-link a {
      color: var(--accent);
      font-weight: 500;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color .15s;
    }

    .rf-login-link a:hover { border-color: var(--accent); }

    /* ── Hint box ── */
    .rf-hint {
      background: #f7f5f0;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 12px;
      font-weight: 400;
      color: var(--muted);
      line-height: 1.55;
      margin-top: -6px;
      margin-bottom: 16px;
    }

    /* ── Success state ── */
    .rf-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 10px;
      flex: 1;
    }

    .rf-success-icon {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px;
      margin-bottom: 24px;
    }

    .rf-success-title {
      font-family: 'DM Serif Display', serif;
      font-size: 26px;
      letter-spacing: -0.5px;
      color: var(--ink);
      margin-bottom: 10px;
    }

    .rf-success-text {
      font-size: 14px;
      font-weight: 300;
      color: var(--muted);
      line-height: 1.7;
      max-width: 300px;
    }

    .rf-back-btn {
      display: inline-block;
      margin-top: 28px;
      padding: 12px 28px;
      background: var(--ink);
      color: #fff;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: 0.02em;
      transition: background .15s;
    }

    .rf-back-btn:hover { background: #2d2b27; }

    /* ── Responsive ── */
    @media (max-width: 860px) {
      .reg-page { grid-template-columns: 1fr; }
      .reg-left { display: none; }
      .reg-right { padding: 40px 28px; min-height: 100dvh; }
    }

    @media (max-width: 480px) {
      .reg-right { padding: 32px 20px; }
      .rf-row { grid-template-columns: 1fr; gap: 0; }
      .rf-input { font-size: 16px; }
    }
  </style>

  <div class="reg-page">

    <!-- LEFT -->
    <div class="reg-left">
      <div class="reg-wordmark">CoproSync</div>

      <div class="reg-hero">
        <div class="reg-eyebrow">Résidence le Floréal</div>
        <h1 class="reg-title">Votre résidence,<br><em>connectée.</em></h1>
        <p class="reg-desc">
          Signalez des incidents, échangez avec vos voisins, participez aux décisions collectives — depuis votre téléphone.
        </p>

        <div class="reg-features">
          <div class="reg-feature">
            <span class="reg-feature-num">01</span>
            <div class="reg-feature-body">
              <strong>Signalements en temps réel</strong>
              <span>Parties communes, ascenseurs, parking — tout suivi jusqu'à résolution.</span>
            </div>
          </div>
          <div class="reg-feature">
            <span class="reg-feature-num">02</span>
            <div class="reg-feature-body">
              <strong>Messagerie entre voisins</strong>
              <span>Canal de votre tour, fil du quartier, messages privés.</span>
            </div>
          </div>
          <div class="reg-feature">
            <span class="reg-feature-num">03</span>
            <div class="reg-feature-body">
              <strong>Votes & documents</strong>
              <span>AG, sondages, PV, règlement de copropriété accessibles.</span>
            </div>
          </div>
        </div>
      </div>

      <div class="reg-footer-line">Sassenage, 38360 · 240 logements · 4 tours</div>
    </div>

    <!-- RIGHT -->
    <div class="reg-right">
      <div class="reg-form-header">
        <h2 class="reg-form-title">Créer mon compte</h2>
        <p class="reg-form-sub">13-19 rue du Moucherotte, Sassenage</p>
      </div>

      <div id="reg-form-wrap">
        <div class="rf-error-banner" id="reg-error"></div>

        <div class="rf-row">
          <div class="rf-group">
            <label class="rf-label">Prénom *</label>
            <input type="text" id="reg-prenom" class="rf-input" placeholder="Marie" autocomplete="given-name">
          </div>
          <div class="rf-group">
            <label class="rf-label">Nom *</label>
            <input type="text" id="reg-nom" class="rf-input" placeholder="Dupont" autocomplete="family-name">
          </div>
        </div>

        <div class="rf-group">
          <label class="rf-label">Adresse email *</label>
          <input type="email" id="reg-email" class="rf-input" placeholder="marie.dupont@email.com" autocomplete="email">
        </div>

        <div class="rf-group">
          <label class="rf-label">Mot de passe *</label>
          <input type="password" id="reg-pass" class="rf-input" placeholder="8 caractères minimum" autocomplete="new-password">
        </div>

        <div class="rf-row">
          <div class="rf-group">
            <label class="rf-label">Ma tour *</label>
            <select id="reg-tour" class="rf-input rf-select">
              <option value="">Choisir…</option>
              <option>Tour 13</option>
              <option>Tour 15</option>
              <option>Tour 17</option>
              <option>Tour 19</option>
            </select>
          </div>
          <div class="rf-group">
            <label class="rf-label">N° de lot *</label>
            <input type="text" id="reg-lot" class="rf-input" placeholder="Ex : 148" autocomplete="off">
          </div>
        </div>

        <div class="rf-hint">
          💡 Votre numéro de lot figure sur votre titre de propriété, votre avis de charges ou votre boîte aux lettres.
        </div>

        <button class="rf-submit" id="reg-btn" onclick="submitRegister()">
          Rejoindre la résidence →
        </button>

        <div class="rf-login-link">
          Déjà inscrit ? <a href="${window.location.pathname}">Se connecter</a>
        </div>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════
//  submitRegister — version corrigée
//  Fixes:
//  - sb est créé localement (pas de dépendance au global)
//  - Upsert profile avec guard sur session confirmée
//  - Feed post avec double tentative silencieuse
//  - Email notification avec catch propre
//  - Validation côté client plus robuste
// ══════════════════════════════════════════════════════
async function submitRegister() {
  const prenom = document.getElementById('reg-prenom')?.value.trim();
  const nom    = document.getElementById('reg-nom')?.value.trim();
  const email  = document.getElementById('reg-email')?.value.trim().toLowerCase();
  const pass   = document.getElementById('reg-pass')?.value;
  const tour   = document.getElementById('reg-tour')?.value;
  const lot    = document.getElementById('reg-lot')?.value.trim();
  const errEl  = document.getElementById('reg-error');
  const btn    = document.getElementById('reg-btn');

  function showErr(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = 'block';
    // Highlight empty required fields
    ['reg-prenom','reg-email','reg-pass','reg-tour','reg-lot'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('error', !el.value.trim());
    });
  }

  if (errEl) errEl.style.display = 'none';
  document.querySelectorAll('.rf-input').forEach(el => el.classList.remove('error'));

  // ── Validation ──
  if (!prenom) { showErr('Le prénom est obligatoire.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('Veuillez saisir une adresse email valide.'); return;
  }
  if (!pass || pass.length < 8) {
    showErr('Le mot de passe doit contenir au moins 8 caractères.'); return;
  }
  if (!tour) { showErr('Veuillez sélectionner votre tour.'); return; }
  if (!lot)  { showErr('Le numéro de lot est obligatoire.'); return; }

  btn.disabled = true;
  btn.textContent = 'Création en cours…';

  // ── Supabase client LOCAL (pas de dépendance au global `sb`) ──
  const SUPA_URL = 'https://sifjbqtnrfydxcemhsnz.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZmpicXRucmZ5ZHhjZW1oc256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzIyMjYsImV4cCI6MjA4ODkwODIyNn0.aRZUunTn1W5hLNHRXDSWjp7hKcBtxQlFKSM05MTQyVE';

  let sb2;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb2 = createClient(SUPA_URL, SUPA_KEY);
  } catch (e) {
    showErr('Impossible de charger la librairie. Vérifiez votre connexion.');
    btn.disabled = false; btn.textContent = 'Rejoindre la résidence →';
    return;
  }

  // ── Création du compte ──
  const { data, error } = await sb2.auth.signUp({
    email,
    password: pass,
    options: {
      data: { prenom, nom: nom || null, tour, lot, role: 'copropriétaire' }
    }
  });

  if (error) {
    const msgs = {
      'User already registered':    'Cette adresse email est déjà utilisée. <a href="' + window.location.pathname + '">Se connecter</a>',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 8 caractères.',
      'Unable to validate email address: invalid format': 'Format d\'email invalide.',
    };
    const msg = msgs[error.message] || ('Erreur : ' + error.message);
    if (errEl) { errEl.innerHTML = msg; errEl.style.display = 'block'; }
    btn.disabled = false; btn.textContent = 'Rejoindre la résidence →';
    return;
  }

  // ── Upsert profile ──
  // FIX: on upsert uniquement si on a un user.id valide
  if (data?.user?.id) {
    const profileRow = {
      id: data.user.id,
      email,
      prenom,
      nom: nom || null,
      tour,
      lot,
      role: 'copropriétaire',
      actif: true
    };

    // Tentative d'upsert — peut échouer si la confirmation email n'est pas encore faite
    // On utilise try/catch silencieux car le trigger handle_new_user crée le profil aussi
    try {
      await sb2.from('profiles').upsert(profileRow, { onConflict: 'id' });
    } catch (profileErr) {
      // Non-bloquant : le trigger SQL crée le profil à la confirmation
      console.warn('[register] profile upsert skipped:', profileErr?.message);
    }

    // ── Notif email syndic ── (non-bloquant)
    fetch('https://sifjbqtnrfydxcemhsnz.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPA_KEY}`
      },
      body: JSON.stringify({
        type: 'nouvelle_annonce',
        to: null,
        data: {
          titre: `👤 Nouvel inscrit : ${prenom}${nom ? ' ' + nom : ''}`,
          type: 'important',
          contenu: `Inscription · Tour : ${tour} · Lot : ${lot} · Email : ${email}`
        }
      })
    }).catch(() => {}); // Silencieux

    // ── Post dans le feed ── (non-bloquant, double tentative)
    const feedRow = {
      auteur_id: data.user.id,
      contenu: `👋 ${prenom}${nom ? ' ' + nom : ''} vient de rejoindre la résidence !${tour ? ' (' + tour + ')' : ''}`,
      type: 'member',
      categorie: 'vie_quartier',
    };

    sb2.from('feed_posts').insert(feedRow)
      .then(res => {
        if (res.error) {
          // Fallback sans colonnes optionnelles
          sb2.from('feed_posts').insert({
            auteur_id: feedRow.auteur_id,
            contenu: feedRow.contenu,
            type: feedRow.type,
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }

  // ── Succès ──
  const wrap = document.getElementById('reg-form-wrap');
  if (wrap) {
    wrap.innerHTML = `
      <div class="rf-success">
        <div class="rf-success-icon">✓</div>
        <h3 class="rf-success-title">Bienvenue, ${prenom} !</h3>
        <p class="rf-success-text">
          Un email de confirmation a été envoyé à <strong>${email}</strong>.<br><br>
          Cliquez sur le lien reçu pour activer votre compte, puis connectez-vous.
        </p>
        <a href="${window.location.pathname}" class="rf-back-btn">
          Aller à la connexion →
        </a>
      </div>`;
  }
}
