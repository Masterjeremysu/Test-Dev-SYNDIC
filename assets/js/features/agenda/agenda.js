const EVENT_TYPES = {
  ag:         { label:'AG',         color:'#6366f1', dot:'violet' },
  reunion_cs: { label:'CS',         color:'#f59e0b', dot:'orange' },
  artisan:    { label:'Artisan',    color:'#10b981', dot:'green'  },
  controle:   { label:'Contrôle',  color:'#ef4444', dot:'red'    },
  autre:      { label:'Autre',      color:'#6b7280', dot:''       },
};

let _agendaDate = new Date();
let _agendaEvents = [];

async function renderAgenda() {
  $('page').innerHTML = `<div style="padding:24px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Agenda</h1><p>Réunions, passages artisans, contrôles…</p></div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div style="display:flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;">
          <button class="btn btn-ghost btn-sm" id="view-cal-btn" onclick="setAgendaView('cal')" style="border-radius:0;border:none;background:var(--accent);color:#fff;">📅 Calendrier</button>
          <button class="btn btn-ghost btn-sm" id="view-list-btn" onclick="setAgendaView('list')" style="border-radius:0;border:none;">☰ Liste</button>
        </div>
        ${isManager() ? `<button class="btn btn-primary" onclick="openNewEvent()">+ Ajouter</button>` : ''}
      </div>
    </div>
    <div id="agenda-cal-view">
      <div class="agenda-layout">
        <div class="agenda-calendar">
          <div class="card" style="padding:20px;">
            <div class="cal-header">
              <button class="btn btn-ghost btn-sm" onclick="agendaMonth(-1)">‹</button>
              <div class="cal-title" id="cal-title"></div>
              <button class="btn btn-ghost btn-sm" onclick="agendaMonth(1)">›</button>
            </div>
            <div class="cal-grid" id="cal-grid"></div>
          </div>
        </div>
        <div class="agenda-sidebar-panel">
          <div class="card" style="padding:16px;">
            <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:12px;" id="agenda-side-title">Prochains événements</div>
            <div id="agenda-side-list"><div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">Chargement…</div></div>
          </div>
        </div>
      </div>
    </div>
    <div id="agenda-list-view" style="display:none;">
      <div id="agenda-full-list"></div>
    </div>
  </div>`;
  await loadEvents();
  renderCal();
}

let _agendaView = 'cal';
function setAgendaView(v) {
  _agendaView = v;
  $('agenda-cal-view').style.display = v === 'cal' ? '' : 'none';
  $('agenda-list-view').style.display = v === 'list' ? '' : 'none';
  $('view-cal-btn').style.background = v === 'cal' ? 'var(--accent)' : '';
  $('view-cal-btn').style.color = v === 'cal' ? '#fff' : '';
  $('view-list-btn').style.background = v === 'list' ? 'var(--accent)' : '';
  $('view-list-btn').style.color = v === 'list' ? '#fff' : '';
  if (v === 'list') renderAgendaList();
}

function renderAgendaList() {
  const el = $('agenda-full-list');
  if (!el) return;
  const now = new Date();
  const upcoming = _agendaEvents.filter(e => new Date(e.date_debut) >= now);
  const past = _agendaEvents.filter(e => new Date(e.date_debut) < now).reverse();
  if (!upcoming.length && !past.length) {
    el.innerHTML = emptyState('📅', 'Agenda vide', 'Aucun événement programmé. Les AG, réunions et interventions apparaîtront ici.');
    return;
  }
  let html = '';
  if (upcoming.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">À venir</div>`;
    html += upcoming.map(e => renderEventItem(e)).join('');
  }
  if (past.length) {
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;">Passés</div>`;
    html += `<div style="opacity:.6;">${past.slice(0,10).map(e => renderEventItem(e)).join('')}</div>`;
  }
  el.innerHTML = html;
}

// ── MODE SOMBRE ──
