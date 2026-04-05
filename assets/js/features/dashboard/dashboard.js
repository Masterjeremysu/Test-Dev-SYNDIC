// ── DASHBOARD PRIME ──
let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM — tokens cohérents injectés une seule fois
   Philosophie : densité maîtrisée, hiérarchie couleur stricte,
   typographie claire, micro-animations utiles uniquement.
   Palette sémantique :
     critical  → #ef4444 (red-500)
     warning   → #f59e0b (amber-500)
     info      → #3b82f6 (blue-500)
     success   → #22c55e (green-500)
     neutral   → var(--text-3)
═══════════════════════════════════════════════════════════════ */
(function injectDashCSS() {
  if (document.getElementById('dash-prime-css')) return;
  const s = document.createElement('style');
  s.id = 'dash-prime-css';
  s.textContent = `

  /* ── Reset interne dashboard ── */
  .dash2 { --dp-red:#ef4444; --dp-amber:#f59e0b; --dp-blue:#3b82f6; --dp-green:#22c55e;
            --dp-red-bg:rgba(239,68,68,.08); --dp-amber-bg:rgba(245,158,11,.08);
            --dp-blue-bg:rgba(59,130,246,.08); --dp-green-bg:rgba(34,197,94,.08);
            --dp-red-border:rgba(239,68,68,.22); --dp-amber-border:rgba(245,158,11,.22);
            --dp-blue-border:rgba(59,130,246,.22); --dp-green-border:rgba(34,197,94,.22);
            --dp-radius:12px; --dp-radius-sm:8px; --dp-radius-xs:6px; }

  /* ── Situation Room ── */
  .sr-wrap {
    border-radius: var(--dp-radius);
    overflow: hidden;
    border: 1px solid var(--border,#e2e8f0);
    box-shadow: 0 1px 8px rgba(0,0,0,.06);
    margin-bottom: 20px;
    animation: pageIn .25s .02s both;
  }
  .sr-bar {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 18px; font-size: 13px; font-weight: 600;
  }
  .sr-bar.sr-ok     { background: linear-gradient(100deg,#15803d,#22c55e); color:#fff; }
  .sr-bar.sr-warn   { background: linear-gradient(100deg,#b45309,#f59e0b); color:#fff; }
  .sr-bar.sr-crit   { background: linear-gradient(100deg,#b91c1c,#ef4444); color:#fff; }
  .sr-dot {
    width:9px; height:9px; border-radius:50%; flex-shrink:0;
    background:rgba(255,255,255,.55);
    box-shadow:0 0 0 3px rgba(255,255,255,.2);
  }
  .sr-dot.blink { animation:srBlink 1.6s ease-in-out infinite; }
  @keyframes srBlink {
    0%,100%{ box-shadow:0 0 0 3px rgba(255,255,255,.2); }
    50%    { box-shadow:0 0 0 8px rgba(255,255,255,.0); }
  }
  .sr-phrase { flex:1; opacity:.93; }
  .sr-time   { font-size:11px; font-weight:500; opacity:.65; }
  .sr-body   { background:var(--surface,#fff); padding:10px 14px 12px; display:flex; flex-direction:column; gap:5px; }
  .sr-empty  { padding:13px 18px; background:var(--surface,#fff); font-size:13px; color:var(--text-3,#94a3b8); text-align:center; }
  .sr-lbl    { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3,#94a3b8); margin-bottom:1px; }

  /* Action cards */
  .ac {
    display:flex; align-items:center; gap:10px; padding:9px 11px;
    border-radius:var(--dp-radius-sm); cursor:pointer; border:1px solid transparent;
    transition:box-shadow .14s, transform .14s;
  }
  .ac:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.09); }
  .ac.ac-r { background:var(--dp-red-bg);   border-color:var(--dp-red-border); }
  .ac.ac-o { background:var(--dp-amber-bg); border-color:var(--dp-amber-border); }
  .ac.ac-b { background:var(--dp-blue-bg);  border-color:var(--dp-blue-border); }
  .ac-ico  { font-size:17px; flex-shrink:0; line-height:1; }
  .ac-body { flex:1; min-width:0; }
  .ac-title { font-size:12.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ac.ac-r .ac-title { color:var(--dp-red); }
  .ac.ac-o .ac-title { color:var(--dp-amber); }
  .ac.ac-b .ac-title { color:var(--dp-blue); }
  .ac-sub  { font-size:11px; color:var(--text-3,#94a3b8); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ac-cta  { font-size:11px; font-weight:700; padding:3px 10px; border-radius:var(--dp-radius-xs); border:none; cursor:pointer; flex-shrink:0; white-space:nowrap; }
  .ac.ac-r .ac-cta { background:var(--dp-red);   color:#fff; }
  .ac.ac-o .ac-cta { background:var(--dp-amber); color:#fff; }
  .ac.ac-b .ac-cta { background:var(--dp-blue);  color:#fff; }

  /* ── KPI bar ── */
  .dp-kpis {
    display:grid; grid-template-columns:repeat(4,1fr); gap:10px;
    margin-bottom:18px;
  }
  .dp-kpi {
    background:var(--surface,#fff); border:1px solid var(--border,#e2e8f0);
    border-radius:var(--dp-radius); padding:14px 16px;
    cursor:pointer; transition:box-shadow .14s, transform .14s;
    position:relative; overflow:hidden;
  }
  .dp-kpi:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); transform:translateY(-1px); }
  .dp-kpi-accent {
    position:absolute; top:0; left:0; right:0; height:3px; border-radius:var(--dp-radius) var(--dp-radius) 0 0;
  }
  .dp-kpi-top    { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .dp-kpi-icon   { font-size:18px; line-height:1; }
  .dp-kpi-badge  { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; }
  .dp-kpi-num    { font-size:26px; font-weight:800; line-height:1; letter-spacing:-.02em; font-family:var(--font-head,inherit); }
  .dp-kpi-label  { font-size:11px; font-weight:600; color:var(--text-2,#64748b); margin-top:4px; }
  .dp-kpi-sub    { font-size:10px; color:var(--text-3,#94a3b8); margin-top:2px; }

  /* ── Focusbar ── */
  .dp-focusbar { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
  .dp-chip {
    font-size:12px; font-weight:600; padding:5px 13px; border-radius:20px;
    border:1.5px solid var(--border,#e2e8f0); background:var(--surface,#fff);
    color:var(--text-2,#64748b); cursor:pointer; transition:all .14s;
    display:inline-flex; align-items:center; gap:5px;
  }
  .dp-chip:hover { border-color:var(--text-3,#94a3b8); }
  .dp-chip.sel   { background:var(--text-1,#1a202c); color:#fff; border-color:var(--text-1,#1a202c); }
  .dp-chip.c-warn { border-color:var(--dp-amber-border); }
  .dp-chip.c-warn.sel { background:var(--dp-amber); border-color:var(--dp-amber); }
  .dp-chip.c-crit { border-color:var(--dp-red-border); }
  .dp-chip.c-crit.sel { background:var(--dp-red); border-color:var(--dp-red); }
  .dp-chip.c-info { border-color:var(--dp-blue-border); }
  .dp-chip.c-info.sel { background:var(--dp-blue); border-color:var(--dp-blue); }
  .dp-chip.c-ok   { border-color:var(--dp-green-border); }
  .dp-chip.c-ok.sel { background:var(--dp-green); border-color:var(--dp-green); }
  .dp-chip-zone { font-style:italic; }
  .dp-chip-count {
    font-size:10px; font-weight:800; padding:1px 6px;
    border-radius:10px; background:rgba(0,0,0,.1);
  }
  .dp-chip.sel .dp-chip-count { background:rgba(255,255,255,.25); }

  /* ── Grille ── */
  .dp-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; }
  @media(max-width:768px){ .dp-grid { grid-template-columns:1fr; } }
  .dp-stack { display:flex; flex-direction:column; gap:14px; }

  /* ── Cards ── */
  .dp-card {
    background:var(--surface,#fff); border:1px solid var(--border,#e2e8f0);
    border-radius:var(--dp-radius); overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04);
  }
  .dp-card-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 16px 12px; border-bottom:1px solid var(--border-light,#f1f5f9);
  }
  .dp-card-title { font-size:13px; font-weight:700; color:var(--text-1,#1a202c); display:flex; align-items:center; gap:7px; }
  .dp-card-title-ico { font-size:15px; }
  .dp-card-link { font-size:12px; font-weight:600; color:var(--text-3,#94a3b8); background:none; border:none; cursor:pointer; padding:0; }
  .dp-card-link:hover { color:var(--text-1,#1a202c); }
  .dp-card-body { padding:0; }

  /* ── Tickets récents ── */
  .dp-ticket {
    display:flex; align-items:flex-start; gap:10px;
    padding:11px 16px; cursor:pointer; transition:background .12s;
    border-bottom:1px solid var(--border-light,#f1f5f9);
    position:relative;
  }
  .dp-ticket:last-child { border-bottom:none; }
  .dp-ticket:hover { background:var(--surface-hover,#f8fafc); }
  .dp-ticket-stripe {
    position:absolute; left:0; top:0; bottom:0; width:3px; border-radius:0;
  }
  .dp-ticket-ico {
    width:32px; height:32px; border-radius:var(--dp-radius-sm);
    display:flex; align-items:center; justify-content:center;
    font-size:14px; flex-shrink:0; margin-top:1px;
  }
  .dp-ticket-body { flex:1; min-width:0; }
  .dp-ticket-title { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-1,#1a202c); }
  .dp-ticket-meta  { display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap; }
  .dp-ticket-loc   { font-size:11px; color:var(--text-3,#94a3b8); }
  .dp-ticket-age   { font-size:10px; color:var(--text-3,#94a3b8); }

  /* ── Zones bâtiment ── */
  .dp-zone-row {
    display:flex; align-items:center; gap:10px;
    padding:8px 16px; cursor:pointer; transition:background .12s;
  }
  .dp-zone-row:hover { background:var(--surface-hover,#f8fafc); }
  .dp-zone-name  { font-size:12px; font-weight:600; width:90px; flex-shrink:0; color:var(--text-2,#64748b); }
  .dp-zone-track { flex:1; height:5px; background:var(--border-light,#f1f5f9); border-radius:3px; overflow:hidden; }
  .dp-zone-fill  { height:100%; border-radius:3px; transition:width .4s ease; }
  .dp-zone-num   { font-size:12px; font-weight:800; width:20px; text-align:right; flex-shrink:0; }

  /* ── Widget contrats ── */
  .dp-contrats-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; border-bottom:1px solid var(--border-light,#f1f5f9); }
  .dp-ckpi { text-align:center; padding:9px 6px; border-radius:var(--dp-radius-sm); background:var(--surface-2,#f8fafc); }
  .dp-ckpi-val   { font-size:20px; font-weight:800; line-height:1; font-family:var(--font-head,inherit); color:var(--text-1,#1a202c); }
  .dp-ckpi-label { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3,#94a3b8); font-weight:600; margin-top:3px; }
  .dp-ckpi.ck-r { background:var(--dp-red-bg);   } .dp-ckpi.ck-r .dp-ckpi-val { color:var(--dp-red); }
  .dp-ckpi.ck-o { background:var(--dp-amber-bg); } .dp-ckpi.ck-o .dp-ckpi-val { color:var(--dp-amber); }
  .dp-ckpi.ck-g { background:var(--dp-green-bg); } .dp-ckpi.ck-g .dp-ckpi-val { color:var(--dp-green); }
  .dp-contrat-row { display:flex; align-items:center; gap:10px; padding:9px 16px; cursor:pointer; transition:background .12s; border-bottom:1px solid var(--border-light,#f1f5f9); }
  .dp-contrat-row:last-child { border-bottom:none; }
  .dp-contrat-row:hover { background:var(--surface-hover,#f8fafc); }
  .dp-cdot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .dp-cname { font-size:13px; font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dp-ctype { font-size:11px; color:var(--text-3,#94a3b8); }
  .dp-cdays { font-size:12px; font-weight:800; flex-shrink:0; }
  .dp-cbudget { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid var(--border-light,#f1f5f9); }
  .dp-cbudget-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3,#94a3b8); }
  .dp-cbudget-val { font-size:14px; font-weight:800; color:var(--text-1,#1a202c); font-family:var(--font-head,inherit); }

  /* ── Widgets secondaires (évts, annonces, votes, docs) ── */
  .dp-list-row { display:flex; align-items:center; gap:10px; padding:9px 16px; cursor:pointer; transition:background .12s; border-bottom:1px solid var(--border-light,#f1f5f9); }
  .dp-list-row:last-child { border-bottom:none; }
  .dp-list-row:hover { background:var(--surface-hover,#f8fafc); }
  .dp-list-ico { font-size:16px; flex-shrink:0; }
  .dp-list-body { flex:1; min-width:0; }
  .dp-list-title { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-1,#1a202c); }
  .dp-list-sub   { font-size:11px; color:var(--text-3,#94a3b8); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dp-pill { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
  .dp-pill-r { background:var(--dp-red-bg);   color:var(--dp-red);   border:1px solid var(--dp-red-border); }
  .dp-pill-o { background:var(--dp-amber-bg); color:var(--dp-amber); border:1px solid var(--dp-amber-border); }
  .dp-pill-g { background:var(--dp-green-bg); color:var(--dp-green); border:1px solid var(--dp-green-border); }
  .dp-pill-b { background:var(--dp-blue-bg);  color:var(--dp-blue);  border:1px solid var(--dp-blue-border); }
  .dp-pill-n { background:var(--surface-2,#f1f5f9); color:var(--text-2,#64748b); border:1px solid var(--border,#e2e8f0); }

  /* ── Install app ── */
  .dp-install { padding:20px 16px; text-align:center; }
  .dp-install-ico   { font-size:28px; margin-bottom:8px; }
  .dp-install-title { font-size:14px; font-weight:700; color:var(--text-1,#1a202c); margin-bottom:6px; font-family:var(--font-head,inherit); }
  .dp-install-sub   { font-size:11.5px; color:var(--text-3,#94a3b8); line-height:1.6; }

  /* ── Empty ── */
  .dp-empty { padding:28px 16px; text-align:center; }
  .dp-empty-ico  { font-size:28px; margin-bottom:8px; }
  .dp-empty-title{ font-size:13px; font-weight:700; color:var(--text-2,#64748b); }
  .dp-empty-sub  { font-size:12px; color:var(--text-3,#94a3b8); margin-top:4px; }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   HELPERS INTERNES
═══════════════════════════════════════════════════════════════ */
function _e(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _eur(n) { return (n || 0).toLocaleString('fr-FR',{minimumFractionDigits:0}) + '\u00a0\u20ac'; }

/* ═══════════════════════════════════════════════════════════════
   SITUATION ROOM
═══════════════════════════════════════════════════════════════ */
function _buildSituationRoom(ouverts, critiques, syndic) {
  const actifs      = (cache.contrats || []).filter(c => c.actif !== false);
  const contratsExp = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours ?? 90); });
  const votes       = (typeof _votesCache !== 'undefined') ? _votesCache.filter(v => v.statut === 'ouvert') : [];
  const sansMaRep   = (typeof _reponsesCache !== 'undefined') ? votes.filter(v => !_reponsesCache[v.id]) : [];

  const isCrit = critiques.length > 0 || contratsExp.length > 0;
  const isWarn = !isCrit && (contratsAlt.length > 0 || syndic.length > 0);

  let barCls, statusTxt;
  if (isCrit) {
    barCls    = 'sr-crit';
    const p   = [];
    if (critiques.length)   p.push(critiques.length + ' signalement' + (critiques.length > 1 ? 's critiques' : ' critique'));
    if (contratsExp.length) p.push(contratsExp.length + ' contrat' + (contratsExp.length > 1 ? 's expirés' : ' expiré'));
    statusTxt = 'Action requise \u2014 ' + p.join(' \u00b7 ');
  } else if (isWarn) {
    barCls    = 'sr-warn';
    const p   = [];
    if (contratsAlt.length) p.push(contratsAlt.length + ' contrat' + (contratsAlt.length > 1 ? 's en alerte' : ' en alerte'));
    if (syndic.length)      p.push(syndic.length + ' dossier' + (syndic.length > 1 ? 's transmis' : ' transmis'));
    statusTxt = 'Vigilance \u2014 ' + p.join(' \u00b7 ');
  } else {
    barCls    = 'sr-ok';
    statusTxt = 'R\u00e9sidence sous contr\u00f4le \u2014 aucune anomalie d\u00e9tect\u00e9e';
  }

  const cards = [];
  critiques.slice(0,2).forEach(tk => cards.push({
    cls:'ac-r', ico:'🚨',
    title: _e(tk.titre),
    sub: _e((tk.batiment||'') + (tk.zone ? ' \u00b7 '+tk.zone : '') + ' \u2014 ' + depuisJours(tk.created_at)),
    btn:'Traiter', fn:"openDetail('"+tk.id+"')"
  }));
  contratsExp.slice(0,2).forEach(c => cards.push({
    cls:'ac-r', ico:'📄',
    title: _e(c.fournisseur) + ' \u2014 contrat expir\u00e9',
    sub: _e(c.type_contrat||'') + ' \u00b7 expir\u00e9 depuis ' + Math.abs(daysUntil(c.date_echeance)) + 'j',
    btn:'G\u00e9rer', fn:"nav('contrats')"
  }));
  contratsAlt.slice(0,2).forEach(c => cards.push({
    cls:'ac-o', ico:'⚠️',
    title: _e(c.fournisseur) + ' \u2014 \u00e9ch\u00e9ance dans ' + daysUntil(c.date_echeance) + 'j',
    sub: _e(c.type_contrat||'') + (c.contact_nom ? ' \u00b7 '+_e(c.contact_nom) : ''),
    btn:'Voir', fn:"nav('contrats')"
  }));
  if (sansMaRep.length > 0) cards.push({
    cls:'ac-b', ico:'🗳️',
    title: sansMaRep.length + ' vote' + (sansMaRep.length>1?'s':'') + ' en attente',
    sub: sansMaRep.slice(0,2).map(v => _e(v.titre)).join(' \u00b7 '),
    btn:'Voter', fn:"nav('votes')"
  });

  const bodyHTML = cards.length === 0
    ? '<div class="sr-empty">\u2705 Aucune action imm\u00e9diate requise</div>'
    : '<div class="sr-body"><div class="sr-lbl">Actions requises</div>'
      + cards.map(a =>
          '<div class="ac '+a.cls+'" onclick="'+a.fn+'">'
          +'<div class="ac-ico">'+a.ico+'</div>'
          +'<div class="ac-body"><div class="ac-title">'+a.title+'</div><div class="ac-sub">'+a.sub+'</div></div>'
          +'<button class="ac-cta" onclick="event.stopPropagation();'+a.fn+'">'+a.btn+'</button>'
          +'</div>').join('')
      + '</div>';

  return '<div class="sr-wrap">'
    +'<div class="sr-bar '+barCls+'">'
    +'<div class="sr-dot'+(barCls!=='sr-ok'?' blink':'')+'"></div>'
    +'<span class="sr-phrase">'+statusTxt+'</span>'
    +'<span class="sr-time">'+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</span>'
    +'</div>'
    +bodyHTML
    +'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   KPI BAR
═══════════════════════════════════════════════════════════════ */
function _buildKPIs(ouverts, critiques, syndic, resolus, t) {
  const mine = t.filter(x => x.auteur_id === user.id).length;
  const kpis = [
    { color:'#f97316', ico:'🔧', num:ouverts.length,   lbl:'Ouverts',  sub:'Actifs',         badge:ouverts.length>0?{txt:ouverts.length+'',cls:'dp-pill-o'}:null, fn:"nav('tickets')" },
    { color:'#ef4444', ico:'🚨', num:critiques.length,  lbl:'Critiques',sub:'Action requise',  badge:critiques.length>0?{txt:'!',cls:'dp-pill-r'}:null,             fn:"nav('tickets')" },
    isManager()
      ? { color:'#3b82f6', ico:'📤', num:syndic.length, lbl:'Transmis', sub:'En attente',     badge:syndic.length>0?{txt:syndic.length+'',cls:'dp-pill-b'}:null,    fn:"nav('tickets')" }
      : { color:'#3b82f6', ico:'📋', num:mine,          lbl:'Les miens',sub:'Cr\u00e9\u00e9s par moi', badge:null,                                                  fn:"nav('tickets')" },
    { color:'#22c55e', ico:'✅', num:resolus.length,   lbl:'R\u00e9solus', sub:'Total trait\u00e9s', badge:null,                                                  fn:null }
  ];
  return '<div class="dp-kpis">'
    + kpis.map((k,i) =>
        '<div class="dp-kpi" '+(k.fn?'onclick="'+k.fn+'"':'')
        +' style="animation:pageIn .3s '+(0.05+i*.05)+'s both;">'
        +'<div class="dp-kpi-accent" style="background:'+k.color+';"></div>'
        +'<div class="dp-kpi-top">'
        +'<span class="dp-kpi-icon">'+k.ico+'</span>'
        +(k.badge?'<span class="dp-pill '+k.badge.cls+'">'+k.badge.txt+'</span>':'')
        +'</div>'
        +'<div class="dp-kpi-num" style="color:'+k.color+';">'+k.num+'</div>'
        +'<div class="dp-kpi-label">'+k.lbl+'</div>'
        +'<div class="dp-kpi-sub">'+k.sub+'</div>'
        +'</div>').join('')
    +'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   FOCUSBAR
═══════════════════════════════════════════════════════════════ */
function _buildFocusbar(t) {
  const ouverts  = t.filter(x => x.statut !== 'r\u00e9solu' && x.statut !== 'clos');
  const critiques= t.filter(x => x.urgence === 'critique' && x.statut !== 'r\u00e9solu' && x.statut !== 'clos');
  const transmis = t.filter(x => x.statut === 'transmis_syndic');
  const resolus  = t.filter(x => x.statut === 'r\u00e9solu' || x.statut === 'clos');
  const mine     = t.filter(x => x.auteur_id === user.id && x.statut !== 'r\u00e9solu' && x.statut !== 'clos');

  const chips = [
    { key:'tout',     lbl:'Tout',       cls:'',       cnt:t.length },
    { key:'ouvert',   lbl:'Ouverts',    cls:'c-warn', cnt:ouverts.length },
    { key:'critique', lbl:'Critiques',  cls:'c-crit', cnt:critiques.length },
    isManager()
      ? { key:'transmis', lbl:'Transmis', cls:'c-info', cnt:transmis.length }
      : { key:'mine',     lbl:'Mes',      cls:'c-info', cnt:mine.length },
    { key:'resolu',   lbl:'R\u00e9solus', cls:'c-ok', cnt:resolus.length },
  ];

  return '<div class="dp-focusbar" id="dash-focusbar">'
    + chips.map(c =>
        '<button class="dp-chip '+c.cls+(c.key===_dashFocusMode?' sel':'')+'" data-dash-focus="'+c.key+'" onclick="setDashFocus(\''+c.key+'\')">'
        +c.lbl
        +(c.cnt>0?'<span class="dp-chip-count">'+c.cnt+'</span>':'')
        +'</button>').join('')
    + '<button class="dp-chip dp-chip-zone" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()"></button>'
    + '</div>';
}

/* ═══════════════════════════════════════════════════════════════
   TICKETS RÉCENTS
═══════════════════════════════════════════════════════════════ */
function _ticketHTML(tk) {
  const isC = tk.urgence === 'critique', isI = tk.urgence === 'important';
  const stripe = isC ? '#ef4444' : isI ? '#f59e0b' : '#3b82f6';
  const bgIco  = isC ? 'rgba(239,68,68,.1)' : isI ? 'rgba(245,158,11,.1)' : 'rgba(59,130,246,.1)';
  const ico    = isC ? '🔴' : isI ? '🟠' : '🔵';
  return '<div class="dp-ticket" onclick="openDetail(\''+tk.id+'\')">'
    +'<div class="dp-ticket-stripe" style="background:'+stripe+';"></div>'
    +'<div class="dp-ticket-ico" style="background:'+bgIco+';">'+ico+'</div>'
    +'<div class="dp-ticket-body">'
    +'<div class="dp-ticket-title">'+_e(tk.titre)+'</div>'
    +'<div class="dp-ticket-meta">'
    + badgeStatut(tk.statut)
    +'<span class="dp-ticket-loc">'+_e(tk.batiment||'')+(tk.zone?' \u00b7 '+_e(tk.zone):'')+'</span>'
    +'<span class="dp-ticket-age">\u29d6 '+depuisJours(tk.created_at)+'</span>'
    +'</div>'
    +'</div>'
    +'</div>';
}

function _buildRecentTickets(list) {
  if (!list.length) return '<div class="dp-empty"><div class="dp-empty-ico">\ud83d\udccb</div><div class="dp-empty-title">Aucun signalement</div><div class="dp-empty-sub"><button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler un probl\u00e8me</button></div></div>';
  return list.slice(0,8).map(_ticketHTML).join('');
}

/* ═══════════════════════════════════════════════════════════════
   ZONES BÂTIMENT
═══════════════════════════════════════════════════════════════ */
function _buildZones(ouverts) {
  const zones = (COPRO.tours||[]).concat(['Parking visiteurs','Parking priv\u00e9','Garages','Aire de jeux','Portails / portillons','Ext\u00e9rieur g\u00e9n\u00e9ral']);
  const max   = Math.max(1, ...zones.map(z => ouverts.filter(t => t.batiment === z).length));
  const rows  = zones.map(zone => {
    const cnt = ouverts.filter(t => t.batiment === zone).length;
    if (!cnt) return '';
    const pct   = Math.round((cnt / max) * 100);
    const color = cnt >= 3 ? '#ef4444' : cnt >= 2 ? '#f97316' : '#3b82f6';
    return '<div class="dp-zone-row" onclick="setDashZoneFocus('+JSON.stringify(zone)+')" title="Focus : '+_e(zone)+'">'
      +'<div class="dp-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="dp-zone-track"><div class="dp-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="dp-zone-num" style="color:'+color+';">'+cnt+'</div>'
      +'</div>';
  }).join('');
  return rows || '<div class="dp-empty" style="padding:20px 16px;"><div class="dp-empty-title">Aucun probl\u00e8me ouvert \ud83c\udf89</div></div>';
}

/* ═══════════════════════════════════════════════════════════════
   WIDGET CONTRATS
═══════════════════════════════════════════════════════════════ */
function _buildDashContrats() {
  const actifs    = (cache.contrats||[]).filter(c => c.actif !== false);
  const expires   = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes   = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours??90); });
  const conformes = actifs.filter(c => daysUntil(c.date_echeance) > (c.alerte_jours??90));
  const budget    = actifs.reduce((s,c) => s+(c.montant_annuel||0), 0);
  const urgents   = [...expires,...alertes].sort((a,b) => new Date(a.date_echeance)-new Date(b.date_echeance)).slice(0,4);

  const titleColor = expires.length ? 'color:#ef4444;' : alertes.length ? 'color:#f59e0b;' : '';
  const titleIco   = expires.length ? '🔴' : alertes.length ? '⚠️' : '📄';

  return '<div class="dp-card" style="animation:pageIn .3s .38s both;">'
    +'<div class="dp-card-hd">'
    +'<span class="dp-card-title" style="'+titleColor+'"><span class="dp-card-title-ico">'+titleIco+'</span> Contrats</span>'
    +'<button class="dp-card-link" onclick="nav(\'contrats\')">G\u00e9rer \u2192</button>'
    +'</div>'
    +'<div class="dp-contrats-kpis">'
    +'<div class="dp-ckpi '+(expires.length?'ck-r':'')+'"><div class="dp-ckpi-val">'+expires.length+'</div><div class="dp-ckpi-label">Expir\u00e9s</div></div>'
    +'<div class="dp-ckpi '+(alertes.length?'ck-o':'')+'"><div class="dp-ckpi-val">'+alertes.length+'</div><div class="dp-ckpi-label">En alerte</div></div>'
    +'<div class="dp-ckpi ck-g"><div class="dp-ckpi-val">'+conformes.length+'</div><div class="dp-ckpi-label">Conformes</div></div>'
    +'</div>'
    +(urgents.length===0
      ? '<div class="dp-empty" style="padding:14px 16px;"><div class="dp-empty-title">\u2705 Tous conformes</div></div>'
      : urgents.map(c => {
          const d = daysUntil(c.date_echeance);
          const color = d<0||d<=30 ? '#ef4444' : '#f59e0b';
          const lbl   = d<0 ? 'Expir\u00e9 ('+(-d)+'j)' : d+'j';
          return '<div class="dp-contrat-row" onclick="nav(\'contrats\')">'
            +'<div class="dp-cdot" style="background:'+color+';"></div>'
            +'<div style="flex:1;min-width:0;">'
            +'<div class="dp-cname">'+_e(c.fournisseur)+'</div>'
            +'<div class="dp-ctype">'+_e(c.type_contrat||'')+(c.contact_nom?' \u00b7 '+_e(c.contact_nom):'')+'</div>'
            +'</div>'
            +'<div class="dp-cdays" style="color:'+color+';">'+lbl+'</div>'
            +'</div>';
        }).join(''))
    +'<div class="dp-cbudget"><span class="dp-cbudget-lbl">\ud83d\udcb0 Budget annuel</span><span class="dp-cbudget-val">'+_eur(budget)+'</span></div>'
    +'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DASHBOARD
═══════════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const el = $('page');
  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div style="padding:24px;color:var(--text-3);font-size:13px;">Chargement\u2026</div>';
    return;
  }

  const t        = cache.tickets || [];
  const ouverts  = t.filter(x => x.statut !== 'r\u00e9solu' && x.statut !== 'clos');
  const critiques= t.filter(x => x.urgence === 'critique' && x.statut !== 'r\u00e9solu' && x.statut !== 'clos');
  const syndic   = t.filter(x => x.statut === 'transmis_syndic');
  const resolus  = t.filter(x => x.statut === 'r\u00e9solu' || x.statut === 'clos');

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const prenom = displayName(profile&&profile.prenom, profile&&profile.nom, user&&user.email, 'vous').split(' ')[0];

  el.innerHTML = '<div class="dash2" id="dash-content" style="padding:20px;">'

    // Hero
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">'
    +'<div>'
    +'<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:6px;">'
    +new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    +'</div>'
    +'<h1 style="font-size:22px;font-weight:800;margin:0;font-family:var(--font-head,inherit);color:var(--text-1);">Bonjour, '+_e(prenom)+' \ud83d\udc4b</h1>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">'
    +(critiques.length>0
      ? '<span class="dp-pill dp-pill-r">🔴 '+critiques.length+' critique'+(critiques.length>1?'s':'')+'</span>'
      : '<span class="dp-pill dp-pill-g">\u2705 Tout va bien</span>')
    +(ouverts.length>0?'<span style="font-size:12px;color:var(--text-3);">'+ouverts.length+' signalement'+(ouverts.length>1?'s':'')+' en cours</span>':'')
    +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    +'<button class="btn btn-primary" onclick="openNewTicket()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Signaler</button>'
    +'<button class="btn btn-secondary" onclick="nav(\'tickets\')">Signalements</button>'
    +'<button class="btn btn-ghost" onclick="nav(\'faq\')">❓ FAQ</button>'
    +'</div>'
    +'</div>'

    // Situation Room (managers)
    +(isManager() ? _buildSituationRoom(ouverts, critiques, syndic) : '')

    // KPIs
    +_buildKPIs(ouverts, critiques, syndic, resolus, t)

    // Focusbar
    +_buildFocusbar(t)

    // Grille
    +'<div class="dp-grid">'

    // Col gauche : tickets récents
    +'<div class="dp-card" style="animation:pageIn .3s .22s both;">'
    +'<div class="dp-card-hd">'
    +'<span class="dp-card-title"><span class="dp-card-title-ico">🔧</span> Signalements r\u00e9cents</span>'
    +'<button class="dp-card-link" onclick="nav(\'tickets\')">Voir tout \u2192</button>'
    +'</div>'
    +'<div class="dp-card-body" id="dash-recent-list">'
    +_buildRecentTickets(t.slice(0,8))
    +'</div>'
    +'</div>'

    // Col droite : stack
    +'<div class="dp-stack">'

    // Chart
    +'<div class="dp-card" style="animation:pageIn .3s .27s both;">'
    +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">📊</span> Activit\u00e9 \u00b7 6 mois</span></div>'
    +'<div style="padding:14px 16px;"><div style="position:relative;"><canvas id="dash-chart" height="100"></canvas><div id="dash-chart-tip" class="dash2-chart-tip" style="display:none;"></div></div></div>'
    +'</div>'

    // Zones bâtiment
    +'<div class="dp-card" style="animation:pageIn .3s .32s both;">'
    +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">🏢</span> Par b\u00e2timent</span></div>'
    +'<div class="dp-card-body" id="dash-zone-list">'+_buildZones(ouverts)+'</div>'
    +'</div>'

    // Contrats (managers)
    +(isManager() ? _buildDashContrats() : '')

    // Events
    +'<div class="dp-card" id="dash-events-widget" style="animation:pageIn .3s .37s both;">'
    +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">📅</span> \u00c9v\u00e9nements</span><button class="dp-card-link" onclick="nav(\'agenda\')">Agenda \u2192</button></div>'
    +'<div class="dp-card-body" id="dash-events-list"><div class="dp-empty" style="padding:16px;"><div class="dp-empty-sub">Chargement\u2026</div></div></div>'
    +'</div>'

    // Annonces
    +'<div class="dp-card" id="dash-annonces-widget" style="animation:pageIn .3s .40s both;">'
    +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">📢</span> Annonces</span><button class="dp-card-link" onclick="nav(\'annonces\')">Toutes \u2192</button></div>'
    +'<div class="dp-card-body" id="dash-annonces-list"><div class="dp-empty" style="padding:16px;"><div class="dp-empty-sub">Chargement\u2026</div></div></div>'
    +'</div>'

    // Votes
    +(function(){
        const votes=(typeof _votesCache!=='undefined')?_votesCache.filter(v=>v.statut==='ouvert'):[];
        if(!votes.length) return '';
        return '<div class="dp-card" style="animation:pageIn .3s .43s both;">'
          +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">🗳️</span> Votes en cours</span><button class="dp-card-link" onclick="nav(\'votes\')">Voter \u2192</button></div>'
          +'<div class="dp-card-body">'
          +votes.slice(0,3).map(v=>{
              const maRep=(typeof _reponsesCache!=='undefined')?_reponsesCache[v.id]:null;
              const total=(typeof _allReponsesCache!=='undefined'&&_allReponsesCache[v.id])?_allReponsesCache[v.id].length:0;
              return '<div class="dp-list-row" onclick="nav(\'votes\')">'
                +'<div class="dp-list-ico">'+((typeof VOTE_TYPES!=='undefined'&&VOTE_TYPES[v.type])?VOTE_TYPES[v.type].ico:'🗳️')+'</div>'
                +'<div class="dp-list-body"><div class="dp-list-title">'+_e(v.titre)+'</div><div class="dp-list-sub">'+total+' participant'+(total>1?'s':'')+'</div></div>'
                +(maRep?'<span class="dp-pill dp-pill-g">\u2713 Vot\u00e9</span>':'<span class="dp-pill dp-pill-o">\u00c0 voter</span>')
                +'</div>';
            }).join('')
          +'</div></div>';
      })()

    // Documents
    +(function(){
        const docs=(typeof _docsCache!=='undefined')?_docsCache:[];
        if(!docs.length) return '';
        return '<div class="dp-card" style="animation:pageIn .3s .46s both;">'
          +'<div class="dp-card-hd"><span class="dp-card-title"><span class="dp-card-title-ico">📄</span> Documents r\u00e9cents</span><button class="dp-card-link" onclick="nav(\'documents\')">Voir tous \u2192</button></div>'
          +'<div class="dp-card-body">'
          +docs.slice(0,4).map(doc=>{
              const cat=(typeof DOC_CATS!=='undefined'&&DOC_CATS[doc.categorie])?DOC_CATS[doc.categorie]:{ico:'📄'};
              const isNew=(typeof _docsVus!=='undefined')?!_docsVus.has(doc.id):false;
              return '<div class="dp-list-row" onclick="nav(\'documents\')">'
                +'<div class="dp-list-ico">'+cat.ico+'</div>'
                +'<div class="dp-list-body"><div class="dp-list-title">'+_e(doc.titre)+'</div><div class="dp-list-sub">'+fmtD(doc.created_at)+'</div></div>'
                +(isNew?'<span class="dp-pill dp-pill-b">Nouveau</span>':'')
                +'</div>';
            }).join('')
          +'</div></div>';
      })()

    // Installer l'app
    +'<div class="dp-card" style="animation:pageIn .3s .49s both;">'
    +'<div class="dp-install">'
    +'<div class="dp-install-ico">📱</div>'
    +'<div class="dp-install-title">Installer l\'app</div>'
    +'<div class="dp-install-sub">iPhone : Safari \u2192 Partager \u2192 \u00ab\u202fSur l\'\u00e9cran d\'accueil\u202f\u00bb<br>Android : Chrome \u2192 \u22ee \u2192 \u00ab\u202fInstaller l\'application\u202f\u00bb</div>'
    +'</div></div>'

    +'</div>' // fin dp-stack
    +'</div>' // fin dp-grid
    +'</div>'; // fin dash2

  loadDashboardWidgets();
}

/* ═══════════════════════════════════════════════════════════════
   FOCUS
═══════════════════════════════════════════════════════════════ */
function clearDashFocus() { setDashFocus('tout'); }
function setDashZoneFocus(zone) { _dashFocusMode='zone'; _dashFocusZone=zone; refreshDashFocus(); }
function setDashFocus(mode) { _dashFocusMode=mode||'tout'; _dashFocusZone=null; refreshDashFocus(); }
function isResolvedStatut(s) { return s==='résolu'||s==='clos'; }
function isOpenStatut(s)     { return !isResolvedStatut(s); }

function getDashTicketsForRecent() {
  const l=cache.tickets||[], m=_dashFocusMode;
  if(m==='tout')     return l;
  if(m==='ouvert')   return l.filter(t=>isOpenStatut(t.statut));
  if(m==='critique') return l.filter(t=>t.urgence==='critique'&&isOpenStatut(t.statut));
  if(m==='resolu')   return l.filter(t=>isResolvedStatut(t.statut));
  if(m==='mine')     return l.filter(t=>t.auteur_id===user.id&&isOpenStatut(t.statut));
  if(m==='transmis') return l.filter(t=>t.statut==='transmis_syndic');
  if(m==='zone')     return l.filter(t=>t.batiment===_dashFocusZone&&isOpenStatut(t.statut));
  return l;
}
function getDashTicketsForZones()  { const l=cache.tickets||[]; return _dashFocusMode==='tout'?l.filter(t=>isOpenStatut(t.statut)):getDashTicketsForRecent(); }
function getDashTicketsForChart()  { const l=cache.tickets||[]; return _dashFocusMode==='tout'?l:getDashTicketsForRecent(); }

function renderDashRecentListHTML(list) {
  if(!list.length) return '<div class="dp-empty"><div class="dp-empty-ico">📋</div><div class="dp-empty-title">Aucun signalement</div><div class="dp-empty-sub"><button class="btn btn-primary btn-sm" onclick="openNewTicket()">+ Signaler</button></div></div>';
  return list.slice(0,8).map(_ticketHTML).join('');
}

function renderDashZonesListHTML(tickets) {
  const zones=(COPRO.tours||[]).concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']);
  const max=Math.max(1,...zones.map(z=>tickets.filter(t=>t.batiment===z).length));
  const rows=zones.map(zone=>{
    const cnt=tickets.filter(t=>t.batiment===zone).length;
    if(!cnt) return '';
    const pct=Math.round((cnt/max)*100);
    const color=cnt>=3?'#ef4444':cnt>=2?'#f97316':'#3b82f6';
    return '<div class="dp-zone-row" onclick="setDashZoneFocus('+JSON.stringify(zone)+')" title="Focus : '+_e(zone)+'">'
      +'<div class="dp-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="dp-zone-track"><div class="dp-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="dp-zone-num" style="color:'+color+';">'+cnt+'</div>'
      +'</div>';
  }).join('');
  return rows||'<div class="dp-empty" style="padding:20px 16px;"><div class="dp-empty-title">Aucun problème ouvert 🎉</div></div>';
}

function refreshDashFocus() {
  const recentEl=$('dash-recent-list'), zoneEl=$('dash-zone-list');
  if(!recentEl||!zoneEl) return;
  const bar=$('dash-focusbar');
  if(bar) {
    bar.querySelectorAll('[data-dash-focus]').forEach(btn=>btn.classList.toggle('sel',btn.getAttribute('data-dash-focus')===_dashFocusMode));
    const cz=$('dash-chip-zone');
    if(cz){ const show=_dashFocusMode==='zone'&&!!_dashFocusZone; cz.style.display=show?'':'none'; if(show) cz.textContent='Zone : '+_dashFocusZone; }
  }
  recentEl.innerHTML=renderDashRecentListHTML(getDashTicketsForRecent());
  zoneEl.innerHTML=renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   WIDGETS ASYNCHRONES
═══════════════════════════════════════════════════════════════ */
async function loadDashboardWidgets() {
  // Events
  const {data:evts}=await sb.from('evenements').select('*').gte('date_debut',new Date().toISOString()).order('date_debut').limit(4);
  const evtEl=$('dash-events-list');
  if(evtEl){
    if(!evts||!evts.length){
      evtEl.innerHTML='<div class="dp-empty" style="padding:16px;"><div class="dp-empty-title">Aucun événement à venir</div></div>';
    } else {
      evtEl.innerHTML=evts.map(e=>{
        const et=(typeof EVENT_TYPES!=='undefined'&&EVENT_TYPES[e.type])?EVENT_TYPES[e.type]:{color:'#6b7280'};
        const d=new Date(e.date_debut);
        const isImmi=(d-new Date())<86400000;
        return '<div class="dp-list-row" onclick="nav(\'agenda\')">'
          +'<div style="width:4px;height:36px;border-radius:2px;background:'+et.color+';flex-shrink:0;"></div>'
          +'<div class="dp-list-body">'
          +'<div class="dp-list-title" style="'+(isImmi?'color:#f97316;':'')+'">'+ _e(e.titre)+'</div>'
          +'<div class="dp-list-sub">📅 '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' à '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+(e.lieu?' \u00b7 '+_e(e.lieu):'')+'</div>'
          +'</div>'
          +(isImmi?'<span class="dp-pill dp-pill-o">Bientôt</span>':'')
          +'</div>';
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
      annEl.innerHTML='<div class="dp-empty" style="padding:16px;"><div class="dp-empty-title">Aucune annonce</div></div>';
    } else {
      const icos={urgent:'🚨',important:'⚠️',info:'📢'};
      annEl.innerHTML=anns.map(a=>
        '<div class="dp-list-row" onclick="nav(\'annonces\')">'
        +'<div class="dp-list-ico">'+(a.epingle?'📌':(icos[a.type]||'📢'))+'</div>'
        +'<div class="dp-list-body"><div class="dp-list-title">'+_e(a.titre)+'</div>'
        +(a.contenu?'<div class="dp-list-sub">'+_e(a.contenu.substring(0,70))+(a.contenu.length>70?'…':'')+'</div>':'')
        +'</div>'
        +(a.epingle?'<span class="dp-pill dp-pill-n">Épinglé</span>':'')
        +'</div>'
      ).join('');
    }
  }

  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   CHART
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
  const W=canvas.offsetWidth||300,H=100;
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
    ctx.fillStyle=textColor;ctx.font='9px sans-serif';ctx.textAlign='center';
    ctx.fillText(m.label,x+barW+barG/2,H-5);
  });
  const lx=W-pad.right-110;
  ctx.fillStyle='#3b82f6';ctx.fillRect(lx,3,9,7);
  ctx.fillStyle=textColor;ctx.font='9px sans-serif';ctx.textAlign='left';ctx.fillText('Créés',lx+13,10);
  ctx.fillStyle='#22c55e';ctx.fillRect(lx+52,3,9,7);
  ctx.fillStyle=textColor;ctx.fillText('Résolus',lx+65,10);
  if(tipEl){
    const wrap=canvas.closest('div')||canvas.parentElement;
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
   TICKETS — TOUT CE QUI EXISTAIT AVANT, INCHANGÉ
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
