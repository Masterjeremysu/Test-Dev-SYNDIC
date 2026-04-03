// ── RENDER ──
function renderPage(p) {
  const el = $('page');

  // Syndic externe → uniquement le rapport
  if (isSyndicExterne() && p !== 'rapport') {
    p = 'rapport';
    currentPage = 'rapport';
  }

  // Animation de transition
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'pageIn .22s cubic-bezier(.4,0,.2,1) both';

  if (!isAdmin() && p === 'admin') {
    p = 'dashboard';
    currentPage = 'dashboard';
  }

  if (p === 'dashboard') renderDashboard();
  else if (p === 'tickets') renderTickets();
  else if (p === 'map') { renderMapPage(); setTimeout(initMap, 100); }
  else if (p === 'contrats') renderContrats();
  else if (p === 'cles') renderCles();
  else if (p === 'journal') renderJournal();
  else if (p === 'users') renderUsers();
  else if (p === 'admin') renderAdmin();
  else if (p === 'rapport') renderRapport();
  else if (p === 'notifications') renderNotifications();
  else if (p === 'profile') renderProfile();
  else if (p === 'messages') renderMessages();
  else if (p === 'annonces') renderAnnonces();
  else if (p === 'agenda') renderAgenda();
  else if (p === 'contacts') renderContacts();
  else if (p === 'documents') renderDocuments();
  else if (p === 'votes') renderVotes();
  else if (p === 'faq') renderFAQ();
}
