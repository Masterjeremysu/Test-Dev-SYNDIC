async function renderNotifications() {
  const { data } = await sb.from('notifications')
    .select('*').eq('destinataire_id', user.id).order('created_at', { ascending: false }).limit(50);

  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph"><h1>Notifications</h1></div>
    ${(data||[]).length === 0 ? emptyState('🔔', 'Aucune notification', 'Vous êtes à jour ! Les alertes importantes apparaîtront ici.') :
      `<div class="card"><div class="card-body">
        ${(data||[]).map(n => `
          <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);${!n.lu?'font-weight:500;':''}" onclick="markRead('${n.id}')">
            <div style="width:36px;height:36px;border-radius:50%;background:${n.type?.includes('critique')?'var(--red-light)':n.type?.includes('comment')?'var(--blue-light)':'var(--bg)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${n.type?.includes('critique')?'🔴':n.type?.includes('comment')?'💬':'📋'}
            </div>
            <div style="flex:1;">
              <div style="font-size:13px;">${n.sujet}</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${fmt(n.created_at)}</div>
            </div>
            ${!n.lu ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:5px;"></div>' : ''}
          </div>`).join('')}
      </div></div>`}
  </div>`;
}

async function markRead(id) {
  await sb.from('notifications').update({ lu: true }).eq('id', id);
  _notifCache = _notifCache.filter(n => n.id !== id);
  refreshNotifBadge();
}

// ── PROFILE ──
