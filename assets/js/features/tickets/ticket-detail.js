// ── TICKET DETAIL ──
async function openDetail(id) {
  const t = cache.tickets.find(x => x.id === id);
  if (!t) return;

  // Charge commentaires + historique en parallèle
  const [{ data: comments }, { data: history }] = await Promise.all([
    sb.from('commentaires').select('*, profiles(nom, prenom, role)').eq('ticket_id', id).order('created_at'),
    sb.from('journal').select('*').eq('entite', 'ticket').eq('entite_id', id).order('created_at', { ascending: true })
  ]);

  const canManage = isManager();
  const isAuthor = t.auteur_id === user.id;
  const statutLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };

  // Historique des statuts depuis le journal
  const statutHistory = (history||[]).filter(h => h.details?.statut || h.action === 'Ticket créé' || h.action === 'Statut modifié');

  $('m-detail-title').textContent = t.titre;
  // Toutes les photos du ticket (photo_url + photos_urls si dispo)
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);
  d($('m-detail-body'), `
    ${allPhotos.length > 0 ? `
    <div style="margin-bottom:16px;">
      ${allPhotos.length === 1
        ? `<img src="${allPhotos[0]}" class="detail-photo" alt="Photo" style="cursor:zoom-in;border-radius:var(--r);" onclick="window.open('${allPhotos[0]}','_blank')">`
        : `<div style="display:grid;grid-template-columns:repeat(${Math.min(allPhotos.length,3)},1fr);gap:6px;">
            ${allPhotos.map(url => `
              <div style="border-radius:var(--r-sm);overflow:hidden;aspect-ratio:1;">
                <img src="${url}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" onclick="window.open('${url}','_blank')">
              </div>`).join('')}
           </div>`}
    </div>` : canManage || isAuthor ? `
    <div style="margin-bottom:16px;">
      <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:2px dashed var(--border);border-radius:var(--r);cursor:pointer;font-size:13px;color:var(--text-3);transition:border-color .15s;" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">
        <span style="font-size:20px;">📷</span>
        <span>Ajouter une photo</span>
        <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="uploadTicketPhoto('${t.id}', this)">
      </label>
    </div>` : ''}

    <div class="meta-strip">
      ${badgeUrgence(t.urgence)}
      ${badgeStatut(t.statut)}
      <span class="meta-item">📍 <strong>${t.batiment||'?'}</strong>${t.zone?' — '+t.zone:''}</span>
      <span class="meta-item">👤 <strong>${displayName(t.auteur_prenom,t.auteur_nom,t.auteur_email,'N/A')}</strong>${t.auteur_lot?' · Lot '+t.auteur_lot:''}</span>
      <span class="meta-item">📅 <strong>${fmt(t.created_at)}</strong></span>
      <span class="meta-item">⏱ <strong>${depuisJours(t.created_at)}</strong></span>
    </div>
    ${t.description ? `<p style="font-size:13.5px;line-height:1.6;margin-bottom:16px;color:var(--text);">${escHtml(t.description)}</p>` : ''}

    ${canManage ? `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px;padding:14px;background:var(--bg);border-radius:var(--r);border:1px solid var(--border);">
      <label style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;">Statut :</label>
      <select class="select" style="width:auto;" onchange="changeStatut('${t.id}',this.value)">
        ${['nouveau','en_cours','transmis_syndic','attente_intervention','résolu','clos'].map(s =>
          `<option value="${s}" ${s===t.statut?'selected':''}>${statutLabels[s]}</option>`
        ).join('')}
      </select>
      ${t.note_interne ? `<div style="font-size:12px;background:var(--amber-light);border:1px solid var(--amber-border);border-radius:var(--r-sm);padding:6px 10px;flex:1;"><strong>Note interne :</strong> ${escHtml(t.note_interne)}</div>` : ''}
    </div>` : ''}

    ${statutHistory.length > 1 ? `
    <div style="margin-bottom:18px;">
      <div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">📋 Historique</div>
      <div style="position:relative;padding-left:20px;">
        <div style="position:absolute;left:6px;top:6px;bottom:6px;width:2px;background:var(--border);border-radius:1px;"></div>
        ${statutHistory.map((h, i) => {
          const isLast = i === statutHistory.length - 1;
          const statut = h.details?.statut || (h.action === 'Ticket créé' ? 'nouveau' : null);
          return `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;position:relative;">
            <div style="width:14px;height:14px;border-radius:50%;background:${isLast?'var(--accent)':'var(--border)'};border:2px solid var(--surface);flex-shrink:0;margin-top:2px;position:absolute;left:-20px;"></div>
            <div>
              <div style="font-size:12.5px;font-weight:600;">${statut ? badgeStatut(statut) : escHtml(h.action)}</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${escHtml(h.user_nom||'Système')} · ${depuisJours(h.created_at)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <div style="margin-top:4px;">
      <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:12px;">
        💬 Commentaires (${(comments||[]).length})
      </div>
      <div id="comments-list">
        ${(comments||[]).length === 0
          ? '<div style="font-size:13px;color:var(--text-3);margin-bottom:12px;">Aucun commentaire pour l\'instant.</div>'
          : (comments||[]).map(c => `
            <div class="comment-bubble${c.prive?' private':''}">
              <div class="cm-head">
                <span class="cm-author">${displayName(c.profiles?.prenom,c.profiles?.nom,null,'?')}${c.prive?' 🔒':''}</span>
                <span class="cm-date">${fmt(c.created_at)}</span>
              </div>
              <div class="cm-text">${escHtml(c.texte)}</div>
            </div>`).join('')}
      </div>
      <div style="position:relative;">
        <textarea id="new-comment" class="textarea" style="min-height:66px;" 
          placeholder="Ajouter un commentaire... (tapez @ pour mentionner quelqu'un)"
          oninput="onCommentInput(event)"></textarea>
        <div class="mention-list" id="mention-list" style="display:none;"></div>
      </div>
      ${canManage ? `
      <div style="display:flex;gap:6px;margin-top:7px;align-items:center;">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;color:var(--text-2);">
          <input type="checkbox" id="comment-prive"> Note interne (non visible copropriétaires)
        </label>
      </div>` : ''}
      <button class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="submitComment('${t.id}')">Publier</button>
    </div>
  `);

  d($('m-detail-footer'), `
    <button class="btn btn-secondary" onclick="closeModal('m-detail')">Fermer</button>
    <button class="btn btn-ghost btn-sm" onclick="exportTicketPDF('${t.id}')">🖨️ PDF</button>
    ${(canManage || isAuthor) && t.statut !== 'clos' ? `
    <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteTicket('${t.id}')">Supprimer</button>` : ''}
  `);
  openModal('m-detail');
}

async function uploadTicketPhoto(ticketId, input) {
  const file = input.files[0];
  if (!file) return;
  toast('Upload en cours…', 'ok');
  const path = `${ticketId}/${Date.now()}.${file.name.split('.').pop()}`;
  const { data: upData, error } = await sb.storage.from('tickets').upload(path, file, { upsert: true });
  if (error) { toast('Erreur upload : ' + error.message, 'err'); return; }
  const { data: urlData } = sb.storage.from('tickets').getPublicUrl(path);
  const photo_url = urlData?.publicUrl;
  await sb.from('tickets').update({ photo_url }).eq('id', ticketId);
  // Mise à jour du cache
  const t = cache.tickets.find(x => x.id === ticketId);
  if (t) t.photo_url = photo_url;
  toast('Photo ajoutée ✓', 'ok');
  openDetail(ticketId);
}

async function exportTicketPDF(ticketId) {
  const t = cache.tickets.find(x => x.id === ticketId);
  if (!t) return;

  const urgLabels = { critique:'Critique', important:'Important', normal:'Normal' };
  const urgColors = { critique:'#dc2626', important:'#ea580c', normal:'#2563eb' };
  const urgBg    = { critique:'#fef2f2', important:'#fff7ed', normal:'#eff6ff' };
  const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis au syndic', attente_intervention:'En attente', résolu:'Résolu ✓', clos:'Clos' };
  const catLabels = { ascenseur:'Ascenseur', fuite:'Fuite / eau', electricite:'Électricité', securite:'Sécurité', proprete:'Propreté', espaces_verts:'Espaces verts', serrurerie:'Serrurerie', parking:'Parking', autre:'Autre' };
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const allPhotos = t.photos_urls?.length ? t.photos_urls : (t.photo_url ? [t.photo_url] : []);

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Fiche incident — ${t.titre}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1917; font-size: 12px; line-height: 1.5; }

    /* EN-TÊTE */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #1a1917; margin-bottom: 20px; }
    .header-left .org { font-size: 10px; color: #9b9890; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
    .header-left .doc-type { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header-right { text-align: right; font-size: 10px; color: #9b9890; line-height: 1.8; }
    .ref { font-size: 13px; font-weight: 700; color: #1a1917; }

    /* TITRE INCIDENT */
    .titre { font-size: 17px; font-weight: 700; margin-bottom: 12px; }

    /* BADGES */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-right: 6px; }

    /* GRILLE MÉTADONNÉES */
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e8e5df; border-radius: 8px; overflow: hidden; margin: 16px 0; }
    .meta-cell { padding: 10px 14px; border-bottom: 1px solid #e8e5df; }
    .meta-cell:nth-last-child(-n+2) { border-bottom: none; }
    .meta-cell:nth-child(odd) { border-right: 1px solid #e8e5df; background: #fafaf9; }
    .meta-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9b9890; margin-bottom: 3px; }
    .meta-value { font-size: 12.5px; font-weight: 600; color: #1a1917; }

    /* DESCRIPTION */
    .section { margin-top: 18px; }
    .section-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9b9890; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e8e5df; }
    .desc-box { background: #fafaf9; border: 1px solid #e8e5df; border-radius: 6px; padding: 12px 14px; font-size: 12.5px; line-height: 1.6; color: #3a3734; white-space: pre-wrap; }

    /* PHOTOS */
    .photos-grid { display: grid; gap: 8px; margin-top: 8px; }
    .photos-grid.one { grid-template-columns: 1fr; }
    .photos-grid.two { grid-template-columns: 1fr 1fr; }
    .photos-grid.three { grid-template-columns: 1fr 1fr 1fr; }
    .photos-grid img { width: 100%; border-radius: 6px; border: 1px solid #e8e5df; object-fit: cover; max-height: 200px; }

    /* PIED */
    .footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #e8e5df; display: flex; justify-content: space-between; font-size: 9.5px; color: #9b9890; }

    @media print { button { display: none !important; } }
  </style></head><body>

  <div class="header">
    <div class="header-left">
      <div class="org">Résidence le Floréal · 13-19 Rue du Moucherotte, 38360 Sassenage</div>
      <div class="doc-type">Fiche d'incident</div>
    </div>
    <div class="header-right">
      <div class="ref">N° ${t.id.substring(0,8).toUpperCase()}</div>
      <div>Émis le ${today}</div>
      <div>Par ${displayNameFromProfile(profile, user?.email)}</div>
    </div>
  </div>

  <div class="titre">${escHtml(t.titre)}</div>
  <div>
    <span class="badge" style="background:${urgBg[t.urgence]};color:${urgColors[t.urgence]};">${urgLabels[t.urgence]||t.urgence}</span>
    <span class="badge" style="background:#f0fdf4;color:#16a34a;">${statLabels[t.statut]||t.statut}</span>
    ${t.categorie ? `<span class="badge" style="background:#f5f4f1;color:#6b6860;">${catLabels[t.categorie]||t.categorie}</span>` : ''}
  </div>

  <div class="meta-grid">
    <div class="meta-cell"><div class="meta-label">Bâtiment</div><div class="meta-value">${escHtml(t.batiment||'—')}</div></div>
    <div class="meta-cell"><div class="meta-label">Zone / Localisation</div><div class="meta-value">${escHtml(t.zone||'—')}</div></div>
    <div class="meta-cell"><div class="meta-label">Date de signalement</div><div class="meta-value">${fmt(t.created_at)}</div></div>
    <div class="meta-cell"><div class="meta-label">Déclaré par</div><div class="meta-value">${escHtml(displayName(t.auteur_prenom,t.auteur_nom,t.auteur_email,'—'))}${t.auteur_lot?' · Lot '+t.auteur_lot:''}</div></div>
  </div>

  ${t.description ? `
  <div class="section">
    <div class="section-label">Description</div>
    <div class="desc-box">${escHtml(t.description)}</div>
  </div>` : ''}

  ${allPhotos.length ? `
  <div class="section">
    <div class="section-label">Photo${allPhotos.length > 1 ? 's' : ''} (${allPhotos.length})</div>
    <div class="photos-grid ${allPhotos.length === 1 ? 'one' : allPhotos.length === 2 ? 'two' : 'three'}">
      ${allPhotos.map(url => `<img src="${url}" alt="Photo incident">`).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <span>CoproSync · Résidence le Floréal · Sassenage</span>
    <span>Document confidentiel — usage interne</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}

async function changeStatut(id, statut) {
  const { error } = await sb.from('tickets').update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { toast('Erreur mise à jour', 'err'); return; }
  const t = cache.tickets.find(x => x.id === id);
  if (t) t.statut = statut;
  await addLog('Statut modifié', 'ticket', id, { statut });

  // Email à l'auteur du ticket
  await sendEmailNotif('statut_change', { ...t, statut });

  // Email syndic si transmis au syndic
  if (statut === 'transmis_syndic') {
    await sendEmailDirect('nouveau_ticket', null, {
      ...t, statut,
      titre: `[Transmis au syndic] ${t.titre}`,
    });
  }

  // Email syndic si résolu ou clos (pour archiver)
  if (statut === 'résolu' || statut === 'clos') {
    await sendEmailDirect('statut_change', null, {
      ...t, statut,
      titre: `[${statut === 'résolu' ? '✅ Résolu' : '📁 Clos'}] ${t.titre}`,
    });
    // Publie dans le feed
    await publishFeedEvent('resolved', `✅ Signalement résolu : ${t.titre}${t.batiment ? ' — '+t.batiment : ''}`);
  }

  toast('Statut mis à jour', 'ok');
  updateBadges();
  if (currentPage === 'tickets') filterTickets();
  if (currentPage === 'dashboard') renderDashboard();
}

async function submitComment(ticketId) {
  const texte = $('new-comment')?.value.trim();
  if (!texte) return;
  const prive = $('comment-prive')?.checked || false;
  const { error } = await sb.from('commentaires').insert({ ticket_id: ticketId, auteur_id: user.id, texte, prive });
  if (error) { toast('Erreur commentaire', 'err'); return; }
  const t = cache.tickets.find(x => x.id === ticketId);
  await addLog('Commentaire', 'ticket', ticketId, { prive });
  await sendEmailNotif('commentaire', t);

  // ── Traitement des @mentions ──
  const mentionRegex = /@(\S+)/g;
  let match;
  while ((match = mentionRegex.exec(texte)) !== null) {
    const tag = match[1].toLowerCase();
    // Cherche dans le cache des managers
    const mentionned = (cache.managers || []).find(m =>
      (m.prenom || '').toLowerCase().startsWith(tag) ||
      (m.nom || '').toLowerCase().startsWith(tag) ||
      (m.email || '').toLowerCase().startsWith(tag)
    );
    if (mentionned && mentionned.id !== user.id) {
      const auteurNom = displayNameFromProfile(profile, user?.email);
      await sb.from('notifications').insert({
        destinataire_id: mentionned.id,
        destinataire_email: mentionned.email,
        sujet: `🏷 ${auteurNom} vous a mentionné dans : ${t?.titre || 'un signalement'}`,
        corps: texte,
        type: 'mention',
        reference_id: ticketId,
        lu: false
      });
      // Push si c'est soi-même qui reçoit la mention (même appareil)
      if (mentionned.id === user.id) {
        await pushNotif('Vous avez été mentionné', `${auteurNom} : ${texte.substring(0, 80)}`, 'mention', ticketId);
      }
    }
  }

  toast('Commentaire publié', 'ok');
  openDetail(ticketId);
}

async function onCommentInput(e) {
  const ta = e.target;
  const val = ta.value;
  const cursor = ta.selectionStart;
  // Cherche un @ avant le curseur
  const before = val.substring(0, cursor);
  const atMatch = before.match(/@(\w*)$/);
  const ml = $('mention-list');
  if (!atMatch) { if (ml) ml.style.display = 'none'; return; }

  const query = atMatch[1].toLowerCase();
  // Charge les managers si pas en cache
  if (!cache.managers) {
    const { data } = await sb.from('profiles').select('id,nom,prenom,email,role')
      .in('role', ['administrateur','syndic','membre_cs']).eq('actif', true);
    cache.managers = data || [];
  }
  const matches = cache.managers.filter(m =>
    m.id !== user.id && (
      (m.prenom||'').toLowerCase().startsWith(query) ||
      (m.nom||'').toLowerCase().startsWith(query) ||
      (m.email||'').toLowerCase().startsWith(query)
    )
  ).slice(0, 5);

  if (!ml || matches.length === 0) { if (ml) ml.style.display = 'none'; return; }

  ml.innerHTML = matches.map(m => `
    <div class="mention-item" onclick="insertMention('${m.id}','${(m.prenom||m.nom||m.email).replace(/'/g,"\\'")}')">
      <div class="mention-av">${(m.prenom||m.nom||'?').charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-weight:600;">${displayName(m.prenom,m.nom,m.email)}</div>
        <div style="font-size:11px;color:var(--text-3);">${{administrateur:'Admin',syndic:'Syndic',membre_cs:'CS'}[m.role]||m.role}</div>
      </div>
    </div>`).join('');
  ml.style.display = 'block';
}

function insertMention(userId, displayName) {
  const ta = $('new-comment');
  const ml = $('mention-list');
  if (!ta) return;
  const val = ta.value;
  const cursor = ta.selectionStart;
  const before = val.substring(0, cursor);
  const after = val.substring(cursor);
  const newBefore = before.replace(/@\w*$/, '@' + displayName + ' ');
  ta.value = newBefore + after;
  ta.focus();
  if (ml) ml.style.display = 'none';
}
async function deleteTicket(id) {
  if (!confirm('Supprimer ce signalement ?')) return;
  const { error } = await sb.from('tickets').delete().eq('id', id);
  if (error) { toast('Erreur suppression', 'err'); return; }
  cache.tickets = cache.tickets.filter(t => t.id !== id);
  closeModal('m-detail');
  toast('Signalement supprimé', 'ok');
  updateBadges();
  renderPage(currentPage);
}
