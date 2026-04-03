function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('coprosync-theme', newTheme);
  const ico = $('theme-ico');
  if (ico) ico.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem('coprosync-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  const ico = $('theme-ico');
  if (ico) ico.textContent = theme === 'dark' ? '☀️' : '🌙';
}

async function loadEvents() {
  const { data } = await sb.from('evenements')
    .select('*, profiles(nom,prenom)')
    .order('date_debut', { ascending: true });
  _agendaEvents = data || [];
  renderCal();
  renderUpcoming();
}

function agendaMonth(delta) {
  _agendaDate = new Date(_agendaDate.getFullYear(), _agendaDate.getMonth() + delta, 1);
  renderCal();
  renderUpcoming();
}

function renderCal() {
  const titleEl = $('cal-title');
  const gridEl = $('cal-grid');
  if (!titleEl || !gridEl) return;
  const y = _agendaDate.getFullYear();
  const m = _agendaDate.getMonth();
  titleEl.textContent = new Date(y, m, 1).toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

  const today = new Date();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  // Lundi = 0
  let startDow = (firstDay.getDay() + 6) % 7;

  const days = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  let html = days.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  // Jours vides avant
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day other-month"></div>';

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evts = _agendaEvents.filter(e => e.date_debut?.startsWith(dateStr));
    const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d;
    const dots = evts.slice(0,3).map(e => {
      const t = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
      return `<span class="${t.dot}"></span>`;
    }).join('');
    html += `<div class="cal-day${isToday?' today':''}${evts.length?' has-event':''}" onclick="showDayEvents('${dateStr}')">
      <span>${d}</span>
      ${evts.length ? `<div class="cal-dots">${dots}</div>` : ''}
    </div>`;
  }
  gridEl.innerHTML = html;
}

function showDayEvents(dateStr) {
  const evts = _agendaEvents.filter(e => e.date_debut?.startsWith(dateStr));
  const titleEl = $('agenda-side-title');
  const listEl = $('agenda-side-list');
  if (!titleEl || !listEl) return;
  const d = new Date(dateStr + 'T00:00:00');
  titleEl.textContent = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  if (!evts.length) { listEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-3);font-size:13px;">Aucun événement ce jour</div>'; return; }
  listEl.innerHTML = evts.map(e => renderEventItem(e)).join('');
}

function renderUpcoming() {
  const listEl = $('agenda-side-list');
  const titleEl = $('agenda-side-title');
  if (!listEl) return;
  if (titleEl) titleEl.textContent = 'Prochains événements';
  const now = new Date();
  const upcoming = _agendaEvents.filter(e => new Date(e.date_debut) >= now).slice(0, 8);
  if (!upcoming.length) { listEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-3);">Aucun événement à venir</div>'; return; }
  listEl.innerHTML = upcoming.map(e => renderEventItem(e)).join('');
}

function renderEventItem(e) {
  const t = EVENT_TYPES[e.type] || EVENT_TYPES.autre;
  const d = new Date(e.date_debut);
  const dateStr = d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  return `<div class="event-item" onclick="${isManager()?`openEditEvent('${e.id}')`:''}" >
    <div class="event-color-bar" style="background:${t.color};"></div>
    <div class="event-info">
      <div class="event-titre">${escHtml(e.titre)}</div>
      <div class="event-time">📅 ${dateStr} à ${timeStr}</div>
      ${e.lieu ? `<div class="event-lieu">📍 ${escHtml(e.lieu)}</div>` : ''}
    </div>
    <span class="event-type-badge" style="background:${t.color}22;color:${t.color};">${t.label}</span>
  </div>`;
}

function openNewEvent(existing) {
  const isEdit = !!existing;
  const defDate = existing?.date_debut ? existing.date_debut.slice(0,16) : new Date().toISOString().slice(0,16);
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-event';
  overlay.innerHTML = `<div class="modal" style="max-width:520px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}</span>
      <button class="mclose" onclick="document.getElementById('modal-event').remove()">×</button>
    </div>
    <div class="mb">
      <div class="fg"><label class="label">Titre *</label>
        <input type="text" id="evt-titre" class="input" placeholder="Ex: Assemblée Générale 2026" value="${existing?.titre||''}">
      </div>
      <div class="fg-row">
        <div class="fg"><label class="label">Type</label>
          <select id="evt-type" class="select" style="width:100%;">
            ${Object.entries(EVENT_TYPES).map(([k,v]) => `<option value="${k}" ${existing?.type===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><label class="label">Concerne</label>
          <select id="evt-concerne" class="select" style="width:100%;">
            <option value="tous" ${existing?.concerne==='tous'?'selected':''}>Tous</option>
            <option value="cs" ${existing?.concerne==='cs'?'selected':''}>Conseil Syndical</option>
            ${COPRO.tours.map(t => `<option value="${t}" ${existing?.concerne===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="fg-row">
        <div class="fg"><label class="label">Date & heure *</label>
          <input type="datetime-local" id="evt-debut" class="input" value="${defDate}">
        </div>
        <div class="fg"><label class="label">Fin (optionnel)</label>
          <input type="datetime-local" id="evt-fin" class="input" value="${existing?.date_fin?.slice(0,16)||''}">
        </div>
      </div>
      <div class="fg"><label class="label">Lieu</label>
        <input type="text" id="evt-lieu" class="input" placeholder="Ex: Salle de réunion Tour 13" value="${existing?.lieu||''}">
      </div>
      <div class="fg"><label class="label">Description</label>
        <textarea id="evt-desc" class="textarea" rows="3" placeholder="Détails…">${existing?.description||''}</textarea>
      </div>
    </div>
    <div class="mf">
      <button class="btn btn-secondary" onclick="document.getElementById('modal-event').remove()">Annuler</button>
      ${isEdit ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);margin-right:auto;" onclick="deleteEvent('${existing.id}')">🗑 Supprimer</button>` : ''}
      <button class="btn btn-primary" onclick="saveEvent('${existing?.id||''}')">
        ${isEdit ? 'Enregistrer' : 'Ajouter'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

async function openEditEvent(id) {
  const { data } = await sb.from('evenements').select('*').eq('id', id).single();
  if (data) openNewEvent(data);
}

async function saveEvent(id) {
  const titre = $('evt-titre')?.value.trim();
  const debut = $('evt-debut')?.value;
  if (!titre || !debut) { toast('Titre et date requis', 'err'); return; }
  const payload = {
    titre,
    type: $('evt-type')?.value || 'autre',
    concerne: $('evt-concerne')?.value || 'tous',
    date_debut: new Date(debut).toISOString(),
    date_fin: $('evt-fin')?.value ? new Date($('evt-fin').value).toISOString() : null,
    lieu: $('evt-lieu')?.value.trim() || null,
    description: $('evt-desc')?.value.trim() || null,
    auteur_id: user.id,
  };
  let error, data;
  if (id) {
    ({ error } = await sb.from('evenements').update(payload).eq('id', id));
  } else {
    ({ error, data } = await sb.from('evenements').insert(payload).select().single());
  }
  if (error) { toast('Erreur sauvegarde', 'err'); return; }
  document.getElementById('modal-event')?.remove();
  toast(id ? 'Événement modifié ✓' : 'Événement ajouté ✓', 'ok');
  // 🔔 Notif pour les événements AG ou contrôle
  if (!id && data && ['ag','controle'].includes(payload.type)) {
    const { data: allUsers } = await sb.from('profiles').select('id').eq('actif', true);
    const t = EVENT_TYPES[payload.type];
    const dateStr = new Date(payload.date_debut).toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
    const notifs = (allUsers||[]).filter(u => u.id !== user.id).map(u => ({
      destinataire_id: u.id,
      sujet: `📅 ${t.label} : ${titre} — ${dateStr}${payload.lieu ? ' à '+payload.lieu : ''}`,
      corps: payload.description || '',
      type: 'statut_change', reference_id: data.id, lu: false
    }));
    if (notifs.length) await sb.from('notifications').insert(notifs);
    await pushNotif('📅 ' + t.label, `${titre} — ${dateStr}`, 'statut_change', null);
    // Email à tous
    const { data: allEmails } = await sb.from('profiles').select('email').eq('actif', true);
    const emails = (allEmails||[]).map(u => u.email).filter(Boolean);
    if (emails.length) await sendEmailDirect('rappel_evenement', emails, {
      titre, date_str: dateStr, lieu: payload.lieu, description: payload.description
    });
  }
  await loadEvents();
}

async function deleteEvent(id) {
  if (!confirm('Supprimer cet événement ?')) return;
  await sb.from('evenements').delete().eq('id', id);
  document.getElementById('modal-event')?.remove();
  toast('Événement supprimé', 'ok');
  await loadEvents();
}

// ── RECHERCHE GLOBALE ──
