// ════════════════════════════════════════════════════════════════
//  THÈME & AGENDA FEATURE
//  (Fichier regroupant l'UI du thème et la logique calendrier)
// ════════════════════════════════════════════════════════════════

// ── 1. GESTION DU THÈME ──────────────────────────────────────────────────────

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  
  // Applique le thème
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('coprosync-theme', newTheme);
  
  // Animation de l'icône
  const ico = $('theme-ico');
  if (ico) {
    ico.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    ico.style.transform = 'rotate(180deg) scale(0.5)';
    ico.style.opacity = '0';
    setTimeout(() => {
      ico.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      ico.style.transform = 'rotate(0deg) scale(1)';
      ico.style.opacity = '1';
    }, 150);
  }

  // Immersion Mobile : Met à jour la couleur de la barre de statut système
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#111827' : '#ffffff');
  }
}

function initTheme() {
  const saved = localStorage.getItem('coprosync-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = saved || (systemPrefersDark.matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', theme);
  const ico = $('theme-ico');
  if (ico) ico.textContent = theme === 'dark' ? '☀️' : '🌙';
  
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
  }

  // Écouteur en temps réel des préférences du système (si non forcé par l'utilisateur)
  systemPrefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('coprosync-theme')) {
      const newSysTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newSysTheme);
      if (ico) ico.textContent = newSysTheme === 'dark' ? '☀️' : '🌙';
      if (metaThemeColor) metaThemeColor.setAttribute('content', newSysTheme === 'dark' ? '#111827' : '#ffffff');
    }
  });
}


// ── 2. AGENDA & CALENDRIER ───────────────────────────────────────────────────

async function loadEvents() {
  try {
    const { data, error } = await sb.from('evenements')
      .select('*, profiles(nom,prenom)')
      .order('date_debut', { ascending: true });
      
    if (error) throw error;
    
    _agendaEvents = data || [];
    renderCal();
    renderUpcoming();
  } catch (err) {
    console.error('[Agenda]', err);
    toast('Impossible de charger l\'agenda', 'err');
  }
}

function agendaMonth(delta) {
  _agendaDate = new Date(_agendaDate.getFullYear(), _agendaDate.getMonth() + delta, 1);
  
  // Effet de transition fluide sur la grille
  const gridEl = $('cal-grid');
  if (gridEl) {
    gridEl.style.opacity = '0';
    gridEl.style.transform = delta > 0 ? 'translateX(10px)' : 'translateX(-10px)';
    setTimeout(() => {
      renderCal();
      gridEl.style.transition = 'all 0.2s ease-out';
      gridEl.style.opacity = '1';
      gridEl.style.transform = 'translateX(0)';
      setTimeout(() => { gridEl.style.transition = ''; }, 200);
    }, 150);
  } else {
    renderCal();
  }
  
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
  let html = days.map(d => `<div class="cal-day-name" style="font-weight:700; color:var(--text-3); font-size:11px; padding-bottom:8px;">${d}</div>`).join('');

  // Jours vides du mois précédent
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day other-month" style="opacity:0.3;"></div>';

  const defaultType = { color:'#6b7280', label:'Autre', dot:'gray' };

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evts = _agendaEvents.filter(e => e.date_debut?.startsWith(dateStr));
    const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d;
    
    const dots = evts.slice(0,3).map(e => {
      const t = (typeof EVENT_TYPES !== 'undefined' ? EVENT_TYPES[e.type] : null) || defaultType;
      return `<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${t.color}; margin:0 1px;"></span>`;
    }).join('');
    
    const bgClass = isToday ? 'background:var(--primary); color:#fff; font-weight:bold; box-shadow:0 4px 10px rgba(59,130,246,0.3);' : '';
    const hoverFx = isToday ? '' : 'onmouseover="this.style.background=\'var(--bg-2)\'" onmouseout="this.style.background=\'transparent\'"';
    
    html += `
    <div class="cal-day" style="padding:8px 4px; border-radius:8px; cursor:pointer; text-align:center; transition:background 0.2s; ${bgClass}" ${hoverFx} onclick="showDayEvents('${dateStr}')">
      <span style="font-size:14px;">${d}</span>
      ${evts.length ? `<div style="margin-top:4px; height:6px;">${dots}</div>` : '<div style="margin-top:4px; height:6px;"></div>'}
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
  
  if (!evts.length) { 
    listEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3);font-size:13px;background:var(--bg-2);border-radius:12px;">Aucun événement ce jour</div>'; 
    return; 
  }
  
  listEl.style.animation = 'fade-in 0.2s ease';
  listEl.innerHTML = evts.map(e => renderEventItem(e)).join('');
}

function renderUpcoming() {
  const listEl = $('agenda-side-list');
  const titleEl = $('agenda-side-title');
  if (!listEl) return;
  if (titleEl) titleEl.textContent = 'Prochains événements';
  
  const now = new Date();
  const upcoming = _agendaEvents.filter(e => new Date(e.date_debut) >= now).slice(0, 8);
  
  if (!upcoming.length) { 
    listEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3);background:var(--bg-2);border-radius:12px;">Aucun événement programmé</div>'; 
    return; 
  }
  listEl.innerHTML = upcoming.map(e => renderEventItem(e, true)).join('');
}

function renderEventItem(e, showRelativeDay = false) {
  const t = (typeof EVENT_TYPES !== 'undefined' ? EVENT_TYPES[e.type] : null) || { color:'#6b7280', label:'Autre' };
  const d = new Date(e.date_debut);
  const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  
  let dateDisplay = d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  
  // Amélioration : Affichage du temps relatif
  if (showRelativeDay) {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) dateDisplay = "Aujourd'hui";
    else if (d.toDateString() === tomorrow.toDateString()) dateDisplay = "Demain";
  }

  return `
  <div style="background:var(--bg-1); border:1px solid var(--border); border-left:4px solid ${t.color}; border-radius:10px; padding:12px; margin-bottom:10px; cursor:${isManager()?'pointer':'default'}; transition:transform 0.2s;" 
    ${isManager() ? `onclick="openEditEvent('${e.id}')" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='none'"` : ''}>
    
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
      <div style="font-weight:700; font-size:14px; color:var(--text-1); line-height:1.3;">${escHtml(e.titre)}</div>
      <span style="background:${t.color}15; color:${t.color}; font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px; text-transform:uppercase; letter-spacing:0.05em; margin-left:8px; flex-shrink:0;">${t.label}</span>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:12px; color:var(--text-2);">
      <span style="display:flex; align-items:center; gap:4px;">📅 <strong style="color:var(--text-1);">${dateDisplay}</strong> à ${timeStr}</span>
      ${e.lieu ? `<span style="display:flex; align-items:center; gap:4px;">📍 ${escHtml(e.lieu)}</span>` : ''}
    </div>
  </div>`;
}

// ── 3. FORMULAIRES MODAL ─────────────────────────────────────────────────────

function openNewEvent(existing) {
  const isEdit = !!existing;
  const defDate = existing?.date_debut ? existing.date_debut.slice(0,16) : new Date().toISOString().slice(0,16);
  const defFin = existing?.date_fin ? existing.date_fin.slice(0,16) : '';
  
  const evTypes = typeof EVENT_TYPES !== 'undefined' ? EVENT_TYPES : { autre: {label:'Autre'} };
  const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-event';
  overlay.innerHTML = `
  <div class="modal" style="max-width:520px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}</span>
      <button class="mclose" onclick="document.getElementById('modal-event').remove()">×</button>
    </div>
    <div class="mb">
      <div class="fg">
        <label class="label">Titre *</label>
        <input type="text" id="evt-titre" class="input" placeholder="Ex: Assemblée Générale 2026" value="${escHtml(existing?.titre||'')}">
      </div>
      
      <div class="fg-row">
        <div class="fg">
          <label class="label">Type</label>
          <select id="evt-type" class="select" style="width:100%;">
            ${Object.entries(evTypes).map(([k,v]) => `<option value="${k}" ${existing?.type===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="fg">
          <label class="label">Public concerné</label>
          <select id="evt-concerne" class="select" style="width:100%;">
            <option value="tous" ${existing?.concerne==='tous'?'selected':''}>Tous les résidents</option>
            <option value="cs" ${existing?.concerne==='cs'?'selected':''}>Conseil Syndical</option>
            ${listeTours.map(t => `<option value="${t}" ${existing?.concerne===t?'selected':''}>Bâtiment ${t}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div class="fg-row">
        <div class="fg">
          <label class="label">Date & Heure de début *</label>
          <input type="datetime-local" id="evt-debut" class="input" value="${defDate}">
        </div>
        <div class="fg">
          <label class="label">Fin (Optionnel)</label>
          <input type="datetime-local" id="evt-fin" class="input" value="${defFin}">
        </div>
      </div>
      
      <div class="fg">
        <label class="label">Lieu</label>
        <input type="text" id="evt-lieu" class="input" placeholder="Ex: Hall d'entrée, Salle polyvalente..." value="${escHtml(existing?.lieu||'')}">
      </div>
      
      <div class="fg" style="margin-bottom:0;">
        <label class="label">Description / Détails</label>
        <textarea id="evt-desc" class="textarea" rows="3" placeholder="Ordre du jour, informations importantes...">${escHtml(existing?.description||'')}</textarea>
      </div>
    </div>
    <div class="mf" style="justify-content: ${isEdit ? 'space-between' : 'flex-end'};">
      ${isEdit ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteEvent('${existing.id}')">🗑 Supprimer</button>` : ''}
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-event').remove()">Annuler</button>
        <button id="btn-save-event" class="btn btn-primary" onclick="saveEvent('${existing?.id||''}')">
          ${isEdit ? 'Enregistrer' : 'Ajouter au calendrier'}
        </button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => $('evt-titre')?.focus(), 50);
}

async function openEditEvent(id) {
  try {
    const { data, error } = await sb.from('evenements').select('*').eq('id', id).single();
    if (error) throw error;
    if (data) openNewEvent(data);
  } catch(e) {
    toast('Impossible d\'ouvrir l\'événement.', 'err');
  }
}

async function saveEvent(id) {
  const titre = $('evt-titre')?.value.trim();
  const debut = $('evt-debut')?.value;
  if (!titre || !debut) { toast('Le titre et la date sont obligatoires', 'err'); return; }

  const btn = $('btn-save-event');
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  try {
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
    
    if (error) throw error;

    document.getElementById('modal-event')?.remove();
    toast(id ? 'Événement modifié ✓' : 'Événement ajouté ✓', 'ok');

    // 🔔 Notifications pour les événements critiques (AG ou Contrôle) UNIQUEMENT à la création
    if (!id && data && ['ag','controle'].includes(payload.type)) {
      const { data: allUsers } = await sb.from('profiles').select('id, email').eq('actif', true);
      const evTypes = typeof EVENT_TYPES !== 'undefined' ? EVENT_TYPES : {};
      const t = evTypes[payload.type] || { label: 'Événement important' };
      const dateStr = new Date(payload.date_debut).toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
      
      const notifs = (allUsers||[]).filter(u => u.id !== user.id).map(u => ({
        destinataire_id: u.id,
        sujet: `📅 ${t.label} : ${titre} — ${dateStr}${payload.lieu ? ' à '+payload.lieu : ''}`,
        corps: payload.description || '',
        type: 'statut_change', reference_id: data.id, lu: false
      }));
      
      if (notifs.length) await sb.from('notifications').insert(notifs);
      if (typeof pushNotif === 'function') await pushNotif('📅 ' + t.label, `${titre} — ${dateStr}`, 'statut_change', null);
      
      // Envoi Email silencieux
      const emails = (allUsers||[]).map(u => u.email).filter(Boolean);
      if (emails.length && typeof sendEmailDirect === 'function') {
        sendEmailDirect('rappel_evenement', emails, {
          titre, date_str: dateStr, lieu: payload.lieu, description: payload.description
        }).catch(e => console.warn('Erreur envoi email AG:', e));
      }
    }
    
    await loadEvents();
    
  } catch (err) {
    console.error(err);
    toast('Erreur lors de la sauvegarde : ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = id ? 'Enregistrer' : 'Ajouter'; }
  }
}

async function deleteEvent(id) {
  if (!confirm('Voulez-vous vraiment annuler et supprimer cet événement du calendrier ?')) return;
  try {
    const { error } = await sb.from('evenements').delete().eq('id', id);
    if (error) throw error;
    
    document.getElementById('modal-event')?.remove();
    toast('Événement supprimé', 'ok');
    await loadEvents();
  } catch(e) {
    toast('Impossible de supprimer l\'événement', 'err');
  }
}