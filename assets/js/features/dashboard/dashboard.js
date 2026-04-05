// ── DASHBOARD v5 — Paramétrable ──
// Drag & drop, visible/masqué, taille compact/normal/large
// Tout sauvegardé en localStorage, zéro régression

let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ═══════════════════════════════════════════════════════════════
   CONFIGURATION DES WIDGETS
   Chaque widget a : id, label, ico, defaultVisible, defaultSize
   Les tailles : compact | normal | large
═══════════════════════════════════════════════════════════════ */
const DASH_WIDGETS = [
  { id: 'situation',  label: 'Situation Room',      ico: '🚨', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'chart',      label: 'Activité 6 mois',     ico: '📊', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'zones',      label: 'Par bâtiment',        ico: '🏢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'contrats',   label: 'Contrats',            ico: '📄', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'events',     label: 'Événements',          ico: '📅', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'annonces',   label: 'Annonces',            ico: '📢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'votes',      label: 'Votes en cours',      ico: '🗳️', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'documents',  label: 'Documents récents',   ico: '📁', managerOnly: false, defaultVisible: true,  defaultSize: 'compact' },
  { id: 'install',    label: "Installer l'app",     ico: '📱', managerOnly: false, defaultVisible: false, defaultSize: 'compact' },
];

const DASH_LS_KEY = 'coprosync_dash_prefs_v1';

/* ─── Persistance localStorage ────────────────────────────── */
function _dashLoadPrefs() {
  try {
    const raw = localStorage.getItem(DASH_LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function _dashSavePrefs(prefs) {
  try { localStorage.setItem(DASH_LS_KEY, JSON.stringify(prefs)); } catch(e) {}
}

function _dashGetWidgetPref(id, key) {
  const prefs = _dashLoadPrefs();
  const w = DASH_WIDGETS.find(x => x.id === id);
  if (!w) return null;
  if (prefs[id] && key in prefs[id]) return prefs[id][key];
  if (key === 'visible') return w.defaultVisible;
  if (key === 'size')    return w.defaultSize;
  return null;
}

function _dashGetOrder() {
  const prefs = _dashLoadPrefs();
  const saved = prefs._order;
  const ids   = DASH_WIDGETS.map(w => w.id);
  if (!saved) return ids;
  // Merge : garder les ids sauvegardés + ajouter les nouveaux
  const merged = saved.filter(id => ids.includes(id));
  ids.forEach(id => { if (!merged.includes(id)) merged.push(id); });
  return merged;
}

function _dashSetWidgetPref(id, key, val) {
  const prefs = _dashLoadPrefs();
  if (!prefs[id]) prefs[id] = {};
  prefs[id][key] = val;
  _dashSavePrefs(prefs);
}

function _dashSetOrder(order) {
  const prefs = _dashLoadPrefs();
  prefs._order = order;
  _dashSavePrefs(prefs);
}

/* ─── CSS ─────────────────────────────────────────────────── */
(function injectDashV5CSS() {
  if (document.getElementById('dash-v5-css')) return;
  const s = document.createElement('style');
  s.id = 'dash-v5-css';
  s.textContent = `
    /* ── Situation Room ── */
    .sr-wrap { border-radius:14px; overflow:hidden; border:1px solid var(--border); box-shadow:0 1px 8px rgba(0,0,0,.06); margin-bottom:4px; }
    .sr-bar { display:flex; align-items:center; gap:12px; padding:13px 18px; font-size:13px; font-weight:600; }
    .sr-bar.sr-ok   { background:linear-gradient(100deg,#15803d,#22c55e); color:#fff; }
    .sr-bar.sr-warn { background:linear-gradient(100deg,#b45309,#f59e0b); color:#fff; }
    .sr-bar.sr-crit { background:linear-gradient(100deg,#b91c1c,#ef4444); color:#fff; }
    .sr-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; background:rgba(255,255,255,.55); box-shadow:0 0 0 3px rgba(255,255,255,.2); }
    .sr-dot.blink { animation:srBlink 1.6s ease-in-out infinite; }
    @keyframes srBlink { 0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,.2);}50%{box-shadow:0 0 0 8px rgba(255,255,255,.0);} }
    .sr-phrase { flex:1; opacity:.93; }
    .sr-time { font-size:11px; font-weight:500; opacity:.65; }
    .sr-body { background:var(--surface); padding:10px 14px 12px; display:flex; flex-direction:column; gap:5px; }
    .sr-empty { padding:13px 18px; background:var(--surface); font-size:13px; color:var(--text-3); text-align:center; }
    .sr-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); margin-bottom:1px; }
    .ac { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px; cursor:pointer; border:1px solid transparent; transition:box-shadow .14s,transform .14s; }
    .ac:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.09); }
    .ac.ac-r { background:rgba(239,68,68,.08);   border-color:rgba(239,68,68,.22); }
    .ac.ac-o { background:rgba(245,158,11,.08);  border-color:rgba(245,158,11,.22); }
    .ac.ac-b { background:rgba(59,130,246,.08);  border-color:rgba(59,130,246,.22); }
    .ac-ico  { font-size:17px; flex-shrink:0; line-height:1; }
    .ac-body { flex:1; min-width:0; }
    .ac-title { font-size:12.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ac.ac-r .ac-title { color:var(--red,#ef4444); }
    .ac.ac-o .ac-title { color:var(--amber,#f59e0b); }
    .ac.ac-b .ac-title { color:var(--accent,#2563eb); }
    .ac-sub  { font-size:11px; color:var(--text-3); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ac-cta  { font-size:11px; font-weight:700; padding:3px 10px; border-radius:6px; border:none; cursor:pointer; flex-shrink:0; white-space:nowrap; }
    .ac.ac-r .ac-cta { background:var(--red,#ef4444);   color:#fff; }
    .ac.ac-o .ac-cta { background:var(--amber,#f59e0b); color:#fff; }
    .ac.ac-b .ac-cta { background:var(--accent,#2563eb); color:#fff; }

    /* ── Contrats widget ── */
    .dcc-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; border-bottom:1px solid var(--border); }
    .dcc-kpi { text-align:center; padding:8px 4px; border-radius:8px; background:var(--surface-2); }
    .dcc-kpi-val { font-size:18px; font-weight:800; line-height:1; }
    .dcc-kpi-label { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); font-weight:600; margin-top:3px; }
    .dcc-kpi.ck-r { background:rgba(239,68,68,.08); } .dcc-kpi.ck-r .dcc-kpi-val { color:var(--red,#ef4444); }
    .dcc-kpi.ck-o { background:rgba(245,158,11,.08); } .dcc-kpi.ck-o .dcc-kpi-val { color:var(--amber,#f59e0b); }
    .dcc-kpi.ck-g { background:rgba(34,197,94,.08); }  .dcc-kpi.ck-g .dcc-kpi-val { color:var(--green,#22c55e); }
    .dcc-row { display:flex; align-items:center; gap:10px; padding:9px 16px; cursor:pointer; transition:background .12s; border-bottom:1px solid var(--border-light,#f1f5f9); }
    .dcc-row:last-child { border-bottom:none; }
    .dcc-row:hover { background:var(--surface-2); }
    .dcc-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dcc-name { font-size:13px; font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dcc-type { font-size:11px; color:var(--text-3); }
    .dcc-days { font-size:12px; font-weight:800; flex-shrink:0; }
    .dcc-budget { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid var(--border); }
    .dcc-budget-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3); }
    .dcc-budget-val { font-size:14px; font-weight:800; color:var(--text-1,#1a202c); }
    .dcc-empty { padding:16px; text-align:center; font-size:13px; color:var(--text-3); }

    /* ── Layout dashboard ── */
    .dash5 { padding:6px 0 24px; }
    .dash5-hero { padding:18px 18px 16px; border:1px solid var(--border); border-radius:20px; background:radial-gradient(600px 220px at 95% -20%,rgba(37,99,235,.08),transparent 60%),radial-gradient(460px 180px at -10% 120%,rgba(124,58,237,.08),transparent 60%),var(--surface); margin-bottom:20px; }
    .dash5-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
    .dash5-focusbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
    .dash5-chip { appearance:none; border:1px solid var(--border); background:var(--surface); color:var(--text-2); border-radius:999px; padding:7px 12px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; user-select:none; }
    .dash5-chip:hover { border-color:var(--border-strong); transform:translateY(-1px); }
    .dash5-chip.sel { border-color:var(--accent); background:rgba(37,99,235,.11); color:var(--accent); }
    .dash5-chip.danger.sel { border-color:var(--red); background:rgba(220,38,38,.10); color:var(--red); }
    .dash5-chip.warn.sel { border-color:var(--orange); background:rgba(234,88,12,.12); color:var(--orange); }
    .dash5-chip.success.sel { border-color:var(--green); background:rgba(22,163,74,.12); color:var(--green); }
    .dash5-chip.info.sel { border-color:var(--accent); background:rgba(37,99,235,.12); color:var(--accent); }
    .dash5-layout { display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }
    @media(max-width:900px){ .dash5-layout { grid-template-columns:1fr; } .dash5-kpis { grid-template-columns:1fr 1fr; } }
    @media(max-width:480px){ .dash5-kpis { grid-template-columns:1fr 1fr; gap:8px; } }
    .dash5-col-left { display:flex; flex-direction:column; gap:0; }
    .dash5-col-right { display:flex; flex-direction:column; gap:14px; }

    /* ── Widget shell ── */
    .d5w {
      background:var(--surface); border:1px solid var(--border);
      border-radius:16px; overflow:hidden;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
      transition:box-shadow .2s, border-color .2s;
    }
    .d5w.dragging { opacity:.55; transform:scale(.98); box-shadow:0 8px 32px rgba(37,99,235,.18); border-color:var(--accent); }
    .d5w.drag-over { border-color:var(--accent); box-shadow:0 0 0 3px rgba(37,99,235,.15); }
    .d5w[data-size="compact"] .d5w-extra { display:none; }
    .d5w[data-size="large"]   .d5w-chart canvas { height:160px !important; }
    .d5w-head { display:flex; align-items:center; gap:8px; padding:12px 14px 11px; border-bottom:1px solid var(--border); }
    .d5w-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); flex:1; }
    .d5w-link { font-size:12px; font-weight:600; color:var(--text-3); background:none; border:none; cursor:pointer; padding:0; }
    .d5w-link:hover { color:var(--text); }
    .d5w-tools { display:flex; align-items:center; gap:4px; }
    .d5w-btn { width:26px; height:26px; border:1px solid var(--border); border-radius:7px; background:var(--surface-2); color:var(--text-3); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all .14s; }
    .d5w-btn:hover { border-color:var(--border-strong); color:var(--text); }
    .d5w-handle { cursor:grab; font-size:12px; }
    .d5w-handle:active { cursor:grabbing; }
    .d5w-body { padding:12px 16px 14px; }
    .d5w-body.no-pad { padding:0; }

    /* Mode édition — animation légère */
    .dash5.editing .d5w { animation:dashFloat 5s ease-in-out infinite; }
    .dash5.editing .d5w:nth-child(2n) { animation-delay:-.5s; }
    .dash5.editing .d5w:nth-child(3n) { animation-delay:-1s; }
    @keyframes dashFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-2px);} }
    .dash5.editing .d5w.dragging { animation:none; }

    /* ── Panneau personnaliser ── */
    .d5-customize {
      display:none; position:fixed;
      top:68px; right:16px;
      width:min(380px,calc(100vw - 32px));
      max-height:calc(100dvh - 90px); overflow-y:auto;
      background:var(--surface); border:1px solid var(--border);
      border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.18);
      z-index:200; padding:18px;
    }
    .d5-customize.open { display:block; animation:pageIn .2s ease both; }
    .d5-customize-title { font-family:var(--font-head); font-size:18px; font-weight:800; letter-spacing:-.3px; margin-bottom:4px; }
    .d5-customize-sub { font-size:12px; color:var(--text-3); margin-bottom:16px; }
    .d5-widget-list { display:flex; flex-direction:column; gap:8px; }
    .d5-witem {
      display:flex; align-items:center; gap:10px; padding:10px 12px;
      border:1px solid var(--border); border-radius:12px;
      background:var(--surface-2); transition:opacity .2s;
    }
    .d5-witem.hidden { opacity:.5; }
    .d5-witem-ico { font-size:18px; flex-shrink:0; }
    .d5-witem-label { flex:1; font-size:13px; font-weight:600; }
    .d5-witem-size {
      font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
      padding:3px 9px; border-radius:999px; border:1px solid var(--border);
      background:var(--surface); color:var(--text-2); cursor:pointer;
      transition:all .14s;
    }
    .d5-witem-size:hover { border-color:var(--accent); color:var(--accent); }
    .d5-witem-toggle {
      width:34px; height:20px; border-radius:10px; border:none; cursor:pointer;
      position:relative; transition:background .2s; flex-shrink:0;
      background:var(--border-strong);
    }
    .d5-witem-toggle.on { background:var(--accent); }
    .d5-witem-toggle::after {
      content:''; position:absolute; top:3px; left:3px;
      width:14px; height:14px; border-radius:50%; background:#fff;
      transition:transform .2s;
    }
    .d5-witem-toggle.on::after { transform:translateX(14px); }
    .d5-reset { width:100%; margin-top:14px; }

    /* ── Barre d'édition ── */
    .d5-editbar {
      display:none; align-items:center; gap:10px; padding:10px 14px;
      background:rgba(37,99,235,.08); border:1px solid rgba(37,99,235,.2);
      border-radius:12px; margin-bottom:16px; flex-wrap:wrap;
    }
    .d5-editbar.show { display:flex; animation:pageIn .2s ease both; }
    .d5-editbar-label { font-size:12px; font-weight:700; color:var(--accent); flex:1; }

    /* ── Tickets récents ── */
    .d5-ticket { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; cursor:pointer; transition:background .12s; border-bottom:1px solid var(--border-light,#f1f5f9); position:relative; }
    .d5-ticket:last-child { border-bottom:none; }
    .d5-ticket:hover { background:var(--surface-2,#f8fafc); }
    .d5-ticket-stripe { position:absolute; left:0; top:0; bottom:0; width:3px; }
    .d5-ticket-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
    .d5-ticket-body { flex:1; min-width:0; }
    .d5-ticket-title { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .d5-ticket-meta { display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap; }
    .d5-ticket-loc { font-size:11px; color:var(--text-3); }
    .d5-ticket-age { font-size:10px; color:var(--text-3); }

    /* ── Zones bâtiment ── */
    .d5-zone { display:flex; align-items:center; gap:10px; padding:8px 14px; cursor:pointer; transition:background .12s; }
    .d5-zone:hover { background:var(--surface-2); }
    .d5-zone-name { font-size:12px; font-weight:600; width:88px; flex-shrink:0; color:var(--text-2); }
    .d5-zone-track { flex:1; height:5px; background:var(--border-light,#f1f5f9); border-radius:3px; overflow:hidden; }
    .d5-zone-fill { height:100%; border-radius:3px; }
    .d5-zone-num { font-size:12px; font-weight:800; width:20px; text-align:right; flex-shrink:0; }

    /* ── List rows générique ── */
    .d5-row { display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer; transition:background .12s; border-bottom:1px solid var(--border-light,#f1f5f9); }
    .d5-row:last-child { border-bottom:none; }
    .d5-row:hover { background:var(--surface-2); }
    .d5-row-ico { font-size:16px; flex-shrink:0; }
    .d5-row-body { flex:1; min-width:0; }
    .d5-row-title { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .d5-row-sub { font-size:11px; color:var(--text-3); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .d5-pill { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
    .d5-pill-r { background:rgba(239,68,68,.1);   color:var(--red,#ef4444);   border:1px solid rgba(239,68,68,.2); }
    .d5-pill-o { background:rgba(245,158,11,.1);  color:var(--amber,#f59e0b); border:1px solid rgba(245,158,11,.2); }
    .d5-pill-g { background:rgba(34,197,94,.1);   color:var(--green,#22c55e); border:1px solid rgba(34,197,94,.2); }
    .d5-pill-b { background:rgba(59,130,246,.1);  color:var(--accent,#2563eb);border:1px solid rgba(59,130,246,.2); }
    .d5-pill-n { background:var(--surface-2,#f1f5f9); color:var(--text-2); border:1px solid var(--border); }
    .d5-empty { padding:24px 14px; text-align:center; font-size:13px; color:var(--text-3); }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   HELPERS INTERNES
═══════════════════════════════════════════════════════════════ */
function _e(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _eur(n) { return (n||0).toLocaleString('fr-FR',{minimumFractionDigits:0})+'\u00a0\u20ac'; }

/* ═══════════════════════════════════════════════════════════════
   SITUATION ROOM
═══════════════════════════════════════════════════════════════ */
function _buildSituationRoom(ouverts, critiques, syndic) {
  const actifs      = (cache.contrats||[]).filter(c => c.actif !== false);
  const contratsExp = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => { const d=daysUntil(c.date_echeance); return d>=0&&d<=(c.alerte_jours??90); });
  const votes       = (typeof _votesCache!=='undefined')?_votesCache.filter(v=>v.statut==='ouvert'):[];
  const sansMaRep   = (typeof _reponsesCache!=='undefined')?votes.filter(v=>!_reponsesCache[v.id]):[];

  const isCrit = critiques.length>0||contratsExp.length>0;
  const isWarn = !isCrit&&(contratsAlt.length>0||syndic.length>0);

  let barCls, phrase;
  if (isCrit) {
    barCls = 'sr-crit';
    const p=[];
    if(critiques.length)   p.push(critiques.length+' signalement'+(critiques.length>1?'s critiques':' critique'));
    if(contratsExp.length) p.push(contratsExp.length+' contrat'+(contratsExp.length>1?'s expirés':' expiré'));
    phrase = 'Action requise \u2014 '+p.join(' \u00b7 ');
  } else if (isWarn) {
    barCls = 'sr-warn';
    const p=[];
    if(contratsAlt.length) p.push(contratsAlt.length+' contrat'+(contratsAlt.length>1?'s en alerte':' en alerte'));
    if(syndic.length)      p.push(syndic.length+' dossier'+(syndic.length>1?'s transmis':' transmis'));
    phrase = 'Vigilance \u2014 '+p.join(' \u00b7 ');
  } else {
    barCls = 'sr-ok';
    phrase = 'R\u00e9sidence sous contr\u00f4le \u2014 aucune anomalie d\u00e9tect\u00e9e';
  }

  const cards=[];
  critiques.slice(0,2).forEach(tk=>cards.push({cls:'ac-r',ico:'🚨',title:_e(tk.titre),sub:_e((tk.batiment||'')+(tk.zone?' \u00b7 '+tk.zone:''))+' \u2014 '+depuisJours(tk.created_at),btn:'Traiter',fn:"openDetail('"+tk.id+"')"}));
  contratsExp.slice(0,2).forEach(c=>cards.push({cls:'ac-r',ico:'📄',title:_e(c.fournisseur)+' \u2014 contrat expir\u00e9',sub:_e(c.type_contrat||'')+' \u00b7 expir\u00e9 depuis '+Math.abs(daysUntil(c.date_echeance))+'j',btn:'G\u00e9rer',fn:"nav('contrats')"}));
  contratsAlt.slice(0,2).forEach(c=>cards.push({cls:'ac-o',ico:'⚠️',title:_e(c.fournisseur)+' \u2014 \u00e9ch\u00e9ance dans '+daysUntil(c.date_echeance)+'j',sub:_e(c.type_contrat||'')+(c.contact_nom?' \u00b7 '+_e(c.contact_nom):''),btn:'Voir',fn:"nav('contrats')"}));
  if(sansMaRep.length>0) cards.push({cls:'ac-b',ico:'🗳️',title:sansMaRep.length+' vote'+(sansMaRep.length>1?'s':'')+' en attente',sub:sansMaRep.slice(0,2).map(v=>_e(v.titre)).join(' \u00b7 '),btn:'Voter',fn:"nav('votes')"});

  const bodyHTML = cards.length===0
    ? '<div class="sr-empty">\u2705 Aucune action imm\u00e9diate requise</div>'
    : '<div class="sr-body"><div class="sr-lbl">Actions requises</div>'
      +cards.map(a=>'<div class="ac '+a.cls+'" onclick="'+a.fn+'">'
        +'<div class="ac-ico">'+a.ico+'</div>'
        +'<div class="ac-body"><div class="ac-title">'+a.title+'</div><div class="ac-sub">'+a.sub+'</div></div>'
        +'<button class="ac-cta" onclick="event.stopPropagation();'+a.fn+'">'+a.btn+'</button>'
        +'</div>').join('')
      +'</div>';

  return '<div class="sr-wrap">'
    +'<div class="sr-bar '+barCls+'">'
    +'<div class="sr-dot'+(barCls!=='sr-ok'?' blink':'')+'"></div>'
    +'<span class="sr-phrase">'+phrase+'</span>'
    +'<span class="sr-time">'+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</span>'
    +'</div>'+bodyHTML+'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   CONTENU DES WIDGETS
═══════════════════════════════════════════════════════════════ */
function _widgetChart() {
  return '<div class="d5w-chart" style="padding:12px 14px;"><div style="position:relative;">'
    +'<canvas id="dash-chart" height="110"></canvas>'
    +'<div id="dash-chart-tip" class="dash2-chart-tip" style="display:none;"></div>'
    +'</div></div>';
}

function _widgetZones(ouverts) {
  const zones=(COPRO.tours||[]).concat(['Parking visiteurs','Parking priv\u00e9','Garages','Aire de jeux','Portails / portillons','Ext\u00e9rieur g\u00e9n\u00e9ral']);
  const max=Math.max(1,...zones.map(z=>ouverts.filter(t=>t.batiment===z).length));
  const rows=zones.map(zone=>{
    const cnt=ouverts.filter(t=>t.batiment===zone).length;
    if(!cnt) return '';
    const pct=Math.round((cnt/max)*100);
    const color=cnt>=3?'var(--red)':cnt>=2?'var(--orange)':'var(--accent)';
    return '<div class="d5-zone" onclick="setDashZoneFocus('+JSON.stringify(zone)+')" title="Focus : '+_e(zone)+'">'
      +'<div class="d5-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="d5-zone-track"><div class="d5-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="d5-zone-num" style="color:'+color+';">'+cnt+'</div>'
      +'</div>';
  }).join('');
  return '<div id="dash-zone-list">'+( rows||'<div class="d5-empty">Aucun probl\u00e8me ouvert \ud83c\udf89</div>')+'</div>';
}

function _widgetContrats() {
  const actifs   =(cache.contrats||[]).filter(c=>c.actif!==false);
  const expires  =actifs.filter(c=>daysUntil(c.date_echeance)<0);
  const alertes  =actifs.filter(c=>{const d=daysUntil(c.date_echeance);return d>=0&&d<=(c.alerte_jours??90);});
  const conformes=actifs.filter(c=>daysUntil(c.date_echeance)>(c.alerte_jours??90));
  const budget   =actifs.reduce((s,c)=>s+(c.montant_annuel||0),0);
  const urgents  =[...expires,...alertes].sort((a,b)=>new Date(a.date_echeance)-new Date(b.date_echeance)).slice(0,4);

  return '<div class="dcc-kpis">'
    +'<div class="dcc-kpi '+(expires.length?'ck-r':'')+'"><div class="dcc-kpi-val">'+expires.length+'</div><div class="dcc-kpi-label">Expir\u00e9s</div></div>'
    +'<div class="dcc-kpi '+(alertes.length?'ck-o':'')+'"><div class="dcc-kpi-val">'+alertes.length+'</div><div class="dcc-kpi-label">En alerte</div></div>'
    +'<div class="dcc-kpi ck-g"><div class="dcc-kpi-val">'+conformes.length+'</div><div class="dcc-kpi-label">Conformes</div></div>'
    +'</div>'
    +(urgents.length===0?'<div class="dcc-empty">\u2705 Tous conformes</div>':urgents.map(c=>{
        const d=daysUntil(c.date_echeance);
        const color=d<0||d<=30?'var(--red,#ef4444)':'var(--amber,#f59e0b)';
        const lbl=d<0?'Expir\u00e9 ('+(-d)+'j)':d+'j';
        return '<div class="dcc-row" onclick="nav(\'contrats\')">'
          +'<div class="dcc-dot" style="background:'+color+';"></div>'
          +'<div style="flex:1;min-width:0;"><div class="dcc-name">'+_e(c.fournisseur)+'</div>'
          +'<div class="dcc-type">'+_e(c.type_contrat||'')+(c.contact_nom?' \u00b7 '+_e(c.contact_nom):'')+'</div></div>'
          +'<div class="dcc-days" style="color:'+color+';">'+lbl+'</div>'
          +'</div>';
      }).join(''))
    +'<div class="dcc-budget"><span class="dcc-budget-lbl">\ud83d\udcb0 Budget annuel</span><span class="dcc-budget-val">'+_eur(budget)+'</span></div>';
}

function _widgetTicketsList(list) {
  if(!list.length) return '<div class="d5-empty"><div style="font-size:24px;margin-bottom:8px;">\ud83d\udccb</div>Aucun signalement<br><small style="font-size:11px;"><button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="openNewTicket()">+ Signaler</button></small></div>';
  return list.slice(0,8).map(tk=>{
    const isC=tk.urgence==='critique', isI=tk.urgence==='important';
    const stripe=isC?'#ef4444':isI?'#f59e0b':'#3b82f6';
    const bgIco=isC?'rgba(239,68,68,.1)':isI?'rgba(245,158,11,.1)':'rgba(59,130,246,.1)';
    const ico=isC?'🔴':isI?'🟠':'🔵';
    return '<div class="d5-ticket" onclick="openDetail(\''+tk.id+'\')">'
      +'<div class="d5-ticket-stripe" style="background:'+stripe+';"></div>'
      +'<div class="d5-ticket-ico" style="background:'+bgIco+';">'+ico+'</div>'
      +'<div class="d5-ticket-body">'
      +'<div class="d5-ticket-title">'+_e(tk.titre)+'</div>'
      +'<div class="d5-ticket-meta">'+badgeStatut(tk.statut)
      +'<span class="d5-ticket-loc">'+_e(tk.batiment||'')+(tk.zone?' \u00b7 '+_e(tk.zone):'')+'</span>'
      +'<span class="d5-ticket-age">\u29d6 '+depuisJours(tk.created_at)+'</span>'
      +'</div></div></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   WIDGET SHELL — construit un widget avec ses contrôles
═══════════════════════════════════════════════════════════════ */
function _makeWidget(id, title, link, linkFn, bodyHTML, size) {
  const sizeLabel = {compact:'XS', normal:'M', large:'L'}[size]||'M';
  return '<div class="d5w" data-widget="'+id+'" data-size="'+size+'"'
    +' draggable="true"'
    +' ondragstart="dashDragStart(event)"'
    +' ondragover="dashDragOver(event)"'
    +' ondrop="dashDrop(event)"'
    +' ondragend="dashDragEnd(event)"'
    +'>'
    +'<div class="d5w-head">'
    +'<span class="d5w-title">'+title+'</span>'
    +(link?'<button class="d5w-link" onclick="'+linkFn+'">'+link+' \u2192</button>':'')
    +'<div class="d5w-tools">'
    +'<button class="d5w-btn" onclick="dashCycleSize(\''+id+'\')" title="Taille">'+sizeLabel+'</button>'
    +'<button class="d5w-btn d5w-handle" title="D\u00e9placer">\u2630</button>'
    +'</div>'
    +'</div>'
    +'<div class="d5w-body no-pad">'+bodyHTML+'</div>'
    +'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DASHBOARD
═══════════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const el = $('page');
  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div style="padding:24px;color:var(--text-3);">Chargement\u2026</div>';
    return;
  }

  const t         = cache.tickets||[];
  const ouverts   = t.filter(x=>x.statut!=='résolu'&&x.statut!=='clos');
  const critiques = t.filter(x=>x.urgence==='critique'&&x.statut!=='résolu'&&x.statut!=='clos');
  const syndic    = t.filter(x=>x.statut==='transmis_syndic');
  const resolus   = t.filter(x=>x.statut==='résolu'||x.statut==='clos');

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const prenom = displayName(profile&&profile.prenom,profile&&profile.nom,user&&user.email,'vous').split(' ')[0];
  const order  = _dashGetOrder();

  // ── Hero ──
  const heroHTML = '<div class="dash5-hero" style="animation:pageIn .25s both;">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">'
    +new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    +'</div>'
    +'<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;">'
    +'<div><h1 class="dash2-title">Bonjour, '+_e(prenom)+' \ud83d\udc4b</h1>'
    +'<div class="dash2-subline" style="margin-top:6px;">'
    +(critiques.length>0
      ? '<span class="dash2-pill danger">🔴 '+critiques.length+' critique'+(critiques.length>1?'s':'')+'</span>'
      : '<span class="dash2-pill success">\u2705 Tout va bien</span>')
    +(ouverts.length>0?'<span class="dash2-muted">'+ouverts.length+' signalement'+(ouverts.length>1?'s':'')+' en cours</span>':'')
    +'</div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    +'<button class="btn btn-primary" onclick="openNewTicket()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Signaler</button>'
    +'<button class="btn btn-secondary" onclick="nav(\'tickets\')">Signalements</button>'
    +'<button class="btn btn-ghost" onclick="nav(\'faq\')">❓ FAQ</button>'
    +'<button class="btn btn-secondary btn-sm" onclick="dashToggleCustomize()" title="Personnaliser le tableau de bord">'
    +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
    +' Personnaliser</button>'
    +'</div></div></div>';

  // ── KPIs ──
  const kpis = [
    {color:'#f97316',ico:'🔧',num:ouverts.length,  lbl:'Ouverts',  sub:'Actifs',       fn:"nav('tickets')"},
    {color:'#ef4444',ico:'🚨',num:critiques.length, lbl:'Critiques',sub:'Action requise',fn:"nav('tickets')"},
    isManager()
      ?{color:'#3b82f6',ico:'📤',num:syndic.length,lbl:'Transmis',sub:'En attente',fn:"nav('tickets')"}
      :{color:'#3b82f6',ico:'📋',num:t.filter(x=>x.auteur_id===user.id).length,lbl:'Les miens',sub:'Mes signalements',fn:"nav('tickets')"},
    {color:'#22c55e',ico:'✅',num:resolus.length,  lbl:'Résolus',  sub:'Total traités', fn:null}
  ];
  const kpisHTML = '<div class="dash5-kpis" style="animation:pageIn .28s .04s both;">'
    +kpis.map((k,i)=>
      '<div class="stat '+(k.color==='#f97316'?'orange':k.color==='#ef4444'?'red':k.color==='#22c55e'?'green':'blue')+'" '
      +(k.fn?'onclick="'+k.fn+'"':'')
      +' style="animation:pageIn .3s '+(0.05+i*.05)+'s both;">'
      +'<div class="stat-icon">'+k.ico+'</div>'
      +'<div class="stat-num">'+k.num+'</div>'
      +'<div class="stat-label">'+k.lbl+'</div>'
      +'<div class="stat-sub">'+k.sub+'</div>'
      +'</div>').join('')
    +'</div>';

  // ── Focusbar ──
  const chips=[
    {key:'tout',    lbl:'Tout',    cls:''},
    {key:'ouvert',  lbl:'Ouverts', cls:'warn'},
    {key:'critique',lbl:'Critiques',cls:'danger'},
    isManager()?{key:'transmis',lbl:'Transmis',cls:'info'}:{key:'mine',lbl:'Mes',cls:'info'},
    {key:'resolu',  lbl:'Résolus', cls:'success'},
  ];
  const focusHTML = '<div class="dash5-focusbar" id="dash-focusbar" style="animation:pageIn .28s .08s both;">'
    +chips.map(c=>'<button class="dash5-chip '+c.cls+(c.key===_dashFocusMode?' sel':'')+'" data-dash-focus="'+c.key+'" onclick="setDashFocus(\''+c.key+'\')">'+c.lbl+'</button>').join('')
    +'<button class="dash5-chip dash2-chip-zone" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()"></button>'
    +'</div>';

  // ── Barre édition ──
  const editbarHTML = '<div class="d5-editbar" id="d5-editbar">'
    +'<span class="d5-editbar-label">✦ Mode personnalisation actif — faites glisser les widgets pour les réorganiser</span>'
    +'<button class="btn btn-sm btn-secondary" onclick="dashToggleEdit()">Terminer</button>'
    +'</div>';

  // ── Colonne gauche (tickets récents) — toujours fixe ──
  const recentHTML = '<div class="d5w" style="animation:pageIn .3s .22s both;" id="dash-recent-card">'
    +'<div class="d5w-head">'
    +'<span class="d5w-title">🔧 Signalements récents</span>'
    +'<button class="d5w-link" onclick="nav(\'tickets\')">Voir tout \u2192</button>'
    +'</div>'
    +'<div class="d5w-body no-pad" id="dash-recent-list">'
    +_widgetTicketsList(t.slice(0,8))
    +'</div></div>';

  // ── Colonne droite — widgets paramétrables ──
  let rightHTML = '';
  order.forEach((wid, i) => {
    const cfg = DASH_WIDGETS.find(w=>w.id===wid);
    if(!cfg) return;
    if(cfg.managerOnly && !isManager()) return;
    const visible = _dashGetWidgetPref(wid, 'visible');
    if(!visible) return;
    const size = _dashGetWidgetPref(wid, 'size');
    const delay = 0.25 + i * 0.04;

    let body='', link='', linkFn='', title='';
    switch(wid) {
      case 'situation':
        rightHTML += '<div data-widget="situation" data-size="'+size+'" style="animation:pageIn .3s '+delay+'s both;">'
          +_buildSituationRoom(ouverts,critiques,syndic)
          +'</div>';
        return;
      case 'chart':
        title='📊 Activité \u00b7 6 mois'; body=_widgetChart(); break;
      case 'zones':
        title='🏢 Par b\u00e2timent'; body=_widgetZones(ouverts); break;
      case 'contrats':
        title='📄 Contrats'; link='G\u00e9rer'; linkFn="nav('contrats')"; body=_widgetContrats(); break;
      case 'events':
        title='📅 \u00c9v\u00e9nements'; link='Agenda'; linkFn="nav('agenda')";
        body='<div class="d5-empty" id="dash-events-list">Chargement\u2026</div>'; break;
      case 'annonces':
        title='📢 Annonces'; link='Toutes'; linkFn="nav('annonces')";
        body='<div class="d5-empty" id="dash-annonces-list">Chargement\u2026</div>'; break;
      case 'votes':
        title='🗳️ Votes'; link='Voter'; linkFn="nav('votes')"; body=_widgetVotes(); break;
      case 'documents':
        title='📁 Documents'; link='Voir tous'; linkFn="nav('documents')"; body=_widgetDocuments(); break;
      case 'install':
        title='📱 Installer l\'app';
        body='<div class="d5w-body" style="text-align:center;padding:20px;">'
          +'<div style="font-size:28px;margin-bottom:8px;">📱</div>'
          +'<div style="font-size:13px;color:var(--text-2);">iPhone : Safari \u2192 Partager \u2192 \u00ab\u202fSur l\'\u00e9cran d\'accueil\u202f\u00bb<br>Android : Chrome \u2192 \u22ee \u2192 \u00ab\u202fInstaller\u202f\u00bb</div>'
          +'</div>';
        break;
      default: return;
    }
    rightHTML += '<div style="animation:pageIn .3s '+delay+'s both;">'
      +_makeWidget(wid, title, link, linkFn, body, size)
      +'</div>';
  });

  // ── Panneau Personnaliser ──
  const customizeHTML = '<div class="d5-customize" id="d5-customize">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'
    +'<div class="d5-customize-title">Personnaliser</div>'
    +'<button class="btn btn-ghost btn-sm" onclick="dashToggleCustomize()">✕</button>'
    +'</div>'
    +'<div class="d5-customize-sub">Activez, masquez ou redimensionnez chaque widget. Faites glisser les widgets pour les r\u00e9organiser.</div>'
    +'<div class="d5-widget-list">'
    +DASH_WIDGETS.filter(w=>!w.managerOnly||isManager()).map(w=>{
        const vis  = _dashGetWidgetPref(w.id,'visible');
        const size = _dashGetWidgetPref(w.id,'size');
        const szMap={compact:'XS',normal:'M',large:'L'};
        return '<div class="d5-witem'+(vis?'':' hidden')+'" id="d5-witem-'+w.id+'">'
          +'<div class="d5-witem-ico">'+w.ico+'</div>'
          +'<div class="d5-witem-label">'+w.label+'</div>'
          +'<button class="d5-witem-size" onclick="dashCycleSize(\''+w.id+'\')" id="d5-size-'+w.id+'">'+szMap[size]+'</button>'
          +'<button class="d5-witem-toggle'+(vis?' on':'')+'" id="d5-toggle-'+w.id+'" onclick="dashToggleWidget(\''+w.id+'\')"></button>'
          +'</div>';
      }).join('')
    +'<button class="btn btn-secondary btn-sm d5-reset" onclick="dashResetPrefs()">↺ R\u00e9initialiser</button>'
    +'</div></div>';

  el.innerHTML = '<div class="dash2 dash5" id="dash-content">'
    +heroHTML
    +kpisHTML
    +focusHTML
    +editbarHTML
    +'<div class="dash5-layout">'
    +'<div class="dash5-col-left">'+recentHTML+'</div>'
    +'<div class="dash5-col-right" id="dash-widgets-col">'+rightHTML+'</div>'
    +'</div>'
    +customizeHTML
    +'</div>';

  loadDashboardWidgets();
  _refreshEditMode();
}

/* ── Widgets votes et documents ── */
function _widgetVotes() {
  const votes=(typeof _votesCache!=='undefined')?_votesCache.filter(v=>v.statut==='ouvert'):[];
  if(!votes.length) return '<div class="d5-empty">Aucun vote en cours</div>';
  return votes.slice(0,3).map(v=>{
    const maRep=(typeof _reponsesCache!=='undefined')?_reponsesCache[v.id]:null;
    const total=(typeof _allReponsesCache!=='undefined'&&_allReponsesCache[v.id])?_allReponsesCache[v.id].length:0;
    return '<div class="d5-row" onclick="nav(\'votes\')">'
      +'<div class="d5-row-ico">'+((typeof VOTE_TYPES!=='undefined'&&VOTE_TYPES[v.type])?VOTE_TYPES[v.type].ico:'🗳️')+'</div>'
      +'<div class="d5-row-body"><div class="d5-row-title">'+_e(v.titre)+'</div>'
      +'<div class="d5-row-sub">'+total+' participant'+(total>1?'s':'')+'</div></div>'
      +(maRep?'<span class="d5-pill d5-pill-g">\u2713 Vot\u00e9</span>':'<span class="d5-pill d5-pill-o">\u00c0 voter</span>')
      +'</div>';
  }).join('');
}

function _widgetDocuments() {
  const docs=(typeof _docsCache!=='undefined')?_docsCache:[];
  if(!docs.length) return '<div class="d5-empty">Aucun document</div>';
  return docs.slice(0,4).map(doc=>{
    const cat=(typeof DOC_CATS!=='undefined'&&DOC_CATS[doc.categorie])?DOC_CATS[doc.categorie]:{ico:'📄'};
    const isNew=(typeof _docsVus!=='undefined')?!_docsVus.has(doc.id):false;
    return '<div class="d5-row" onclick="nav(\'documents\')">'
      +'<div class="d5-row-ico">'+cat.ico+'</div>'
      +'<div class="d5-row-body"><div class="d5-row-title">'+_e(doc.titre)+'</div>'
      +'<div class="d5-row-sub">'+fmtD(doc.created_at)+'</div></div>'
      +(isNew?'<span class="d5-pill d5-pill-b">Nouveau</span>':'')
      +'</div>';
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   CONTRÔLES WIDGETS — taille, visible/masqué, reset
═══════════════════════════════════════════════════════════════ */
window.dashCycleSize = function(id) {
  const sizes=['compact','normal','large'];
  const cur = _dashGetWidgetPref(id,'size');
  const next = sizes[(sizes.indexOf(cur)+1)%sizes.length];
  _dashSetWidgetPref(id,'size',next);
  // Mise à jour du bouton dans le panneau
  const btn=document.getElementById('d5-size-'+id);
  if(btn) btn.textContent={compact:'XS',normal:'M',large:'L'}[next];
  // Mise à jour du widget dans la grille
  const w=document.querySelector('[data-widget="'+id+'"]');
  if(w){ w.setAttribute('data-size',next); const hd=w.querySelector('.d5w-btn'); if(hd&&hd.title.includes('Taille')) hd.textContent={compact:'XS',normal:'M',large:'L'}[next]; }
  // Re-render si chart (taille affecte le canvas)
  if(id==='chart') setTimeout(renderDashChart,50);
};

window.dashToggleWidget = function(id) {
  const cur = _dashGetWidgetPref(id,'visible');
  const next = !cur;
  _dashSetWidgetPref(id,'visible',next);
  // Toggle bouton
  const btn=document.getElementById('d5-toggle-'+id);
  if(btn) btn.classList.toggle('on',next);
  const item=document.getElementById('d5-witem-'+id);
  if(item) item.classList.toggle('hidden',!next);
  // Re-render pour appliquer
  renderDashboard();
};

window.dashToggleCustomize = function() {
  const panel=document.getElementById('d5-customize');
  if(panel) panel.classList.toggle('open');
};

window.dashResetPrefs = function() {
  if(!confirm('R\u00e9initialiser toutes les pr\u00e9f\u00e9rences du tableau de bord ?')) return;
  try { localStorage.removeItem(DASH_LS_KEY); } catch(e) {}
  renderDashboard();
  toast('Tableau de bord r\u00e9initialis\u00e9','ok');
};

let _dashEditing = false;
window.dashToggleEdit = function() {
  _dashEditing = !_dashEditing;
  _refreshEditMode();
};

function _refreshEditMode() {
  const dash=document.getElementById('dash-content');
  const bar=document.getElementById('d5-editbar');
  if(dash) dash.classList.toggle('editing',_dashEditing);
  if(bar)  bar.classList.toggle('show',_dashEditing);
}

/* ═══════════════════════════════════════════════════════════════
   DRAG & DROP
═══════════════════════════════════════════════════════════════ */
let _dragSrcId = null;

window.dashDragStart = function(e) {
  const w = e.currentTarget;
  _dragSrcId = w.getAttribute('data-widget');
  w.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', _dragSrcId);
};

window.dashDragOver = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const w = e.currentTarget;
  w.classList.add('drag-over');
};

window.dashDrop = function(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const targetId = target.getAttribute('data-widget');
  target.classList.remove('drag-over');
  if(!_dragSrcId||_dragSrcId===targetId) return;

  // Réordonner dans localStorage
  const order = _dashGetOrder();
  const fromIdx = order.indexOf(_dragSrcId);
  const toIdx   = order.indexOf(targetId);
  if(fromIdx===-1||toIdx===-1) return;
  order.splice(fromIdx,1);
  order.splice(toIdx,0,_dragSrcId);
  _dashSetOrder(order);
  renderDashboard();
};

window.dashDragEnd = function(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
  _dragSrcId = null;
};

/* ═══════════════════════════════════════════════════════════════
   FOCUS / FILTRE
═══════════════════════════════════════════════════════════════ */
function clearDashFocus() { setDashFocus('tout'); }
function setDashZoneFocus(zone) { _dashFocusMode='zone'; _dashFocusZone=zone; refreshDashFocus(); }
function setDashFocus(mode) { _dashFocusMode=mode||'tout'; _dashFocusZone=null; refreshDashFocus(); }
function isResolvedStatut(s) { return s==='résolu'||s==='clos'; }
function isOpenStatut(s)     { return !isResolvedStatut(s); }

function getDashTicketsForRecent() {
  const l=cache.tickets||[],m=_dashFocusMode;
  if(m==='tout')     return l;
  if(m==='ouvert')   return l.filter(t=>isOpenStatut(t.statut));
  if(m==='critique') return l.filter(t=>t.urgence==='critique'&&isOpenStatut(t.statut));
  if(m==='resolu')   return l.filter(t=>isResolvedStatut(t.statut));
  if(m==='mine')     return l.filter(t=>t.auteur_id===user.id&&isOpenStatut(t.statut));
  if(m==='transmis') return l.filter(t=>t.statut==='transmis_syndic');
  if(m==='zone')     return l.filter(t=>t.batiment===_dashFocusZone&&isOpenStatut(t.statut));
  return l;
}
function getDashTicketsForZones()  { return _dashFocusMode==='tout'?(cache.tickets||[]).filter(t=>isOpenStatut(t.statut)):getDashTicketsForRecent(); }
function getDashTicketsForChart()  { return _dashFocusMode==='tout'?(cache.tickets||[]):getDashTicketsForRecent(); }

function renderDashRecentListHTML(list) {
  if(!list.length) return '<div class="d5-empty">Aucun signalement<br><button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="openNewTicket()">+ Signaler</button></div>';
  return _widgetTicketsList(list);
}

function renderDashZonesListHTML(tickets) {
  const zones=(COPRO.tours||[]).concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']);
  const max=Math.max(1,...zones.map(z=>tickets.filter(t=>t.batiment===z).length));
  const rows=zones.map(zone=>{
    const cnt=tickets.filter(t=>t.batiment===zone).length;
    if(!cnt) return '';
    const pct=Math.round((cnt/max)*100);
    const color=cnt>=3?'var(--red)':cnt>=2?'var(--orange)':'var(--accent)';
    return '<div class="d5-zone" onclick="setDashZoneFocus('+JSON.stringify(zone)+')">'
      +'<div class="d5-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="d5-zone-track"><div class="d5-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="d5-zone-num" style="color:'+color+';">'+cnt+'</div></div>';
  }).join('');
  return rows||'<div class="d5-empty">Aucun probl\u00e8me ouvert 🎉</div>';
}

function refreshDashFocus() {
  const recentEl=$('dash-recent-list'),zoneEl=$('dash-zone-list');
  if(!recentEl) return;
  const bar=$('dash-focusbar');
  if(bar){
    bar.querySelectorAll('[data-dash-focus]').forEach(btn=>btn.classList.toggle('sel',btn.getAttribute('data-dash-focus')===_dashFocusMode));
    const cz=$('dash-chip-zone');
    if(cz){const show=_dashFocusMode==='zone'&&!!_dashFocusZone;cz.style.display=show?'':'none';if(show)cz.textContent='Zone : '+_dashFocusZone;}
  }
  if(recentEl) recentEl.innerHTML=renderDashRecentListHTML(getDashTicketsForRecent());
  if(zoneEl)   zoneEl.innerHTML  =renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   WIDGETS ASYNCHRONES
═══════════════════════════════════════════════════════════════ */
async function loadDashboardWidgets() {
  // Événements
  const {data:evts}=await sb.from('evenements').select('*').gte('date_debut',new Date().toISOString()).order('date_debut').limit(4);
  const evtEl=$('dash-events-list');
  if(evtEl){
    if(!evts||!evts.length){
      evtEl.innerHTML='<div class="d5-empty">Aucun \u00e9v\u00e9nement \u00e0 venir</div>';
    } else {
      evtEl.className='';
      evtEl.innerHTML=evts.map(e=>{
        const et=(typeof EVENT_TYPES!=='undefined'&&EVENT_TYPES[e.type])?EVENT_TYPES[e.type]:{color:'#6b7280'};
        const d=new Date(e.date_debut);
        const isImmi=(d-new Date())<86400000;
        return '<div class="d5-row" onclick="nav(\'agenda\')">'
          +'<div style="width:4px;height:36px;border-radius:2px;background:'+et.color+';flex-shrink:0;"></div>'
          +'<div class="d5-row-body"><div class="d5-row-title" style="'+(isImmi?'color:var(--orange);':'')+'">'+ _e(e.titre)+'</div>'
          +'<div class="d5-row-sub">📅 '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' \u00e0 '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+(e.lieu?' \u00b7 '+_e(e.lieu):'')+'</div>'
          +'</div>'+(isImmi?'<span class="d5-pill d5-pill-o">Bient\u00f4t</span>':'')+'</div>';
      }).join('');
    }
    (evts||[]).filter(e=>{const d=new Date(e.date_debut);const diff=d-new Date();return diff>0&&diff<86400000;})
      .forEach(e=>pushNotif('📅 Rappel',e.titre+' — demain à '+new Date(e.date_debut).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),'statut_change',null));
  }

  // Annonces
  const {data:annsRaw}=await sb.from('annonces').select('*').order('epingle',{ascending:false}).order('created_at',{ascending:false}).limit(12);
  const anns=(annsRaw||[]).filter(a=>annonceReaderCanSee(a)).slice(0,3);
  const annEl=$('dash-annonces-list');
  if(annEl){
    if(!anns.length){
      annEl.innerHTML='<div class="d5-empty">Aucune annonce</div>';
    } else {
      annEl.className='';
      const icos={urgent:'🚨',important:'⚠️',info:'📢'};
      annEl.innerHTML=anns.map(a=>
        '<div class="d5-row" onclick="nav(\'annonces\')">'
        +'<div class="d5-row-ico">'+(a.epingle?'📌':(icos[a.type]||'📢'))+'</div>'
        +'<div class="d5-row-body"><div class="d5-row-title">'+_e(a.titre)+'</div>'
        +(a.contenu?'<div class="d5-row-sub">'+_e(a.contenu.substring(0,60))+(a.contenu.length>60?'…':'')+'</div>':'')
        +'</div>'+(a.epingle?'<span class="d5-pill d5-pill-n">\u00c9pingl\u00e9</span>':'')+'</div>'
      ).join('');
    }
  }
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   GRAPHIQUE CANVAS
═══════════════════════════════════════════════════════════════ */
function renderDashChart() {
  const canvas=$('dash-chart');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const tipEl=$('dash-chart-tip');
  const months=[],now=new Date();
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({label:d.toLocaleDateString('fr-FR',{month:'short'}),year:d.getFullYear(),month:d.getMonth()});}
  const tks=getDashTicketsForChart();
  const created=months.map(m=>tks.filter(t=>{const d=new Date(t.created_at);return d.getFullYear()===m.year&&d.getMonth()===m.month;}).length);
  const resolved=months.map(m=>tks.filter(t=>{if(!isResolvedStatut(t.statut))return false;const d=new Date(t.updated_at||t.created_at);return d.getFullYear()===m.year&&d.getMonth()===m.month;}).length);
  const textColor=isDark?'#9b9890':'#94a3b8';
  const gridColor=isDark?'#2a2825':'#f1f5f9';
  const W=canvas.offsetWidth||300,H=canvas.offsetHeight||110;
  canvas.width=W;canvas.height=H;
  const pad={top:8,right:8,bottom:22,left:26};
  const cW=W-pad.left-pad.right,cH=H-pad.top-pad.bottom;
  const maxV=Math.max(...created,...resolved,1);
  const barW=(cW/months.length)*.32,barG=(cW/months.length)*.08;
  ctx.clearRect(0,0,W,H);
  [0,1,2,3].forEach(i=>{
    const y=pad.top+(cH/3)*i;
    ctx.strokeStyle=gridColor;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(W-pad.right,y);ctx.stroke();
    if(i<3){ctx.fillStyle=textColor;ctx.font='9px sans-serif';ctx.textAlign='right';ctx.fillText(Math.round(maxV-(maxV/3)*i),pad.left-3,y+3);}
  });
  months.forEach((m,i)=>{
    const x=pad.left+(cW/months.length)*i+(cW/months.length)*.1;
    const h1=(created[i]/maxV)*cH;
    ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.roundRect(x,pad.top+cH-h1,barW,h1,[3,3,0,0]);ctx.fill();
    const h2=(resolved[i]/maxV)*cH;
    ctx.fillStyle='#22c55e';ctx.beginPath();ctx.roundRect(x+barW+barG,pad.top+cH-h2,barW,h2,[3,3,0,0]);ctx.fill();
    ctx.fillStyle=textColor;ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(m.label,x+barW+barG/2,H-5);
  });
  const lx=W-pad.right-110;
  ctx.fillStyle='#3b82f6';ctx.fillRect(lx,3,9,7);
  ctx.fillStyle=textColor;ctx.font='9px sans-serif';ctx.textAlign='left';ctx.fillText('Créés',lx+13,10);
  ctx.fillStyle='#22c55e';ctx.fillRect(lx+52,3,9,7);
  ctx.fillStyle=textColor;ctx.fillText('Résolus',lx+65,10);
  if(tipEl){
    const wrap=canvas.parentElement;
    const handler=e=>{
      const rect=wrap.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;
      if(px<pad.left||px>pad.left+cW){tipEl.style.display='none';return;}
      const idx=Math.floor((px-pad.left)/(cW/months.length));
      if(idx<0||idx>=months.length){tipEl.style.display='none';return;}
      tipEl.style.display='block';tipEl.style.left=px+'px';tipEl.style.top=Math.max(8,py)+'px';
      tipEl.innerHTML='<b>'+months[idx].label+'</b><div style="margin-top:5px;">Créés : '+created[idx]+'<br>Résolus : '+resolved[idx]+'</div>';
    };
    if(canvas.__dh) canvas.removeEventListener('mousemove',canvas.__dh);
    canvas.__dh=handler;
    canvas.addEventListener('mousemove',handler);
    canvas.addEventListener('mouseleave',()=>{tipEl.style.display='none';});
  }
}

/* ═══════════════════════════════════════════════════════════════
   TICKETS — TOUT INCHANGÉ
═══════════════════════════════════════════════════════════════ */
const TICKET_FILTER_PRESET_KEY='coprosync_ticket_filter_preset_v1';
let _ticketSelection=new Set();

function getTicketFilterValues(){return{search:$('f-search')?$('f-search').value:'',statut:$('f-statut')?$('f-statut').value:'',urgence:$('f-urgence')?$('f-urgence').value:'',batiment:$('f-bat')?$('f-bat').value:''};}
function saveTicketFilterPreset(){try{localStorage.setItem(TICKET_FILTER_PRESET_KEY,JSON.stringify(getTicketFilterValues()));}catch(e){}toast('Filtres sauvegardés','ok');}
function applyTicketFilterPreset(){try{const raw=localStorage.getItem(TICKET_FILTER_PRESET_KEY);if(!raw)return;const p=JSON.parse(raw);if($('f-search'))$('f-search').value=p.search||'';if($('f-statut'))$('f-statut').value=p.statut||'';if($('f-urgence'))$('f-urgence').value=p.urgence||'';if($('f-bat'))$('f-bat').value=p.batiment||'';}catch(e){}}
function clearTicketFilterPreset(){try{localStorage.removeItem(TICKET_FILTER_PRESET_KEY);}catch(e){}toast('Préset supprimé','warn');}
function setTicketSelected(id,selected){if(selected)_ticketSelection.add(id);else _ticketSelection.delete(id);renderBulkTicketBar();}
function toggleAllTicketsFromCurrentFilter(){const allChecked=$('t-select-all')&&$('t-select-all').checked;const ids=getFilteredTickets().map(t=>t.id);ids.forEach(id=>allChecked?_ticketSelection.add(id):_ticketSelection.delete(id));d($('tickets-tbody'),renderTicketsRows(getFilteredTickets()));renderBulkTicketBar();}

function renderBulkTicketBar(){
  const bar=$('tickets-bulk-bar');if(!bar)return;
  const n=_ticketSelection.size;
  if(!n){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  bar.innerHTML='<span style="font-size:12px;color:var(--text-2);">'+n+' sélectionné'+(n>1?'s':'')+'</span>'
    +'<select class="select" id="bulk-statut" style="width:auto;"><option value="">Changer le statut...</option><option value="nouveau">Nouveau</option><option value="en_cours">En cours</option><option value="transmis_syndic">Transmis syndic</option><option value="attente_intervention">En attente</option><option value="résolu">Résolu</option><option value="clos">Clos</option></select>'
    +'<button class="btn btn-secondary btn-sm" onclick="applyBulkTicketStatus()">Appliquer</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="clearTicketSelection()">Effacer sélection</button>';
}

function clearTicketSelection(){_ticketSelection.clear();d($('tickets-tbody'),renderTicketsRows(getFilteredTickets()));renderBulkTicketBar();}

async function applyBulkTicketStatus(){
  const statut=$('bulk-statut')?$('bulk-statut').value:'';
  if(!statut){toast('Choisis un statut','warn');return;}
  const ids=Array.from(_ticketSelection);if(!ids.length)return;
  const res=await sb.from('tickets').update({statut,updated_at:new Date().toISOString()}).in('id',ids);
  if(res.error){toast('Erreur mise à jour en lot','err');return;}
  cache.tickets=cache.tickets.map(t=>ids.includes(t.id)?Object.assign({},t,{statut}):t);
  for(const id of ids){await addLog('Statut modifié (lot)','ticket',id,{statut});}
  toast('Statut mis à jour ('+ids.length+')','ok');
  clearTicketSelection();updateBadges();filterTickets();
}

function getFilteredTickets(){
  const s=$('f-search')?$('f-search').value.toLowerCase():'';
  const st=$('f-statut')?$('f-statut').value:'';
  const u=$('f-urgence')?$('f-urgence').value:'';
  const b=$('f-bat')?$('f-bat').value:'';
  return cache.tickets.filter(t=>(!s||t.titre.toLowerCase().includes(s)||(t.description||'').toLowerCase().includes(s)||(t.batiment||'').toLowerCase().includes(s))&&(!st||t.statut===st)&&(!u||t.urgence===u)&&(!b||t.batiment===b));
}

function renderTickets(){
  _ticketSelection=new Set();
  $('page').innerHTML='<div style="padding:24px;">'
    +'<div class="ph"><h1>Signalements</h1><p>'+cache.tickets.length+' au total \u00b7 '+cache.tickets.filter(t=>t.statut!=='résolu'&&t.statut!=='clos').length+' ouverts</p></div>'
    +'<div class="fbar">'
    +'<input type="text" class="input" id="f-search" placeholder="🔍 Rechercher..." oninput="filterTickets()" style="flex:1;min-width:150px;">'
    +'<select class="select" id="f-statut" onchange="filterTickets()" style="width:auto;"><option value="">Tous statuts</option><option value="nouveau">Nouveau</option><option value="en_cours">En cours</option><option value="transmis_syndic">Transmis syndic</option><option value="attente_intervention">En attente</option><option value="résolu">Résolu</option><option value="clos">Clos</option></select>'
    +'<select class="select" id="f-urgence" onchange="filterTickets()" style="width:auto;"><option value="">Urgence</option><option value="critique">🔴 Critique</option><option value="important">🟠 Important</option><option value="normal">🔵 Normal</option></select>'
    +'<select class="select" id="f-bat" onchange="filterTickets()" style="width:auto;"><option value="">Zone</option><optgroup label="Tours"><option>Tour 13</option><option>Tour 15</option><option>Tour 17</option><option>Tour 19</option></optgroup><optgroup label="Communs"><option>Parking visiteurs</option><option>Parking privé</option><option>Garages</option><option>Aire de jeux</option><option>Portails / portillons</option><option>Extérieur général</option></optgroup></select>'
    +'<span id="f-count" style="font-size:12px;color:var(--text-3);white-space:nowrap;"></span>'
    +'<button class="btn btn-ghost btn-sm" id="f-reset" onclick="resetFilters()" style="display:none;">✕ Effacer</button>'
    +'<button class="btn btn-secondary btn-sm" onclick="saveTicketFilterPreset()">💾 Préset</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="clearTicketFilterPreset()">Suppr. préset</button>'
    +'<button class="btn btn-primary" onclick="openNewTicket()">+ Signaler</button>'
    +'</div>'
    +(isManager()?'<div id="tickets-bulk-bar" class="ticket-bulk-bar" style="display:none;"></div>':'')
    +'<div class="card"><div class="tbl-wrap"><table><thead><tr>'
    +(isManager()?'<th style="width:32px;"><input id="t-select-all" type="checkbox" onclick="event.stopPropagation();toggleAllTicketsFromCurrentFilter()"></th>':'')
    +'<th>Signalement</th><th>Urgence</th><th>Statut</th><th>Zone</th><th>Date</th><th></th>'
    +'</tr></thead><tbody id="tickets-tbody">'+renderTicketsRows(cache.tickets)+'</tbody></table></div></div></div>';
  applyTicketFilterPreset();filterTickets();
}

function renderTicketsRows(list){
  const colSpan=isManager()?7:6;
  if(!list.length)return '<tr><td colspan="'+colSpan+'">'+emptyState('🎉','Aucun signalement !','La résidence tourne bien. Signalez un problème si vous en constatez un.','<button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Nouveau signalement</button>')+'</td></tr>';
  return list.map(t=>{
    const age=Math.floor((Date.now()-new Date(t.created_at).getTime())/864e5);
    return '<tr onclick="openDetail(\''+t.id+'\')">'
      +(isManager()?'<td onclick="event.stopPropagation()"><input type="checkbox" '+(_ticketSelection.has(t.id)?'checked':'')+' onchange="setTicketSelected(\''+t.id+'\', this.checked)"></td>':'')
      +'<td><div style="font-weight:600;">'+_e(t.titre)+'</div><div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">'+(t.categorie||'')+(t.zone?' \u00b7 '+t.zone:'')+'</div></td>'
      +'<td>'+badgeUrgence(t.urgence)+'</td>'
      +'<td>'+badgeStatut(t.statut)+'</td>'
      +'<td style="font-size:12px;color:var(--text-2);">'+(t.batiment||'\u2014')+'</td>'
      +'<td style="font-size:12px;color:var(--text-3);white-space:nowrap;"><div>'+fmtD(t.created_at)+'</div><div style="color:'+(age>14?'var(--orange)':'var(--text-3)')+';font-size:11px;margin-top:2px;">\u29d6 '+depuisJours(t.created_at)+'</div></td>'
      +'<td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">Voir \u2192</button></td>'
      +'</tr>';
  }).join('');
}

function filterTickets(){
  const s=$('f-search')?$('f-search').value.toLowerCase():'';
  const st=$('f-statut')?$('f-statut').value:'';
  const u=$('f-urgence')?$('f-urgence').value:'';
  const b=$('f-bat')?$('f-bat').value:'';
  const active=s||st||u||b;
  const f=getFilteredTickets();
  d($('tickets-tbody'),renderTicketsRows(f));
  const cEl=$('f-count');if(cEl)cEl.textContent=active?f.length+' résultat'+(f.length>1?'s':''):'';
  const rEl=$('f-reset');if(rEl)rEl.style.display=active?'inline-flex':'none';
  renderBulkTicketBar();
}

function resetFilters(){
  if($('f-search'))$('f-search').value='';
  if($('f-statut'))$('f-statut').value='';
  if($('f-urgence'))$('f-urgence').value='';
  if($('f-bat'))$('f-bat').value='';
  filterTickets();
}
