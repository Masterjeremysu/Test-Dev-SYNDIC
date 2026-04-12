// ════════════════════════════════════════════════════════════════
//  CONTACTS & URGENCES FEATURE
//  assets/js/features/contacts/contacts.js
// ════════════════════════════════════════════════════════════════

let _contactsCache = [];
let _contactsSearch = '';

async function renderContacts() {
  $('page').innerHTML = `
  <div style="padding:24px;max-width:800px;margin:0 auto;">
    
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text-1);margin:0;">Contacts & Urgences</h1>
        <p style="color:var(--text-2);margin:4px 0 0;font-size:14px;">Numéros importants de la résidence</p>
      </div>
      ${(typeof canManageContacts === 'function' && canManageContacts()) ? `<button class="btn btn-primary" onclick="openContactModal()">+ Ajouter</button>` : ''}
    </div>

    <div style="margin-bottom: 24px; position: relative;">
      <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px;">🔍</span>
      <input type="search" class="input" placeholder="Rechercher un contact, un métier, un nom..." 
             value="${_contactsSearch}" 
             oninput="_contactsSearch = this.value; renderContactsList();" 
             style="padding-left:40px; margin:0; width:100%; border-radius:12px; background:var(--bg-1);">
    </div>

    <div id="contacts-list">
      <div style="text-align:center;padding:40px;color:var(--text-3);">
        <div class="spinner" style="margin:0 auto 12px;"></div>
        Chargement des contacts…
      </div>
    </div>
  </div>`;
  
  await loadAndRenderContacts();
}

async function loadAndRenderContacts() {
  try {
    const { data, error } = await sb.from('contacts')
      .select('*')
      .eq('actif', true)
      .order('ordre');
      
    if (error) throw error;
    
    _contactsCache = data || [];
    renderContactsList();
  } catch (error) {
    console.error('[contacts]', error.message);
    const el = $('contacts-list');
    if (el) el.innerHTML = emptyState('⚠️', 'Erreur de connexion', 'Impossible de charger les contacts. Veuillez vérifier votre réseau.');
  }
}

function renderContactsList() {
  const el = $('contacts-list');
  if (!el) return;

  const cats = {
    urgence:     { label:'🚨 Urgences', bg:'var(--red-light)' },
    prestataire: { label:'🔧 Prestataires', bg:'var(--blue-light)' },
    residence:   { label:'🏠 Résidence', bg:'var(--surface-2)' },
  };

  // Filtrage par recherche
  const searchStr = _contactsSearch.toLowerCase().trim();
  const filteredContacts = _contactsCache.filter(c => 
    (c.nom || '').toLowerCase().includes(searchStr) ||
    (c.role || '').toLowerCase().includes(searchStr) ||
    (c.telephone || '').toLowerCase().includes(searchStr) ||
    (c.email || '').toLowerCase().includes(searchStr)
  );

  if (filteredContacts.length === 0) {
    el.innerHTML = emptyState('📞', 'Aucun contact trouvé', _contactsSearch ? 'Aucun résultat pour votre recherche.' : 'Ajoutez les contacts utiles de la résidence.');
    return;
  }

  let html = '';
  
  for (const [catKey, meta] of Object.entries(cats)) {
    const list = filteredContacts.filter(c => c.categorie === catKey);
    if (!list.length) continue;
    
    html += `<div style="font-family:var(--font-head); font-weight:800; font-size:14px; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; margin:24px 0 12px; padding-bottom:6px; border-bottom:2px solid var(--bg-2); display:inline-block;">${meta.label}</div>`;
    
    html += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px;">` + 
      list.map(c => `
      <div class="card" style="padding:16px; display:flex; gap:16px; align-items:center; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='none';this.style.boxShadow='none';">
        
        <div style="font-size:28px; background:${meta.bg}; width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:14px; flex-shrink:0;">
          ${c.ico || '📞'}
        </div>
        
        <div style="flex:1; min-width:0;">
          <div style="font-weight:800; color:var(--text-1); font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(c.nom)}</div>
          ${c.role ? `<div style="font-size:13.5px; color:var(--text-2); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(c.role)}</div>` : ''}
          
          ${c.telephone ? `
            <a href="tel:${c.telephone.replace(/\s/g,'')}" style="display:inline-flex; align-items:center; gap:6px; font-size:14.5px; font-weight:700; color:var(--primary); margin-top:6px; text-decoration:none; background:var(--primary-light); padding:4px 10px; border-radius:20px;">
              📞 ${escHtml(c.telephone)}
            </a>` : ''}
            
          ${c.email ? `
            <div style="margin-top:6px;">
              <a href="mailto:${c.email}" style="font-size:13px; color:var(--text-3); text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                ✉️ ${escHtml(c.email)}
              </a>
            </div>` : ''}
        </div>
        
        ${(typeof canManageContacts === 'function' && canManageContacts()) ? `
        <div style="flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" onclick="openContactModal('${c.id}')" title="Modifier" style="padding:8px;">✏️</button>
        </div>` : ''}
        
      </div>`).join('') + `</div>`;
  }
  
  el.innerHTML = html;
}

function openContactModal(id) {
  const c = id ? _contactsCache.find(x => x.id === id) : null;
  const isEdit = !!c;
  
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-contact';
  
  overlay.innerHTML = `
  <div class="modal" style="max-width:520px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier le contact' : 'Nouveau contact'}</span>
      <button class="mclose" onclick="document.getElementById('modal-contact').remove()">×</button>
    </div>
    <div class="mb">
      
      <div class="fg-row">
        <div class="fg" style="flex:0 0 80px;">
          <label class="label">Icône</label>
          <input type="text" id="ct-ico" class="input" value="${c?.ico||'📞'}" style="font-size:24px; text-align:center; padding:0;">
        </div>
        <div class="fg" style="flex:1;">
          <label class="label">Nom de l'entité / contact *</label>
          <input type="text" id="ct-nom" class="input" placeholder="Ex: ACAF Ascenseurs" value="${escHtml(c?.nom||'')}">
        </div>
      </div>
      
      <div class="fg">
        <label class="label">Rôle / Description courte</label>
        <input type="text" id="ct-role" class="input" placeholder="Ex: Dépannage 24h/24, gardien..." value="${escHtml(c?.role||'')}">
      </div>
      
      <div class="fg-row">
        <div class="fg">
          <label class="label">Téléphone</label>
          <input type="tel" id="ct-tel" class="input" placeholder="Ex: 04 76 XX XX XX" value="${escHtml(c?.telephone||'')}">
        </div>
        <div class="fg">
          <label class="label">Email</label>
          <input type="email" id="ct-email" class="input" placeholder="contact@exemple.com" value="${escHtml(c?.email||'')}">
        </div>
      </div>
      
      <div class="fg-row" style="margin-top:8px;">
        <div class="fg">
          <label class="label">Catégorie</label>
          <select id="ct-cat" class="select" style="width:100%;">
            <option value="urgence" ${c?.categorie==='urgence'?'selected':''}>🚨 Urgence absolue</option>
            <option value="prestataire" ${c?.categorie==='prestataire'?'selected':''}>🔧 Prestataire d'entretien</option>
            <option value="residence" ${(!c||c?.categorie==='residence')?'selected':''}>🏠 Vie de la résidence</option>
          </select>
        </div>
        <div class="fg">
          <label class="label">Ordre d'affichage</label>
          <input type="number" id="ct-ordre" class="input" value="${c?.ordre||0}" min="0" placeholder="0 = En premier">
        </div>
      </div>
      
    </div>
    <div class="mf" style="justify-content: ${isEdit ? 'space-between' : 'flex-end'};">
      ${isEdit ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteContact('${c.id}')">🗑 Supprimer</button>` : ''}
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-contact').remove()">Annuler</button>
        <button class="btn btn-primary" id="btn-save-contact" onclick="saveContact('${c?.id||''}')">
          ${isEdit ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </div>
  </div>`;
  
  document.body.appendChild(overlay);
  setTimeout(() => $('ct-nom')?.focus(), 100); // Focus automatique pour aller plus vite
}

async function saveContact(id) {
  const nom = $('ct-nom')?.value.trim();
  if (!nom) { toast('Le nom du contact est requis', 'err'); return; }
  
  const btn = $('btn-save-contact');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const payload = {
      nom,
      ico:       $('ct-ico')?.value.trim() || '📞',
      role:      $('ct-role')?.value.trim() || null,
      telephone: $('ct-tel')?.value.trim() || null,
      email:     $('ct-email')?.value.trim() || null,
      categorie: $('ct-cat')?.value || 'residence',
      ordre:     parseInt($('ct-ordre')?.value) || 0,
      actif:     true,
    };

    let error;
    if (id) {
      ({ error } = await sb.from('contacts').update(payload).eq('id', id));
    } else {
      ({ error } = await sb.from('contacts').insert(payload));
    }

    if (error) throw error;

    document.getElementById('modal-contact')?.remove();
    toast(id ? 'Contact modifié avec succès ✓' : 'Nouveau contact ajouté ✓', 'ok');
    
    await loadAndRenderContacts();
  } catch (err) {
    toast('Erreur lors de la sauvegarde : ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = id ? 'Enregistrer' : 'Ajouter'; }
  }
}

async function deleteContact(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce contact ?')) return;
  
  try {
    const { error } = await sb.from('contacts').update({ actif: false }).eq('id', id);
    if (error) throw error;
    
    document.getElementById('modal-contact')?.remove();
    toast('Contact supprimé', 'ok');
    
    await loadAndRenderContacts();
  } catch (err) {
    toast('Impossible de supprimer le contact : ' + err.message, 'err');
  }
}
