// ════════════════════════════════════════════════════════════════
//  ADMINISTRATION : ACCÈS & VISIBILITÉ (SaaS Premium UI)
//  assets/js/features/admin/admin.js
// ════════════════════════════════════════════════════════════════

function adminModuleCatalog() {
  return [
    { key: 'dashboard', label: 'Vue d’ensemble', description: 'Accès au tableau de bord principal.', adminOnly: false },
    { key: 'tickets', label: 'Signalements', description: 'Création, suivi et traitement des incidents.', adminOnly: false },
    { key: 'map', label: 'Carte', description: 'Visualisation cartographique des signalements.', adminOnly: false },
    { key: 'messages', label: 'Messages', description: 'Messagerie interne de résidence.', adminOnly: false },
    { key: 'annonces', label: 'Annonces', description: 'Diffusion des annonces.', adminOnly: false },
    { key: 'agenda', label: 'Agenda', description: 'Événements et rendez-vous.', adminOnly: false },
    { key: 'contacts', label: 'Contacts', description: 'Répertoire utile et urgences.', adminOnly: false },
    { key: 'documents', label: 'Documents', description: 'Accès aux documents partagés.', adminOnly: false },
    { key: 'votes', label: 'Votes', description: 'Consultations et scrutins.', adminOnly: false },
    { key: 'faq', label: 'FAQ', description: 'Base d’aide.', adminOnly: false },
    { key: 'contrats', label: 'Contrats', description: 'Pilotage des fournisseurs.', adminOnly: false },
    { key: 'cles', label: 'Clés', description: 'Suivi des clés.', adminOnly: false },
    { key: 'journal', label: 'Journal', description: 'Audit des actions.', adminOnly: false },
    { key: 'users', label: 'Utilisateurs', description: 'Profils et comptes.', adminOnly: true },
    { key: 'rapport', label: 'Rapport syndic', description: 'Suivi avec le syndic.', adminOnly: false },
    { key: 'journal', label: 'Journal', description: 'Audit des actions.', adminOnly: false },
    { key: 'registre', label: 'Registre', description: 'Suivi des interventions et prestataires.', adminOnly: false }, 
    { key: 'users', label: 'Utilisateurs', description: 'Profils et comptes.', adminOnly: true },
    { key: 'admin', label: 'Sécurité & Accès', description: 'Gouvernance globale.', adminOnly: true }
  ];
}

function adminRoleLabels() {
  return {
    administrateur: 'Administrateur',
    syndic: 'Syndic',
    membre_cs: 'Conseil Syndical',
    'copropriétaire': 'Copropriétaire'
  };
}

function getAdminRoleTemplate(role) {
  const byRole = {
    administrateur: {
      role: 'administrateur', label: 'Administrateur', level: 'Contrôle total',
      modules: adminModuleCatalog().map(m => m.key),
      capabilities: ['Modifier les rôles', 'Gérer les comptes', 'Superviser le journal'],
      badgeColor: 'var(--purple, #a855f7)', bgLight: 'var(--purple-light, #f3e8ff)'
    },
    syndic: {
      role: 'syndic', label: 'Syndic', level: 'Accès restreint',
      modules: ['rapport'],
      capabilities: ['Consulter les rapports', 'Voir les signalements transmis'],
      badgeColor: 'var(--orange, #f97316)', bgLight: 'var(--orange-light, #ffedd5)'
    },
    membre_cs: {
      role: 'membre_cs', label: 'Conseil Syndical', level: 'Pilotage opérationnel',
      modules: ['dashboard', 'tickets', 'map', 'messages', 'annonces', 'agenda', 'contacts', 'documents', 'votes', 'contrats', 'cles', 'journal','registre', 'rapport'],
      capabilities: ['Gérer les incidents', 'Piloter les contrats', 'Diffuser des annonces'],
      badgeColor: 'var(--blue, #3b82f6)', bgLight: 'var(--blue-light, #eff6ff)'
    },
    'copropriétaire': {
      role: 'copropriétaire', label: 'Résident', level: 'Usage standard',
      modules: ['dashboard', 'tickets', 'map', 'messages', 'annonces', 'agenda', 'contacts', 'documents', 'votes', 'faq', 'profile'],
      capabilities: ['Créer un signalement', 'Discuter avec les voisins', 'Participer aux votes'],
      badgeColor: 'var(--green, #10b981)', bgLight: 'var(--green-light, #d1fae5)'
    }
  };
  return byRole[role] || byRole['copropriétaire'];
}

function getAdminUserMatrix(profileRow) {
  const template = getAdminRoleTemplate(profileRow?.role);
  const roleLabels = adminRoleLabels();
  const allModules = adminModuleCatalog();
  const moduleSet = new Set(template.modules || []);
  const visibleModules = allModules.filter(m => moduleSet.has(m.key));
  const hiddenModules = allModules.filter(m => !moduleSet.has(m.key));
  return {
    role: profileRow?.role || 'copropriétaire',
    roleLabel: roleLabels[profileRow?.role] || profileRow?.role || '—',
    template, visibleModules, hiddenModules,
    canLogin: profileRow?.actif !== false
  };
}

function adminStatsFromUsers(users) {
  const list = users || [];
  return {
    total: list.length,
    active: list.filter(u => u.actif !== false).length,
    suspended: list.filter(u => u.actif === false).length,
    admins: list.filter(u => u.role === 'administrateur').length,
    cs: list.filter(u => u.role === 'membre_cs').length,
    syndics: list.filter(u => u.role === 'syndic').length,
    residents: list.filter(u => u.role === 'copropriétaire').length
  };
}

(function injectAdminCSS() {
  if (document.getElementById('saas-admin-css')) return;
  const s = document.createElement('style');
  s.id = 'saas-admin-css';
  s.textContent = `
    .adm-container { padding: 32px 40px; max-width: 1400px; margin: 0 auto; animation: fade-in 0.3s ease; }
    .adm-title { font-family: var(--font-head); font-size: 32px; font-weight: 900; letter-spacing: -1px; color: var(--text-1); margin: 0 0 8px 0; }
    .adm-sub { font-size: 14px; color: var(--text-3); font-weight: 500; margin-bottom: 32px; max-width: 700px; line-height: 1.5; }
    
    .adm-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .adm-stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .adm-stat-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); margin-bottom: 8px; }
    .adm-stat-val { font-family: var(--font-head); font-size: 32px; font-weight: 900; line-height: 1; }
    
    .adm-role-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px; }
    .adm-role-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .adm-role-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .adm-role-name { font-family: var(--font-head); font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .adm-role-desc { font-size: 13px; color: var(--text-3); font-weight: 500; }
    .adm-role-badge { font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; border: 1px solid; }
    
    .adm-cap-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .adm-cap-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-2); font-weight: 500; }
    .adm-cap-item svg { color: var(--green); flex-shrink: 0; margin-top: 2px; }
    
    .adm-mod-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .adm-mod-tag { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: var(--bg-2); color: var(--text-2); border: 1px solid var(--border); }
    
    .adm-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .adm-grid { display: grid; grid-template-columns: minmax(250px, 2fr) 180px minmax(200px, 2fr) 100px; gap: 16px; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border); }
    .adm-th { background: var(--bg-1); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); padding-top: 16px; padding-bottom: 16px; }
    .adm-tr { transition: background 0.15s; }
    .adm-tr:hover { background: var(--bg-2); }
    .adm-tr:last-child { border-bottom: none; }
    
    .adm-av { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0; }
    
    /* Toggle Switch iOS */
    .adm-toggle { width: 44px; height: 24px; background: var(--red); border-radius: 12px; position: relative; cursor: pointer; transition: background 0.2s ease; border: none; outline: none; }
    .adm-toggle.on { background: var(--green); }
    .adm-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
    .adm-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .adm-toggle.on::after { transform: translateX(20px); }

    .adm-select { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text-1); font-weight: 600; width: 100%; outline: none; transition: border-color 0.2s; }
    .adm-select:focus { border-color: var(--primary); }
    .adm-select:disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }

    @media (max-width: 960px) {
      .adm-container { padding: 24px 16px; }
      .adm-th { display: none; }
      .adm-grid { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px; }
      .adm-grid > div { width: 100%; }
      .adm-toggle { align-self: flex-start; margin-top: 4px; }
    }
  `;
  document.head.appendChild(s);
})();

async function renderAdmin() {
  if (typeof isManager !== 'function' || !isManager()) {
    $('page').innerHTML = `<div style="padding:60px 20px; text-align:center; color:var(--red); font-weight:800; font-size:18px;">🚫 Accès refusé</div>`;
    return;
  }

  $('page').innerHTML = `<div style="padding:80px; text-align:center;"><div class="spinner"></div></div>`;

  const { data: users, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  
  if (error) {
    $('page').innerHTML = `<div style="padding:40px; color:var(--red); text-align:center;">Erreur de chargement: ${error.message}</div>`;
    return;
  }

  const rows = users || [];
  const stats = adminStatsFromUsers(rows);
  
  const myId = typeof user !== 'undefined' ? user.id : null;

  $('page').innerHTML = `
  <div class="adm-container">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:32px;">
      <div>
        <div class="adm-title">Sécurité & Gouvernance</div>
        <div class="adm-sub">Matrice des rôles, gestion des accès et visibilité globale des modules par utilisateur.</div>
      </div>
      <button class="btn btn-secondary" onclick="if(typeof nav==='function') nav('journal')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Consulter le journal d'audit
      </button>
    </div>

    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-lbl">Utilisateurs totaux</div>
        <div class="adm-stat-val" style="color:var(--text-1);">${stats.total}</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-lbl">Administrateurs</div>
        <div class="adm-stat-val" style="color:var(--purple);">${stats.admins}</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-lbl">Conseil Syndical</div>
        <div class="adm-stat-val" style="color:var(--blue);">${stats.cs}</div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-lbl">Suspendus / Bloqués</div>
        <div class="adm-stat-val" style="color:var(--red);">${stats.suspended}</div>
      </div>
    </div>

    <h2 style="font-family:var(--font-head); font-size:20px; font-weight:800; margin-bottom:16px;">Profils Types</h2>
    <div class="adm-role-cards">
      ${['administrateur', 'membre_cs', 'syndic', 'copropriétaire'].map(r => {
        const tpl = getAdminRoleTemplate(r);
        return `
        <div class="adm-role-card">
          <div class="adm-role-head">
            <div>
              <div class="adm-role-name" style="color:${tpl.badgeColor};">${tpl.label}</div>
              <div class="adm-role-desc">${tpl.level}</div>
            </div>
            <div class="adm-role-badge" style="background:${tpl.bgLight}; color:${tpl.badgeColor}; border-color:${tpl.badgeColor}44;">
              ${tpl.modules.length} modules
            </div>
          </div>
          
          <div class="adm-cap-list">
            ${tpl.capabilities.map(cap => `
              <div class="adm-cap-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${cap}
              </div>
            `).join('')}
          </div>
          
          <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-bottom:8px;">Visibilité</div>
          <div class="adm-mod-wrap">
            ${tpl.modules.slice(0, 6).map(m => `<span class="adm-mod-tag">${m}</span>`).join('')}
            ${tpl.modules.length > 6 ? `<span class="adm-mod-tag" style="background:transparent; border:none; color:var(--text-3);">+ ${tpl.modules.length - 6} autres</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>

    <h2 style="font-family:var(--font-head); font-size:20px; font-weight:800; margin-bottom:16px;">Matrice des Utilisateurs</h2>
    <div class="adm-table-wrap">
      <div class="adm-grid adm-th">
        <div>Utilisateur</div>
        <div>Rôle & Permissions</div>
        <div>Modules Visibles</div>
        <div style="text-align:center;">Accès App</div>
      </div>
      
      <div>
        ${rows.map(u => {
          const matrix = getAdminUserMatrix(u);
          const fullName = typeof displayName === 'function' ? displayName(u.prenom, u.nom, u.email, 'Résident') : u.email;
          const initials = (u.prenom || u.nom || u.email || '?').charAt(0).toUpperCase();
          const tpl = matrix.template;
          
          // Protection de l'admin actuel
          const isMe = u.id === myId;
          
          return `
          <div class="adm-grid adm-tr">
            
            <div style="display:flex; align-items:center; gap:12px; min-width:0;">
              <div class="adm-av" style="background:${tpl.badgeColor}; box-shadow:0 4px 12px ${tpl.badgeColor}44;">${initials}</div>
              <div style="min-width:0;">
                <div style="font-weight:800; font-size:14px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escHtml(fullName)} ${isMe ? '<span style="font-size:10px; background:var(--bg-2); padding:2px 6px; border-radius:6px; margin-left:6px; color:var(--text-2);">MOI</span>' : ''}
                </div>
                <div style="font-size:12px; color:var(--text-3); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escHtml(u.email || 'Pas d\'email')}
                </div>
              </div>
            </div>

            <div>
              <select class="adm-select" onchange="changeUserRole('${u.id}', this.value, '${escHtml(fullName)}')" ${isMe ? 'disabled title="Vous ne pouvez pas modifier votre propre rôle"' : ''}>
                <option value="copropriétaire" ${u.role==='copropriétaire'?'selected':''}>Résident</option>
                <option value="membre_cs" ${u.role==='membre_cs'?'selected':''}>Conseil Syndical</option>
                <option value="syndic" ${u.role==='syndic'?'selected':''}>Syndic externe</option>
                <option value="administrateur" ${u.role==='administrateur'?'selected':''}>Administrateur</option>
              </select>
            </div>

            <div class="adm-mod-wrap">
              ${matrix.visibleModules.slice(0, 4).map(mod => `<span class="adm-mod-tag" style="background:var(--green-light); border-color:var(--green-border); color:var(--green);">${mod.label}</span>`).join('')}
              ${matrix.visibleModules.length > 4 ? `<span class="adm-mod-tag" style="background:var(--bg-2); border-color:transparent;">+ ${matrix.visibleModules.length - 4}</span>` : ''}
              ${matrix.hiddenModules.slice(0, 2).map(mod => `<span class="adm-mod-tag" style="background:var(--red-light); border-color:var(--red-border); color:var(--red); text-decoration:line-through; opacity:0.6;" title="Interdit">${mod.label}</span>`).join('')}
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
              <button class="adm-toggle ${matrix.canLogin ? 'on' : ''}" 
                      id="toggle-access-${u.id}" 
                      onclick="toggleUserAccess('${u.id}', ${matrix.canLogin}, '${escHtml(fullName)}')"
                      ${isMe ? 'disabled title="Vous ne pouvez pas vous bloquer vous-même"' : ''}>
              </button>
              <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${matrix.canLogin ? 'var(--green)' : 'var(--red)'};" id="lbl-access-${u.id}">
                ${matrix.canLogin ? 'Actif' : 'Bloqué'}
              </div>
            </div>

          </div>`;
        }).join('')}
      </div>
    </div>

  </div>`;
}

function escHtml(t) {
  return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── ACTIONS ───

async function changeUserRole(userId, newRole, userName) {
  if (!confirm(`Modifier le rôle de ${userName} en "${newRole}" ?`)) {
    renderAdmin(); // Rétablit la valeur visuelle d'origine
    return;
  }
  
  const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) { 
    if(typeof toast === 'function') toast('Erreur lors de la modification', 'err'); 
    return; 
  }
  
  if (typeof addLog === 'function') await addLog('Modification rôle', 'admin', userId, { newRole });
  if (typeof toast === 'function') toast(`Le rôle de ${userName} a été mis à jour`, 'ok');
  
  renderAdmin(); // Rafraîchit la matrice
}

async function toggleUserAccess(userId, currentState, userName) {
  const newState = !currentState;
  const actionText = newState ? 'Réactiver' : 'Bloquer (Suspendre)';
  
  if (!confirm(`Voulez-vous vraiment ${actionText} l'accès de ${userName} ?`)) return;
  
  // Optimistic UI Update
  const toggle = document.getElementById(`toggle-access-${userId}`);
  const lbl = document.getElementById(`lbl-access-${userId}`);
  if (toggle) toggle.classList.toggle('on', newState);
  if (lbl) {
    lbl.textContent = newState ? 'Actif' : 'Bloqué';
    lbl.style.color = newState ? 'var(--green)' : 'var(--red)';
  }

  // Database Update
  const { error } = await sb.from('profiles').update({ actif: newState }).eq('id', userId);
  
  if (error) { 
    // Rollback UI
    if (toggle) toggle.classList.toggle('on', currentState);
    if(typeof toast === 'function') toast('Erreur serveur', 'err'); 
    return; 
  }
  
  if (typeof addLog === 'function') await addLog(newState ? 'Compte réactivé' : 'Compte bloqué', 'admin', userId, { userName });
  if (typeof toast === 'function') toast(`Accès de ${userName} ${newState ? 'réactivé' : 'suspendu'}`, newState ? 'ok' : 'warn');
  
  // Reload clean data
  renderAdmin();
}
