let _contactsCache = [];

async function renderContacts() {
  $('page').innerHTML = `<div style="padding:24px;max-width:680px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><h1>Contacts & Urgences</h1><p>Numéros importants de la résidence</p></div>
      ${isManager() ? `<button class="btn btn-primary" onclick="openContactModal()">+ Ajouter</button>` : ''}
    </div>
    <div id="contacts-list"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
  </div>`;
  await loadAndRenderContacts();
}

async function loadAndRenderContacts() {
  const { data, error } = await sb.from('contacts')
    .select('*').eq('actif', true).order('ordre');
  if (error) { console.warn('[contacts]', error.message); return; }
  _contactsCache = data || [];
  renderContactsList();
}

function renderContactsList() {
  const el = $('contacts-list');
  if (!el) return;
  const cats = {
    urgence:     { label:'🚨 Urgences', bg:'var(--red-light)' },
    prestataire: { label:'🔧 Prestataires', bg:'var(--surface-2)' },
    residence:   { label:'🏠 Résidence', bg:'var(--surface-2)' },
  };
  let html = '';
  for (const [cat, meta] of Object.entries(cats)) {
    const list = _contactsCache.filter(c => c.categorie === cat);
    if (!list.length) continue;
    html += `<div style="font-family:var(--font-head);font-weight:700;font-size:13px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 10px;">${meta.label}</div>`;
    html += list.map(c => `
      <div class="contact-card">
        <div class="contact-ico" style="background:${meta.bg};">${c.ico||'📞'}</div>
        <div class="contact-info">
          <div class="contact-name">${escHtml(c.nom)}</div>
          <div class="contact-role">${escHtml(c.role||'')}${c.telephone?' · <strong>'+escHtml(c.telephone)+'</strong>':''}</div>
          ${c.email ? `<div style="font-size:11px;color:var(--text-3);">${escHtml(c.email)}</div>` : ''}
        </div>
        <div class="contact-actions">
          ${c.telephone ? `<a href="tel:${c.telephone.replace(/\s/g,'')}" class="contact-btn" title="Appeler">📞</a>` : ''}
          ${c.email ? `<a href="mailto:${c.email}" class="contact-btn" title="Email">✉️</a>` : ''}
          ${isManager() ? `<button class="contact-btn" onclick="openContactModal('${c.id}')" title="Modifier">✏️</button>` : ''}
        </div>
      </div>`).join('');
  }
  if (!html) html = emptyState('📞', 'Aucun contact', 'Ajoutez les contacts utiles de la résidence.');
  el.innerHTML = html;
}

function openContactModal(id) {
  const c = id ? _contactsCache.find(x => x.id === id) : null;
  const isEdit = !!c;
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-contact';
  overlay.innerHTML = `<div class="modal" style="max-width:480px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier le contact' : 'Nouveau contact'}</span>
      <button class="mclose" onclick="document.getElementById('modal-contact').remove()">×</button>
    </div>
    <div class="mb">
      <div class="fg-row">
        <div class="fg" style="flex:0 0 70px;">
          <label class="label">Icône</label>
          <input type="text" id="ct-ico" class="input" value="${c?.ico||'📞'}" style="font-size:20px;text-align:center;">
        </div>
        <div class="fg">
          <label class="label">Nom *</label>
          <input type="text" id="ct-nom" class="input" placeholder="Ex: ACAF Ascenseurs" value="${escHtml(c?.nom||'')}">
        </div>
      </div>
      <div class="fg">
        <label class="label">Rôle / Description</label>
        <input type="text" id="ct-role" class="input" placeholder="Ex: Dépannage 24h/24" value="${escHtml(c?.role||'')}">
      </div>
      <div class="fg-row">
        <div class="fg">
          <label class="label">Téléphone</label>
          <input type="tel" id="ct-tel" class="input" placeholder="04 76 XX XX XX" value="${escHtml(c?.telephone||'')}">
        </div>
        <div class="fg">
          <label class="label">Email</label>
          <input type="email" id="ct-email" class="input" placeholder="contact@..." value="${escHtml(c?.email||'')}">
        </div>
      </div>
      <div class="fg-row">
        <div class="fg">
          <label class="label">Catégorie</label>
          <select id="ct-cat" class="select" style="width:100%;">
            <option value="urgence" ${c?.categorie==='urgence'?'selected':''}>🚨 Urgence</option>
            <option value="prestataire" ${c?.categorie==='prestataire'?'selected':''}>🔧 Prestataire</option>
            <option value="residence" ${(!c||c?.categorie==='residence')?'selected':''}>🏠 Résidence</option>
          </select>
        </div>
        <div class="fg">
          <label class="label">Ordre d'affichage</label>
          <input type="number" id="ct-ordre" class="input" value="${c?.ordre||0}" min="0">
        </div>
      </div>
    </div>
    <div class="mf">
      ${isEdit ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);margin-right:auto;" onclick="deleteContact('${c.id}')">🗑 Supprimer</button>` : ''}
      <button class="btn btn-secondary" onclick="document.getElementById('modal-contact').remove()">Annuler</button>
      <button class="btn btn-primary" onclick="saveContact('${c?.id||''}')">
        ${isEdit ? 'Enregistrer' : 'Ajouter'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => $('ct-nom')?.focus(), 50);
}

async function saveContact(id) {
  const nom = $('ct-nom')?.value.trim();
  if (!nom) { toast('Nom requis', 'err'); return; }
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
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  document.getElementById('modal-contact')?.remove();
  toast(id ? 'Contact modifié ✓' : 'Contact ajouté ✓', 'ok');
  await loadAndRenderContacts();
}

async function deleteContact(id) {
  if (!confirm('Supprimer ce contact ?')) return;
  await sb.from('contacts').update({ actif: false }).eq('id', id);
  document.getElementById('modal-contact')?.remove();
  toast('Contact supprimé', 'ok');
  await loadAndRenderContacts();
}

// ── ONBOARDING — Nouveaux résidents ──
