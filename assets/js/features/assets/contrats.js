function renderContrats() {
  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph"><h1>Contrats fournisseurs</h1><p>${cache.contrats.length} contrat(s)</p></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
      <button class="btn btn-primary" onclick="openModal('m-contrat')">+ Ajouter un contrat</button>
    </div>
    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Fournisseur</th><th>Type</th><th>Début</th><th>Échéance</th><th>Délai</th><th>Montant/an</th><th>Contact</th></tr></thead>
          <tbody>
            ${cache.contrats.length === 0 ? emptyState('📄', 'Aucun contrat', 'Ajoutez vos contrats fournisseurs pour suivre les échéances.').replace('<div class="empty-state">', '<tr><td colspan="7"><div class="empty-state">').replace('</div>', '</div></td></tr>') :
              cache.contrats.map(c => {
                const days = daysUntil(c.date_echeance);
                const cls = days < 0 ? 'expired' : days <= 90 ? 'expiring' : '';
                const dl = days < 0
                  ? `<span style="color:var(--red);font-weight:700;">Expiré (${-days}j)</span>`
                  : days <= 30 ? `<span style="color:var(--red);font-weight:700;">${days} jours ⚠️</span>`
                  : days <= 90 ? `<span style="color:var(--amber);font-weight:700;">${days} jours</span>`
                  : `<span style="color:var(--green);">${days} jours</span>`;
                return `<tr class="${cls}">
                  <td><div style="font-weight:600;">${c.fournisseur}</div>${c.notes?`<div style="font-size:11px;color:var(--text-3);">${c.notes.substring(0,50)}...</div>`:''}</td>
                  <td><span class="badge badge-normal">${c.type_contrat}</span></td>
                  <td style="font-size:12px;">${fmtD(c.date_debut)}</td>
                  <td style="font-size:12px;">${fmtD(c.date_echeance)}</td>
                  <td>${dl}</td>
                  <td style="font-size:13px;">${c.montant_annuel ? c.montant_annuel.toLocaleString('fr-FR')+'€' : '—'}</td>
                  <td style="font-size:12px;color:var(--text-2);">${c.contact_nom||''} ${c.contact_tel||''}</td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

async function submitContrat() {
  const four = $('c-four')?.value.trim();
  const ech = $('c-ech')?.value;
  if (!four || !ech) { toast('Fournisseur et échéance requis', 'err'); return; }
  const { data, error } = await sb.from('contrats').insert({
    fournisseur: four,
    type_contrat: $('c-type')?.value,
    date_debut: $('c-deb')?.value || null,
    date_echeance: ech,
    contact_nom: $('c-cont')?.value || null,
    montant_annuel: parseFloat($('c-mont')?.value) || null,
    notes: $('c-notes')?.value || null,
    created_by: user.id
  }).select().single();
  if (error) { toast('Erreur: ' + error.message, 'err'); return; }
  await addLog('Contrat ajouté', 'contrat', data.id, { fournisseur: four });
  await loadContrats();
  closeModal('m-contrat');
  toast('Contrat enregistré', 'ok');
  updateBadges();
  renderContrats();
}

// ── CLÉS ──
