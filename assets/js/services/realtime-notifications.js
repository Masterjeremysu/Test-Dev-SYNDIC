// ════════════════════════════════════════════════════════════════
//  NOTIFICATIONS REALTIME & PUSH
//  assets/js/services/realtime-notifications.js
// ════════════════════════════════════════════════════════════════

const NOTIF_ICONS = {
  nouveau_ticket:       '🚨',
  ticket_critique:      '🔴',
  statut_change:        '📋',
  commentaire:          '💬',
  mention:              '🏷️',
  message_prive:        '🔒',
  message_canal:        '💬',
  vote:                 '🗳️',
  annonce:              '📢',
  document:             '📄',
  feed_commentaire:     '💬',
  default:              '🔔',
};

const NOTIF_LABELS = {
  nouveau_ticket:   'Nouveau signalement',
  ticket_critique:  '⚡ Signalement critique',
  statut_change:    'Statut mis à jour',
  commentaire:      'Nouveau commentaire',
  mention:          'Vous avez été mentionné',
  message_prive:    'Message privé',
  message_canal:    'Nouveau message',
  vote:             'Vote disponible',
  annonce:          'Annonce',
  document:         'Nouveau document',
  feed_commentaire: 'Commentaire sur votre post',
};

let _notifCache = [];
let _realtimeChannel = null;

// ── CHARGEMENT & BADGE ──

function checkNotifications() {
  const critiques = (typeof cache !== 'undefined' && cache.tickets) 
    ? cache.tickets.filter(t => t.urgence === 'critique' && t.statut !== 'résolu' && t.statut !== 'clos').length 
    : 0;
  
  // Charge les notifs non lues depuis la DB
  loadNotifCache();
}

async function loadNotifCache() {
  try {
    const { data, error } = await sb.from('notifications')
      .select('*')
      .eq('destinataire_id', user.id)
      .eq('lu', false)
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (error) throw error;
    _notifCache = data || [];
    refreshNotifBadge();
  } catch (e) {
    console.warn('Erreur chargement notifications:', e);
  }
}

function refreshNotifBadge() {
  const dot = $('notif-dot');
  if (!dot) return;
  
  const count = _notifCache.length;
  if (count > 0) {
    dot.textContent = count > 9 ? '9+' : count;
    dot.classList.add('visible');
    
    // Badge pulse si notif importante (mention ou critique)
    const hasUrgent = _notifCache.some(n => n.type === 'mention' || n.type === 'ticket_critique' || n.type === 'message_prive');
    if (hasUrgent) dot.classList.add('notif-mention');
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

// ── ECOUTE TEMPS RÉEL (SUPABASE) ──

function startRealtime() {
  if (_realtimeChannel) return;
  
  // 1. Écoute des nouvelles notifications personnelles
  _realtimeChannel = sb.channel('notifs-' + user.id)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `destinataire_id=eq.${user.id}`
    }, payload => {
      const n = payload.new;
      if (!n) return;
      
      // Ajout au cache local et maj UI
      _notifCache.unshift(n);
      refreshNotifBadge();
      
      // Détermine l'urgence pour l'UI
      const isUrgent = ['mention', 'ticket_critique', 'message_prive'].includes(n.type);
      const icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
      const title = NOTIF_LABELS[n.type] || n.sujet || 'Nouvelle notification';
      
      // Toast UI (Si l'app est ouverte)
      if (typeof toast === 'function') {
        toast(`${icon} ${title}`, isUrgent ? 'warn' : 'ok');
      }
      
      // Push Mobile (Service Worker)
      if (typeof pushNotif === 'function') {
        pushNotif(
          isUrgent ? 'Important : CoproSync' : 'CoproSync',
          n.sujet || 'Nouvelle activité',
          n.type,
          n.reference_id
        );
      }
    })
    .subscribe();

  // 2. Écoute globale des votes (pour mettre à jour les jauges en direct)
  sb.channel('votes-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes_reponses' }, async payload => {
      const voteId = payload.new?.vote_id || payload.old?.vote_id;
      if (!voteId) return;
      
      // Recharge discrètement les résultats de ce vote en arrière-plan
      try {
        const { data } = await sb.from('votes_reponses').select('*').eq('vote_id', voteId);
        if (typeof _allReponsesCache !== 'undefined') {
          _allReponsesCache[voteId] = data || [];
        }
        
        // Rafraîchit l'UI si on est sur la bonne page
        if (typeof currentPage !== 'undefined' && currentPage === 'votes' && typeof renderVotesList === 'function') {
          renderVotesList();
        }
      } catch(e) {}
    })
    .subscribe();
}

// ── UI PANNEAU DÉROULANT ──

function toggleNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  
  if (panel.style.display === 'none' || !panel.style.display) {
    renderNotifPanel();
    panel.style.display = 'block';
    panel.style.animation = 'slide-down 0.2s ease forwards';
    
    // Ferme si clic à l'extérieur
    setTimeout(() => document.addEventListener('click', closeNotifOnOutside), 10);
  } else {
    closeNotifPanel();
  }
}

function closeNotifPanel() {
  const panel = $('notif-panel');
  if (panel) panel.style.display = 'none';
  document.removeEventListener('click', closeNotifOnOutside);
}

function closeNotifOnOutside(e) {
  const wrap = $('notif-wrap');
  const panel = $('notif-panel');
  // Si le clic n'est ni sur le bouton cloche, ni dans le panel
  if (wrap && !wrap.contains(e.target) && panel && !panel.contains(e.target)) {
    closeNotifPanel();
  }
}

function renderNotifPanel() {
  const panel = $('notif-panel');
  if (!panel) return;
  
  const all = _notifCache;

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border); background:var(--bg-2); border-radius:12px 12px 0 0;">
      <span style="font-weight:800; font-size:14px; color:var(--text-1);">Notifications ${all.length > 0 ? `<span style="color:var(--primary); font-size:12px; background:var(--primary-light); padding:2px 6px; border-radius:10px; margin-left:4px;">${all.length}</span>` : ''}</span>
      ${all.length > 0 ? `<button class="btn btn-ghost btn-sm" style="font-size:11px; color:var(--primary); padding:4px 8px;" onclick="markAllRead()">Tout marquer comme lu</button>` : ''}
    </div>
    
    <div style="max-height:350px; overflow-y:auto; overscroll-behavior:contain;">
      ${all.length === 0
        ? `<div style="padding:40px 20px; text-align:center; color:var(--text-3); font-size:13px;">
             <div style="font-size:32px; margin-bottom:8px; opacity:0.5;">🔕</div>
             Vous n'avez aucune notification non lue.
           </div>`
        : all.map(n => {
            const icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
            const timeStr = typeof depuisJours === 'function' ? depuisJours(n.created_at) : '';
            const isUrgent = ['mention', 'ticket_critique', 'message_prive'].includes(n.type);
            
            return `
            <div style="padding:12px 16px; border-bottom:1px solid var(--border); display:flex; gap:12px; align-items:flex-start; cursor:pointer; transition:background 0.2s; background:${isUrgent ? 'var(--amber-light)' : 'var(--bg-1)'}; position:relative;"
                 onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='${isUrgent ? 'var(--amber-light)' : 'var(--bg-1)'}'"
                 onclick="clickNotif('${n.id}', '${n.type}', '${n.reference_id || ''}')">
              
              <div style="position:absolute; left:6px; top:20px; width:6px; height:6px; border-radius:50%; background:var(--primary);"></div>
              
              <div style="font-size:20px; width:36px; height:36px; background:var(--surface); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 4px rgba(0,0,0,0.05); margin-left:4px;">
                ${icon}
              </div>
              
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; font-size:13px; color:var(--text-1); line-height:1.3; margin-bottom:4px;">${escHtml(n.sujet)}</div>
                ${n.corps ? `<div style="font-size:12px; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${escHtml(n.corps)}</div>` : ''}
                <div style="font-size:10px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:0.05em;">⏱ ${timeStr}</div>
              </div>
            </div>`;
          }).join('')}
    </div>
    
    <div style="padding:8px; border-top:1px solid var(--border); background:var(--bg-2); border-radius:0 0 12px 12px;">
      <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center; font-weight:600; color:var(--text-2);" onclick="closeNotifPanel(); if(typeof nav==='function') nav('notifications');">
        Voir tout l'historique →
      </button>
    </div>`;
}

// ── ACTIONS SUR CLIC ──

async function clickNotif(notifId, type, refId) {
  closeNotifPanel();
  
  // 1. Marquer comme lu visuellement TOUT DE SUITE (Optimistic UI)
  _notifCache = _notifCache.filter(n => n.id !== notifId);
  refreshNotifBadge();
  
  // 2. Requête serveur en arrière-plan (CORRIGÉ : .then() au lieu de .catch() direct)
  sb.from('notifications')
    .update({ lu: true })
    .eq('id', notifId)
    .then(({ error }) => {
      if (error) console.warn('Erreur update notif:', error);
    });
  
  // 3. ROUTAGE INTELLIGENT
  if (!refId || typeof nav !== 'function') return;

  try {
    switch (type) {
      case 'nouveau_ticket':
      case 'ticket_critique':
      case 'statut_change':
      case 'commentaire':
      case 'mention':
        nav('tickets', false);
        // Laisse le temps au DOM de Tickets de s'afficher avant d'ouvrir la modale
        setTimeout(() => { if (typeof openDetail === 'function') openDetail(refId); }, 100);
        break;
        
      case 'message_prive':
      case 'message_canal':
        nav('messages');
        break;
        
      case 'vote':
        nav('votes', false);
        setTimeout(() => { if (typeof openVoteDetail === 'function') openVoteDetail(refId); }, 100);
        break;
        
      case 'annonce':
        nav('annonces');
        break;
        
      case 'document':
        nav('documents');
        break;
        
      default:
        nav('dashboard'); // Fallback
    }
  } catch(e) {
    console.error('Erreur routage notif:', e);
  }
}

async function markAllRead() {
  if (_notifCache.length === 0) return;
  
  // Optimistic UI
  _notifCache = [];
  refreshNotifBadge();
  renderNotifPanel();
  
  // Serveur
  try {
    await sb.from('notifications').update({ lu: true })
            .eq('destinataire_id', user.id)
            .eq('lu', false);
  } catch (e) {
    console.warn('Erreur markAllRead:', e);
  }
}
