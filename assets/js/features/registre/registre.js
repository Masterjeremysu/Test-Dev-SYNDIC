// ════════════════════════════════════════════════════════════════════════════
//  REGISTRE D'INTERVENTION — CoproSync Premium
//  assets/js/features/registre/registre.js
// ════════════════════════════════════════════════════════════════════════════

let _regTab       = 'historique';
let _regFilter    = 'all';
let _regZones     = [];
let _regPrestas   = [];
let _regPassages  = [];
let _realtimeChan = null;
let _missionCounter = 10;

// ── CSS ───────────────────────────────────────────────────────────────────────
(function injectRegistreCSS() {
  if (document.getElementById('coprosync-registre-css')) return;
  const s = document.createElement('style');
  s.id = 'coprosync-registre-css';
  s.textContent = `
    .reg-wrap{padding:32px 40px;max-width:1280px;margin:0 auto}
    .reg-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px;margin-bottom:36px}
    .reg-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text-3);margin-bottom:6px;display:flex;align-items:center;gap:6px}
    .reg-eyebrow::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:reg-pulse 2s infinite}
    @keyframes reg-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
    .reg-h1{font-family:var(--font-head);font-size:34px;font-weight:900;letter-spacing:-1.2px;color:var(--text-1);margin:0 0 6px}
    .reg-sub{font-size:14px;color:var(--text-3);font-weight:500;margin:0}
    .reg-header-actions{display:flex;gap:10px;flex-wrap:wrap}
    .reg-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s cubic-bezier(.4,0,.2,1);border:1px solid transparent;white-space:nowrap}
    .reg-btn svg{flex-shrink:0}
    .reg-btn-primary{background:var(--primary);color:white;border-color:var(--primary);box-shadow:0 4px 14px rgba(0,0,0,.18)}
    .reg-btn-primary:hover{filter:brightness(1.1);box-shadow:0 6px 20px rgba(0,0,0,.25);transform:translateY(-1px)}
    .reg-btn-secondary{background:var(--surface);color:var(--text-2);border-color:var(--border)}
    .reg-btn-secondary:hover{background:var(--surface-2);color:var(--text-1);border-color:var(--border-strong)}
    .reg-btn-ghost{background:transparent;color:var(--text-3);border-color:transparent}
    .reg-btn-ghost:hover{background:var(--surface-2);color:var(--text-1)}
    .reg-btn-sm{padding:6px 12px;font-size:12px;border-radius:8px}
    .reg-btn-icon{padding:9px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text-2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .18s}
    .reg-btn-icon:hover{background:var(--surface-2);color:var(--text-1)}
    .reg-tabs{display:inline-flex;background:var(--bg-2);padding:3px;border-radius:12px;border:1px solid var(--border);gap:2px;margin-bottom:28px}
    .reg-tab{padding:7px 18px;font-size:13px;font-weight:700;color:var(--text-3);background:transparent;border:none;border-radius:9px;cursor:pointer;transition:all .2s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;gap:6px}
    .reg-tab:hover:not(.active){color:var(--text-1)}
    .reg-tab.active{color:var(--text-1);background:var(--surface);box-shadow:0 1px 6px rgba(0,0,0,.1)}
    .reg-tab-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:20px;font-size:10px;font-weight:900;background:var(--bg-1);color:var(--text-3)}
    .reg-tab.active .reg-tab-count{background:var(--primary);color:white}
    .reg-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
    .reg-filter-pill{padding:5px 13px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;border:1px solid var(--border);background:var(--surface);color:var(--text-3)}
    .reg-filter-pill:hover{color:var(--text-1);border-color:var(--border-strong)}
    .reg-filter-pill.active{background:var(--text-1);color:var(--bg-1);border-color:var(--text-1)}
    .reg-filter-pill.f-en_cours.active{background:var(--green);border-color:var(--green);color:white}
    .reg-filter-pill.f-anomalie.active{background:#F59E0B;border-color:#F59E0B;color:white}
    .reg-filter-pill.f-manquant.active{background:#EF4444;border-color:#EF4444;color:white}
    .reg-filter-pill.f-termine.active{background:var(--text-3);border-color:var(--text-3);color:white}
    .reg-table-shell{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden}
    .reg-table-head{display:grid;grid-template-columns:2.5fr 1.2fr 85px 85px 90px 120px 40px;gap:8px;align-items:center;padding:12px 20px;background:var(--bg-1);border-bottom:1px solid var(--border)}
    .reg-th-cell{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
    .reg-th-cell.right{text-align:right}
    .reg-row{display:grid;grid-template-columns:2.5fr 1.2fr 85px 85px 90px 120px 40px;gap:8px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--bg-2);transition:background .15s;cursor:default}
    .reg-row:last-child{border-bottom:none}
    .reg-row:hover{background:var(--surface-2)}
    .reg-row.row-manquant{background:rgba(239,68,68,.03)}
    .reg-row.row-anomalie{background:rgba(245,158,11,.03)}
    .reg-presta-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block}
    .reg-presta-name{font-size:14px;font-weight:800;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .reg-mission-tag{font-size:11.5px;color:var(--text-3);font-weight:500;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .reg-zone-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--text-2)}
    .reg-time-cell{font-size:13px;font-weight:700;color:var(--text-2);font-variant-numeric:tabular-nums}
    .reg-dur-cell{font-size:14px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums}
    .reg-dur-live{color:var(--green);font-size:12px;font-weight:700}
    .reg-actions-cell{display:flex;justify-content:flex-end}
    .reg-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:20px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
    .badge-en_cours{background:rgba(34,197,94,.1);color:var(--green)}
    .badge-en_cours .bdot{background:var(--green);animation:reg-pulse 2s infinite}
    .badge-termine{background:var(--bg-2);color:var(--text-3)}
    .badge-termine .bdot{background:var(--text-3)}
    .badge-anomalie{background:rgba(245,158,11,.1);color:#F59E0B}
    .badge-anomalie .bdot{background:#F59E0B}
    .badge-manquant{background:rgba(239,68,68,.1);color:#EF4444}
    .badge-manquant .bdot{background:#EF4444}
    .bdot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
    .badge-valide{background:rgba(34,197,94,.08);color:var(--green);font-size:9.5px;padding:2px 7px;margin-left:4px}
    .reg-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
    .reg-stat-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:14px}
    .reg-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .reg-stat-val{font-size:24px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums}
    .reg-stat-lbl{font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-top:1px}
    .reg-zones-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
    .zone-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer;transition:all .22s cubic-bezier(.4,0,.2,1)}
    .zone-card:hover{border-color:var(--border-strong);box-shadow:0 8px 24px rgba(0,0,0,.06);transform:translateY(-2px)}
    .zone-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .zone-ico{width:44px;height:44px;border-radius:12px;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-2)}
    .zone-token{font-family:monospace;font-size:10px;color:var(--text-3);background:var(--bg-2);padding:2px 8px;border-radius:4px;border:1px solid var(--border)}
    .zone-name{font-size:16px;font-weight:800;color:var(--text-1);margin-bottom:4px}
    .zone-lastpass{font-size:12px;color:var(--text-3);font-weight:500}
    .zone-actions{display:flex;gap:8px;margin-top:16px;border-top:1px solid var(--bg-2);padding-top:16px}
    .reg-prestas-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:22px}
    .presta-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:all .22s cubic-bezier(.4,0,.2,1)}
    .presta-card:hover{border-color:var(--border-strong);box-shadow:0 12px 32px rgba(0,0,0,.06);transform:translateY(-3px)}
    .presta-card-top{padding:22px 22px 0}
    .presta-card-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px}
    .presta-ava{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:white;flex-shrink:0}
    .presta-nom{font-size:18px;font-weight:900;color:var(--text-1);margin-bottom:3px}
    .presta-contrat{font-size:12.5px;color:var(--text-3);font-weight:600}
    .presta-missions{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
    .presta-mission-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-1);border-radius:10px;border:1px solid var(--border)}
    .presta-mission-name{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:2px}
    .presta-mission-meta{font-size:11px;color:var(--text-3);font-weight:500}
    .presta-mission-freq{font-size:11px;font-weight:800;color:var(--primary);background:rgba(var(--primary-rgb),.08);padding:3px 8px;border-radius:6px;white-space:nowrap}
    .presta-card-footer{display:flex;gap:10px;padding:16px 22px;border-top:1px solid var(--bg-2);margin-top:4px}
    .frm-row{margin-bottom:18px}
    .frm-label{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);display:block;margin-bottom:7px}
    .frm-input{width:100%;background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:14px;font-weight:600;color:var(--text-1);outline:none;transition:border-color .18s;box-sizing:border-box;font-family:var(--font-body)}
    .frm-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(var(--primary-rgb),.1)}
    .frm-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-size:16px;padding-right:36px}
    .frm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .frm-section{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);padding:8px 0 12px;border-bottom:1px solid var(--border);margin-bottom:16px}
    .frm-textarea{min-height:80px;resize:vertical}
    .frm-mission-block{border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;background:var(--bg-1);position:relative}
    .frm-add-mission{width:100%;padding:9px;border-radius:10px;border:1px dashed var(--border);background:transparent;color:var(--text-3);font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:6px}
    .frm-add-mission:hover{border-color:var(--primary);color:var(--primary)}
    .reg-alert-banner{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;margin-bottom:20px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2)}
    .reg-alert-ico{color:#EF4444;flex-shrink:0}
    .reg-alert-text{flex:1;font-size:13px;font-weight:700;color:var(--text-1)}
    .reg-alert-text span{font-weight:500;color:var(--text-2)}
    .reg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 20px;color:var(--text-3);gap:12px}
    .reg-empty svg{opacity:.3}
    .reg-empty p{font-size:15px;font-weight:700;margin:0}
    .reg-empty span{font-size:13px;font-weight:500;opacity:.7}
    .reg-skeleton{background:var(--bg-2);border-radius:8px;animation:reg-shimmer 1.4s infinite}
    @keyframes reg-shimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}
    .qr-modal-content{display:flex;flex-direction:column;align-items:center;gap:20px;padding:8px 0}
    .qr-frame{background:white;border-radius:16px;padding:20px;display:flex;align-items:center;justify-content:center}
    .qr-url{font-family:monospace;font-size:11px;background:var(--bg-2);padding:8px 14px;border-radius:8px;border:1px solid var(--border);color:var(--text-2);word-break:break-all;text-align:center}
    .qr-zone-name{font-size:16px;font-weight:800;color:var(--text-1);text-align:center}
    .qr-instructions{font-size:13px;color:var(--text-3);text-align:center;font-weight:500;line-height:1.6}
    
    /* NOUVEAU DESIGN PRESTATAIRE PRO MAX */
    .presta-contact-badges { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap }
    .presta-c-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; background:var(--bg-2); border:1px solid var(--border); font-size:11px; font-weight:700; color:var(--text-2); text-decoration:none; transition:all .15s }
    .presta-c-badge:hover { background:var(--surface-2); color:var(--text-1); border-color:var(--border-strong) }
    .presta-missions-scroll { max-height:260px; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:8px; margin-bottom:16px }
    .presta-missions-scroll::-webkit-scrollbar { width:4px }
    .presta-missions-scroll::-webkit-scrollbar-track { background:transparent }
    .presta-missions-scroll::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:4px }
    .presta-missions-scroll::-webkit-scrollbar-thumb:hover { background:var(--text-3) }
    
    @media(max-width:1100px){.reg-stats{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:768px){
      .reg-wrap{padding:18px 16px}
      .reg-h1{font-size:26px}
      .reg-stats{grid-template-columns:repeat(2,1fr);gap:10px}
      .reg-table-head{display:none}
      .reg-row{grid-template-columns:1fr auto;gap:10px;padding:14px 16px}
      .reg-row>*:nth-child(3),.reg-row>*:nth-child(4),.reg-row>*:nth-child(5){display:none}
      .reg-header{flex-direction:column}
      .reg-header-actions{width:100%}
      .reg-btn{flex:1;justify-content:center}
    }
    @media print{
      body>*{display:none!important}
      #reg-print-area{display:flex!important;position:fixed;inset:0;background:white;color:black;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:40px;z-index:9999}
      #reg-print-area .pt{font-size:42px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;text-align:center}
      #reg-print-area .ps{font-size:20px;color:#6b7280;text-align:center;font-weight:600}
      #reg-print-area .pqr{width:360px;height:360px}
      #reg-print-area .pu{font-size:13px;color:#9ca3af;margin-top:8px;word-break:break-all;text-align:center}
      #reg-print-area .pf{font-size:15px;font-weight:700;color:#d1d5db;margin-top:16px}
    }
    @keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(s);
})();

// ── UTILITAIRES ───────────────────────────────────────────────────────────────

function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _coproId() {
  if (typeof profile !== 'undefined' && profile && profile.copro_id) {
    return profile.copro_id;
  }
  return window._currentCoproId || window.COPRO_ID || null;
}

function _regZoneLoc(id)  { return _regZones.find(z => z.id === id); }
function _regPrestaLoc(id){ return _regPrestas.find(p => p.id === id); }
function _regFmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function _regFmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'});
}
function _regDuree(a,b) {
  if (!b) return null;
  const mins = Math.floor((new Date(b)-new Date(a))/60000);
  const h=Math.floor(mins/60),m=mins%60;
  return h>0?`${h}h${String(m).padStart(2,'0')}`:`${m} min`;
}
function _regSince(iso) {
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60) return `${s}s`;
  const m=Math.floor(s/60);
  if(m<60) return `${m} min`;
  return `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
}

function _ico(name,size=18) {
  const i={
    search:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    trash:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
    door:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><polyline points="1 9 12 2 23 9"/></svg>`,
    car:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    leaf:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 22c0-9 8-16 18-16-1 9-9 16-18 16z"/><path d="M2 22s4-4 10-7"/></svg>`,
    wrench:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    qr:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3v3h3zM15 16v3"/><path d="M21 21v-2"/><path d="M15 3h3v3h-3v3M3 9v3h6V9M9 3v3"/></svg>`,
    plus:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    clock:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    check:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    edit:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    print:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    warn:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    close:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    phone:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.71 19.79 19.79 0 012 1.18 2 2 0 014 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
    mail:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    trash2:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/></svg>`,
    user:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    doc:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    spin:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:spin .8s linear infinite;display:block"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>`,
  };
  return i[name]||i['clock'];
}



window.filterZones = function(val) {
  const term = (val || '').toLowerCase().trim();
  document.querySelectorAll('#reg-zones-grid-container .zone-card').forEach(card => {
    const nom = card.getAttribute('data-nom') || '';
    card.style.display = nom.includes(term) ? 'flex' : 'none';
  });
};

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────

async function renderRegistre() {
  const page = document.getElementById('page');
  if (!page) return;
  const copro_id = _coproId();
  if (!copro_id) {
    page.innerHTML = `<div class="reg-wrap"><div class="reg-empty">${_ico('warn',40)}<p>Aucune copropriété sélectionnée</p><span>Définissez window._currentCoproId dans votre app.</span></div></div>`;
    return;
  }
  const mgr = typeof canManageRegistre === 'function' ? canManageRegistre() : (typeof isManager==='function' ? isManager() : true);

  page.innerHTML = `
  <div class="reg-wrap" style="animation:pageIn .3s ease">
    <div class="reg-header">
      <div>
        <div class="reg-eyebrow">Registre d'Intervention</div>
        <h1 class="reg-h1">Suivi des passages</h1>
        <p class="reg-sub">Temps réel · QR Codes par zone · Validation manuelle</p>
      </div>
      ${mgr?`<div class="reg-header-actions">
        <button class="reg-btn reg-btn-secondary" onclick="setRegistreTab('zones')">${_ico('qr')} Gérer les zones QR</button>
        <button class="reg-btn reg-btn-primary" onclick="openPointageManuel()">${_ico('clock')} Pointage manuel</button>
      </div>`:''}
    </div>
    <div id="reg-alert-area"></div>
    <div id="reg-stats-area">
      <div class="reg-stats">${[0,1,2,3].map(()=>`<div class="reg-stat-card"><div class="reg-skeleton" style="width:40px;height:40px;border-radius:10px"></div><div><div class="reg-skeleton" style="width:40px;height:24px;border-radius:6px;margin-bottom:6px"></div><div class="reg-skeleton" style="width:80px;height:10px;border-radius:4px"></div></div></div>`).join('')}</div>
    </div>
    <div class="reg-tabs">
      <button class="reg-tab active" data-tab="historique" onclick="setRegistreTab('historique')">Historique <span class="reg-tab-count" id="rc-hist">…</span></button>
      ${mgr?`<button class="reg-tab" data-tab="prestataires" onclick="setRegistreTab('prestataires')">Prestataires <span class="reg-tab-count" id="rc-presta">…</span></button>
      <button class="reg-tab" data-tab="zones" onclick="setRegistreTab('zones')">Zones QR <span class="reg-tab-count" id="rc-zones">…</span></button>`:''}
    </div>
    <div id="reg-tab-historique"><div class="reg-empty">${_ico('spin',32)}<p>Chargement…</p></div></div>
    <div id="reg-tab-prestataires" style="display:none"></div>
    <div id="reg-tab-zones" style="display:none"></div>
  </div>
  <div id="reg-print-area" style="display:none"></div>`;

  try {
    [_regZones,_regPrestas,_regPassages] = await Promise.all([
      dbGetZones(copro_id),
      dbGetPrestataires(copro_id),
      dbGetPassages(copro_id),
    ]);
  } catch(err) {
    document.getElementById('reg-tab-historique').innerHTML=`<div class="reg-empty">${_ico('warn',40)}<p>Erreur de chargement</p><span>${_esc(err.message)}</span></div>`;
    return;
  }

  const rc=document.getElementById('rc-hist');  if(rc)rc.textContent=_regPassages.length;
  const rp=document.getElementById('rc-presta');if(rp)rp.textContent=_regPrestas.length;
  const rz=document.getElementById('rc-zones'); if(rz)rz.textContent=_regZones.length;

  _renderAlerts(); _renderStats(); _renderHistorique(); _renderPrestataires(); _renderZones();

  if(_realtimeChan) unsubscribePassages(_realtimeChan);
  _realtimeChan = subscribePassages(copro_id, async()=>{
    _regPassages = await dbGetPassages(copro_id);
    _renderAlerts(); _renderStats(); _renderHistoriqueRows();
  });
}

function setRegistreTab(tab) {
  _regTab=tab;
  document.querySelectorAll('.reg-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  ['historique','prestataires','zones'].forEach(id=>{
    const el=document.getElementById(`reg-tab-${id}`);
    if(el)el.style.display=id===tab?'block':'none';
  });
}

// ── ALERTES ───────────────────────────────────────────────────────────────────
function _renderAlerts() {
  const el=document.getElementById('reg-alert-area'); if(!el)return;
  const nM=_regPassages.filter(p=>p.status==='manquant').length;
  const nA=_regPassages.filter(p=>p.status==='anomalie').length;
  if(!nM&&!nA){el.innerHTML='';return;}
  el.innerHTML=`<div class="reg-alert-banner"><span class="reg-alert-ico">${_ico('warn',20)}</span><span class="reg-alert-text">${nM?`<strong>${nM} passage${nM>1?'s':''} sans départ</strong>`:''}${nM&&nA?' · ':''}${nA?`<strong>${nA} anomalie${nA>1?'s':''}</strong>`:''}<span> — cliquez sur une ligne pour corriger.</span></span></div>`;
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function _renderStats() {
  const el=document.getElementById('reg-stats-area'); if(!el)return;
  const eC=_regPassages.filter(p=>p.status==='en_cours').length;
  const al=_regPassages.filter(p=>p.status==='anomalie'||p.status==='manquant').length;
  el.innerHTML=`<div class="reg-stats">
    <div class="reg-stat-card"><div class="reg-stat-icon" style="background:rgba(34,197,94,.1);color:#22C55E">${_ico('clock',20)}</div><div><div class="reg-stat-val">${eC}</div><div class="reg-stat-lbl">En cours</div></div></div>
    <div class="reg-stat-card"><div class="reg-stat-icon" style="background:rgba(var(--primary-rgb),.1);color:var(--primary)">${_ico('doc',20)}</div><div><div class="reg-stat-val">${_regPassages.length}</div><div class="reg-stat-lbl">Passages (30j)</div></div></div>
    <div class="reg-stat-card"><div class="reg-stat-icon" style="background:rgba(239,68,68,.1);color:#EF4444">${_ico('warn',20)}</div><div><div class="reg-stat-val">${al}</div><div class="reg-stat-lbl">Alertes</div></div></div>
    <div class="reg-stat-card"><div class="reg-stat-icon" style="background:rgba(245,158,11,.1);color:#F59E0B">${_ico('user',20)}</div><div><div class="reg-stat-val">${_regPrestas.length}</div><div class="reg-stat-lbl">Prestataires</div></div></div>
  </div>`;
}

// ── HISTORIQUE ────────────────────────────────────────────────────────────────
function setRegFilter(f) {
  _regFilter=f;
  document.querySelectorAll('.reg-filter-pill').forEach(p=>p.classList.toggle('active',p.dataset.filter===f));
  _renderHistoriqueRows();
}
function _renderHistorique() {
  const el=document.getElementById('reg-tab-historique'); if(!el)return;
  el.innerHTML=`
    <div class="reg-filters">
      <span class="reg-filter-pill active" data-filter="all" onclick="setRegFilter('all')">Tous</span>
      <span class="reg-filter-pill f-en_cours" data-filter="en_cours" onclick="setRegFilter('en_cours')">En cours</span>
      <span class="reg-filter-pill f-anomalie" data-filter="anomalie" onclick="setRegFilter('anomalie')">Anomalie</span>
      <span class="reg-filter-pill f-manquant" data-filter="manquant" onclick="setRegFilter('manquant')">Départ manquant</span>
      <span class="reg-filter-pill f-termine" data-filter="termine" onclick="setRegFilter('termine')">Terminés</span>
    </div>
    <div class="reg-table-shell">
      <div class="reg-table-head">
        <div class="reg-th-cell">Prestataire &amp; Mission</div>
        <div class="reg-th-cell">Zone</div>
        <div class="reg-th-cell">Arrivée</div>
        <div class="reg-th-cell">Départ</div>
        <div class="reg-th-cell">Durée</div>
        <div class="reg-th-cell right">Statut</div>
        <div></div>
      </div>
      <div id="reg-rows"></div>
    </div>`;
  _renderHistoriqueRows();
}
function _renderHistoriqueRows() {
  const el=document.getElementById('reg-rows'); if(!el)return;
  const rows=_regFilter==='all'?_regPassages:_regPassages.filter(p=>p.status===_regFilter);
  if(!rows.length){
    el.innerHTML=`<div class="reg-empty">${_ico('doc',40)}<p>Aucun passage</p><span>Modifiez le filtre.</span></div>`;return;
  }
  const bcls={en_cours:'badge-en_cours',termine:'badge-termine',anomalie:'badge-anomalie',manquant:'badge-manquant'};
  const btxt={en_cours:'En cours',termine:'Terminé',anomalie:'Anomalie',manquant:'Départ manquant'};
  el.innerHTML=rows.map(row=>{
    const dur=_regDuree(row.arrivee,row.depart);
    const isAlert=row.status==='manquant'||row.status==='anomalie';
    const rowCls=row.status==='manquant'?'row-manquant':row.status==='anomalie'?'row-anomalie':'';
    const zIco=_regZoneLoc(row.zone_id)?.icone||'qr';
    return `<div class="reg-row ${rowCls}" onclick="openPassageDetail('${row.id}')">
      <div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="reg-presta-dot" style="background:${_esc(row.prestataire_couleur)||'#888'}"></span>
          <span class="reg-presta-name">${_esc(row.prestataire_nom)||'—'}</span>
        </div>
        <div class="reg-mission-tag">${_esc(row.mission_label)||'—'}</div>
      </div>
      <div class="reg-zone-badge">${_ico(zIco,13)} ${_esc(row.zone_nom)||'—'}</div>
      <div class="reg-time-cell">${_regFmt(row.arrivee)}</div>
      <div class="reg-time-cell">${row.depart?_regFmt(row.depart):'—'}</div>
      <div class="reg-dur-cell">
        ${dur?dur:row.status==='en_cours'?`<span class="reg-dur-live">+${_regSince(row.arrivee)}</span>`:'—'}
        ${row.valide_par?`<span class="reg-badge badge-valide">${_ico('check',10)} Validé</span>`:''}
      </div>
      <div style="text-align:right"><span class="reg-badge ${bcls[row.status]||'badge-termine'}"><span class="bdot"></span>${btxt[row.status]||row.status}</span></div>
      <div class="reg-actions-cell">
        ${isAlert
          ?`<button class="reg-btn-icon" title="Valider" onclick="event.stopPropagation();openValidationManuelle('${row.id}')" style="color:#EF4444;border-color:rgba(239,68,68,.25)">${_ico('check',15)}</button>`
          :`<button class="reg-btn-icon" onclick="event.stopPropagation();openPassageDetail('${row.id}')">${_ico('doc',15)}</button>`}
      </div>
    </div>`;
  }).join('');
}

// ── DÉTAIL PASSAGE ────────────────────────────────────────────────────────────
function openPassageDetail(id) {
  const row=_regPassages.find(p=>p.id===id); if(!row)return;
  const dur=_regDuree(row.arrivee,row.depart);
  const isAlert=row.status==='manquant'||row.status==='anomalie';
  const body=`<div style="display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-1);border-radius:12px;border:1px solid var(--border)">
      <div style="width:44px;height:44px;border-radius:12px;background:${_esc(row.prestataire_couleur)||'#888'};display:flex;align-items:center;justify-content:center;font-weight:900;color:white;font-size:16px">${(_esc(row.prestataire_nom)||'?').substring(0,2).toUpperCase()}</div>
      <div><div style="font-size:16px;font-weight:800;color:var(--text-1)">${_esc(row.prestataire_nom)||'—'}</div><div style="font-size:12px;color:var(--text-3);font-weight:600">${_esc(row.mission_label)||'—'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px">Zone</div><div style="font-size:14px;font-weight:700;color:var(--text-1)">${_esc(row.zone_nom)||'—'}</div></div>
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px">Date</div><div style="font-size:14px;font-weight:700;color:var(--text-1);text-transform:capitalize">${_regFmtDate(row.arrivee)}</div></div>
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px">Arrivée</div><div style="font-size:20px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums">${_regFmt(row.arrivee)}</div></div>
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px">Départ</div><div style="font-size:20px;font-weight:900;color:${row.depart?'var(--text-1)':'#EF4444'};font-variant-numeric:tabular-nums">${row.depart?_regFmt(row.depart):'Non scanné'}</div></div>
    </div>
    ${dur?`<div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)">Durée totale</div><div style="font-size:28px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums;margin-top:4px">${dur}</div></div>`:''}
    ${row.note?`<div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2);font-weight:600">${_esc(row.note)}</div>`:''}
    ${row.valide_par_email?`<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--green);font-weight:700">${_ico('check',13)} Validé par ${_esc(row.valide_par_email)}</div>`:''}
  </div>`;
  _modal('Détail du passage',body,isAlert?'Valider manuellement':null,isAlert?()=>openValidationManuelle(id):null);
}

// ── VALIDATION MANUELLE ───────────────────────────────────────────────────────
function openValidationManuelle(id) {
  document.getElementById('reg-modal')?.remove();
  const row=_regPassages.find(p=>p.id===id); if(!row)return;
  const now=new Date(),hhmm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const body=`
    <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);font-size:13px;font-weight:700;color:#EF4444;display:flex;align-items:center;gap:8px">
      ${_ico('warn',15)} ${row.status==='manquant'?'Départ non scanné':'Anomalie détectée'} — ${_esc(row.prestataire_nom)||'?'}
    </div>
    <div class="frm-row"><label class="frm-label">Heure d'arrivée (confirmée)</label><input type="time" class="frm-input" id="vm-arr" value="${_regFmt(row.arrivee)}"></div>
    <div class="frm-row"><label class="frm-label">Heure de départ</label><input type="time" class="frm-input" id="vm-dep" value="${row.depart?_regFmt(row.depart):hhmm}"></div>
    <div class="frm-row"><label class="frm-label">Motif</label>
      <select class="frm-input frm-select" id="vm-motif">
        <option value="oubli_scan">Oubli de scan au départ</option>
        <option value="probleme_tel">Problème téléphone / réseau</option>
        <option value="acces_restreint">Accès zone restreint</option>
        <option value="intervention_urgente">Intervention urgente</option>
        <option value="autre">Autre</option>
      </select>
    </div>
    <div class="frm-row"><label class="frm-label">Observations</label><textarea class="frm-input frm-textarea" id="vm-note" placeholder="Ex : Le prestataire a signalé un problème de réseau…"></textarea></div>
    <div style="font-size:11px;color:var(--text-3);font-weight:600;padding:10px 12px;background:var(--bg-1);border-radius:8px;border:1px solid var(--border)">${_ico('user',12)} La validation sera enregistrée sous votre nom.</div>`;
  _modal('Validation manuelle — Membre CS',body,'Valider & enregistrer',async()=>{
    const btn=document.getElementById('reg-modal-confirm');
    if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    try {
      await dbValiderPassage(id,{
        heure_arrivee:document.getElementById('vm-arr')?.value,
        heure_depart: document.getElementById('vm-dep')?.value,
        motif:        document.getElementById('vm-motif')?.value,
        note:         document.getElementById('vm-note')?.value,
      });
      if(typeof toast==='function')toast('Passage validé manuellement','ok');
      _regPassages=await dbGetPassages(_coproId());
      _renderAlerts();_renderStats();_renderHistoriqueRows();
    } catch(err){
      if(typeof toast==='function')toast('Erreur : '+err.message,'error');
      if(btn){btn.disabled=false;btn.textContent='Valider & enregistrer';}
      return false;
    }
  });
}

// ── PRESTATAIRES ──────────────────────────────────────────────────────────────
function _renderPrestataires() {
  const el=document.getElementById('reg-tab-prestataires'); if(!el)return;
  const addBtn=`<div style="display:flex;justify-content:flex-end;margin-bottom:18px"><button class="reg-btn reg-btn-primary" onclick="openEditPresta(null)">${_ico('plus')} Ajouter un prestataire</button></div>`;
  
  if(!_regPrestas.length){
    el.innerHTML=addBtn+`<div class="reg-empty">${_ico('user',40)}<p>Aucun prestataire</p></div>`;return;
  }
  
  el.innerHTML=addBtn+`<div class="reg-prestas-grid">${_regPrestas.map(p=>`
    <div class="presta-card" style="display:flex;flex-direction:column;max-height:580px;">
      <div class="presta-card-top" style="flex:1;display:flex;flex-direction:column;overflow:hidden;padding-bottom:0;">
        <div class="presta-card-header" style="margin-bottom:14px">
          <div class="presta-ava" style="background:${_esc(p.couleur)};box-shadow:0 6px 16px ${_esc(p.couleur)}44">${_esc(p.nom).substring(0,2).toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div class="presta-nom">${_esc(p.nom)}</div>
            <div class="presta-contrat" style="color:var(--text-3);font-size:11.5px;font-weight:600">
              ${p.siret ? 'SIRET: '+_esc(p.siret) : 'Prestataire'} ${p.contrat_debut ? ` · Contrat: ${p.contrat_debut}` : ''}
            </div>
          </div>
          <button class="reg-btn-icon" onclick="openEditPresta('${p.id}')">${_ico('edit',15)}</button>
        </div>

        ${(p.telephone || p.email) ? `
        <div class="presta-contact-badges">
          ${p.telephone ? `<a href="tel:${_esc(p.telephone).replace(/\s/g,'')}" class="presta-c-badge">${_ico('phone',12)} ${_esc(p.telephone)}</a>` : ''}
          ${p.email ? `<a href="mailto:${_esc(p.email)}" class="presta-c-badge">${_ico('mail',12)} Email</a>` : ''}
        </div>` : ''}

        <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-3);margin-bottom:8px;">
          Missions (${p.missions?.length || 0})
        </div>
        
        <div class="presta-missions-scroll" style="flex:1;">
          ${(p.missions||[]).map(m=>{
            const znArray = (m.zones||[]).map(zid => {
               const zObj = _regZoneLoc(zid);
               return zObj ? `<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg-2);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;color:var(--text-2);border:1px solid var(--border)">${_ico(zObj.icone, 10)} ${_esc(zObj.nom)}</span>` : '';
            }).filter(Boolean);
            
            const znHtml = znArray.length 
                ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;margin-bottom:4px">${znArray.join('')}</div>` 
                : '<div style="font-size:10px;color:var(--text-3);margin-top:4px;margin-bottom:4px">Aucune zone assignée</div>';

            return `
            <div style="padding:10px 12px;background:var(--bg-1);border-radius:10px;border:1px solid var(--border);display:flex;flex-direction:column;gap:2px;flex-shrink:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <div style="font-size:12px;font-weight:800;color:var(--text-1);line-height:1.3">${_esc(m.label)}</div>
                <span style="font-size:10px;font-weight:800;color:var(--primary);background:rgba(var(--primary-rgb),.1);padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;">${_esc(m.frequence)}</span>
              </div>
              ${znHtml}
              <div style="font-size:11px;font-weight:600;color:var(--text-3);display:flex;align-items:center;gap:4px;margin-top:2px">
                ${_ico('clock', 11)} ${m.horaire_debut||'?'} – ${m.horaire_fin||'?'}
              </div>
            </div>`;
          }).join('')||'<div style="font-size:12px;color:var(--text-3);padding:12px;text-align:center;background:var(--bg-1);border-radius:10px;border:1px dashed var(--border)">Aucune mission enregistrée</div>'}
        </div>

      </div>
      <div class="presta-card-footer" style="margin-top:0;">
        <button class="reg-btn reg-btn-secondary reg-btn-sm" style="flex:1" onclick="openHistoriquePresta('${p.id}')">${_ico('doc',13)} Historique</button>
        <button class="reg-btn reg-btn-sm" style="flex:1;background:${_esc(p.couleur)};color:white;border-color:${_esc(p.couleur)}" onclick="openPointageManuel('${p.id}')">${_ico('clock',13)} Badger</button>
      </div>
    </div>`).join('')}</div>`;
}

function openEditPresta(id) {
  const p=id?_regPrestas.find(x=>x.id===id):null,isNew=!p;
  const body=`<div>
    <div class="frm-section">Informations générales</div>
    <div class="frm-row"><label class="frm-label">Nom *</label><input class="frm-input" id="ep-nom" placeholder="Ex: NettoyagePlus" value="${_esc(p?.nom||'')}"></div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Téléphone</label><input class="frm-input" id="ep-tel" placeholder="01 23 45 67 89" value="${_esc(p?.telephone||'')}"></div>
      <div class="frm-row"><label class="frm-label">Email</label><input class="frm-input" id="ep-mail" type="email" placeholder="contact@société.fr" value="${_esc(p?.email||'')}"></div>
    </div>
    <div class="frm-row"><label class="frm-label">Adresse</label><input class="frm-input" id="ep-adresse" value="${_esc(p?.adresse||'')}"></div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">SIRET</label><input class="frm-input" id="ep-siret" value="${_esc(p?.siret||'')}"></div>
      <div class="frm-row"><label class="frm-label">Couleur</label><input class="frm-input" id="ep-couleur" type="color" value="${_esc(p?.couleur||'#3B82F6')}" style="height:42px;padding:4px"></div>
    </div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Début contrat</label><input class="frm-input" id="ep-cdebut" type="date" value="${p?.contrat_debut||''}"></div>
      <div class="frm-row"><label class="frm-label">Fin contrat</label><input class="frm-input" id="ep-cfin" type="date" value="${p?.contrat_fin||''}"></div>
    </div>
    <div class="frm-section" style="margin-top:8px">Missions</div>
    <div id="ep-missions-list">${(p?.missions||[]).map((m,i)=>_mBlock(m,i)).join('')}</div>
    <button class="frm-add-mission" onclick="addMissionBlock()">${_ico('plus',14)} Ajouter une mission</button>
    <div class="frm-section" style="margin-top:16px">Notes internes</div>
    <div class="frm-row"><label class="frm-label">Observations</label><textarea class="frm-input frm-textarea" id="ep-notes" placeholder="Contact urgent, numéro contrat…">${_esc(p?.notes||'')}</textarea></div>
  </div>`;
  
  _modal(isNew?'Nouveau prestataire':`Modifier — ${_esc(p.nom)}`,body,isNew?'Créer':'Enregistrer',async()=>{
    const nom=document.getElementById('ep-nom')?.value?.trim();
    if(!nom){alert('Le nom est requis.');return false;}
    const btn=document.getElementById('reg-modal-confirm');
    if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    
    const missions = Array.from(document.querySelectorAll('.frm-mission-block')).map(block => {
      return {
        label: block.querySelector('.mission-label')?.value || '',
        zones: Array.from(block.querySelectorAll('.mission-zone-cb:checked')).map(cb => cb.value),
        frequence: block.querySelector('.mission-freq')?.value || 'Sur appel',
        horaire_debut: block.querySelector('.mission-debut')?.value || null,
        horaire_fin: block.querySelector('.mission-fin')?.value || null
      };
    }).filter(m => m.label);

    try{
      await dbUpsertPrestataire(_coproId(),{id:id||undefined,nom,couleur:document.getElementById('ep-couleur')?.value||'#3B82F6',telephone:document.getElementById('ep-tel')?.value||'',email:document.getElementById('ep-mail')?.value||'',adresse:document.getElementById('ep-adresse')?.value||'',siret:document.getElementById('ep-siret')?.value||'',contrat_debut:document.getElementById('ep-cdebut')?.value||null,contrat_fin:document.getElementById('ep-cfin')?.value||null,notes:document.getElementById('ep-notes')?.value||'',missions});
      if(typeof toast==='function')toast(isNew?`${nom} ajouté`:`${nom} mis à jour`,'ok');
      _regPrestas=await dbGetPrestataires(_coproId());
      _renderPrestataires();
    }catch(err){
      if(typeof toast==='function')toast('Erreur : '+err.message,'error');
      if(btn){btn.disabled=false;btn.textContent=isNew?'Créer':'Enregistrer';}
      return false;
    }
  },{wide:true});
}

function _mBlock(m,i) {
  const zo = _regZones.map(z => `
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-1);cursor:pointer;padding:6px 8px;border-radius:6px;transition:background 0.15s;" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='transparent'">
      <input type="checkbox" value="${z.id}" class="mission-zone-cb" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;margin:0;" ${(m?.zones||[]).includes(z.id)?'checked':''}>
      ${_esc(z.nom)}
    </label>
  `).join('');

  return `<div class="frm-mission-block" id="mb-${i}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:12px;font-weight:800;color:var(--text-3)">Mission ${i+1}</span>
      <button type="button" class="reg-btn reg-btn-ghost reg-btn-sm" style="color:#EF4444" onclick="document.getElementById('mb-${i}').remove()">${_ico('trash2',12)}</button>
    </div>
    <div class="frm-row"><label class="frm-label">Intitulé *</label><input class="frm-input mission-label" placeholder="Ex: Ménage des communs" value="${_esc(m?.label||'')}"></div>
    
    <div class="frm-row">
      <label class="frm-label">Zone(s) assignée(s)</label>
      <div style="max-height:140px;overflow-y:auto;background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:6px;">
        ${zo || '<div style="font-size:13px;color:var(--text-3);padding:8px">Aucune zone QR créée.</div>'}
      </div>
    </div>

    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Fréquence</label><select class="frm-input frm-select mission-freq">${['Quotidien','2× / semaine','1× / semaine','2× / mois','1× / mois','Sur appel'].map(f=>`<option ${m?.frequence===f?'selected':''}>${f}</option>`).join('')}</select></div>
      <div></div>
    </div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Heure début</label><input type="time" class="frm-input mission-debut" value="${m?.horaire_debut||'08:00'}"></div>
      <div class="frm-row"><label class="frm-label">Heure fin</label><input type="time" class="frm-input mission-fin" value="${m?.horaire_fin||'10:00'}"></div>
    </div>
  </div>`;
}

function addMissionBlock() {
  const list=document.getElementById('ep-missions-list'); if(!list)return;
  const div=document.createElement('div');div.innerHTML=_mBlock(null,_missionCounter++);list.appendChild(div.firstElementChild);
}

async function openHistoriquePresta(id) {
  const p=_regPrestas.find(x=>x.id===id); if(!p)return;
  _modal(`Historique — ${_esc(p.nom)}`,`<div class="reg-empty">${_ico('spin',28)}<p>Chargement…</p></div>`,null,null);
  try{
    const rows=await dbGetPassages(_coproId(),{limit:50,prestataire_id:id});
    const body=rows.length?`<div style="display:flex;flex-direction:column;gap:8px">${rows.map(row=>{
      const dur=_regDuree(row.arrivee,row.depart);
      const bc={en_cours:'badge-en_cours',termine:'badge-termine',anomalie:'badge-anomalie',manquant:'badge-manquant'};
      const bt={en_cours:'En cours',termine:'OK',anomalie:'Anomalie',manquant:'Manquant'};
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--bg-1);border-radius:10px;border:1px solid var(--border)">
        <div><div style="font-size:13px;font-weight:700;color:var(--text-1);text-transform:capitalize">${_regFmtDate(row.arrivee)}</div><div style="font-size:11px;color:var(--text-3);margin-top:2px">${_esc(row.zone_nom)||'—'} · ${_regFmt(row.arrivee)} → ${row.depart?_regFmt(row.depart):'?'}</div></div>
        <div style="display:flex;align-items:center;gap:10px">${dur?`<span style="font-size:15px;font-weight:900;color:var(--text-1)">${dur}</span>`:''}<span class="reg-badge ${bc[row.status]||'badge-termine'}"><span class="bdot"></span>${bt[row.status]||row.status}</span></div>
      </div>`;
    }).join('')}</div>`:`<div class="reg-empty">${_ico('doc',36)}<p>Aucun passage</p></div>`;
    const bodyEl=document.querySelector('#reg-modal .mb'); if(bodyEl)bodyEl.innerHTML=body;
  }catch(err){
    const bodyEl=document.querySelector('#reg-modal .mb'); if(bodyEl)bodyEl.innerHTML=`<div class="reg-empty">${_ico('warn',36)}<p>Erreur : ${_esc(err.message)}</p></div>`;
  }
}

// ── ZONES QR PRO MAX ──────────────────────────────────────────────────────────

function _renderZones() {
  const el=document.getElementById('reg-tab-zones'); if(!el)return;
  
  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:14px">
      <div style="position:relative;flex:1;min-width:250px;max-width:380px">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-3)">${_ico('search', 16)}</span>
        <input type="text" placeholder="Rechercher une zone..." onkeyup="filterZones(this.value)" 
          style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 14px 10px 38px;font-size:14px;color:var(--text-1);outline:none;transition:all 0.2s;box-sizing:border-box;font-family:var(--font-body);"
          onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),.1)'"
          onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
      </div>
      <button class="reg-btn reg-btn-primary" onclick="openAjouterZone()">${_ico('plus')} Nouvelle zone</button>
    </div>
  `;

  if(!_regZones.length){
    el.innerHTML = headerHtml + `<div class="reg-empty">${_ico('qr',44)}<p>Aucune zone QR configurée</p><span>Créez une zone pour générer un QR Code d'intervention.</span></div>`;
    return;
  }

  const cardsHtml = _regZones.map(z => {
    const zonePassages = _regPassages.filter(p=>p.zone_id===z.id);
    const dp = zonePassages.sort((a,b)=>new Date(b.arrivee)-new Date(a.arrivee))[0];
    const passCount = zonePassages.length;
    
    const dpDate = dp ? new Date(dp.arrivee) : null;
    const isToday = dpDate && dpDate.toDateString() === new Date().toDateString();

    return `
    <div class="zone-card" data-nom="${_esc(z.nom).toLowerCase()}" style="position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:200px;padding:22px;">
      
      <button type="button" onclick="openEditZone('${z.id}')" title="Modifier la zone" style="position:absolute;top:16px;right:16px;background:var(--bg-1);border:1px solid var(--border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-2);transition:all 0.15s" onmouseover="this.style.color='var(--text-1)';this.style.borderColor='var(--border-strong)'" onmouseout="this.style.color='var(--text-2)';this.style.borderColor='var(--border)'">
        ${_ico('edit', 14)}
      </button>
      
      <div style="flex:1">
        <div style="width:48px;height:48px;border-radius:14px;background:rgba(var(--primary-rgb),.08);color:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:16px;border:1px solid rgba(var(--primary-rgb),.15)">
          ${_ico(z.icone, 22)}
        </div>
        
        <div class="zone-name" style="font-size:17px;margin-bottom:6px;line-height:1.2;padding-right:24px;">${_esc(z.nom)}</div>
        <div style="font-family:monospace;font-size:10px;color:var(--text-3);background:var(--bg-2);padding:3px 8px;border-radius:6px;border:1px solid var(--border);display:inline-flex;align-items:center;gap:4px;margin-bottom:16px">
          ${_ico('qr', 10)} ${_esc(z.qr_token).slice(-8)}
        </div>
        
        <div style="display:flex;flex-direction:column;gap:8px;padding-top:14px;border-top:1px dashed var(--border);margin-bottom:20px">
          <div style="font-size:12px;font-weight:600;color:var(--text-2);display:flex;align-items:center;justify-content:space-between">
            <span>Passages enregistrés</span>
            <span style="color:var(--text-1);font-weight:800;background:var(--bg-1);padding:2px 6px;border-radius:6px;border:1px solid var(--border)">${passCount}</span>
          </div>
          <div style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:6px;font-weight:500">
            ${dp 
              ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isToday?'var(--green)':'var(--text-3)'};box-shadow:0 0 6px ${isToday?'var(--green)':'transparent'}"></span> Dernier : ${_regFmtDate(dp.arrivee)} à ${_regFmt(dp.arrivee)}` 
              : `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--border)"></span> Aucun passage`
            }
          </div>
        </div>
      </div>
      
      <button class="reg-btn" style="width:100%;justify-content:center;background:var(--text-1);color:var(--bg-1);border:none;padding:12px;font-size:13px;border-radius:12px;transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 12px rgba(0,0,0,0.1);" onmouseover="this.style.opacity='0.9';this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.opacity='1';this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onclick="openQrZone('${z.id}')">
        ${_ico('print', 15)} Afficher & Imprimer QR
      </button>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-bottom:24px;padding:14px 18px;background:rgba(34, 197, 94, 0.06);border:1px solid rgba(34, 197, 94, 0.25);border-radius:14px;font-size:13px;color:var(--text-2);line-height:1.5;display:flex;align-items:flex-start;gap:12px">
      <div style="color:var(--green);flex-shrink:0;margin-top:2px">${_ico('check', 18)}</div>
      <div>Chaque zone possède un QR Code unique. Les intervenants le scannent à l'<strong>arrivée</strong> et au <strong>départ</strong> avec leur téléphone. <strong>Aucun compte requis.</strong></div>
    </div>
    ${headerHtml}
    <div class="reg-zones-grid" id="reg-zones-grid-container">
      ${cardsHtml}
    </div>
  `;
}

function openQrZone(id) {
  const z = _regZones.find(x => x.id === id); 
  if (!z) return;
  
  const url = `${location.origin}/scan?zone=${z.qr_token}`;
  
  // Utilisation de l'API QR Code
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&margin=1`;
  
  // 🔥 FIX : Plus de mix-blend-mode. On force un fond blanc et un padding pour le Dark Mode.
  const imgHtml = `<img src="${qrApiUrl}" width="220" height="220" style="display:block;border-radius:8px;background:white;padding:10px;" alt="QR Code Zone" />`;

  // 🔥 FIX : On retire l'icône _ico('print') du bouton "Imprimer" pour éviter le bug d'échappement HTML
  _modal(`QR Code — ${_esc(z.nom)}`,
    `<div class="qr-modal-content">
      <div class="qr-zone-name" style="margin-bottom: 10px; font-size: 18px;">${_esc(z.nom)}</div>
      <div class="qr-frame" style="background:white;padding:10px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.06);display:flex;justify-content:center;align-items:center;">
        ${imgHtml}
      </div>
      <div class="qr-url" style="margin-top:16px;word-break:break-all;font-size:12px;">${_esc(url)}</div>
      <div class="qr-instructions" style="margin-top:12px;">Scannez à l'<strong>arrivée</strong> et au <strong>départ</strong>.<br>Aucun compte requis.</div>
    </div>`,
    `Imprimer`, // Texte simple pour le bouton
    () => {
      const pe = document.getElementById('reg-print-area'); 
      if (!pe) return;
      
      pe.style.display = 'flex';
      
      // Image grande résolution pour l'impression
      const printImgHtml = `<img src="${qrApiUrl}" width="340" height="340" style="display:block;" onload="window.print();document.getElementById('reg-print-area').style.display='none';" />`;
      
      // Mise en page A4 pour l'impression
      pe.innerHTML = `
        <div class="pt">Pointage Prestataires</div>
        <div class="ps">${_esc(z.nom)}<br><small style="font-weight:500;color:#9ca3af">Scannez à l'arrivée ET au départ</small></div>
        <div class="pqr" style="margin: 30px 0; padding: 24px; background: white; border: 3px dashed #cbd5e1; border-radius: 24px; display:flex; justify-content:center;">
          ${printImgHtml}
        </div>
        <div class="pu" style="font-family:monospace; background:#f3f4f6; padding:10px 20px; border-radius:10px; color:#4b5563; font-size:14px;">${_esc(url)}</div>
        <div class="pf" style="margin-top:40px; color:#9ca3af; font-weight:700;">Propulsé par CoproSync</div>
      `;
        
      // Sécurité anti-blocage
      setTimeout(() => { 
        if (pe.style.display === 'flex') {
          window.print(); 
          pe.style.display = 'none'; 
        }
      }, 2000);
    }
  );
}

function openAjouterZone(){_editZoneModal(null);}
function openEditZone(id){_editZoneModal(id);}
function _editZoneModal(id) {
  const z=id?_regZones.find(x=>x.id===id):null,isNew=!z;
  const icons=['trash','door','car','leaf','wrench','qr'];
  const body=`
    <div class="frm-row"><label class="frm-label">Nom *</label><input class="frm-input" id="ez-nom" placeholder="Ex: Local Poubelles — Bat. B" value="${_esc(z?.nom||'')}"></div>
    <div class="frm-row"><label class="frm-label">Icône</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="ez-ico-picker">
        ${icons.map(ico=>`<button type="button" class="reg-btn-icon" data-ico="${ico}" style="${(z?.icone||'trash')===ico?'background:var(--bg-1);border-color:var(--primary);':''}" onclick="document.querySelectorAll('#ez-ico-picker button').forEach(b=>{b.style.background='';b.style.borderColor=''});this.style.background='var(--bg-1)';this.style.borderColor='var(--primary)';document.getElementById('ez-ico').value='${ico}'">${_ico(ico,18)}</button>`).join('')}
        <input type="hidden" id="ez-ico" value="${_esc(z?.icone||'trash')}">
      </div>
    </div>`;
  _modal(isNew?'Nouvelle zone QR':`Modifier — ${_esc(z.nom)}`,body,isNew?'Créer la zone':'Enregistrer',async()=>{
    const nom=document.getElementById('ez-nom')?.value?.trim(),ico=document.getElementById('ez-ico')?.value||'trash';
    if(!nom){alert('Le nom est requis.');return false;}
    const btn=document.getElementById('reg-modal-confirm');
    if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}
    try{
      if(isNew){await dbCreateZone(_coproId(),{nom,icone:ico});if(typeof toast==='function')toast(`Zone "${nom}" créée`,'ok');}
      else{await dbUpdateZone(id,{nom,icone:ico});if(typeof toast==='function')toast('Zone mise à jour','ok');}
      _regZones=await dbGetZones(_coproId());
      _renderZones();
    }catch(err){
      if(typeof toast==='function')toast('Erreur : '+err.message,'error');
      if(btn){btn.disabled=false;btn.textContent=isNew?'Créer la zone':'Enregistrer';}
      return false;
    }
  });
}

function openPointageManuel(preselectId=null) {
  const pOpts = `<option value="" disabled ${!preselectId?'selected':''}>-- Sélectionner un prestataire --</option>` +
    _regPrestas.map(p=>`<option value="${p.id}" ${p.id===preselectId?'selected':''}>${_esc(p.nom)}</option>`).join('');
  
  const zOpts = `<option value="" disabled selected>-- Sélectionner une zone --</option>` +
    _regZones.map(z=>`<option value="${z.id}">${_esc(z.nom)}</option>`).join('');
  
  const now=new Date(),hhmm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,today=now.toISOString().slice(0,10);
  
  const body=`
    <div style="margin-bottom:18px;padding:12px 16px;background:rgba(var(--primary-rgb),.05);border:1px solid rgba(var(--primary-rgb),.15);border-radius:12px;font-size:13px;color:var(--text-2);line-height:1.5;">
      ${_ico('clock', 16)} <strong>Saisie de rattrapage</strong><br>Outil réservé au Conseil Syndical pour régulariser un oubli de scan ou une intervention exceptionnelle.
    </div>
    <div class="frm-row"><label class="frm-label">Prestataire *</label><select class="frm-input frm-select" id="pm-presta">${pOpts}</select></div>
    <div class="frm-row"><label class="frm-label">Zone d'intervention *</label><select class="frm-input frm-select" id="pm-zone">${zOpts}</select></div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Date *</label><input type="date" class="frm-input" id="pm-date" value="${today}"></div>
      <div></div>
    </div>
    <div class="frm-grid2">
      <div class="frm-row"><label class="frm-label">Heure Arrivée *</label><input type="time" class="frm-input" id="pm-arr" value="08:00"></div>
      <div class="frm-row"><label class="frm-label">Heure Départ *</label><input type="time" class="frm-input" id="pm-dep" value="${hhmm}"></div>
    </div>
    <div class="frm-row"><label class="frm-label">Nom intervenant</label><input class="frm-input" id="pm-nom" placeholder="Ex: Jean (facultatif)"></div>
    <div class="frm-row"><label class="frm-label">Observations</label><textarea class="frm-input frm-textarea" id="pm-note" placeholder="Ex: Intervention exceptionnelle suite à une fuite, oubli de scanner..."></textarea></div>`;
  
  _modal('Saisir un passage manuel',body,'Valider le pointage',async()=>{
    const prestaId = document.getElementById('pm-presta')?.value;
    const zoneId = document.getElementById('pm-zone')?.value;

    if(!prestaId || !zoneId) {
      alert('Veuillez sélectionner un prestataire et une zone.');
      return false;
    }

    const btn=document.getElementById('reg-modal-confirm');
    if(btn){btn.disabled=true;btn.textContent='Enregistrement…';}

    const date=document.getElementById('pm-date')?.value||today;
    const presta=_regPrestas.find(p=>p.id===prestaId);

    let missionId = null;
    if (presta && presta.missions) {
      const missionMatch = presta.missions.find(m => (m.zones || []).includes(zoneId));
      if (missionMatch) {
        missionId = missionMatch.id;
      } else if (presta.missions.length > 0) {
        missionId = presta.missions[0].id;
      }
    }

    try{
      await dbPointageManuel({
        copro_id:_coproId(),
        prestataire_id: prestaId,
        mission_id: missionId,
        zone_id: zoneId,
        arrivee:`${date}T${document.getElementById('pm-arr')?.value}:00`,
        depart:`${date}T${document.getElementById('pm-dep')?.value}:00`,
        nom_intervenant:document.getElementById('pm-nom')?.value||'',
        note:document.getElementById('pm-note')?.value||''
      });
      
      if(typeof toast==='function')toast('Pointage manuel enregistré','ok');
      _regPassages=await dbGetPassages(_coproId());
      _renderAlerts();_renderStats();_renderHistoriqueRows();
    }catch(err){
      if(typeof toast==='function')toast('Erreur : '+err.message,'error');
      if(btn){btn.disabled=false;btn.textContent='Valider le pointage';}
      return false;
    }
  });

  const pSel = document.getElementById('pm-presta');
  const zSel = document.getElementById('pm-zone');
  
  if(pSel && zSel) {
    pSel.addEventListener('change', () => {
      const p = _regPrestas.find(x => x.id === pSel.value);
      if(!p) return;
      
      const linkedZoneIds = new Set();
      (p.missions || []).forEach(m => (m.zones || []).forEach(zId => linkedZoneIds.add(zId)));

      Array.from(zSel.options).forEach(opt => {
        if(opt.value === "") return;
        if(linkedZoneIds.has(opt.value)) {
          opt.textContent = `★ ${_regZoneLoc(opt.value)?.nom}`;
          opt.style.fontWeight = 'bold';
        } else {
          opt.textContent = _regZoneLoc(opt.value)?.nom;
          opt.style.fontWeight = 'normal';
        }
      });
    });
    if(preselectId) pSel.dispatchEvent(new Event('change'));
  }
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function _modal(title,bodyHtml,btnText,onConfirm,opts={}) {
  document.getElementById('reg-modal')?.remove();
  const ov=document.createElement('div');
  ov.id='reg-modal';ov.className='overlay open';
  ov.innerHTML=`<div class="modal" style="max-width:${opts.wide?640:520}px;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh">
    <div style="padding:22px 26px;border-bottom:1px solid var(--border);background:var(--bg-1);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <span style="font-size:18px;font-weight:900;color:var(--text-1);letter-spacing:-.4px">${_esc(title)}</span>
      <button type="button" style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-2)" onclick="document.getElementById('reg-modal').remove()">${_ico('close',14)}</button>
    </div>
    <div class="mb" style="padding:24px 26px;overflow-y:auto;flex:1">${bodyHtml}</div>
    ${btnText?`<div style="padding:18px 26px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:var(--bg-1)"><button type="button" class="reg-btn reg-btn-ghost" onclick="document.getElementById('reg-modal').remove()">Annuler</button><button type="button" class="reg-btn reg-btn-primary" id="reg-modal-confirm">${_esc(btnText)}</button></div>`:`<div style="padding:18px 26px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;flex-shrink:0"><button type="button" class="reg-btn reg-btn-secondary" onclick="document.getElementById('reg-modal').remove()">Fermer</button></div>`}
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  if(btnText&&onConfirm){
    document.getElementById('reg-modal-confirm').addEventListener('click',()=>{
      const r=onConfirm();
      if(r instanceof Promise){r.then(res=>{if(res!==false)ov.remove();});}
      else if(r!==false){ov.remove();}
    });
  }
}

// ── PAGE SCAN PUBLIQUE ────────────────────────────────────────────────────────
async function renderScanPage(token) {
  const page = document.getElementById('page'); if (!page) return;
  
  // Verrouillage des menus pour le prestataire
  const styleLock = document.createElement('style');
  styleLock.innerHTML = `#bottom-nav, #sidebar, #topbar, .main-nav { display: none !important; } body { padding: 0 !important; background: #f9fafb !important; }`;
  document.head.appendChild(styleLock);

  page.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">${_ico('spin', 32)}</div>`;

  try {
    // 🎯 LA CORRECTION : On demande explicitement les passages avec le status 'en_cours'
    const { data: zone, error } = await sb
      .from('zones')
      .select(`
        *,
        prestataires ( nom, couleur ),
        passages ( id, status, arrivee )
      `)
      .eq('qr_token', token)
      .eq('passages.status', 'en_cours') // On ne veut savoir que s'il y en a un ouvert
      .single();

    if (error || !zone) throw new Error("Zone introuvable ou QR code invalide");

    const prestataire = zone.prestataires || { nom: 'Prestataire', couleur: '#6b7280' };
    
    // On vérifie s'il y a vraiment une mission ouverte
    const existing = (zone.passages && zone.passages.length > 0) ? zone.passages[0] : null;
    
    const type = existing ? 'depart' : 'arrivee';
    const color = type === 'arrivee' ? '#22C55E' : '#EF4444';
    const label = type === 'arrivee' ? 'Enregistrer mon arrivée' : 'Enregistrer mon départ';

    page.innerHTML = `
      <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; font-family:sans-serif;">
        <div style="background:white; border-radius:28px; padding:40px 30px; max-width:400px; width:100%; box-shadow:0 20px 50px rgba(0,0,0,0.05); text-align:center;">
          
          <div style="display:inline-flex; align-items:center; gap:8px; background:${prestataire.couleur}10; color:${prestataire.couleur}; padding:6px 14px; border-radius:100px; font-size:12px; font-weight:800; margin-bottom:20px;">
            ${prestataire.nom.toUpperCase()}
          </div>

          <div style="width:72px; height:72px; border-radius:22px; background:${color}10; margin:0 auto 24px; display:flex; align-items:center; justify-content:center; color:${color}">
            ${_ico(zone.icone || 'qr', 32)}
          </div>

          <h1 style="font-size:24px; font-weight:900; color:#1e293b; margin:0;">${_esc(zone.nom)}</h1>
          <p style="font-size:15px; color:#64748b; margin:10px 0 30px;">
            ${type === 'arrivee' ? 'Prêt pour votre mission ?' : `📍 En cours · arrivée à ${_regFmt(existing.arrivee)}`}
          </p>

          ${type === 'arrivee' ? `
            <div style="margin-bottom:24px; text-align:left;">
              <label style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:8px; display:block;">Votre Prénom</label>
              <input id="scan-nom" type="text" style="width:100%; background:#f8fafc; border:2px solid #e2e8f0; border-radius:16px; padding:16px; font-size:16px; font-weight:600; outline:none; box-sizing:border-box;" placeholder="Ex: Suzet">
            </div>
          ` : `<input id="scan-nom" type="hidden" value="Suzet">`}

          <button id="scan-btn" onclick="_handleScan('${zone.id}', '${type}', '${zone.copro_id}')"
            style="width:100%; padding:20px; background:${color}; color:white; border:none; border-radius:18px; font-size:17px; font-weight:800; cursor:pointer; box-shadow:0 10px 20px ${color}30;">
            ${label}
          </button>

          <p style="margin-top:24px; font-size:12px; color:#cbd5e1;">CoproSync · Mode Pointage</p>
        </div>
      </div>
    `;
  } catch (e) {
    page.innerHTML = `<div style="padding:40px; text-align:center;"><h2>Erreur</h2><p>${e.message}</p></div>`;
  }
}
async function _handleScan(zoneId, type, coproId) {
  const nomIntervenant = document.getElementById('scan-nom')?.value || 'Anonyme';
  const btn = document.getElementById('scan-btn');
  const page = document.getElementById('page'); // Pour l'affichage du succès final
  const oldText = btn.innerText;
  
  // Mise en chargement du bouton
  btn.innerText = "Enregistrement...";
  btn.disabled = true;

  try {
    // 1. Récupération du prestataire lié à la zone
    const { data: zoneData, error: zoneErr } = await sb
      .from('zones')
      .select('prestataire_id')
      .eq('id', zoneId)
      .single();

    if (zoneErr || !zoneData?.prestataire_id) {
      throw new Error("Cette zone n'est pas configurée pour un prestataire spécifique.");
    }

    if (type === 'arrivee') {
      // 🟢 ACTION : ARRIVÉE
      // On crée une nouvelle ligne avec le statut 'en_cours'
      const { error: insErr } = await sb.from('passages').insert({
        zone_id: zoneId,
        copro_id: coproId,
        prestataire_id: zoneData.prestataire_id,
        nom_intervenant: nomIntervenant,
        arrivee: new Date().toISOString(),
        status: 'en_cours'
      });

      if (insErr) throw insErr;

      // Feedback et recharge pour afficher le bouton "Départ"
      alert("✅ Arrivée enregistrée. Bon courage !");
      window.location.reload();

    } else {
      // 🔴 ACTION : DÉPART
      // On met à jour la ligne 'en_cours' pour cette zone
      const { error: updErr } = await sb.from('passages')
        .update({ 
          depart: new Date().toISOString(), 
          status: 'termine' 
        })
        .eq('zone_id', zoneId)
        .eq('status', 'en_cours'); // Sécurité : on ne ferme que ce qui est ouvert

      if (updErr) throw updErr;

      // 🎯 LE KICK : Écran de succès final (on vide la page)
      page.innerHTML = `
        <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; text-align:center; background:#f9fafb; font-family:sans-serif;">
          <div style="width:80px; height:80px; background:#22C55E; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; margin-bottom:24px; box-shadow:0 15px 30px rgba(34,197,94,0.25);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style="font-size:26px; font-weight:900; color:#1e293b; margin:0 0 10px;">Mission terminée !</h1>
          <p style="font-size:16px; color:#64748b; line-height:1.5; margin-bottom:30px;">
            Merci ${_esc(nomIntervenant)},<br>votre passage a bien été enregistré.
          </p>
          <button onclick="window.close();" style="background:white; border:1px solid #e2e8f0; padding:12px 24px; border-radius:12px; font-weight:700; color:#475569; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            Fermer l'onglet
          </button>
          <div style="margin-top:40px; font-size:11px; color:#cbd5e1; font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">
            Propulsé par CoproSync
          </div>
        </div>
      `;
    }

  } catch (error) {
    console.error("Erreur Scan:", error);
    alert("❌ Erreur : " + error.message);
    btn.innerText = oldText;
    btn.disabled = false;
  }
}
