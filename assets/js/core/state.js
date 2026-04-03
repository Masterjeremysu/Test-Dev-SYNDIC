// ── STATE ──
let user = null;
let profile = null;
let currentPage = 'dashboard';
let urgencySelected = 'normal';
let photoFile = null;
let mapInstance = null;
let mapMarkers = [];
let cache = { tickets: [], profiles: [], contrats: [], cles: [], journal: [], stats: null };
let authMode = 'login';
