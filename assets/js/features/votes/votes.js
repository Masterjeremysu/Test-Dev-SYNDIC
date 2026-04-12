// ════════════════════════════════════════════════════════════════
//  VOTES & SONDAGES FEATURE
//  assets/js/features/votes/votes.js
// ════════════════════════════════════════════════════════════════

const VOTE_TYPES = {
  officiel: { label:'Vote officiel', ico:'🗳️', desc:'Pour/Contre avec quorum' },
  sondage:  { label:'Sondage',       ico:'📊', desc:'Question à choix multiples' },
  doodle:   { label:'Disponibilités',ico:'📅', desc:'Trouver une date commune' },
};

let _votesCache = [];
let _reponsesCache = {};
let _allReponsesCache = {};

async function renderVotes() {
  $('page').innerHTML = `
  <div style="padding:24px; max-width:840px; margin:0 auto; animation:fade-in 0.2s ease;">
    
    <div class="ph" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px; font-weight:800; color:var(--text-1); margin:0;">Votes & Sondages</h1>
        <p style="color:var(--text-2); margin:4px 0 0; font-size:14px;">Décisions participatives de la résidence</p>
      </div>
      ${typeof canManageVotes === 'function' && canManageVotes() ? `
        <button class="btn btn-primary" onclick="openVoteModal()" style="box-shadow:0 4px 12px rgba(59,130,246,0.3);">
          + Créer un vote
        </button>
      ` : ''}
    </div>

    <div id="votes-list">
      <div style="text-align:center; padding:60px 20px; color:var(--text-3);">
        <div class="spinner" style="margin:0 auto 16px; width:24px; height:24px; border-width:3px;"></div>
        Chargement des consultations en cours…
      </div>
    </div>
  </div>`;
  
  await loadVotes();
}

async function loadVotes() {
  try {
    const [{ data: votes }, { data: reponses }, { data: toutesReponses }] = await Promise.all([
      sb.from('votes').select('*').order('created_at', { ascending: false }),
      sb.from('votes_reponses').select('*').eq('user_id', user.id),
      sb.from('votes_reponses').select('*') // Charge TOUTES les réponses pour les stats
    ]);

    _votesCache = votes || [];
    
    _reponsesCache = {};
    (reponses || []).forEach(r => { _reponsesCache[r.vote_id] = r; });
    
    _allReponsesCache = {};
    (toutesReponses || []).forEach(r => {
      if (!_allReponsesCache[r.vote_id]) _allReponsesCache[r.vote_id] = [];
      _allReponsesCache[r.vote_id].push(r);
    });

    renderVotesList();

    // Mise à jour du badge global dans la navigation
    const nonRepondus = _votesCache.filter(v => v.statut === 'ouvert' && !_reponsesCache[v.id]).length;
    const el = $('nc-votes');
    if (el) { 
      el.textContent = nonRepondus; 
      el.style.display = nonRepondus > 0 ? 'inline-block' : 'none'; 
    }
  } catch (err) {
    const el = $('votes-list');
    if (el) el.innerHTML = emptyState('⚠️', 'Erreur de connexion', 'Impossible de charger les votes. Veuillez vérifier votre réseau.');
  }
}

function renderVotesList() {
  const el = $('votes-list');
  if (!el) return;
  
  if (!_votesCache.length) {
    el.innerHTML = emptyState('🗳️', 'Aucune consultation', 'Les votes officiels et sondages de la résidence apparaîtront ici.');
    return;
  }

  const ouverts = _votesCache.filter(v => v.statut === 'ouvert');
  const clos = _votesCache.filter(v => v.statut === 'clos');
  const isManagerUser = typeof canManageVotes === 'function' && canManageVotes();
  const brouillons = isManagerUser ? _votesCache.filter(v => v.statut === 'brouillon') : [];
  
  let html = '';
  
  if (ouverts.length) {
    html += `<div style="font-family:var(--font-head); font-weight:800; font-size:14px; color:var(--green); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green);"></span>
      En cours (${ouverts.length})
    </div>`;
    html += ouverts.map(v => renderVoteCard(v)).join('');
  }
  
  if (brouillons.length) {
    html += `<div style="font-family:var(--font-head); font-weight:800; font-size:14px; color:var(--amber); text-transform:uppercase; letter-spacing:0.05em; margin:24px 0 12px; display:flex; align-items:center; gap:8px;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--amber);"></span>
      Brouillons
    </div>`;
    html += brouillons.map(v => renderVoteCard(v)).join('');
  }
  
  if (clos.length) {
    html += `<div style="font-family:var(--font-head); font-weight:800; font-size:14px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.05em; margin:32px 0 12px; display:flex; align-items:center; gap:8px; border-top:1px solid var(--border); padding-top:24px;">
      📁 Terminés (${clos.length})
    </div>`;
    html += `<div style="opacity:0.8;">` + clos.map(v => renderVoteCard(v)).join('') + `</div>`;
  }
  
  el.innerHTML = html;
}

function renderVoteCard(v) {
  const type = VOTE_TYPES[v.type] || VOTE_TYPES.sondage;
  const maReponse = _reponsesCache[v.id];
  const dejaVote = !!maReponse;
  const isManagerUser = typeof canManageVotes === 'function' && canManageVotes();
  
  const cloture = v.date_cloture ? new Date(v.date_cloture) : null;
  const joursRestants = cloture ? Math.ceil((cloture - new Date()) / 86400000) : null;
  
  let timeLabel = '';
  let timeColor = 'var(--text-3)';
  if (cloture && v.statut === 'ouvert') {
    if (joursRestants > 1) { timeLabel = `Clôture dans ${joursRestants}j`; timeColor = 'var(--primary)'; }
    else if (joursRestants === 1) { timeLabel = `Clôture demain`; timeColor = 'var(--orange)'; }
    else if (joursRestants === 0) { timeLabel = `Clôture aujourd'hui`; timeColor = 'var(--red)'; }
    else { timeLabel = `En retard`; timeColor = 'var(--red)'; }
  } else if (v.statut === 'clos') {
    timeLabel = 'Terminé';
  }

  const borderLeft = v.statut === 'brouillon' ? '4px solid var(--amber)' : v.statut === 'ouvert' ? '4px solid var(--primary)' : '4px solid var(--border)';

  return `
  <div class="card" style="padding:20px; margin-bottom:16px; border-left:${borderLeft}; position:relative; overflow:hidden;">
    
    <div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:16px;">
      <div style="font-size:24px; background:var(--bg-2); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        ${type.ico}
      </div>
      
      <div style="flex:1; min-width:0;">
        <div style="font-weight:800; font-size:16px; color:var(--text-1); margin-bottom:6px; line-height:1.3;">${escHtml(v.titre)}</div>
        
        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; font-size:12px; font-weight:600;">
          <span style="background:var(--bg-2); color:var(--text-2); padding:2px 8px; border-radius:6px; border:1px solid var(--border);">${type.label}</span>
          ${timeLabel ? `<span style="color:${timeColor};"><span style="margin-right:4px;">⏱️</span>${timeLabel}</span>` : ''}
          ${v.cible !== 'tous' ? `<span style="color:var(--text-3);">· 🏢 Bâtiment ${escHtml(v.cible)}</span>` : ''}
          ${v.anonyme ? `<span style="color:var(--text-3);" title="Les résultats ne montrent pas qui a voté quoi">· 🔒 Anonyme</span>` : ''}
        </div>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0;">
        ${v.statut === 'ouvert' && !dejaVote ? `<span style="background:var(--orange-light); color:var(--orange); border:1px solid var(--orange-border); font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.05em; animation:pulse 2s infinite;">À voter</span>` : ''}
        ${dejaVote ? `<span style="background:var(--green-light); color:var(--green); border:1px solid var(--green-border); font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.05em;">✓ Voté</span>` : ''}
        ${isManagerUser && v.statut !== 'brouillon' ? `<button class="btn btn-ghost btn-sm" style="font-size:11px; padding:4px 8px;" onclick="openVoteDetail('${v.id}')">Résultats détaillés</button>` : ''}
      </div>
    </div>

    ${v.description ? `<div style="font-size:14px; color:var(--text-2); line-height:1.6; margin-bottom:20px; padding:12px; background:var(--bg-1); border-radius:8px;">${escHtml(v.description).replace(/\n/g, '<br>')}</div>` : ''}
    
    <div style="margin-top:16px;">
      ${v.statut === 'ouvert' && !dejaVote ? renderVoteForm(v) : renderVoteResults(v, maReponse)}
    </div>

    ${isManagerUser ? `
    <div style="display:flex; gap:8px; margin-top:20px; padding-top:16px; border-top:1px dashed var(--border);">
      ${v.statut === 'brouillon' ? `<button id="btn-pub-${v.id}" class="btn btn-primary btn-sm" onclick="publierVote('${v.id}')">▶ Publier le vote</button>` : ''}
      ${v.statut === 'ouvert' ? `<button id="btn-clo-${v.id}" class="btn btn-secondary btn-sm" style="color:var(--orange);" onclick="cloturerVote('${v.id}')">⏹ Clôturer</button>` : ''}
      ${v.statut !== 'brouillon' ? `<button class="btn btn-ghost btn-sm" onclick="exportVotePDF('${v.id}')">🖨️ PDF Officiel</button>` : ''}
      <button class="btn btn-ghost btn-sm" style="color:var(--red); margin-left:auto;" onclick="deleteVote('${v.id}')" title="Supprimer définitivement">🗑</button>
    </div>` : ''}
  </div>`;
}

// ── FORMULAIRE DE VOTE ──
let _selectedOptions = {};

function renderVoteForm(v) {
  const isMultiple = v.choix_multiple;
  const total = (_allReponsesCache[v.id] || []).length;
  
  let opts = [];
  try {
    opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options || '[]');
  } catch(e) { opts = []; }
  
  // Formatage propre des dates pour Doodle
  if (v.type === 'doodle') {
    opts = opts.map(o => {
      if (o.date) {
        const d = new Date(o.date);
        o.displayLabel = d.toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).replace(':', 'h');
      } else {
        o.displayLabel = o.label;
      }
      return o;
    });
  } else {
    opts.forEach(o => o.displayLabel = o.label);
  }

  return `
  ${total > 0 ? `<div style="font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:12px; display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> ${total} participant(s) actuel(s)</div>` : ''}
  
  <div class="vote-options" id="vopts-${v.id}" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
    ${opts.map(opt => `
      <div class="vote-option" onclick="toggleVoteOption('${v.id}','${opt.id}',${isMultiple})" id="vopt-${v.id}-${opt.id}" style="
        display:flex; align-items:center; gap:12px; padding:12px 16px; border:2px solid var(--border); border-radius:10px; cursor:pointer; background:var(--bg-1); transition:all 0.15s;
      " onmouseover="if(!this.classList.contains('selected')) this.style.borderColor='var(--text-3)'" onmouseout="if(!this.classList.contains('selected')) this.style.borderColor='var(--border)'">
        
        <div class="vote-opt-check" style="
          width:20px; height:20px; border-radius:${isMultiple ? '4px' : '50%'}; border:2px solid var(--text-3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s;
        "></div>
        
        <div style="font-size:14px; font-weight:600; color:var(--text-1); flex:1; line-height:1.4;">${escHtml(opt.displayLabel)}</div>
      </div>`).join('')}
  </div>
  
  <button id="btn-submit-${v.id}" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px; border-radius:10px; font-size:15px;" onclick="submitVote('${v.id}',${isMultiple})">
    ${v.type==='officiel' ? '🗳️ Valider mon vote' : v.type==='doodle' ? '📅 Confirmer mes disponibilités' : '📊 Envoyer ma réponse'}
  </button>`;
}

function toggleVoteOption(voteId, optId, multiple) {
  if (!_selectedOptions[voteId]) _selectedOptions[voteId] = new Set();
  const sel = _selectedOptions[voteId];
  
  if (!multiple) {
    sel.clear();
    // Reset tous les styles
    document.querySelectorAll(`[id^="vopt-${voteId}-"]`).forEach(el => {
      el.classList.remove('selected');
      el.style.borderColor = 'var(--border)';
      el.style.background = 'var(--bg-1)';
      const check = el.querySelector('.vote-opt-check');
      if (check) { check.style.borderColor = 'var(--text-3)'; check.style.background = 'transparent'; check.innerHTML = ''; }
    });
  }

  const el = $(`vopt-${voteId}-${optId}`);
  const check = el?.querySelector('.vote-opt-check');

  if (sel.has(optId)) { 
    sel.delete(optId); 
    if (el) {
      el.classList.remove('selected');
      el.style.borderColor = 'var(--border)';
      el.style.background = 'var(--bg-1)';
      if (check) { check.style.borderColor = 'var(--text-3)'; check.style.background = 'transparent'; check.innerHTML = ''; }
    }
  } else { 
    sel.add(optId); 
    if (el) {
      el.classList.add('selected');
      el.style.borderColor = 'var(--primary)';
      el.style.background = 'var(--primary-light)';
      if (check) { 
        check.style.borderColor = 'var(--primary)'; 
        check.style.background = 'var(--primary)'; 
        check.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>'; 
      }
    }
  }
}

async function submitVote(voteId, multiple) {
  const sel = _selectedOptions[voteId];
  if (!sel?.size) { toast('Veuillez sélectionner au moins une option', 'warn'); return; }
  
  const btn = $(`btn-submit-${voteId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const { error } = await sb.from('votes_reponses').insert({
      vote_id: voteId, 
      user_id: user.id,
      options_choisies: [...sel] // JSONB array direct
    });
    
    if (error) throw error;
    
    toast('Vote enregistré avec succès ✓', 'ok');
    delete _selectedOptions[voteId];
    
    // Le reload va récupérer les résultats globaux et re-rendre la vue
    await loadVotes();
  } catch (err) {
    toast('Erreur de réseau : ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Réessayer'; }
  }
}

// ── RÉSULTATS EN TEMPS RÉEL ──
function renderVoteResults(v, maReponse) {
  const allRep = _allReponsesCache[v.id] || [];
  const total = allRep.length;
  
  let opts = [];
  try { opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options || '[]'); } catch(e) {}
  
  if (!opts.length) return '<div style="color:var(--text-3); font-size:13px;">Options indisponibles</div>';
  
  let myChosen = [];
  try { myChosen = maReponse ? (Array.isArray(maReponse.options_choisies) ? maReponse.options_choisies : JSON.parse(maReponse.options_choisies || '[]')) : []; } catch(e) {}

  // Chercher l'option avec le plus de votes pour la mettre en valeur
  let maxVotes = 0;
  const optsWithCounts = opts.map(opt => {
    const count = allRep.filter(r => {
      let chosen = [];
      try { chosen = typeof r.options_choisies === 'string' ? JSON.parse(r.options_choisies||'[]') : (Array.isArray(r.options_choisies) ? r.options_choisies : []); } catch(e){}
      return chosen.includes(opt.id);
    }).length;
    if (count > maxVotes) maxVotes = count;
    return { ...opt, count };
  });

  return `
  <div style="background:var(--bg-1); border-radius:12px; padding:16px; border:1px solid var(--border);">
    <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:16px; display:flex; justify-content:space-between;">
      <span>Résultats provisoires</span>
      <span>${total} participant(s)</span>
    </div>
    
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${optsWithCounts.map(opt => {
        const pct = total ? Math.round(opt.count/total*100) : 0;
        const isMine = myChosen.includes(opt.id);
        const isWinner = opt.count === maxVotes && maxVotes > 0;
        
        let barColor = 'var(--text-3)'; // Default
        if (isWinner) barColor = 'var(--primary)';
        if (isMine) barColor = 'var(--green)'; // Vert prime sur bleu si c'est mon choix
        
        // Format date Doodle
        let displayLabel = opt.label;
        if (v.type === 'doodle' && opt.date) {
           displayLabel = new Date(opt.date).toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).replace(':', 'h');
        }

        return `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:4px; font-size:13px;">
            <div style="font-weight:${isMine || isWinner ? '700' : '500'}; color:${isMine ? 'var(--green)' : 'var(--text-1)'}; display:flex; align-items:center; gap:6px;">
              ${isMine ? '<span style="color:var(--green); font-size:14px;">✓</span>' : ''}
              ${escHtml(displayLabel)}
            </div>
            <div style="font-weight:700; color:${barColor}; font-variant-numeric:tabular-nums;">
              ${opt.count} (${pct}%)
            </div>
          </div>
          <div style="height:10px; background:var(--bg-2); border-radius:6px; overflow:hidden; box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
            <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:6px; transition:width 1s cubic-bezier(0.16, 1, 0.3, 1);"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${v.anonyme ? `<div style="font-size:11px; color:var(--text-3); margin-top:16px; text-align:center; font-style:italic;">Les réponses individuelles sont masquées (Vote Anonyme)</div>` : ''}
  </div>`;
}

// ── MODALE CRÉATION DE VOTE ──
function openVoteModal() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-vote';
  
  const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];

  overlay.innerHTML = `
  <div class="modal" style="max-width:580px;">
    <div class="mh">
      <span class="mh-title">Créer un Vote ou Sondage</span>
      <button class="mclose" onclick="document.getElementById('modal-vote').remove()">×</button>
    </div>
    <div class="mb" style="padding-bottom:0;">
      
      <div class="fg">
        <label class="label">Type de consultation</label>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;" id="vote-type-grid">
          ${Object.entries(VOTE_TYPES).map(([k,v],i) => `
          <div onclick="selectVoteType('${k}')" id="vtype-${k}" style="border:2px solid ${i===1?'var(--primary)':'var(--border)'}; border-radius:12px; padding:12px; cursor:pointer; text-align:center; background:${i===1?'var(--primary-light)':'var(--surface)'}; transition:all .15s;">
            <div style="font-size:24px; margin-bottom:4px;">${v.ico}</div>
            <div style="font-size:13px; font-weight:700; color:var(--text-1);">${v.label}</div>
            <div style="font-size:10px; color:var(--text-3); margin-top:2px; line-height:1.3;">${v.desc}</div>
          </div>`).join('')}
        </div>
        <input type="hidden" id="vote-type-val" value="sondage">
      </div>
      
      <div class="fg">
        <label class="label">Sujet de la consultation *</label>
        <input type="text" id="vote-titre" class="input" placeholder="Ex: Remplacement de l'ascenseur de la Tour 13" style="font-size:15px; font-weight:600;">
      </div>
      
      <div class="fg">
        <label class="label">Contexte & Explications</label>
        <textarea id="vote-desc" class="textarea" rows="2" placeholder="Expliquez brièvement les enjeux (coûts, impact...)"></textarea>
      </div>
      
      <div class="fg" style="background:var(--bg-1); padding:16px; border-radius:12px; border:1px solid var(--border);">
        <label class="label" style="display:flex; justify-content:space-between;">
          <span>Options de réponse *</span>
        </label>
        <div id="vote-options-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
          </div>
        <button class="btn btn-secondary btn-sm" id="vote-add-opt-btn" onclick="addVoteOption()" style="width:100%; justify-content:center;">+ Ajouter une option</button>
      </div>
      
      <div class="fg-row" style="margin-top:16px;">
        <div class="fg">
          <label class="label">Public concerné</label>
          <select id="vote-cible" class="select" style="width:100%;">
            <option value="tous">Toute la résidence</option>
            <option value="cs">Conseil Syndical uniquement</option>
            ${listeTours.map(t=>`<option value="${t}">Bâtiment ${t}</option>`).join('')}
          </select>
        </div>
        <div class="fg">
          <label class="label">Date de clôture</label>
          <input type="datetime-local" id="vote-cloture" class="input">
        </div>
      </div>
      
      <div style="background:var(--surface-2); padding:16px; border-radius:12px; border:1px solid var(--border); margin-top:8px;">
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:12px;">Paramètres de scrutin</div>
        
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--text-1);">Vote anonyme</div>
            <div style="font-size:11px; color:var(--text-3);">Personne ne verra qui a voté quoi</div>
          </div>
          <input type="checkbox" id="vote-anonyme" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>
        
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--text-1);">Choix multiples</div>
            <div style="font-size:11px; color:var(--text-3);">Permet de sélectionner plusieurs options</div>
          </div>
          <input type="checkbox" id="vote-multiple" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>
        
        <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--border); padding-top:12px;">
          <div style="flex:1; padding-right:16px;">
            <div style="font-size:13px; font-weight:600; color:var(--text-1);">Quorum (Participation minimale)</div>
            <div style="font-size:11px; color:var(--text-3);" id="quorum-calc-hint">Laisser vide si non applicable</div>
          </div>
          <div style="display:flex; align-items:center; background:var(--bg-1); border:1px solid var(--border); border-radius:8px; overflow:hidden; width:80px;">
            <input type="number" id="vote-quorum" class="input" style="border:none; width:100%; text-align:right; font-weight:700; padding:6px; margin:0;" placeholder="0" min="0" max="100" oninput="updateQuorumHint(this.value)">
            <span style="padding:6px 8px 6px 0; color:var(--text-3); font-weight:700; font-size:14px;">%</span>
          </div>
        </div>
      </div>
      
    </div>
    <div class="mf" style="justify-content:flex-end; padding-top:16px;">
      <button class="btn btn-secondary" onclick="document.getElementById('modal-vote').remove()">Annuler</button>
      <button id="btn-brouillon" class="btn btn-secondary" onclick="saveVote('brouillon')">💾 Brouillon</button>
      <button id="btn-publier" class="btn btn-primary" onclick="saveVote('ouvert')">🚀 Publier maintenant</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  
  // Init par défaut (Sondage)
  selectVoteType('sondage');
}

function updateQuorumHint(val) {
  const hint = $('quorum-calc-hint');
  if (!hint) return;
  const pct = parseInt(val);
  if (!pct || isNaN(pct)) { hint.textContent = "Laisser vide si non applicable"; return; }
  // Hypothèse globale (peut être affinée)
  const totalRes = 240; 
  const requis = Math.ceil((pct / 100) * totalRes);
  hint.innerHTML = `<span style="color:var(--orange); font-weight:600;">⚠️ Requis : env. ${requis} participants</span>`;
}

function addVoteOption() {
  const list = $('vote-options-list');
  if (!list) return;
  const isDoodle = $('vote-type-val')?.value === 'doodle';
  
  const div = document.createElement('div');
  div.style.cssText = 'display:flex; gap:8px; align-items:center;';
  div.innerHTML = isDoodle
    ? `<input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1; margin:0;">
       <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>`
    : `<input type="text" class="input vote-opt-input" placeholder="Saisir l'option..." style="flex:1; margin:0;">
       <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>`;
  list.appendChild(div);
}

function selectVoteType(k) {
  const valInput = $('vote-type-val');
  if (valInput) valInput.value = k;
  
  Object.keys(VOTE_TYPES).forEach(key => {
    const el = $(`vtype-${key}`);
    if (!el) return;
    if (key === k) { 
      el.style.borderColor = 'var(--primary)'; 
      el.style.background = 'var(--primary-light)'; 
    } else { 
      el.style.borderColor = 'var(--border)'; 
      el.style.background = 'var(--surface)'; 
    }
  });

  const list = $('vote-options-list');
  const addBtn = $('vote-add-opt-btn');
  if (!list) return;

  if (k === 'officiel') {
    list.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="font-size:20px; width:24px; text-align:center;">✅</div>
        <input type="text" class="input vote-opt-input" value="Pour" style="margin:0; font-weight:700; background:var(--green-light); color:var(--green); border-color:var(--green-border);">
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="font-size:20px; width:24px; text-align:center;">❌</div>
        <input type="text" class="input vote-opt-input" value="Contre" style="margin:0; font-weight:700; background:var(--red-light); color:var(--red); border-color:var(--red-border);">
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="font-size:20px; width:24px; text-align:center;">⚪</div>
        <input type="text" class="input vote-opt-input" value="Abstention" style="margin:0; font-weight:700; background:var(--bg-2);">
      </div>`;
    if (addBtn) addBtn.style.display = 'none';
    
    // Valeurs par défaut Vote Officiel
    const q = $('vote-quorum'); if (q) { q.value = 50; updateQuorumHint(50); }
    const m = $('vote-multiple'); if (m) m.checked = false;

  } else if (k === 'doodle') {
    list.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1; margin:0;">
        <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1; margin:0;">
        <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>
      </div>`;
    if (addBtn) { addBtn.style.display='flex'; addBtn.innerHTML='<span style="font-size:16px; margin-right:6px;">+</span> Ajouter un créneau horaire'; }
    
    // Valeurs par défaut Doodle
    const m = $('vote-multiple'); if (m) m.checked = true;
    const q = $('vote-quorum'); if (q) { q.value = ''; updateQuorumHint(''); }

  } else { // Sondage Classique
    list.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="text" class="input vote-opt-input" placeholder="Ex: Peinture bleue" style="flex:1; margin:0;">
        <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="text" class="input vote-opt-input" placeholder="Ex: Peinture verte" style="flex:1; margin:0;">
        <button class="btn btn-ghost btn-sm" style="color:var(--red); padding:0 12px; height:42px; border:1px solid var(--border); border-radius:8px;" onclick="this.parentElement.remove()">×</button>
      </div>`;
    if (addBtn) { addBtn.style.display='flex'; addBtn.innerHTML='<span style="font-size:16px; margin-right:6px;">+</span> Ajouter une option'; }
    const q = $('vote-quorum'); if (q) { q.value = ''; updateQuorumHint(''); }
  }
}

async function saveVote(statut) {
  const titre = $('vote-titre')?.value.trim();
  if (!titre) { toast('Le sujet de la consultation est requis', 'err'); return; }
  
  const voteType = $('vote-type-val')?.value || 'sondage';
  const optInputs = document.querySelectorAll('.vote-opt-input');
  const isDoodle = voteType === 'doodle';
  
  const options = [...optInputs].map((el,i) => {
    const val = el.value.trim();
    if (!val) return null;
    if (isDoodle) {
      return { id:`opt-${i}`, label: val, date: val }; // Format brut préservé, formaté à l'affichage
    }
    return { id:`opt-${i}`, label: val };
  }).filter(Boolean);
  
  if (options.length < 2) { toast('Il faut au minimum 2 options de réponse', 'err'); return; }
  
  const cloture = $('vote-cloture')?.value;
  const quorum = parseInt($('vote-quorum')?.value) || null;

  // UX Feedback
  const btnId = statut === 'ouvert' ? 'btn-publier' : 'btn-brouillon';
  const btn = $(btnId);
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const payload = {
      titre, 
      type: voteType, 
      statut,
      description: $('vote-desc')?.value.trim() || null,
      options: options,
      cible: $('vote-cible')?.value || 'tous',
      anonyme: $('vote-anonyme')?.checked || false,
      choix_multiple: $('vote-multiple')?.checked || false,
      quorum_requis: quorum,
      date_cloture: cloture ? new Date(cloture).toISOString() : null,
      auteur_id: user.id,
    };

    const { error } = await sb.from('votes').insert(payload);
    if (error) throw error;

    document.getElementById('modal-vote')?.remove();
    toast(statut === 'ouvert' ? 'Vote publié avec succès 🚀' : 'Brouillon sauvegardé 💾', 'ok');

    if (statut === 'ouvert') {
      // Notifications asynchrones
      const { data: allUsers } = await sb.from('profiles').select('id, email').eq('actif', true);
      const notifs = (allUsers||[]).filter(u=>u.id!==user.id).map(u=>({
        destinataire_id: u.id,
        destinataire_email: u.email || '',
        sujet: `${voteType==='officiel'?'🗳️':'📊'} Nouveau ${voteType==='officiel'?'vote':'sondage'} : ${titre}`,
        corps: `Nouveau ${voteType==='officiel'?'vote':'sondage'} disponible : ${titre}`,
        lu: false
      }));
      
      if (notifs.length) sb.from('notifications').insert(notifs).catch(console.warn);
      
      if (typeof sendEmailDirect === 'function') {
        sendEmailDirect('nouvelle_annonce', null, {
          titre: `${voteType==='officiel'?'🗳️ Vote officiel':'📊 Sondage'} : ${titre}`,
          type: 'important',
          contenu: `Un nouveau ${voteType==='officiel'?'vote':'sondage'} vient d'être publié sur CoproSync.`
        }).catch(console.warn);
      }
    }

    await loadVotes();

  } catch (err) {
    toast('Erreur serveur : ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = statut === 'ouvert' ? '🚀 Publier maintenant' : '💾 Brouillon'; }
  }
}

async function publierVote(id) {
  const btn = $(`btn-pub-${id}`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  
  try {
    const { error } = await sb.from('votes').update({ statut:'ouvert' }).eq('id', id);
    if (error) throw error;
    
    toast('Vote publié ✓', 'ok');
    const v = _votesCache.find(x => x.id === id);
    if (v && typeof publishFeedEvent === 'function') {
      publishFeedEvent('vote', `🗳️ Nouveau vote ouvert : "${v.titre}" — Participez depuis l'onglet Votes !`).catch(console.warn);
    }
    
    await loadVotes();
  } catch (err) {
    toast('Erreur de publication', 'err');
    if (btn) { btn.disabled = false; btn.textContent = '▶ Publier le vote'; }
  }
}

async function cloturerVote(id) {
  if (!confirm('Clôturer définitivement ce vote ? Les résidents ne pourront plus voter et les résultats seront figés.')) return;
  
  const btn = $(`btn-clo-${id}`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const { error } = await sb.from('votes').update({ statut:'clos' }).eq('id', id);
    if (error) throw error;
    
    toast('Vote clôturé 🛑', 'ok');
    const v = _votesCache.find(x => x.id === id);
    
    // Mail Syndic Résultat
    if (v && typeof sendEmailDirect === 'function') {
      const allRep = _allReponsesCache[id] || [];
      const total = allRep.length;
      let opts = [];
      try { opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options||'[]'); } catch(e){}
      
      const resultats = opts.map(opt => {
        const count = allRep.filter(r => {
          let chosen = [];
          try { chosen = Array.isArray(r.options_choisies) ? r.options_choisies : JSON.parse(r.options_choisies||'[]'); } catch(e){}
          return chosen.includes(opt.id);
        }).length;
        return `${opt.label} : ${count} vote(s) (${total?Math.round(count/total*100):0}%)`;
      }).join(' | ');
      
      sendEmailDirect('nouvelle_annonce', null, {
        titre: `⏹ Vote clôturé : ${v.titre}`,
        type: 'important',
        contenu: `Résultats finaux (${total} participant(s)) — ${resultats}`
      }).catch(console.warn);
    }
    
    await loadVotes();
  } catch (err) {
    toast('Erreur de clôture', 'err');
    if (btn) { btn.disabled = false; btn.textContent = '⏹ Clôturer'; }
  }
}

async function deleteVote(id) {
  if (!confirm('Attention : Cette action supprimera le vote et TOUTES les réponses associées de manière irréversible. Continuer ?')) return;
  try {
    const { error } = await sb.from('votes').delete().eq('id', id);
    if (error) throw error;
    
    document.getElementById('modal-vote-detail')?.remove();
    toast('Consultation effacée', 'ok');
    await loadVotes();
  } catch (err) {
    toast('Impossible de supprimer', 'err');
  }
}

async function openVoteDetail(voteId) {
  const v = _votesCache.find(x => x.id === voteId);
  if (!v) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-vote-detail';
  
  overlay.innerHTML = `<div class="modal" style="max-width:540px; text-align:center; padding:40px;"><div class="spinner" style="margin:0 auto 16px;"></div>Chargement de la data...</div>`;
  document.body.appendChild(overlay);

  try {
    const { data: allRep, error } = await sb.from('votes_reponses').select('*, profiles(nom,prenom)').eq('vote_id', voteId);
    if (error) throw error;

    const total = (allRep||[]).length;
    let opts = [];
    try { opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options||'[]'); } catch(e){}
    
    const quorumPct = total ? Math.round((total/240)*100) : 0; // Hypothèse 240 logements
    const quorumOk = v.quorum_requis ? quorumPct >= v.quorum_requis : true;

    // Calculs Stats
    const statsHtml = opts.map(opt => {
      const count = (allRep||[]).filter(r => {
        let chosen = [];
        try { chosen = Array.isArray(r.options_choisies) ? r.options_choisies : JSON.parse(r.options_choisies||'[]'); } catch(e){}
        return chosen.includes(opt.id);
      }).length;
      
      const pct = total ? Math.round(count/total*100) : 0;
      
      let displayLabel = opt.label;
      if (v.type === 'doodle' && opt.date) {
        displayLabel = new Date(opt.date).toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).replace(':', 'h');
      }

      return `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items:baseline;">
          <span style="font-weight:700; font-size:14px; color:var(--text-1);">${escHtml(displayLabel)}</span>
          <span style="font-weight:800; font-size:15px; color:var(--primary); font-variant-numeric:tabular-nums;">${count} <span style="font-size:11px; opacity:0.6;">(${pct}%)</span></span>
        </div>
        <div style="height:12px; background:var(--bg-2); border-radius:6px; overflow:hidden; box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
          <div style="height:100%; width:${pct}%; background:var(--primary); border-radius:6px; transition:width 1s ease-out;"></div>
        </div>
      </div>`;
    }).join('');

    overlay.innerHTML = `
    <div class="modal" style="max-width:540px;">
      <div class="mh">
        <span class="mh-title" style="display:flex; align-items:center; gap:8px;">📊 Résultats Détaillés</span>
        <button class="mclose" onclick="document.getElementById('modal-vote-detail').remove()">×</button>
      </div>
      <div class="mb">
        
        <div style="margin-bottom:24px; text-align:center;">
          <div style="font-family:var(--font-head); font-size:20px; font-weight:800; color:var(--text-1); margin-bottom:8px; line-height:1.2;">${escHtml(v.titre)}</div>
          <div style="display:inline-flex; align-items:center; gap:12px; font-size:12px; color:var(--text-2); background:var(--bg-1); padding:6px 16px; border-radius:20px; border:1px solid var(--border);">
            <span><strong>${total}</strong> participant(s)</span>
            <span style="width:4px; height:4px; background:var(--border); border-radius:50%;"></span>
            <span>${v.anonyme ? '🔒 Vote Anonyme' : '👤 Vote Nominatif'}</span>
            <span style="width:4px; height:4px; background:var(--border); border-radius:50%;"></span>
            <span>${v.statut === 'clos' ? '🛑 Clos' : '🟢 En cours'}</span>
          </div>
        </div>

        <div style="background:var(--surface); padding:20px; border:1px solid var(--border); border-radius:12px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
          ${statsHtml}
        </div>

        ${v.quorum_requis ? `
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:600; margin-bottom:20px; background:${quorumOk ? 'var(--green-light)' : 'var(--red-light)'}; border:1px solid ${quorumOk ? 'var(--green-border)' : 'var(--red-border)'}; color:${quorumOk ? 'var(--green)' : 'var(--red)'};">
          <div style="font-size:24px;">${quorumOk ? '✅' : '⚠️'}</div>
          <div>
            <div style="text-transform:uppercase; letter-spacing:0.05em; font-size:10px; opacity:0.8;">Condition de validation</div>
            <div>Quorum ${quorumOk ? 'atteint' : 'NON atteint'} — Participation : ${quorumPct}% (Requis : ${v.quorum_requis}%)</div>
          </div>
        </div>` : ''}

        ${!v.anonyme && allRep?.length ? `
        <div style="border-top:1px dashed var(--border); padding-top:20px;">
          <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:12px;">A voté :</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${allRep.map(r => {
              const name = typeof displayName === 'function' ? displayName(r.profiles?.prenom, r.profiles?.nom, null, '?') : '?';
              return `<span style="background:var(--bg-2); border:1px solid var(--border); color:var(--text-2); border-radius:6px; padding:4px 10px; font-size:12px; font-weight:500;">${escHtml(name)}</span>`;
            }).join('')}
          </div>
        </div>` : ''}
        
      </div>
      <div class="mf" style="justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-vote-detail').remove()">Fermer</button>
        <button class="btn btn-primary" onclick="exportVotePDF('${voteId}')">🖨️ Exporter PDF Officiel</button>
      </div>
    </div>`;

  } catch(e) {
    overlay.innerHTML = `<div class="modal" style="max-width:400px; padding:24px; text-align:center;">Erreur réseau.<br><br><button class="btn btn-secondary" onclick="this.closest('.overlay').remove()">Fermer</button></div>`;
  }
}

// ── EXPORT PDF PREMIUM ──
async function exportVotePDF(voteId) {
  const v = _votesCache.find(x => x.id === voteId);
  if (!v) return;
  
  if (typeof toast === 'function') toast('Génération du PDF...', 'ok');

  try {
    const { data: allRep } = await sb.from('votes_reponses').select('*, profiles(nom,prenom)').eq('vote_id', voteId);
    
    const total = (allRep||[]).length;
    let opts = [];
    try { opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options||'[]'); } catch(e){}
    
    const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const quorumPct = total ? Math.round((total/240)*100) : 0;
    const quorumOk = v.quorum_requis ? quorumPct >= v.quorum_requis : true;
    
    const adminName = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Syndicat des Copropriétaires';

    const win = window.open('', '_blank');
    if (!win) throw new Error("Popup bloquée");

    win.document.write(`<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Résultats de Consultation — ${v.titre}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { size: A4; margin: 20mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        
        .doc-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 16px; border-bottom: 2px solid #111827; margin-bottom: 32px; }
        .org-name { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .doc-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #111827; }
        .doc-meta { text-align: right; font-size: 9px; color: #6b7280; line-height: 1.6; }
        
        .subject-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 32px; }
        .subject-title { font-size: 16px; font-weight: 800; margin-bottom: 8px; color: #111827; }
        .subject-desc { font-size: 12px; color: #4b5563; margin-bottom: 16px; }
        .subject-badges { display: flex; gap: 12px; font-size: 10px; font-weight: 700; color: #6b7280; }
        
        .results-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 20px; color: #374151; }
        
        .opt-row { margin-bottom: 20px; page-break-inside: avoid; }
        .opt-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; align-items: flex-end; }
        .opt-name { font-weight: 600; color: #1f2937; }
        .opt-score { font-weight: 800; color: #2563eb; }
        .opt-bar-wrap { height: 16px; background: #f3f4f6; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
        .opt-bar { height: 100%; background: #3b82f6; }
        
        .quorum-box { margin-top: 32px; padding: 16px; border-radius: 8px; border: 1px solid; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 12px; }
        .quorum-box.ok { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
        .quorum-box.ko { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        
        .participants { margin-top: 32px; font-size: 10px; color: #6b7280; border-top: 1px dashed #e5e7eb; padding-top: 16px; }
        
        .doc-footer { position: fixed; bottom: 0; left: 0; right: 0; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        
        @media print { 
          button { display: none !important; }
          @page { margin: 15mm 20mm; }
        }
      </style>
    </head>
    <body>
      <div class="doc-header">
        <div>
          <div class="org-name">CoproSync · Résidence le Floréal</div>
          <div class="doc-title">Rapport de Consultation</div>
        </div>
        <div class="doc-meta">
          <div><strong>Édité le :</strong> ${today.split(' à ')[0]} à ${today.split(' à ')[1]}</div>
          <div><strong>Par :</strong> ${escHtml(adminName)}</div>
          <div><strong>Statut :</strong> ${v.statut === 'clos' ? 'CLOS (Définitif)' : 'EN COURS (Provisoire)'}</div>
        </div>
      </div>
      
      <div class="subject-box">
        <div class="subject-title">${escHtml(v.titre)}</div>
        ${v.description ? `<div class="subject-desc">${escHtml(v.description)}</div>` : ''}
        <div class="subject-badges">
          <span>Type : ${v.type === 'officiel' ? 'Vote Résolution' : v.type === 'doodle' ? 'Sondage Date' : 'Sondage'}</span>
          <span>·</span>
          <span>Participation : ${total} votant(s)</span>
          <span>·</span>
          <span>Scrutin : ${v.anonyme ? 'Secret (Anonyme)' : 'Public (Nominatif)'}</span>
        </div>
      </div>
      
      <div class="results-title">Détail des suffrages exprimés</div>
      
      ${opts.map(opt => {
        const count = (allRep||[]).filter(r => {
          let chosen = [];
          try { chosen = Array.isArray(r.options_choisies) ? r.options_choisies : JSON.parse(r.options_choisies||'[]'); } catch(e){}
          return chosen.includes(opt.id);
        }).length;
        
        const pct = total ? Math.round(count/total*100) : 0;
        
        let displayLabel = opt.label;
        if (v.type === 'doodle' && opt.date) {
           displayLabel = new Date(opt.date).toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).replace(':', 'h');
        }

        return `
        <div class="opt-row">
          <div class="opt-header">
            <span class="opt-name">${escHtml(displayLabel)}</span>
            <span class="opt-score">${count} voix <span style="font-size:10px; color:#6b7280; font-weight:600;">(${pct}%)</span></span>
          </div>
          <div class="opt-bar-wrap"><div class="opt-bar" style="width:${pct}%"></div></div>
        </div>`;
      }).join('')}
      
      ${v.quorum_requis ? `
      <div class="quorum-box ${quorumOk ? 'ok' : 'ko'}">
        <div style="font-size:24px;">${quorumOk ? '✅' : '⚠️'}</div>
        <div>
          <div style="text-transform:uppercase; letter-spacing:0.05em; font-size:9px; margin-bottom:2px;">Quorum / Validité</div>
          <div>Le quorum de ${v.quorum_requis}% est ${quorumOk ? '<strong>atteint</strong>' : '<strong>non atteint</strong>'} (Participation actuelle : ${quorumPct}% des tantièmes/lots).</div>
        </div>
      </div>` : ''}
      
      ${!v.anonyme && allRep?.length ? `
      <div class="participants">
        <strong>Liste d'émargement (Votants) :</strong><br>
        ${allRep.map(r => {
          const name = typeof displayName === 'function' ? displayName(r.profiles?.prenom, r.profiles?.nom, null, '?') : '?';
          return escHtml(name);
        }).join(', ')}.
      </div>` : ''}

      <div class="doc-footer">
        <span>Généré certifié par CoproSync</span>
        <span>Pièce jointe officielle PV</span>
      </div>
      
      <script>window.onload=()=>{ setTimeout(()=>{window.print();window.close();}, 500); }<\/script>
    </body>
    </html>`);
    win.document.close();

  } catch(e) {
    console.error(e);
    toast('Erreur lors de l\'export', 'err');
  }
}
