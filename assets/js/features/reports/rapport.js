function renderRapport() {
  const t = cache.tickets;
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = ouverts.filter(x => x.urgence === 'critique');
  const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  const expirants = (cache.contrats||[]).filter(c => { const d = daysUntil(c.date_echeance); return d !== null && d >= -30 && d <= 90; });
  const tempsResolution = resolus.map(r => Math.max(0, Math.floor((new Date(r.updated_at||r.created_at) - new Date(r.created_at)) / 86400000)));
  const moyenneJours = tempsResolution.length ? Math.round(tempsResolution.reduce((a,b)=>a+b,0)/tempsResolution.length) : null;
  const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };

  $('page').innerHTML = `
  <div style="padding:24px;" id="rapport-page">
    <div class="ph"><h1>Rapport syndic</h1><p>Document de synthèse à transmettre</p></div>
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="exportRapportPDF()">🖨️ Exporter en PDF</button>
      <button class="btn btn-secondary" onclick="exportXLSX()">📊 Export Excel</button>
      <button class="btn btn-ghost btn-sm" onclick="exportCSV()">CSV</button>
      <span style="margin-left:auto;font-size:12px;color:var(--text-3);">Généré le ${today}</span>
    </div>

    <div class="rapport-summary">
      <div style="font-family:var(--font-head);font-size:20px;font-weight:800;margin-bottom:4px;">RAPPORT DE SITUATION</div>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px;">Résidence le Floréal</div>
      <div style="font-size:12px;color:var(--text-2);">13-19 Rue du Moucherotte — 38360 Sassenage</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:4px;">Établi le ${today} par ${displayNameFromProfile(profile, user?.email)}</div>
    </div>

    <div class="stats-row" style="margin-bottom:18px;">
      <div class="stat red" style="pointer-events:none;"><div class="stat-num">${critiques.length}</div><div class="stat-label">Critiques</div></div>
      <div class="stat orange" style="pointer-events:none;"><div class="stat-num">${ouverts.length}</div><div class="stat-label">Ouverts</div></div>
      <div class="stat green" style="pointer-events:none;"><div class="stat-num">${resolus.length}</div><div class="stat-label">Résolus</div></div>
      <div class="stat blue" style="pointer-events:none;"><div class="stat-num">${t.length}</div><div class="stat-label">Total</div></div>
    </div>

    <!-- Indicateurs -->
    <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
      ${moyenneJours !== null ? `<div class="card" style="flex:1;min-width:120px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">Temps moyen résolution</div><div style="font-size:20px;font-weight:800;font-family:var(--font-head);">${moyenneJours}j</div></div>` : ''}
      <div class="card" style="flex:1;min-width:120px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">Taux de résolution</div><div style="font-size:20px;font-weight:800;font-family:var(--font-head);">${t.length ? Math.round(resolus.length/t.length*100) : 0}%</div></div>
      <div class="card" style="flex:1;min-width:120px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">Transmis syndic</div><div style="font-size:20px;font-weight:800;font-family:var(--font-head);">${ouverts.filter(x=>x.statut==='transmis_syndic').length}</div></div>
      <div class="card" style="flex:1;min-width:120px;padding:14px 16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:4px;">En attente</div><div style="font-size:20px;font-weight:800;font-family:var(--font-head);">${ouverts.filter(x=>x.statut==='attente_intervention').length}</div></div>
    </div>

    <!-- Tickets ouverts -->
    ${ouverts.length ? `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-header"><span class="card-title">📋 Signalements ouverts (${ouverts.length})</span></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Titre</th><th>Urgence</th><th>Statut</th><th>Bâtiment</th><th>Date</th></tr></thead>
          <tbody>${ouverts.map(r=>`<tr onclick="openDetail('${r.id}')" style="cursor:pointer;">
            <td style="font-weight:600;">${escHtml(r.titre)}</td>
            <td>${badgeUrgence(r.urgence)}</td>
            <td>${badgeStatut(r.statut)}</td>
            <td style="font-size:12px;">${escHtml(r.batiment||'—')}</td>
            <td style="font-size:12px;white-space:nowrap;">${fmtD(r.created_at)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>` : '<div class="card" style="margin-bottom:18px;padding:24px;text-align:center;color:var(--text-3);">🎉 Aucun signalement ouvert</div>'}

    <!-- Tickets résolus -->
    ${resolus.length ? `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-header"><span class="card-title">✅ Résolus / Clos (${resolus.length})</span></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Titre</th><th>Bâtiment</th><th>Ouvert le</th><th>Résolu le</th></tr></thead>
          <tbody>${resolus.map(r=>`<tr>
            <td style="font-weight:600;">${escHtml(r.titre)}</td>
            <td style="font-size:12px;">${escHtml(r.batiment||'—')}</td>
            <td style="font-size:12px;white-space:nowrap;">${fmtD(r.created_at)}</td>
            <td style="font-size:12px;white-space:nowrap;">${fmtD(r.updated_at)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- Contrats à renouveler -->
    ${expirants.length ? `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-header"><span class="card-title" style="color:var(--amber);">⚠️ Contrats à renouveler (${expirants.length})</span></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Fournisseur</th><th>Type</th><th>Échéance</th><th>Délai</th></tr></thead>
          <tbody>${expirants.map(c=>{const d=daysUntil(c.date_echeance);return`<tr>
            <td style="font-weight:600;">${escHtml(c.fournisseur)}</td>
            <td style="font-size:12px;">${escHtml(c.type_contrat)}</td>
            <td style="font-size:12px;white-space:nowrap;">${fmtD(c.date_echeance)}</td>
            <td style="font-weight:700;color:${d<0?'var(--red)':d<=30?'var(--orange)':'var(--amber)'};">${d<0?'Expiré':d+'j'}</td>
          </tr>`;}).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}
  </div>`;
}

function exportRapportPDF() {
  const t = cache.tickets;
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = ouverts.filter(x => x.urgence === 'critique');
  const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  const auteur = displayNameFromProfile(profile, user?.email);

  // Stats
  const tempsResolution = resolus.map(r => {
    const created = new Date(r.created_at);
    const updated = new Date(r.updated_at || r.created_at);
    return Math.max(0, Math.floor((updated - created) / 86400000));
  });
  const moyenneJours = tempsResolution.length
    ? Math.round(tempsResolution.reduce((a,b) => a+b, 0) / tempsResolution.length)
    : null;

  // Répartition par bâtiment
  const parBat = {};
  COPRO.tours.forEach(tour => { parBat[tour] = ouverts.filter(x => x.batiment === tour).length; });

  // Contrats à renouveler (< 90j)
  const expirants = (cache.contrats||[]).filter(c => {
    const d = daysUntil(c.date_echeance);
    return d !== null && d >= -30 && d <= 90;
  });

  const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };
  const urgLabels = { critique:'Critique', important:'Important', normal:'Normal' };
  const urgColors = { critique:'#dc2626', important:'#ea580c', normal:'#2563eb' };
  const urgBg    = { critique:'#fef2f2', important:'#fff7ed', normal:'#eff6ff' };

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Rapport syndic — ${today}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 16mm 14mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1917; font-size: 11.5px; line-height: 1.5; }

    .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; border-bottom: 2px solid #1a1917; margin-bottom: 20px; }
    .header-left .org { font-size: 9.5px; color: #9b9890; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 3px; }
    .header-left .doc-type { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header-right { text-align: right; font-size: 9.5px; color: #9b9890; line-height: 1.8; }

    /* RÉSUMÉ STATS */
    .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 20px; }
    .stat-box { border: 1px solid #e8e5df; border-radius: 8px; padding: 10px 12px; text-align: center; }
    .stat-box.red { border-color: #fecaca; background: #fef2f2; }
    .stat-box.orange { border-color: #fed7aa; background: #fff7ed; }
    .stat-box.green { border-color: #bbf7d0; background: #f0fdf4; }
    .stat-box.blue { border-color: #bfdbfe; background: #eff6ff; }
    .stat-num { font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 3px; }
    .stat-box.red .stat-num { color: #dc2626; }
    .stat-box.orange .stat-num { color: #ea580c; }
    .stat-box.green .stat-num { color: #16a34a; }
    .stat-box.blue .stat-num { color: #2563eb; }
    .stat-label { font-size: 9.5px; color: #9b9890; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }

    /* SECTIONS */
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-title { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9b9890; padding-bottom: 5px; border-bottom: 1px solid #e8e5df; margin-bottom: 10px; }

    /* TABLEAUX */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 6px 8px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #9b9890; border-bottom: 1px solid #e8e5df; background: #fafaf9; }
    td { padding: 7px 8px; border-bottom: 1px solid #f0ede8; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafaf9; }

    /* BADGES */
    .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9.5px; font-weight: 700; }

    /* STATS SUPPLEMENTAIRES */
    .info-row { display: flex; gap: 20px; margin-bottom: 14px; flex-wrap: wrap; }
    .info-item { background: #fafaf9; border: 1px solid #e8e5df; border-radius: 6px; padding: 8px 12px; flex: 1; min-width: 120px; }
    .info-item-label { font-size: 9.5px; color: #9b9890; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
    .info-item-val { font-size: 14px; font-weight: 700; }

    /* RÉPARTITION */
    .bat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .bat-label { width: 60px; font-size: 10.5px; font-weight: 600; flex-shrink: 0; }
    .bat-bar-wrap { flex: 1; height: 8px; background: #f0ede8; border-radius: 4px; overflow: hidden; }
    .bat-bar { height: 100%; background: #2563eb; border-radius: 4px; }
    .bat-count { width: 24px; text-align: right; font-size: 10.5px; font-weight: 700; color: #2563eb; }

    .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e8e5df; display: flex; justify-content: space-between; font-size: 9px; color: #9b9890; }
    @media print { button { display: none !important; } }
  </style></head><body>

  <div class="header">
    <div class="header-left">
      <div class="org">Résidence le Floréal · 13-19 Rue du Moucherotte, 38360 Sassenage</div>
      <div class="doc-type">Rapport de situation</div>
    </div>
    <div class="header-right">
      <div>Établi le ${today}</div>
      <div>Par ${escHtml(auteur)}</div>
    </div>
  </div>

  <!-- STATS GLOBALES -->
  <div class="stats">
    <div class="stat-box red"><div class="stat-num">${critiques.length}</div><div class="stat-label">Critiques</div></div>
    <div class="stat-box orange"><div class="stat-num">${ouverts.length}</div><div class="stat-label">Ouverts</div></div>
    <div class="stat-box green"><div class="stat-num">${resolus.length}</div><div class="stat-label">Résolus</div></div>
    <div class="stat-box blue"><div class="stat-num">${t.length}</div><div class="stat-label">Total</div></div>
  </div>

  <!-- INDICATEURS -->
  <div class="info-row">
    ${moyenneJours !== null ? `<div class="info-item"><div class="info-item-label">Temps moyen résolution</div><div class="info-item-val">${moyenneJours} jour${moyenneJours > 1 ? 's' : ''}</div></div>` : ''}
    <div class="info-item"><div class="info-item-label">Taux de résolution</div><div class="info-item-val">${t.length ? Math.round(resolus.length/t.length*100) : 0} %</div></div>
    <div class="info-item"><div class="info-item-label">Transmis syndic</div><div class="info-item-val">${ouverts.filter(x=>x.statut==='transmis_syndic').length}</div></div>
    <div class="info-item"><div class="info-item-label">En attente</div><div class="info-item-val">${ouverts.filter(x=>x.statut==='attente_intervention').length}</div></div>
  </div>

  <!-- RÉPARTITION PAR BÂTIMENT -->
  ${Object.values(parBat).some(v => v > 0) ? `
  <div class="section">
    <div class="section-title">Répartition par bâtiment (tickets ouverts)</div>
    ${COPRO.tours.map(tour => {
      const cnt = parBat[tour] || 0;
      const max = Math.max(...Object.values(parBat), 1);
      return `<div class="bat-row">
        <div class="bat-label">${tour}</div>
        <div class="bat-bar-wrap"><div class="bat-bar" style="width:${Math.round(cnt/max*100)}%"></div></div>
        <div class="bat-count">${cnt}</div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- TICKETS OUVERTS -->
  ${ouverts.length ? `
  <div class="section">
    <div class="section-title">Signalements ouverts (${ouverts.length})</div>
    <table>
      <thead><tr><th>Titre</th><th>Urgence</th><th>Statut</th><th>Bâtiment</th><th>Date</th></tr></thead>
      <tbody>${ouverts.map(r => `<tr>
        <td style="font-weight:600;max-width:200px;">${escHtml(r.titre)}</td>
        <td><span class="badge" style="background:${urgBg[r.urgence]};color:${urgColors[r.urgence]};">${urgLabels[r.urgence]||r.urgence}</span></td>
        <td style="font-size:10.5px;">${statLabels[r.statut]||r.statut}</td>
        <td style="font-size:10.5px;">${escHtml(r.batiment||'—')}</td>
        <td style="white-space:nowrap;font-size:10.5px;">${fmtD(r.created_at)}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  <!-- TICKETS RÉSOLUS -->
  ${resolus.length ? `
  <div class="section">
    <div class="section-title">Signalements résolus / clos (${resolus.length})</div>
    <table>
      <thead><tr><th>Titre</th><th>Bâtiment</th><th>Ouvert le</th><th>Résolu le</th></tr></thead>
      <tbody>${resolus.map(r => `<tr>
        <td style="font-weight:600;max-width:220px;">${escHtml(r.titre)}</td>
        <td style="font-size:10.5px;">${escHtml(r.batiment||'—')}</td>
        <td style="white-space:nowrap;font-size:10.5px;">${fmtD(r.created_at)}</td>
        <td style="white-space:nowrap;font-size:10.5px;">${fmtD(r.updated_at)}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  <!-- CONTRATS À RENOUVELER -->
  ${expirants.length ? `
  <div class="section">
    <div class="section-title">Contrats à renouveler</div>
    <table>
      <thead><tr><th>Fournisseur</th><th>Type</th><th>Échéance</th><th>Délai</th></tr></thead>
      <tbody>${expirants.map(c => {
        const d = daysUntil(c.date_echeance);
        return `<tr>
          <td style="font-weight:600;">${escHtml(c.fournisseur)}</td>
          <td style="font-size:10.5px;">${escHtml(c.type_contrat)}</td>
          <td style="white-space:nowrap;font-size:10.5px;">${fmtD(c.date_echeance)}</td>
          <td style="font-weight:700;color:${d<0?'#dc2626':d<=30?'#ea580c':'#d97706'};">${d<0?'Expiré depuis '+Math.abs(d)+'j':d+'j'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <span>CoproSync · Résidence le Floréal · Sassenage</span>
    <span>Document confidentiel — usage interne syndic</span>
    <span>${today}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}

function exportCSV() {
  const h = ['ID','Titre','Bâtiment','Zone','Urgence','Statut','Catégorie','Auteur','Date'];
  const rows = cache.tickets.map(t => [t.reference||t.id.substring(0,8), `"${t.titre}"`, t.batiment||'', t.zone||'', t.urgence, t.statut, t.categorie||'', displayName(t.auteur_prenom,t.auteur_nom,t.auteur_email,''), fmtD(t.created_at)]);
  const csv = [h, ...rows].map(r => r.join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' }));
  a.download = `coprosync_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('Export CSV téléchargé', 'ok');
}

async function exportXLSX() {
  toast('Génération Excel en cours…', 'ok');
  try {
    // Charge SheetJS depuis CDN
    if (!window.XLSX) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    const today = new Date().toLocaleDateString('fr-FR');
    const wb = XLSX.utils.book_new();

    // ── ONGLET 1 — SIGNALEMENTS ──
    const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };
    const urgLabels  = { critique:'Critique', important:'Important', normal:'Normal' };
    const catLabels  = { ascenseur:'Ascenseur', fuite:'Fuite / eau', electricite:'Électricité', securite:'Sécurité', proprete:'Propreté', espaces_verts:'Espaces verts', serrurerie:'Serrurerie', parking:'Parking', autre:'Autre' };

    const ticketData = [
      ['N° Réf.','Titre','Bâtiment','Zone','Urgence','Statut','Catégorie','Auteur','Lot auteur','Date signalement','Jours ouverts'],
      ...cache.tickets.map(t => {
        const jours = Math.floor((new Date() - new Date(t.created_at)) / 86400000);
        return [
          (t.reference || t.id.substring(0,8)).toUpperCase(),
          t.titre || '',
          t.batiment || '',
          t.zone || '',
          urgLabels[t.urgence] || t.urgence || '',
          statLabels[t.statut] || t.statut || '',
          catLabels[t.categorie] || t.categorie || '',
          displayName(t.auteur_prenom, t.auteur_nom, t.auteur_email, ''),
          t.auteur_lot || '',
          fmtD(t.created_at),
          jours,
        ];
      })
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ticketData);
    ws1['!cols'] = [10,40,14,22,12,18,16,22,10,16,12].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws1, '🎫 Signalements');

    // ── ONGLET 2 — RÉSIDENTS ──
    const { data: residents } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    const roleLabels = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
    const resData = [
      ['Nom','Prénom','Tour','N° Lot','Email','Téléphone','Rôle','Statut','Inscrit le'],
      ...(residents||[]).map(u => [
        u.nom || '',
        u.prenom || '',
        u.tour || '',
        u.lot || '',
        u.email || '',
        u.telephone || '',
        roleLabels[u.role] || u.role || '',
        u.actif === false ? 'Suspendu' : 'Actif',
        fmtD(u.created_at),
      ])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(resData);
    ws2['!cols'] = [18,16,12,10,30,16,18,12,16].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws2, '👥 Résidents');

    // ── ONGLET 3 — CONTRATS ──
    const contratsData = [
      ['Fournisseur','Type','Date début','Date échéance','Montant/an (€)','Contact','Délai (jours)'],
      ...(cache.contrats||[]).map(c => [
        c.fournisseur || '',
        c.type_contrat || '',
        fmtD(c.date_debut),
        fmtD(c.date_echeance),
        c.montant_annuel || '',
        c.contact_nom || '',
        daysUntil(c.date_echeance) ?? '',
      ])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(contratsData);
    ws3['!cols'] = [28,24,14,16,16,20,14].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws3, '📄 Contrats');

    // ── ONGLET 4 — STATISTIQUES ──
    const t = cache.tickets;
    const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
    const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
    const taux = t.length ? Math.round(resolus.length/t.length*100) : 0;
    const statsData = [
      ['Indicateur', 'Valeur'],
      ['Total signalements', t.length],
      ['Signalements ouverts', ouverts.length],
      ['Signalements résolus', resolus.length],
      ['Critiques actifs', ouverts.filter(x=>x.urgence==='critique').length],
      ['Transmis au syndic', ouverts.filter(x=>x.statut==='transmis_syndic').length],
      ['Taux de résolution (%)', taux],
      ['Résidents inscrits', (residents||[]).length],
      ['Contrats actifs', (cache.contrats||[]).length],
      ['', ''],
      ['Répartition par bâtiment', ''],
      ...['Tour 13','Tour 15','Tour 17','Tour 19'].map(tour => [
        tour, ouverts.filter(x=>x.batiment===tour).length
      ]),
      ['', ''],
      ['Export généré le', today],
      ['Par', displayNameFromProfile(profile, user?.email)],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(statsData);
    ws4['!cols'] = [{wch:35},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws4, '📊 Statistiques');

    // Téléchargement
    const filename = `CoproSync_Floreal_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast('✅ Export Excel téléchargé !', 'ok');

  } catch(e) {
    console.error('[exportXLSX]', e);
    toast('Erreur export Excel : ' + e.message, 'err');
  }
}

// ── PWA / SERVICE WORKER ──
