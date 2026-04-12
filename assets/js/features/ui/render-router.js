// ════════════════════════════════════════════════════════════════
//  RENDER ROUTER
//  assets/js/features/ui/render-router.js
// ════════════════════════════════════════════════════════════════

function renderPage(p) {
  const el = $('page');
  if (!el) return;

  // 1. Vérification d'accès — redirige si non accessible via le système de Permissions
  const accessible = typeof Permissions !== 'undefined' ? Permissions.getAccessiblePages() : [];
  
  if (!accessible.includes(p)) {
    console.warn('[router] "' + p + '" non accessible pour ' + (typeof currentRole === 'function' ? currentRole() : 'user') + ' → redirect');
    p = typeof Permissions !== 'undefined' ? Permissions.getDefaultPage() : 'dashboard';
    currentPage = p;
  }

  document.body?.setAttribute('data-page', p);
  document.documentElement?.setAttribute('data-page', p);

  // 2. Reset de l'animation pour un effet "SaaS" fluide à chaque changement
  el.style.animation = 'none';
  el.offsetHeight; // Force le reflow
  el.style.animation = 'pageIn .22s cubic-bezier(.4,0,.2,1) both';

  // 3. AIGUILLAGE DES ROUTES
  // On utilise un switch, c'est plus propre et plus performant qu'une montagne de "if"
  switch (p) {
    case 'dashboard':
      renderDashboard();
      break;

    case 'tickets':
      renderTickets();
      break;

    case 'map':
      renderMapPage();
      // On laisse un petit délai pour que le conteneur DOM soit prêt pour Leaflet
      setTimeout(() => { if (typeof initMap === 'function') initMap(); }, 100);
      break;

    case 'messages':
      renderMessages();
      break;

    case 'annonces':
      renderAnnonces();
      break;

    case 'agenda':
      renderAgenda();
      break;

    case 'votes':
      renderVotes();
      break;

    case 'documents':
      renderDocuments();
      break;

    case 'contacts':
      renderContacts();
      break;

    case 'faq':
      renderFAQ();
      break;

    case 'profile':
      renderProfile();
      break;

    case 'notifications':
      renderNotifications();
      break;

    // --- SECTION GESTION ---
    case 'contrats':
      renderContrats();
      break;

    case 'cles':
      renderCles();
      break;

    case 'journal':
      renderJournal();
      break;

    case 'rapport':
      renderRapport();
      break;

      case 'registre': // <-- AJOUTE CE BLOC
      if (typeof renderRegistre === 'function') {
        renderRegistre();
      } else {
        console.error("Module registre.js non chargé");
        renderDashboard();
      }
      break;

    // --- SECTION ADMINISTRATION ---
    case 'admin': 
      // FIX CRITIQUE : Route pour "Admin Accès"
      if (typeof renderAdmin === 'function') {
        renderAdmin();
      } else {
        console.error("Module admin.js non chargé");
        renderDashboard();
      }
      break;

    case 'users':
      renderUsers();
      break;

    case 'permissions':
      // Garde de sécurité stricte
      if (typeof isAdmin === 'function' && !isAdmin()) { 
        nav(Permissions.getDefaultPage()); 
        return; 
      }
      if (typeof renderPermissionsPage === 'function') renderPermissionsPage();
      break;

    default:
      console.warn(`[router] Route inconnue: ${p}, fallback dashboard`);
      renderDashboard();
      break;
  }

  // Optionnel : Scroll vers le haut à chaque changement de page
  window.scrollTo(0, 0);
}
