// ─────────────────────────────────────────────
// DASHBOARD PRO VERSION (NO REGRESSION)
// ─────────────────────────────────────────────

// ── STATE ──
let _dashFocusMode = 'tout';
let _dashFocusZone = null;

// ── CACHE PERF ──
const _dashCache = {
  tickets: null,
  contrats: null,
  computed: null
};

// ── HELPERS ──
function isResolvedStatut(s) { return s === 'résolu' || s === 'clos'; }
function isOpenStatut(s) { return !isResolvedStatut(s); }

function safeDate(d) {
  return new Date(d || 0);
}

// ── COMPUTE OPTIMISÉ ──
function computeDashboardData() {
  const tickets = cache.tickets || [];
  const contrats = cache.contrats || [];

  if (_dashCache.tickets === tickets && _dashCache.contrats === contrats) {
    return _dashCache.computed;
  }

  const ouverts = [];
  const critiques = [];
  const syndic = [];
  const resolus = [];

  for (const t of tickets) {
    const resolved = isResolvedStatut(t.statut);

    if (!resolved) {
      ouverts.push(t);
      if (t.urgence === 'critique') critiques.push(t);
    } else {
      resolus.push(t);
    }

    if (t.statut === 'transmis_syndic') syndic.push(t);
  }

  const data = { tickets, ouverts, critiques, syndic, resolus };

  _dashCache.tickets = tickets;
  _dashCache.contrats = contrats;
  _dashCache.computed = data;

  return data;
}

// ── EVENT DELEGATION (REMPLACE onclick) ──
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  e.stopPropagation();
  const action = el.dataset.action;

  try {
    new Function(action)();
  } catch (err) {
    console.error('Action error:', err);
  }
});

// ─────────────────────────────────────────────
// SITUATION ROOM
// ─────────────────────────────────────────────
function _buildSituationRoom({ ouverts, critiques, syndic }) {
  const contrats = cache.contrats || [];

  const actifs = contrats.filter(c => c.actif !== false);

  const contratsExp = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => {
    const d = daysUntil(c.date_echeance);
    return d >= 0 && d <= (c.alerte_jours ?? 90);
  });

  const votesOuverts = (typeof _votesCache !== 'undefined' && Array.isArray(_votesCache))
    ? _votesCache.filter(v => v.statut === 'ouvert')
    : [];

  let barClass, statusIco, statusPhrase;

  if (critiques.length || contratsExp.length) {
    barClass = 'sr-red';
    statusIco = '🚨';
    statusPhrase = `Action immédiate requise — ${critiques.length} critique(s) · ${contratsExp.length} contrat(s) expiré(s)`;
  } else if (contratsAlt.length || syndic.length) {
    barClass = 'sr-orange';
    statusIco = '⚠️';
    statusPhrase = `Points de vigilance — ${contratsAlt.length} alerte(s) · ${syndic.length} dossier(s)`;
  } else {
    barClass = 'sr-green';
    statusIco = '✅';
    statusPhrase = 'Tout est sous contrôle';
  }

  return `
  <div class="dash-situation">
    <div class="dash-situation-bar ${barClass}">
      <div class="dash-situation-dot ${barClass !== 'sr-green' ? 'pulse' : ''}"></div>
      ${statusIco}
      <div class="dash-situation-phrase">${statusPhrase}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// CONTRATS WIDGET
// ─────────────────────────────────────────────
function _buildDashContrats() {
  const contrats = cache.contrats || [];
  const actifs = contrats.filter(c => c.actif !== false);

  const expires = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes = actifs.filter(c => {
    const d = daysUntil(c.date_echeance);
    return d >= 0 && d <= (c.alerte_jours ?? 90);
  });

  const budget = actifs.reduce((s, c) => s + (c.montant_annuel || 0), 0);

  return `
  <div class="card">
    <div class="card-header">
      <div class="card-title">📄 Contrats</div>
    </div>
    <div class="card-body">
      <div>Expirés : ${expires.length}</div>
      <div>Alertes : ${alertes.length}</div>
      <div>Budget : ${budget.toLocaleString()} €</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// RENDER DASHBOARD
// ─────────────────────────────────────────────
async function renderDashboard() {
  const el = $('page');

  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div>Loading...</div>';
    return;
  }

  const { tickets, ouverts, critiques, syndic, resolus } = computeDashboardData();

  const situationHTML = isManager()
    ? _buildSituationRoom({ ouverts, critiques, syndic })
    : '';

  el.innerHTML = `
  <div class="dash2">

    <h1>Dashboard</h1>

    ${situationHTML}

    <div class="stats-row">
      <div class="stat">${ouverts.length} ouverts</div>
      <div class="stat">${critiques.length} critiques</div>
      <div class="stat">${resolus.length} résolus</div>
    </div>

    ${isManager() ? _buildDashContrats() : ''}

  </div>
  `;

  requestIdleCallback(() => {
    loadDashboardWidgets();
  });
}

// ─────────────────────────────────────────────
// FILTER SYSTEM
// ─────────────────────────────────────────────
function setDashFocus(mode) {
  _dashFocusMode = mode;
  renderDashboard();
}

function setDashZoneFocus(zone) {
  _dashFocusZone = zone;
  _dashFocusMode = 'zone';
  renderDashboard();
}
