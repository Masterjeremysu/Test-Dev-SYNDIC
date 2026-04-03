// ── DATA LOADERS ──
async function loadTickets() {
  const { data, error } = await sb.from('v_tickets').select('*').order('created_at', { ascending: false });
  if (!error && data) cache.tickets = data;
  return data;
}

async function loadContrats() {
  const { data, error } = await sb.from('contrats').select('*').order('date_echeance', { ascending: true });
  if (error) { console.warn('loadContrats:', error.message); return; }
  if (data) cache.contrats = data;
}

async function loadCles() {
  const { data } = await sb.from('cles').select('*').order('nom');
  if (data) cache.cles = data;
}

async function loadJournal() {
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
  const { data } = await sb.from('contacts').select('*').eq('actif', true).order('ordre');
  if (data) _contactsCache = data;
}

async function loadStats() {
  const { data } = await sb.from('v_stats').select('*').single();
  return data;
}

function updateBadges() {
  const open = (cache.tickets||[]).filter(t => t.statut !== 'résolu' && t.statut !== 'clos').length;
  const nc = $('nc-tickets');
  if (nc) { if (open > 0) { nc.textContent = open; nc.style.display = ''; } else nc.style.display = 'none'; }
  // Badge bottom nav
  const bnb = $('bn-badge-tickets');
  if (bnb) { if (open > 0) { bnb.textContent = open > 9 ? '9+' : open; bnb.style.display = 'flex'; } else bnb.style.display = 'none'; }

  if (isManager()) {
    const expiring = (cache.contrats||[]).filter(c => { const d = daysUntil(c.date_echeance); return d !== null && d >= 0 && d <= 90; }).length;
    const nc2 = $('nc-contrats');
    if (nc2) { if (expiring > 0) { nc2.style.display = ''; } else nc2.style.display = 'none'; }
  }
}
