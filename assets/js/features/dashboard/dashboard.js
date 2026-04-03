// ── DASHBOARD ──
let _dashFocusMode = 'tout'; // tout | ouvert | critique | resolu | mine | transmis | zone
let _dashFocusZone = null; // utilisé si mode === 'zone'

async function renderDashboard() {
  const el = $('page');

  // Skeleton immédiat — évite le layout shift
  if (!cache.tickets.length) {
    el.innerHTML = `<div style="padding:16px;">
      <div class="skeleton sk-line w-60" style="height:28px;margin-bottom:6px;"></div>
      <div class="skeleton sk-line w-40" style="height:14px;margin-bottom:20px;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="skeleton sk-box"></div><div class="skeleton sk-box"></div>
        <div class="skeleton sk-box"></div><div class="skeleton sk-box"></div>
      </div>
      <div class="skeleton" style="height:200px;border-radius:var(--r-lg);margin-bottom:14px;"></div>
      <div class="skeleton" style="height:160px;border-radius:var(--r-lg);"></div>
    </div>`;
    return;
  }

  const t = cache.tickets;
  const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = t.filter(x => x.urgence === 'critique' && x.statut !== 'résolu' && x.statut !== 'clos');
  const syndic = t.filter(x => x.statut === 'transmis_syndic');
  const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  // Focus par défaut à chaque (re)render du dashboard
  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const recent = t.slice(0, 6);

  // Contrats expirants
  const expirants = isManager() ? cache.contrats.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= 90; }) : [];

  el.innerHTML = `
  <div class="dash2" id="dash-content">
    <section class="dash2-hero">
      <div class="dash2-kicker">
        <span class="dash2-kicker-line"></span>
        ${new Date().toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        <span class="dash2-kicker-line"></span>
      </div>
      <div class="dash2-hero-main">
        <div>
          <h1 class="dash2-title">Bonjour, ${displayName(profile?.prenom, profile?.nom, user?.email, 'bienvenue').split(' ')[0]} 👋</h1>
          <div class="dash2-subline">
            ${critiques.length > 0
              ? `<span class="dash2-pill danger">🔴 ${critiques.length} critique${critiques.length>1?'s':''}</span>`
              : `<span class="dash2-pill success">✅ Tout va bien</span>`
            }
            ${ouverts.length > 0 ? `<span class="dash2-muted">${ouverts.length} signalement${ouverts.length>1?'s':''} en cours</span>` : ''}
          </div>
        </div>
        <div class="dash2-actions">
          <button class="btn btn-primary" onclick="openNewTicket()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau signalement
          </button>
          <button class="btn btn-secondary" onclick="nav('tickets')">Voir les signalements</button>
          <button class="btn btn-ghost" onclick="nav('faq')" title="FAQ, raccourcis et aide">❓ FAQ</button>
        </div>
      </div>
    </section>

    <section class="dash2-metrics stats-row">
      <div class="stat orange" onclick="nav('tickets')" style="animation:pageIn .3s .05s both;">
        <div class="stat-icon">🔧</div>
        <div class="stat-num">${ouverts.length}</div>
        <div class="stat-label">Ouverts</div>
        <div class="stat-sub">Signalements actifs</div>
      </div>
      <div class="stat red" onclick="nav('tickets')" style="animation:pageIn .3s .10s both;">
        <div class="stat-icon">🚨</div>
        <div class="stat-num">${critiques.length}</div>
        <div class="stat-label">Critiques</div>
        <div class="stat-sub">Action requise</div>
      </div>
      ${isManager() ? `
      <div class="stat blue" style="animation:pageIn .3s .15s both;">
        <div class="stat-icon">📤</div>
        <div class="stat-num">${syndic.length}</div>
        <div class="stat-label">Transmis</div>
        <div class="stat-sub">En attente</div>
      </div>` : `
      <div class="stat blue" onclick="nav('tickets')" style="animation:pageIn .3s .15s both;">
        <div class="stat-icon">📋</div>
        <div class="stat-num">${t.filter(x=>x.auteur_id===user.id).length}</div>
        <div class="stat-label">Les miens</div>
        <div class="stat-sub">Créés par moi</div>
      </div>`}
      <div class="stat green" style="animation:pageIn .3s .20s both;">
        <div class="stat-icon">✅</div>
        <div class="stat-num">${resolus.length}</div>
        <div class="stat-label">Résolus</div>
        <div class="stat-sub">Total traités</div>
      </div>
    </section>

    <section class="dash2-focusbar" id="dash-focusbar" aria-label="Filtres du tableau de bord">
      <button class="dash2-chip sel" data-dash-focus="tout" onclick="setDashFocus('tout')">Tout</button>
      <button class="dash2-chip warn" data-dash-focus="ouvert" onclick="setDashFocus('ouvert')">Ouverts</button>
      <button class="dash2-chip danger" data-dash-focus="critique" onclick="setDashFocus('critique')">Critiques</button>
      ${isManager()
        ? `<button class="dash2-chip info" data-dash-focus="transmis" onclick="setDashFocus('transmis')">Transmis</button>`
        : `<button class="dash2-chip info" data-dash-focus="mine" onclick="setDashFocus('mine')">Mes</button>`}
      <button class="dash2-chip success" data-dash-focus="resolu" onclick="setDashFocus('resolu')">Résolus</button>
      <button class="dash2-chip dash2-chip-zone" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()">Zone sélectionnée</button>
    </section>

    <section class="dash2-grid g2">
      <div class="card dash2-card" style="animation:pageIn .3s .25s both;">
        <div class="card-header">
          <span class="card-title dash2-card-title">Signalements récents</span>
          <button class="btn btn-ghost btn-sm" onclick="nav('tickets')">Tout voir →</button>
        </div>
        <div class="dash2-card-content">
          <div id="dash-recent-list">
            ${recent.length === 0 ? emptyState('📋', 'Tout va bien !', 'Aucun signalement en cours dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>') :
              recent.map(t => `
                <div class="act-item" onclick="openDetail('${t.id}')">
                  <div class="act-ic" style="background:${t.urgence==='critique'?'var(--red-light)':t.urgence==='important'?'var(--orange-light)':'var(--blue-light)'};border:1px solid ${t.urgence==='critique'?'var(--red-border)':t.urgence==='important'?'var(--orange-border)':'var(--blue-border)'};">
                    ${t.urgence==='critique'?'🔴':t.urgence==='important'?'🟠':'🔵'}
                  </div>
                  <div style="flex:1;min-width:0;overflow:hidden;">
                    <div class="act-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escHtml(t.titre)}</div>
                    <div class="act-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(t.batiment||'')}${t.zone?' · '+escHtml(t.zone):''}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                      ${badgeStatut(t.statut)}
                      <span style="font-size:10px;color:var(--text-3);">⏱ ${depuisJours(t.created_at)}</span>
                    </div>
                  </div>
                </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="dash2-stack">
        <div class="card dash2-card" style="animation:pageIn .3s .30s both;">
          <div class="card-header">
            <span class="card-title dash2-card-title">Activité · 6 mois</span>
          </div>
          <div class="dash2-card-content">
            <div class="dash2-chart-wrap">
              <canvas id="dash-chart" height="110"></canvas>
              <div id="dash-chart-tip" class="dash2-chart-tip" style="display:none;"></div>
            </div>
          </div>
        </div>

        <div class="card dash2-card" style="animation:pageIn .3s .35s both;">
          <div class="card-header">
            <span class="card-title dash2-card-title">Par bâtiment</span>
          </div>
          <div class="dash2-card-content">
            <div id="dash-zone-list">
              ${[...COPRO.tours, 'Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général'].map(zone => {
                const cnt = ouverts.filter(t => t.batiment === zone).length;
                if (cnt === 0) return '';
                const isTour = zone.startsWith('Tour');
                const pct = Math.min(100, cnt * 25);
                const barColor = cnt >= 3 ? 'var(--red)' : cnt >= 2 ? 'var(--orange)' : 'var(--accent)';
                return `<div class="dash2-zone-row dash2-zone-clickable" onclick='setDashZoneFocus(${JSON.stringify(zone)})' title='Focus: ${escHtml(zone)}'>
                  <div class="dash2-zone-name">${isTour ? zone : zone.split(' ')[0]}</div>
                  <div class="dash2-zone-bar">
                    <div style="background:${barColor};width:${pct}%;"></div>
                  </div>
                  <div class="dash2-zone-count" style="color:${barColor};">${cnt}</div>
                </div>`;
              }).join('') || '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px 0;">Aucun problème ouvert 🎉</div>'}
            </div>
          </div>
        </div>

        ${expirants.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <span class="card-title" style="color:var(--amber);">⚠️ Contrats à renouveler</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('contrats')">Voir →</button>
          </div>
          <div style="padding:8px 16px 12px;">
            ${expirants.map(c => {
              const d = daysUntil(c.date_echeance);
              return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:13px;font-weight:600;">${c.fournisseur}</div>
                  <div style="font-size:11px;color:var(--text-3);">${c.type_contrat}</div>
                </div>
                <span style="font-size:12px;font-weight:700;color:${d<=30?'var(--red)':'var(--amber)'};">${d}j</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="card dash2-card" id="dash-events-widget">
          <div class="card-header">
            <span class="card-title">📅 Prochains événements</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('agenda')">Agenda →</button>
          </div>
          <div class="dash2-card-content" id="dash-events-list">
            <div style="font-size:13px;color:var(--text-3);text-align:center;padding:12px;">Chargement…</div>
          </div>
        </div>

        <div class="card dash2-card" id="dash-annonces-widget">
          <div class="card-header">
            <span class="card-title">📢 Annonces</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('annonces')">Toutes →</button>
          </div>
          <div class="dash2-card-content" id="dash-annonces-list">
            <div style="font-size:13px;color:var(--text-3);text-align:center;padding:12px;">Chargement…</div>
          </div>
        </div>

        <!-- Widget Votes en cours -->
        ${_votesCache.filter(v=>v.statut==='ouvert').length > 0 ? `
        <div class="card dash2-card">
          <div class="card-header">
            <span class="card-title">🗳️ Votes en cours</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('votes')">Voter →</button>
          </div>
          <div class="dash2-card-content">
            ${_votesCache.filter(v=>v.statut==='ouvert').slice(0,3).map(v => {
              const maRep = _reponsesCache[v.id];
              const total = (_allReponsesCache[v.id]||[]).length;
              return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav('votes')">
                <div style="font-size:20px;">${VOTE_TYPES[v.type]?.ico||'🗳️'}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(v.titre)}</div>
                  <div style="font-size:11px;color:var(--text-3);">${total} participant${total>1?'s':''}</div>
                </div>
                ${maRep
                  ? '<span style="font-size:10px;background:var(--green-light);color:var(--green);padding:2px 7px;border-radius:8px;font-weight:700;">✓ Voté</span>'
                  : '<span style="font-size:10px;background:var(--orange-light);color:var(--orange);padding:2px 7px;border-radius:8px;font-weight:700;">À voter</span>'}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Widget Documents récents -->
        ${_docsCache.length > 0 ? `
        <div class="card dash2-card">
          <div class="card-header">
            <span class="card-title">📄 Documents récents</span>
            <button class="btn btn-ghost btn-sm" onclick="nav('documents')">Voir tous →</button>
          </div>
          <div class="dash2-card-content">
            ${_docsCache.slice(0,4).map(d => {
              const cat = DOC_CATS[d.categorie] || { ico:'📄', color:'#6b7280' };
              const isNew = !_docsVus.has(d.id);
              return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav('documents')">
                <div style="font-size:18px;">${cat.ico}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(d.titre)}</div>
                  <div style="font-size:11px;color:var(--text-3);">${fmtD(d.created_at)}</div>
                </div>
                ${isNew ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:2px 7px;border-radius:8px;font-weight:700;">Nouveau</span>' : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="card dash2-card">
          <div class="card-body" style="text-align:center;">
            <div style="font-size:24px;margin-bottom:8px;">📱</div>
            <div style="font-family:var(--font-head);font-weight:700;margin-bottom:6px;">Installer l'app</div>
            <div style="font-size:12px;color:var(--text-2);margin-bottom:12px;">iPhone : Safari → Partager → "Sur l'écran d'accueil"<br>Android : Chrome → ⋮ → "Installer l'application"</div>
          </div>
        </div>
      </div>
    </section>
  </div>`;
  // Charge les widgets en arrière-plan
  loadDashboardWidgets();
}

function clearDashFocus() {
  setDashFocus('tout');
}

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

function isResolvedStatut(statut) {
  return ['résolu', 'clos'].includes(statut);
}

function isOpenStatut(statut) {
  return !isResolvedStatut(statut);
}

function getDashTicketsForRecent() {
  const list = cache.tickets || [];
  const mode = _dashFocusMode;
  if (mode === 'tout') return list;
  if (mode === 'ouvert') return list.filter(t => isOpenStatut(t.statut));
  if (mode === 'critique') return list.filter(t => t.urgence === 'critique' && isOpenStatut(t.statut));
  if (mode === 'resolu') return list.filter(t => isResolvedStatut(t.statut));
  if (mode === 'mine') return list.filter(t => t.auteur_id === user.id && isOpenStatut(t.statut));
  if (mode === 'transmis') return list.filter(t => t.statut === 'transmis_syndic');
  if (mode === 'zone') return list.filter(t => t.batiment === _dashFocusZone && isOpenStatut(t.statut));
  return list;
}

function getDashTicketsForZones() {
  const list = cache.tickets || [];
  const mode = _dashFocusMode;
  if (mode === 'tout') return list.filter(t => isOpenStatut(t.statut)); // comportement historique
  // Le focus suit la logique de "récent", sauf pour la vue tout (open only)
  return getDashTicketsForRecent();
}

function getDashTicketsForChart() {
  const list = cache.tickets || [];
  const mode = _dashFocusMode;
  if (mode === 'tout') return list; // comportement historique
  return getDashTicketsForRecent();
}

function renderDashRecentListHTML(list) {
  const emptyByMode = {
    ouvert: emptyState('✅', 'Tout va bien !', 'Aucun signalement en cours dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>'),
    critique: emptyState('🔍', 'Pas de critique pour le moment', 'Rien de critique à traiter dans la résidence.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>'),
    resolu: emptyState('🎉', 'Rien à afficher', 'Pas de résolutions récentes dans cette vue.', `<button class="btn btn-secondary btn-sm" onclick="nav('tickets')">Voir tout →</button>`),
    mine: emptyState('👤', 'Aucun ticket actif', 'Vous n’avez pas de signalement ouvert en ce moment.', `<button class="btn btn-secondary btn-sm" onclick="nav('tickets')">Voir mes tickets →</button>`),
    transmis: emptyState('📤', 'Rien en attente', 'Aucun ticket transmis à gérer actuellement.', `<button class="btn btn-secondary btn-sm" onclick="nav('tickets')">Voir →</button>`),
    zone: emptyState('🧭', 'Aucune anomalie ici', 'Aucun signalement ouvert dans cette zone.', `<button class="btn btn-secondary btn-sm" onclick="nav('tickets')">Voir →</button>`)
  };

  if (!list.length) return emptyByMode[_dashFocusMode] || emptyState('📋', 'Rien à signaler', 'La résidence tourne bien.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un problème</button>');

  return list.slice(0, 6).map(t => `
    <div class="act-item" onclick="openDetail('${t.id}')">
      <div class="act-ic" style="background:${t.urgence==='critique'?'var(--red-light)':t.urgence==='important'?'var(--orange-light)':'var(--blue-light)'};border:1px solid ${t.urgence==='critique'?'var(--red-border)':t.urgence==='important'?'var(--orange-border)':'var(--blue-border)'};">
        ${t.urgence==='critique'?'🔴':t.urgence==='important'?'🟠':'🔵'}
      </div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div class="act-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escHtml(t.titre)}</div>
        <div class="act-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(t.batiment||'')}${t.zone?' · '+escHtml(t.zone):''}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
          ${badgeStatut(t.statut)}
          <span style="font-size:10px;color:var(--text-3);">⏱ ${depuisJours(t.created_at)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderDashZonesListHTML(tickets) {
  const zoneNames = [...COPRO.tours, 'Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général'];
  const counts = {};
  for (const t of tickets) {
    const k = t.batiment || '';
    if (!k) continue;
    counts[k] = (counts[k] || 0) + 1;
  }

  return zoneNames.map(zone => {
    const cnt = counts[zone] || 0;
    if (cnt === 0) return '';
    const isTour = zone.startsWith('Tour');
    const pct = Math.min(100, cnt * 25);
    const barColor = cnt >= 3 ? 'var(--red)' : cnt >= 2 ? 'var(--orange)' : 'var(--accent)';
    return `<div class="dash2-zone-row dash2-zone-clickable" onclick='setDashZoneFocus(${JSON.stringify(zone)})' title='Focus: ${escHtml(zone)}'>
      <div class="dash2-zone-name">${isTour ? zone : zone.split(' ')[0]}</div>
      <div class="dash2-zone-bar">
        <div style="background:${barColor};width:${pct}%;"></div>
      </div>
      <div class="dash2-zone-count" style="color:${barColor};">${cnt}</div>
    </div>`;
  }).join('') || '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px 0;">Aucun problème ici 🎯</div>';
}

function refreshDashFocus() {
  const recentEl = $('dash-recent-list');
  const zoneEl = $('dash-zone-list');
  if (!recentEl || !zoneEl) return;

  // Focus chips UI
  const bar = $('dash-focusbar');
  if (bar) {
    bar.querySelectorAll('[data-dash-focus]').forEach(btn => {
      const mode = btn.getAttribute('data-dash-focus');
      btn.classList.toggle('sel', mode === _dashFocusMode);
    });
    const chipZone = $('dash-chip-zone');
    if (chipZone) {
      const show = _dashFocusMode === 'zone' && !!_dashFocusZone;
      chipZone.style.display = show ? '' : 'none';
      if (show) chipZone.textContent = 'Zone: ' + _dashFocusZone;
    }
  }

  const recentTickets = getDashTicketsForRecent();
  const zonesTickets = getDashTicketsForZones();
  recentEl.innerHTML = renderDashRecentListHTML(recentTickets);
  zoneEl.innerHTML = renderDashZonesListHTML(zonesTickets);

  // Re-render chart with focus
  renderDashChart();
}

async function loadDashboardWidgets() {
  // Widget événements
  const now = new Date().toISOString();
  const { data: evts } = await sb.from('evenements')
    .select('*').gte('date_debut', now)
    .order('date_debut').limit(4);
  const evtEl = $('dash-events-list');
  if (evtEl) {
    if (!evts?.length) {
      evtEl.innerHTML = '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px;">Aucun événement à venir</div>';
    } else {
      evtEl.innerHTML = evts.map(e => {
        const t = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
        const d = new Date(e.date_debut);
        const dateStr = d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
        const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
        const isImmi = (d - new Date()) < 86400000; // moins de 24h
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav('agenda')">
          <div style="width:4px;height:36px;border-radius:2px;background:${t.color};flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;${isImmi?'color:var(--orange);':''}">${escHtml(e.titre)}</div>
            <div style="font-size:11px;color:var(--text-3);">📅 ${dateStr} à ${timeStr}${e.lieu?' · '+escHtml(e.lieu):''}</div>
          </div>
          ${isImmi ? '<span style="font-size:10px;background:var(--orange-light);color:var(--orange);padding:2px 6px;border-radius:8px;font-weight:700;">Bientôt</span>' : ''}
        </div>`;
      }).join('');
    }
    // Rappel push pour événements dans moins de 24h
    (evts || []).filter(e => {
      const d = new Date(e.date_debut);
      const diff = d - new Date();
      return diff > 0 && diff < 86400000;
    }).forEach(e => {
      pushNotif('📅 Rappel', `${e.titre} — demain à ${new Date(e.date_debut).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`, 'statut_change', null);
    });
  }
  // Widget annonces
  const { data: annsRaw } = await sb.from('annonces')
    .select('*').order('epingle', { ascending: false })
    .order('created_at', { ascending: false }).limit(12);
  const anns = (annsRaw || []).filter(a => annonceReaderCanSee(a)).slice(0, 3);
  const annEl = $('dash-annonces-list');
  if (annEl) {
    if (!anns?.length) {
      annEl.innerHTML = '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:8px;">Aucune annonce</div>';
    } else {
      const icons = { urgent:'🚨', important:'⚠️', info:'📢' };
      annEl.innerHTML = anns.map(a => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="nav('annonces')">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span>${a.epingle ? '📌' : icons[a.type]||'📢'}</span>
            <div style="font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(a.titre)}</div>
          </div>
          ${a.contenu ? `<div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(a.contenu.substring(0,80))}${a.contenu.length>80?'…':''}</div>` : ''}
        </div>`).join('');
    }
  }
  // Graphique activité mensuelle
  renderDashChart();
}

function renderDashChart() {
  const canvas = $('dash-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tipEl = $('dash-chart-tip');

  // Génère les 6 derniers mois
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }

  const ticketsForChart = getDashTicketsForChart();

  // Compte les tickets par mois
  const created = months.map(m =>
    ticketsForChart.filter(t => {
      const d = new Date(t.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length
  );
  const resolved = months.map(m =>
    ticketsForChart.filter(t => {
      if (!['résolu','clos'].includes(t.statut)) return false;
      const d = new Date(t.updated_at || t.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length
  );

  const textColor = isDark ? '#9b9890' : '#6b6860';
  const gridColor = isDark ? '#2a2825' : '#f0ede8';
  const accentColor = '#2563eb';
  const greenColor = '#10b981';

  // Dimensions
  const W = canvas.offsetWidth || 300;
  const H = 120;
  canvas.width = W;
  canvas.height = H;
  const pad = { top: 10, right: 10, bottom: 24, left: 28 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...created, ...resolved, 1);
  const barW = (cW / months.length) * 0.35;
  const barGap = (cW / months.length) * 0.1;

  ctx.clearRect(0, 0, W, H);

  // Grille horizontale
  for (let i = 0; i <= 3; i++) {
    const y = pad.top + (cH / 3) * i;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    if (i < 3) {
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 3) * i), pad.left - 4, y + 3);
    }
  }

  // Barres
  months.forEach((m, i) => {
    const x = pad.left + (cW / months.length) * i + (cW / months.length) * 0.1;

    // Barres créés (bleu)
    const h1 = (created[i] / maxVal) * cH;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(x, pad.top + cH - h1, barW, h1, [3, 3, 0, 0]);
    ctx.fill();

    // Barres résolus (vert)
    const h2 = (resolved[i] / maxVal) * cH;
    ctx.fillStyle = greenColor;
    ctx.beginPath();
    ctx.roundRect(x + barW + barGap, pad.top + cH - h2, barW, h2, [3, 3, 0, 0]);
    ctx.fill();

    // Label mois
    ctx.fillStyle = textColor;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x + barW + barGap / 2, H - 6);
  });

  // Légende
  const legendX = W - pad.right - 120;
  ctx.fillStyle = accentColor;
  ctx.fillRect(legendX, 4, 10, 8);
  ctx.fillStyle = textColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Créés', legendX + 14, 12);
  ctx.fillStyle = greenColor;
  ctx.fillRect(legendX + 56, 4, 10, 8);
  ctx.fillStyle = textColor;
  ctx.fillText('Résolus', legendX + 70, 12);

  // Tooltip au survol (premium UX)
  if (tipEl) {
    const wrap = canvas.closest('.dash2-chart-wrap') || canvas.parentElement;
    if (wrap) {
      const padL = pad.left;
      const plotW = cW;
      const perMonthW = plotW / months.length;

      const handler = (e) => {
        const rect = wrap.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        const inside = px >= padL && px <= padL + plotW;
        if (!inside) {
          tipEl.style.display = 'none';
          return;
        }

        const idx = Math.floor((px - padL) / perMonthW);
        if (idx < 0 || idx >= months.length) {
          tipEl.style.display = 'none';
          return;
        }

        tipEl.style.display = 'block';
        tipEl.style.left = `${px}px`;
        tipEl.style.top = `${Math.max(8, py)}px`;
        tipEl.innerHTML = `<b>${months[idx].label}</b><div style="margin-top:6px;">Créés : ${created[idx]}<br>Résolus : ${resolved[idx]}</div>`;
      };

      if (canvas.__dashHoverHandler) canvas.removeEventListener('mousemove', canvas.__dashHoverHandler);
      canvas.__dashHoverHandler = handler;
      canvas.addEventListener('mousemove', handler);
      canvas.addEventListener('mouseleave', () => { tipEl.style.display = 'none'; });
    }
  }
}

const TICKET_FILTER_PRESET_KEY = 'coprosync_ticket_filter_preset_v1';
let _ticketSelection = new Set();

function getTicketFilterValues() {
  return {
    search: $('f-search')?.value || '',
    statut: $('f-statut')?.value || '',
    urgence: $('f-urgence')?.value || '',
    batiment: $('f-bat')?.value || ''
  };
}

function saveTicketFilterPreset() {
  const preset = getTicketFilterValues();
  try { localStorage.setItem(TICKET_FILTER_PRESET_KEY, JSON.stringify(preset)); } catch {}
  toast('Filtres sauvegardés', 'ok');
}

function applyTicketFilterPreset() {
  try {
    const raw = localStorage.getItem(TICKET_FILTER_PRESET_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if ($('f-search')) $('f-search').value = p.search || '';
    if ($('f-statut')) $('f-statut').value = p.statut || '';
    if ($('f-urgence')) $('f-urgence').value = p.urgence || '';
    if ($('f-bat')) $('f-bat').value = p.batiment || '';
  } catch {}
}

function clearTicketFilterPreset() {
  try { localStorage.removeItem(TICKET_FILTER_PRESET_KEY); } catch {}
  toast('Préset supprimé', 'warn');
}

function setTicketSelected(id, selected) {
  if (selected) _ticketSelection.add(id);
  else _ticketSelection.delete(id);
  renderBulkTicketBar();
}

function toggleAllTicketsFromCurrentFilter() {
  const allChecked = $('t-select-all')?.checked;
  const ids = getFilteredTickets().map(t => t.id);
  ids.forEach(id => allChecked ? _ticketSelection.add(id) : _ticketSelection.delete(id));
  d($('tickets-tbody'), renderTicketsRows(getFilteredTickets()));
  renderBulkTicketBar();
}

function renderBulkTicketBar() {
  const bar = $('tickets-bulk-bar');
  if (!bar) return;
  const n = _ticketSelection.size;
  if (!n) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  bar.style.display = 'flex';
  bar.innerHTML = `
    <span style="font-size:12px;color:var(--text-2);">${n} sélectionné${n>1?'s':''}</span>
    <select class="select" id="bulk-statut" style="width:auto;">
      <option value="">Changer le statut...</option>
      <option value="nouveau">Nouveau</option>
      <option value="en_cours">En cours</option>
      <option value="transmis_syndic">Transmis syndic</option>
      <option value="attente_intervention">En attente</option>
      <option value="résolu">Résolu</option>
      <option value="clos">Clos</option>
    </select>
    <button class="btn btn-secondary btn-sm" onclick="applyBulkTicketStatus()">Appliquer</button>
    <button class="btn btn-ghost btn-sm" onclick="clearTicketSelection()">Effacer sélection</button>
  `;
}

function clearTicketSelection() {
  _ticketSelection.clear();
  d($('tickets-tbody'), renderTicketsRows(getFilteredTickets()));
  renderBulkTicketBar();
}

async function applyBulkTicketStatus() {
  const statut = $('bulk-statut')?.value;
  if (!statut) { toast('Choisis un statut', 'warn'); return; }
  const ids = [..._ticketSelection];
  if (!ids.length) return;
  const { error } = await sb.from('tickets').update({ statut, updated_at: new Date().toISOString() }).in('id', ids);
  if (error) { toast('Erreur mise à jour en lot', 'err'); return; }
  cache.tickets = cache.tickets.map(t => ids.includes(t.id) ? { ...t, statut } : t);
  for (const id of ids) {
    await addLog('Statut modifié (lot)', 'ticket', id, { statut });
  }
  toast(`Statut mis à jour (${ids.length})`, 'ok');
  clearTicketSelection();
  updateBadges();
  filterTickets();
}

function getFilteredTickets() {
  const s = $('f-search')?.value.toLowerCase() || '';
  const st = $('f-statut')?.value || '';
  const u = $('f-urgence')?.value || '';
  const b = $('f-bat')?.value || '';
  return cache.tickets.filter(t =>
    (!s || t.titre.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s) || (t.batiment || '').toLowerCase().includes(s))
    && (!st || t.statut === st)
    && (!u || t.urgence === u)
    && (!b || t.batiment === b)
  );
}

function renderTickets() {
  const myTickets = !isManager();
  _ticketSelection = new Set();
  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph">
      <h1>Signalements</h1>
      <p>${cache.tickets.length} au total · ${cache.tickets.filter(t=>t.statut!=='résolu'&&t.statut!=='clos').length} ouverts</p>
    </div>
    <div class="fbar">
      <input type="text" class="input" id="f-search" placeholder="🔍 Rechercher..." oninput="filterTickets()" style="flex:1;min-width:150px;">
      <select class="select" id="f-statut" onchange="filterTickets()" style="width:auto;">
        <option value="">Tous statuts</option>
        <option value="nouveau">Nouveau</option>
        <option value="en_cours">En cours</option>
        <option value="transmis_syndic">Transmis syndic</option>
        <option value="attente_intervention">En attente</option>
        <option value="résolu">Résolu</option>
        <option value="clos">Clos</option>
      </select>
      <select class="select" id="f-urgence" onchange="filterTickets()" style="width:auto;">
        <option value="">Urgence</option>
        <option value="critique">🔴 Critique</option>
        <option value="important">🟠 Important</option>
        <option value="normal">🔵 Normal</option>
      </select>
      <select class="select" id="f-bat" onchange="filterTickets()" style="width:auto;">
        <option value="">Zone</option>
        <optgroup label="Tours">
          <option>Tour 13</option><option>Tour 15</option><option>Tour 17</option><option>Tour 19</option>
        </optgroup>
        <optgroup label="Communs">
          <option>Parking visiteurs</option><option>Parking privé</option><option>Garages</option>
          <option>Aire de jeux</option><option>Portails / portillons</option><option>Extérieur général</option>
        </optgroup>
      </select>
      <span id="f-count" style="font-size:12px;color:var(--text-3);white-space:nowrap;"></span>
      <button class="btn btn-ghost btn-sm" id="f-reset" onclick="resetFilters()" style="display:none;">✕ Effacer</button>
      <button class="btn btn-secondary btn-sm" onclick="saveTicketFilterPreset()">💾 Préset</button>
      <button class="btn btn-ghost btn-sm" onclick="clearTicketFilterPreset()">Suppr. préset</button>
      <button class="btn btn-primary" onclick="openNewTicket()">+ Signaler</button>
    </div>
    ${isManager() ? `<div id="tickets-bulk-bar" class="ticket-bulk-bar" style="display:none;"></div>` : ''}
    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              ${isManager() ? `<th style="width:32px;"><input id="t-select-all" type="checkbox" onclick="event.stopPropagation();toggleAllTicketsFromCurrentFilter()"></th>` : ''}
              <th>Signalement</th><th>Urgence</th><th>Statut</th><th>Zone</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody id="tickets-tbody">
            ${renderTicketsRows(cache.tickets)}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  applyTicketFilterPreset();
  filterTickets();
}

function renderTicketsRows(list) {
  const colSpan = isManager() ? 7 : 6;
  if (!list.length) return `<tr><td colspan="${colSpan}">${emptyState('🎉', 'Aucun signalement !', 'La résidence tourne bien. Signalez un problème si vous en constatez un.', '<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Nouveau signalement</button>')}</td></tr>`;
  return list.map(t => `
    <tr onclick="openDetail('${t.id}')">
      ${isManager() ? `<td onclick="event.stopPropagation()"><input type="checkbox" ${_ticketSelection.has(t.id) ? 'checked' : ''} onchange="setTicketSelected('${t.id}', this.checked)"></td>` : ''}
      <td>
        <div style="font-weight:600;">${t.titre}</div>
        <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">${t.categorie || ''} ${t.zone?'· '+t.zone:''}</div>
      </td>
      <td>${badgeUrgence(t.urgence)}</td>
      <td>${badgeStatut(t.statut)}</td>
      <td style="font-size:12px;color:var(--text-2);">${t.batiment||'—'}</td>
      <td style="font-size:12px;color:var(--text-3);white-space:nowrap;">
        <div>${fmtD(t.created_at)}</div>
        <div style="color:${Math.floor((Date.now()-new Date(t.created_at).getTime())/864e5)>14?'var(--orange)':'var(--text-3)'};font-size:11px;margin-top:2px;">⏱ ${depuisJours(t.created_at)}</div>
      </td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">Voir →</button></td>
    </tr>`).join('');
}

function filterTickets() {
  const s = $('f-search')?.value.toLowerCase() || '';
  const st = $('f-statut')?.value || '';
  const u = $('f-urgence')?.value || '';
  const b = $('f-bat')?.value || '';
  const active = s || st || u || b;
  const f = getFilteredTickets();
  d($('tickets-tbody'), renderTicketsRows(f));
  // Compteur résultats
  const cEl = $('f-count');
  if (cEl) cEl.textContent = active ? `${f.length} résultat${f.length>1?'s':''}` : '';
  // Bouton reset
  const rEl = $('f-reset');
  if (rEl) rEl.style.display = active ? 'inline-flex' : 'none';
  renderBulkTicketBar();
}

function resetFilters() {
  const s = $('f-search'); if (s) s.value = '';
  const st = $('f-statut'); if (st) st.value = '';
  const u = $('f-urgence'); if (u) u.value = '';
  const b = $('f-bat'); if (b) b.value = '';
  filterTickets();
}
