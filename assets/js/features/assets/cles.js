function renderCles() {
  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph"><h1>Gestion des clés</h1><p>${cache.cles.filter(c=>c.statut==='sortie').length} clé(s) sortie(s) sur ${cache.cles.length}</p></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
      ${isManager() ? `<button class="btn btn-primary" onclick="openModal('m-cle')">+ Ajouter une clé</button>` : ''}
    </div>
    <div class="keys-grid">
      ${cache.cles.length === 0 ? emptyState('🔑', 'Aucune clé', 'Enregistrez les clés de la résidence pour suivre leurs mouvements.') :
        cache.cles.map(c => `
          <div class="key-card">
            <div class="key-ic">🔑</div>
            <div style="flex:1;">
              <div class="key-nm">${c.nom}</div>
              <div class="key-inf">${c.statut==='sortie' ? `<strong>Chez : ${c.detenteur_nom||'?'}</strong>` : '<span style="color:var(--green);">Disponible</span>'}</div>
              ${c.date_sortie ? `<div style="font-size:11px;color:var(--text-3);margin-top:3px;">Depuis le ${fmtD(c.date_sortie)}</div>` : ''}
              ${c.notes ? `<div style="font-size:11px;color:var(--text-3);margin-top:3px;">${c.notes}</div>` : ''}
              ${isManager() ? `
              <button class="btn btn-xs" style="margin-top:8px;${c.statut==='sortie'?'background:var(--green-light);color:var(--green);border-color:var(--green-border);':'background:var(--orange-light);color:var(--orange);border-color:var(--orange-border);'}" onclick="moveCle('${c.id}','${c.statut}')">
                ${c.statut==='sortie' ? '✓ Marquer rendue' : '→ Sortir la clé'}
              </button>
              <button class="btn btn-xs" style="margin-top:6px;" onclick="openCleHistory('${c.id}','${(c.nom||'').replace(/'/g, '\\\'')}')">Historique</button>` : ''}
            </div>
            <span class="key-tag ${c.statut==='disponible'?'key-ok':'key-out'}">${c.statut==='disponible'?'Dispo':'Sortie'}</span>
          </div>`).join('')}
    </div>
  </div>`;
}

async function submitCle() {
  const nom = $('k-nom')?.value.trim();
  if (!nom) { toast('Nom obligatoire', 'err'); return; }
  const det = $('k-det')?.value.trim() || null;
  const { error } = await sb.from('cles').insert({
    nom, detenteur_nom: det,
    date_sortie: det ? ($('k-date')?.value || new Date().toISOString()) : null,
    statut: det ? 'sortie' : 'disponible',
    notes: $('k-notes')?.value || null,
    created_by: user.id
  });
  if (error) { toast('Erreur: ' + error.message, 'err'); return; }
  await addLog('Clé ajoutée', 'cle', null, { nom });
  await loadCles();
  closeModal('m-cle');
  toast('Clé enregistrée', 'ok');
  renderCles();
}

async function moveCle(id, statut) {
  const cle = cache.cles.find(c => c.id === id);
  if (!cle) return;
  if (statut === 'sortie') {
    await sb.from('cles').update({ statut: 'disponible', detenteur_nom: null, date_sortie: null }).eq('id', id);
    await sb.from('cles_historique').insert({ cle_id: id, action: 'retour', personne_nom: cle.detenteur_nom, created_by: user.id });
    await addLog('Retour de clé', 'cle', id, { cle: cle.nom });
    await sendEmailDirect('nouvelle_annonce', null, {
      titre: `🔑 Retour de clé : ${cle.nom}`,
      type: 'info',
      contenu: `La clé "${cle.nom}" a été rendue par ${cle.detenteur_nom || 'N/A'}.`
    });
    toast('Clé marquée comme rendue', 'ok');
  } else {
    const det = await askTextModal({
      title: 'Sortir une clé',
      label: 'Nom du destinataire',
      placeholder: 'Ex: Mme Martin',
      confirmLabel: 'Confirmer la sortie'
    });
    if (!det) return;
    await sb.from('cles').update({ statut: 'sortie', detenteur_nom: det, date_sortie: new Date().toISOString() }).eq('id', id);
    await sb.from('cles_historique').insert({ cle_id: id, action: 'sortie', personne_nom: det, created_by: user.id });
    await addLog('Sortie de clé', 'cle', id, { cle: cle.nom, personne: det });
    await sendEmailDirect('nouvelle_annonce', null, {
      titre: `🔑 Sortie de clé : ${cle.nom}`,
      type: 'info',
      contenu: `La clé "${cle.nom}" a été remise à ${det}.`
    });
    toast(`Clé remise à ${det}`, 'ok');
  }
  await loadCles();
  renderCles();
}

async function openCleHistory(cleId, cleNom) {
  const { data, error } = await sb.from('cles_historique')
    .select('*')
    .eq('cle_id', cleId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) { toast("Impossible de charger l'historique", 'err'); return; }

  const id = `cle-hist-${Date.now()}`;
  const rows = data || [];
  const htmlRows = rows.length
    ? rows.map(h => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:13px;font-weight:600;">${h.action === 'sortie' ? 'Sortie' : 'Retour'}</div>
        <div style="font-size:12px;color:var(--text-2);">${h.personne_nom || 'N/A'}</div>
        <div style="font-size:11px;color:var(--text-3);">${fmt(h.created_at)}</div>
      </div>`).join('')
    : `<div style="padding:10px 0;color:var(--text-3);font-size:13px;">Aucun mouvement enregistré.</div>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = id;
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px;">
      <div class="mh">
        <span class="mh-title">Historique clé: ${cleNom}</span>
        <button class="mclose" type="button">×</button>
      </div>
      <div class="mb">${htmlRows}</div>
      <div class="mf">
        <button class="btn btn-secondary" type="button">Fermer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('.mclose')?.addEventListener('click', close);
  overlay.querySelector('.mf .btn')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ── JOURNAL ──
