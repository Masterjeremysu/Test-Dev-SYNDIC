// ════════════════════════════════════════════════════════════════
//  RAPPORT SYNDIC (PDF, CSV, EXCEL)
//  assets/js/features/reports/rapport.js
// ════════════════════════════════════════════════════════════════

function renderRapport() {
  const page = $('page');
  if (!page) return;

  // Sécurisation des données
  const t = cache.tickets || [];
  const contrats = cache.contrats || [];
  const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];

  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = ouverts.filter(x => x.urgence === 'critique');
  const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  
  const expirants = contrats.filter(c => { 
    if (!c.date_echeance) return false;
    const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 999; 
    return d !== null && d >= -30 && d <= 90; 
  });

  const tempsResolution = resolus.map(r => Math.max(0, Math.floor((new Date(r.updated_at||r.created_at) - new Date(r.created_at)) / 86400000)));
  const moyenneJours = tempsResolution.length ? Math.round(tempsResolution.reduce((a,b)=>a+b,0)/tempsResolution.length) : null;
  const tauxResolution = t.length ? Math.round((resolus.length / t.length) * 100) : 0;

  // Helpers pour l'affichage (Fallbacks si absents)
  const safeDisplayName = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Gestionnaire';
  const getBadgeUrgence = (u) => typeof badgeUrgence === 'function' ? badgeUrgence(u) : `<span style="font-weight:bold">${u}</span>`;
  const getBadgeStatut = (s) => typeof badgeStatut === 'function' ? badgeStatut(s) : `<span style="font-style:italic">${s}</span>`;
  const getFmtD = (d) => typeof fmtD === 'function' ? fmtD(d) : new Date(d).toLocaleDateString();

  page.innerHTML = `
  <div style="padding:24px; max-width:1100px; margin:0 auto; animation:fade-in 0.3s ease;" id="rapport-page">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text-1);margin:0;">Rapport de situation</h1>
        <p style="color:var(--text-2);margin:4px 0 0;font-size:14px;">Généré le ${today} par ${escHtml(safeDisplayName)}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="btn-export-pdf" class="btn btn-primary" onclick="exportRapportPDF(this)" style="box-shadow:0 4px 12px rgba(99,102,241,0.2);">🖨️ Exporter en PDF</button>
        <button id="btn-export-xls" class="btn btn-secondary" onclick="exportXLSX(this)">📊 Excel</button>
        <button class="btn btn-ghost btn-sm" onclick="exportCSV()">CSV</button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      
      <div class="card" style="padding:20px; display:flex; align-items:center; gap:16px; border-left:4px solid var(--red);">
        <div style="background:var(--red-light); color:var(--red); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">🚨</div>
        <div>
          <div style="font-size:24px; font-weight:800; font-family:var(--font-head); line-height:1;">${critiques.length}</div>
          <div style="font-size:12px; color:var(--text-3); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">Critiques</div>
        </div>
      </div>
      
      <div class="card" style="padding:20px; display:flex; align-items:center; gap:16px; border-left:4px solid var(--orange);">
        <div style="background:var(--orange-light); color:var(--orange); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">📋</div>
        <div>
          <div style="font-size:24px; font-weight:800; font-family:var(--font-head); line-height:1;">${ouverts.length}</div>
          <div style="font-size:12px; color:var(--text-3); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">Ouverts</div>
        </div>
      </div>
      
      <div class="card" style="padding:20px; display:flex; align-items:center; gap:16px; border-left:4px solid var(--green);">
        <div style="background:var(--green-light); color:var(--green); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">✅</div>
        <div>
          <div style="font-size:24px; font-weight:800; font-family:var(--font-head); line-height:1;">${tauxResolution}%</div>
          <div style="font-size:12px; color:var(--text-3); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">Résolution</div>
        </div>
      </div>
      
      <div class="card" style="padding:20px; display:flex; align-items:center; gap:16px; border-left:4px solid var(--primary);">
        <div style="background:var(--primary-light); color:var(--primary); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">⏱️</div>
        <div>
          <div style="font-size:24px; font-weight:800; font-family:var(--font-head); line-height:1;">${moyenneJours !== null ? moyenneJours : '-'}</div>
          <div style="font-size:12px; color:var(--text-3); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;">Jours (Moyenne)</div>
        </div>
      </div>

    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">Transmis au Syndic</div><div style="font-size:20px;font-weight:800;">${ouverts.filter(x=>x.statut==='transmis_syndic').length}</div></div>
      <div class="card" style="padding:16px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);">En attente Intervention</div><div style="font-size:20px;font-weight:800;">${ouverts.filter(x=>x.statut==='attente_intervention').length}</div></div>
    </div>

    ${ouverts.length ? `
    <div class="card" style="margin-bottom:24px; overflow:hidden;">
      <div class="card-header" style="background:var(--bg-1); padding:16px 20px; border-bottom:1px solid var(--border);">
        <span class="card-title" style="font-weight:800; font-size:15px;">Signalements en cours (${ouverts.length})</span>
      </div>
      <div class="tbl-wrap" style="margin:0;">
        <table style="width:100%; border-collapse:collapse;">
          <thead style="background:var(--bg-2); text-align:left; font-size:12px; color:var(--text-3); text-transform:uppercase;">
            <tr><th style="padding:12px 20px;">Titre</th><th>Urgence</th><th>Statut</th><th>Bâtiment</th><th>Date</th></tr>
          </thead>
          <tbody>${ouverts.map(r=>`
            <tr onclick="if(typeof openDetail === 'function') openDetail('${r.id}')" style="cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
              <td style="padding:12px 20px; font-weight:600; color:var(--text-1);">${escHtml(r.titre)}</td>
              <td>${getBadgeUrgence(r.urgence)}</td>
              <td>${getBadgeStatut(r.statut)}</td>
              <td style="font-size:13px; color:var(--text-2);">${escHtml(r.batiment||'—')}</td>
              <td style="font-size:13px; color:var(--text-3); white-space:nowrap;">${getFmtD(r.created_at)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : emptyState('🎉', 'Aucun signalement ouvert', 'Tous les incidents de la résidence sont résolus.')}

    ${expirants.length ? `
    <div class="card" style="margin-bottom:24px; border:1px solid var(--amber-border); overflow:hidden;">
      <div class="card-header" style="background:var(--amber-light); padding:16px 20px; border-bottom:1px solid var(--amber-border);">
        <span class="card-title" style="color:var(--amber); font-weight:800; font-size:15px;">⚠️ Contrats à renouveler (${expirants.length})</span>
      </div>
      <div class="tbl-wrap" style="margin:0;">
        <table style="width:100%; border-collapse:collapse;">
          <thead style="background:var(--bg-2); text-align:left; font-size:12px; color:var(--text-3); text-transform:uppercase;">
            <tr><th style="padding:12px 20px;">Fournisseur</th><th>Type</th><th>Échéance</th><th>Délai</th></tr>
          </thead>
          <tbody>${expirants.map(c=>{
            const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 0;
            return `
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px 20px; font-weight:600;">${escHtml(c.fournisseur)}</td>
              <td style="font-size:13px; color:var(--text-2);">${escHtml(c.type_contrat)}</td>
              <td style="font-size:13px; color:var(--text-3); white-space:nowrap;">${getFmtD(c.date_echeance)}</td>
              <td style="font-weight:800; color:${d<0?'var(--red)':d<=30?'var(--orange)':'var(--amber)'};">${d<0?'Expiré':d+'j'}</td>
            </tr>`;}).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}
  </div>`;
}

// ── EXPORT PDF (Refonte visuelle stricte) ──
function exportRapportPDF(btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Préparation...'; }

  try {
    const t = cache.tickets || [];
    const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
    const critiques = ouverts.filter(x => x.urgence === 'critique');
    const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
    const auteur = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Syndic';

    const getFmtD = (d) => typeof fmtD === 'function' ? fmtD(d) : new Date(d).toLocaleDateString();

    const tempsResolution = resolus.map(r => Math.max(0, Math.floor((new Date(r.updated_at || r.created_at) - new Date(r.created_at)) / 86400000)));
    const moyenneJours = tempsResolution.length ? Math.round(tempsResolution.reduce((a,b) => a+b, 0) / tempsResolution.length) : null;

    // Répartition dynamique par bâtiment
    const parBat = {};
    const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];
    listeTours.forEach(tour => { parBat[tour] = ouverts.filter(x => x.batiment === tour).length; });

    const expirants = (cache.contrats||[]).filter(c => {
      if(!c.date_echeance) return false;
      const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 999;
      return d !== null && d >= -30 && d <= 90;
    });

    const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };
    const urgLabels = { critique:'Critique', important:'Important', normal:'Normal' };
    const urgColors = { critique:'#dc2626', important:'#ea580c', normal:'#2563eb' };
    const urgBg    = { critique:'#fef2f2', important:'#fff7ed', normal:'#eff6ff' };

    const win = window.open('', '_blank');
    if (!win) {
      toast('Erreur: Popup bloquée par le navigateur.', 'err');
      if (btn) { btn.disabled = false; btn.innerHTML = '🖨️ Exporter en PDF'; }
      return;
    }

    win.document.write(`<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Syndic — ${today}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; font-size: 10px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 16px; border-bottom: 2px solid #111827; margin-bottom: 24px; }
        .header-left .org { font-size: 10px; color: #6b7280; font-weight:600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .header-left .doc-type { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #111827; }
        .header-right { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.6; }

        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-box.red { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }
        .stat-box.orange { border-color: #fdba74; background: #fff7ed; color: #c2410c; }
        .stat-box.green { border-color: #86efac; background: #f0fdf4; color: #15803d; }
        .stat-box.blue { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
        .stat-num { font-size: 26px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity:0.8; }

        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }

        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
        th { text-align: left; padding: 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #d1d5db; background: #f9fafb; }
        td { padding: 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:nth-child(even) td { background: #f9fafb; }

        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing:0.05em; }
        
        .bat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .bat-label { width: 70px; font-size: 10px; font-weight: 600; }
        .bat-bar-wrap { flex: 1; height: 10px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
        .bat-bar { height: 100%; background: #3b82f6; border-radius: 4px; }
        
        @media print { 
          button { display: none !important; } 
          @page { margin: 10mm 15mm; }
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="header-left">
          <div class="org">CoproSync · Résidence le Floréal</div>
          <div class="doc-type">Rapport de Situation</div>
        </div>
        <div class="header-right">
          <div><strong>Établi le :</strong> ${today}</div>
          <div><strong>Par :</strong> ${escHtml(auteur)}</div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-box red"><div class="stat-num">${critiques.length}</div><div class="stat-label">Critiques</div></div>
        <div class="stat-box orange"><div class="stat-num">${ouverts.length}</div><div class="stat-label">Ouverts</div></div>
        <div class="stat-box green"><div class="stat-num">${resolus.length}</div><div class="stat-label">Résolus</div></div>
        <div class="stat-box blue"><div class="stat-num">${t.length}</div><div class="stat-label">Total Signalements</div></div>
      </div>

      <div style="display:flex; gap:16px; margin-bottom:24px;">
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; color:#6b7280; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Temps moyen résolution</div>
          <div style="font-size:18px; font-weight:800;">${moyenneJours !== null ? moyenneJours + ' jours' : 'N/A'}</div>
        </div>
        <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#f9fafb;">
          <div style="font-size:9px; color:#6b7280; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Transmis Syndic / Attente</div>
          <div style="font-size:18px; font-weight:800;">${ouverts.filter(x=>x.statut==='transmis_syndic' || x.statut==='attente_intervention').length}</div>
        </div>
      </div>

      ${Object.values(parBat).some(v => v > 0) ? `
      <div class="section">
        <div class="section-title">Répartition par bâtiment (en cours)</div>
        ${listeTours.map(tour => {
          const cnt = parBat[tour] || 0;
          const max = Math.max(...Object.values(parBat), 1);
          return `<div class="bat-row">
            <div class="bat-label">${tour}</div>
            <div class="bat-bar-wrap"><div class="bat-bar" style="width:${Math.round(cnt/max*100)}%"></div></div>
            <div style="width:20px; text-align:right; font-weight:800; color:#3b82f6;">${cnt}</div>
          </div>`;
        }).join('')}
      </div>` : ''}

      ${ouverts.length ? `
      <div class="section">
        <div class="section-title">Détail des signalements ouverts</div>
        <table>
          <thead><tr><th>Réf. / Titre</th><th>Urgence</th><th>Statut</th><th>Lieu</th><th>Date</th></tr></thead>
          <tbody>${ouverts.map(r => `<tr>
            <td style="font-weight:600; max-width:220px; line-height:1.3;">
              <span style="font-size:8px; color:#9ca3af; display:block;">${(r.reference||'').toUpperCase()}</span>
              ${escHtml(r.titre)}
            </td>
            <td><span class="badge" style="background:${urgBg[r.urgence]||'#f3f4f6'};color:${urgColors[r.urgence]||'#374151'};">${urgLabels[r.urgence]||r.urgence}</span></td>
            <td style="font-weight:600; color:#4b5563;">${statLabels[r.statut]||r.statut}</td>
            <td>${escHtml(r.batiment||'—')}</td>
            <td style="color:#6b7280;">${getFmtD(r.created_at)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>` : ''}

      ${expirants.length ? `
      <div class="section">
        <div class="section-title" style="color:#d97706; border-color:#fcd34d;">Alertes Contrats</div>
        <table>
          <thead><tr><th>Fournisseur</th><th>Type</th><th>Échéance</th><th>Délai</th></tr></thead>
          <tbody>${expirants.map(c => {
            const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 0;
            return `<tr>
              <td style="font-weight:700;">${escHtml(c.fournisseur)}</td>
              <td>${escHtml(c.type_contrat)}</td>
              <td>${getFmtD(c.date_echeance)}</td>
              <td style="font-weight:800; color:${d<0?'#dc2626':d<=30?'#ea580c':'#d97706'};">${d<0?'Expiré':d+' j'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>` : ''}

      <div class="footer">
        <span>Généré par CoproSync</span>
        <span>Usage interne strictement confidentiel</span>
        <span>${today}</span>
      </div>

      <script>
        window.onload = () => { 
          setTimeout(() => { window.print(); window.close(); }, 500); 
        };
      <\/script>
    </body>
    </html>`);
    
    win.document.close();
  } catch(e) {
    console.error('Erreur PDF', e);
    toast('Erreur lors de la génération PDF', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🖨️ Exporter en PDF'; }
  }
}

// ── EXPORT CSV ──
function exportCSV() {
  const getFmtD = (d) => typeof fmtD === 'function' ? fmtD(d) : new Date(d).toLocaleDateString();
  const getDisplayName = (p, n, e, f) => typeof displayName === 'function' ? displayName(p, n, e, f) : (n||p||f);

  const h = ['ID','Titre','Bâtiment','Zone','Urgence','Statut','Catégorie','Auteur','Date'];
  const rows = (cache.tickets||[]).map(t => [
    t.reference || t.id.substring(0,8), 
    `"${(t.titre||'').replace(/"/g, '""')}"`, // Protection des guillemets
    t.batiment || '', 
    t.zone || '', 
    t.urgence || '', 
    t.statut || '', 
    t.categorie || '', 
    `"${getDisplayName(t.auteur_prenom,t.auteur_nom,t.auteur_email,'')}"`, 
    getFmtD(t.created_at)
  ]);
  
  const csv = [h, ...rows].map(r => r.join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' }));
  a.download = `coprosync_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  if (typeof toast === 'function') toast('Export CSV téléchargé', 'ok');
}

// ── EXPORT EXCEL (Amélioré) ──
async function exportXLSX(btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Génération...'; }
  if (typeof toast === 'function') toast('Génération Excel en cours…', 'ok');
  
  try {
    if (!window.XLSX) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = res; s.onerror = () => rej(new Error("Impossible de charger la librairie Excel"));
        document.head.appendChild(s);
      });
    }

    const today = new Date().toLocaleDateString('fr-FR');
    const wb = XLSX.utils.book_new();

    const getFmtD = (d) => typeof fmtD === 'function' ? fmtD(d) : new Date(d).toLocaleDateString();
    const getDisplayName = (p, n, e, f) => typeof displayName === 'function' ? displayName(p, n, e, f) : (n||p||f);

    // ONGLET 1 — SIGNALEMENTS
    const statLabels = { nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic', attente_intervention:'En attente', résolu:'Résolu', clos:'Clos' };
    const urgLabels  = { critique:'Critique', important:'Important', normal:'Normal' };
    const catLabels  = { ascenseur:'Ascenseur', fuite:'Fuite', electricite:'Électricité', securite:'Sécurité', proprete:'Propreté', espaces_verts:'Espaces verts', serrurerie:'Serrurerie', parking:'Parking', autre:'Autre' };

    const ticketData = [
      ['N° Réf.','Titre','Bâtiment','Zone','Urgence','Statut','Catégorie','Auteur','Lot auteur','Date signalement','Jours ouverts'],
      ...(cache.tickets||[]).map(t => {
        const jours = Math.floor((new Date() - new Date(t.created_at)) / 86400000);
        return [
          (t.reference || t.id.substring(0,8)).toUpperCase(),
          t.titre || '', t.batiment || '', t.zone || '',
          urgLabels[t.urgence] || t.urgence || '', statLabels[t.statut] || t.statut || '', catLabels[t.categorie] || t.categorie || '',
          getDisplayName(t.auteur_prenom, t.auteur_nom, t.auteur_email, ''),
          t.auteur_lot || '', getFmtD(t.created_at), jours,
        ];
      })
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ticketData);
    ws1['!cols'] = [10,40,14,22,12,18,16,22,10,16,12].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws1, '🎫 Signalements');

    // ONGLET 2 — RÉSIDENTS
    const { data: residents, error: resError } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (!resError) {
      const roleLabels = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
      const resData = [
        ['Nom','Prénom','Tour','N° Lot','Email','Téléphone','Rôle','Statut','Inscrit le'],
        ...(residents||[]).map(u => [
          u.nom||'', u.prenom||'', u.tour||'', u.lot||'', u.email||'', u.telephone||'',
          roleLabels[u.role]||u.role||'', u.actif===false?'Suspendu':'Actif', getFmtD(u.created_at),
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(resData);
      ws2['!cols'] = [18,16,12,10,30,16,18,12,16].map(w => ({wch:w}));
      XLSX.utils.book_append_sheet(wb, ws2, '👥 Résidents');
    }

    // ONGLET 3 — CONTRATS
    const contratsData = [
      ['Fournisseur','Type','Date début','Date échéance','Montant/an (€)','Contact','Délai (jours)'],
      ...(cache.contrats||[]).map(c => [
        c.fournisseur||'', c.type_contrat||'', getFmtD(c.date_debut), getFmtD(c.date_echeance),
        c.montant_annuel||'', c.contact_nom||'', (typeof daysUntil==='function' ? daysUntil(c.date_echeance) : '')
      ])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(contratsData);
    ws3['!cols'] = [28,24,14,16,16,20,14].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws3, '📄 Contrats');

    // ONGLET 4 — STATISTIQUES (Dynamique)
    const t = cache.tickets || [];
    const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
    const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');
    
    // Récupère dynamiquement les tours
    const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];
    const repartitionBat = listeTours.map(tour => [tour, ouverts.filter(x=>x.batiment===tour).length]);

    const statsData = [
      ['Indicateur', 'Valeur'],
      ['Total signalements', t.length],
      ['Signalements ouverts', ouverts.length],
      ['Signalements résolus', resolus.length],
      ['Critiques actifs', ouverts.filter(x=>x.urgence==='critique').length],
      ['Transmis au syndic', ouverts.filter(x=>x.statut==='transmis_syndic').length],
      ['Taux de résolution (%)', t.length ? Math.round(resolus.length/t.length*100) : 0],
      ['Résidents inscrits', residents ? residents.length : 'N/A'],
      ['Contrats actifs', (cache.contrats||[]).length],
      ['', ''],
      ['Répartition par bâtiment (Ouverts)', ''],
      ...repartitionBat,
      ['', ''],
      ['Export généré le', today],
      ['Par', typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : 'Syndic'],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(statsData);
    ws4['!cols'] = [{wch:35},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws4, '📊 Statistiques');

    XLSX.writeFile(wb, `CoproSync_Rapport_${new Date().toISOString().split('T')[0]}.xlsx`);
    if (typeof toast === 'function') toast('✅ Export Excel téléchargé !', 'ok');

  } catch(e) {
    console.error('[exportXLSX]', e);
    if (typeof toast === 'function') toast('Erreur export Excel : ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📊 Excel'; }
  }
}