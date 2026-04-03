const VOTE_TYPES = {
  officiel: { label:'Vote officiel', ico:'🗳️', desc:'Pour/Contre/Abstention avec quorum' },
  sondage:  { label:'Sondage',       ico:'📊', desc:'Question à choix multiples' },
  doodle:   { label:'Disponibilités',ico:'📅', desc:'Trouver une date commune' },
};

let _votesCache = [];
let _reponsesCache = {};
let _allReponsesCache = {};

async function renderVotes() {
  $('page').innerHTML = `<div style="padding:24px;max-width:760px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Votes & Sondages</h1><p>Décisions participatives de la résidence</p></div>
      ${isManager() ? `<button class="btn btn-primary" onclick="openVoteModal()">+ Créer</button>` : ''}
    </div>
    <div id="votes-list"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
  </div>`;
  await loadVotes();
}

async function loadVotes() {
  const { data: votes } = await sb.from('votes').select('*').order('created_at', { ascending:false });
  const { data: reponses } = await sb.from('votes_reponses').select('*').eq('user_id', user.id);
  // Charge TOUTES les réponses pour les résultats
  const { data: toutesReponses } = await sb.from('votes_reponses').select('*');
  _votesCache = votes || [];
  _reponsesCache = {};
  (reponses||[]).forEach(r => { _reponsesCache[r.vote_id] = r; });
  // Cache global des réponses par vote_id
  _allReponsesCache = {};
  (toutesReponses||[]).forEach(r => {
    if (!_allReponsesCache[r.vote_id]) _allReponsesCache[r.vote_id] = [];
    _allReponsesCache[r.vote_id].push(r);
  });
  renderVotesList();
  // Badge
  const nonRepondus = _votesCache.filter(v => v.statut==='ouvert' && !_reponsesCache[v.id]).length;
  const el = $('nc-votes');
  if (el) { el.textContent = nonRepondus; el.style.display = nonRepondus>0?'':'none'; }
}

function renderVotesList() {
  const el = $('votes-list');
  if (!el) return;
  if (!_votesCache.length) {
    el.innerHTML = emptyState('🗳️', 'Aucun vote en cours', 'Les votes officiels et sondages de la résidence apparaîtront ici.');
    return;
  }
  const ouverts = _votesCache.filter(v => v.statut === 'ouvert');
  const clos = _votesCache.filter(v => v.statut === 'clos');
  const brouillons = isManager() ? _votesCache.filter(v => v.statut === 'brouillon') : [];
  let html = '';
  if (ouverts.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--green);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">🟢 En cours (${ouverts.length})</div>`;
    html += ouverts.map(v => renderVoteCard(v)).join('');
  }
  if (brouillons.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--amber);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;">✏️ Brouillons</div>`;
    html += brouillons.map(v => renderVoteCard(v)).join('');
  }
  if (clos.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;">📁 Terminés (${clos.length})</div>`;
    html += clos.map(v => renderVoteCard(v)).join('');
  }
  el.innerHTML = html;
}

function renderVoteCard(v) {
  const type = VOTE_TYPES[v.type] || VOTE_TYPES.sondage;
  const maReponse = _reponsesCache[v.id];
  const dejaVote = !!maReponse;
  const options = v.options || [];
  const totalVotes = 0; // sera chargé si nécessaire
  const cloture = v.date_cloture ? new Date(v.date_cloture) : null;
  const joursRestants = cloture ? Math.ceil((cloture - new Date()) / 86400000) : null;
  return `<div class="vote-card ${v.statut}">
    <div class="vote-header">
      <div class="vote-type-ico">${type.ico}</div>
      <div style="flex:1;">
        <div class="vote-titre">${escHtml(v.titre)}</div>
        <div class="vote-meta">
          ${type.label}
          ${cloture && v.statut==='ouvert' ? ` · ${joursRestants>0?'Clôture dans '+joursRestants+'j':'Clôture aujourd\'hui'}` : ''}
          ${v.statut==='clos' ? ' · Terminé' : ''}
          ${v.cible !== 'tous' ? ` · ${escHtml(v.cible)}` : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        ${v.statut==='ouvert' && !dejaVote ? `<span style="background:var(--orange-light);color:var(--orange);font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;">À voter</span>` : ''}
        ${dejaVote ? `<span style="background:var(--green-light);color:var(--green);font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;">✓ Voté</span>` : ''}
        ${isManager() ? `<button class="btn btn-ghost btn-sm" onclick="openVoteDetail('${v.id}')">Résultats</button>` : ''}
      </div>
    </div>
    ${v.description ? `<p style="font-size:13px;color:var(--text-2);margin-bottom:14px;">${escHtml(v.description)}</p>` : ''}
    ${v.statut==='ouvert' && !dejaVote ? renderVoteForm(v) : renderVoteResults(v, maReponse)}
    ${isManager() ? `
    <div style="display:flex;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
      ${v.statut==='brouillon' ? `<button class="btn btn-primary btn-sm" onclick="publierVote('${v.id}')">▶ Publier</button>` : ''}
      ${v.statut==='ouvert' ? `<button class="btn btn-secondary btn-sm" onclick="cloturerVote('${v.id}')">⏹ Clôturer</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="exportVotePDF('${v.id}')">🖨️ PDF</button>
      <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteVote('${v.id}')">🗑</button>
    </div>` : ''}
  </div>`;
}

function renderVoteForm(v) {
  const isMultiple = v.choix_multiple;
  const total = (_allReponsesCache[v.id] || []).length;
  const opts = Array.isArray(v.options) ? v.options
    : (typeof v.options === 'string' ? JSON.parse(v.options||'[]') : []);
  return `
  ${total > 0 ? `<div style="font-size:12px;color:var(--text-3);margin-bottom:10px;">👥 ${total} personne${total>1?'s':''} ont déjà voté</div>` : ''}
  <div class="vote-options" id="vopts-${v.id}">
    ${opts.map(opt => `
      <div class="vote-option" onclick="toggleVoteOption('${v.id}','${opt.id}',${isMultiple})" id="vopt-${v.id}-${opt.id}">
        <div class="vote-opt-check${isMultiple?' square':''}"></div>
        <div class="vote-opt-label">${escHtml(opt.label)}</div>
      </div>`).join('')}
  </div>
  <button class="btn btn-primary btn-sm" onclick="submitVote('${v.id}',${isMultiple})">
    ${v.type==='officiel' ? '🗳️ Voter' : v.type==='doodle' ? '📅 Indiquer mes disponibilités' : '📊 Répondre'}
  </button>`;
}

let _selectedOptions = {};
function toggleVoteOption(voteId, optId, multiple) {
  if (!_selectedOptions[voteId]) _selectedOptions[voteId] = new Set();
  const sel = _selectedOptions[voteId];
  if (!multiple) {
    sel.clear();
    document.querySelectorAll(`[id^="vopt-${voteId}-"]`).forEach(el => el.classList.remove('selected'));
  }
  if (sel.has(optId)) { sel.delete(optId); $(`vopt-${voteId}-${optId}`)?.classList.remove('selected'); }
  else { sel.add(optId); $(`vopt-${voteId}-${optId}`)?.classList.add('selected'); }
}

async function submitVote(voteId, multiple) {
  const sel = _selectedOptions[voteId];
  if (!sel?.size) { toast('Sélectionnez une option', 'warn'); return; }
  const { error } = await sb.from('votes_reponses').insert({
    vote_id: voteId, user_id: user.id,
    options_choisies: [...sel] // JSONB array direct
  });
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  toast('Vote enregistré ✓', 'ok');
  delete _selectedOptions[voteId];
  await loadVotes();
}

function renderVoteResults(v, maReponse) {
  const allRep = _allReponsesCache[v.id] || [];
  const total = allRep.length;
  const opts = Array.isArray(v.options) ? v.options
    : (typeof v.options === 'string' ? JSON.parse(v.options||'[]') : []);
  if (!opts.length) return '<div style="color:var(--text-3);font-size:13px;">Aucune option définie</div>';
  const myChosen = maReponse ? JSON.parse(maReponse.options_choisies||'[]') : [];
  return opts.map(opt => {
    const count = allRep.filter(r => {
      const chosen = typeof r.options_choisies === 'string'
        ? JSON.parse(r.options_choisies||'[]')
        : (Array.isArray(r.options_choisies) ? r.options_choisies : []);
      return chosen.includes(opt.id);
    }).length;
    const pct = total ? Math.round(count/total*100) : 0;
    const isMine = myChosen.includes(opt.id);
    return `<div class="vote-result-option">
      <div style="width:28px;text-align:center;font-size:13px;color:var(--green);">${isMine?'✓':''}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:${isMine?'700':'500'};margin-bottom:4px;">${escHtml(opt.label)}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="vote-bar-wrap"><div class="vote-bar" style="width:${pct}%;background:${isMine?'var(--green)':'var(--accent)'};"></div></div>
          <span style="font-size:12px;color:var(--text-3);min-width:60px;">${count} vote${count>1?'s':''} · ${pct}%</span>
        </div>
      </div>
    </div>`;
  }).join('') + `<div style="font-size:12px;color:var(--text-3);margin-top:8px;">${total} participant${total>1?'s':''} au total${v.anonyme?' · Anonyme':''}</div>`;
}

async function openVoteDetail(voteId) {
  const v = _votesCache.find(x => x.id === voteId);
  if (!v) return;
  const { data: allRep } = await sb.from('votes_reponses').select('*, profiles(nom,prenom)').eq('vote_id', voteId);
  const total = (allRep||[]).length;
  const opts = Array.isArray(v.options) ? v.options : (typeof v.options === 'string' ? JSON.parse(v.options||'[]') : []);
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-vote-detail';
  const quorumOk = v.quorum_requis ? Math.round(total/240*100) >= v.quorum_requis : true;
  overlay.innerHTML = `<div class="modal" style="max-width:540px;">
    <div class="mh">
      <span class="mh-title">Résultats — ${escHtml(v.titre)}</span>
      <button class="mclose" onclick="document.getElementById('modal-vote-detail').remove()">×</button>
    </div>
    <div class="mb">
      <div style="font-size:13px;color:var(--text-2);margin-bottom:16px;">${total} participant${total>1?'s':''} · ${v.anonyme?'Vote anonyme':'Vote nominatif'}</div>
      ${opts.map(opt => {
        const count = (allRep||[]).filter(r => {
          const chosen = Array.isArray(r.options_choisies) ? r.options_choisies
            : JSON.parse(r.options_choisies||'[]');
          return chosen.includes(opt.id);
        }).length;
        const pct = total ? Math.round(count/total*100) : 0;
        return `<div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-weight:600;">${escHtml(opt.label)}</span>
            <span style="font-weight:700;color:var(--accent);">${count} (${pct}%)</span>
          </div>
          <div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:5px;transition:width .4s;"></div>
          </div>
        </div>`;
      }).join('')}
      ${v.quorum_requis ? `<div class="vote-quorum ${quorumOk?'ok':'ko'}">
        ${quorumOk?'✅':'❌'} Quorum ${quorumOk?'atteint':'non atteint'} — ${Math.round(total/240*100)}% de participation (requis: ${v.quorum_requis}%)
      </div>` : ''}
      ${!v.anonyme && allRep?.length ? `
      <div style="margin-top:16px;font-size:12px;color:var(--text-3);">
        <div style="font-weight:700;margin-bottom:6px;">Participants :</div>
        ${allRep.map(r => `<span style="background:var(--surface-2);border-radius:10px;padding:2px 8px;margin:2px;display:inline-block;">${displayName(r.profiles?.prenom,r.profiles?.nom,null,'?')}</span>`).join('')}
      </div>` : ''}
    </div>
    <div class="mf">
      <button class="btn btn-secondary" onclick="document.getElementById('modal-vote-detail').remove()">Fermer</button>
      <button class="btn btn-primary" onclick="exportVotePDF('${voteId}')">🖨️ Exporter PDF</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function openVoteModal() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-vote';
  overlay.innerHTML = `<div class="modal" style="max-width:560px;">
    <div class="mh">
      <span class="mh-title">Créer un vote / sondage</span>
      <button class="mclose" onclick="document.getElementById('modal-vote').remove()">×</button>
    </div>
    <div class="mb">
      <div class="fg"><label class="label">Type</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px;" id="vote-type-grid">
          ${Object.entries(VOTE_TYPES).map(([k,v],i) => `
          <div onclick="selectVoteType('${k}')" id="vtype-${k}" style="border:2px solid ${i===1?'var(--accent)':'var(--border)'};border-radius:var(--r-md);padding:10px;cursor:pointer;text-align:center;background:${i===1?'var(--blue-light)':'var(--surface)'};transition:all .15s;">
            <div style="font-size:20px;">${v.ico}</div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">${v.label}</div>
            <div style="font-size:10px;color:var(--text-3);">${v.desc}</div>
          </div>`).join('')}
        </div>
        <input type="hidden" id="vote-type-val" value="sondage">
      </div>
      <div class="fg"><label class="label">Question / Titre *</label>
        <input type="text" id="vote-titre" class="input" placeholder="Ex: Êtes-vous pour le remplacement de la chaudière ?">
      </div>
      <div class="fg"><label class="label">Description (optionnel)</label>
        <textarea id="vote-desc" class="textarea" rows="2" placeholder="Contexte, enjeux…"></textarea>
      </div>
      <div class="fg">
        <label class="label">Options de réponse *</label>
        <div id="vote-options-list">
          <div style="display:flex;gap:6px;margin-bottom:6px;"><input type="text" class="input vote-opt-input" placeholder="Option 1…"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button></div>
          <div style="display:flex;gap:6px;margin-bottom:6px;"><input type="text" class="input vote-opt-input" placeholder="Option 2…"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button></div>
        </div>
        <button class="btn btn-ghost btn-sm" id="vote-add-opt-btn" onclick="addVoteOption()">+ Ajouter une option</button>
      </div>
      <div class="fg-row">
        <div class="fg">
          <label class="label">Concerne</label>
          <select id="vote-cible" class="select" style="width:100%;">
            <option value="tous">Tous les résidents</option>
            <option value="cs">Conseil Syndical</option>
            ${COPRO.tours.map(t=>`<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><label class="label">Clôture</label>
          <input type="datetime-local" id="vote-cloture" class="input">
        </div>
      </div>
      <div class="fg-row">
        <div class="fg" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="vote-anonyme">
          <label for="vote-anonyme" style="cursor:pointer;font-size:13px;">🔒 Vote anonyme</label>
        </div>
        <div class="fg" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="vote-multiple">
          <label for="vote-multiple" style="cursor:pointer;font-size:13px;">☑️ Choix multiples</label>
        </div>
      </div>
      <div class="fg" style="display:flex;align-items:center;gap:8px;">
        <input type="number" id="vote-quorum" class="input" style="width:80px;" placeholder="0" min="0" max="100">
        <label style="font-size:13px;color:var(--text-2);">% de participation minimum requis (laisser vide = sans quorum)</label>
      </div>
    </div>
    <div class="mf">
      <button class="btn btn-secondary" onclick="document.getElementById('modal-vote').remove()">Annuler</button>
      <button class="btn btn-secondary" onclick="saveVote('brouillon')">💾 Brouillon</button>
      <button class="btn btn-primary" onclick="saveVote('ouvert')">▶ Publier</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function addVoteOption() {
  const list = $('vote-options-list');
  if (!list) return;
  const isDoodle = $('vote-type-val')?.value === 'doodle';
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;';
  div.innerHTML = isDoodle
    ? `<input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1;"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>`
    : `<input type="text" class="input vote-opt-input" placeholder="Nouvelle option…"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>`;
  list.appendChild(div);
}

function selectVoteType(k) {
  $('vote-type-val').value = k;
  Object.keys(VOTE_TYPES).forEach(key => {
    const el = $(`vtype-${key}`);
    if (!el) return;
    if (key === k) { el.style.border='2px solid var(--accent)'; el.style.background='var(--blue-light)'; }
    else { el.style.border='2px solid var(--border)'; el.style.background='var(--surface)'; }
  });

  const list = $('vote-options-list');
  const addBtn = $('vote-add-opt-btn');
  if (!list) return;

  if (k === 'officiel') {
    // Vote officiel → Pour/Contre/Abstention fixes
    list.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;"><span style="font-size:18px;">✅</span><input type="text" class="input vote-opt-input" value="Pour" style="background:var(--green-light);"></div>
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;"><span style="font-size:18px;">❌</span><input type="text" class="input vote-opt-input" value="Contre" style="background:var(--red-light);"></div>
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;"><span style="font-size:18px;">⚪</span><input type="text" class="input vote-opt-input" value="Abstention" style="background:var(--surface-2);"></div>`;
    if (addBtn) addBtn.style.display = 'none';
    // Active quorum par défaut
    const q = $('vote-quorum'); if (q && !q.value) q.value = 50;

  } else if (k === 'doodle') {
    // Disponibilités → sélecteur de dates
    list.innerHTML = `
      <div style="font-size:12px;color:var(--text-3);margin-bottom:8px;">Proposez des créneaux — les résidents choisiront leurs disponibilités</div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1;">
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <input type="datetime-local" class="input vote-opt-input doodle-date" style="flex:1;">
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>
      </div>`;
    if (addBtn) { addBtn.style.display=''; addBtn.textContent='+ Ajouter un créneau'; }
    // Choix multiples forcé pour les doodles
    const cm = $('vote-multiple'); if (cm) cm.checked = true;

  } else {
    // Sondage → options libres
    list.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:6px;"><input type="text" class="input vote-opt-input" placeholder="Option 1…"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button></div>
      <div style="display:flex;gap:6px;margin-bottom:6px;"><input type="text" class="input vote-opt-input" placeholder="Option 2…"><button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button></div>`;
    if (addBtn) { addBtn.style.display=''; addBtn.textContent='+ Ajouter une option'; }
  }
}

async function saveVote(statut) {
  const titre = $('vote-titre')?.value.trim();
  if (!titre) { toast('Titre requis', 'err'); return; }
  const voteType = $('vote-type-val')?.value || 'sondage';
  const optInputs = document.querySelectorAll('.vote-opt-input');
  const isDoodle = voteType === 'doodle';
  const options = [...optInputs].map((el,i) => {
    const val = el.value.trim();
    if (!val) return null;
    if (isDoodle) {
      const d = new Date(val);
      return { id:`opt-${i}`, label: d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}), date: val };
    }
    return { id:`opt-${i}`, label: val };
  }).filter(Boolean);
  if (options.length < 2) { toast('Minimum 2 options', 'err'); return; }
  const cloture = $('vote-cloture')?.value;
  const quorum = parseInt($('vote-quorum')?.value) || null;
  const payload = {
    titre, type: voteType, statut,
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
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  document.getElementById('modal-vote')?.remove();
  toast(statut === 'ouvert' ? 'Vote publié ✓' : 'Brouillon sauvegardé ✓', 'ok');
  if (statut === 'ouvert') {
    const { data: allUsers } = await sb.from('profiles').select('id, email').eq('actif', true);
    const notifs = (allUsers||[]).filter(u=>u.id!==user.id).map(u=>({
      destinataire_id: u.id,
      destinataire_email: u.email || '',
      sujet: `${voteType==='officiel'?'🗳️':'📊'} Nouveau ${voteType==='officiel'?'vote':'sondage'} : ${titre}`,
      corps: `Nouveau ${voteType==='officiel'?'vote':'sondage'} disponible : ${titre}`,
      lu: false
    }));
    if (notifs.length) { const {error:e} = await sb.from('notifications').insert(notifs); if(e) console.warn('[notif vote]',e.message); }
    // Email syndic — vote publié
    await sendEmailDirect('nouvelle_annonce', null, {
      titre: `${voteType==='officiel'?'🗳️ Vote officiel':'📊 Sondage'} : ${titre}`,
      type: 'important',
      contenu: `Un nouveau ${voteType==='officiel'?'vote':'sondage'} vient d'être publié sur CoproSync.`
    });
  }
  await loadVotes();
}

async function publierVote(id) {
  const v = _votesCache.find(x => x.id === id);
  await sb.from('votes').update({ statut:'ouvert' }).eq('id', id);
  toast('Vote publié ✓', 'ok');
  if (v) await publishFeedEvent('vote', `🗳️ Nouveau vote ouvert : "${v.titre}" — Participez depuis l'onglet Votes !`);
  await loadVotes();
}

async function cloturerVote(id) {
  if (!confirm('Clôturer ce vote ? Les résidents ne pourront plus voter.')) return;
  const v = _votesCache.find(x => x.id === id);
  await sb.from('votes').update({ statut:'clos' }).eq('id', id);
  toast('Vote clôturé', 'ok');
  // Email syndic avec résultats
  if (v) {
    const allRep = _allReponsesCache[id] || [];
    const total = allRep.length;
    const opts = Array.isArray(v.options) ? v.options : JSON.parse(v.options||'[]');
    const resultats = opts.map(opt => {
      const count = allRep.filter(r => {
        const chosen = Array.isArray(r.options_choisies) ? r.options_choisies : JSON.parse(r.options_choisies||'[]');
        return chosen.includes(opt.id);
      }).length;
      return `${opt.label} : ${count} vote${count>1?'s':''} (${total?Math.round(count/total*100):0}%)`;
    }).join(' | ');
    await sendEmailDirect('nouvelle_annonce', null, {
      titre: `⏹ Vote clôturé : ${v.titre}`,
      type: 'important',
      contenu: `Résultats (${total} participant${total>1?'s':''}) — ${resultats}`
    });
  }
  await loadVotes();
}

async function deleteVote(id) {
  if (!confirm('Supprimer ce vote et tous ses résultats ?')) return;
  await sb.from('votes').delete().eq('id', id);
  document.getElementById('modal-vote-detail')?.remove();
  toast('Vote supprimé', 'ok');
  await loadVotes();
}

async function exportVotePDF(voteId) {
  const v = _votesCache.find(x => x.id === voteId);
  if (!v) return;
  const { data: allRep } = await sb.from('votes_reponses').select('*, profiles(nom,prenom)').eq('vote_id', voteId);
  const total = (allRep||[]).length;
  const opts = Array.isArray(v.options) ? v.options : (typeof v.options === 'string' ? JSON.parse(v.options||'[]') : []);
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const quorumPct = Math.round(total/240*100);
  const quorumOk = v.quorum_requis ? quorumPct >= v.quorum_requis : true;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Résultats — ${v.titre}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    @page{size:A4;margin:18mm 16mm;}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1917;font-size:12px;line-height:1.5;}
    .header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:2px solid #1a1917;margin-bottom:20px;}
    .header-left .org{font-size:9.5px;color:#9b9890;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;}
    .header-left .doc-type{font-size:20px;font-weight:800;}
    h2{font-size:15px;font-weight:700;margin-bottom:8px;}
    .question{font-size:17px;font-weight:800;margin-bottom:6px;}
    .meta{font-size:11px;color:#9b9890;margin-bottom:20px;}
    .opt{margin-bottom:16px;}
    .opt-label{display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;}
    .opt-label span:last-child{font-weight:700;color:#2563eb;}
    .bar-wrap{height:12px;background:#f0ede8;border-radius:6px;overflow:hidden;}
    .bar{height:100%;background:#2563eb;border-radius:6px;}
    .quorum{margin-top:20px;padding:12px 16px;border-radius:8px;font-size:12px;}
    .quorum.ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;}
    .quorum.ko{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;}
    .footer{margin-top:32px;padding-top:10px;border-top:1px solid #e8e5df;display:flex;justify-content:space-between;font-size:9px;color:#9b9890;}
  </style></head><body>
  <div class="header">
    <div class="header-left">
      <div class="org">Résidence le Floréal · 13-19 Rue du Moucherotte, 38360 Sassenage</div>
      <div class="doc-type">${VOTE_TYPES[v.type]?.ico} Résultats ${v.type==='officiel'?'du vote':'du sondage'}</div>
    </div>
    <div style="text-align:right;font-size:9.5px;color:#9b9890;"><div>Exporté le ${today}</div><div>Par ${displayNameFromProfile(profile,user?.email)}</div></div>
  </div>
  <div class="question">${escHtml(v.titre)}</div>
  ${v.description?`<p style="font-size:13px;color:#6b6860;margin-bottom:10px;">${escHtml(v.description)}</p>`:''}
  <div class="meta">${total} participant${total>1?'s':''} · ${v.anonyme?'Anonyme':'Nominatif'} · ${v.cible==='tous'?'Tous les résidents':v.cible}</div>
  ${opts.map(opt=>{
    const count=(allRep||[]).filter(r=>JSON.parse(r.options_choisies||'[]').includes(opt.id)).length;
    const pct=total?Math.round(count/total*100):0;
    return`<div class="opt"><div class="opt-label"><span>${escHtml(opt.label)}</span><span>${count} vote${count>1?'s':''} · ${pct}%</span></div><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div></div>`;
  }).join('')}
  ${v.quorum_requis?`<div class="quorum ${quorumOk?'ok':'ko'}">${quorumOk?'✅':'❌'} Quorum ${quorumOk?'atteint':'non atteint'} — ${quorumPct}% de participation (requis: ${v.quorum_requis}%)</div>`:''}
  <div class="footer"><span>CoproSync · Résidence le Floréal</span><span>Document officiel — usage interne</span><span>${today}</span></div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════
// MESSAGERIE v2 + FEED COMMUNAUTAIRE
// ══════════════════════════════════════════
