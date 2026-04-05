// ── DASHBOARD ──
let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ─── CSS dashboard amélioré ──────────────────────────────────── */
(function injectDashCSS() {
  if (document.getElementById('dash-enhanced-css')) return;
  const s = document.createElement('style');
  s.id = 'dash-enhanced-css';
  s.textContent = `
    /* ── Situation Room ── */
    .dash-situation {
      margin: 0 0 20px;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
      border: 1px solid var(--border, #e2e8f0);
    }
    .dash-situation-bar {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      font-weight: 600;
      border-bottom: 1px solid rgba(255,255,255,.15);
    }
    .dash-situation-bar.sr-green  { background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%); color: #fff; }
    .dash-situation-bar.sr-orange { background: linear-gradient(90deg, #d97706 0%, #f59e0b 100%); color: #fff; }
    .dash-situation-bar.sr-red    { background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%); color: #fff; }
    .dash-situation-phrase { flex: 1; font-size: 13px; opacity: .92; }
    .dash-situation-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: rgba(255,255,255,.5);
      box-shadow: 0 0 0 3px rgba(255,255,255,.25);
      flex-shrink: 0;
    }
    .dash-situation-dot.pulse {
      animation: srPulse 1.8s ease-in-out infinite;
    }
    @keyframes srPulse {
      0%,100% { box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
      50%      { box-shadow: 0 0 0 7px rgba(255,255,255,.0); }
    }

    /* ── Actions requises ── */
    .dash-actions-requises {
      padding: 10px 16px 14px;
      background: var(--surface, #fff);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dash-action-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .07em;
      color: var(--text-3, #94a3b8);
      margin-bottom: 2px;
    }
    .dash-action-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: transform .12s, box-shadow .12s;
      border: 1px solid transparent;
    }
    .dash-action-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .dash-action-card.ac-red    { background: rgba(239,68,68,.07);   border-color: rgba(239,68,68,.2); }
    .dash-action-card.ac-orange { background: rgba(245,158,11,.07);  border-color: rgba(245,158,11,.2); }
    .dash-action-card.ac-blue   { background: rgba(59,130,246,.07);  border-color: rgba(59,130,246,.2); }
    .dash-action-ico { font-size: 18px; flex-shrink: 0; }
    .dash-action-body { flex: 1; min-width: 0; }
    .dash-action-title {
      font-size: 13px; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dash-action-card.ac-red    .dash-action-title { color: var(--red, #ef4444); }
    .dash-action-card.ac-orange .dash-action-title { color: var(--amber, #f59e0b); }
    .dash-action-card.ac-blue   .dash-action-title { color: var(--accent, #2563eb); }
    .dash-action-sub  { font-size: 11px; color: var(--text-3, #94a3b8); margin-top: 1px; }
    .dash-action-btn  {
      font-size: 11px; font-weight: 700; padding: 4px 10px;
      border-radius: 6px; border: none; cursor: pointer;
      white-space: nowrap; flex-shrink: 0;
    }
    .ac-red    .dash-action-btn { background: var(--red,#ef4444);   color: #fff; }
    .ac-orange .dash-action-btn { background: var(--amber,#f59e0b); color: #fff; }
    .ac-blue   .dash-action-btn { background: var(--accent,#2563eb); color: #fff; }
    .dash-situation-all-good {
      padding: 14px 20px;
      font-size: 13px;
      color: var(--text-3, #94a3b8);
      text-align: center;
      background: var(--surface, #fff);
    }

    /* ── KPIs améliorés ── */
    .stat { cursor: pointer; }
    .stat-trend {
      font-size: 10px; margin-top: 2px;
      opacity: .7; font-weight: 500;
    }

    /* ── Tickets récents : badge urgence en bordure gauche ── */
    .act-item { border-left: 3px solid transparent; padding-left: 10px; }
    .act-item.urg-critique { border-left-color: var(--red, #ef4444); }
    .act-item.urg-important { border-left-color: var(--amber, #f59e0b); }
    .act-item.urg-normal { border-left-color: var(--accent, #2563eb); }

    /* ── Widget contrats ── */
    .dcc-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; border-bottom:1px solid var(--border,#e2e8f0); }
    .dcc-kpi { text-align:center; padding:8px 4px; border-radius:8px; background:var(--surface-2,#f8fafc); }
    .dcc-kpi-val { font-size:18px; font-weight:800; line-height:1; font-family:var(--font-head,inherit); }
    .dcc-kpi-label { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3,#94a3b8); font-weight:600; margin-top:3px; }
    .dcc-kpi.dcc-danger  { background:rgba(239,68,68,.07); }
    .dcc-kpi.dcc-danger  .dcc-kpi-val { color:var(--red,#ef4444); }
    .dcc-kpi.dcc-warning { background:rgba(245,158,11,.07); }
    .dcc-kpi.dcc-warning .dcc-kpi-val { color:var(--amber,#f59e0b); }
    .dcc-kpi.dcc-ok      { background:rgba(34,197,94,.07); }
    .dcc-kpi.dcc-ok      .dcc-kpi-val { color:var(--green,#22c55e); }
    .dcc-list { padding:4px 0 8px; }
    .dcc-row { display:flex; align-items:center; gap:10px; padding:8px 16px; cursor:pointer; transition:background .15s; }
    .dcc-row:hover { background:var(--surface-2,#f8fafc); }
    .dcc-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dcc-info { flex:1; min-width:0; }
    .dcc-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-1,#1a202c); }
    .dcc-type { font-size:11px; color:var(--text-3,#94a3b8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dcc-days { font-size:12px; font-weight:800; white-space:nowrap; flex-shrink:0; }
    .dcc-budget-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid var(--border,#e2e8f0); margin-top:2px; }
    .dcc-budget-label { font-size:11px; color:var(--text-3,#94a3b8); text-transform:uppercase; letter-spacing:.05em; font-weight:600; }
    .dcc-budget-val { font-size:14px; font-weight:800; color:var(--text-1,#1a202c); font-family:var(--font-head,inherit); }
    .dcc-empty { padding:20px 16px; text-align:center; font-size:13px; color:var(--text-3,#94a3b8); }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   SITUATION ROOM — barre de statut global + actions requises
═══════════════════════════════════════════════════════════════ */
function _buildSituationRoom(ouverts, critiques, syndic) {
  const contrats    = cache.contrats || [];
  const actifs      = contrats.filter(c => c.actif !== false);
  const contratsExp = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours ?? 90); });
  const votesOuverts = (typeof _votesCache !== 'undefined') ? _votesCache.filter(v => v.statut === 'ouvert') : [];

  // ── Calcul statut global ──
  const hasCritique   = critiques.length > 0;
  const hasContratExp = contratsExp.length > 0;
  const hasAlerte     = contratsAlt.length > 0 || syndic.length > 0;

  let barClass, statusIco, statusPhrase;
  if (hasCritique || hasContratExp) {
    barClass     = 'sr-red';
    statusIco    = '🚨';
    const parts  = [];
    if (critiques.length)   parts.push(critiques.length + ' signalement' + (critiques.length > 1 ? 's' : '') + ' critique' + (critiques.length > 1 ? 's' : ''));
    if (contratsExp.length) parts.push(contratsExp.length + ' contrat' + (contratsExp.length > 1 ? 's' : '') + ' expiré' + (contratsExp.length > 1 ? 's' : ''));
    statusPhrase = 'Action immédiate requise — ' + parts.join(' · ');
  } else if (hasAlerte) {
    barClass     = 'sr-orange';
    statusIco    = '⚠️';
    const parts  = [];
    if (contratsAlt.length) parts.push(contratsAlt.length + ' contrat' + (contratsAlt.length > 1 ? 's' : '') + ' en alerte');
    if (syndic.length)      parts.push(syndic.length + ' dossier' + (syndic.length > 1 ? 's' : '') + ' transmis au syndic');
    statusPhrase = 'Points de vigilance — ' + parts.join(' · ');
  } else {
    barClass     = 'sr-green';
    statusIco    = '✅';
    statusPhrase = 'Tout est sous contrôle — aucune anomalie détectée';
  }

  // ── Cartes d'action ──
  const actionCards = [];

  // Critiques non assignés
  critiques.slice(0, 2).forEach(ticket => {
    actionCards.push({
      cls:   'ac-red',
      ico:   '🚨',
      title: ticket.titre,
      sub:   (ticket.batiment || '') + (ticket.zone ? ' · ' + ticket.zone : '') + ' — ' + depuisJours(ticket.created_at),
      btn:   'Traiter',
      action: 'openDetail(\'' + ticket.id + '\')'
    });
  });

  // Contrats expirés
  contratsExp.slice(0, 2).forEach(c => {
    actionCards.push({
      cls:   'ac-red',
      ico:   '📄',
      title: c.fournisseur + ' — contrat expiré',
      sub:   c.type_contrat + ' · expiré depuis ' + Math.abs(daysUntil(c.date_echeance)) + 'j',
      btn:   'Renouveler',
      action: "nav('contrats')"
    });
  });

  // Contrats en alerte (max 2)
  contratsAlt.slice(0, 2).forEach(c => {
    const d = daysUntil(c.date_echeance);
    actionCards.push({
      cls:   'ac-orange',
      ico:   '⚠️',
      title: c.fournisseur + ' — échéance dans ' + d + 'j',
      sub:   c.type_contrat + (c.contact_nom ? ' · ' + c.contact_nom : ''),
      btn:   'Voir',
      action: "nav('contrats')"
    });
  });

  // Votes ouverts sans participation (max 1)
  if (votesOuverts.length > 0 && typeof _reponsesCache !== 'undefined') {
    const sansMaRep = votesOuverts.filter(v => !_reponsesCache[v.id]);
    if (sansMaRep.length > 0) {
      actionCards.push({
        cls:   'ac-blue',
        ico:   '🗳️',
        title: sansMaRep.length + ' vote' + (sansMaRep.length > 1 ? 's' : '') + ' en attente de votre participation',
        sub:   sansMaRep.slice(0, 2).map(v => v.titre).join(' · '),
        btn:   'Voter',
        action: "nav('votes')"
      });
    }
  }

  // ── Rendu ──
  const cardsHTML = actionCards.length === 0
    ? '<div class="dash-situation-all-good">Aucune action immédiate requise 🎉</div>'
    : '<div class="dash-actions-requises">'
      + '<div class="dash-action-label">Actions requises</div>'
      + actionCards.map(a => `
          <div class="dash-action-card ${a.cls}" onclick="${a.action}">
            <div class="dash-action-ico">${a.ico}</div>
            <div class="dash-action-body">
              <div class="dash-action-title">${a.title}</div>
              <div class="dash-action-sub">${a.sub}</div>
            </div>
            <button class="dash-action-btn" onclick="event.stopPropagation();${a.action}">${a.btn}</button>
          </div>`).join('')
      + '</div>';

  return `
    <div class="dash-situation" style="animation:pageIn .3s .02s both;">
      <div class="dash-situation-bar ${barClass}">
        <div class="dash-situation-dot ${barClass !== 'sr-green' ? 'pulse' : ''}"></div>
        <span>${statusIco}</span>
        <span class="dash-situation-phrase">${statusPhrase}</span>
        <span style="font-size:11px;opacity:.7;">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      ${cardsHTML}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   WIDGET CONTRATS
═══════════════════════════════════════════════════════════════ */
function _buildDashContrats() {
  const contrats  = cache.contrats || [];
  const actifs    = contrats.filter(c => c.actif !== false);
  const expires   = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes   = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours ?? 90); });
  const conformes = actifs.filter(c => daysUntil(c.date_echeance) > (c.alerte_jours ?? 90));
  const budget    = actifs.reduce((s, c) => s + (c.montant_annuel || 0), 0);
  const urgents   = [...expires, ...alertes]
    .sort((a, b) => new Date(a.date_echeance) - new Date(b.date_echeance))
    .slice(0, 4);
  const fmtEur    = n => n.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' \u20ac';

  function rowMeta(c) {
    const d = daysUntil(c.date_echeance);
    if (d < 0)   return { color: 'var(--red,#ef4444)',   label: 'Expiré (' + (-d) + 'j)', css: 'color:var(--red,#ef4444)' };
    if (d <= 30) return { color: 'var(--red,#ef4444)',   label: d + 'j ⚠️',               css: 'color:var(--red,#ef4444)' };
    return             { color: 'var(--amber,#f59e0b)', label: d + 'j',                  css: 'color:var(--amber,#f59e0b)' };
  }

  const headerColor = expires.length > 0 ? 'color:var(--red,#ef4444);' : alertes.length > 0 ? 'color:var(--amber,#f59e0b);' : '';
  const titleIcon   = expires.length > 0 ? '🔴' : alertes.length > 0 ? '⚠️' : '📄';

  return `
    <div class="card dash2-card" style="animation:pageIn .3s .38s both;">
      <div class="card-header">
        <span class="card-title dash2-card-title" style="${headerColor}">${titleIcon} Contrats fournisseurs</span>
        <button class="btn btn-ghost btn-sm" onclick="nav('contrats')">Gérer →</button>
      </div>
      <div class="dcc-kpis">
        <div class="dcc-kpi ${expires.length  ? 'dcc-danger'  : ''}">
          <div class="dcc-kpi-val">${expires.length}</div>
          <div class="dcc-kpi-label">Expirés</div>
        </div>
        <div class="dcc-kpi ${alertes.length  ? 'dcc-warning' : ''}">
          <div class="dcc-kpi-val">${alertes.length}</div>
          <div class="dcc-kpi-label">En alerte</div>
        </div>
        <div class="dcc-kpi dcc-ok">
          <div class="dcc-kpi-val">${conformes.length}</div>
          <div class="dcc-kpi-label">Conformes</div>
        </div>
      </div>
      <div class="dcc-list">
        ${urgents.length === 0
          ? '<div class="dcc-empty">✅ Tous les contrats sont conformes</div>'
          : urgents.map(c => {
              const m = rowMeta(c);
              return '<div class="dcc-row" onclick="nav(\'contrats\')">'
                + '<div class="dcc-dot" style="background:' + m.color + ';"></div>'
                + '<div class="dcc-info">'
                + '<div class="dcc-name">' + c.fournisseur + '</div>'
                + '<div class="dcc-type">' + (c.type_contrat || '') + (c.contact_nom ? ' · ' + c.contact_nom : '') + '</div>'
                + '</div>'
                + '<div class="dcc-days" style="' + m.css + '">' + m.label + '</div>'
                + '</div>';
            }).join('')
        }
      </div>
      <div class="dcc-budget-bar">
        <span class="dcc-budget-label">💰 Budget annuel (actifs)</span>
        <span class="dcc-budget-val">${fmtEur(budget)}</span>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DASHBOARD PRINCIPAL
═══════════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const el = $('page');

  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div style="padding:16px;">...skeleton...</div>';
    return;
  }

  const t        = cache.tickets;
  const ouverts  = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques= t.filter(x => x.urgence === 'critique' && x.statut !== 'résolu' && x.statut !== 'clos');
  const syndic   = t.filter(x => x.statut === 'transmis_syndic');
  const resolus  = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const recent = t.slice(0, 6);

  // Situation room HTML (managers uniquement)
  const situationHTML = isManager() ? _buildSituationRoom(ouverts, critiques, syndic) : '';

  el.innerHTML = '<div class="dash2" id="dash-content">'

    // ── Hero ──
    + '<section class="dash2-hero">'
    + '<div class="dash2-kicker">'
    + '<span class="dash2-kicker-line"></span>'
    + new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})
    + '<span class="dash2-kicker-line"></span>'
    + '</div>'
    + '<div class="dash2-hero-main">'
    + '<div>'
    + '<h1 class="dash2-title">Bonjour, ' + displayName(profile && profile.prenom, profile && profile.nom, user && user.email, 'bienvenue').split(' ')[0] + ' 👋</h1>'
    + '<div class="dash2-subline">'
    + (critiques.length > 0
        ? '<span class="dash2-pill danger">🔴 ' + critiques.length + ' critique' + (critiques.length > 1 ? 's' : '') + '</span>'
        : '<span class="dash2-pill success">✅ Tout va bien</span>')
    + (ouverts.length > 0 ? '<span class="dash2-muted">' + ouverts.length + ' signalement' + (ouverts.length > 1 ? 's' : '') + ' en cours</span>' : '')
    + '</div>'
    + '</div>'
    + '<div class="dash2-actions">'
    + '<button class="btn btn-primary" onclick="openNewTicket()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nouveau signalement</button>'
    + '<button class="btn btn-secondary" onclick="nav(\'tickets\')">Voir les signalements</button>'
    + '<button class="btn btn-ghost" onclick="nav(\'faq\')" title="FAQ, raccourcis et aide">❓ FAQ</button>'
    + '</div>'
    + '</div>'
    + '</section>'

    // ── Situation Room (managers) ──
    + situationHTML

    // ── KPIs ──
    + '<section class="dash2-metrics stats-row">'
    + '<div class="stat orange" onclick="nav(\'tickets\')" style="animation:pageIn .3s .05s both;">'
    + '<div class="stat-icon">🔧</div>'
    + '<div class="stat-num">' + ouverts.length + '</div>'
    + '<div class="stat-label">Ouverts</div>'
    + '<div class="stat-sub">Signalements actifs</div>'
    + '</div>'
    + '<div class="stat red" onclick="nav(\'tickets\')" style="animation:pageIn .3s .10s both;">'
    + '<div class="stat-icon">🚨</div>'
    + '<div class="stat-num">' + critiques.length + '</div>'
    + '<div class="stat-label">Critiques</div>'
    + '<div class="stat-sub">Action requise</div>'
    + '</div>'
    + (isManager()
        ? '<div class="stat blue" style="animation:pageIn .3s .15s both;"><div class="stat-icon">📤</div><div class="stat-num">' + syndic.length + '</div><div class="stat-label">Transmis</div><div class="stat-sub">En attente</div></div>'
        : '<div class="stat blue" onclick="nav(\'tickets\')" style="animation:pageIn .3s .15s both;"><div class="stat-icon">📋</div><div class="stat-num">' + t.filter(x => x.auteur_id === user.id).length + '</div><div class="stat-label">Les miens</div><div class="stat-sub">Créés par moi</div></div>')
    + '<div class="stat green" style="animation:pageIn .3s .20s both;">'
    + '<div class="stat-icon">✅</div>'
    + '<div class="stat-num">' + resolus.length + '</div>'
    + '<div class="stat-label">Résolus</div>'
    + '<div class="stat-sub">Total traités</div>'
    + '</div>'
    + '</section>'

    // ── Focusbar ──
    + '<section class="dash2-focusbar" id="dash-focusbar" aria-label="Filtres du tableau de bord">'
    + '<button class="dash2-chip sel" data-dash-focus="tout" onclick="setDashFocus(\'tout\')">Tout</button>'
    + '<button class="dash2-chip warn" data-dash-focus="ouvert" onclick="setDashFocus(\'ouvert\')">Ouverts</button>'
    + '<button class="dash2-chip danger" data-dash-focus="critique" onclick="setDashFocus(\'critique\')">Critiques</button>'
    + (isManager()
        ? '<button class="dash2-chip info" data-dash-focus="transmis" onclick="setDashFocus(\'transmis\')">Transmis</button>'
        : '<button class="dash2-chip info" data-dash-focus="mine" onclick="setDashFocus(\'mine\')">Mes</button>')
    + '<button class="dash2-chip success" data-dash-focus="resolu" onclick="setDashFocus(\'resolu\')">Résolus</button>'
    + '<button class="dash2-chip dash2-chip-zone" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()">Zone sélectionnée</button>'
    + '</section>'

    // ── Grille principale ──
    + '<section class="dash2-grid g2">'

    // Colonne gauche : signalements récents
    + '<div class="card dash2-card" style="animation:pageIn .3s .25s both;">'
    + '<div class="card-header"><span class="card-title dash2-card-title">Signalements récents</span><button class="btn btn-ghost btn-sm" onclick="nav(\'tickets\')">Tout voir →</button></div>'
    + '<div class="dash2-card-content"><div id="dash-recent-list">'
    + (recent.length === 0
        ? emptyState('📋', 'Tout va bien !', 'Aucun signalement en cours dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>')
        : recent.map(function(tk) {
            var urgCls = tk.urgence === 'critique' ? 'urg-critique' : tk.urgence === 'important' ? 'urg-important' : 'urg-normal';
            var bgCol  = tk.urgence === 'critique' ? 'var(--red-light)' : tk.urgence === 'important' ? 'var(--orange-light)' : 'var(--blue-light)';
            var bdCol  = tk.urgence === 'critique' ? 'var(--red-border)' : tk.urgence === 'important' ? 'var(--orange-border)' : 'var(--blue-border)';
            var ico    = tk.urgence === 'critique' ? '🔴' : tk.urgence === 'important' ? '🟠' : '🔵';
            return '<div class="act-item ' + urgCls + '" onclick="openDetail(\'' + tk.id + '\')">'
              + '<div class="act-ic" style="background:' + bgCol + ';border:1px solid ' + bdCol + ';">' + ico + '</div>'
              + '<div style="flex:1;min-width:0;overflow:hidden;">'
              + '<div class="act-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + escHtml(tk.titre) + '</div>'
              + '<div class="act-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(tk.batiment || '') + (tk.zone ? ' · ' + escHtml(tk.zone) : '') + '</div>'
              + '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' + badgeStatut(tk.statut) + '<span style="font-size:10px;color:var(--text-3);">⏱ ' + depuisJours(tk.created_at) + '</span></div>'
              + '</div>'
              + '</div>';
          }).join(''))
    + '</div></div>'
    + '</div>'

    // Colonne droite : stack de widgets
    + '<div class="dash2-stack">'

    // Chart
    + '<div class="card dash2-card" style="animation:pageIn .3s .30s both;">'
    + '<div class="card-header"><span class="card-title dash2-card-title">Activité · 6 mois</span></div>'
    + '<div class="dash2-card-content"><div class="dash2-chart-wrap"><canvas id="dash-chart" height="110"></canvas><div id="dash-chart-tip" class="dash2-chart-tip" style="display:none;"></div></div></div>'
    + '</div>'

    // Par bâtiment
    + '<div class="card dash2-card" style="animation:pageIn .3s .35s both;">'
    + '<div class="card-header"><span class="card-title dash2-card-title">Par bâtiment</span></div>'
    + '<div class="dash2-card-content"><div id="dash-zone-list">'
    + (function() {
        var zones = (COPRO.tours || []).concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']);
        var rows  = zones.map(function(zone) {
          var cnt = ouverts.filter(function(tk) { return tk.batiment === zone; }).length;
          if (cnt === 0) return '';
          var isTour   = zone.startsWith('Tour');
          var pct      = Math.min(100, cnt * 25);
          var barColor = cnt >= 3 ? 'var(--red)' : cnt >= 2 ? 'var(--orange)' : 'var(--accent)';
          return '<div class="dash2-zone-row dash2-zone-clickable" onclick="setDashZoneFocus(' + JSON.stringify(zone) + ')" title="Focus: ' + escHtml(zone) + '">'
            + '<div class="dash2-zone-name">' + (isTour ? zone : zone.split(' ')[0]) + '</div>'
            + '<div class="dash2-zone-bar"><div style="background:' + barColor + ';width:' + pct + '%;"></div></div>'
            + '<div class="dash2-zone-count" style="color:' + barColor + ';">' + cnt + '</div>'
            + '</div>';
        }).join('');
        return rows || '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px 0;">Aucun problème ouvert 🎉</div>';
      })()
    + '</div></div></div>'

    // Widget contrats (managers)
    + (isManager() ? _buildDashContrats() : '')

    // Widget événements
    + '<div class="card dash2-card" id="dash-events-widget">'
    + '<div class="card-header"><span class="card-title">📅 Prochains événements</span><button class="btn btn-ghost btn-sm" onclick="nav(\'agenda\')">Agenda →</button></div>'
    + '<div class="dash2-card-content" id="dash-events-list"><div style="font-size:13px;color:var(--text-3);text-align:center;padding:12px;">Chargement…</div></div>'
    + '</div>'

    // Widget annonces
    + '<div class="card dash2-card" id="dash-annonces-widget">'
    + '<div class="card-header"><span class="card-title">📢 Annonces</span><button class="btn btn-ghost btn-sm" onclick="nav(\'annonces\')">Toutes →</button></div>'
    + '<div class="dash2-card-content" id="dash-annonces-list"><div style="font-size:13px;color:var(--text-3);text-align:center;padding:12px;">Chargement…</div></div>'
    + '</div>'

    // Widget votes
    + (function() {
        var votes = (typeof _votesCache !== 'undefined') ? _votesCache.filter(function(v) { return v.statut === 'ouvert'; }) : [];
        if (!votes.length) return '';
        return '<div class="card dash2-card">'
          + '<div class="card-header"><span class="card-title">🗳️ Votes en cours</span><button class="btn btn-ghost btn-sm" onclick="nav(\'votes\')">Voter →</button></div>'
          + '<div class="dash2-card-content">'
          + votes.slice(0, 3).map(function(v) {
              var maRep = (typeof _reponsesCache !== 'undefined') ? _reponsesCache[v.id] : null;
              var total = (typeof _allReponsesCache !== 'undefined' && _allReponsesCache[v.id]) ? _allReponsesCache[v.id].length : 0;
              return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav(\'votes\')">'
                + '<div style="font-size:20px;">' + ((typeof VOTE_TYPES !== 'undefined' && VOTE_TYPES[v.type]) ? VOTE_TYPES[v.type].ico : '🗳️') + '</div>'
                + '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(v.titre) + '</div>'
                + '<div style="font-size:11px;color:var(--text-3);">' + total + ' participant' + (total > 1 ? 's' : '') + '</div></div>'
                + (maRep
                    ? '<span style="font-size:10px;background:var(--green-light);color:var(--green);padding:2px 7px;border-radius:8px;font-weight:700;">✓ Voté</span>'
                    : '<span style="font-size:10px;background:var(--orange-light);color:var(--orange);padding:2px 7px;border-radius:8px;font-weight:700;">À voter</span>')
                + '</div>';
            }).join('')
          + '</div></div>';
      })()

    // Widget documents
    + (function() {
        var docs = (typeof _docsCache !== 'undefined') ? _docsCache : [];
        if (!docs.length) return '';
        return '<div class="card dash2-card">'
          + '<div class="card-header"><span class="card-title">📄 Documents récents</span><button class="btn btn-ghost btn-sm" onclick="nav(\'documents\')">Voir tous →</button></div>'
          + '<div class="dash2-card-content">'
          + docs.slice(0, 4).map(function(doc) {
              var cat   = (typeof DOC_CATS !== 'undefined' && DOC_CATS[doc.categorie]) ? DOC_CATS[doc.categorie] : { ico: '📄', color: '#6b7280' };
              var isNew = (typeof _docsVus !== 'undefined') ? !_docsVus.has(doc.id) : false;
              return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav(\'documents\')">'
                + '<div style="font-size:18px;">' + cat.ico + '</div>'
                + '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(doc.titre) + '</div>'
                + '<div style="font-size:11px;color:var(--text-3);">' + fmtD(doc.created_at) + '</div></div>'
                + (isNew ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:2px 7px;border-radius:8px;font-weight:700;">Nouveau</span>' : '')
                + '</div>';
            }).join('')
          + '</div></div>';
      })()

    // Installer l'app
    + '<div class="card dash2-card">'
    + '<div class="card-body" style="text-align:center;">'
    + '<div style="font-size:24px;margin-bottom:8px;">📱</div>'
    + '<div style="font-family:var(--font-head);font-weight:700;margin-bottom:6px;">Installer l\'app</div>'
    + '<div style="font-size:12px;color:var(--text-2);margin-bottom:12px;">iPhone : Safari → Partager → "Sur l\'écran d\'accueil"<br>Android : Chrome → ⋮ → "Installer l\'application"</div>'
    + '</div></div>'

    + '</div>' // fin dash2-stack
    + '</section>'
    + '</div>'; // fin dash2

  loadDashboardWidgets();
}

/* ═══════════════════════════════════════════════════════════════
   FOCUS / FILTRE
═══════════════════════════════════════════════════════════════ */
function clearDashFocus() { setDashFocus('tout'); }

function setDashZoneFocus(zone) {
  _dashFocusMode = 'zone';
  _dashFocusZone = zone;
  refreshDashFocus();
}

function setDashFocus(mode) {
  _dashFocusMode = mode || 'tout';
  _dashFocusZone = null;
  refreshDashFocus();
}

function isResolvedStatut(statut) { return statut === 'résolu' || statut === 'clos'; }
function isOpenStatut(statut)     { return !isResolvedStatut(statut); }

function getDashTicketsForRecent() {
  var list = cache.tickets || [];
  var mode = _dashFocusMode;
  if (mode === 'tout')     return list;
  if (mode === 'ouvert')   return list.filter(function(t) { return isOpenStatut(t.statut); });
  if (mode === 'critique') return list.filter(function(t) { return t.urgence === 'critique' && isOpenStatut(t.statut); });
  if (mode === 'resolu')   return list.filter(function(t) { return isResolvedStatut(t.statut); });
  if (mode === 'mine')     return list.filter(function(t) { return t.auteur_id === user.id && isOpenStatut(t.statut); });
  if (mode === 'transmis') return list.filter(function(t) { return t.statut === 'transmis_syndic'; });
  if (mode === 'zone')     return list.filter(function(t) { return t.batiment === _dashFocusZone && isOpenStatut(t.statut); });
  return list;
}

function getDashTicketsForZones() {
  var list = cache.tickets || [];
  if (_dashFocusMode === 'tout') return list.filter(function(t) { return isOpenStatut(t.statut); });
  return getDashTicketsForRecent();
}

function getDashTicketsForChart() {
  var list = cache.tickets || [];
  if (_dashFocusMode === 'tout') return list;
  return getDashTicketsForRecent();
}

function renderDashRecentListHTML(list) {
  var emptyByMode = {
    ouvert:   emptyState('✅', 'Tout va bien !', 'Aucun signalement en cours dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>'),
    critique: emptyState('🔍', 'Pas de critique pour le moment', 'Rien de critique à traiter dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>'),
    resolu:   emptyState('🎉', 'Rien à afficher', 'Pas de résolutions récentes dans cette vue.', '<button class="btn btn-secondary btn-sm" onclick="nav(\'tickets\')">Voir tout →</button>'),
    mine:     emptyState('👤', 'Aucun ticket actif', 'Vous n\u0027avez pas de signalement ouvert en ce moment.', '<button class="btn btn-secondary btn-sm" onclick="nav(\'tickets\')">Voir mes tickets →</button>'),
    transmis: emptyState('📤', 'Rien en attente', 'Aucun ticket transmis à gérer actuellement.', '<button class="btn btn-secondary btn-sm" onclick="nav(\'tickets\')">Voir →</button>'),
    zone:     emptyState('🧭', 'Aucune anomalie ici', 'Aucun signalement ouvert dans cette zone.', '<button class="btn btn-secondary btn-sm" onclick="nav(\'tickets\')">Voir →</button>')
  };

  if (!list.length) return emptyByMode[_dashFocusMode] || emptyState('📋', 'Rien à signaler', 'La résidence tourne bien.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>');

  return list.slice(0, 6).map(function(tk) {
    var urgCls = tk.urgence === 'critique' ? 'urg-critique' : tk.urgence === 'important' ? 'urg-important' : 'urg-normal';
    var bgCol  = tk.urgence === 'critique' ? 'var(--red-light)' : tk.urgence === 'important' ? 'var(--orange-light)' : 'var(--blue-light)';
    var bdCol  = tk.urgence === 'critique' ? 'var(--red-border)' : tk.urgence === 'important' ? 'var(--orange-border)' : 'var(--blue-border)';
    var ico    = tk.urgence === 'critique' ? '🔴' : tk.urgence === 'important' ? '🟠' : '🔵';
    return '<div class="act-item ' + urgCls + '" onclick="openDetail(\'' + tk.id + '\')">'
      + '<div class="act-ic" style="background:' + bgCol + ';border:1px solid ' + bdCol + ';">' + ico + '</div>'
      + '<div style="flex:1;min-width:0;overflow:hidden;">'
      + '<div class="act-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + escHtml(tk.titre) + '</div>'
      + '<div class="act-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(tk.batiment || '') + (tk.zone ? ' · ' + escHtml(tk.zone) : '') + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">' + badgeStatut(tk.statut) + '<span style="font-size:10px;color:var(--text-3);">⏱ ' + depuisJours(tk.created_at) + '</span></div>'
      + '</div></div>';
  }).join('');
}

function renderDashZonesListHTML(tickets) {
  var zoneNames = (COPRO.tours || []).concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']);
  var counts = {};
  tickets.forEach(function(t) {
    var k = t.batiment || '';
    if (!k) return;
    counts[k] = (counts[k] || 0) + 1;
  });
  var rows = zoneNames.map(function(zone) {
    var cnt = counts[zone] || 0;
    if (cnt === 0) return '';
    var isTour   = zone.startsWith('Tour');
    var pct      = Math.min(100, cnt * 25);
    var barColor = cnt >= 3 ? 'var(--red)' : cnt >= 2 ? 'var(--orange)' : 'var(--accent)';
    return '<div class="dash2-zone-row dash2-zone-clickable" onclick="setDashZoneFocus(' + JSON.stringify(zone) + ')" title="Focus: ' + escHtml(zone) + '">'
      + '<div class="dash2-zone-name">' + (isTour ? zone : zone.split(' ')[0]) + '</div>'
      + '<div class="dash2-zone-bar"><div style="background:' + barColor + ';width:' + pct + '%;"></div></div>'
      + '<div class="dash2-zone-count" style="color:' + barColor + ';">' + cnt + '</div>'
      + '</div>';
  }).join('');
  return rows || '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px 0;">Aucun problème ici 🎯</div>';
}

function refreshDashFocus() {
  var recentEl = $('dash-recent-list');
  var zoneEl   = $('dash-zone-list');
  if (!recentEl || !zoneEl) return;

  var bar = $('dash-focusbar');
  if (bar) {
    bar.querySelectorAll('[data-dash-focus]').forEach(function(btn) {
      btn.classList.toggle('sel', btn.getAttribute('data-dash-focus') === _dashFocusMode);
    });
    var chipZone = $('dash-chip-zone');
    if (chipZone) {
      var show = _dashFocusMode === 'zone' && !!_dashFocusZone;
      chipZone.style.display = show ? '' : 'none';
      if (show) chipZone.textContent = 'Zone: ' + _dashFocusZone;
    }
  }

  recentEl.innerHTML = renderDashRecentListHTML(getDashTicketsForRecent());
  zoneEl.innerHTML   = renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   WIDGETS ASYNCHRONES
═══════════════════════════════════════════════════════════════ */
async function loadDashboardWidgets() {
  // Événements
  var now = new Date().toISOString();
  var evtRes = await sb.from('evenements').select('*').gte('date_debut', now).order('date_debut').limit(4);
  var evts   = evtRes.data;
  var evtEl  = $('dash-events-list');
  if (evtEl) {
    if (!evts || !evts.length) {
      evtEl.innerHTML = '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px;">Aucun événement à venir</div>';
    } else {
      evtEl.innerHTML = evts.map(function(e) {
        var et      = (typeof EVENT_TYPES !== 'undefined' && EVENT_TYPES[e.type]) ? EVENT_TYPES[e.type] : (typeof EVENT_TYPES !== 'undefined' ? EVENT_TYPES.autre : { color: '#6b7280' });
        var d       = new Date(e.date_debut);
        var dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        var timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        var isImmi  = (d - new Date()) < 86400000;
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav(\'agenda\')">'
          + '<div style="width:4px;height:36px;border-radius:2px;background:' + et.color + ';flex-shrink:0;"></div>'
          + '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;' + (isImmi ? 'color:var(--orange);' : '') + '">' + escHtml(e.titre) + '</div>'
          + '<div style="font-size:11px;color:var(--text-3);">📅 ' + dateStr + ' à ' + timeStr + (e.lieu ? ' · ' + escHtml(e.lieu) : '') + '</div></div>'
          + (isImmi ? '<span style="font-size:10px;background:var(--orange-light);color:var(--orange);padding:2px 6px;border-radius:8px;font-weight:700;">Bientôt</span>' : '')
          + '</div>';
      }).join('');
    }
    (evts || []).filter(function(e) {
      var d = new Date(e.date_debut); var diff = d - new Date();
      return diff > 0 && diff < 86400000;
    }).forEach(function(e) {
      pushNotif('📅 Rappel', e.titre + ' — demain à ' + new Date(e.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 'statut_change', null);
    });
  }

  // Annonces
  var annRes  = await sb.from('annonces').select('*').order('epingle', { ascending: false }).order('created_at', { ascending: false }).limit(12);
  var annsRaw = annRes.data;
  var anns    = (annsRaw || []).filter(function(a) { return annonceReaderCanSee(a); }).slice(0, 3);
  var annEl   = $('dash-annonces-list');
  if (annEl) {
    if (!anns.length) {
      annEl.innerHTML = '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px;">Aucune annonce</div>';
    } else {
      var icons = { urgent: '🚨', important: '⚠️', info: '📢' };
      annEl.innerHTML = anns.map(function(a) {
        return '<div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav(\'annonces\')">'
          + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">'
          + '<span>' + (a.epingle ? '📌' : (icons[a.type] || '📢')) + '</span>'
          + '<div style="font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(a.titre) + '</div>'
          + '</div>'
          + (a.contenu ? '<div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(a.contenu.substring(0, 80)) + (a.contenu.length > 80 ? '…' : '') + '</div>' : '')
          + '</div>';
      }).join('');
    }
  }

  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   GRAPHIQUE CANVAS
═══════════════════════════════════════════════════════════════ */
function renderDashChart() {
  var canvas = $('dash-chart');
  if (!canvas) return;
  var ctx    = canvas.getContext('2d');
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var tipEl  = $('dash-chart-tip');

  var months = [];
  var now    = new Date();
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() });
  }

  var ticketsForChart = getDashTicketsForChart();
  var created  = months.map(function(m) { return ticketsForChart.filter(function(t) { var d = new Date(t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length; });
  var resolved = months.map(function(m) { return ticketsForChart.filter(function(t) { if (!isResolvedStatut(t.statut)) return false; var d = new Date(t.updated_at || t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length; });

  var textColor   = isDark ? '#9b9890' : '#6b6860';
  var gridColor   = isDark ? '#2a2825' : '#f0ede8';
  var accentColor = '#2563eb';
  var greenColor  = '#10b981';

  var W   = canvas.offsetWidth || 300;
  var H   = 120;
  canvas.width  = W;
  canvas.height = H;
  var pad  = { top: 10, right: 10, bottom: 24, left: 28 };
  var cW   = W - pad.left - pad.right;
  var cH   = H - pad.top - pad.bottom;
  var maxV = Math.max.apply(null, created.concat(resolved).concat([1]));
  var barW = (cW / months.length) * 0.35;
  var barG = (cW / months.length) * 0.1;

  ctx.clearRect(0, 0, W, H);

  for (var gi = 0; gi <= 3; gi++) {
    var gy = pad.top + (cH / 3) * gi;
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
    if (gi < 3) {
      ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV - (maxV / 3) * gi), pad.left - 4, gy + 3);
    }
  }

  months.forEach(function(m, i) {
    var x  = pad.left + (cW / months.length) * i + (cW / months.length) * 0.1;
    var h1 = (created[i] / maxV) * cH;
    ctx.fillStyle = accentColor;
    ctx.beginPath(); ctx.roundRect(x, pad.top + cH - h1, barW, h1, [3, 3, 0, 0]); ctx.fill();
    var h2 = (resolved[i] / maxV) * cH;
    ctx.fillStyle = greenColor;
    ctx.beginPath(); ctx.roundRect(x + barW + barG, pad.top + cH - h2, barW, h2, [3, 3, 0, 0]); ctx.fill();
    ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.label, x + barW + barG / 2, H - 6);
  });

  var lx = W - pad.right - 120;
  ctx.fillStyle = accentColor; ctx.fillRect(lx, 4, 10, 8);
  ctx.fillStyle = textColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Créés', lx + 14, 12);
  ctx.fillStyle = greenColor; ctx.fillRect(lx + 56, 4, 10, 8);
  ctx.fillStyle = textColor; ctx.fillText('Résolus', lx + 70, 12);

  if (tipEl) {
    var wrap = canvas.closest('.dash2-chart-wrap') || canvas.parentElement;
    if (wrap) {
      var handler = function(e) {
        var rect = wrap.getBoundingClientRect();
        var px   = e.clientX - rect.left;
        var py   = e.clientY - rect.top;
        if (px < pad.left || px > pad.left + cW) { tipEl.style.display = 'none'; return; }
        var idx  = Math.floor((px - pad.left) / (cW / months.length));
        if (idx < 0 || idx >= months.length) { tipEl.style.display = 'none'; return; }
        tipEl.style.display = 'block';
        tipEl.style.left    = px + 'px';
        tipEl.style.top     = Math.max(8, py) + 'px';
        tipEl.innerHTML     = '<b>' + months[idx].label + '</b><div style="margin-top:6px;">Créés : ' + created[idx] + '<br>Résolus : ' + resolved[idx] + '</div>';
      };
      if (canvas.__dashHoverHandler) canvas.removeEventListener('mousemove', canvas.__dashHoverHandler);
      canvas.__dashHoverHandler = handler;
      canvas.addEventListener('mousemove', handler);
      canvas.addEventListener('mouseleave', function() { tipEl.style.display = 'none'; });
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   TICKETS — FILTRE / PRESET / BULK / RENDER
═══════════════════════════════════════════════════════════════ */
var TICKET_FILTER_PRESET_KEY = 'coprosync_ticket_filter_preset_v1';
var _ticketSelection = new Set();

function getTicketFilterValues() {
  return { search: $('f-search') ? $('f-search').value : '', statut: $('f-statut') ? $('f-statut').value : '', urgence: $('f-urgence') ? $('f-urgence').value : '', batiment: $('f-bat') ? $('f-bat').value : '' };
}

function saveTicketFilterPreset() {
  try { localStorage.setItem(TICKET_FILTER_PRESET_KEY, JSON.stringify(getTicketFilterValues())); } catch(e) {}
  toast('Filtres sauvegardés', 'ok');
}

function applyTicketFilterPreset() {
  try {
    var raw = localStorage.getItem(TICKET_FILTER_PRESET_KEY);
    if (!raw) return;
    var p = JSON.parse(raw);
    if ($('f-search'))  $('f-search').value  = p.search   || '';
    if ($('f-statut'))  $('f-statut').value  = p.statut   || '';
    if ($('f-urgence')) $('f-urgence').value = p.urgence  || '';
    if ($('f-bat'))     $('f-bat').value     = p.batiment || '';
  } catch(e) {}
}

function clearTicketFilterPreset() {
  try { localStorage.removeItem(TICKET_FILTER_PRESET_KEY); } catch(e) {}
  toast('Préset supprimé', 'warn');
}

function setTicketSelected(id, selected) {
  if (selected) _ticketSelection.add(id); else _ticketSelection.delete(id);
  renderBulkTicketBar();
}

function toggleAllTicketsFromCurrentFilter() {
  var allChecked = $('t-select-all') && $('t-select-all').checked;
  var ids = getFilteredTickets().map(function(t) { return t.id; });
  ids.forEach(function(id) { allChecked ? _ticketSelection.add(id) : _ticketSelection.delete(id); });
  d($('tickets-tbody'), renderTicketsRows(getFilteredTickets()));
  renderBulkTicketBar();
}

function renderBulkTicketBar() {
  var bar = $('tickets-bulk-bar');
  if (!bar) return;
  var n = _ticketSelection.size;
  if (!n) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  bar.style.display = 'flex';
  bar.innerHTML = '<span style="font-size:12px;color:var(--text-2);">' + n + ' sélectionné' + (n > 1 ? 's' : '') + '</span>'
    + '<select class="select" id="bulk-statut" style="width:auto;"><option value="">Changer le statut...</option><option value="nouveau">Nouveau</option><option value="en_cours">En cours</option><option value="transmis_syndic">Transmis syndic</option><option value="attente_intervention">En attente</option><option value="résolu">Résolu</option><option value="clos">Clos</option></select>'
    + '<button class="btn btn-secondary btn-sm" onclick="applyBulkTicketStatus()">Appliquer</button>'
    + '<button class="btn btn-ghost btn-sm" onclick="clearTicketSelection()">Effacer sélection</button>';
}

function clearTicketSelection() {
  _ticketSelection.clear();
  d($('tickets-tbody'), renderTicketsRows(getFilteredTickets()));
  renderBulkTicketBar();
}

async function applyBulkTicketStatus() {
  var statut = $('bulk-statut') ? $('bulk-statut').value : '';
  if (!statut) { toast('Choisis un statut', 'warn'); return; }
  var ids = Array.from(_ticketSelection);
  if (!ids.length) return;
  var res = await sb.from('tickets').update({ statut: statut, updated_at: new Date().toISOString() }).in('id', ids);
  if (res.error) { toast('Erreur mise à jour en lot', 'err'); return; }
  cache.tickets = cache.tickets.map(function(t) { return ids.includes(t.id) ? Object.assign({}, t, { statut: statut }) : t; });
  for (var i = 0; i < ids.length; i++) { await addLog('Statut modifié (lot)', 'ticket', ids[i], { statut: statut }); }
  toast('Statut mis à jour (' + ids.length + ')', 'ok');
  clearTicketSelection();
  updateBadges();
  filterTickets();
}

function getFilteredTickets() {
  var s  = $('f-search')  ? $('f-search').value.toLowerCase()  : '';
  var st = $('f-statut')  ? $('f-statut').value  : '';
  var u  = $('f-urgence') ? $('f-urgence').value : '';
  var b  = $('f-bat')     ? $('f-bat').value     : '';
  return cache.tickets.filter(function(t) {
    return (!s  || t.titre.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s) || (t.batiment || '').toLowerCase().includes(s))
        && (!st || t.statut === st)
        && (!u  || t.urgence === u)
        && (!b  || t.batiment === b);
  });
}

function renderTickets() {
  _ticketSelection = new Set();
  $('page').innerHTML = '<div style="padding:24px;">'
    + '<div class="ph"><h1>Signalements</h1><p>' + cache.tickets.length + ' au total · ' + cache.tickets.filter(function(t) { return t.statut !== 'résolu' && t.statut !== 'clos'; }).length + ' ouverts</p></div>'
    + '<div class="fbar">'
    + '<input type="text" class="input" id="f-search" placeholder="🔍 Rechercher..." oninput="filterTickets()" style="flex:1;min-width:150px;">'
    + '<select class="select" id="f-statut" onchange="filterTickets()" style="width:auto;"><option value="">Tous statuts</option><option value="nouveau">Nouveau</option><option value="en_cours">En cours</option><option value="transmis_syndic">Transmis syndic</option><option value="attente_intervention">En attente</option><option value="résolu">Résolu</option><option value="clos">Clos</option></select>'
    + '<select class="select" id="f-urgence" onchange="filterTickets()" style="width:auto;"><option value="">Urgence</option><option value="critique">🔴 Critique</option><option value="important">🟠 Important</option><option value="normal">🔵 Normal</option></select>'
    + '<select class="select" id="f-bat" onchange="filterTickets()" style="width:auto;"><option value="">Zone</option><optgroup label="Tours"><option>Tour 13</option><option>Tour 15</option><option>Tour 17</option><option>Tour 19</option></optgroup><optgroup label="Communs"><option>Parking visiteurs</option><option>Parking privé</option><option>Garages</option><option>Aire de jeux</option><option>Portails / portillons</option><option>Extérieur général</option></optgroup></select>'
    + '<span id="f-count" style="font-size:12px;color:var(--text-3);white-space:nowrap;"></span>'
    + '<button class="btn btn-ghost btn-sm" id="f-reset" onclick="resetFilters()" style="display:none;">✕ Effacer</button>'
    + '<button class="btn btn-secondary btn-sm" onclick="saveTicketFilterPreset()">💾 Préset</button>'
    + '<button class="btn btn-ghost btn-sm" onclick="clearTicketFilterPreset()">Suppr. préset</button>'
    + '<button class="btn btn-primary" onclick="openNewTicket()">+ Signaler</button>'
    + '</div>'
    + (isManager() ? '<div id="tickets-bulk-bar" class="ticket-bulk-bar" style="display:none;"></div>' : '')
    + '<div class="card"><div class="tbl-wrap"><table><thead><tr>'
    + (isManager() ? '<th style="width:32px;"><input id="t-select-all" type="checkbox" onclick="event.stopPropagation();toggleAllTicketsFromCurrentFilter()"></th>' : '')
    + '<th>Signalement</th><th>Urgence</th><th>Statut</th><th>Zone</th><th>Date</th><th></th>'
    + '</tr></thead><tbody id="tickets-tbody">'
    + renderTicketsRows(cache.tickets)
    + '</tbody></table></div></div></div>';
  applyTicketFilterPreset();
  filterTickets();
}

function renderTicketsRows(list) {
  var colSpan = isManager() ? 7 : 6;
  if (!list.length) return '<tr><td colspan="' + colSpan + '">' + emptyState('🎉', 'Aucun signalement !', 'La résidence tourne bien. Signalez un problème si vous en constatez un.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Nouveau signalement</button>') + '</td></tr>';
  return list.map(function(t) {
    var age = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 864e5);
    return '<tr onclick="openDetail(\'' + t.id + '\')">'
      + (isManager() ? '<td onclick="event.stopPropagation()"><input type="checkbox" ' + (_ticketSelection.has(t.id) ? 'checked' : '') + ' onchange="setTicketSelected(\'' + t.id + '\', this.checked)"></td>' : '')
      + '<td><div style="font-weight:600;">' + t.titre + '</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">' + (t.categorie || '') + (t.zone ? ' · ' + t.zone : '') + '</div></td>'
      + '<td>' + badgeUrgence(t.urgence) + '</td>'
      + '<td>' + badgeStatut(t.statut) + '</td>'
      + '<td style="font-size:12px;color:var(--text-2);">' + (t.batiment || '—') + '</td>'
      + '<td style="font-size:12px;color:var(--text-3);white-space:nowrap;"><div>' + fmtD(t.created_at) + '</div><div style="color:' + (age > 14 ? 'var(--orange)' : 'var(--text-3)') + ';font-size:11px;margin-top:2px;">⏱ ' + depuisJours(t.created_at) + '</div></td>'
      + '<td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">Voir →</button></td>'
      + '</tr>';
  }).join('');
}

function filterTickets() {
  var s  = $('f-search')  ? $('f-search').value.toLowerCase()  : '';
  var st = $('f-statut')  ? $('f-statut').value  : '';
  var u  = $('f-urgence') ? $('f-urgence').value : '';
  var b  = $('f-bat')     ? $('f-bat').value     : '';
  var active = s || st || u || b;
  var f = getFilteredTickets();
  d($('tickets-tbody'), renderTicketsRows(f));
  var cEl = $('f-count'); if (cEl) cEl.textContent = active ? f.length + ' résultat' + (f.length > 1 ? 's' : '') : '';
  var rEl = $('f-reset');  if (rEl) rEl.style.display = active ? 'inline-flex' : 'none';
  renderBulkTicketBar();
}

function resetFilters() {
  if ($('f-search'))  $('f-search').value  = '';
  if ($('f-statut'))  $('f-statut').value  = '';
  if ($('f-urgence')) $('f-urgence').value = '';
  if ($('f-bat'))     $('f-bat').value     = '';
  filterTickets();
}
