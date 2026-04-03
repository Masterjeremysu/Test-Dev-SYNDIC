// ── NOTIFICATIONS REALTIME ──
let _notifCache = [];
let _realtimeChannel = null;

function checkNotifications() {
  const critiques = cache.tickets.filter(t => t.urgence === 'critique' && t.statut !== 'résolu').length;
  if (critiques > 0) updateNotifBadge(critiques);
  // Charge les notifs non lues depuis la DB
  loadNotifCache();
}

async function loadNotifCache() {
  const { data } = await sb.from('notifications')
    .select('*').eq('destinataire_id', user.id)
    .eq('lu', false).order('created_at', { ascending: false }).limit(20);
  _notifCache = data || [];
  refreshNotifBadge();
}

function refreshNotifBadge() {
  const dot = $('notif-dot');
  if (!dot) return;
  const count = _notifCache.length;
  if (count > 0) {
    dot.textContent = count > 9 ? '9+' : count;
    dot.classList.add('visible');
    // Badge orange si mention
    if (_notifCache.some(n => n.type === 'mention')) dot.classList.add('notif-mention');
    else dot.classList.remove('notif-mention');
  } else {
    dot.textContent = '';
    dot.classList.remove('visible', 'notif-mention');
  }
}

function updateNotifBadge(n) {
  const dot = $('notif-dot');
  if (!dot) return;
  dot.textContent = n > 9 ? '9+' : n;
  dot.classList.add('visible');
}

function startRealtime() {
  if (_realtimeChannel) return;
  _realtimeChannel = sb.channel('notifs-' + user.id)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `destinataire_id=eq.${user.id}`
    }, payload => {
      dbg('[realtime] nouvelle notif:', payload.new);
      _notifCache.unshift(payload.new);
      refreshNotifBadge();
      const isMention = payload.new.type === 'mention';
      toast((isMention ? '🏷 ' : '🔔 ') + (payload.new.sujet || 'Nouvelle notification'), isMention ? 'warn' : 'ok');
      pushNotif(
        isMention ? 'Mention' : 'CoproSync',
        payload.new.sujet || 'Nouvelle notification',
        payload.new.type,
        payload.new.reference_id
      );
    })
    .subscribe(status => dbg('[realtime] status:', status));

  // Realtime votes — barres en direct
  sb.channel('votes-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes_reponses' }, async payload => {
      const voteId = payload.new?.vote_id || payload.old?.vote_id;
      if (!voteId) return;
      // Recharge uniquement les réponses de ce vote
      const { data } = await sb.from('votes_reponses').select('*').eq('vote_id', voteId);
      _allReponsesCache[voteId] = data || [];
      // Refresh uniquement si on est sur la page votes
      if (currentPage === 'votes') {
        // Met à jour le badge
        const nonRepondus = _votesCache.filter(v => v.statut==='ouvert' && !_reponsesCache[v.id]).length;
        const el = $('nc-votes');
        if (el) { el.textContent = nonRepondus; el.style.display = nonRepondus>0?'':'none'; }
        // Re-render la liste (léger — pas de fetch réseau)
        renderVotesList();
      }
    })
    .subscribe();
}

function toggleNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  if (panel.style.display === 'none') {
    renderNotifPanel();
    panel.style.display = 'block';
    // Ferme si clic ailleurs
    setTimeout(() => document.addEventListener('click', closeNotifOnOutside, { once: true }), 10);
  } else {
    panel.style.display = 'none';
  }
}

function closeNotifOnOutside(e) {
  const wrap = $('notif-wrap');
  if (wrap && !wrap.contains(e.target)) $('notif-panel').style.display = 'none';
}

function renderNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  const all = _notifCache;
  const icons = { mention:'🏷', nouveau_ticket:'🚨', ticket_critique:'🔴', statut_change:'📋', commentaire:'💬' };

  panel.innerHTML = `
    <div class="notif-panel-header">
      <span>Notifications ${all.length > 0 ? `<span style="color:var(--red);font-size:12px;">(${all.length})</span>` : ''}</span>
      ${all.length > 0 ? `<button class="btn btn-ghost btn-sm" onclick="markAllRead()">Tout lire</button>` : ''}
    </div>
    ${all.length === 0
      ? '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">✓ Tout est lu</div>'
      : all.map(n => `
        <div class="notif-panel-item ${n.lu?'':'unread'} ${n.type==='mention'?'mention':''}"
             onclick="clickNotif('${n.id}','${n.reference_id||''}')">
          <div class="notif-ico">${icons[n.type] || '🔔'}</div>
          <div style="flex:1;min-width:0;">
            <div class="notif-txt" style="${!n.lu?'font-weight:600;':''}">${n.sujet}</div>
            <div class="notif-time">⏱ ${depuisJours(n.created_at)}</div>
          </div>
        </div>`).join('')}
    <div style="padding:10px 16px;border-top:1px solid var(--border);">
      <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="nav('notifications');$('notif-panel').style.display='none'">Voir tout l'historique →</button>
    </div>`;
}

async function clickNotif(notifId, ticketId) {
  await sb.from('notifications').update({ lu: true }).eq('id', notifId);
  _notifCache = _notifCache.filter(n => n.id !== notifId);
  refreshNotifBadge();
  $('notif-panel').style.display = 'none';
  if (ticketId) openDetail(ticketId);
}

async function markAllRead() {
  await sb.from('notifications').update({ lu: true }).eq('destinataire_id', user.id).eq('lu', false);
  _notifCache = [];
  refreshNotifBadge();
  renderNotifPanel();
}
