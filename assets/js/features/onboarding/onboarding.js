function checkOnboarding() {
  if (!user || !profile) return;

  const onboarded = localStorage.getItem('coprosync-onboarded');
  const featureSeen = localStorage.getItem('coprosync-feature-tour');

  // Si pas encore onboardé → lance l'onboarding (qui lancera le feature tour à la fin)
  if (!onboarded) {
    // Si tout est déjà renseigné → skip onboarding, va direct au feature tour
    if (profile.tour && profile.prenom && profile.lot) {
      localStorage.setItem('coprosync-onboarded', '1');
      if (!featureSeen) showFeatureTour();
    } else {
      showOnboarding();
    }
    return;
  }

  // Déjà onboardé mais feature tour pas encore vu → le montrer
  if (!featureSeen) {
    setTimeout(showFeatureTour, 800);
  }
}

// ── TOUR DES FONCTIONNALITÉS ──
const FEATURE_TOUR_STEPS = [
  { ico: '🔧', title: 'Signalez en 30 secondes', desc: 'Appuyez sur le bouton + Signaler pour déclarer un problème dans les parties communes. Ajoutez des photos, choisissez la zone et l\'urgence.', color: '#ea580c' },
  { ico: '💬', title: 'Chattez avec vos voisins', desc: 'Dans Messages, rejoignez le canal de votre tour ou démarrez une conversation privée. Réagissez aux messages avec des emojis.', color: '#2563eb' },
  { ico: '🏠', title: 'Le fil d\'actualité', desc: 'La page Fil d\'actualité dans Messages regroupe toute la vie de la résidence — posts, événements automatiques, tickets résolus.', color: '#7c3aed' },
  { ico: '🗳️', title: 'Votez & donnez votre avis', desc: 'Participez aux votes officiels et sondages depuis l\'onglet Votes & Sondages. Vos voix comptent pour la résidence.', color: '#16a34a' },
  { ico: '🎉', title: 'Vous êtes prêt !', desc: 'Bienvenue parmi les résidents connectés du Floréal. L\'app est disponible 24h/24 depuis votre téléphone.', color: '#2563eb' },
];
let _featureTourStep = 0;

function showFeatureTour() {
  _featureTourStep = 0;
  renderFeatureTourStep();
}

function renderFeatureTourStep() {
  document.getElementById('feature-tour-overlay')?.remove();
  const step = FEATURE_TOUR_STEPS[_featureTourStep];
  const isLast = _featureTourStep === FEATURE_TOUR_STEPS.length - 1;
  const dots = FEATURE_TOUR_STEPS.map((_, i) =>
    `<div class="onboarding-dot${i === _featureTourStep ? ' active' : ''}"></div>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'feature-tour-overlay';
  overlay.innerHTML = `<div class="onboarding-box">
    <div class="onboarding-hero" style="background:linear-gradient(135deg,${step.color}dd,${step.color}99);">
      <span class="onboarding-ico">${step.ico}</span>
      <div class="onboarding-title">${step.title}</div>
      <div class="onboarding-desc">${step.desc}</div>
    </div>
    <div class="onboarding-step">
      <div class="onboarding-progress">${dots}</div>
    </div>
    <div class="onboarding-footer">
      <button class="btn btn-ghost btn-sm" style="color:var(--text-3);" onclick="skipFeatureTour()">Passer</button>
      <div style="display:flex;gap:8px;">
        ${_featureTourStep > 0 ? `<button class="btn btn-secondary btn-sm" onclick="_featureTourStep--;renderFeatureTourStep()">← Retour</button>` : ''}
        <button class="btn btn-primary" onclick="${isLast ? 'skipFeatureTour()' : '_featureTourStep++;renderFeatureTourStep()'}">
          ${isLast ? '🚀 C\'est parti !' : 'Suivant →'}
        </button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function skipFeatureTour() {
  localStorage.setItem('coprosync-feature-tour', '1');
  localStorage.setItem('coprosync-onboarded', '1');
  document.getElementById('feature-tour-overlay')?.remove();
}

let _onboardStep = 0;
const ONBOARD_STEPS = [
  {
    ico: '👋',
    title: 'Bienvenue à la Résidence le Floréal !',
    desc: 'Votre application de gestion de résidence. Signalements, messagerie, documents, votes — tout en un seul endroit.',
    action: null
  },
  {
    ico: '👤',
    title: 'Comment vous appelle-t-on ?',
    desc: 'Renseignez votre prénom et nom pour que vos voisins et le conseil syndical puissent vous identifier.',
    action: 'identite'
  },
  {
    ico: '🏠',
    title: 'Où habitez-vous ?',
    desc: 'Indiquez votre tour et votre numéro de lot. Vous rejoindrez automatiquement le groupe de messagerie de votre tour.',
    action: 'tour'
  },
  {
    ico: '🔔',
    title: 'Restez informé',
    desc: 'Activez les notifications pour être alerté instantanément : signalements urgents, annonces, nouveaux messages.',
    action: 'notif'
  },
  {
    ico: '🎉',
    title: 'Vous êtes prêt !',
    desc: 'Bienvenue parmi les résidents connectés du Floréal. Explorez l\'application et n\'hésitez pas à signaler tout problème.',
    action: null
  }
];

function showOnboarding() {
  if ($('onboarding-overlay')) return;
  // Détermine le premier step non complété
  _onboardStep = 0;
  if (profile.prenom) {
    // Identité déjà renseignée → skip étape 1
    const identiteIdx = ONBOARD_STEPS.findIndex(s => s.action === 'identite');
    if (identiteIdx >= 0 && _onboardStep <= identiteIdx) _onboardStep = identiteIdx + 1;
  }
  if (profile.tour && profile.lot) {
    // Tour/lot déjà renseignés → skip étape tour
    const tourIdx = ONBOARD_STEPS.findIndex(s => s.action === 'tour');
    if (tourIdx >= 0 && _onboardStep <= tourIdx) _onboardStep = tourIdx + 1;
  }
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const existing = $('onboarding-overlay');
  if (existing) existing.remove();

  const step = ONBOARD_STEPS[_onboardStep];
  const isLast = _onboardStep === ONBOARD_STEPS.length - 1;
  const isFirst = _onboardStep === 0;
  const dots = ONBOARD_STEPS.map((_, i) =>
    `<div class="onboarding-dot${i === _onboardStep ? ' active' : ''}"></div>`
  ).join('');

  let actionHtml = '';
  if (step.action === 'identite') {
    actionHtml = `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input type="text" id="ob-prenom" class="input" placeholder="Prénom *" value="${escHtml(profile?.prenom||'')}">
        <input type="text" id="ob-nom" class="input" placeholder="Nom *" value="${escHtml(profile?.nom||'')}">
      </div>
      <input type="tel" id="ob-tel" class="input" placeholder="Téléphone (optionnel)" value="${escHtml(profile?.telephone||'')}" style="width:100%;">`;
  } else if (step.action === 'tour') {
    actionHtml = `
      <select id="ob-tour" class="select" style="width:100%;margin-bottom:8px;">
        <option value="">— Sélectionner ma tour —</option>
        ${COPRO.tours.map(t => `<option value="${t}" ${profile?.tour===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <input type="text" id="ob-lot" class="input" placeholder="Numéro de lot (ex: 148)" value="${escHtml(profile?.lot||'')}" style="width:100%;margin-bottom:8px;">
      <div style="background:var(--blue-light);border:1px solid var(--blue-border);border-radius:8px;padding:8px 12px;font-size:11.5px;color:var(--accent);line-height:1.6;">
        💡 Votre numéro de lot figure sur votre <strong>titre de propriété</strong>, votre <strong>avis de charges</strong> ou votre <strong>boîte aux lettres</strong>.
      </div>`;
  } else if (step.action === 'notif') {
    actionHtml = `
      <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" onclick="askNotifPermission().then(()=>{_onboardStep++;renderOnboardingStep();})">
        🔔 Activer les notifications
      </button>
      <button class="btn btn-ghost btn-sm" style="width:100%;color:var(--text-3);" onclick="_onboardStep++;renderOnboardingStep();">
        Pas maintenant
      </button>`;
  } else if (isLast) {
    const nom = displayNameFromProfile(profile, user?.email);
    actionHtml = `
      <div style="background:var(--blue-light);border-radius:var(--r-lg);padding:16px;margin-bottom:8px;">
        <div style="font-size:13px;color:var(--accent);font-weight:600;margin-bottom:8px;">Ce que vous pouvez faire :</div>
        <div style="font-size:13px;color:var(--text-2);line-height:2;">
          🔧 Signaler un problème dans les parties communes<br>
          💬 Chatter avec vos voisins dans Messages<br>
          📢 Consulter les annonces et l'agenda<br>
          📄 Accéder aux documents de la résidence<br>
          🗳️ Participer aux votes et sondages
        </div>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-overlay';
  overlay.innerHTML = `<div class="onboarding-box">
    <div class="onboarding-hero">
      <span class="onboarding-ico">${step.ico}</span>
      <div class="onboarding-title">${step.title}</div>
      <div class="onboarding-desc">${step.desc}</div>
    </div>
    <div class="onboarding-step">
      ${actionHtml || ''}
      <div class="onboarding-progress">${dots}</div>
    </div>
    <div class="onboarding-footer">
      ${isFirst ? `<button class="btn btn-ghost btn-sm" style="color:var(--text-3);" onclick="skipOnboarding()">Passer</button>` : '<div></div>'}
      <div style="display:flex;gap:8px;">
        ${!isFirst && !isLast && step.action !== 'notif' ? `<button class="btn btn-secondary btn-sm" onclick="_onboardStep--;renderOnboardingStep();">← Retour</button>` : ''}
        ${step.action !== 'notif' ? `<button class="btn btn-primary" onclick="nextOnboardStep()">
          ${isLast ? '🎉 C\'est parti !' : 'Continuer →'}
        </button>` : ''}
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

async function nextOnboardStep() {
  const step = ONBOARD_STEPS[_onboardStep];

  if (step.action === 'identite') {
    const prenom = $('ob-prenom')?.value.trim();
    const nom = $('ob-nom')?.value.trim();
    const telephone = $('ob-tel')?.value.trim();
    if (!prenom) { toast('Prénom requis', 'warn'); return; }
    await sb.from('profiles').update({ prenom, nom: nom||null, telephone: telephone||null }).eq('id', user.id);
    profile.prenom = prenom; profile.nom = nom; profile.telephone = telephone;
    // Met à jour le nav
    if ($('nav-nom')) $('nav-nom').textContent = displayNameFromProfile(profile, user?.email);
  }

  if (step.action === 'tour') {
    const tour = $('ob-tour')?.value;
    const lot = $('ob-lot')?.value.trim();
    if (tour || lot) {
      await sb.from('profiles').update({ tour: tour||null, lot: lot||null }).eq('id', user.id);
      if (tour) await autoJoinTourGroup(tour);
      profile.tour = tour; profile.lot = lot;
    }
  }

  if (_onboardStep < ONBOARD_STEPS.length - 1) {
    _onboardStep++;
    renderOnboardingStep();
  } else {
    skipOnboarding();
  }
}

function skipOnboarding() {
  localStorage.setItem('coprosync-onboarded', '1');
  $('onboarding-overlay')?.remove();
  // Lance le tour des fonctionnalités si pas encore vu
  if (!localStorage.getItem('coprosync-feature-tour')) {
    setTimeout(showFeatureTour, 400);
  }
}

// ══════════════════════════════════════════════
// DOCUMENTS
