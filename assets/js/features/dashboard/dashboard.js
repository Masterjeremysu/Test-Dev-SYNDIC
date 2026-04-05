// ─────────────────────────────────────────────
// DASHBOARD V2 PRO MAX ⚡
// Clean / Performant / Scalable
// ─────────────────────────────────────────────

let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ─────────────────────────────────────────────
   UTILS PERF
───────────────────────────────────────────── */
const dashUtils = {
  fmtDate: () =>
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),

  fmtTime: () =>
    new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }),

  safe: (str) => (str ? escHtml(str) : ''),

  plural: (n, word) => n + ' ' + word + (n > 1 ? 's' : '')
};

/* ─────────────────────────────────────────────
   CACHE COMPUTÉ (GAIN PERF)
───────────────────────────────────────────── */
function computeStats(tickets) {
  return {
    ouverts: tickets.filter(t => t.statut !== 'résolu' && t.statut !== 'clos'),
    critiques: tickets.filter(t => t.urgence === 'critique' && t.statut !== 'résolu' && t.statut !== 'clos'),
    syndic: tickets.filter(t => t.statut === 'transmis_syndic'),
    resolus: tickets.filter(t => t.statut === 'résolu' || t.statut === 'clos')
  };
}

/* ─────────────────────────────────────────────
   SITUATION ROOM (UPGRADE)
───────────────────────────────────────────── */
function buildSituation(stats) {
  const { critiques, syndic } = stats;

  const contrats = cache.contrats || [];
  const actifs = contrats.filter(c => c.actif !== false);

  const expires = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes = actifs.filter(c => {
    const d = daysUntil(c.date_echeance);
    return d >= 0 && d <= (c.alerte_jours ?? 90);
  });

  let state = 'green';
  let phrase = 'Tout est sous contrôle';

  if (critiques.length || expires.length) {
    state = 'red';
    phrase = `🚨 ${dashUtils.plural(critiques.length, 'critique')} · ${dashUtils.plural(expires.length, 'contrat expiré')}`;
  } else if (alertes.length || syndic.length) {
    state = 'orange';
    phrase = `⚠️ ${dashUtils.plural(alertes.length, 'alerte')} · ${dashUtils.plural(syndic.length, 'dossier syndic')}`;
  }

  return `
    <div class="dash-situation">
      <div class="dash-situation-bar sr-${state}">
        <div class="dash-situation-dot ${state !== 'green' ? 'pulse' : ''}"></div>
        <span>${phrase}</span>
        <span style="opacity:.6;font-size:11px;">${dashUtils.fmtTime()}</span>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   WIDGET CONTRATS (OPTIMISÉ)
───────────────────────────────────────────── */
function buildContractsWidget() {
  const contrats = cache.contrats || [];

  const actifs = contrats.filter(c => c.actif !== false);

  const expires = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes = actifs.filter(c => {
    const d = daysUntil(c.date_echeance);
    return d >= 0 && d <= (c.alerte_jours ?? 90);
  });

  const conformes = actifs.length - expires.length - alertes.length;

  const budget = actifs.reduce((s, c) => s + (c.montant_annuel || 0), 0);

  return `
    <div class="card dash2-card">
      <div class="card-header">
        <span class="card-title">📄 Contrats</span>
        <button class="btn btn-ghost btn-sm" onclick="nav('contrats')">→</button>
      </div>

      <div class="dcc-kpis">
        <div class="dcc-kpi dcc-danger">${expires.length}<span>Expirés</span></div>
        <div class="dcc-kpi dcc-warning">${alertes.length}<span>Alertes</span></div>
        <div class="dcc-kpi dcc-ok">${conformes}<span>OK</span></div>
      </div>

      <div class="dcc-budget-bar">
        <span>💰 Budget</span>
        <strong>${budget.toLocaleString()} €</strong>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   LISTE SIGNALMENTS (ULTRA CLEAN)
───────────────────────────────────────────── */
function buildRecentList(tickets) {
  if (!tickets.length) {
    return `
      <div class="empty">
        ✅ Aucun signalement
      </div>
    `;
  }

  return tickets.slice(0, 6).map(t => {
    const urgency = t.urgence === 'critique'
      ? '🔴'
      : t.urgence === 'important'
      ? '🟠'
      : '🔵';

    return `
      <div class="act-item" onclick="openDetail('${t.id}')">
        <div>${urgency}</div>
        <div>
          <div>${dashUtils.safe(t.titre)}</div>
          <div class="muted">${dashUtils.safe(t.batiment || '')}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* ─────────────────────────────────────────────
   RENDER PRINCIPAL (REFACTOR TOTAL)
───────────────────────────────────────────── */
async function renderDashboard() {
  const el = $('page');

  if (!cache.tickets && !isCopro()) {
    el.innerHTML = `<div class="skeleton">Chargement…</div>`;
    return;
  }

  const tickets = cache.tickets || [];

  const stats = computeStats(tickets);

  const situation = isManager()
    ? buildSituation(stats)
    : '';

  el.innerHTML = `
    <div class="dash2">

      <!-- HERO -->
      <section class="dash2-hero">
        <h1>
          Bonjour ${displayName(profile?.prenom, profile?.nom).split(' ')[0]} 👋
        </h1>
        <p>${dashUtils.fmtDate()}</p>

        <div class="dash2-actions">
          <button class="btn btn-primary" onclick="openNewTicket()">+ Signaler</button>
          <button class="btn btn-secondary" onclick="nav('tickets')">Voir</button>
        </div>
      </section>

      ${situation}

      <!-- KPI -->
      <section class="stats-row">
        <div class="stat">${stats.ouverts.length}<span>Ouverts</span></div>
        <div class="stat red">${stats.critiques.length}<span>Critiques</span></div>
        <div class="stat green">${stats.resolus.length}<span>Résolus</span></div>
      </section>

      <!-- GRID -->
      <section class="dash2-grid">

        <!-- LEFT -->
        <div class="card">
          <div class="card-header">
            Signalements récents
          </div>
          <div class="card-content">
            ${buildRecentList(tickets)}
          </div>
        </div>

        <!-- RIGHT -->
        <div class="dash2-stack">
          ${isManager() ? buildContractsWidget() : ''}
        </div>

      </section>

    </div>
  `;
}
