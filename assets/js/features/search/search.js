// ════════════════════════════════════════════════════════════════
//  GLOBAL SEARCH (Omnibox / Spotlight)
//  assets/js/features/search/search.js
// ════════════════════════════════════════════════════════════════

let _searchDebounce = null;
let _searchSelectedIndex = -1; // Pour la navigation clavier

function openSearch() {
  if ($('search-overlay')) return;
  _searchSelectedIndex = -1;

  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'search-overlay';
  
  // Style Spotlight injecté
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
    z-index: 9999; display: flex; justify-content: center; align-items: flex-start;
    padding-top: 10vh; padding-inline: 16px;
    animation: fade-in 0.2s ease-out forwards;
  `;

  overlay.innerHTML = `
    <div class="search-box" style="
      background: var(--surface); width: 100%; max-width: 640px;
      border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      overflow: hidden; border: 1px solid var(--border);
      transform: translateY(-20px); opacity: 0;
      animation: slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    " onclick="event.stopPropagation()">
      
      <div class="search-input-wrap" style="
        display: flex; align-items: center; padding: 16px 20px;
        border-bottom: 1px solid var(--border); gap: 12px;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text-3); flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" id="search-input" 
          placeholder="Rechercher (Tickets, Annonces, Contacts...)" 
          autocomplete="off" spellcheck="false"
          style="border:none; background:transparent; font-size:18px; width:100%; color:var(--text-1); outline:none;" autofocus>
        <button class="btn btn-ghost btn-sm" onclick="closeSearch()" style="font-size:11px; padding:4px 8px; border:1px solid var(--border);">ESC</button>
      </div>

      <div class="search-results" id="search-results" style="max-height:60vh; overflow-y:auto; padding:8px 0;">
        <div class="search-empty" style="padding:32px 20px; text-align:center; color:var(--text-3); font-size:14px;">
          Commencez à taper pour rechercher…
        </div>
      </div>
      
      <div style="background:var(--bg-2); padding:8px 20px; font-size:11px; color:var(--text-3); display:flex; justify-content:space-between; border-top:1px solid var(--border);">
        <span>Utilisez les flèches ↑↓ pour naviguer</span>
        <span>Entrée pour valider</span>
      </div>
    </div>`;
    
  overlay.addEventListener('click', closeSearch);
  document.body.appendChild(overlay);
  
  // Keyframes temporaires
  if (!document.getElementById('search-keyframes')) {
    const style = document.createElement('style');
    style.id = 'search-keyframes';
    style.innerHTML = `
      @keyframes slide-down { to { transform: translateY(0); opacity: 1; } }
      .search-result-item:hover, .search-result-item.keyboard-selected { background: var(--bg-2); cursor: pointer; }
      .search-highlight { background: rgba(250, 204, 21, 0.3); color: inherit; font-weight: 700; border-radius: 2px; }
    `;
    document.head.appendChild(style);
  }

  // Focus différé (Fix mobile)
  setTimeout(() => {
    const input = $('search-input');
    if (input) { input.focus(); input.addEventListener('input', handleSearchInput); }
  }, 50);

  // Écoute clavier pour la navigation ↑↓
  document.addEventListener('keydown', handleKeyboardNav);
}

function closeSearch() {
  const overlay = $('search-overlay');
  if (overlay) {
    overlay.style.animation = 'fade-in 0.15s ease-in reverse forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  document.removeEventListener('keydown', handleKeyboardNav);
}

// ── HIGHLIGHTER (Met les mots-clés en surbrillance) ──
function highlightText(text, query) {
  if (!text || !query) return typeof escHtml === 'function' ? escHtml(text || '') : text;
  const safeText = typeof escHtml === 'function' ? escHtml(text) : text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safeText.replace(regex, '<span class="search-highlight">$1</span>');
}

// ── DEBOUNCE (Évite de faire freezer l'app quand on tape vite) ──
function handleSearchInput(e) {
  clearTimeout(_searchDebounce);
  const val = e.target.value;
  _searchDebounce = setTimeout(() => runSearch(val), 150); // Attend 150ms
}

function runSearch(q) {
  const el = $('search-results');
  if (!el) return;
  
  const query = q.trim().toLowerCase();
  _searchSelectedIndex = -1; // Reset sélection clavier
  
  if (!query) { 
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-3);font-size:14px;">Commencez à taper…</div>'; 
    return; 
  }

  const results = [];
  let itemIndex = 0; // Pour la navigation clavier

  // Template générateur de ligne
  const buildItem = (icon, title, sub, onclickAction) => `
    <div class="search-result-item" data-index="${itemIndex++}" onclick="closeSearch(); ${onclickAction}" 
      style="display:flex; align-items:center; gap:12px; padding:10px 20px; text-decoration:none; color:inherit;">
      <div style="font-size:18px; width:32px; height:32px; background:var(--bg-2); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${icon}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:14px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
        <div style="font-size:12px; color:var(--text-3); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub}</div>
      </div>
    </div>`;

  // 1. FAQ CoproSync
  if (typeof faqGlobalSearchMatches === 'function') {
    const faqHits = faqGlobalSearchMatches(query, 3);
    if (faqHits.length) {
      results.push(`<div style="padding:16px 20px 8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3);">❓ Centre d'aide</div>`);
      results.push(...faqHits.map(f => buildItem(
        f.ico || '❓', 
        highlightText(f.q, query), 
        'FAQ · Documentation', 
        `typeof navigateToFaqItem==='function'?navigateToFaqItem('${f.id}'):nav('faq')`
      )));
    }
  }

  // 2. TICKETS
  const tickets = (cache.tickets || []).filter(t =>
    (t.titre||'').toLowerCase().includes(query) || (t.description||'').toLowerCase().includes(query) || (t.batiment||'').toLowerCase().includes(query)
  ).slice(0, 4);
  
  if (tickets.length) {
    results.push(`<div style="padding:16px 20px 8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3);">🔧 Signalements</div>`);
    results.push(...tickets.map(t => buildItem(
      t.urgence==='critique'?'🔴':t.urgence==='important'?'🟠':'🔵',
      highlightText(t.titre, query),
      `${t.batiment||'Général'} · ${t.statut}`,
      `openDetail('${t.id}')`
    )));
  }

  // 3. ANNONCES
  if (cache.annonces) {
    const anns = cache.annonces
      .filter(a => typeof annonceReaderCanSee === 'function' ? annonceReaderCanSee(a) : true)
      .filter(a => (a.titre||'').toLowerCase().includes(query) || (a.contenu||'').toLowerCase().includes(query))
      .slice(0, 3);
      
    if (anns.length) {
      results.push(`<div style="padding:16px 20px 8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3);">📢 Annonces</div>`);
      results.push(...anns.map(a => buildItem(
        a.type==='urgent'?'🚨':a.type==='important'?'⚠️':'📢',
        highlightText(a.titre, query),
        highlightText((a.contenu||'').substring(0,60) + '...', query),
        `nav('annonces')`
      )));
    }
  }

  // 4. AGENDA
  if (cache.evenements) {
    const evts = cache.evenements.filter(e =>
      (e.titre||'').toLowerCase().includes(query) || (e.lieu||'').toLowerCase().includes(query)
    ).slice(0, 3);
    
    if (evts.length) {
      results.push(`<div style="padding:16px 20px 8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3);">📅 Agenda</div>`);
      results.push(...evts.map(e => {
        const d = new Date(e.date_debut).toLocaleDateString('fr-FR', {day:'numeric',month:'short'});
        return buildItem('📅', highlightText(e.titre, query), `${d} ${e.lieu ? '· '+highlightText(e.lieu, query) : ''}`, `nav('agenda')`);
      }));
    }
  }

  // 5. CONTACTS
  if (typeof _contactsCache !== 'undefined') {
    const contacts = _contactsCache.filter(c =>
      (c.nom||'').toLowerCase().includes(query) || (c.role||'').toLowerCase().includes(query) || (c.telephone||'').includes(query)
    ).slice(0, 3);
    
    if (contacts.length) {
      results.push(`<div style="padding:16px 20px 8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3);">📞 Contacts</div>`);
      results.push(...contacts.map(c => buildItem(
        c.ico||'📞', 
        highlightText(c.nom, query), 
        `${highlightText(c.role||'', query)} ${c.telephone ? '· '+highlightText(c.telephone, query) : ''}`, 
        `nav('contacts')`
      )));
    }
  }

  // AFFICHAGE
  if (results.length) {
    el.innerHTML = results.join('');
    // Sélectionne le premier élément par défaut
    _searchSelectedIndex = 0;
    updateKeyboardSelection();
  } else {
    el.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-3);font-size:14px;">
      Aucun résultat trouvé pour "<strong style="color:var(--text-1);">${typeof escHtml === 'function' ? escHtml(q) : q}</strong>"
    </div>`;
  }
}

// ── NAVIGATION AU CLAVIER (Ctrl+K & Flèches) ──
function updateKeyboardSelection() {
  const items = document.querySelectorAll('.search-result-item');
  items.forEach(el => el.classList.remove('keyboard-selected'));
  
  if (_searchSelectedIndex >= 0 && _searchSelectedIndex < items.length) {
    const activeItem = items[_searchSelectedIndex];
    activeItem.classList.add('keyboard-selected');
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function handleKeyboardNav(e) {
  const overlay = $('search-overlay');
  if (!overlay) return;

  const items = document.querySelectorAll('.search-result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _searchSelectedIndex = (_searchSelectedIndex + 1) % items.length;
    updateKeyboardSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _searchSelectedIndex = (_searchSelectedIndex - 1 + items.length) % items.length;
    updateKeyboardSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (_searchSelectedIndex >= 0) {
      items[_searchSelectedIndex].click(); // Simule le clic sur l'élément sélectionné
    }
  }
}

// Raccourcis globaux
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { 
    e.preventDefault(); 
    openSearch(); 
  }
  if (e.key === 'Escape' && $('search-overlay')) {
    closeSearch();
  }
});