// ════════════════════════════════════════════════════════════════
//  TICKET FORM (Création d'un signalement)
//  assets/js/features/tickets/ticket-form.js
// ════════════════════════════════════════════════════════════════

// Catégories où "Critique" n'a pas de sens — limitées à Important max
const CAT_MAX_URGENCE = {
  proprete: 'important', espaces_verts: 'important',
  parking: 'important', autre: 'important', serrurerie: 'important'
};

const TICKET_DRAFT_KEY = 'coprosync_ticket_draft_v1';
let _ticketDraftBound = false;
// (Correction : urgencySelected est déjà géré globalement dans state.js)
let photoFiles = []; // tableau de File objects

function selectCat(el) {
  document.querySelectorAll('.cat-opt').forEach(c => c.classList.remove('selected', 'active'));
  el.classList.add('selected', 'active');
  
  // Style visuel de sélection propre
  document.querySelectorAll('.cat-opt').forEach(c => {
    if (!c.classList.contains('selected')) {
      c.style.background = 'var(--bg-2)';
      c.style.borderColor = 'var(--border)';
    } else {
      c.style.background = 'var(--primary-light)';
      c.style.borderColor = 'var(--primary)';
    }
  });

  const cat = el.dataset.cat;
  const maxU = CAT_MAX_URGENCE[cat];
  
  // Si catégorie bénigne → rétrograde à Normal si Critique était sélectionné
  if (maxU && urgencySelected === 'critique') setUrgency('important');
  
  // Cache/affiche Critique selon catégorie ET rôle
  const critEl = $('urg-critique');
  if (critEl) {
    const isManagerUser = typeof isManager === 'function' ? isManager() : false;
    const canCrit = isManagerUser && !CAT_MAX_URGENCE[cat];
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
  const zonesMap = (typeof COPRO !== 'undefined' && COPRO.zones) ? COPRO.zones : {};

  // Logique contextuelle de localisation
  if (cat === 'ascenseur' && bat.startsWith('Tour')) {
    options = [`${bat} — Ascenseur impair`, `${bat} — Ascenseur pair`];
  } else if (zonesMap[cat] && zonesMap[cat].length > 0) {
    if (bat.startsWith('Tour')) {
      options = zonesMap[cat].filter(z =>
        z.includes(bat) || (!z.includes('Tour 13') && !z.includes('Tour 15') && !z.includes('Tour 17') && !z.includes('Tour 19'))
      );
    } else {
      options = zonesMap[cat];
    }
  } else if (bat.startsWith('Tour')) {
    // Zone libre par étage pour bâtiments standards
    options = ['Hall RDC', ...Array.from({length:15},(_,i)=>`Étage ${i+1}`), 'Couloir commun', 'Cave / sous-sol'];
  }

  sel.innerHTML = '<option value="">Préciser la zone...</option>' +
    options.map(o => `<option value="${o}">${o}</option>`).join('');
}

function openNewTicket() {
  setUrgency('normal');
  
  // Reset UI
  document.querySelectorAll('.cat-opt').forEach(c => {
    c.classList.remove('selected', 'active');
    c.style.background = 'var(--bg-2)';
    c.style.borderColor = 'var(--border)';
  });
  
  ['t-titre','t-desc','t-zone-free'].forEach(id => { 
    const el = document.getElementById(id); 
    if(el) el.value=''; 
  });
  
  if(document.getElementById('t-bat')) document.getElementById('t-bat').value = '';
  if(document.getElementById('t-zone-select')) document.getElementById('t-zone-select').innerHTML = '<option value="">Sélectionner bâtiment d\'abord</option>';
  
  resetPhotos();
  
  // Permissions & UI
  const isManagerUser = typeof isManager === 'function' ? isManager() : false;
  const critEl = $('urg-critique');
  if (critEl) critEl.style.display = isManagerUser ? '' : 'none';
  
  const hint = $('urgence-hint');
  if (hint) hint.style.display = isManagerUser ? 'none' : 'block';
  
  bindTicketDraftListeners();

  // Restauration Brouillon
  const draft = getTicketDraft();
  if (draft && (Date.now() - (draft.updatedAt || 0)) < 7 * 24 * 60 * 60 * 1000) {
    let restored = false;
    if ($('t-titre') && draft.titre) { $('t-titre').value = draft.titre; restored = true; }
    if ($('t-desc') && draft.desc) $('t-desc').value = draft.desc;
    if ($('t-bat') && draft.batiment) $('t-bat').value = draft.batiment;
    
    const catEl = draft.categorie ? document.querySelector(`.cat-opt[data-cat="${draft.categorie}"]`) : null;
    if (catEl) selectCat(catEl);
    else updateZoneOptions();
    
    if ($('t-zone-select') && draft.zoneSelect) $('t-zone-select').value = draft.zoneSelect;
    if ($('t-zone-free') && draft.zoneFree) $('t-zone-free').value = draft.zoneFree;
    
    if (draft.urgence) setUrgency(draft.urgence);
    
    if (restored && typeof toast === 'function') toast('Brouillon restauré', 'ok');
  }
  
  if (typeof openModal === 'function') openModal('m-ticket');
}

function getTicketDraft() {
  try {
    const raw = localStorage.getItem(TICKET_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
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
  const isManagerUser = typeof isManager === 'function' ? isManager() : false;
  if (u === 'critique' && !isManagerUser) return;
  
  urgencySelected = u;
  ['critique','important','normal'].forEach(x => {
    const el = $(`urg-${x}`);
    if (el) {
      if (u === x) {
        el.className = `urgency-opt sel-${x}`;
      } else {
        el.className = 'urgency-opt';
      }
    }
  });
  saveTicketDraft();
}

function handlePhotos(e) {
  const newFiles = Array.from(e.target.files || []);
  e.target.value = ''; // reset pour permettre re-sélection
  
  const remaining = 5 - photoFiles.length;
  if (remaining <= 0) { 
    if (typeof toast === 'function') toast('Maximum 5 photos atteint', 'warn'); 
    return; 
  }
  
  const toAdd = newFiles.slice(0, remaining);
  if (newFiles.length > remaining && typeof toast === 'function') {
    toast(`Maximum 5 photos — ${newFiles.length - remaining} ignorée(s)`, 'warn');
  }
  
  toAdd.forEach(f => {
    // Vérification basique du type de fichier
    if (!f.type.startsWith('image/')) {
      if (typeof toast === 'function') toast('Seules les images sont autorisées', 'err');
      return;
    }
    
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
  thumb.style.cssText = 'position:relative; border-radius:8px; overflow:hidden; aspect-ratio:1; box-shadow:0 2px 4px rgba(0,0,0,0.1); border:1px solid var(--border);';
  
  thumb.innerHTML = `
    <img src="${src}" alt="Photo jointe" style="width:100%; height:100%; object-fit:cover;">
    <button type="button" onclick="removePhoto(${idx})" style="position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,0.6); color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; line-height:1;">×</button>`;
    
  grid.appendChild(thumb);
  updatePhotoCount();
}

function removePhoto(idx) {
  photoFiles[idx] = null; // marque comme supprimé sans décaler les index
  const thumb = $(`thumb-${idx}`);
  if (thumb) thumb.remove();
  updatePhotoCount();
}

function updatePhotoCount() {
  const count = photoFiles.filter(Boolean).length;
  const el = $('photo-count');
  if (!el) return;
  
  if (count === 0) { 
    el.style.display = 'none'; 
    return; 
  }
  
  el.style.display = 'block';
  el.style.fontSize = '12px';
  el.style.color = 'var(--text-3)';
  el.style.marginTop = '8px';
  el.textContent = `📷 ${count} photo${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''} (max 5)`;
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

  if (!titre) { toast('Le titre est obligatoire pour résumer le problème', 'err'); return; }
  if (!batiment) { toast('Veuillez indiquer dans quel bâtiment / zone a lieu l\'incident', 'err'); return; }

  const zoneSelect = document.getElementById('t-zone-select')?.value || '';
  const zoneFree = document.getElementById('t-zone-free')?.value.trim() || '';
  const zone = [zoneSelect, zoneFree].filter(Boolean).join(' — ') || null;

  // Calcul des coordonnées GPS contextuelles (Fallback sur la résidence)
  const tourCoordsMap = (typeof TOUR_COORDS !== 'undefined') ? TOUR_COORDS : {};
  const baseLat = (typeof COPRO !== 'undefined' && COPRO.lat) ? COPRO.lat : 45.2;
  const baseLng = (typeof COPRO !== 'undefined' && COPRO.lng) ? COPRO.lng : 5.7;
  
  const coords = tourCoordsMap[batiment] || [baseLat + (Math.random()-.5)*.002, baseLng + (Math.random()-.5)*.002];

  const btn = document.getElementById('submit-ticket-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block; width:16px; height:16px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px; vertical-align:middle;"></span>Envoi...';
  }

  let photo_url = null;
  const photos_urls = [];

  try {
    // 1. Insertion Base de Données
    const ticket = {
      titre, batiment, zone,
      urgence: urgencySelected || 'normal',
      categorie: categorie || 'autre',
      description: document.getElementById('t-desc')?.value || null,
      auteur_id: user.id,
      photo_url: null,
      photos_urls: [],
      statut: 'nouveau',
      lat: coords[0], lng: coords[1],
    };

    const { data, error } = await sb.from('tickets').insert(ticket).select().single();
    if (error) throw error;

    // 2. Gestion des Photos (Storage)
    const filesToUpload = photoFiles.filter(Boolean);
    if (filesToUpload.length > 0) {
      if (typeof toast === 'function') toast('Téléchargement des photos...', 'ok');
      
      const uploadPromises = filesToUpload.map(async (f, i) => {
        const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${data.id}/photo-${i+1}.${ext}`;
        
        const { error: upErr } = await sb.storage.from('tickets').upload(path, f, { upsert: true, contentType: f.type || 'image/jpeg' });
        if (!upErr) {
          const { data: urlData } = sb.storage.from('tickets').getPublicUrl(path);
          if (urlData?.publicUrl) return urlData.publicUrl;
        }
        return null;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      
      // 3. Mise à jour du ticket avec les URLs d'images
      if (uploadedUrls.length > 0) {
        await sb.from('tickets').update({
          photo_url: uploadedUrls[0],
          photos_urls: uploadedUrls
        }).eq('id', data.id);
        
        data.photo_url = uploadedUrls[0];
        data.photos_urls = uploadedUrls;
      }
    }

    // 4. Logs & Notifications Asynchrones
    const safeName = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Résident';
    
    if (typeof addLog === 'function') await addLog('Ticket créé', 'ticket', data.id, { titre, urgence: urgencySelected, batiment });
    
    if (typeof sendEmailNotif === 'function') {
      sendEmailNotif(urgencySelected === 'critique' ? 'ticket_critique' : 'nouveau_ticket', { ...data, auteur_nom: safeName }).catch(console.warn);
    }

    if (typeof publishFeedEvent === 'function') {
      const urgenceLabel = urgencySelected === 'critique' ? '🔴 Critique' : urgencySelected === 'important' ? '🟠 Important' : '🔵 Normal';
      publishFeedEvent('ticket', `🔧 Nouveau signalement ${urgenceLabel} : ${titre}${batiment ? ' — '+batiment : ''}`).catch(console.warn);
    }

    if (typeof pushNotif === 'function') {
      pushNotif(
        urgencySelected === 'critique' ? '🚨 Signalement critique !' : 'Nouveau signalement',
        `${titre}${batiment ? ' — ' + batiment : ''}`,
        urgencySelected === 'critique' ? 'critique' : 'nouveau_ticket',
        data.id
      ).catch(console.warn);
    }

    // 5. Nettoyage et UI
    clearTicketDraft();
    if (typeof closeModal === 'function') closeModal('m-ticket');
    if (typeof toast === 'function') toast('Signalement envoyé avec succès !', 'ok');
    
    if (typeof loadTickets === 'function') await loadTickets();
    if (typeof updateBadges === 'function') updateBadges();
    
    if (typeof currentPage !== 'undefined') {
      if (currentPage === 'tickets' && typeof renderTickets === 'function') renderTickets();
      if (currentPage === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
      if (currentPage === 'map' && typeof renderMapPage === 'function') renderMapPage(); // Update la map direct si on y est
    }

  } catch (err) {
    console.error('Submit Ticket Error:', err);
    if (typeof toast === 'function') toast('Impossible de créer le signalement : ' + err.message, 'err');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>Créer le signalement';
    }
  }
}