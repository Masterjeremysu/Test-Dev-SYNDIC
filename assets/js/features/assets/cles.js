// ════════════════════════════════════════════════════════════════
//  CLÉS FEATURE
//  assets/js/features/assets/cles.js
// ════════════════════════════════════════════════════════════════

let _clesSearch = '';
let _clesFilter = 'all'; // 'all', 'disponible', 'sortie'

function renderCles() {
  const page = $('page');
  if (!page) return;

  const total = cache.cles?.length || 0;
  const sorties = cache.cles?.filter(c => c.statut === 'sortie').length || 0;

  // Filtrage en mémoire
  let list = cache.cles || [];
  if (_clesFilter !== 'all') {
    list = list.filter(c => c.statut === _clesFilter);
  }
  if (_clesSearch) {
    list = list.filter(c => 
      (c.nom || '').toLowerCase().includes(_clesSearch) || 
      (c.detenteur_nom || '').toLowerCase().includes(_clesSearch) ||
      (c.notes || '').toLowerCase().includes(_clesSearch)
    );
  }

  page.innerHTML = `
  <div style="padding:24px; max-width:1100px; margin:0 auto;">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text-1);margin:0;">Gestion des clés</h1>
        <p style="color:var(--text-2);margin:4px 0 0;font-size:14px;">${sorties} clé(s) sortie(s) sur ${total}</p>
      </div>
      ${(typeof canManageCles === 'function' && canManageCles()) ? `<button class="btn btn-primary" onclick="openNewCleModal()">+ Ajouter une clé</button>` : ''}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; align-items:center; background:var(--bg-1); padding:12px; border-radius:var(--r-md); border:1px solid var(--border);">
      <div style="flex:1; min-width:200px; position:relative;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px;">🔍</span>
        <input type="search" class="input" placeholder="Chercher une clé, un nom..." value="${_clesSearch}" oninput="_clesSearch = this.value.toLowerCase(); renderCles();" style="width:100%; margin:0; padding-left:36px;">
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm ${_clesFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}" onclick="_clesFilter='all'; renderCles();">Toutes</button>
        <button class="btn btn-sm ${_clesFilter === 'disponible' ? 'btn-secondary' : 'btn-ghost'}" onclick="_clesFilter='disponible'; renderCles();" style="${_clesFilter === 'disponible' ? 'color:inherit;' : 'color:var(--green);'}">Dispos</button>
        <button class="btn btn-sm ${_clesFilter === 'sortie' ? 'btn-secondary' : 'btn-ghost'}" onclick="_clesFilter='sortie'; renderCles();" style="${_clesFilter === 'sortie' ? 'color:inherit;' : 'color:var(--orange);'}">Sorties</button>
      </div>
    </div>

    <div class="keys-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:16px;">
      ${list.length === 0 ? 
        `<div style="grid-column:1/-1;">${emptyState('🔑', 'Aucune clé trouvée', 'Aucune clé ne correspond à vos critères de recherche.')}</div>` : 
        list.map(c => _renderCleCard(c)).join('')}
    </div>
  </div>`;
}

function _renderCleCard(c) {
  const isSortie = c.statut === 'sortie';
  // Protection des données textes
  const safeNom = typeof escHtml === 'function' ? escHtml(c.nom) : c.nom;
  const safeDetenteur = typeof escHtml === 'function' ? escHtml(c.detenteur_nom||'?') : (c.detenteur_nom||'?');
  const safeNotes = typeof escHtml === 'function' ? escHtml(c.notes||'') : (c.notes||'');

  return `
  <div class="card" style="padding:16px; position:relative; display:flex; gap:14px; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='none';this.style.boxShadow='none';">
    <div style="font-size:24px; padding:12px; background:var(--bg-2); border-radius:12px; height:fit-content; display:flex; align-items:center; justify-content:center;">🔑</div>
    
    <div style="flex:1; min-width:0;">
      <div style="font-weight:700; color:var(--text-1); font-size:15px; margin-bottom:4px; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safeNom}</div>
      
      <div style="font-size:13px; margin-bottom:8px;">
        ${isSortie ? 
          `<span style="color:var(--orange); font-weight:600;">Sortie : ${safeDetenteur}</span>` : 
          `<span style="color:var(--green); font-weight:600;">Dans l'armoire</span>`}
      </div>

      ${c.date_sortie ? `<div style="font-size:11px; color:var(--text-3); margin-top:4px; display:flex; align-items:center; gap:4px;">⏱️ Depuis le ${typeof fmtD === 'function' ? fmtD(c.date_sortie) : new Date(c.date_sortie).toLocaleDateString()}</div>` : ''}
      ${c.notes ? `<div style="font-size:11px; color:var(--text-3); margin-top:6px; padding:8px; background:var(--bg-2); border-radius:6px; font-style:italic;">"${safeNotes}"</div>` : ''}
      
      ${(typeof canManageCles === 'function' && canManageCles()) ? `
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">
        <button class="btn btn-xs" style="flex:1; justify-content:center; ${isSortie ? 'background:var(--green-light);color:var(--green);border-color:var(--green-border);' : 'background:var(--orange-light);color:var(--orange);border-color:var(--orange-border);'}" onclick="moveCle('${c.id}','${c.statut}')">
          ${isSortie ? '✓ Retour' : '→ Sortir'}
        </button>
        <button class="btn btn-xs btn-ghost" onclick="openCleHistory('${c.id}','${(c.nom||'').replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">⏳ Hist.</button>
        <button class="btn btn-xs btn-ghost" style="color:var(--red); padding:4px 8px;" onclick="deleteCle('${c.id}')" title="Supprimer">🗑</button>
      </div>` : ''}
    </div>
    
    <span style="position:absolute; top:16px; right:16px; width:12px; height:12px; border-radius:50%; background:${isSortie ? 'var(--orange)' : 'var(--green)'}; box-shadow:0 0 0 3px ${isSortie ? 'var(--orange-light)' : 'var(--green-light)'};"></span>
  </div>`;
}

// Ouvre la popup en s'assurant que les champs sont vides
function openNewCleModal() {
  if($('k-nom')) $('k-nom').value = '';
  if($('k-det')) $('k-det').value = '';
  if($('k-date')) $('k-date').value = new Date().toISOString().split('T')[0];
  if($('k-notes')) $('k-notes').value = '';
  
  if (typeof openModal === 'function') openModal('m-cle');
}

async function submitCle() {
  const nom = $('k-nom')?.value.trim();
  if (!nom) { toast('Le nom de la clé est obligatoire', 'err'); return; }
  
  const det = $('k-det')?.value.trim() || null;
  const btn = document.querySelector('#m-cle .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement...'; }

  try {
    const payload = {
      nom, 
      detenteur_nom: det,
      date_sortie: det ? ($('k-date')?.value || new Date().toISOString()) : null,
      statut: det ? 'sortie' : 'disponible',
      notes: $('k-notes')?.value || null,
      created_by: user.id
    };

    const { error, data } = await sb.from('cles').insert(payload).select().single();
    if (error) throw error;

    // Si la clé est créée directement "sortie", on l'ajoute à l'historique
    if (det && data) {
      await sb.from('cles_historique').insert({ cle_id: data.id, action: 'sortie', personne_nom: det, created_by: user.id });
    }

    if (typeof addLog === 'function') await addLog('Clé ajoutée', 'cle', null, { nom });
    if (typeof loadCles === 'function') await loadCles();
    
    if (typeof closeModal === 'function') closeModal('m-cle');
    toast('Clé enregistrée avec succès', 'ok');
    renderCles();

  } catch (err) {
    toast('Erreur: ' + err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
  }
}

async function moveCle(id, statut) {
  const cle = cache.cles.find(c => c.id === id);
  if (!cle) return;
  
  try {
    if (statut === 'sortie') {
      // Action : Marquer rendue
      const { error } = await sb.from('cles').update({ statut: 'disponible', detenteur_nom: null, date_sortie: null }).eq('id', id);
      if (error) throw error;

      await sb.from('cles_historique').insert({ cle_id: id, action: 'retour', personne_nom: cle.detenteur_nom, created_by: user.id });
      if (typeof addLog === 'function') await addLog('Retour de clé', 'cle', id, { cle: cle.nom });
      
      // Envoi d'email silencieux (ne bloque pas si échec)
      if (typeof sendEmailDirect === 'function') {
        sendEmailDirect('nouvelle_annonce', null, {
          titre: `🔑 Retour de clé : ${cle.nom}`,
          type: 'info',
          contenu: `La clé "${cle.nom}" a été rendue par ${cle.detenteur_nom || 'N/A'}.`
        }).catch(e => console.warn('Email warning:', e));
      }
      
      toast('Clé rendue', 'ok');

    } else {
      // Action : Sortir
      const det = typeof askTextModal === 'function' ? await askTextModal({
        title: 'Sortir une clé',
        label: 'Nom du destinataire',
        placeholder: 'Ex: Plombier, M. Martin...',
        confirmLabel: 'Confirmer la sortie'
      }) : prompt('Nom du destinataire (Ex: Plombier) :');
      
      if (!det) return; // Annulé par l'utilisateur

      const { error } = await sb.from('cles').update({ statut: 'sortie', detenteur_nom: det, date_sortie: new Date().toISOString() }).eq('id', id);
      if (error) throw error;

      await sb.from('cles_historique').insert({ cle_id: id, action: 'sortie', personne_nom: det, created_by: user.id });
      if (typeof addLog === 'function') await addLog('Sortie de clé', 'cle', id, { cle: cle.nom, personne: det });
      
      if (typeof sendEmailDirect === 'function') {
        sendEmailDirect('nouvelle_annonce', null, {
          titre: `🔑 Sortie de clé : ${cle.nom}`,
          type: 'info',
          contenu: `La clé "${cle.nom}" a été remise à ${det}.`
        }).catch(e => console.warn('Email warning:', e));
      }
      
      toast(`Clé remise à ${det}`, 'ok');
    }
    
    if (typeof loadCles === 'function') await loadCles();
    renderCles();

  } catch (err) {
    toast('Erreur lors du mouvement: ' + err.message, 'err');
  }
}

async function deleteCle(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette clé et son historique ?')) return;
  try {
    const { error } = await sb.from('cles').delete().eq('id', id);
    if (error) throw error;
    
    toast('Clé supprimée', 'ok');
    if (typeof loadCles === 'function') await loadCles();
    renderCles();
  } catch (err) {
    toast('Impossible de supprimer la clé: ' + err.message, 'err');
  }
}

async function openCleHistory(cleId, cleNom) {
  try {
    const { data, error } = await sb.from('cles_historique')
      .select('*')
      .eq('cle_id', cleId)
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (error) throw error;

    const id = `cle-hist-${Date.now()}`;
    const rows = data || [];
    
    // UI : TIMELINE
    const htmlRows = rows.length
      ? `<div style="position:relative; margin-left:8px; border-left:2px solid var(--border); padding-left:16px;">` + 
        rows.map((h, i) => {
          const safePersonne = typeof escHtml === 'function' ? escHtml(h.personne_nom || 'Inconnu') : (h.personne_nom || 'Inconnu');
          const isSortie = h.action === 'sortie';
          const dateStr = typeof fmt === 'function' ? fmt(h.created_at) : new Date(h.created_at).toLocaleString();
          
          return `
        <div style="position:relative; padding-bottom:${i === rows.length - 1 ? '0' : '20px'};">
          <span style="position:absolute; left:-22px; top:2px; width:12px; height:12px; border-radius:50%; background:${isSortie ? 'var(--orange)' : 'var(--green)'}; border:2px solid var(--bg);"></span>
          <div style="font-size:13px; font-weight:700; color:var(--text-1);">${isSortie ? 'Sortie vers :' : 'Rendue par :'} ${safePersonne}</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:2px;">🕒 ${dateStr}</div>
        </div>`;
        }).join('') + `</div>`
      : `<div style="padding:16px 0; color:var(--text-3); font-size:13px; text-align:center;">Aucun mouvement enregistré pour cette clé.</div>`;

    const overlay = document.createElement('div');
    overlay.className = 'overlay open';
    overlay.id = id;
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div class="mh">
          <span class="mh-title" style="display:flex; align-items:center; gap:8px;">⏳ Historique</span>
          <button class="mclose" type="button">×</button>
        </div>
        <div class="mb">
          <div style="margin-bottom:20px; font-weight:600; font-size:15px; padding-bottom:12px; border-bottom:1px solid var(--border); color:var(--text-1);">
            🔑 ${typeof escHtml === 'function' ? escHtml(cleNom) : cleNom}
          </div>
          ${htmlRows}
        </div>
        <div class="mf">
          <button class="btn btn-secondary" type="button" style="width:100%; justify-content:center;">Fermer</button>
        </div>
      </div>`;
    
    document.body.appendChild(overlay);
    
    const close = () => overlay.remove();
    overlay.querySelector('.mclose')?.addEventListener('click', close);
    overlay.querySelector('.mf .btn')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    
  } catch (err) {
    toast("Impossible de charger l'historique", 'err');
  }
}
