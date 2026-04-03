const DOC_CATS = {
  ag:            { label:'Assemblées Générales', ico:'🏛️', color:'#6366f1' },
  financier:     { label:'Financier',           ico:'💰', color:'#10b981' },
  technique:     { label:'Technique',           ico:'🔧', color:'#f59e0b' },
  juridique:     { label:'Juridique',           ico:'⚖️', color:'#ef4444' },
  administratif: { label:'Administratif',       ico:'📋', color:'#2563eb' },
  contrats:      { label:'Contrats',            ico:'📄', color:'#8b5cf6' },
  diagnostics:   { label:'Diagnostics',         ico:'🔍', color:'#ec4899' },
};

let _docsCache = [];
let _docsCatActive = 'tous';
let _docsVus = new Set();

async function renderDocuments() {
  $('page').innerHTML = `<div style="padding:24px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Documents</h1><p>Base documentaire de la résidence</p></div>
      ${isManager() ? `<button class="btn btn-primary" onclick="openDocModal()">+ Ajouter un document</button>` : ''}
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;">
      <div style="flex:1;position:relative;">
        <input type="search" id="doc-search" class="input" placeholder="🔍 Rechercher un document…" oninput="searchDocs(this.value)" style="padding-left:14px;">
      </div>
    </div>
    <div class="doc-cats" id="doc-cats">
      <button class="doc-cat-btn active" onclick="filterDocs('tous')">📁 Tous</button>
      ${Object.entries(DOC_CATS).map(([k,v]) => `
        <button class="doc-cat-btn" onclick="filterDocs('${k}')" id="doccat-${k}">
          ${v.ico} ${v.label} <span class="count" id="doccnt-${k}">0</span>
        </button>`).join('')}
    </div>
    <div id="doc-list"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
  </div>`;
  await loadDocs();
}

async function loadDocs() {
  // Managers voient tout, copropriétaires uniquement les docs publics
  let query = sb.from('documents').select('*').order('epingle', { ascending:false }).order('created_at', { ascending:false });
  if (!isManager()) query = query.eq('visible_pour', 'tous');
  const { data } = await query;
  _docsCache = data || [];
  const { data: vus } = await sb.from('documents_vus').select('document_id').eq('user_id', user.id);
  _docsVus = new Set((vus||[]).map(v => v.document_id));
  renderDocsList();
  updateDocsBadge();
}

function filterDocs(cat) {
  _docsCatActive = cat;
  document.querySelectorAll('.doc-cat-btn').forEach(b => b.classList.remove('active'));
  const btn = cat === 'tous' ? document.querySelector('.doc-cat-btn') : $(`doccat-${cat}`);
  if (btn) btn.classList.add('active');
  renderDocsList();
}

function renderDocsList() {
  const el = $('doc-list');
  if (!el) return;
  const list = _docsCatActive === 'tous' ? _docsCache : _docsCache.filter(d => d.categorie === _docsCatActive);

  // Met à jour les compteurs
  Object.keys(DOC_CATS).forEach(k => {
    const el = $(`doccnt-${k}`);
    if (el) el.textContent = _docsCache.filter(d => d.categorie === k).length;
  });

  if (!list.length) {
    el.innerHTML = `${emptyState('📁', _docsCatActive !== 'tous' ? 'Aucun document ici' : 'Bibliothèque vide', _docsCatActive !== 'tous' ? 'Aucun document dans cette catégorie pour l\'instant.' : 'Les documents de la résidence apparaîtront ici.')}`;
    return;
  }

  // Groupe par catégorie si "tous"
  if (_docsCatActive === 'tous') {
    let html = '';
    Object.entries(DOC_CATS).forEach(([cat, meta]) => {
      const docs = list.filter(d => d.categorie === cat);
      if (!docs.length) return;
      html += `<div class="doc-folder-header">
        <span style="font-size:18px;">${meta.ico}</span>
        <span>${meta.label}</span>
        <span style="font-size:12px;color:var(--text-3);font-family:var(--font);font-weight:400;text-transform:none;letter-spacing:0;">${docs.length} document${docs.length>1?'s':''}</span>
      </div>
      <div class="doc-grid" style="margin-bottom:24px;">${docs.map(d => renderDocCard(d)).join('')}</div>`;
    });
    // Docs sans catégorie connue
    const autres = list.filter(d => !DOC_CATS[d.categorie]);
    if (autres.length) html += `<div class="doc-grid">${autres.map(d => renderDocCard(d)).join('')}</div>`;
    el.innerHTML = html;
  } else {
    el.innerHTML = `<div class="doc-grid">${list.map(d => renderDocCard(d)).join('')}</div>`;
  }
}

function renderDocCard(d) {
  const cat = DOC_CATS[d.categorie] || { ico:'📄', color:'#6b7280', label:d.categorie };
  const isNew = !_docsVus.has(d.id);
  const isExpire = d.date_expiration && new Date(d.date_expiration) < new Date();
  const isSoonExpire = d.date_expiration && !isExpire && daysUntil(d.date_expiration) <= 30;
  const taille = d.fichier_taille ? (d.fichier_taille > 1048576 ? (d.fichier_taille/1048576).toFixed(1)+'Mo' : Math.round(d.fichier_taille/1024)+'Ko') : '';
  const ext = (d.fichier_nom||'').split('.').pop().toUpperCase();
  return `<div class="doc-card${d.epingle?' epingle':''}${isNew?' nouveau':''}${isExpire?' expire':''}" onclick="openDoc('${d.id}')">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div class="doc-ico" style="background:${cat.color}22;">${cat.ico}</div>
      <div style="flex:1;min-width:0;">
        <div class="doc-titre">${escHtml(d.titre)}</div>
        ${d.description ? `<div style="font-size:12px;color:var(--text-3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(d.description)}</div>` : ''}
      </div>
    </div>
    <div class="doc-meta">
      ${ext ? `<span style="background:var(--surface-2);padding:1px 6px;border-radius:4px;font-weight:700;">${ext}</span>` : ''}
      ${taille ? `<span>${taille}</span>` : ''}
      ${d.version > 1 ? `<span>v${d.version}</span>` : ''}
      <span>${fmtD(d.created_at)}</span>
      ${isSoonExpire ? `<span style="color:var(--orange);font-weight:600;">⚠️ Expire dans ${daysUntil(d.date_expiration)}j</span>` : ''}
      ${isExpire ? `<span style="color:var(--red);font-weight:600;">❌ Expiré</span>` : ''}
      ${d.visible_pour === 'managers' ? `<span style="color:var(--violet);">🔒 CS/Syndic</span>` : ''}
    </div>
    <div class="doc-actions">
      <a href="${d.fichier_url}" target="_blank" class="btn btn-primary btn-sm" onclick="event.stopPropagation();markDocVu('${d.id}')">
        📥 Télécharger
      </a>
      ${d.fichier_type?.includes('pdf') ? `<a href="${d.fichier_url}" target="_blank" class="btn btn-secondary btn-sm" onclick="event.stopPropagation();markDocVu('${d.id}')">👁️ Voir</a>` : ''}
      ${isManager() ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openDocModal('${d.id}')">✏️</button>
      <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="event.stopPropagation();deleteDoc('${d.id}')">🗑</button>` : ''}
    </div>
  </div>`;
}

async function openDoc(docId) {
  await markDocVu(docId);
  const doc = _docsCache.find(d => d.id === docId);
  if (doc?.fichier_url) window.open(doc.fichier_url, '_blank');
}

async function markDocVu(docId) {
  if (_docsVus.has(docId)) return;
  await sb.from('documents_vus').upsert({ document_id: docId, user_id: user.id }, { onConflict: 'document_id,user_id' });
  _docsVus.add(docId);
  updateDocsBadge();
  // Retire badge "nouveau" du card
  renderDocsList();
}

function updateDocsBadge() {
  const nonVus = _docsCache.filter(d => !_docsVus.has(d.id)).length;
  const el = $('nc-documents');
  if (el) { el.textContent = nonVus; el.style.display = nonVus > 0 ? '' : 'none'; }
}

function openDocModal(id) {
  const d = id ? _docsCache.find(x => x.id === id) : null;
  const isEdit = !!d;
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-doc';
  overlay.innerHTML = `<div class="modal" style="max-width:540px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier le document' : 'Ajouter un document'}</span>
      <button class="mclose" onclick="document.getElementById('modal-doc').remove()">×</button>
    </div>
    <div class="mb">
      <div class="fg"><label class="label">Titre *</label>
        <input type="text" id="doc-titre" class="input" placeholder="Ex: PV Assemblée Générale 2025" value="${escHtml(d?.titre||'')}">
      </div>
      <div class="fg"><label class="label">Description</label>
        <input type="text" id="doc-desc" class="input" placeholder="Courte description…" value="${escHtml(d?.description||'')}">
      </div>
      <div class="fg-row">
        <div class="fg"><label class="label">Catégorie</label>
          <select id="doc-cat" class="select" style="width:100%;" onchange="updateDocPath()">
            ${Object.entries(DOC_CATS).map(([k,v]) => `<option value="${k}" ${d?.categorie===k?'selected':''}>${v.ico} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><label class="label">Année</label>
          <input type="number" id="doc-annee" class="input" value="${d?.annee||new Date().getFullYear()}" min="2000" max="2099">
        </div>
      </div>
      <div class="fg-row">
        <div class="fg"><label class="label">Visible pour</label>
          <select id="doc-visible" class="select" style="width:100%;">
            <option value="tous" ${(!d||d?.visible_pour==='tous')?'selected':''}>👥 Tous les résidents</option>
            <option value="managers" ${d?.visible_pour==='managers'?'selected':''}>🔒 CS / Syndic uniquement</option>
          </select>
        </div>
        <div class="fg"><label class="label">Date d'expiration</label>
          <input type="date" id="doc-expiration" class="input" value="${d?.date_expiration||''}">
        </div>
      </div>
      <div class="fg" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="doc-epingle" ${d?.epingle?'checked':''}>
        <label for="doc-epingle" style="cursor:pointer;font-size:13px;">📌 Épingler ce document en haut</label>
      </div>
      ${!isEdit ? `
      <div class="fg">
        <label class="label">Fichier *</label>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:6px;" id="doc-path-preview">📁 Chemin : ag/${new Date().getFullYear()}/</div>
        <input type="file" id="doc-fichier" class="input" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg">
      </div>` : `
      <div style="padding:10px 14px;background:var(--surface-2);border-radius:var(--r-sm);font-size:13px;color:var(--text-2);">
        📄 Fichier actuel : <strong>${escHtml(d?.fichier_nom||'Document')}</strong>
        <div style="margin-top:6px;"><input type="file" id="doc-fichier" class="input" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"> <span style="font-size:11px;color:var(--text-3);">(laisser vide pour garder l'actuel)</span></div>
      </div>`}
    </div>
    <div class="mf">
      ${isEdit ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);margin-right:auto;" onclick="deleteDoc('${d.id}')">🗑 Supprimer</button>` : ''}
      <button class="btn btn-secondary" onclick="document.getElementById('modal-doc').remove()">Annuler</button>
      <button class="btn btn-primary" id="doc-save-btn" onclick="saveDoc('${d?.id||''}')">
        ${isEdit ? 'Enregistrer' : 'Publier'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  updateDocPath();
}

function searchDocs(query) {
  const q = query.toLowerCase().trim();
  if (!q) { renderDocsList(); return; }
  const filtered = _docsCache.filter(d =>
    d.titre?.toLowerCase().includes(q) ||
    d.description?.toLowerCase().includes(q) ||
    d.fichier_nom?.toLowerCase().includes(q) ||
    DOC_CATS[d.categorie]?.label.toLowerCase().includes(q)
  );
  const el = $('doc-list');
  if (!el) return;
  if (!filtered.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">🔍</div><div class="empty-txt">Aucun document pour "<strong>${escHtml(q)}</strong>"</div></div>`;
    return;
  }
  el.innerHTML = `<div class="doc-grid">${filtered.map(d => renderDocCard(d)).join('')}</div>`;
}

function updateDocPath() {
  const cat = $('doc-cat')?.value || 'ag';
  const annee = $('doc-annee')?.value || new Date().getFullYear();
  const preview = $('doc-path-preview');
  if (preview) preview.textContent = `📁 Chemin : ${cat}/${annee}/`;
}

async function saveDoc(id) {
  const titre = $('doc-titre')?.value.trim();
  if (!titre) { toast('Titre requis', 'err'); return; }
  const fichierInput = $('doc-fichier');
  const fichier = fichierInput?.files[0];
  if (!id && !fichier) { toast('Fichier requis', 'err'); return; }
  const btn = $('doc-save-btn');
  btn.disabled = true; btn.textContent = 'Envoi…';
  const cat = $('doc-cat')?.value || 'ag';
  const annee = $('doc-annee')?.value || new Date().getFullYear();
  let fichier_url = id ? _docsCache.find(d => d.id === id)?.fichier_url : null;
  let fichier_nom = id ? _docsCache.find(d => d.id === id)?.fichier_nom : null;
  let fichier_taille = id ? _docsCache.find(d => d.id === id)?.fichier_taille : null;
  let fichier_type = id ? _docsCache.find(d => d.id === id)?.fichier_type : null;
  // Upload si nouveau fichier
  if (fichier) {
    btn.textContent = 'Upload…';
    const safeName = fichier.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const path = `${cat}/${annee}/${Date.now()}-${safeName}`;
    const { error: upErr } = await sb.storage.from('documents').upload(path, fichier, { upsert: true, contentType: fichier.type });
    if (upErr) { toast('Erreur upload : ' + upErr.message, 'err'); btn.disabled=false; btn.textContent='Publier'; return; }
    const { data: urlData } = sb.storage.from('documents').getPublicUrl(path);
    fichier_url = urlData?.publicUrl;
    fichier_nom = fichier.name;
    fichier_taille = fichier.size;
    fichier_type = fichier.type;
  }
  const payload = {
    titre,
    description: $('doc-desc')?.value.trim() || null,
    categorie: cat,
    annee: parseInt(annee),
    visible_pour: $('doc-visible')?.value || 'tous',
    date_expiration: $('doc-expiration')?.value || null,
    epingle: $('doc-epingle')?.checked || false,
    auteur_id: user.id,
    fichier_url, fichier_nom, fichier_taille, fichier_type,
    ...(id ? { version: (_docsCache.find(d=>d.id===id)?.version||1) + (fichier?1:0) } : {}),
  };
  let error;
  if (id) { ({ error } = await sb.from('documents').update(payload).eq('id', id)); }
  else { ({ error } = await sb.from('documents').insert(payload)); }
  if (error) { toast('Erreur : ' + error.message, 'err'); btn.disabled=false; btn.textContent='Publier'; return; }
  document.getElementById('modal-doc')?.remove();
  toast(id ? 'Document mis à jour ✓' : 'Document publié ✓', 'ok');
  // Notif si nouveau doc
  if (!id) {
    const { data: allUsers } = await sb.from('profiles').select('id, email').eq('actif', true);
    const notifs = (allUsers||[]).filter(u=>u.id!==user.id).map(u=>({
      destinataire_id: u.id,
      destinataire_email: u.email || '',
      sujet: `📄 Nouveau document : ${titre}`,
      corps: `Un nouveau document a été publié : ${titre}`,
      lu: false
    }));
    if (notifs.length) { const {error:e} = await sb.from('notifications').insert(notifs); if(e) console.warn('[notif doc]',e.message); }
    // Email syndic — nouveau document
    await sendEmailDirect('nouvelle_annonce', null, {
      titre, type: 'info',
      contenu: `Nouveau document publié : ${titre} (catégorie : ${DOC_CATS[cat]?.label || cat})`
    });
  }
  await loadDocs();
}

async function deleteDoc(id) {
  if (!confirm('Supprimer ce document définitivement ?')) return;
  await sb.from('documents').delete().eq('id', id);
  document.getElementById('modal-doc')?.remove();
  toast('Document supprimé', 'ok');
  await loadDocs();
}

// ══════════════════════════════════════════════
// VOTES & SONDAGES
// ══════════════════════════════════════════════
