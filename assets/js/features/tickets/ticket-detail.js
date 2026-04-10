// ════════════════════════════════════════════════════════════════
//  TICKET DETAIL (Affichage et interactions d'un signalement)
//  assets/js/features/tickets/ticket-detail.js
// ════════════════════════════════════════════════════════════════

async function openDetail(id) {
  const t = cache.tickets.find(x => x.id === id);
  if (!t) return;

  // Vérification côté client (la RLS Supabase est le vrai verrou)
  if (typeof canViewTicket === 'function' && !canViewTicket(t)) {
    toast('Vous n\'avez pas accès à ce signalement', 'err');
    return;
  }

  const [{ data: comments }, { data: history }] = await Promise.all([
    sb.from('commentaires').select('*, profiles(nom, prenom, role)').eq('ticket_id', id).order('created_at'),
    sb.from('journal').select('*').eq('entite', 'ticket').eq('entite_id', id).order('created_at', { ascending: true })
  ]);

  const isAuthor = t.auteur_id === user.id;
  const statutLabels = { nouveau: 'Nouveau', en_cours: 'En cours', transmis_syndic: 'Transmis syndic', attente_intervention: 'En attente', résolu: 'Résolu', clos: 'Clos' };
  const statutHistory = (history || []).filter(h => h.details?.statut || h.action === 'Ticket créé' || h.action === 'Statut modifié');
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);
  
  // Vérification sécurisée des rôles
  const isSyndicUser = typeof isSyndic === 'function' ? isSyndic() : false;
  const isManagerUser = typeof isManager === 'function' ? isManager() : false;
  const isCoproUser = typeof isCopro === 'function' ? isCopro() : true;
  
  const showPhotoUpload = !isSyndicUser && (isManagerUser || isAuthor);

  const titleEl = $('m-detail-title');
  if (titleEl) titleEl.textContent = t.titre;

  // Construction du corps de la modale
  let bodyHtml = ``;

  // 1. Galerie Photos
  if (allPhotos.length > 0) {
    bodyHtml += `
    <div style="margin-bottom:20px;">
      ${allPhotos.length === 1
        ? `<div class="photo-wrapper single" style="border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <img src="${allPhotos[0]}" style="width:100%; max-height:300px; object-fit:cover; cursor:zoom-in; transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('${allPhotos[0]}','_blank')">
           </div>`
        : `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:8px;">
            ${allPhotos.map(url => `
              <div style="border-radius:8px; overflow:hidden; aspect-ratio:1; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <img src="${url}" style="width:100%; height:100%; object-fit:cover; cursor:zoom-in; transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('${url}','_blank')">
              </div>
            `).join('')}
           </div>`
      }
    </div>`;
  } else if (showPhotoUpload) {
    bodyHtml += `
    <div style="margin-bottom:20px;" id="ticket-photo-upload-zone">
      <label style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:24px; background:var(--bg-2); border:2px dashed var(--border); border-radius:12px; cursor:pointer; transition:all 0.2s;" onmouseenter="this.style.borderColor='var(--primary)'; this.style.background='var(--primary-light)'" onmouseleave="this.style.borderColor='var(--border)'; this.style.background='var(--bg-2)'">
        <span style="font-size:28px;">📸</span>
        <span style="font-size:13px; font-weight:600; color:var(--text-2);">Ajouter une photo</span>
        <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="uploadTicketPhoto('${t.id}', this)">
      </label>
    </div>`;
  }

  // 2. Métadonnées (Badges)
  const formatD = typeof fmt === 'function' ? fmt(t.created_at) : new Date(t.created_at).toLocaleDateString();
  const formatD_jours = typeof depuisJours === 'function' ? depuisJours(t.created_at) : '';
  const authorName = typeof displayName === 'function' ? displayName(t.auteur_prenom, t.auteur_nom, t.auteur_email, 'N/A') : (t.auteur_nom || 'N/A');

  bodyHtml += `
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; padding:12px; background:var(--bg-1); border-radius:12px; border:1px solid var(--border);">
      ${typeof badgeUrgence === 'function' ? badgeUrgence(t.urgence) : `<span>${t.urgence}</span>`}
      ${typeof badgeStatut === 'function' ? badgeStatut(t.statut) : `<span>${t.statut}</span>`}
      <div style="width:100%; height:1px; background:var(--border); margin:4px 0;"></div>
      <span style="font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:4px;">📍 <strong style="color:var(--text-1);">${escHtml(t.batiment || '?')}</strong>${t.zone ? ' — ' + escHtml(t.zone) : ''}</span>
      <span style="font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:4px;">👤 <strong style="color:var(--text-1);">${escHtml(authorName)}</strong>${t.auteur_lot ? ' · Lot ' + escHtml(t.auteur_lot) : ''}</span>
      <span style="font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:4px;">📅 <strong style="color:var(--text-1);">${formatD}</strong> <span style="opacity:0.6;">(${formatD_jours})</span></span>
    </div>`;

  // 3. Description
  if (t.description) {
    bodyHtml += `
      <div style="background:var(--bg-1); padding:16px; border-radius:12px; margin-bottom:24px; border:1px solid var(--border);">
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:8px;">Description</div>
        <p style="font-size:14px; line-height:1.6; color:var(--text-1); white-space:pre-wrap; margin:0;">${escHtml(t.description)}</p>
      </div>`;
  }

  // 4. Contrôles de statut (Syndic/Admin)
  if (typeof canChangeTicketStatus === 'function' && canChangeTicketStatus()) {
    bodyHtml += `
    <div style="margin-bottom:24px; padding:16px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border);">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <label style="font-size:12px; font-weight:700; color:var(--text-2); text-transform:uppercase; letter-spacing:.05em;">Modifier le statut :</label>
        <select class="select" style="width:auto; font-weight:600; padding-top:6px; padding-bottom:6px;" onchange="changeStatut('${t.id}', this.value)">
          ${['nouveau','en_cours','transmis_syndic','attente_intervention','résolu','clos'].map(s =>
            `<option value="${s}" ${s === t.statut ? 'selected' : ''}>${statutLabels[s] || s}</option>`
          ).join('')}
        </select>
        ${isSyndicUser ? `<span style="font-size:11px; color:var(--text-3); background:var(--bg-2); padding:4px 8px; border-radius:6px;">Mode Syndic</span>` : ''}
      </div>
      ${t.note_interne && !isCoproUser ? `
        <div style="margin-top:12px; font-size:12.5px; background:var(--amber-light); color:var(--amber); border:1px solid var(--amber-border); border-radius:8px; padding:10px;">
          <strong style="text-transform:uppercase; font-size:10px; display:block; margin-bottom:2px;">Note interne (Privé)</strong>
          ${escHtml(t.note_interne)}
        </div>` : ''}
    </div>`;
  }

  // 5. Historique (Timeline)
  if (statutHistory.length > 1) {
    bodyHtml += `
    <div style="margin-bottom:24px;">
      <div style="font-family:var(--font-head); font-weight:800; font-size:13px; color:var(--text-3); text-transform:uppercase; letter-spacing:.05em; margin-bottom:16px; display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Historique d'intervention
      </div>
      <div style="position:relative; padding-left:24px;">
        <div style="position:absolute; left:8px; top:8px; bottom:8px; width:2px; background:var(--border); border-radius:1px;"></div>
        ${statutHistory.map((h, i) => {
          const isLast = i === statutHistory.length - 1;
          const statut = h.details?.statut || (h.action === 'Ticket créé' ? 'nouveau' : null);
          const hFormatD = typeof depuisJours === 'function' ? depuisJours(h.created_at) : '';
          
          return `
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; position:relative;">
            <div style="width:14px; height:14px; border-radius:50%; background:${isLast ? 'var(--primary)' : 'var(--border)'}; border:3px solid var(--surface); flex-shrink:0; margin-top:2px; position:absolute; left:-23px; box-shadow:${isLast ? '0 0 0 3px var(--primary-light)' : 'none'};"></div>
            <div style="background:${isLast ? 'var(--bg-1)' : 'transparent'}; padding:${isLast ? '8px 12px' : '0'}; border-radius:8px; border:${isLast ? '1px solid var(--border)' : 'none'}; width:100%;">
              <div style="font-size:13px; font-weight:600; color:var(--text-1);">${statut && typeof badgeStatut === 'function' ? badgeStatut(statut) : escHtml(h.action)}</div>
              <div style="font-size:11px; color:var(--text-3); margin-top:4px;">Par ${escHtml(h.user_nom || 'Système')} · ${hFormatD}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // 6. Commentaires
  bodyHtml += `
    <div style="margin-top:12px;">
      <div style="font-family:var(--font-head); font-weight:800; font-size:14px; margin-bottom:16px; color:var(--text-1); display:flex; align-items:center; gap:6px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Discussion (${(comments || []).length})
      </div>
      
      <div id="comments-list" style="margin-bottom:20px; display:flex; flex-direction:column; gap:12px;">
        ${!(comments || []).length
          ? '<div style="font-size:13px; color:var(--text-3); text-align:center; padding:16px; background:var(--bg-2); border-radius:8px;">Aucun message pour l\'instant. Soyez le premier à commenter.</div>'
          : (comments || []).map(c => {
              const isMe = c.auteur_id === user.id;
              const authorNameC = typeof displayName === 'function' ? displayName(c.profiles?.prenom, c.profiles?.nom, null, '?') : '?';
              const cDate = typeof fmt === 'function' ? fmt(c.created_at) : new Date(c.created_at).toLocaleDateString();
              
              return `
              <div class="comment-bubble ${isMe ? 'me' : ''} ${c.prive ? 'private' : ''}" style="
                background: ${c.prive ? 'var(--amber-light)' : (isMe ? 'var(--primary-light)' : 'var(--bg-1)')};
                border: 1px solid ${c.prive ? 'var(--amber-border)' : (isMe ? 'transparent' : 'var(--border)')};
                padding: 12px 16px; border-radius: 12px;
                border-bottom-${isMe ? 'right' : 'left'}-radius: 4px;
                align-self: ${isMe ? 'flex-end' : 'flex-start'};
                max-width: 85%;
              ">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; gap:12px;">
                  <span style="font-size:11px; font-weight:700; color:${isMe ? 'var(--primary)' : 'var(--text-2)'};">${escHtml(authorNameC)}${c.prive ? ' 🔒 (Interne)' : ''}</span>
                  <span style="font-size:10px; color:var(--text-3); white-space:nowrap;">${cDate}</span>
                </div>
                <div style="font-size:13.5px; color:${isMe ? 'var(--text-1)' : 'var(--text-1)'}; line-height:1.5; white-space:pre-wrap; word-break:break-word;">${escHtml(c.texte)}</div>
              </div>`;
            }).join('')}
      </div>

      ${typeof canComment === 'function' && canComment(t.auteur_id) ? `
      <div style="background:var(--bg-1); border:1px solid var(--border); border-radius:12px; padding:12px; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
        <textarea id="new-comment" class="textarea" style="min-height:50px; border:none; background:transparent; padding:0; font-size:14px; resize:none; overflow:hidden;"
          placeholder="${isSyndicUser ? 'Commentaire visible par tous...' : 'Écrire un message... (tapez @ pour mentionner)'}"
          oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'; if(typeof onCommentInput === 'function') onCommentInput(event)"></textarea>
        
        <div class="mention-list" id="mention-list" style="display:none; position:absolute; bottom:100%; left:0; right:0; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:0 -4px 16px rgba(0,0,0,0.1); margin-bottom:8px; z-index:10;"></div>
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px; border-top:1px solid var(--border); padding-top:12px;">
          <div>
            ${typeof Permissions !== 'undefined' && Permissions.has('tickets.comment_private') ? `
            <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; cursor:pointer; color:var(--amber); font-weight:600; padding:4px 8px; background:var(--amber-light); border-radius:6px;">
              <input type="checkbox" id="comment-prive" style="accent-color:var(--amber);"> Note interne
            </label>` : ''}
          </div>
          <button id="btn-submit-comment" class="btn btn-primary btn-sm" style="border-radius:20px; padding:6px 16px;" onclick="submitComment('${t.id}')">
            Envoyer <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:4px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
      ` : `<div style="font-size:13px; color:var(--text-3); font-style:italic; padding:12px; text-align:center; background:var(--bg-2); border-radius:8px;">Vous ne pouvez pas commenter ce signalement.</div>`}
    </div>`;

  const bodyEl = $('m-detail-body');
  if (bodyEl) bodyEl.innerHTML = bodyHtml;

  // Footer Actions
  let footerHtml = `<button class="btn btn-secondary" onclick="closeModal('m-detail')">Fermer</button>`;
  
  if (typeof Permissions !== 'undefined' && Permissions.has('tickets.export_pdf')) {
    footerHtml += `<button class="btn btn-ghost btn-sm" onclick="exportTicketPDF('${t.id}')" title="Générer un PDF de ce signalement">🖨️ Imprimer</button>`;
  }
  
  if (typeof canDeleteTicket === 'function' && canDeleteTicket()) {
    footerHtml += `<button class="btn btn-ghost btn-sm" style="color:var(--red); margin-left:auto;" onclick="deleteTicket('${t.id}')">Supprimer</button>`;
  }
  
  const footerEl = $('m-detail-footer');
  if (footerEl) {
    footerEl.style.display = 'flex';
    footerEl.style.justifyContent = 'flex-start';
    footerEl.style.gap = '8px';
    footerEl.innerHTML = footerHtml;
  }

  if (typeof openModal === 'function') openModal('m-detail');
}

async function uploadTicketPhoto(ticketId, input) {
  if (typeof isSyndic === 'function' && isSyndic()) return;
  
  const file = input.files[0];
  if (!file) return;
  
  const zone = $('ticket-photo-upload-zone');
  if (zone) zone.innerHTML = `<div style="padding:24px; text-align:center; color:var(--primary); font-weight:600;"><span class="spinner" style="display:inline-block; width:20px; height:20px; border:3px solid var(--primary); border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; vertical-align:middle; margin-right:8px;"></span>Envoi de l'image en cours...</div>`;

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${ticketId}/${Date.now()}.${ext}`;
    
    const { error } = await sb.storage.from('tickets').upload(path, file, { 
      upsert: true,
      contentType: file.type || 'image/jpeg' 
    });
    
    if (error) throw error;
    
    const { data: urlData } = sb.storage.from('tickets').getPublicUrl(path);
    if (!urlData?.publicUrl) throw new Error("Impossible de récupérer l'URL de l'image");

    const t = cache.tickets.find(x => x.id === ticketId);
    
    // Si c'est la première photo, on la met dans photo_url, sinon on l'ajoute à photos_urls
    const currentUrls = t.photos_urls || (t.photo_url ? [t.photo_url] : []);
    currentUrls.push(urlData.publicUrl);

    const updatePayload = {
      photo_url: currentUrls[0],
      photos_urls: currentUrls
    };

    const { error: dbErr } = await sb.from('tickets').update(updatePayload).eq('id', ticketId);
    if (dbErr) throw dbErr;

    if (t) {
      t.photo_url = currentUrls[0];
      t.photos_urls = currentUrls;
    }
    
    toast('Photo ajoutée avec succès ✓', 'ok');
    openDetail(ticketId); // Recharge la modale pour afficher la photo
    
  } catch (err) {
    console.error('Upload Error:', err);
    toast('Erreur lors de l\'envoi : ' + err.message, 'err');
    openDetail(ticketId); // Restaure l'état précédent en cas d'erreur
  }
}

async function changeStatut(id, statut) {
  if (typeof canChangeTicketStatus === 'function' && !canChangeTicketStatus()) { 
    toast('Permission insuffisante', 'err'); 
    return; 
  }

  try {
    const { error } = await sb.from('tickets').update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;

    const t = cache.tickets.find(x => x.id === id);
    if (t) t.statut = statut;
    
    if (typeof addLog === 'function') await addLog('Statut modifié', 'ticket', id, { statut });
    
    // Notifications asynchrones (ne bloquent pas l'UI si échec)
    if (typeof sendEmailNotif === 'function') {
      sendEmailNotif('statut_change', { ...t, statut }).catch(console.warn);
    }
    
    if (statut === 'transmis_syndic' && typeof sendEmailDirect === 'function') {
      sendEmailDirect('nouveau_ticket', null, { ...t, statut, titre: '[Transmis au syndic] ' + t.titre }).catch(console.warn);
    }
    
    if ((statut === 'résolu' || statut === 'clos')) {
      if (typeof sendEmailDirect === 'function') {
        sendEmailDirect('statut_change', null, { ...t, statut, titre: '[' + (statut === 'résolu' ? '✅ Résolu' : '📁 Clos') + '] ' + t.titre }).catch(console.warn);
      }
      if (typeof publishFeedEvent === 'function') {
        publishFeedEvent('resolved', '✅ Signalement résolu : ' + t.titre + (t.batiment ? ' — ' + t.batiment : '')).catch(console.warn);
      }
    }
    
    toast('Statut mis à jour', 'ok');
    
    // Mise à jour de l'UI globale
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof currentPage !== 'undefined') {
      if (currentPage === 'tickets' && typeof filterTickets === 'function') filterTickets();
      if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    }
    
    // Recharge la modale pour afficher le nouvel historique
    openDetail(id);

  } catch (err) {
    toast('Erreur de mise à jour du statut', 'err');
  }
}

async function submitComment(ticketId) {
  const inputEl = $('new-comment');
  const texte = inputEl?.value.trim();
  if (!texte) return;
  
  const prive = $('comment-prive')?.checked || false;
  const t = cache.tickets.find(x => x.id === ticketId);
  
  if (typeof canComment === 'function' && !canComment(t?.auteur_id, prive)) { 
    toast('Vous ne pouvez pas publier ce commentaire', 'err'); 
    return; 
  }

  const btn = $('btn-submit-comment');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const { error } = await sb.from('commentaires').insert({ ticket_id: ticketId, auteur_id: user.id, texte, prive });
    if (error) throw error;
    
    if (typeof addLog === 'function') await addLog('Commentaire', 'ticket', ticketId, { prive });
    if (typeof sendEmailNotif === 'function') sendEmailNotif('commentaire', t).catch(console.warn);
    
    toast('Message envoyé', 'ok');
    openDetail(ticketId); // Recharge les commentaires
  } catch (err) {
    toast('Erreur lors de la publication', 'err');
    if (btn) { btn.disabled = false; btn.innerHTML = 'Envoyer'; }
  }
}

// ── Logique des Mentions (@) ──
async function onCommentInput(e) {
  if (typeof isSyndic === 'function' && isSyndic()) return;
  
  const ta = e.target;
  const val = ta.value;
  const before = val.substring(0, ta.selectionStart);
  
  // Cherche le symbole '@' suivi de lettres à la fin de ce qui a été tapé
  const atMatch = before.match(/@([a-zA-ZÀ-ÿ-]*)$/);
  const ml = $('mention-list');
  
  if (!atMatch) { 
    if (ml) ml.style.display = 'none'; 
    return; 
  }
  
  const query = atMatch[1].toLowerCase();
  
  // Chargement des gestionnaires si pas en cache
  if (!cache.managers) {
    try {
      const { data } = await sb.from('profiles').select('id,nom,prenom,email,role').in('role', ['administrateur','syndic','membre_cs']).eq('actif', true);
      cache.managers = data || [];
    } catch(err) {
      cache.managers = [];
    }
  }
  
  // Filtrage
  const matches = cache.managers.filter(m =>
    m.id !== user.id && (
      (m.prenom || '').toLowerCase().startsWith(query) ||
      (m.nom || '').toLowerCase().startsWith(query) ||
      (m.email || '').toLowerCase().startsWith(query)
    )
  ).slice(0, 5);
  
  if (!ml || !matches.length) { 
    if (ml) ml.style.display = 'none'; 
    return; 
  }
  
  // Affichage de la liste de mentions
  const roleLabels = { administrateur: 'Admin', syndic: 'Syndic', membre_cs: 'Conseil Syndical' };
  
  ml.innerHTML = matches.map(m => {
    const init = (m.prenom || m.nom || '?').charAt(0).toUpperCase();
    const safeName = (m.prenom || m.nom || m.email).replace(/'/g,"\\'");
    const dName = typeof displayName === 'function' ? displayName(m.prenom, m.nom, m.email) : safeName;
    
    return `
    <div class="mention-item" onclick="insertMention('${m.id}','${safeName}')" style="display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
      <div style="width:24px; height:24px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">${init}</div>
      <div>
        <div style="font-weight:600; font-size:13px; color:var(--text-1);">${escHtml(dName)}</div>
        <div style="font-size:10px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.05em;">${roleLabels[m.role] || m.role}</div>
      </div>
    </div>`;
  }).join('');
  
  ml.style.display = 'block';
}

function insertMention(userId, name) {
  const ta = $('new-comment');
  const ml = $('mention-list');
  if (!ta) return;
  
  const before = ta.value.substring(0, ta.selectionStart);
  const after = ta.value.substring(ta.selectionStart);
  
  // Remplace la portion "@texte" par "@NomComplet "
  const newBefore = before.replace(/@[a-zA-ZÀ-ÿ-]*$/, '@' + name + ' ');
  
  ta.value = newBefore + after;
  
  // Replace le curseur juste après l'espace
  ta.selectionStart = ta.selectionEnd = newBefore.length;
  ta.focus();
  
  if (ml) ml.style.display = 'none';
}

async function deleteTicket(id) {
  if (typeof canDeleteTicket === 'function' && !canDeleteTicket()) { 
    toast('Suppression réservée aux administrateurs', 'err'); 
    return; 
  }
  
  if (!confirm('Voulez-vous vraiment supprimer définitivement ce signalement et ses photos ?')) return;
  
  try {
    const { error } = await sb.from('tickets').delete().eq('id', id);
    if (error) throw error;
    
    cache.tickets = cache.tickets.filter(t => t.id !== id);
    if (typeof closeModal === 'function') closeModal('m-detail');
    toast('Signalement supprimé', 'ok');
    
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof renderPage === 'function' && typeof currentPage !== 'undefined') renderPage(currentPage);
    
  } catch (err) {
    toast('Erreur lors de la suppression', 'err');
  }
}

async function exportTicketPDF(ticketId) {
  if (typeof Permissions !== 'undefined' && !Permissions.has('tickets.export_pdf')) return;
  
  const t = cache.tickets.find(x => x.id === ticketId);
  if (!t) return;
  
  const urgLabels = { critique: 'Critique', important: 'Important', normal: 'Normal' };
  const urgColors = { critique: '#dc2626', important: '#ea580c', normal: '#2563eb' };
  const urgBg    = { critique: '#fef2f2', important: '#fff7ed', normal: '#eff6ff' };
  const statLabels = { nouveau: 'Nouveau', en_cours: 'En cours', transmis_syndic: 'Transmis au syndic', attente_intervention: 'En attente', résolu: 'Résolu ✓', clos: 'Clos' };
  const catLabels  = { ascenseur: 'Ascenseur', fuite: 'Fuite / eau', electricite: 'Électricité', securite: 'Sécurité', proprete: 'Propreté', espaces_verts: 'Espaces verts', serrurerie: 'Serrurerie', parking: 'Parking', autre: 'Autre' };
  
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);
  
  const authorName = typeof displayName === 'function' ? displayName(t.auteur_prenom,t.auteur_nom,t.auteur_email,'—') : 'N/A';
  const profileName = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Syndic';
  const formatD = typeof fmt === 'function' ? fmt(t.created_at) : new Date(t.created_at).toLocaleDateString();

  const win = window.open('', '_blank');
  if (!win) { toast('Popup bloquée par le navigateur', 'err'); return; }
  
  win.document.write(`<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>Fiche Incident - ${t.reference || t.id.substring(0,8)}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page { size: A4; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; font-size: 11px; line-height: 1.5; }
      
      .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; border-bottom: 2px solid #111827; margin-bottom: 24px; }
      .org { font-size: 9px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
      .doc-type { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
      
      .title-box { margin-bottom: 16px; }
      .ticket-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 8px; line-height: 1.3; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; margin-right: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
      
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
      .meta-cell { padding: 12px; border-bottom: 1px solid #e5e7eb; }
      .meta-cell:nth-last-child(-n+2) { border-bottom: none; }
      .meta-cell:nth-child(odd) { border-right: 1px solid #e5e7eb; background: #f9fafb; }
      .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
      .meta-value { font-size: 13px; font-weight: 600; color: #1f2937; }
      
      .section { margin-bottom: 24px; page-break-inside: avoid; }
      .section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #374151; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; letter-spacing: 0.05em; }
      .desc-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #374151; }
      
      .photos-grid { display: grid; gap: 12px; margin-top: 12px; }
      .photos-grid.n1 { grid-template-columns: 1fr; }
      .photos-grid.n2, .photos-grid.n4 { grid-template-columns: 1fr 1fr; }
      .photos-grid.n3, .photos-grid.n5 { grid-template-columns: 1fr 1fr 1fr; }
      .photos-grid img { width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: cover; max-height: 250px; }
      
      .footer { position: fixed; bottom: 0; left: 0; right: 0; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
      @media print { button { display: none !important; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="org">CoproSync · Résidence le Floréal</div>
        <div class="doc-type">Fiche d'Incident</div>
      </div>
      <div style="text-align:right; font-size:10px; color:#6b7280; line-height:1.6;">
        <div><strong>Réf :</strong> ${(t.reference || t.id.substring(0,8)).toUpperCase()}</div>
        <div><strong>Édité le :</strong> ${today}</div>
        <div><strong>Par :</strong> ${escHtml(profileName)}</div>
      </div>
    </div>
    
    <div class="title-box">
      <div class="ticket-title">${escHtml(t.titre)}</div>
      <div>
        <span class="badge" style="background:${urgBg[t.urgence]||'#f3f4f6'}; color:${urgColors[t.urgence]||'#374151'};">${urgLabels[t.urgence]||t.urgence}</span>
        <span class="badge" style="background:#f0fdf4; color:#16a34a;">${statLabels[t.statut]||t.statut}</span>
        ${t.categorie ? `<span class="badge" style="background:#f3f4f6; color:#4b5563;">${catLabels[t.categorie]||t.categorie}</span>` : ''}
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-cell"><div class="meta-label">Bâtiment / Zone</div><div class="meta-value">${escHtml(t.batiment||'Général')}${t.zone ? ' — ' + escHtml(t.zone) : ''}</div></div>
      <div class="meta-cell"><div class="meta-label">Date de signalement</div><div class="meta-value">${formatD}</div></div>
      <div class="meta-cell"><div class="meta-label">Déclaré par</div><div class="meta-value">${escHtml(authorName)}${t.auteur_lot ? ' · Lot '+escHtml(t.auteur_lot) : ''}</div></div>
      <div class="meta-cell"><div class="meta-label">Contact</div><div class="meta-value">${escHtml(t.auteur_email || '—')}</div></div>
    </div>
    
    ${t.description ? `
    <div class="section">
      <div class="section-label">Description du problème</div>
      <div class="desc-box">${escHtml(t.description)}</div>
    </div>` : ''}
    
    ${allPhotos.length ? `
    <div class="section">
      <div class="section-label">Photos jointes (${allPhotos.length})</div>
      <div class="photos-grid n${Math.min(allPhotos.length, 5)}">
        ${allPhotos.map(url => `<img src="${url}">`).join('')}
      </div>
    </div>` : ''}
    
    <div class="footer">
      <span>Généré par CoproSync</span>
      <span>Document confidentiel</span>
    </div>
    
    <script>window.onload=()=>{ setTimeout(()=>{window.print();window.close();}, 500); }<\/script>
  </body>
  </html>`);
  win.document.close();
}