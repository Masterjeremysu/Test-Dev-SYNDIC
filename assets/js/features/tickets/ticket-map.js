let _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
let _mapViewMode = 'map';
const MAP_PREFS_KEY = 'coprosync_map_prefs_v1';

function loadMapPrefs() {
  try {
    const raw = localStorage.getItem(MAP_PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (prefs?.filters) _mapFilters = { ..._mapFilters, ...prefs.filters };
    if (prefs?.viewMode) _mapViewMode = prefs.viewMode === 'list' ? 'list' : 'map';
  } catch {}
}

function saveMapPrefs() {
  try {
    localStorage.setItem(MAP_PREFS_KEY, JSON.stringify({
      filters: _mapFilters,
      viewMode: _mapViewMode
    }));
  } catch {}
}

function mapTicketsFiltered() {
  return cache.tickets.filter(t => {
    if (!t.lat || !t.lng) return false;
    if (_mapFilters.urgence !== 'all' && t.urgence !== _mapFilters.urgence) return false;
    if (_mapFilters.statut !== 'all' && t.statut !== _mapFilters.statut) return false;
    if (_mapFilters.batiment !== 'all' && (t.batiment || 'Sans bâtiment') !== _mapFilters.batiment) return false;
    return true;
  });
}

function mapPriorityScore(t) {
  const s = (t.statut || '').toLowerCase();
  if (s === 'résolu' || s === 'clos') return 0;
  if (t.urgence === 'critique') return 3;
  if (t.urgence === 'important') return 2;
  return 1;
}

function mapMarkerColor(t) {
  return t.statut === 'résolu' || t.statut === 'clos' ? '#16a34a'
    : t.urgence === 'critique' ? '#dc2626'
    : t.urgence === 'important' ? '#ea580c'
    : '#2563eb';
}

function renderMapPage() {
  loadMapPrefs();
  if (mapInstance) { mapInstance.remove(); mapInstance = null; mapMarkers = []; }

  const geoCount = cache.tickets.filter(t => t.lat && t.lng).length;
  const openCount = cache.tickets.filter(t => t.lat && t.lng && !['résolu', 'clos'].includes(t.statut)).length;
  const critCount = cache.tickets.filter(t => t.lat && t.lng && t.urgence === 'critique').length;
  const byBat = cache.tickets
    .filter(t => t.lat && t.lng)
    .reduce((acc, t) => {
      const k = t.batiment || 'Sans bâtiment';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  const batOptions = ['all', ...Object.keys(byBat).sort()];

  $('page').innerHTML = `
  <div style="padding:0;height:100%;display:flex;flex-direction:column;">
    <div style="padding:14px 16px 10px;flex-shrink:0;">
      <div class="ph" style="margin-bottom:8px;">
        <h1>Carte des signalements</h1>
        <p>${geoCount} signalement(s) géolocalisé(s) · ${openCount} ouvert(s) · ${critCount} critique(s)</p>
      </div>
      ${geoCount < 5 ? `
      <div style="margin:10px 0 12px;padding:10px 12px;border-radius:10px;background:var(--amber-light);border:1px solid var(--amber-border);color:var(--amber);font-size:12px;">
        La carte est peu pertinente avec peu de points. Utilise aussi la vue liste pour prioriser les actions.
      </div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;">
        <select id="map-filter-urgence" class="select" style="width:170px;" onchange="onMapFilterChange()">
          <option value="all">Urgence: toutes</option>
          <option value="critique">Urgence: critique</option>
          <option value="important">Urgence: important</option>
          <option value="normal">Urgence: normal</option>
        </select>
        <select id="map-filter-statut" class="select" style="width:170px;" onchange="onMapFilterChange()">
          <option value="all">Statut: tous</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="en_attente">En attente</option>
          <option value="résolu">Résolu</option>
          <option value="clos">Clos</option>
        </select>
        <select id="map-filter-batiment" class="select" style="width:180px;" onchange="onMapFilterChange()">
          ${batOptions.map(b => `<option value="${b}">${b === 'all' ? 'Bâtiment: tous' : 'Bâtiment: ' + b}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" onclick="setMapViewMode('map')">Vue carte</button>
        <button class="btn btn-secondary btn-sm" onclick="setMapViewMode('list')">Vue liste</button>
        <button class="btn btn-secondary btn-sm" onclick="resetMapFilters()">Reset</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
        ${[['#dc2626', 'Critique'], ['#ea580c', 'Important'], ['#2563eb', 'Normal'], ['#16a34a', 'Résolu/Clos']].map(([c,l]) =>
          `<span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:500;">
            <span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block;flex-shrink:0;"></span>${l}
          </span>`
        ).join('')}
      </div>
    </div>
    <div style="flex:1;min-height:0;padding:0 16px 16px;">
      <div class="card" id="map-card" style="overflow:hidden;height:100%;min-height:300px;${_mapViewMode === 'list' ? 'display:none;' : ''}">
        <div id="map" style="height:100%;width:100%;min-height:300px;"></div>
      </div>
      <div class="card" id="map-list-card" style="padding:10px;max-height:100%;overflow:auto;${_mapViewMode === 'map' ? 'display:none;' : ''}">
        ${renderMapListHtml()}
      </div>
    </div>
  </div>`;

  const urg = $('map-filter-urgence');
  const sta = $('map-filter-statut');
  const bat = $('map-filter-batiment');
  if (urg) urg.value = _mapFilters.urgence;
  if (sta) sta.value = _mapFilters.statut;
  if (bat) bat.value = _mapFilters.batiment;
}

function renderMapListHtml() {
  const list = mapTicketsFiltered().sort((a, b) => {
    const pa = mapPriorityScore(a);
    const pb = mapPriorityScore(b);
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  if (!list.length) return `<div style="padding:10px;font-size:13px;color:var(--text-3);">Aucun signalement pour les filtres actuels.</div>`;
  return list.map(t => `
    <div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
        <div style="font-weight:700;font-size:13px;">${t.titre}</div>
        <span style="font-size:11px;color:${mapMarkerColor(t)};font-weight:700;">${t.urgence || 'normal'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-2);margin:5px 0 8px;">📍 ${t.batiment || 'Sans bâtiment'}${t.zone ? ' · ' + t.zone : ''} · ${fmtD(t.created_at)}</div>
      <button class="btn btn-secondary btn-sm" onclick="openDetail('${t.id}')">Voir le signalement</button>
    </div>
  `).join('');
}

function onMapFilterChange() {
  _mapFilters.urgence = $('map-filter-urgence')?.value || 'all';
  _mapFilters.statut = $('map-filter-statut')?.value || 'all';
  _mapFilters.batiment = $('map-filter-batiment')?.value || 'all';
  saveMapPrefs();
  if (_mapViewMode === 'list') {
    const el = $('map-list-card');
    if (el) el.innerHTML = renderMapListHtml();
    return;
  }
  initMap();
}

function setMapViewMode(mode) {
  _mapViewMode = mode === 'list' ? 'list' : 'map';
  saveMapPrefs();
  renderMapPage();
  if (_mapViewMode === 'map') setTimeout(initMap, 80);
}

function resetMapFilters() {
  _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
  saveMapPrefs();
  renderMapPage();
  if (_mapViewMode === 'map') setTimeout(initMap, 80);
}

function initMap() {
  const mapEl = $('map');
  if (!mapEl) return;
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  // Attend que le DOM soit rendu avant d'initialiser
  requestAnimationFrame(() => {
    mapInstance = L.map('map', {
      zoomControl: true,
      tap: true, // fix iOS touch
      tapTolerance: 15,
    }).setView([COPRO.lat, COPRO.lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(mapInstance);

    // Marqueur résidence
    L.marker([COPRO.lat, COPRO.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:3px;background:#1a1917;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
        iconSize: [14,14], iconAnchor: [7,7]
      })
    }).addTo(mapInstance)
      .bindPopup(`<strong>${COPRO.nom}</strong><br><small>${COPRO.adresse}</small>`);

    mapMarkers = [];
    const rows = mapTicketsFiltered();
    rows.forEach(t => {
      const c = mapMarkerColor(t);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${c};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
        iconSize: [14,14], iconAnchor: [7,7]
      });
      const m = L.marker([t.lat, t.lng], { icon }).addTo(mapInstance);
      m.bindPopup(`
        <div style="min-width:180px;font-family:sans-serif;">
          <div style="font-weight:700;margin-bottom:4px;font-size:13px;">${t.titre}</div>
          <div style="font-size:11px;color:#666;margin-bottom:8px;">📍 ${t.batiment||''}${t.zone?' · '+t.zone:''}</div>
          <button onclick="openDetail('${t.id}')"
            style="width:100%;background:${c};color:white;border:none;padding:6px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
            Voir le signalement →
          </button>
        </div>
      `);
      mapMarkers.push(m);
    });

    if (rows.length) {
      const group = L.featureGroup(mapMarkers);
      mapInstance.fitBounds(group.getBounds().pad(0.25), { maxZoom: 18 });
    }

    // Force resize après que le conteneur soit vraiment dimensionné
    setTimeout(() => mapInstance?.invalidateSize({ animate: false }), 150);
    setTimeout(() => mapInstance?.invalidateSize({ animate: false }), 500);

    // ResizeObserver pour détecter les changements de taille (orientation mobile)
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => mapInstance?.invalidateSize({ animate: false }));
      ro.observe(mapEl);
      mapEl._resizeObserver = ro;
    }
  });
}

// ── CONTRATS ──
