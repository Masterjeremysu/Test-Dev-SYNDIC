// ════════════════════════════════════════════════════════════════
//  RENDER ROUTER
//  assets/js/features/ui/render-router.js
// ════════════════════════════════════════════════════════════════

function renderPage(p) {
  const el = $('page');

  // Vérification d'accès — redirige si non accessible
  const accessible = Permissions.getAccessiblePages();
  if (!accessible.includes(p)) {
    dbg('[router] "' + p + '" non accessible pour ' + currentRole() + ' → redirect');
    p = Permissions.getDefaultPage();
    currentPage = p;
  }

  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'pageIn .22s cubic-bezier(.4,0,.2,1) both';

  if (p === 'dashboard')   renderDashboard();
  else if (p === 'tickets')     renderTickets();
  else if (p === 'map')         { renderMapPage(); setTimeout(initMap, 100); }
  else if (p === 'contrats')    renderContrats();
  else if (p === 'cles')        renderCles();
  else if (p === 'journal')     renderJournal();
  else if (p === 'users')       renderUsers();
  else if (p === 'rapport')     renderRapport();
  else if (p === 'notifications') renderNotifications();
  else if (p === 'profile')     renderProfile();
  else if (p === 'messages')    renderMessages();
  else if (p === 'annonces')    renderAnnonces();
  else if (p === 'agenda')      renderAgenda();
  else if (p === 'contacts')    renderContacts();
  else if (p === 'documents')   renderDocuments();
  else if (p === 'votes')       renderVotes();
  else if (p === 'faq')         renderFAQ();
  else if (p === 'permissions') {
    // Garde stricte hardcodée — même si quelqu'un appelle renderPage('permissions')
    if (!isAdmin()) { nav(Permissions.getDefaultPage()); return; }
    renderPermissionsPage();
  }
}

// ════════════════════════════════════════════════════════════════
//  DATA LOADERS
//  assets/js/services/data-loaders.js
// ════════════════════════════════════════════════════════════════

async function loadTickets() {
  const { data, error } = await sb.from('v_tickets').select('*').order('created_at', { ascending: false });
  if (!error && data) cache.tickets = data;
  return data;
}

async function loadContrats() {
  if (!Permissions.has('contrats.view')) return;
  const { data, error } = await sb.from('contrats').select('*').order('date_echeance', { ascending: true });
  if (error) { console.warn('loadContrats:', error.message); return; }
  if (data) cache.contrats = data;
}

async function loadCles() {
  if (!Permissions.has('cles.view')) return;
  const { data } = await sb.from('cles').select('*').order('nom');
  if (data) cache.cles = data;
}

async function loadJournal() {
  if (!Permissions.has('journal.view')) return;
  const { data } = await sb.from('journal').select('*,profiles(nom,prenom)').order('created_at', { ascending: false }).limit(200);
  if (data) cache.journal = data;
}

async function loadAnnonceCache() {
  const { data } = await sb.from('annonces').select('*').order('created_at', { ascending: false }).limit(50);
  if (data) cache.annonces = data;
}

async function loadEvenementsCache() {
  const { data } = await sb.from('evenements').select('*').order('date_debut', { ascending: true });
  if (data) cache.evenements = data;
}

async function loadContactsCache() {
  if (!Permissions.has('contacts.view')) return;
  const { data } = await sb.from('contacts').select('*').eq('actif', true).order('ordre');
  if (data) _contactsCache = data;
}

async function loadStats() {
  const { data } = await sb.from('v_stats').select('*').single();
  return data;
}

function updateBadges() {
  const open = (cache.tickets || []).filter(t => t.statut !== 'résolu' && t.statut !== 'clos').length;
  const nc = $('nc-tickets');
  if (nc) { nc.textContent = open; nc.style.display = open > 0 ? '' : 'none'; }
  const bnb = $('bn-badge-tickets');
  if (bnb) { bnb.textContent = open > 9 ? '9+' : open; bnb.style.display = open > 0 ? 'flex' : 'none'; }

  if (Permissions.has('contrats.view')) {
    const expiring = (cache.contrats || []).filter(c => { const d = daysUntil(c.date_echeance); return d !== null && d >= 0 && d <= 90; }).length;
    const nc2 = $('nc-contrats');
    if (nc2) nc2.style.display = expiring > 0 ? '' : 'none';
  }
}
