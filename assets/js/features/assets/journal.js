function renderJournal() {
  $('page').innerHTML = `
  <div style="padding:24px;">
    <div class="ph"><h1>Journal d'activité</h1><p>Historique immuable de toutes les actions</p></div>
    <div class="card">
      <div class="card-body">
        ${cache.journal.length === 0 ? emptyState('📋', 'Journal vide', 'Les actions effectuées dans l\'application apparaîtront ici.') :
          cache.journal.map(j => `
            <div class="journal-line">
              <div class="jdot" style="background:${j.action.includes('créé')||j.action.includes('ajouté')?'var(--green)':j.action.includes('supprimé')?'var(--red)':j.action.includes('modifié')||j.action.includes('Statut')?'var(--amber)':'var(--accent)'}"></div>
              <div style="min-width:120px;flex-shrink:0;">
                <div class="jtime">${fmt(j.created_at)}</div>
              </div>
              <div>
                <div class="jact">${j.action}${j.details?.titre?' — '+j.details.titre:j.details?.nom?' — '+j.details.nom:''}</div>
                <div class="juser">${j.user_nom || 'Système'}</div>
              </div>
            </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ── USERS ──
