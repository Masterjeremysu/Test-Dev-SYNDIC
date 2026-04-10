// ════════════════════════════════════════════════════════════════
//  TICKET MAP (Carte interactive des incidents)
//  assets/js/features/tickets/ticket-map.js
// ════════════════════════════════════════════════════════════════

let _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
let _mapViewMode = 'map'; // 'map' ou 'list'
let _mapInitTimeout = null; // Anti-rebond (Debounce) pour éviter l'erreur Leaflet
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
    localStorage.setItem(MAP_PREFS_KEY, JSON.stringify({ filters: _mapFilters, viewMode: _mapViewMode }));
  } catch {}
}

function mapTicketsFiltered() {
  const allT = (typeof cache !== 'undefined' && cache.tickets) ? cache.tickets : [];
  return allT.filter(t => {
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
  return t.statut === 'résolu' || t.statut === 'clos' ? '#10b981'
    : t.urgence === 'critique' ? '#ef4444'
    : t.urgence === 'important' ? '#f59e0b'
    : '#3b82f6';
}

function renderMapPage() {
  loadMapPrefs();
  
  // Cleanup avant de remplacer le DOM
  if (typeof mapInstance !== 'undefined' && mapInstance) { 
    mapInstance.remove(); 
    mapInstance = null; 
    if (typeof mapMarkers !== 'undefined') mapMarkers = []; 
  }

  const allT = (typeof cache !== 'undefined' && cache.tickets) ? cache.tickets : [];
  const geoCount = allT.filter(t => t.lat && t.lng).length;
  const openCount = allT.filter(t => t.lat && t.lng && !['résolu', 'clos'].includes(t.statut)).length;
  const critCount = allT.filter(t => t.lat && t.lng && t.urgence === 'critique' && !['résolu', 'clos'].includes(t.statut)).length;
  
  const byBat = allT.filter(t => t.lat && t.lng).reduce((acc, t) => {
    const k = t.batiment || 'Sans bâtiment';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const batOptions = ['all', ...Object.keys(byBat).sort()];

  $('page').innerHTML = `
  <div style="padding:0; height:100%; display:flex; flex-direction:column; max-width:1200px; margin:0 auto; animation:fade-in 0.2s ease;">
    
    <div style="padding:16px 16px 12px; flex-shrink:0; background:var(--surface); z-index:10; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
        <div>
          <h1 style="font-size:24px; font-weight:800; color:var(--text-1); margin:0;">Carte de la résidence</h1>
          <p style="color:var(--text-2); margin:4px 0 0; font-size:13px;">
            <strong style="color:var(--text-1);">${openCount}</strong> incident(s) ouvert(s) localisé(s)
            ${critCount > 0 ? `<span style="color:var(--red); font-weight:600; margin-left:8px;">⚠️ ${critCount} Critique(s)</span>` : ''}
          </p>
        </div>
        <div style="display:flex; background:var(--bg-2); padding:4px; border-radius:10px; border:1px solid var(--border);">
          <button class="btn btn-sm" style="background:${_mapViewMode === 'map' ? 'var(--surface)' : 'transparent'}; color:${_mapViewMode === 'map' ? 'var(--text-1)' : 'var(--text-3)'}; box-shadow:${_mapViewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; border:none;" onclick="setMapViewMode('map')">📍 Carte</button>
          <button class="btn btn-sm" style="background:${_mapViewMode === 'list' ? 'var(--surface)' : 'transparent'}; color:${_mapViewMode === 'list' ? 'var(--text-1)' : 'var(--text-3)'}; box-shadow:${_mapViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; border:none;" onclick="setMapViewMode('list')">☰ Liste</button>
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:12px;">
        <select id="map-filter-urgence" class="select" style="width:160px; padding:6px 12px; font-size:12px;" onchange="onMapFilterChange()">
          <option value="all">Urgence : Toutes</option>
          <option value="critique">🔴 Critique</option>
          <option value="important">🟠 Important</option>
          <option value="normal">🔵 Normal</option>
        </select>
        <select id="map-filter-statut" class="select" style="width:160px; padding:6px 12px; font-size:12px;" onchange="onMapFilterChange()">
          <option value="all">Statut : Tous</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="attente_intervention">En attente</option>
          <option value="résolu">Résolu</option>
          <option value="clos">Clos</option>
        </select>
        <select id="map-filter-batiment" class="select" style="width:160px; padding:6px 12px; font-size:12px;" onchange="onMapFilterChange()">
          ${batOptions.map(b => `<option value="${b}">${b === 'all' ? 'Bâtiment : Tous' : b}</option>`).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" style="font-size:11px;" onclick="resetMapFilters()">⟲ Réinitialiser</button>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center; padding-top:8px; border-top:1px dashed var(--border);">
        ${[['#ef4444', 'Critique'], ['#f59e0b', 'Important'], ['#3b82f6', 'Normal'], ['#10b981', 'Clos']].map(([c,l]) =>
          `<span style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:var(--text-2); text-transform:uppercase; letter-spacing:0.05em;">
            <span style="width:10px; height:10px; border-radius:50%; background:${c}; box-shadow:0 0 0 2px ${c}33;"></span>${l}
          </span>`
        ).join('')}
      </div>
    </div>
    
    <div style="flex:1; min-height:0; padding:0; background:var(--bg-2); position:relative;">
      <div id="map-card" style="height:100%; width:100%; display:${_mapViewMode === 'list' ? 'none' : 'block'};">
        <div id="map" style="height:100%; width:100%; z-index:1;"></div>
      </div>
      <div id="map-list-card" style="height:100%; overflow-y:auto; padding:16px; display:${_mapViewMode === 'map' ? 'none' : 'block'};">
        <div style="max-width:800px; margin:0 auto;">
          ${renderMapListHtml()}
        </div>
      </div>
    </div>
  </div>`;

  const urg = $('map-filter-urgence');
  const sta = $('map-filter-statut');
  const bat = $('map-filter-batiment');
  if (urg) urg.value = _mapFilters.urgence;
  if (sta) sta.value = _mapFilters.statut;
  if (bat) bat.value = _mapFilters.batiment;

  if (_mapViewMode === 'map') {
    // Utilisation de l'anti-rebond pour éviter le double appel
    clearTimeout(_mapInitTimeout);
    _mapInitTimeout = setTimeout(initMap, 100);
  }
}

function renderMapListHtml() {
  const list = mapTicketsFiltered().sort((a, b) => {
    const pa = mapPriorityScore(a);
    const pb = mapPriorityScore(b);
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  if (!list.length) return `<div style="padding:24px; text-align:center; color:var(--text-3); font-size:14px;">Aucun signalement ne correspond à vos filtres.</div>`;
  
  return list.map(t => {
    const cColor = mapMarkerColor(t);
    const dateStr = typeof fmtD === 'function' ? fmtD(t.created_at) : new Date(t.created_at).toLocaleDateString();
    
    return `
    <div class="card" style="padding:16px; margin-bottom:12px; display:flex; gap:16px; align-items:center; border-left:4px solid ${cColor}; transition:transform 0.2s;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='none'">
      <div style="flex:1; min-width:0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div style="font-weight:700; font-size:15px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(t.titre)}</div>
          <span style="font-size:10px; font-weight:800; background:${cColor}15; color:${cColor}; padding:2px 8px; border-radius:12px; text-transform:uppercase; letter-spacing:0.05em; margin-left:8px; flex-shrink:0;">${t.urgence || 'Normal'}</span>
        </div>
        <div style="font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <span style="display:flex; align-items:center; gap:4px;">📍 ${escHtml(t.batiment || 'Sans bâtiment')}${t.zone ? ' · ' + escHtml(t.zone) : ''}</span>
          <span style="display:flex; align-items:center; gap:4px;">🕒 ${dateStr}</span>
          <span style="display:flex; align-items:center; gap:4px; font-weight:600;">🏷️ ${t.statut}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" style="flex-shrink:0;" onclick="if(typeof openDetail === 'function') openDetail('${t.id}')">Ouvrir</button>
    </div>`;
  }).join('');
}

function onMapFilterChange() {
  _mapFilters.urgence = $('map-filter-urgence')?.value || 'all';
  _mapFilters.statut = $('map-filter-statut')?.value || 'all';
  _mapFilters.batiment = $('map-filter-batiment')?.value || 'all';
  saveMapPrefs();
  
  if (_mapViewMode === 'list') {
    const el = $('map-list-card');
    if (el) el.innerHTML = `<div style="max-width:800px; margin:0 auto;">${renderMapListHtml()}</div>`;
  } else {
    // Anti-rebond si l'utilisateur change les filtres très vite
    clearTimeout(_mapInitTimeout);
    _mapInitTimeout = setTimeout(initMap, 50);
  }
}

function setMapViewMode(mode) {
  _mapViewMode = mode === 'list' ? 'list' : 'map';
  saveMapPrefs();
  renderMapPage(); // Déclenche le timeout propre
}

function resetMapFilters() {
  _mapFilters = { urgence: 'all', statut: 'all', batiment: 'all' };
  saveMapPrefs();
  renderMapPage(); // Déclenche le timeout propre
}

function initMap() {
  // On utilise requestAnimationFrame pour être sûr que le DOM est complètement peint
  requestAnimationFrame(() => {
    const mapEl = $('map');
    if (!mapEl || typeof L === 'undefined') return;

    // FIX ULTIME : Le nettoyage complet de l'instance ET de l'attribut Leaflet 
    // Doit être exécuté DANS le bloc asynchrone, juste avant l'initialisation
    if (typeof mapInstance !== 'undefined' && mapInstance) { 
      mapInstance.remove(); 
      mapInstance = null; 
    }
    if (mapEl._leaflet_id) {
      mapEl._leaflet_id = null; // Retire le verrou Leaflet
    }

    const baseLat = (typeof COPRO !== 'undefined' && COPRO.lat) ? COPRO.lat : 45.2;
    const baseLng = (typeof COPRO !== 'undefined' && COPRO.lng) ? COPRO.lng : 5.7;

    try {
      mapInstance = L.map('map', {
        zoomControl: false,
        tap: true,
        tapTolerance: 15,
      }).setView([baseLat, baseLng], 17);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
      L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);

      L.marker([baseLat, baseLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:4px;background:var(--text-1);border:3px solid var(--surface);box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:translate(-2px,-2px);"></div>`,
          iconSize: [16,16], iconAnchor: [8,8]
        }),
        zIndexOffset: 1000
      }).addTo(mapInstance).bindPopup(`<div style="text-align:center;"><strong>${typeof COPRO !== 'undefined' ? COPRO.nom : 'Résidence'}</strong></div>`);

      mapMarkers = [];
      const rows = mapTicketsFiltered();
      const bounds = [];

      rows.forEach(t => {
        if (!t.lat || !t.lng) return;
        const cColor = mapMarkerColor(t);
        bounds.push([t.lat, t.lng]);
        
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px; height:14px; border-radius:50%; background:${cColor}; border:3px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); transition:transform 0.2s;"></div>`,
          iconSize: [20,20], iconAnchor: [10,10]
        });
        
        const m = L.marker([t.lat, t.lng], { icon }).addTo(mapInstance);
        m.bindPopup(`
          <div style="min-width:200px; font-family:-apple-system, sans-serif; padding:4px;">
            <div style="font-weight:700; font-size:14px; color:#1f2937; margin-bottom:4px; line-height:1.2;">${escHtml(t.titre)}</div>
            <div style="font-size:11px; color:#6b7280; margin-bottom:12px;">📍 ${escHtml(t.batiment||'')}${t.zone ? ' · '+escHtml(t.zone) : ''}</div>
            <button onclick="openDetail('${t.id}')" style="width:100%; background:${cColor}; color:white; border:none; padding:8px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">Ouvrir le signalement</button>
          </div>
        `, { closeButton: false, className: 'custom-leaflet-popup' });
        
        mapMarkers.push(m);
      });

      if (bounds.length > 0) {
        bounds.push([baseLat, baseLng]); 
        mapInstance.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 18, animate: true, duration: 1 });
      }

      setTimeout(() => mapInstance?.invalidateSize({ animate: false }), 200);

      // Gestion propre du ResizeObserver
      if (window.ResizeObserver) {
        if (mapEl._resizeObserver) mapEl._resizeObserver.disconnect();
        const ro = new ResizeObserver(() => {
          if (mapInstance) mapInstance.invalidateSize({ animate: false });
        });
        ro.observe(mapEl);
        mapEl._resizeObserver = ro;
      }
    } catch(e) {
      console.error("Leaflet initialization failed", e);
    }
  });
}