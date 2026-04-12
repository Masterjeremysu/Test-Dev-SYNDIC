// ════════════════════════════════════════════════════════════════
//  AGENDA FEATURE
//  assets/js/features/agenda/agenda.js
// ════════════════════════════════════════════════════════════════

const EVENT_TYPES = {
  ag:         { label:'AG',         color:'#6366f1', dot:'violet' },
  reunion_cs: { label:'CS',         color:'#f59e0b', dot:'orange' },
  artisan:    { label:'Artisan',    color:'#10b981', dot:'green'  },
  controle:   { label:'Contrôle',   color:'#ef4444', dot:'red'    },
  autre:      { label:'Autre',      color:'#6b7280', dot:'gray'   },
};

let _agendaDate = new Date();
let _agendaEvents = [];
let _agendaView = 'cal';

// ── Chargement des données ──
async function loadEvents() {
  try {
    // Vérification RLS automatique par Supabase, ajout d'une sécurité réseau
    const { data, error } = await sb.from('evenements').select('*').order('date_debut', { ascending: true });
    if (error) { 
      console.error('Erreur chargement agenda:', error.message); 
      return; 
    }
    _agendaEvents = data || [];
  } catch (e) {
    console.error('Exception chargement agenda:', e);
  }
}

// ── Rendu de la page principale ──
async function renderAgenda() {
  const page = $('page');
  if (!page) return;

  // On injecte la structure de base
  page.innerHTML = `
  <div style="padding:24px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text-1);margin:0;">Agenda</h1>
        <p style="color:var(--text-2);margin:4px 0 0;font-size:14px;">Réunions, passages artisans, contrôles…</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div style="display:flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;">
          <button class="btn btn-ghost btn-sm" id="view-cal-btn" onclick="setAgendaView('cal')" style="border-radius:0;border:none;background:var(--accent);color:#fff;">📅 Calendrier</button>
          <button class="btn btn-ghost btn-sm" id="view-list-btn" onclick="setAgendaView('list')" style="border-radius:0;border:none;">☰ Liste</button>
        </div>
        ${(typeof canManageAgenda === 'function' && canManageAgenda()) ? `<button class="btn btn-primary" onclick="openNewEvent()">+ Ajouter</button>` : ''}
      </div>
    </div>

    <div id="agenda-cal-view">
      <div class="agenda-layout" style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;">
        <div class="agenda-calendar">
          <div class="card" style="padding:20px;">
            <div class="cal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <button class="btn btn-secondary btn-sm" onclick="agendaMonth(-1)">‹ Mois préc.</button>
              <div class="cal-title" id="cal-title" style="font-weight:700;font-size:16px;text-transform:capitalize;"></div>
              <button class="btn btn-secondary btn-sm" onclick="agendaMonth(1)">Mois suiv. ›</button>
            </div>
            <div class="cal-grid" id="cal-grid"></div>
          </div>
        </div>
        <div class="agenda-sidebar-panel">
          <div class="card" style="padding:16px;">
            <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:12px;color:var(--text-1);" id="agenda-side-title">Prochains événements</div>
            <div id="agenda-side-list">
              <div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">Chargement…</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="agenda-list-view" style="display:none;max-width:800px;margin:0 auto;">
      <div id="agenda-full-list"></div>
    </div>
  </div>`;

  await loadEvents();
  
  // Prise en compte du responsive sur petits écrans
  if (window.innerWidth <= 768) {
    const layout = document.querySelector('.agenda-layout');
    if (layout) layout.style.gridTemplateColumns = '1fr';
  }

  renderCal();
}

// ── Gestion de la vue (Calendrier / Liste) ──
function setAgendaView(v) {
  _agendaView = v;
  const calView = $('agenda-cal-view');
  const listView = $('agenda-list-view');
  
  if (calView) calView.style.display = v === 'cal' ? '' : 'none';
  if (listView) listView.style.display = v === 'list' ? '' : 'none';
  
  const calBtn = $('view-cal-btn');
  const listBtn = $('view-list-btn');

  if (calBtn) {
    calBtn.style.background = v === 'cal' ? 'var(--accent)' : '';
    calBtn.style.color = v === 'cal' ? '#fff' : '';
  }
  if (listBtn) {
    listBtn.style.background = v === 'list' ? 'var(--accent)' : '';
    listBtn.style.color = v === 'list' ? '#fff' : '';
  }

  if (v === 'list') renderAgendaList();
  else renderCal();
}

function agendaMonth(dir) {
  _agendaDate.setMonth(_agendaDate.getMonth() + dir);
  renderCal();
}

// ── Logique du Calendrier ──
function renderCal() {
  const grid = $('cal-grid');
  const title = $('cal-title');
  if (!grid || !title) return;

  const year = _agendaDate.getFullYear();
  const month = _agendaDate.getMonth();
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  title.textContent = `${monthNames[month]} ${year}`;

  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Ajustement pour Lundi = début de semaine
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-weight:600;font-size:12px;color:var(--text-3);margin-bottom:8px;">
                <div>Lu</div><div>Ma</div><div>Me</div><div>Je</div><div>Ve</div><div>Sa</div><div>Di</div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;

  // Cases vides (mois précédent)
  for (let i = 0; i < firstDay; i++) {
    html += `<div style="padding:10px;border-radius:var(--r-sm);background:transparent;"></div>`;
  }

  const today = new Date();
  
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

    // Récupérer les événements du jour
    const dayEvents = _agendaEvents.filter(e => e.date_debut && e.date_debut.startsWith(currentDateStr));
    
    let dotsHtml = '';
    if (dayEvents.length > 0) {
      dotsHtml = `<div style="display:flex;justify-content:center;gap:2px;margin-top:4px;">` + 
                 dayEvents.slice(0,3).map(e => {
                   const t = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
                   return `<span style="display:block;width:6px;height:6px;border-radius:50%;background:${t.color};"></span>`;
                 }).join('') + 
                 `</div>`;
    }

    const bgClass = isToday ? 'background:var(--accent);color:#fff;' : 'background:var(--bg-2);cursor:pointer;';
    const borderClass = isToday ? '' : 'border:1px solid var(--border);';
    const hoverClass = isToday ? '' : 'onmouseover="this.style.filter=\'brightness(1.1)\'" onmouseout="this.style.filter=\'none\'"';

    html += `<div style="padding:10px 4px;border-radius:var(--r-sm);text-align:center;${bgClass}${borderClass}" ${hoverClass} onclick="showEventsForDate('${currentDateStr}')">
               <span style="font-size:14px;font-weight:500;">${d}</span>
               ${dotsHtml}
             </div>`;
  }
  
  html += `</div>`;
  grid.innerHTML = html;

  // Afficher les prochains événements dans la barre latérale par défaut
  showEventsForDate(null);
}

// ── Panneau latéral et Liste des événements ──
function showEventsForDate(dateStr) {
  const list = $('agenda-side-list');
  const title = $('agenda-side-title');
  if (!list || !title) return;

  let filtered = [];
  if (dateStr) {
    const parts = dateStr.split('-');
    title.textContent = `Événements du ${parts[2]}/${parts[1]}/${parts[0]}`;
    filtered = _agendaEvents.filter(e => e.date_debut && e.date_debut.startsWith(dateStr));
  } else {
    title.textContent = `Prochains événements`;
    const now = new Date();
    // Normaliser 'now' pour inclure les événements du jour même
    now.setHours(0,0,0,0); 
    filtered = _agendaEvents.filter(e => new Date(e.date_debut) >= now).slice(0, 5);
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;background:var(--bg-2);border-radius:8px;">Aucun événement.</div>`;
    return;
  }

  list.innerHTML = filtered.map(e => renderEventItem(e)).join('');
}

function renderAgendaList() {
  const el = $('agenda-full-list');
  if (!el) return;
  const now = new Date();
  now.setHours(0,0,0,0);

  const upcoming = _agendaEvents.filter(e => new Date(e.date_debut) >= now);
  const past = _agendaEvents.filter(e => new Date(e.date_debut) < now).reverse();

  if (!upcoming.length && !past.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-3);">
                      <div style="font-size:40px;margin-bottom:12px;">📅</div>
                      <div style="font-size:16px;font-weight:600;color:var(--text-1);">Agenda vide</div>
                      <div style="font-size:14px;margin-top:4px;">Aucun événement programmé pour le moment.</div>
                    </div>`;
    return;
  }

  let html = '';
  if (upcoming.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">À venir</div>`;
    html += upcoming.map(e => renderEventItem(e)).join('');
  }
  if (past.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin:24px 0 12px;">Passés</div>`;
    html += `<div style="opacity:.6;">${past.slice(0,10).map(e => renderEventItem(e)).join('')}</div>`;
  }
  el.innerHTML = html;
}

function renderEventItem(e) {
  const t = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
  
  // Formatage propre de la date et de l'heure
  const dateObj = new Date(e.date_debut);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  const timeStr = e.heure_debut ? e.heure_debut.substring(0, 5) : '';

  return `
    <div style="background:var(--bg-1);border:1px solid var(--border);border-left:4px solid ${t.color};border-radius:var(--r-sm);padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-weight:700;font-size:15px;color:var(--text-1);">${e.titre}</div>
        <div style="font-size:11px;padding:3px 8px;border-radius:12px;background:${t.color}15;color:${t.color};font-weight:700;white-space:nowrap;margin-left:8px;">${t.label}</div>
      </div>
      <div style="font-size:13px;color:var(--text-2);display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
        <span style="display:flex;align-items:center;gap:4px;">📅 <span style="text-transform:capitalize;">${dateStr}</span> ${timeStr ? 'à '+timeStr : ''}</span>
        ${e.lieu ? `<span style="display:flex;align-items:center;gap:4px;">📍 ${e.lieu}</span>` : ''}
      </div>
      ${e.description ? `<div style="font-size:13px;color:var(--text-3);margin-top:10px;line-height:1.5;background:var(--bg-2);padding:10px;border-radius:6px;">${e.description}</div>` : ''}
    </div>
  `;
}

// ── Modale dynamique pour la création d'événement (Syndic/Admin) ──
function openNewEvent() {
  let modal = $('m-agenda');
  
  // Si la modale n'existe pas encore dans le DOM, on la crée pour ne pas avoir à toucher index.html
  if (!modal) {
    const div = document.createElement('div');
    div.className = 'overlay';
    div.id = 'm-agenda';
    div.innerHTML = `
      <div class="modal">
        <div class="mh">
          <span class="mh-title">Nouvel événement</span>
          <button class="mclose" onclick="closeModal('m-agenda')">×</button>
        </div>
        <div class="mb">
          <div class="fg">
            <label class="label">Titre *</label>
            <input type="text" id="ev-titre" class="input" placeholder="Ex: Réunion préparatoire travaux">
          </div>
          <div class="fg-row">
            <div class="fg" style="margin:0;">
              <label class="label">Catégorie</label>
              <select id="ev-type" class="select">
                <option value="ag">Assemblée Générale</option>
                <option value="reunion_cs">Réunion Conseil Syndical</option>
                <option value="artisan">Intervention Artisan</option>
                <option value="controle">Contrôle / Vérification</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div class="fg" style="margin:0;">
              <label class="label">Lieu</label>
              <input type="text" id="ev-lieu" class="input" placeholder="Ex: Hall Tour 15">
            </div>
          </div>
          <div class="fg-row" style="margin-top:14px;">
            <div class="fg" style="margin:0;">
              <label class="label">Date de début *</label>
              <input type="date" id="ev-date" class="input">
            </div>
            <div class="fg" style="margin:0;">
              <label class="label">Heure <span style="font-weight:400;color:var(--text-3);">(Optionnel)</span></label>
              <input type="time" id="ev-heure" class="input">
            </div>
          </div>
          <div class="fg" style="margin-top:14px;">
            <label class="label">Détails de l'événement</label>
            <textarea id="ev-desc" class="textarea" placeholder="Ordre du jour, informations d'accès..."></textarea>
          </div>
        </div>
        <div class="mf">
          <button class="btn btn-secondary" onclick="closeModal('m-agenda')">Annuler</button>
          <button class="btn btn-primary" onclick="submitEvent()">Enregistrer</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  // Réinitialisation des champs du formulaire
  $('ev-titre').value = '';
  $('ev-lieu').value = '';
  $('ev-date').value = '';
  $('ev-heure').value = '';
  $('ev-desc').value = '';
  
  // Affichage de la modale
  $('m-agenda').style.display = 'flex';
}

// ── Sauvegarde de l'événement dans Supabase ──
async function submitEvent() {
  const titre = $('ev-titre').value.trim();
  const date = $('ev-date').value;
  
  if (!titre || !date) {
    if (typeof toast === 'function') toast('Le titre et la date sont obligatoires', 'err');
    return;
  }

  const evt = {
    titre: titre,
    type: $('ev-type').value,
    lieu: $('ev-lieu').value.trim() || null,
    date_debut: date,
    heure_debut: $('ev-heure').value || null,
    description: $('ev-desc').value.trim() || null,
    created_by: typeof user !== 'undefined' && user ? user.id : null
  };

  try {
    const { error } = await sb.from('evenements').insert([evt]);
    
    if (error) {
      console.error('Erreur Supabase insert agenda:', error.message);
      if (typeof toast === 'function') toast('Erreur lors de la création', 'err');
      return;
    }

    if (typeof toast === 'function') toast('Événement ajouté avec succès !', 'ok');
    
    if (typeof closeModal === 'function') closeModal('m-agenda');
    else $('m-agenda').style.display = 'none';

    // Rafraîchissement des données et de la vue
    await loadEvents();
    if (_agendaView === 'cal') renderCal();
    else renderAgendaList();

  } catch (e) {
    console.error('Crash submitEvent:', e);
  }
}
