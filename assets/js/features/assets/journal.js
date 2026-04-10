// ════════════════════════════════════════════════════════════════
//  JOURNAL D'ACTIVITÉ FEATURE
//  assets/js/features/assets/journal.js
// ════════════════════════════════════════════════════════════════

let _journalSearch = '';
let _journalFilter = 'all'; // Valeurs: 'all', 'ticket', 'cle', 'contrat', 'auth', 'annonce'

function renderJournal() {
  const page = $('page');
  if (!page) return;

  const entries = cache.journal || [];

  // 1. Filtrage en mémoire
  let filtered = entries;
  if (_journalFilter !== 'all') {
    filtered = filtered.filter(j => j.entite === _journalFilter);
  }
  if (_journalSearch) {
    const s = _journalSearch.toLowerCase();
    filtered = filtered.filter(j => 
      (j.action || '').toLowerCase().includes(s) ||
      (j.user_nom || '').toLowerCase().includes(s) ||
      (j.details?.titre || '').toLowerCase().includes(s) ||
      (j.details?.nom || '').toLowerCase().includes(s)
    );
  }

  // 2. Groupement par jour (Rendu visuel style Timeline)
  const grouped = {};
  filtered.forEach(j => {
    // Crée une clé de type "lundi 15 avril 2024"
    const dateStr = new Date(j.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(j);
  });

  // 3. Rendu HTML
  page.innerHTML = `
  <div style="padding:24px; max-width:1000px; margin:0 auto;">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text-1);margin:0;">Journal d'activité</h1>
        <p style="color:var(--text-2);margin:4px 0 0;font-size:14px;">Historique d'audit immuable des ${entries.length} dernières actions</p>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="refreshJournal()" title="Rafraîchir les logs">🔄 Actualiser</button>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; align-items:center; background:var(--bg-1); padding:12px; border-radius:var(--r-md); border:1px solid var(--border);">
      <div style="flex:1; min-width:200px; position:relative;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px;">🔍</span>
        <input type="search" class="input" placeholder="Rechercher une action, un utilisateur, un ticket..." value="${_journalSearch}" oninput="_journalSearch = this.value; renderJournal();" style="width:100%; margin:0; padding-left:36px;">
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <select class="select" style="margin:0; min-width:160px; padding-top:8px; padding-bottom:8px;" onchange="_journalFilter = this.value; renderJournal();">
          <option value="all" ${_journalFilter==='all'?'selected':''}>Toutes les entités</option>
          <option value="ticket" ${_journalFilter==='ticket'?'selected':''}>🎫 Tickets</option>
          <option value="cle" ${_journalFilter==='cle'?'selected':''}>🔑 Clés</option>
          <option value="contrat" ${_journalFilter==='contrat'?'selected':''}>📄 Contrats</option>
          <option value="annonce" ${_journalFilter==='annonce'?'selected':''}>📢 Annonces</option>
          <option value="auth" ${_journalFilter==='auth'?'selected':''}>🔒 Connexions</option>
        </select>
      </div>
    </div>

    <div style="background:transparent;">
      ${filtered.length === 0 ? 
        emptyState('📋', 'Aucune activité', 'Aucun événement ne correspond à vos filtres actuels.') : 
        Object.entries(grouped).map(([dateLabel, items]) => `
          <div style="margin-bottom:28px;">
            <div style="font-size:13px; font-weight:800; color:var(--text-3); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px; border-bottom:2px solid var(--bg-2); padding-bottom:6px; display:inline-block;">
              ${dateLabel}
            </div>
            <div class="card" style="padding:0; overflow:hidden;">
              ${items.map((j, i) => _renderJournalLine(j, i === items.length - 1)).join('')}
            </div>
          </div>
        `).join('')
      }
    </div>
  </div>`;
}

// Composant pour générer une ligne du journal
function _renderJournalLine(j, isLast) {
  const actionLower = j.action.toLowerCase();
  const isCreate = actionLower.includes('créé') || actionLower.includes('ajouté') || actionLower.includes('nouveau');
  const isDelete = actionLower.includes('supprimé') || actionLower.includes('retiré');
  const isUpdate = actionLower.includes('modifié') || actionLower.includes('statut') || actionLower.includes('mise à jour');
  
  const dotColor = isCreate ? 'var(--green)' : isDelete ? 'var(--red)' : isUpdate ? 'var(--amber)' : 'var(--accent)';
  
  // Sécurisation HTML (Anti-XSS)
  const safeAction = typeof escHtml === 'function' ? escHtml(j.action) : j.action;
  const safeUser = typeof escHtml === 'function' ? escHtml(j.user_nom || 'Système') : (j.user_nom || 'Système');
  
  // Extraction des détails selon l'entité
  const detailStr = j.details?.titre || j.details?.nom || j.details?.reference || j.details?.email || '';
  const safeDetail = typeof escHtml === 'function' ? escHtml(detailStr) : detailStr;
  
  // Extraction de l'heure uniquement (la date est gérée par le groupe)
  const timeObj = new Date(j.created_at);
  const timeStr = timeObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

  // Icones d'entités
  const entiteIcons = {
    ticket: '🎫', cle: '🔑', contrat: '📄', auth: '🔒', annonce: '📢', default: '📌'
  };
  const ico = entiteIcons[j.entite] || entiteIcons.default;

  return `
  <div style="display:flex; align-items:flex-start; padding:12px 16px; border-bottom:${isLast ? 'none' : '1px solid var(--border)'}; background:var(--bg-1); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-2)';" onmouseout="this.style.background='var(--bg-1)';">
    
    <div style="min-width:55px; font-size:12px; font-weight:500; color:var(--text-3); padding-top:3px;">
      ${timeStr}
    </div>
    
    <div style="position:relative; padding:0 16px;">
      <div style="width:10px; height:10px; border-radius:50%; background:${dotColor}; margin-top:5px; box-shadow:0 0 0 3px ${dotColor}20;"></div>
    </div>

    <div style="flex:1; min-width:0;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
        <span style="font-size:14.5px; font-weight:600; color:var(--text-1);">${safeAction}</span>
        ${j.entite ? `<span style="font-size:11px; background:var(--bg-2); border:1px solid var(--border); padding:2px 8px; border-radius:12px; font-weight:500; color:var(--text-2); text-transform:capitalize;">${ico} ${j.entite}</span>` : ''}
      </div>
      
      ${safeDetail ? `<div style="font-size:13px; color:var(--text-2); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safeDetail}</div>` : ''}
      
      <div style="font-size:11.5px; color:var(--text-3); display:flex; align-items:center; gap:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>${safeUser}</span>
        ${j.ip ? `<span style="opacity:0.4; margin-left:4px;">(IP: ${j.ip})</span>` : ''}
      </div>
    </div>
  </div>`;
}

// Fonction de rechargement manuel avec protection UI
async function refreshJournal() {
  const btn = document.querySelector('button[title="Rafraîchir les logs"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ ...'; }
  
  try {
    // Si la fonction loadJournal existe (venant de data-loaders.js), on l'utilise
    if (typeof loadJournal === 'function') {
      await loadJournal();
    } else {
      // Fallback de sécurité
      const { data, error } = await sb.from('journal').select('*,profiles(nom,prenom)').order('created_at', { ascending: false }).limit(200);
      if (!error && data) cache.journal = data;
    }
    
    // On garde nos filtres actuels, on relance juste le rendu
    renderJournal();
    if (typeof toast === 'function') toast('Journal mis à jour', 'ok');
  } catch (e) {
    console.error('Erreur refreshJournal:', e);
    if (typeof toast === 'function') toast('Impossible de joindre le serveur', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Actualiser'; }
  }
}