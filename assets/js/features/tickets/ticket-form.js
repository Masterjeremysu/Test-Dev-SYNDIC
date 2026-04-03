// ── TICKET FORM — Localisation contextuelle ──
function selectCat(el) {
  document.querySelectorAll('.cat-opt').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  // Si catégorie bénigne → rétrograde à Normal si Critique était sélectionné
  const cat = el.dataset.cat;
  const maxU = CAT_MAX_URGENCE[cat];
  if (maxU && urgencySelected === 'critique') setUrgency('important');
  // Cache/affiche Critique selon catégorie ET rôle
  const critEl = $('urg-critique');
  if (critEl) {
    const canCrit = isManager() && !CAT_MAX_URGENCE[cat];
    critEl.style.display = canCrit ? '' : 'none';
  }
  updateZoneOptions();
  saveTicketDraft();
}

function updateZoneOptions() {
  const catEl = document.querySelector('.cat-opt.selected');
  const cat = catEl ? catEl.dataset.cat : 'autre';
  const bat = document.getElementById('t-bat')?.value || '';
  const sel = document.getElementById('t-zone-select');
  if (!sel) return;

  let options = [];

  // Si une tour est sélectionnée et catégorie ascenseur → filtrer par tour
  if (cat === 'ascenseur' && bat.startsWith('Tour')) {
    options = [`${bat} — Ascenseur impair`, `${bat} — Ascenseur pair`];
  } else if (COPRO.zones[cat] && COPRO.zones[cat].length > 0) {
    // Si tour sélectionnée, filtrer les options qui concernent cette tour ou génériques
    if (bat.startsWith('Tour')) {
      options = COPRO.zones[cat].filter(z =>
        z.includes(bat) || (!z.includes('Tour 13') && !z.includes('Tour 15') && !z.includes('Tour 17') && !z.includes('Tour 19'))
      );
    } else {
      options = COPRO.zones[cat];
    }
  } else if (bat.startsWith('Tour')) {
    // Zone libre par étage pour catégories dans tour
    options = ['Hall RDC', ...Array.from({length:15},(_,i)=>`Étage ${i+1}`), 'Couloir commun', 'Cave / sous-sol'];
  }

  sel.innerHTML = '<option value="">Préciser la zone...</option>' +
    options.map(o => `<option value="${o}">${o}</option>`).join('');
}

// ── NEW TICKET ──
function openNewTicket() {
  setUrgency('normal');
  document.querySelectorAll('.cat-opt').forEach(c => c.classList.remove('selected'));
  ['t-titre','t-desc','t-zone-free'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  if(document.getElementById('t-bat')) document.getElementById('t-bat').value = '';
  if(document.getElementById('t-zone-select')) document.getElementById('t-zone-select').innerHTML = '<option value="">Sélectionner zone d\'abord</option>';
  resetPhotos();
  photoFile = null;
  // Cache/affiche Critique et hint selon rôle
  const critEl = $('urg-critique');
  if (critEl) critEl.style.display = isManager() ? '' : 'none';
  const hint = $('urgence-hint');
  if (hint) hint.style.display = isManager() ? 'none' : 'block';
  bindTicketDraftListeners();

  const draft = getTicketDraft();
  if (draft && (Date.now() - (draft.updatedAt || 0)) < 7 * 24 * 60 * 60 * 1000) {
    if ($('t-titre')) $('t-titre').value = draft.titre || '';
    if ($('t-desc')) $('t-desc').value = draft.desc || '';
    if ($('t-bat')) $('t-bat').value = draft.batiment || '';
    const catEl = draft.categorie ? document.querySelector(`.cat-opt[data-cat="${draft.categorie}"]`) : null;
    if (catEl) selectCat(catEl);
    updateZoneOptions();
    if ($('t-zone-select')) $('t-zone-select').value = draft.zoneSelect || '';
    if ($('t-zone-free')) $('t-zone-free').value = draft.zoneFree || '';
    if (draft.urgence) setUrgency(draft.urgence);
    if (draft.titre || draft.desc) toast('Brouillon de ticket restauré', 'warn');
  }
  openModal('m-ticket');
}

// Catégories où "Critique" n'a pas de sens — limitées à Important max
const CAT_MAX_URGENCE = {
  proprete: 'important', espaces_verts: 'important',
  parking: 'important', autre: 'important', serrurerie: 'important'
};

const TICKET_DRAFT_KEY = 'coprosync_ticket_draft_v1';
let _ticketDraftBound = false;

function getTicketDraft() {
  try {
    const raw = localStorage.getItem(TICKET_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTicketDraft() {
  const draft = {
    titre: $('t-titre')?.value || '',
    batiment: $('t-bat')?.value || '',
    zoneSelect: $('t-zone-select')?.value || '',
    zoneFree: $('t-zone-free')?.value || '',
    desc: $('t-desc')?.value || '',
    categorie: document.querySelector('.cat-opt.selected')?.dataset?.cat || '',
    urgence: urgencySelected || 'normal',
    updatedAt: Date.now()
  };
  try { localStorage.setItem(TICKET_DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function clearTicketDraft() {
  try { localStorage.removeItem(TICKET_DRAFT_KEY); } catch {}
}

function bindTicketDraftListeners() {
  if (_ticketDraftBound) return;
  _ticketDraftBound = true;
  ['t-titre', 't-bat', 't-zone-select', 't-zone-free', 't-desc'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', saveTicketDraft);
    el.addEventListener('change', saveTicketDraft);
  });
}

function setUrgency(u) {
  // Copropriétaires ne peuvent jamais mettre Critique
  if (u === 'critique' && !isManager()) return;
  urgencySelected = u;
  ['critique','important','normal'].forEach(x => {
    const el = $(`urg-${x}`);
    if (el) el.className = `urgency-opt${u===x ? ' sel-'+x : ''}`;
  });
  saveTicketDraft();
}

let photoFiles = []; // tableau de File objects

function handlePhotos(e) {
  const newFiles = Array.from(e.target.files || []);
  e.target.value = ''; // reset pour permettre re-sélection
  const remaining = 5 - photoFiles.length;
  if (remaining <= 0) { toast('Maximum 5 photos atteint', 'warn'); return; }
  const toAdd = newFiles.slice(0, remaining);
  if (newFiles.length > remaining) toast(`Maximum 5 photos — ${newFiles.length - remaining} ignorée(s)`, 'warn');
  toAdd.forEach(f => {
    photoFiles.push(f);
    const idx = photoFiles.length - 1;
    const reader = new FileReader();
    reader.onload = ev => addPhotoThumb(ev.target.result, idx);
    reader.readAsDataURL(f);
  });
}

function addPhotoThumb(src, idx) {
  const grid = $('photo-grid');
  if (!grid) return;
  const thumb = document.createElement('div');
  thumb.className = 'photo-thumb';
  thumb.id = `thumb-${idx}`;
  thumb.innerHTML = `
    <img src="${src}" alt="Photo ${idx+1}" onclick="window.open('${src}','_blank')">
    <button class="photo-thumb-del" onclick="removePhoto(${idx})" title="Supprimer">×</button>`;
  grid.appendChild(thumb);
  updatePhotoCount();
}

function removePhoto(idx) {
  photoFiles[idx] = null; // marque comme supprimé
  const thumb = $(`thumb-${idx}`);
  if (thumb) thumb.remove();
  updatePhotoCount();
}

function updatePhotoCount() {
  const count = photoFiles.filter(Boolean).length;
  const el = $('photo-count');
  if (!el) return;
  if (count === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.textContent = `${count} photo${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''} · ${5 - count} restante${5 - count > 1 ? 's' : ''}`;
}

function resetPhotos() {
  photoFiles = [];
  const grid = $('photo-grid');
  if (grid) grid.innerHTML = '';
  const count = $('photo-count');
  if (count) count.style.display = 'none';
}

async function submitTicket() {
  const titre = document.getElementById('t-titre')?.value.trim();
  const batiment = document.getElementById('t-bat')?.value;
  const catEl = document.querySelector('.cat-opt.selected');
  const categorie = catEl ? catEl.dataset.cat : null;

  if (!titre) { toast('Le titre est obligatoire', 'err'); return; }
  if (!batiment) { toast('Choisissez une zone', 'err'); return; }

  // Construire la zone depuis le select + champ libre
  const zoneSelect = document.getElementById('t-zone-select')?.value || '';
  const zoneFree = document.getElementById('t-zone-free')?.value.trim() || '';
  const zone = [zoneSelect, zoneFree].filter(Boolean).join(' — ') || null;

  // Coordonnées depuis TOUR_COORDS ou coordonnées de la résidence
  const coords = TOUR_COORDS[batiment] || [COPRO.lat + (Math.random()-.5)*.002, COPRO.lng + (Math.random()-.5)*.002];

  const btn = document.getElementById('submit-ticket-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Envoi...';

  let photo_url = null;
  const photos_urls = [];

  // 1. Crée le ticket d'abord (sans photos) pour avoir l'ID
  const ticket = {
    titre,
    batiment,
    zone,
    urgence: urgencySelected,
    categorie: categorie || 'autre',
    description: document.getElementById('t-desc')?.value || null,
    auteur_id: user.id,
    photo_url: null,
    photos_urls: [],
    statut: 'nouveau',
    lat: coords[0],
    lng: coords[1],
  };

  const { data, error } = await sb.from('tickets').insert(ticket).select().single();
  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>Créer le signalement';

  if (error) { toast('Erreur: ' + error.message, 'err'); return; }

  // 2. Upload les photos dans le dossier du ticket
  const filesToUpload = photoFiles.filter(Boolean);
  if (filesToUpload.length > 0) {
    toast('Upload des photos...', 'ok');
    for (let i = 0; i < filesToUpload.length; i++) {
      const f = filesToUpload[i];
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      // Dossier organisé : tickets/{ticket_id}/photo-{i+1}.{ext}
      const path = `${data.id}/photo-${i+1}.${ext}`;
      const { error: upErr } = await sb.storage.from('tickets').upload(path, f, {
        upsert: true,
        contentType: f.type || 'image/jpeg'
      });
      if (!upErr) {
        const { data: urlData } = sb.storage.from('tickets').getPublicUrl(path);
        if (urlData?.publicUrl) photos_urls.push(urlData.publicUrl);
      } else {
        warn('[upload photo]', upErr.message);
      }
    }
    // 3. Met à jour le ticket avec les URLs
    if (photos_urls.length > 0) {
      await sb.from('tickets').update({
        photo_url: photos_urls[0],
        photos_urls: photos_urls
      }).eq('id', data.id);
      data.photo_url = photos_urls[0];
      data.photos_urls = photos_urls;
    }
  }

  await addLog('Ticket créé', 'ticket', data.id, { titre, urgence: urgencySelected, batiment });
  await sendEmailNotif(urgencySelected === 'critique' ? 'ticket_critique' : 'nouveau_ticket', {
    ...data,
    auteur_nom: displayNameFromProfile(profile, user?.email)
  });

  // Publie dans le feed communautaire
  const urgenceLabel = urgencySelected === 'critique' ? '🔴 Critique' : urgencySelected === 'important' ? '🟠 Important' : '🔵 Normal';
  await publishFeedEvent('ticket', `🔧 Nouveau signalement ${urgenceLabel} : ${titre}${batiment ? ' — '+batiment : ''}`);

  // Notif push locale
  await pushNotif(
    urgencySelected === 'critique' ? '🚨 Signalement critique !' : 'Nouveau signalement',
    `${titre}${batiment ? ' — ' + batiment : ''}`,
    urgencySelected === 'critique' ? 'critique' : 'nouveau_ticket',
    data.id
  );

  await loadTickets();
  updateBadges();
  clearTicketDraft();
  closeModal('m-ticket');
  toast('Signalement créé avec succès', 'ok');
  if (currentPage === 'tickets') renderTickets();
  if (currentPage === 'dashboard') renderDashboard();
}

// ── MAP ──
