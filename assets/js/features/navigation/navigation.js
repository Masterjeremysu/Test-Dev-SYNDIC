// ── NAVIGATION ──
function nav(page, noClose) {
  // Détruit la carte Leaflet proprement avant de quitter la page map
  if (currentPage === 'map' && page !== 'map') {
    const mapEl = $('map');
    if (mapEl?._resizeObserver) { mapEl._resizeObserver.disconnect(); }
    if (mapInstance) { mapInstance.remove(); mapInstance = null; mapMarkers = []; }
  }

  currentPage = page;
  if (!noClose) closeSidebar();
  // Retire le padding de #page pour les pages full-height
  const pageEl = $('page');
  if (page === 'messages' || page === 'map') {
    pageEl.style.padding = '0';
    pageEl.style.maxWidth = 'none';
  } else {
    pageEl.style.padding = '';
    pageEl.style.maxWidth = '';
  }
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`[data-page="${page}"]`);
  if (active) active.classList.add('active');
  document.querySelectorAll('.bn-item').forEach(el => el.classList.remove('active'));
  const bnMap = { dashboard:'bn-dashboard', tickets:'bn-tickets', map:'bn-map', messages:'bn-messages' };
  if (bnMap[page]) $(bnMap[page])?.classList.add('active');

  const titles = {
    dashboard:'Vue d\'ensemble', tickets:'Signalements', map:'Carte',
    contrats:'Contrats', cles:'Clés', journal:'Journal', users:'Utilisateurs',
    admin:'Admin · Accès & visibilité', rapport:'Rapport syndic', notifications:'Notifications', profile:'Mon profil',
    messages:'Messages', annonces:'Annonces', agenda:'Agenda',
    contacts:'Contacts & Urgences', documents:'Documents', votes:'Votes & Sondages',
    faq:'FAQ'
  };
  $('topbar-title').textContent = titles[page] || page;
  renderPage(page);
}

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('so').classList.toggle('open');
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('so').classList.remove('open');
}
