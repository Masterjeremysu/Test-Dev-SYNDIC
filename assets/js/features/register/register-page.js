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
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Sans:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Instrument Sans', sans-serif; background: #0c0b09; min-height: 100vh; min-height: 100dvh; display: flex; align-items: stretch; overflow-x: hidden; }
    body::before { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background: radial-gradient(ellipse 70% 50% at 0% 100%, rgba(124,58,237,.1) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 100% 0%, rgba(37,99,235,.08) 0%, transparent 60%); }
    body::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
      background-size: 40px 40px; mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 0%, transparent 100%); }
    .reg-split { display: flex; width: 100%; max-width: 1000px; margin: auto; align-items: center; padding: 40px; gap: 64px; position: relative; z-index: 1; }
    .reg-left { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 20px 0; }
    .reg-step-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 5px 14px; width: fit-content; font-size: 11px; font-weight: 600; color: rgba(255,255,255,.4); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 24px; }
    .reg-step-badge span { color: #818cf8; }
    .reg-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 4.5vw, 54px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; color: #fff; margin-bottom: 18px; }
    .reg-title em { font-style: normal; background: linear-gradient(135deg, #818cf8, #c4b5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .reg-desc { font-size: 14px; color: rgba(255,255,255,.35); line-height: 1.8; max-width: 340px; margin-bottom: 36px; }
    .reg-features { display: flex; flex-direction: column; gap: 14px; }
    .reg-feature { display: flex; align-items: center; gap: 12px; }
    .reg-feature-ico { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .reg-feature-txt { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.4; }
    .reg-feature-txt strong { color: rgba(255,255,255,.7); font-weight: 600; display: block; }
    .reg-box { width: 100%; max-width: 420px; flex-shrink: 0; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 24px; padding: 36px; backdrop-filter: blur(20px); box-shadow: 0 32px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06); }
    .reg-box-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -.3px; }
    .reg-box-sub { font-size: 12px; color: rgba(255,255,255,.3); margin-bottom: 28px; }
    .fg { margin-bottom: 14px; }
    .label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.3); display: block; margin-bottom: 6px; }
    .input { width: 100%; padding: 11px 14px; background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.1); border-radius: 10px; font-size: 14px; color: #fff; outline: none; font-family: 'Instrument Sans', sans-serif; transition: all .2s; }
    .input:focus { border-color: rgba(129,140,248,.6); background: rgba(255,255,255,.08); box-shadow: 0 0 0 3px rgba(129,140,248,.1); }
    .input::placeholder { color: rgba(255,255,255,.18); }
    select.input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='rgba(255,255,255,.3)' stroke-width='2' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; appearance: none; }
    select.input option { background: #1c1b19; color: #fff; }
    .fg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .error { color: #f87171; font-size: 12px; margin-bottom: 12px; display: none; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); border-radius: 8px; padding: 8px 12px; }
    .btn-reg { width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Instrument Sans', sans-serif; margin-top: 8px; letter-spacing: .02em; box-shadow: 0 8px 20px rgba(99,102,241,.35); transition: all .2s; }
    .btn-reg:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(99,102,241,.45); }
    .btn-reg:disabled { opacity: .55; transform: none; box-shadow: none; cursor: not-allowed; }
    .reg-footer { text-align: center; margin-top: 20px; font-size: 12px; color: rgba(255,255,255,.25); }
    .reg-footer a { color: rgba(129,140,248,.7); text-decoration: none; font-weight: 600; }
    .success { text-align: center; padding: 20px 10px; }
    .success-ico { font-size: 52px; margin-bottom: 16px; display: block; }
    .success-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 10px; letter-spacing: -.3px; }
    .success-txt { font-size: 13.5px; color: rgba(255,255,255,.4); line-height: 1.7; }
    .success-btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px; }
    @media (max-width: 720px) {
      .reg-split { flex-direction: column; padding: 24px 20px; gap: 28px; }
      .reg-left { align-items: center; text-align: center; }
      .reg-title { font-size: 32px; }
      .reg-desc, .reg-features { display: none; }
      .reg-box { max-width: 100%; padding: 28px 22px; }
    }
  </style>
  <div class="reg-split">
    <div class="reg-left">
      <div class="reg-step-badge"><span>●</span> Nouveau résident</div>
      <div class="reg-title">Rejoignez<br>la <em>communauté</em><br>du Floréal.</div>
      <div class="reg-desc">Créez votre compte en 2 minutes et accédez à tous les services numériques de votre résidence.</div>
      <div class="reg-features">
        <div class="reg-feature"><div class="reg-feature-ico">🔧</div><div class="reg-feature-txt"><strong>Signalez facilement</strong>Problèmes dans les parties communes, suivi en temps réel</div></div>
        <div class="reg-feature"><div class="reg-feature-ico">💬</div><div class="reg-feature-txt"><strong>Échangez avec vos voisins</strong>Messagerie par tour, fil d'actualité de la résidence</div></div>
        <div class="reg-feature"><div class="reg-feature-ico">🗳️</div><div class="reg-feature-txt"><strong>Participez aux décisions</strong>Votes, sondages, assemblées générales</div></div>
        <div class="reg-feature"><div class="reg-feature-ico">📄</div><div class="reg-feature-txt"><strong>Accédez aux documents</strong>PV d'AG, diagnostics, règlement de copropriété</div></div>
      </div>
    </div>
    <div class="reg-box">
      <div class="reg-box-title">Créer mon compte</div>
      <div class="reg-box-sub">Résidence le Floréal · 13-19 rue du Moucherotte, Sassenage</div>
      <div id="reg-form-wrap">
        <div class="error" id="reg-error"></div>
        <div class="fg-row">
          <div class="fg" style="margin:0;"><label class="label">Prénom *</label><input type="text" id="reg-prenom" class="input" placeholder="Jérémy"></div>
          <div class="fg" style="margin:0;"><label class="label">Nom *</label><input type="text" id="reg-nom" class="input" placeholder="Dupont"></div>
        </div>
        <div class="fg"><label class="label">Email *</label><input type="email" id="reg-email" class="input" placeholder="votre@email.com"></div>
        <div class="fg"><label class="label">Mot de passe *</label><input type="password" id="reg-pass" class="input" placeholder="Minimum 8 caractères"></div>
        <div class="fg-row">
          <div class="fg" style="margin:0;"><label class="label">Ma tour *</label>
            <select id="reg-tour" class="input"><option value="">Choisir…</option><option>Tour 13</option><option>Tour 15</option><option>Tour 17</option><option>Tour 19</option></select>
          </div>
          <div class="fg" style="margin:0;"><label class="label">N° de lot *</label><input type="text" id="reg-lot" class="input" placeholder="Ex : 148"></div>
        </div>
        <button class="btn-reg" id="reg-btn" onclick="submitRegister()">Rejoindre la résidence →</button>
      </div>
      <div class="reg-footer">Déjà un compte ? <a href="${window.location.pathname}">Se connecter</a></div>
    </div>
  </div>`
}
async function submitRegister() {
  const prenom = document.getElementById('reg-prenom')?.value.trim();
  const nom    = document.getElementById('reg-nom')?.value.trim();
  const email  = document.getElementById('reg-email')?.value.trim();
  const pass   = document.getElementById('reg-pass')?.value;
  const tour   = document.getElementById('reg-tour')?.value;
  const lot    = document.getElementById('reg-lot')?.value.trim();
  const errEl  = document.getElementById('reg-error');
  const btn    = document.getElementById('reg-btn');

  errEl.style.display = 'none';
  if (!prenom || !email || !pass || !tour || !lot) {
    errEl.textContent = 'Tous les champs marqués * sont obligatoires.';
    errEl.style.display = 'block'; return;
  }
  if (pass.length < 8) {
    errEl.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true; btn.textContent = 'Création en cours…';

  // Crée le compte Supabase
  const SUPA_URL = 'https://sifjbqtnrfydxcemhsnz.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZmpicXRucmZ5ZHhjZW1oc256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzIyMjYsImV4cCI6MjA4ODkwODIyNn0.aRZUunTn1W5hLNHRXDSWjp7hKcBtxQlFKSM05MTQyVE';

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const sb2 = createClient(SUPA_URL, SUPA_KEY);

  const { data, error } = await sb2.auth.signUp({
    email, password: pass,
    options: { data: { prenom, nom, tour, lot, role: 'copropriétaire' } }
  });

  if (error) {
    errEl.textContent = error.message === 'User already registered'
      ? 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.'
      : error.message;
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Créer mon compte →';
    return;
  }

  // Met à jour le profil avec toutes les infos
  if (data.user) {
    await sb2.from('profiles').upsert({
      id: data.user.id, email, prenom, nom: nom||null,
      tour, lot, role: 'copropriétaire', actif: true
    }, { onConflict: 'id' });

    // Notif email au syndic
    await fetch('https://sifjbqtnrfydxcemhsnz.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}` },
      body: JSON.stringify({
        type: 'nouvelle_annonce',
        to: null,
        data: {
          titre: `👤 Nouveau résident inscrit : ${prenom} ${nom||''}`,
          type: 'important',
          contenu: `${prenom} ${nom||''} vient de créer son compte. Tour : ${tour} · Lot : ${lot} · Email : ${email}`
        }
      })
    }).catch(()=>{});

    // Publie dans le feed communautaire
    const feedMemberRow = {
      auteur_id: data.user.id,
      contenu: `👋 ${prenom}${nom?' '+nom:''} vient de rejoindre la résidence !${tour?' ('+tour+')':''}`,
      type: 'member',
      categorie: 'vie_quartier',
    };
    let fr = await sb2.from('feed_posts').insert(feedMemberRow);
    if (fr.error) {
      await sb2.from('feed_posts').insert({
        auteur_id: feedMemberRow.auteur_id,
        contenu: feedMemberRow.contenu,
        type: feedMemberRow.type,
      });
    }
  }

  // Remplace le formulaire par un message de succès
  document.getElementById('reg-form-wrap').innerHTML = `
    <div class="success">
      <div class="success-ico">🎉</div>
      <div class="success-title">Compte créé !</div>
      <div class="success-txt">
        Bienvenue ${prenom} !<br><br>
        Un email de confirmation vous a été envoyé à <strong>${email}</strong>.<br>
        Cliquez sur le lien pour activer votre compte puis connectez-vous.
      </div>
      <br>
      <a href="${window.location.pathname}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px;">
        Aller à la connexion →
      </a>
    </div>`;
}
