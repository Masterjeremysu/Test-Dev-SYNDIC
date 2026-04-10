// ════════════════════════════════════════════════════════════════
//  DATA LOADERS
//  assets/js/services/data-loaders.js
// ════════════════════════════════════════════════════════════════

async function loadTickets() {
  const { data, error } = await sb.from('v_tickets').select('*').order('created_at', { ascending: false });
  if (error) { err('loadTickets:', error.message); return null; }
  if (data) cache.tickets = data;
  return data;
}

async function loadContrats() {
  if (!Permissions.has('contrats.view')) return;
  const { data, error } = await sb.from('contrats').select('*').order('date_echeance', { ascending: true });
  if (error) { err('loadContrats:', error.message); return; }
  if (data) cache.contrats = data;
}

async function loadCles() {
  if (!Permissions.has('cles.view')) return;
  const { data, error } = await sb.from('cles').select('*').order('nom');
  if (error) { err('loadCles:', error.message); return; }
  if (data) cache.cles = data;
}

async function loadJournal() {
  if (!Permissions.has('journal.view')) return;
  const { data, error } = await sb.from('journal').select('*,profiles(nom,prenom)').order('created_at', { ascending: false }).limit(200);
  if (error) { err('loadJournal:', error.message); return; }
  if (data) cache.journal = data;
}

async function loadAnnonceCache() {
  const { data, error } = await sb.from('annonces').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) { err('loadAnnonceCache:', error.message); return; }
  if (data) cache.annonces = data;
}

async function loadEvenementsCache() {
  const { data, error } = await sb.from('evenements').select('*').order('date_debut', { ascending: true });
  if (error) { err('loadEvenementsCache:', error.message); return; }
  if (data) cache.evenements = data;
}

async function loadContactsCache() {
  if (!Permissions.has('contacts.view')) return;
  const { data, error } = await sb.from('contacts').select('*').eq('actif', true).order('ordre');
  if (error) { err('loadContactsCache:', error.message); return; }
  if (data) _contactsCache = data;
}

async function loadStats() {
  const { data, error } = await sb.from('v_stats').select('*').single();
  if (error) { err('loadStats:', error.message); return null; }
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