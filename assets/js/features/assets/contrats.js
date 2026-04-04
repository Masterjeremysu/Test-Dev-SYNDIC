/* ═══════════════════════════════════════════════════════════════
   MODULE CONTRATS — Gestion de Copropriété
   Dépendances : sb, cache.contrats, user, fmtD, daysUntil,
                 $, toast, openModal, closeModal, addLog,
                 loadContrats, updateBadges, emptyState
═══════════════════════════════════════════════════════════════ */

/* ─── CSS injecté une seule fois ─────────────────────────────── */
(function injectContratCSS() {
  if (document.getElementById('contrats-css')) return;
  const style = document.createElement('style');
  style.id = 'contrats-css';
  style.textContent = `
    .contrats-header  { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:20px; }
    .contrats-kpis    { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
    .contrats-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
    .contrats-toolbar input[type=search] {
      flex:1; min-width:180px; padding:8px 12px; border:1px solid var(--border,#e2e8f0);
      border-radius:8px; font-size:13px; background:var(--surface,#fff); color:var(--text-1,#1a202c);
      outline:none; transition:border .2s;
    }
    .contrats-toolbar input[type=search]:focus { border-color:var(--primary,#6366f1); }

    .kpi-card { background:var(--surface,#fff); border:1px solid var(--border,#e2e8f0); border-radius:12px; padding:14px 20px; min-width:140px; flex:1; box-shadow:0 1px 4px rgba(0,0,0,.05); }
    .kpi-card .kpi-label { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3,#94a3b8); font-weight:600; }
    .kpi-card .kpi-value { font-size:22px; font-weight:700; color:var(--text-1,#1a202c); margin-top:4px; }
    .kpi-card .kpi-sub   { font-size:11px; color:var(--text-3,#94a3b8); margin-top:2px; }
    .kpi-card.kpi-alert  { border-color:var(--red,#ef4444); background:rgba(239,68,68,.04); }
    .kpi-card.kpi-alert .kpi-value { color:var(--red,#ef4444); }

    .tbl-wrap          { overflow-x:auto; }
    .tbl-wrap table    { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl-wrap thead th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3,#94a3b8); font-weight:600; border-bottom:1px solid var(--border,#e2e8f0); white-space:nowrap; cursor:pointer; user-select:none; }
    .tbl-wrap thead th:hover { color:var(--text-1,#1a202c); }
    .tbl-wrap tbody tr { border-bottom:1px solid var(--border-light,#f1f5f9); transition:background .15s; }
    .tbl-wrap tbody tr:hover { background:var(--surface-hover,#f8fafc); }
    .tbl-wrap td       { padding:12px; vertical-align:top; }
    tr.row-expired     { background:rgba(239,68,68,.03); }
    tr.row-alert       { background:rgba(245,158,11,.03); }

    .badge-status   { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; }
    .badge-expired  { background:rgba(239,68,68,.12); color:var(--red,#ef4444); border:1px solid rgba(239,68,68,.25); }
    .badge-alert    { background:rgba(245,158,11,.12); color:var(--amber,#f59e0b); border:1px solid rgba(245,158,11,.25); }
    .badge-ok       { background:rgba(34,197,94,.12); color:var(--green,#22c55e); border:1px solid rgba(34,197,94,.25); }
    .badge-inactive { background:rgba(148,163,184,.12); color:var(--text-3,#94a3b8); border:1px solid rgba(148,163,184,.25); }
    .badge-normal   { background:var(--surface-2,#f1f5f9); color:var(--text-2,#64748b); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:500; }

    .contact-block     { display:flex; flex-direction:column; gap:2px; }
    .contact-block a   { color:var(--primary,#6366f1); text-decoration:none; font-size:12px; }
    .contact-block a:hover { text-decoration:underline; }

    .notes-cell    { max-width:180px; }
    .notes-short   { color:var(--text-2,#64748b); font-size:12px; white-space:pre-wrap; word-break:break-word; }
    .notes-toggle  { font-size:11px; color:var(--primary,#6366f1); cursor:pointer; margin-top:2px; background:none; border:none; padding:0; }

    .row-actions   { display:flex; gap:6px; }
    .btn-icon      { padding:5px 8px; border-radius:7px; border:1px solid var(--border,#e2e8f0); background:var(--surface,#fff); cursor:pointer; font-size:13px; transition:background .15s, border-color .15s; color:var(--text-2,#64748b); }
    .btn-icon:hover             { background:var(--surface-2,#f1f5f9); }
    .btn-icon.btn-danger:hover  { background:rgba(239,68,68,.1); border-color:var(--red,#ef4444); color:var(--red,#ef4444); }

    .toggle-pill { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; border-radius:20px; border:1px solid var(--border,#e2e8f0); background:var(--surface,#fff); cursor:pointer; font-size:12px; font-weight:600; color:var(--text-2,#64748b); transition:all .2s; user-select:none; }
    .toggle-pill.active { background:var(--primary,#6366f1); border-color:var(--primary,#6366f1); color:#fff; }

    .days-chip         { font-size:12px; font-weight:700; }
    .days-chip.expired { color:var(--red,#ef4444); }
    .days-chip.alert   { color:var(--amber,#f59e0b); }
    .days-chip.ok      { color:var(--green,#22c55e); }

    .contrats-empty      { text-align:center; padding:60px 20px; color:var(--text-3,#94a3b8); }
    .contrats-empty .empty-icon { font-size:40px; margin-bottom:12px; }
    .contrats-empty p    { font-size:13px; margin-top:6px; }

    .doc-url-wrap { display:flex; gap:8px; align-items:center; }
    .doc-url-wrap input { flex:1; }
  `;
  document.head.appendChild(style);
})();

/* ─── État local ──────────────────────────────────────────────── */
const _C = {
  search:     '',
  activeOnly: false,
  sortKey:    'date_echeance',
  sortDir:    1,
};

/* ─── Statut métier ───────────────────────────────────────────── */
function getContratStatus(contrat) {
  if (!contrat.actif) return { label:'Inactif', icon:'○', cls:'badge-inactive', rowCls:'' };
  const days   = daysUntil(contrat.date_echeance);
  const alerte = contrat.alerte_jours ?? 90;
  if (days < 0)       return { label:'Expiré',  icon:'✕', cls:'badge-expired', rowCls:'row-expired' };
  if (days <= alerte) return { label:'Alerte',   icon:'⚠', cls:'badge-alert',   rowCls:'row-alert'   };
  return                     { label:'Conforme', icon:'✓', cls:'badge-ok',      rowCls:''            };
}

/* ─── KPIs ────────────────────────────────────────────────────── */
function _buildKPIs(contrats) {
  const actifs  = contrats.filter(c => c.actif);
  const budget  = actifs.reduce((s, c) => s + (c.montant_annuel || 0), 0);
  const expires = contrats.filter(c => getContratStatus(c).label === 'Expiré').length;
  const alertes = contrats.filter(c => getContratStatus(c).label === 'Alerte').length;
  const fmtEur  = n => n.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' €';
  return `
    <div class="contrats-kpis">
      <div class="kpi-card">
        <div class="kpi-label">Budget annuel (actifs)</div>
        <div class="kpi-value">${fmtEur(budget)}</div>
        <div class="kpi-sub">${actifs.length} contrat(s) actif(s)</div>
      </div>
      <div class="kpi-card ${expires ? 'kpi-alert' : ''}">
        <div class="kpi-label">Expirés</div>
        <div class="kpi-value">${expires}</div>
        <div class="kpi-sub">À renouveler</div>
      </div>
      <div class="kpi-card ${alertes ? 'kpi-alert' : ''}">
        <div class="kpi-label">En alerte</div>
        <div class="kpi-value">${alertes}</div>
        <div class="kpi-sub">Échéance proche</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total contrats</div>
        <div class="kpi-value">${contrats.length}</div>
        <div class="kpi-sub">Tous statuts</div>
      </div>
    </div>`;
}

/* ─── Cellules ────────────────────────────────────────────────── */
function _daysCell(c) {
  const days   = daysUntil(c.date_echeance);
  const alerte = c.alerte_jours ?? 90;
  if (days < 0) return `<span class="days-chip expired">Expiré (${-days}j)</span>`;
  const cls = days <= 30 ? 'expired' : days <= alerte ? 'alert' : 'ok';
  return `<span class="days-chip ${cls}">${days}j</span>`;
}

function _contactCell(c) {
  if (!c.contact_nom && !c.contact_tel && !c.contact_email) return '—';
  return `<div class="contact-block">
    ${c.contact_nom   ? `<span style="font-weight:600;font-size:12px;">${_esc(c.contact_nom)}</span>` : ''}
    ${c.contact_tel   ? `<a href="tel:${c.contact_tel}">📞 ${c.contact_tel}</a>` : ''}
    ${c.contact_email ? `<a href="mailto:${c.contact_email}">✉ ${c.contact_email}</a>` : ''}
  </div>`;
}

function _notesCell(c) {
  if (!c.notes) return '—';
  const MAX = 80;
  if (c.notes.length <= MAX) return `<div class="notes-short">${_esc(c.notes)}</div>`;
  return `<div class="notes-cell">
    <div class="notes-short" id="ns-${c.id}">${_esc(c.notes.slice(0, MAX))}…</div>
    <div class="notes-short" id="nf-${c.id}" style="display:none;">${_esc(c.notes)}</div>
    <button class="notes-toggle" onclick="toggleNotes('${c.id}')">Voir plus ▾</button>
  </div>`;
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Filtre + tri ────────────────────────────────────────────── */
function _filtered() {
  let list = [...(cache.contrats || [])];
  list.sort((a, b) => {
    let va, vb;
    if (_C.sortKey === 'montant_annuel') {
      va = a.montant_annuel || 0; vb = b.montant_annuel || 0;
    } else if (['date_echeance', 'date_debut'].includes(_C.sortKey)) {
      va = a[_C.sortKey] || '9999'; vb = b[_C.sortKey] || '9999';
    } else {
      va = (a[_C.sortKey] || '').toString().toLowerCase();
      vb = (b[_C.sortKey] || '').toString().toLowerCase();
    }
    return va < vb ? -_C.sortDir : va > vb ? _C.sortDir : 0;
  });
  if (_C.activeOnly) list = list.filter(c => c.actif);
  if (_C.search) {
    const q = _C.search.toLowerCase();
    list = list.filter(c =>
      (c.fournisseur  || '').toLowerCase().includes(q) ||
      (c.type_contrat || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function _th(label, key) {
  const arrow = _C.sortKey === key ? (_C.sortDir === 1 ? ' ↑' : ' ↓') : '';
  return `<th onclick="sortContrats('${key}')">${label}${arrow}</th>`;
}

/* ─── Interactions publiques ──────────────────────────────────── */
window.toggleNotes = function(id) {
  const s   = document.getElementById('ns-' + id);
  const f   = document.getElementById('nf-' + id);
  const btn = s?.parentElement?.querySelector('.notes-toggle');
  if (!s || !f) return;
  const open = f.style.display !== 'none';
  s.style.display = open ? '' : 'none';
  f.style.display = open ? 'none' : '';
  if (btn) btn.textContent = open ? 'Voir plus ▾' : 'Voir moins ▴';
};

window.sortContrats = function(key) {
  _C.sortDir = _C.sortKey === key ? _C.sortDir * -1 : 1;
  _C.sortKey = key;
  renderContrats();
};

window.filterContrats = function() {
  _C.search = document.getElementById('c-search')?.value || '';
  renderContrats();
};

window.toggleActifsContrats = function() {
  _C.activeOnly = !_C.activeOnly;
  document.getElementById('btn-actifs')?.classList.toggle('active', _C.activeOnly);
  renderContrats();
};

window.clearDocUrl = function() {
  const input = document.getElementById('c-doc-url');
  if (input) input.value = '';
  const preview = document.getElementById('doc-url-preview');
  if (preview) preview.style.display = 'none';
};

/* ─── RENDER ──────────────────────────────────────────────────── */
function renderContrats() {
  const all      = cache.contrats || [];
  const filtered = _filtered();

  const rows = filtered.map(c => {
    const st = getContratStatus(c);
    return `<tr class="${st.rowCls}">
      <td>
        <div style="font-weight:600;font-size:13px;">${_esc(c.fournisseur)}</div>
        <div style="margin-top:3px;">
          <span class="badge-normal">${_esc(c.type_contrat || '—')}</span>
          ${!c.actif ? '<span class="badge-normal" style="margin-left:4px;opacity:.6;">Inactif</span>' : ''}
        </div>
      </td>
      <td><span class="badge-status ${st.cls}">${st.icon} ${st.label}</span></td>
      <td style="font-size:12px;color:var(--text-2);">${fmtD(c.date_debut) || '—'}</td>
      <td style="font-size:12px;font-weight:600;">${fmtD(c.date_echeance) || '—'}</td>
      <td>${_daysCell(c)}</td>
      <td style="font-size:13px;font-weight:600;">${c.montant_annuel != null ? c.montant_annuel.toLocaleString('fr-FR') + ' €' : '—'}</td>
      <td>${_contactCell(c)}</td>
      <td>${_notesCell(c)}</td>
      <td>
        <div class="row-actions">
          ${c.document_url ? `<a href="${_esc(c.document_url)}" target="_blank" class="btn-icon" title="Voir le PDF">📄</a>` : ''}
          <button class="btn-icon" onclick="editContrat('${c.id}')" title="Modifier">✏️</button>
          <button class="btn-icon btn-danger" onclick="deleteContrat('${c.id}','${_esc(c.fournisseur)}')" title="Supprimer">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const empty = `<tr><td colspan="9">
    <div class="contrats-empty">
      <div class="empty-icon">📄</div>
      <strong>Aucun contrat trouvé</strong>
      <p>${_C.search || _C.activeOnly ? 'Modifiez vos filtres.' : 'Ajoutez vos contrats fournisseurs.'}</p>
    </div>
  </td></tr>`;

  $('page').innerHTML = `
    <div style="padding:24px;">
      <div class="contrats-header">
        <div class="ph"><h1>Contrats fournisseurs</h1><p>${all.length} contrat(s) au total</p></div>
        <button class="btn btn-primary" onclick="openModal('m-contrat')">+ Ajouter un contrat</button>
      </div>
      ${_buildKPIs(all)}
      <div class="contrats-toolbar">
        <input type="search" id="c-search" placeholder="🔍 Rechercher un fournisseur…"
          value="${_esc(_C.search)}" oninput="filterContrats()">
        <button class="toggle-pill ${_C.activeOnly ? 'active' : ''}" id="btn-actifs"
          onclick="toggleActifsContrats()">✓ Actifs uniquement</button>
        <span style="font-size:12px;color:var(--text-3);margin-left:auto;">${filtered.length} résultat(s)</span>
      </div>
      <div class="card">
        <div class="tbl-wrap">
          <table>
            <thead><tr>
              ${_th('Fournisseur',  'fournisseur')}
              ${_th('Statut',       'actif')}
              ${_th('Début',        'date_debut')}
              ${_th('Échéance',     'date_echeance')}
              ${_th('Délai',        'date_echeance')}
              ${_th('Montant/an',   'montant_annuel')}
              <th>Contact</th><th>Notes</th><th>Actions</th>
            </tr></thead>
            <tbody>${filtered.length ? rows : empty}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

/* ─── Collecte formulaire ─────────────────────────────────────── */
function _collectFormData() {
  return {
    fournisseur:    $('c-four')?.value.trim()      || null,
    type_contrat:   $('c-type')?.value.trim()       || null,
    date_debut:     $('c-deb')?.value               || null,
    date_echeance:  $('c-ech')?.value               || null,
    contact_nom:    $('c-cont-nom')?.value.trim()   || null,
    contact_tel:    $('c-cont-tel')?.value.trim()   || null,
    contact_email:  $('c-cont-email')?.value.trim() || null,
    montant_annuel: parseFloat($('c-mont')?.value)  || null,
    alerte_jours:   parseInt($('c-alerte')?.value)  || 90,
    document_url:   $('c-doc-url')?.value.trim()    || null,
    notes:          $('c-notes')?.value.trim()       || null,
    actif:          $('c-actif')?.checked !== false,
  };
}

/* ─── Reset formulaire ────────────────────────────────────────── */
function _resetForm() {
  ['c-four','c-deb','c-ech','c-cont-nom','c-cont-tel',
   'c-cont-email','c-mont','c-doc-url','c-notes'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  const alerte = $('c-alerte'); if (alerte) alerte.value = '90';
  const actif  = $('c-actif');  if (actif)  actif.checked = true;
  const title  = document.getElementById('m-contrat-title');
  if (title) title.textContent = 'Ajouter un contrat';
  window.clearDocUrl();
  window._editingContratId = null;
}

/* ─── INSERT ──────────────────────────────────────────────────── */
async function submitContrat() {
  const d = _collectFormData();
  if (!d.fournisseur || !d.date_echeance) {
    toast('Fournisseur et échéance requis', 'err'); return;
  }
  const { data, error } = await sb
    .from('contrats')
    .insert({ ...d, created_by: user.id })
    .select().single();
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  await addLog('Contrat ajouté', 'contrat', data.id, { fournisseur: d.fournisseur });
  await loadContrats();
  closeModal('m-contrat');
  _resetForm();
  toast('Contrat enregistré ✓', 'ok');
  updateBadges();
  renderContrats();
}

/* ─── UPDATE ──────────────────────────────────────────────────── */
async function updateContrat() {
  const id = window._editingContratId;
  const d  = _collectFormData();
  if (!d.fournisseur || !d.date_echeance) {
    toast('Fournisseur et échéance requis', 'err'); return;
  }
  const { error } = await sb.from('contrats').update(d).eq('id', id);
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  await addLog('Contrat modifié', 'contrat', id, { fournisseur: d.fournisseur });
  await loadContrats();
  closeModal('m-contrat');
  _resetForm();
  toast('Contrat mis à jour ✓', 'ok');
  updateBadges();
  renderContrats();
}

/* ─── Point d'entrée unique formulaire ───────────────────────── */
window.submitOrUpdateContrat = function() {
  if (window._editingContratId) updateContrat();
  else submitContrat();
};

/* ─── EDIT ────────────────────────────────────────────────────── */
window.editContrat = async function(id) {
  const c = (cache.contrats || []).find(x => x.id === id);
  if (!c) { toast('Contrat introuvable', 'err'); return; }

  const set    = (sel, val) => { const el = $(sel); if (el) el.value = val ?? ''; };
  const setChk = (sel, val) => { const el = $(sel); if (el) el.checked = !!val; };

  set('c-four',       c.fournisseur);
  set('c-type',       c.type_contrat);
  set('c-deb',        c.date_debut);
  set('c-ech',        c.date_echeance);
  set('c-cont-nom',   c.contact_nom);
  set('c-cont-tel',   c.contact_tel);
  set('c-cont-email', c.contact_email);
  set('c-mont',       c.montant_annuel);
  set('c-alerte',     c.alerte_jours ?? 90);
  set('c-doc-url',    c.document_url);
  set('c-notes',      c.notes);
  setChk('c-actif',   c.actif !== false);

  if (c.document_url) {
    const preview = document.getElementById('doc-url-preview');
    const link    = document.getElementById('doc-url-preview-link');
    if (preview && link) {
      link.href        = c.document_url;
      link.textContent = c.document_url.split('/').pop();
      preview.style.display = 'flex';
    }
  }

  const title = document.getElementById('m-contrat-title');
  if (title) title.textContent = 'Modifier le contrat';

  window._editingContratId = id;
  openModal('m-contrat');
};

/* ─── DELETE ──────────────────────────────────────────────────── */
window.deleteContrat = async function(id, nom) {
  if (!confirm(`Supprimer le contrat "${nom}" ? Cette action est irréversible.`)) return;
  const { error } = await sb.from('contrats').delete().eq('id', id);
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  await addLog('Contrat supprimé', 'contrat', id, { fournisseur: nom });
  await loadContrats();
  toast('Contrat supprimé', 'ok');
  updateBadges();
  renderContrats();
};

// ── CLÉS ──
