/**
 * ── COPROSYNC COMMAND CENTER V2 ──
 * Dashboard Haute Performance pour Gestion de Copropriété
 */

// État local du dashboard
let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ─── 1. INJECTION DU DESIGN SYSTEM (CSS) ─────────────────────── */
(function injectDashboardStyles() {
  if (document.getElementById('coprosync-ultra-css')) return;
  const s = document.createElement('style');
  s.id = 'coprosync-ultra-css';
  s.textContent = `
    :root {
      --u-bg: #f8fafc;
      --u-card-bg: #ffffff;
      --u-accent: #2563eb;
      --u-text-main: #1e293b;
      --u-text-muted: #64748b;
      --u-border: #e2e8f0;
      --u-radius: 16px;
      --u-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
    }

    .dash-ultra-wrapper { padding: 20px; font-family: 'Inter', system-ui, sans-serif; color: var(--u-text-main); background: var(--u-bg); }
    
    /* Header & Welcome */
    .u-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .u-welcome h1 { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
    .u-welcome p { color: var(--u-text-muted); margin: 4px 0 0; font-size: 14px; }

    /* Health Gauge Card */
    .u-health-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: var(--u-radius); padding: 24px; color: white;
      display: flex; align-items: center; gap: 24px; margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .u-health-circle {
      width: 80px; height: 80px; border-radius: 50%; border: 6px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800;
      position: relative;
    }
    .u-health-circle::after {
      content: ''; position: absolute; inset: -6px; border-radius: 50%;
      border: 6px solid var(--score-color, #22c55e); clip-path: inset(0 0 0 0);
    }

    /* Grid System */
    .u-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; }
    .u-col-8 { grid-column: span 8; }
    .u-col-4 { grid-column: span 4; }
    @media (max-width: 1024px) { .u-col-8, .u-col-4 { grid-column: span 12; } }

    /* Cards */
    .u-card { 
      background: var(--u-card-bg); border: 1px solid var(--u-border); 
      border-radius: var(--u-radius); box-shadow: var(--u-shadow); overflow: hidden;
      display: flex; flex-direction: column;
    }
    .u-card-head { padding: 16px 20px; border-bottom: 1px solid var(--u-border); display: flex; justify-content: space-between; align-items: center; }
    .u-card-title { font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--u-text-muted); }
    .u-card-body { padding: 20px; flex: 1; }

    /* Stats Tiles */
    .u-stats-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .u-stat-tile { 
      background: white; padding: 16px; border-radius: 12px; border: 1px solid var(--u-border);
      transition: all 0.2s; cursor: pointer;
    }
    .u-stat-tile:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: var(--u-accent); }
    .u-stat-label { font-size: 12px; color: var(--u-text-muted); font-weight: 600; }
    .u-stat-value { font-size: 24px; font-weight: 800; display: block; margin-top: 4px; }

    /* List Items */
    .u-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
    .u-item:hover { background: #f1f5f9; }
    .u-item-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .u-item-content { flex: 1; min-width: 0; }
    .u-item-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .u-item-sub { font-size: 12px; color: var(--u-text-muted); }

    /* Badges */
    .u-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .bg-red { background: #fee2e2; color: #dc2626; }
    .bg-orange { background: #ffedd5; color: #d97706; }
    .bg-blue { background: #dbeafe; color: #2563eb; }
    .bg-green { background: #dcfce7; color: #16a34a; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .anim { animation: fadeIn 0.4s ease forwards; }
  `;
  document.head.appendChild(s);
})();

/* ─── 2. CALCULS DE DONNÉES ───────────────────────────────────── */

/**
 * Calcule l'indice de santé de la copropriété
 */
function _calculateHealth(tickets, contrats) {
  let score = 100;
  const ouverts = tickets.filter(t => !['résolu', 'clos'].includes(t.statut));
  const critiques = ouverts.filter(t => t.urgence === 'critique');
  const exp = contrats.filter(c => (new Date(c.date_echeance) < new Date()) && c.actif !== false);

  score -= (critiques.length * 15);
  score -= (ouverts.length * 2);
  score -= (exp.length * 10);
  
  const final = Math.max(5, score);
  let color = '#22c55e';
  if (final < 80) color = '#f59e0b';
  if (final < 50) color = '#ef4444';

  return { val: final, color, status: final > 80 ? 'Optimale' : final > 50 ? 'Vigilance' : 'Alerte' };
}

/* ─── 3. RENDU DU DASHBOARD ───────────────────────────────────── */

async function renderDashboard() {
  const container = $('page');
  const tickets = cache.tickets || [];
  const contrats = cache.contrats || [];
  const ouverts = tickets.filter(t => !['résolu', 'clos'].includes(t.statut));
  const health = _calculateHealth(tickets, contrats);

  // Construction du HTML
  container.innerHTML = `
    <div class="dash-ultra-wrapper">
      
      <header class="u-header anim">
        <div class="u-welcome">
          <h1>Bonjour, ${profile?.prenom || 'Bienvenue'} 👋</h1>
          <p>Voici l'état de votre copropriété ce ${new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
        </div>
        <div class="u-actions">
          <button class="btn btn-primary" onclick="openNewTicket()">+ Nouveau signalement</button>
        </div>
      </header>

      <section class="u-health-banner anim" style="--score-color: ${health.color}; animation-delay: 0.1s">
        <div class="u-health-circle">${health.val}%</div>
        <div class="u-health-info">
          <div style="font-size: 12px; text-transform: uppercase; opacity: 0.6; font-weight: 700;">Indice de Santé Immo</div>
          <div style="font-size: 20px; font-weight: 700;">Situation ${health.status}</div>
          <div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">
            ${health.val > 80 ? 'Tout fonctionne normalement.' : 'Certains points nécessitent votre attention immédiate.'}
          </div>
        </div>
      </section>

      <section class="u-stats-strip anim" style="animation-delay: 0.2s">
        <div class="u-stat-tile" onclick="nav('tickets')">
          <span class="u-stat-label">Tickets Ouverts</span>
          <span class="u-stat-value" style="color: #f59e0b;">${ouverts.length}</span>
        </div>
        <div class="u-stat-tile" onclick="nav('tickets')">
          <span class="u-stat-label">Urgences Critiques</span>
          <span class="u-stat-value" style="color: #ef4444;">${ouverts.filter(t => t.urgence === 'critique').length}</span>
        </div>
        <div class="u-stat-tile" onclick="nav('contrats')">
          <span class="u-stat-label">Contrats à renouveler</span>
          <span class="u-stat-value">${contrats.filter(c => (new Date(c.date_echeance) < new Date())).length}</span>
        </div>
        <div class="u-stat-tile">
          <span class="u-stat-label">Taux de résolution</span>
          <span class="u-stat-value" style="color: #22c55e;">${Math.round((tickets.filter(t => t.statut === 'résolu').length / (tickets.length || 1)) * 100)}%</span>
        </div>
      </section>

      <div class="u-grid">
        
        <div class="u-col-8">
          <div class="u-card anim" style="animation-delay: 0.3s">
            <div class="u-card-head">
              <span class="u-card-title">Signalements Récents</span>
              <button class="btn btn-ghost btn-sm" onclick="nav('tickets')">Tout voir</button>
            </div>
            <div class="u-card-body">
              <div id="u-recent-list">
                ${tickets.slice(0, 6).map(t => `
                  <div class="u-item" onclick="openDetail('${t.id}')">
                    <div class="u-item-icon ${t.urgence === 'critique' ? 'bg-red' : 'bg-blue'}">
                      ${t.urgence === 'critique' ? '🚨' : '🔧'}
                    </div>
                    <div class="u-item-content">
                      <div class="u-item-title">${escHtml(t.titre)}</div>
                      <div class="u-item-sub">${t.batiment || 'Zone commune'} • ${depuisJours(t.created_at)}</div>
                    </div>
                    ${badgeStatut(t.statut)}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="u-card anim" style="margin-top: 20px; animation-delay: 0.4s">
            <div class="u-card-head"><span class="u-card-title">Analyse d'activité</span></div>
            <div class="u-card-body">
              <canvas id="dash-chart" height="120"></canvas>
            </div>
          </div>
        </div>

        <div class="u-col-4">
          <div class="u-card anim" style="animation-delay: 0.5s">
            <div class="u-card-head"><span class="u-card-title">État par Bâtiment</span></div>
            <div class="u-card-body">
              ${_renderZoneStats(ouverts)}
            </div>
          </div>

          <div class="u-card anim" style="margin-top: 20px; animation-delay: 0.6s">
            <div class="u-card-head"><span class="u-card-title">Agenda & Événements</span></div>
            <div class="u-card-body" id="u-events-list">
              <div style="text-align: center; color: var(--u-text-muted); padding: 20px;">Chargement de l'agenda...</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Initialisation des widgets dynamiques
  renderDashChart();
  _loadDashboardAsyncData();
}

/**
 * Rendu de la répartition par zone avec barres de progression
 */
function _renderZoneStats(tickets) {
  const zones = (COPRO.tours || []).concat(['Parking', 'Espaces Verts', 'Garages']);
  const counts = {};
  tickets.forEach(t => { if(t.batiment) counts[t.batiment] = (counts[t.batiment] || 0) + 1; });

  return zones.map(z => {
    const c = counts[z] || 0;
    if (c === 0 && !COPRO.tours?.includes(z)) return '';
    const pct = Math.min(100, (c / 10) * 100);
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span style="font-weight: 600;">${z}</span>
          <span style="color: ${c > 0 ? 'var(--u-accent)' : 'var(--u-text-muted)'}">${c} ouvert(s)</span>
        </div>
        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: ${c > 2 ? '#ef4444' : 'var(--u-accent)'}; transition: width 1s;"></div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Charge les données asynchrones (Agenda, Annonces)
 */
async function _loadDashboardAsyncData() {
  // Simule ou appelle tes fonctions existantes loadDashboardWidgets()
  // Mais ici on injecte directement dans les nouveaux IDs
  try {
    const now = new Date().toISOString();
    const { data: events } = await sb.from('evenements').select('*').gte('date_debut', now).order('date_debut').limit(3);
    const evtEl = document.getElementById('u-events-list');
    
    if (events && events.length) {
      evtEl.innerHTML = events.map(e => `
        <div class="u-item">
          <div style="text-align: center; padding-right: 12px; border-right: 2px solid var(--u-border);">
            <div style="font-size: 14px; font-weight: 800;">${new Date(e.date_debut).getDate()}</div>
            <div style="font-size: 10px; text-transform: uppercase;">${new Date(e.date_debut).toLocaleDateString('fr-FR', {month: 'short'})}</div>
          </div>
          <div class="u-item-content" style="padding-left: 8px;">
            <div class="u-item-title">${escHtml(e.titre)}</div>
            <div class="u-item-sub">${new Date(e.date_debut).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      `).join('');
    } else {
      evtEl.innerHTML = '<div style="font-size: 13px; color: var(--u-text-muted); text-align: center;">Aucun événement prévu</div>';
    }
  } catch (err) {
    console.error("Erreur async dashboard:", err);
  }
}

// Les fonctions renderDashChart() et autres dépendances sont supposées être définies globalement
// ou à conserver en bas de ce fichier si tu veux un bloc 100% autonome.
