/**
 * ── COPROSYNC COMMAND CENTER V3 (ULTRA-INTEGRATED) ──
 * Système de pilotage complet : Signalements, Agenda, Annonces, Votes & Contrats.
 */

let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ─── 1. CORE CSS (Injected) ────────────────────────────────── */
(function injectUltraCSS() {
  if (document.getElementById('dash-core-css')) return;
  const s = document.createElement('style');
  s.id = 'dash-core-css';
  s.textContent = `
    :root {
      --u-bg: #f1f5f9;
      --u-surface: #ffffff;
      --u-accent: #2563eb;
      --u-success: #10b981;
      --u-warning: #f59e0b;
      --u-danger: #ef4444;
      --u-text-1: #0f172a;
      --u-text-2: #475569;
      --u-text-3: #94a3b8;
      --u-border: #e2e8f0;
      --u-radius: 14px;
    }

    .u-dash { padding: 24px; max-width: 1600px; margin: 0 auto; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; background: var(--u-bg); min-height: 100vh; }
    
    /* Hero Section */
    .u-hero { grid-column: span 12; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
    .u-hero-title h1 { font-size: 28px; font-weight: 800; color: var(--u-text-1); margin: 0; letter-spacing: -0.03em; }
    .u-hero-title p { color: var(--u-text-3); margin: 4px 0 0; font-weight: 500; }

    /* Main Grid Layout */
    .u-col-left { grid-column: span 8; display: flex; flex-direction: column; gap: 24px; }
    .u-col-right { grid-column: span 4; display: flex; flex-direction: column; gap: 24px; }

    /* Cards & Widgets */
    .u-card { background: var(--u-surface); border-radius: var(--u-radius); border: 1px solid var(--u-border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
    .u-card-header { padding: 18px 20px; border-bottom: 1px solid var(--u-border); display: flex; justify-content: space-between; align-items: center; }
    .u-card-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--u-text-2); display: flex; align-items: center; gap: 8px; }
    .u-card-body { padding: 0; }

    /* Specific Modules */
    .u-health-bar { grid-column: span 12; background: linear-gradient(90deg, #1e293b 0%, #334155 100%); padding: 20px; border-radius: var(--u-radius); color: white; display: flex; align-items: center; gap: 24px; }
    .u-score-circle { width: 64px; height: 64px; border-radius: 50%; border: 4px solid var(--score-color); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; flex-shrink: 0; }
    
    /* Item Rows */
    .u-row { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid var(--u-border); cursor: pointer; transition: background 0.15s; }
    .u-row:last-child { border-bottom: none; }
    .u-row:hover { background: #f8fafc; }
    .u-row-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .u-row-main { flex: 1; min-width: 0; }
    .u-row-title { font-size: 14px; font-weight: 600; color: var(--u-text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .u-row-meta { font-size: 12px; color: var(--u-text-3); margin-top: 2px; }

    /* Badges Style */
    .u-tag { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .u-tag-urgent { background: #fee2e2; color: #ef4444; }
    .u-tag-info { background: #dbeafe; color: #2563eb; }

    @media (max-width: 1100px) { .u-col-left, .u-col-right { grid-column: span 12; } }
  `;
  document.head.appendChild(s);
})();

/* ─── 2. DATA AGGREGATOR ────────────────────────────────────── */

function _getDashboardStats() {
  const t = cache.tickets || [];
  const c = cache.contrats || [];
  const ouverts = t.filter(x => !['résolu', 'clos'].includes(x.statut));
  const critiques = ouverts.filter(x => x.urgence === 'critique');
  const exp = c.filter(x => new Date(x.date_echeance) < new Date() && x.actif !== false);

  // Score de santé immo (0-100)
  let score = 100 - (critiques.length * 10) - (exp.length * 5) - (ouverts.length * 1);
  score = Math.max(0, score);

  return { ouverts, critiques, exp, score };
}

/* ─── 3. MODULES DE RENDU ───────────────────────────────────── */

/**
 * MODULE AGENDA : Récupère les 4 prochains événements
 */
async function _renderAgendaModule() {
  const target = $('dash-agenda-list');
  if (!target) return;
  
  const { data: events, error } = await sb.from('evenements')
    .select('*')
    .gte('date_debut', new Date().toISOString())
    .order('date_debut', { ascending: true })
    .limit(4);

  if (error || !events?.length) {
    target.innerHTML = '<div style="padding:20px; text-align:center; color:var(--u-text-3);">Aucun événement à venir</div>';
    return;
  }

  target.innerHTML = events.map(e => {
    const d = new Date(e.date_debut);
    return `
      <div class="u-row" onclick="nav('agenda')">
        <div style="text-align:center; min-width:45px; border-right:1px solid var(--u-border); padding-right:10px;">
          <div style="font-size:16px; font-weight:800; color:var(--u-accent);">${d.getDate()}</div>
          <div style="font-size:10px; text-transform:uppercase; font-weight:700;">${d.toLocaleDateString('fr-FR', {month:'short'})}</div>
        </div>
        <div class="u-row-main">
          <div class="u-row-title">${escHtml(e.titre)}</div>
          <div class="u-row-meta">🕒 ${d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})} • ${escHtml(e.lieu || 'Résidence')}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * MODULE ANNONCES : Dernières communications
 */
async function _renderAnnoncesModule() {
  const target = $('dash-annonces-list');
  if (!target) return;

  const { data: anns } = await sb.from('annonces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!anns?.length) {
    target.innerHTML = '<div style="padding:20px; text-align:center; color:var(--u-text-3);">Aucune annonce</div>';
    return;
  }

  target.innerHTML = anns.map(a => `
    <div class="u-row" onclick="nav('annonces')">
      <div class="u-row-icon" style="background:#f1f5f9;">${a.type === 'urgent' ? '🚨' : '📢'}</div>
      <div class="u-row-main">
        <div class="u-row-title">${escHtml(a.titre)}</div>
        <div class="u-row-meta">${fmtD(a.created_at)}</div>
      </div>
    </div>
  `).join('');
}

/* ─── 4. MAIN RENDER ────────────────────────────────────────── */

async function renderDashboard() {
  const el = $('page');
  const stats = _getDashboardStats();
  const healthColor = stats.score > 80 ? '#10b981' : stats.score > 50 ? '#f59e0b' : '#ef4444';

  el.innerHTML = `
    <div class="u-dash">
      
      <div class="u-hero">
        <div class="u-hero-title">
          <h1>Tableau de bord</h1>
          <p>${new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
        </div>
        <button class="btn btn-primary" onclick="openNewTicket()">+ Signalement</button>
      </div>

      <div class="u-health-bar" style="--score-color: ${healthColor}">
        <div class="u-score-circle">${stats.score}%</div>
        <div>
          <div style="font-weight:700; font-size:18px;">État de la copropriété : ${stats.score > 50 ? 'Saine' : 'Vigilance'}</div>
          <div style="font-size:13px; opacity:0.8;">${stats.critiques.length} urgence(s) et ${stats.exp.length} contrat(s) expiré(s) détectés.</div>
        </div>
      </div>

      <div class="u-col-left">
        
        <div class="u-card">
          <div class="u-card-header">
            <span class="u-card-title">🔧 Derniers signalements</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('tickets')">Tout voir →</button>
          </div>
          <div class="u-card-body">
            ${(cache.tickets || []).slice(0, 6).map(t => `
              <div class="u-row" onclick="openDetail('${t.id}')">
                <div class="u-row-icon" style="background:${t.urgence === 'critique' ? '#fee2e2':'#dbeafe'}">
                  ${t.urgence === 'critique' ? '🔴' : '🔵'}
                </div>
                <div class="u-row-main">
                  <div class="u-row-title">${escHtml(t.titre)}</div>
                  <div class="u-row-meta">${t.batiment || 'Zone commune'} • ${depuisJours(t.created_at)}</div>
                </div>
                <div>${badgeStatut(t.statut)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="u-card">
          <div class="u-card-header"><span class="u-card-title">📈 Activité mensuelle</span></div>
          <div class="u-card-body" style="padding:20px;">
            <canvas id="dash-chart" height="140"></canvas>
          </div>
        </div>

      </div>

      <div class="u-col-right">

        <div class="u-card">
          <div class="u-card-header">
            <span class="u-card-title">📅 Agenda</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('agenda')">Agenda →</button>
          </div>
          <div class="u-card-body" id="dash-agenda-list">
            <div style="padding:20px; text-align:center;">Chargement de l'agenda...</div>
          </div>
        </div>

        <div class="u-card">
          <div class="u-card-header">
            <span class="u-card-title">📢 Annonces</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('annonces')">Voir tout</button>
          </div>
          <div class="u-card-body" id="dash-annonces-list">
            <div style="padding:20px; text-align:center;">Chargement des annonces...</div>
          </div>
        </div>

        ${isManager() ? `
        <div class="u-card">
          <div class="u-card-header">
            <span class="u-card-title">📄 Contrats alertes</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('contrats')">Gérer</button>
          </div>
          <div class="u-card-body">
            ${stats.exp.slice(0, 3).map(c => `
              <div class="u-row" onclick="nav('contrats')">
                <div class="u-row-main">
                  <div class="u-row-title" style="color:var(--u-danger)">${escHtml(c.fournisseur)}</div>
                  <div class="u-row-meta">Expiré le ${fmtD(c.date_echeance)}</div>
                </div>
              </div>
            `).join('') || '<div style="padding:20px; text-align:center; color:var(--u-success);">Conformité 100%</div>'}
          </div>
        </div>
        ` : ''}

      </div>

    </div>
  `;

  // Chargement asynchrone des données
  renderDashChart();
  _renderAgendaModule();
  _renderAnnoncesModule();
}
