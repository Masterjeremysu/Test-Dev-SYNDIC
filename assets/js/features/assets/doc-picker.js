/* ═══════════════════════════════════════════════════════════════
   DOCUMENT PICKER — Browse bucket "documents" Supabase
   S'intègre dans la modale contrat (m-contrat)
   Dépendances : sb (Supabase client), toast()
═══════════════════════════════════════════════════════════════ */

(function injectPickerCSS() {
  if (document.getElementById('doc-picker-css')) return;
  const s = document.createElement('style');
  s.id = 'doc-picker-css';
  s.textContent = `
    /* ── Overlay picker ── */
    #doc-picker-overlay {
      display:none; position:fixed; inset:0; z-index:1100;
      background:rgba(0,0,0,.55); backdrop-filter:blur(3px);
      align-items:center; justify-content:center;
    }
    #doc-picker-overlay.open { display:flex; }

    #doc-picker-box {
      background:var(--surface,#fff); border-radius:16px;
      width:min(560px,95vw); max-height:80vh;
      display:flex; flex-direction:column;
      box-shadow:0 24px 60px rgba(0,0,0,.25);
      overflow:hidden;
    }

    /* Header */
    #doc-picker-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:18px 20px 14px; border-bottom:1px solid var(--border,#e2e8f0);
    }
    #doc-picker-header h3 { font-size:15px; font-weight:700; margin:0; }
    #doc-picker-close {
      background:none; border:none; cursor:pointer; font-size:20px;
      color:var(--text-3,#94a3b8); line-height:1; padding:2px 6px;
    }

    /* Breadcrumb */
    #doc-picker-breadcrumb {
      display:flex; align-items:center; gap:4px; flex-wrap:wrap;
      padding:10px 20px; font-size:12px; color:var(--text-2,#64748b);
      border-bottom:1px solid var(--border-light,#f1f5f9);
      background:var(--surface-2,#f8fafc);
    }
    .bc-item { cursor:pointer; color:var(--primary,#6366f1); font-weight:600; }
    .bc-item:hover { text-decoration:underline; }
    .bc-sep { color:var(--text-3,#94a3b8); }
    .bc-current { color:var(--text-2,#64748b); font-weight:500; }

    /* Search */
    #doc-picker-search-wrap { padding:10px 20px; border-bottom:1px solid var(--border-light,#f1f5f9); }
    #doc-picker-search {
      width:100%; padding:8px 12px; border:1px solid var(--border,#e2e8f0);
      border-radius:8px; font-size:13px; background:var(--surface,#fff);
      color:var(--text-1,#1a202c); outline:none; box-sizing:border-box;
    }
    #doc-picker-search:focus { border-color:var(--primary,#6366f1); }

    /* File list */
    #doc-picker-list {
      flex:1; overflow-y:auto; padding:8px 12px;
    }
    .dp-item {
      display:flex; align-items:center; gap:10px; padding:9px 10px;
      border-radius:8px; cursor:pointer; transition:background .15s;
      font-size:13px;
    }
    .dp-item:hover { background:var(--surface-2,#f1f5f9); }
    .dp-item.dp-folder { color:var(--text-1,#1a202c); font-weight:500; }
    .dp-item.dp-file   { color:var(--text-2,#64748b); }
    .dp-item.dp-file:hover { color:var(--text-1,#1a202c); }
    .dp-icon { font-size:18px; flex-shrink:0; }
    .dp-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dp-select-btn {
      font-size:11px; font-weight:700; color:var(--primary,#6366f1);
      background:rgba(99,102,241,.1); border:none; border-radius:6px;
      padding:3px 9px; cursor:pointer; opacity:0; transition:opacity .15s;
    }
    .dp-item:hover .dp-select-btn { opacity:1; }

    /* States */
    .dp-loading, .dp-empty {
      text-align:center; padding:40px 20px;
      color:var(--text-3,#94a3b8); font-size:13px;
    }
    .dp-loading { font-style:italic; }

    /* Footer */
    #doc-picker-footer {
      padding:12px 20px; border-top:1px solid var(--border,#e2e8f0);
      display:flex; align-items:center; justify-content:space-between; gap:10px;
    }
    #doc-picker-selected-name {
      font-size:12px; color:var(--text-2,#64748b);
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;
    }

    /* Trigger button dans la modale contrat */
    .doc-url-wrap { display:flex; gap:8px; align-items:center; }
    .doc-url-wrap input { flex:1; }
    #btn-browse-docs {
      white-space:nowrap; flex-shrink:0;
    }
    #doc-url-preview {
      margin-top:6px; font-size:11px; display:none;
      align-items:center; gap:6px; color:var(--text-2,#64748b);
    }
    #doc-url-preview a { color:var(--primary,#6366f1); text-decoration:none; font-weight:600; }
    #doc-url-preview a:hover { text-decoration:underline; }
  `;
  document.head.appendChild(s);
})();

/* ─── Injection du picker dans le DOM ────────────────────────── */
(function injectPickerDOM() {
  if (document.getElementById('doc-picker-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="doc-picker-overlay">
      <div id="doc-picker-box">
        <div id="doc-picker-header">
          <h3>📁 Choisir un document</h3>
          <button id="doc-picker-close" onclick="closePicker()">×</button>
        </div>
        <div id="doc-picker-breadcrumb"></div>
        <div id="doc-picker-search-wrap">
          <input id="doc-picker-search" type="search" placeholder="🔍 Filtrer les fichiers…" oninput="filterPickerList()">
        </div>
        <div id="doc-picker-list"></div>
        <div id="doc-picker-footer">
          <span id="doc-picker-selected-name">Aucun fichier sélectionné</span>
          <button class="btn btn-secondary btn-sm" onclick="closePicker()">Annuler</button>
        </div>
      </div>
    </div>
  `);
})();

/* ─── État interne ───────────────────────────────────────────── */
const _P = {
  bucket:      'documents',
  path:        [],          // dossiers traversés
  items:       [],          // liste brute courante
  filtered:    [],          // après recherche
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function _pickerPath() {
  return _P.path.join('/');
}

function _publicUrl(filePath) {
  const { data } = sb.storage.from(_P.bucket).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

function _fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext))                        return '📄';
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (['doc','docx'].includes(ext))                 return '📝';
  if (['xls','xlsx'].includes(ext))                 return '📊';
  if (['zip','rar','7z'].includes(ext))             return '🗜️';
  return '📎';
}

/* ─── Navigation & rendu ──────────────────────────────────────── */
async function _loadPickerDir(folder) {
  const list = document.getElementById('doc-picker-list');
  list.innerHTML = '<div class="dp-loading">Chargement…</div>';
  document.getElementById('doc-picker-search').value = '';

  const prefix = folder ? folder + '/' : '';
  const { data, error } = await sb.storage.from(_P.bucket).list(folder || '', {
    limit: 200, offset: 0, sortBy: { column: 'name', order: 'asc' }
  });

  if (error) {
    list.innerHTML = `<div class="dp-empty">❌ Erreur : ${error.message}</div>`;
    return;
  }

  _P.items = data || [];
  _P.filtered = [..._P.items];
  _renderPickerList();
  _renderBreadcrumb();
}

function _renderBreadcrumb() {
  const bc = document.getElementById('doc-picker-breadcrumb');
  const parts = [
    `<span class="bc-item" onclick="pickerGoRoot()">🗂 documents</span>`
  ];
  _P.path.forEach((seg, i) => {
    parts.push(`<span class="bc-sep">›</span>`);
    if (i < _P.path.length - 1) {
      parts.push(`<span class="bc-item" onclick="pickerGoTo(${i})">${seg}</span>`);
    } else {
      parts.push(`<span class="bc-current">${seg}</span>`);
    }
  });
  bc.innerHTML = parts.join('');
}

function _renderPickerList() {
  const list = document.getElementById('doc-picker-list');
  const items = _P.filtered;

  if (!items.length) {
    list.innerHTML = '<div class="dp-empty">📭 Dossier vide</div>';
    return;
  }

  // Séparer dossiers et fichiers
  const folders = items.filter(i => i.id === null);           // Supabase: dossiers ont id=null
  const files   = items.filter(i => i.id !== null && i.name !== '.emptyFolderPlaceholder');

  let html = '';

  folders.forEach(f => {
    html += `
      <div class="dp-item dp-folder" onclick="pickerEnter('${f.name}')">
        <span class="dp-icon">📁</span>
        <span class="dp-name">${f.name}</span>
        <span style="font-size:11px;color:var(--text-3);">›</span>
      </div>`;
  });

  files.forEach(f => {
    const fullPath = [..._P.path, f.name].join('/');
    const url      = _publicUrl(fullPath);
    html += `
      <div class="dp-item dp-file">
        <span class="dp-icon">${_fileIcon(f.name)}</span>
        <span class="dp-name" title="${f.name}">${f.name}</span>
        <button class="dp-select-btn" onclick="pickerSelect('${fullPath}','${f.name}','${url}')">
          Choisir
        </button>
      </div>`;
  });

  list.innerHTML = html || '<div class="dp-empty">📭 Aucun fichier</div>';
}

/* ─── API publique du picker ──────────────────────────────────── */
window.openDocPicker = function() {
  _P.path = [];
  document.getElementById('doc-picker-overlay').classList.add('open');
  _loadPickerDir('');
};

window.closePicker = function() {
  document.getElementById('doc-picker-overlay').classList.remove('open');
};

window.pickerGoRoot = function() {
  _P.path = [];
  _loadPickerDir('');
};

window.pickerGoTo = function(index) {
  _P.path = _P.path.slice(0, index + 1);
  _loadPickerDir(_pickerPath());
};

window.pickerEnter = function(folder) {
  _P.path.push(folder);
  _loadPickerDir(_pickerPath());
};

window.filterPickerList = function() {
  const q = document.getElementById('doc-picker-search').value.toLowerCase();
  _P.filtered = q ? _P.items.filter(i => i.name.toLowerCase().includes(q)) : [..._P.items];
  _renderPickerList();
};

/**
 * Sélection d'un fichier → remplit le champ c-doc-url dans la modale contrat
 */
window.pickerSelect = function(fullPath, name, url) {
  // Remplir le champ URL
  const input = document.getElementById('c-doc-url');
  if (input) input.value = url;

  // Afficher la preview
  const preview = document.getElementById('doc-url-preview');
  const previewLink = document.getElementById('doc-url-preview-link');
  if (preview && previewLink) {
    previewLink.href = url;
    previewLink.textContent = name;
    preview.style.display = 'flex';
  }

  // Feedback footer picker
  document.getElementById('doc-picker-selected-name').textContent = '✓ ' + name;

  closePicker();
  toast('Document lié : ' + name, 'ok');
};

/* Fermer en cliquant en dehors */
document.getElementById('doc-picker-overlay')?.addEventListener('click', function(e) {
  if (e.target === this) closePicker();
});
