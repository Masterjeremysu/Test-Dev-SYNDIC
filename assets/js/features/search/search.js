function openSearch() {
  if ($('search-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-box" onclick="event.stopPropagation()">
      <div class="search-input-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" id="search-input" placeholder="Rechercher un signalement, une annonce, un message…" autofocus>
        <button class="btn btn-ghost btn-sm" onclick="closeSearch()">Esc</button>
      </div>
      <div class="search-results" id="search-results">
        <div class="search-empty">Commencez à taper pour rechercher…</div>
      </div>
    </div>`;
  overlay.addEventListener('click', closeSearch);
  document.body.appendChild(overlay);
  setTimeout(() => $('search-input')?.focus(), 50);
  $('search-input').addEventListener('input', e => runSearch(e.target.value));
}

function closeSearch() {
  $('search-overlay')?.remove();
}

function runSearch(q) {
  const el = $('search-results');
  if (!el) return;
  const query = q.trim().toLowerCase();
  if (!query) { el.innerHTML = '<div class="search-empty">Commencez à taper…</div>'; return; }

  const results = [];

  // FAQ CoproSync
  if (typeof faqGlobalSearchMatches === 'function') {
    const faqHits = faqGlobalSearchMatches(query, 4);
    if (faqHits.length) {
      results.push(`<div class="search-section-title">❓ FAQ</div>`);
      results.push(...faqHits.map(f => `
        <div class="search-result-item" onclick="closeSearch();typeof navigateToFaqItem==='function'?navigateToFaqItem('${f.id}'):nav('faq')">
          <div class="search-result-ico">${f.ico || '❓'}</div>
          <div>
            <div class="search-result-title">${escHtml(f.q)}</div>
            <div class="search-result-sub">Aide · lien direct possible</div>
          </div>
        </div>`));
    }
  }

  // Tickets
  const tickets = (cache.tickets || []).filter(t =>
    t.titre?.toLowerCase().includes(query) ||
    t.description?.toLowerCase().includes(query) ||
    t.batiment?.toLowerCase().includes(query)
  ).slice(0, 4);
  if (tickets.length) {
    results.push(`<div class="search-section-title">🔧 Signalements</div>`);
    results.push(...tickets.map(t => `
      <div class="search-result-item" onclick="closeSearch();openDetail('${t.id}')">
        <div class="search-result-ico">${t.urgence==='critique'?'🔴':t.urgence==='important'?'🟠':'🔵'}</div>
        <div>
          <div class="search-result-title">${escHtml(t.titre)}</div>
          <div class="search-result-sub">${t.batiment||''} · ${t.statut}</div>
        </div>
      </div>`));
  }

  // Annonces (depuis Supabase — on cherche dans le cache si dispo)
  if (cache.annonces) {
    const anns = cache.annonces
      .filter(a => annonceReaderCanSee(a))
      .filter(a =>
        a.titre?.toLowerCase().includes(query) || a.contenu?.toLowerCase().includes(query)
      ).slice(0, 3);
    if (anns.length) {
      results.push(`<div class="search-section-title">📢 Annonces</div>`);
      results.push(...anns.map(a => `
        <div class="search-result-item" onclick="closeSearch();nav('annonces')">
          <div class="search-result-ico">${a.type==='urgent'?'🚨':a.type==='important'?'⚠️':'📢'}</div>
          <div>
            <div class="search-result-title">${escHtml(a.titre)}</div>
            <div class="search-result-sub">${escHtml((a.contenu||'').substring(0,60))}</div>
          </div>
        </div>`));
    }
  }

  // Événements
  if (cache.evenements) {
    const evts = cache.evenements.filter(e =>
      e.titre?.toLowerCase().includes(query) || e.lieu?.toLowerCase().includes(query)
    ).slice(0, 3);
    if (evts.length) {
      results.push(`<div class="search-section-title">📅 Agenda</div>`);
      results.push(...evts.map(e => {
        const d = new Date(e.date_debut).toLocaleDateString('fr-FR', {day:'numeric',month:'short'});
        return `<div class="search-result-item" onclick="closeSearch();nav('agenda')">
          <div class="search-result-ico">📅</div>
          <div>
            <div class="search-result-title">${escHtml(e.titre)}</div>
            <div class="search-result-sub">${d}${e.lieu?' · '+escHtml(e.lieu):''}</div>
          </div>
        </div>`;
      }));
    }
  }

  // Contacts
  const contacts = _contactsCache.filter(c =>
    c.nom?.toLowerCase().includes(query) ||
    c.role?.toLowerCase().includes(query) ||
    c.telephone?.includes(query)
  ).slice(0, 3);
  if (contacts.length) {
    results.push(`<div class="search-section-title">📞 Contacts</div>`);
    results.push(...contacts.map(c => `
      <div class="search-result-item" onclick="closeSearch();nav('contacts')">
        <div class="search-result-ico">${c.ico||'📞'}</div>
        <div>
          <div class="search-result-title">${escHtml(c.nom)}</div>
          <div class="search-result-sub">${escHtml(c.role||'')}${c.telephone?' · '+escHtml(c.telephone):''}</div>
        </div>
      </div>`));
  }

  el.innerHTML = results.length
    ? results.join('')
    : `<div class="search-empty">Aucun résultat pour "<strong>${escHtml(q)}</strong>"</div>`;
}

// Ctrl+K pour ouvrir la recherche
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

// ── CONTACTS & URGENCES ──
