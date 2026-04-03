function adminModuleCatalog() {
  return [
    {
      key: 'dashboard',
      label: 'Vue d’ensemble',
      description: 'Accès au tableau de bord principal et à ses indicateurs.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'tickets',
      label: 'Signalements',
      description: 'Création, suivi et traitement des incidents.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'map',
      label: 'Carte',
      description: 'Visualisation cartographique des signalements.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'messages',
      label: 'Messages',
      description: 'Messagerie interne et conversations de résidence.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'annonces',
      label: 'Annonces',
      description: 'Diffusion des annonces, informations et communications.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'agenda',
      label: 'Agenda',
      description: 'Événements, rendez-vous et échéances communes.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'contacts',
      label: 'Contacts & urgences',
      description: 'Répertoire utile et contacts prioritaires.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'documents',
      label: 'Documents',
      description: 'Accès aux documents partagés de la résidence.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'votes',
      label: 'Votes & sondages',
      description: 'Participation aux consultations et scrutins.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'faq',
      label: 'FAQ',
      description: 'Base d’aide et réponses aux questions fréquentes.',
      defaultRoles: ['administrateur', 'membre_cs', 'copropriétaire'],
      adminOnly: false,
    },
    {
      key: 'contrats',
      label: 'Contrats',
      description: 'Pilotage des contrats, échéances et fournisseurs.',
      defaultRoles: ['administrateur', 'membre_cs'],
      adminOnly: false,
    },
    {
      key: 'cles',
      label: 'Clés',
      description: 'Suivi des clés, prêts et historiques associés.',
      defaultRoles: ['administrateur', 'membre_cs'],
      adminOnly: false,
    },
    {
      key: 'journal',
      label: 'Journal',
      description: 'Audit des actions, traçabilité et supervision.',
      defaultRoles: ['administrateur', 'membre_cs'],
      adminOnly: false,
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      description: 'Administration classique des profils et comptes.',
      defaultRoles: ['administrateur'],
      adminOnly: true,
    },
    {
      key: 'rapport',
      label: 'Rapport syndic',
      description: 'Vue de synthèse dédiée au suivi avec le syndic.',
      defaultRoles: ['administrateur', 'membre_cs', 'syndic'],
      adminOnly: false,
    },
    {
      key: 'admin',
      label: 'Admin accès',
      description: 'Gouvernance des rôles, accès et visibilité globale.',
      defaultRoles: ['administrateur'],
      adminOnly: true,
    }
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
      role: 'administrateur',
      label: 'Administrateur',
      level: 'Contrôle total',
      modules: adminModuleCatalog().map(m => m.key),
      capabilities: [
        'Modifier les rôles',
        'Suspendre / réactiver les comptes',
        'Gérer les accès sensibles',
        'Superviser le journal'
      ],
      badgeColor: 'var(--violet)'
    },
    syndic: {
      role: 'syndic',
      label: 'Syndic',
      level: 'Accès externe restreint',
      modules: ['rapport'],
      capabilities: [
        'Consulter le rapport syndic',
        'Suivre les synthèses partagées'
      ],
      badgeColor: 'var(--accent)'
    },
    membre_cs: {
      role: 'membre_cs',
      label: 'Conseil Syndical',
      level: 'Pilotage opérationnel',
      modules: ['dashboard', 'tickets', 'map', 'messages', 'annonces', 'agenda', 'contacts', 'documents', 'votes', 'contrats', 'cles', 'journal', 'rapport'],
      capabilities: [
        'Suivre les incidents',
        'Accéder aux espaces de gestion',
        'Piloter contrats et journal'
      ],
      badgeColor: 'var(--amber)'
    },
    'copropriétaire': {
      role: 'copropriétaire',
      label: 'Copropriétaire',
      level: 'Usage résident',
      modules: ['dashboard', 'tickets', 'map', 'messages', 'annonces', 'agenda', 'contacts', 'documents', 'votes', 'faq', 'profile'],
      capabilities: [
        'Déclarer un signalement',
        'Consulter la vie de la résidence',
        'Participer aux échanges et votes'
      ],
      badgeColor: 'var(--green)'
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
    template,
    visibleModules,
    hiddenModules,
    canLogin: profileRow?.actif !== false,
    isRestricted: profileRow?.actif === false || profileRow?.role === 'syndic',
  };
}

function adminStatsFromUsers(users, journalRows) {
  const list = users || [];
  const total = list.length;
  const active = list.filter(u => u.actif !== false).length;
  const suspended = total - active;
  const admins = list.filter(u => u.role === 'administrateur').length;
  const cs = list.filter(u => u.role === 'membre_cs').length;
  const syndics = list.filter(u => u.role === 'syndic').length;
  const residents = list.filter(u => u.role === 'copropriétaire').length;
  return {
    total,
    active,
    suspended,
    admins,
    cs,
    syndics,
    residents,
    recentLogs: (journalRows || []).length
  };
}

function adminAccessBadge(matrix) {
  if (!matrix.canLogin) return '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:var(--red-light);color:var(--red);border:1px solid var(--red-border);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Suspendu</span>';
  if (matrix.role === 'administrateur') return '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:rgba(124,58,237,.12);color:var(--violet);border:1px solid rgba(124,58,237,.25);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Accès total</span>';
  if (matrix.role === 'membre_cs') return '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:rgba(234,88,12,.12);color:var(--amber);border:1px solid rgba(234,88,12,.25);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Gestionnaire</span>';
  if (matrix.role === 'syndic') return '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:rgba(37,99,235,.12);color:var(--accent);border:1px solid rgba(37,99,235,.25);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Rapport seul</span>';
  return '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:var(--green-light);color:var(--green);border:1px solid var(--green-border);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Accès résident</span>';
}

function renderAdminPermissionCard(role) {
  const template = getAdminRoleTemplate(role);
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-3);margin-bottom:6px;">Profil type</div>
          <div style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.04em;">${template.label}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${template.level}</div>
        </div>
        <div style="font-size:11px;font-weight:700;padding:6px 10px;border-radius:999px;background:${template.badgeColor}22;color:${template.badgeColor};border:1px solid ${template.badgeColor}44;">
          ${template.modules.length} modules
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${template.modules.map(key => {
          const mod = adminModuleCatalog().find(m => m.key === key);
          return `<span style="font-size:11px;padding:6px 10px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-2);">${mod?.label || key}</span>`;
        }).join('')}
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;">Capacités clés</div>
        <div style="display:grid;gap:8px;">
          ${template.capabilities.map(item => `
            <div style="font-size:12px;color:var(--text-2);display:flex;align-items:flex-start;gap:8px;">
              <span style="color:var(--green);font-weight:800;">✓</span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function renderAdmin() {
  if (!isAdmin()) {
    $('page').innerHTML = `
      <div style="padding:24px;max-width:760px;margin:0 auto;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--red);margin-bottom:10px;">Accès refusé</div>
          <div style="font-family:var(--font-head);font-size:32px;font-weight:800;letter-spacing:-.04em;margin-bottom:10px;">Zone d’administration sécurisée</div>
          <div style="font-size:14px;color:var(--text-2);line-height:1.7;margin-bottom:18px;">
            Cette page centralise la gouvernance des profils, des rôles et de la visibilité globale. Elle est réservée aux administrateurs.
          </div>
          <button class="btn btn-primary" onclick="nav('dashboard')">Retour au tableau de bord</button>
        </div>
      </div>
    `;
    return;
  }

  const [{ data: users, error: usersError }, { data: journalRows }] = await Promise.all([
    sb.from('profiles').select('*').order('created_at', { ascending: false }),
    sb.from('journal').select('id, action, entite, entite_id, created_at, user_nom, details').order('created_at', { ascending: false }).limit(8)
  ]);

  if (usersError) {
    $('page').innerHTML = `
      <div style="padding:24px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;">
          <div style="font-family:var(--font-head);font-size:28px;font-weight:800;letter-spacing:-.04em;">Administration des accès</div>
          <div style="margin-top:12px;font-size:14px;color:var(--red);">Impossible de charger les profils : ${escHtml(usersError.message || 'erreur inconnue')}</div>
        </div>
      </div>
    `;
    return;
  }

  const rows = users || [];
  const stats = adminStatsFromUsers(rows, journalRows || []);
  const roleLabels = adminRoleLabels();

  $('page').innerHTML = `
    <div style="padding:16px;animation:pageIn .25s ease both;display:grid;gap:16px;">
      <div style="padding-bottom:16px;border-bottom:2px solid var(--border);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end;">
        <div style="max-width:760px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:16px;height:1px;background:var(--border-strong);"></span>
            Gouvernance
            <span style="display:inline-block;width:16px;height:1px;background:var(--border-strong);"></span>
          </div>
          <h1 style="font-family:var(--font-head);font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-1.6px;line-height:1;margin-bottom:10px;">Admin · Accès & visibilité</h1>
          <div style="font-size:14px;color:var(--text-2);line-height:1.7;">
            Vue de pilotage complète des profils de la résidence. Cette V1 fonctionne sans migration SQL supplémentaire :
            les accès sont dérivés du rôle existant, de l’état <strong>actif / suspendu</strong> et des règles déjà présentes dans l’application.
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="renderUsers()">Ouvrir la page Utilisateurs</button>
          <button class="btn btn-primary" onclick="nav('journal')">Voir le journal</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;">
        ${[
          { label: 'Profils', value: stats.total, color: 'var(--accent)' },
          { label: 'Comptes actifs', value: stats.active, color: 'var(--green)' },
          { label: 'Suspendus', value: stats.suspended, color: 'var(--red)' },
          { label: 'Administrateurs', value: stats.admins, color: 'var(--violet)' },
          { label: 'Conseil syndical', value: stats.cs, color: 'var(--amber)' },
          { label: 'Syndics', value: stats.syndics, color: 'var(--accent)' }
        ].map(card => `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:10px;">${card.label}</div>
            <div style="font-family:var(--font-head);font-size:28px;font-weight:800;line-height:1;color:${card.color};">${card.value}</div>
          </div>
        `).join('')}
      </div>

      <div style="background:linear-gradient(135deg,#171614 0%,#252320 100%);border-radius:20px;border:1px solid rgba(255,255,255,.08);padding:18px 20px;color:#fff;display:grid;gap:12px;">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          <div style="max-width:760px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5);margin-bottom:8px;">Politique d’accès actuelle</div>
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;letter-spacing:-.04em;margin-bottom:8px;">Modèle d’autorisations dérivé des rôles existants</div>
            <div style="font-size:13px;color:rgba(255,255,255,.72);line-height:1.7;">
              Sans changer le schéma SQL, la visibilité peut déjà être pilotée par le rôle affecté au profil. Les modules ci-dessous
              montrent exactement ce qu’un utilisateur peut voir aujourd’hui dans l’application.
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);min-width:140px;">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:4px;">Résidents</div>
              <div style="font-size:20px;font-weight:800;">${stats.residents}</div>
            </div>
            <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);min-width:140px;">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:4px;">Logs récents</div>
              <div style="font-size:20px;font-weight:800;">${stats.recentLogs}</div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
          ${['administrateur', 'membre_cs', 'syndic', 'copropriétaire'].map(renderAdminPermissionCard).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.95fr);gap:16px;align-items:start;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;">
          <div style="padding:16px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:6px;">Matrice des accès</div>
              <div style="font-family:var(--font-head);font-size:24px;font-weight:800;letter-spacing:-.04em;">Qui voit quoi</div>
            </div>
            <div style="font-size:12px;color:var(--text-3);max-width:420px;line-height:1.6;">
              Les réglages affichés sont issus de la logique actuelle du produit : rôle, suspension, et sections déjà cachées dans la navigation.
            </div>
          </div>
          <div style="display:grid;">
            ${rows.map((u, idx) => {
              const matrix = getAdminUserMatrix(u);
              const fullName = displayName(u.prenom, u.nom, u.email, 'Résident');
              const initials = (u.prenom || u.nom || u.email || '?').slice(0, 1).toUpperCase();
              const bg = matrix.template.badgeColor || 'var(--accent)';
              return `
                <div style="padding:16px 18px;border-bottom:${idx < rows.length - 1 ? '1px solid var(--border)' : 'none'};display:grid;gap:12px;">
                  <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;">
                    <div style="display:flex;gap:12px;min-width:0;">
                      <div style="width:42px;height:42px;border-radius:12px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:16px;font-weight:800;box-shadow:0 6px 18px ${bg}44;flex-shrink:0;">${initials}</div>
                      <div style="min-width:0;">
                        <div style="font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(fullName)}</div>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;">
                          <span style="font-size:11px;padding:4px 8px;border-radius:999px;background:${bg}18;color:${bg};border:1px solid ${bg}33;font-weight:700;">${roleLabels[u.role] || u.role}</span>
                          ${adminAccessBadge(matrix)}
                          <span style="font-size:11px;color:var(--text-3);">${escHtml(u.email || '—')}</span>
                        </div>
                      </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      ${u.id !== user.id ? `
                        <select class="select" style="font-size:11px;padding:6px 10px;border-radius:10px;height:auto;min-width:170px;" onchange="changeRole('${u.id}',this.value)">
                          ${['copropriétaire','membre_cs','syndic','administrateur'].map(r => `<option value="${r}" ${r===u.role?'selected':''}>${roleLabels[r]}</option>`).join('')}
                        </select>
                        <button onclick="toggleBan('${u.id}',${u.actif===false},'${escHtml(fullName)}')" style="background:${u.actif===false?'var(--green-light)':'var(--red-light)'};color:${u.actif===false?'var(--green)':'var(--red)'};border:1px solid ${u.actif===false?'var(--green-border)':'var(--red-border)'};font-size:11px;font-weight:700;padding:7px 12px;border-radius:10px;cursor:pointer;font-family:var(--font-body);">
                          ${u.actif===false ? 'Réactiver' : 'Suspendre'}
                        </button>
                      ` : `
                        <div style="font-size:11px;color:var(--text-3);padding:8px 10px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);">
                          Compte courant protégé
                        </div>
                      `}
                    </div>
                  </div>

                  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
                    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Modules visibles</div>
                      <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        ${matrix.visibleModules.map(mod => `<span style="font-size:11px;padding:6px 9px;border-radius:999px;background:var(--green-light);border:1px solid var(--green-border);color:var(--green);">${mod.label}</span>`).join('')}
                      </div>
                    </div>
                    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Modules masqués</div>
                      <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        ${matrix.hiddenModules.length ? matrix.hiddenModules.map(mod => `<span style="font-size:11px;padding:6px 9px;border-radius:999px;background:var(--red-light);border:1px solid var(--red-border);color:var(--red);">${mod.label}</span>`).join('') : '<span style="font-size:12px;color:var(--text-3);">Aucun module masqué.</span>'}
                      </div>
                    </div>
                  </div>

                  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Capacités</div>
                      <div style="display:grid;gap:6px;">
                        ${matrix.template.capabilities.map(item => `<div style="font-size:12px;color:var(--text-2);display:flex;gap:8px;align-items:flex-start;"><span style="color:var(--green);font-weight:800;">✓</span><span>${item}</span></div>`).join('')}
                      </div>
                    </div>
                    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:12px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">État et périmètre</div>
                      <div style="display:grid;gap:7px;">
                        <div style="font-size:12px;color:var(--text-2);"><strong>Connexion :</strong> ${matrix.canLogin ? 'autorisée' : 'bloquée'}</div>
                        <div style="font-size:12px;color:var(--text-2);"><strong>Profil :</strong> ${matrix.template.level}</div>
                        <div style="font-size:12px;color:var(--text-2);"><strong>Tour :</strong> ${escHtml(u.tour || u.batiment || '—')}</div>
                        <div style="font-size:12px;color:var(--text-2);"><strong>Lot :</strong> ${escHtml(u.lot || '—')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="display:grid;gap:16px;">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Lecture produit</div>
            <div style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.04em;margin-bottom:10px;">Ce que cette V1 admin pilote déjà</div>
            <div style="display:grid;gap:10px;">
              ${[
                'Attribution des rôles existants sans changer le schéma SQL.',
                'Blocage immédiat des comptes suspendus via `profile.actif`.',
                'Visualisation claire des modules visibles par type de profil.',
                'Point d’entrée unique pour piloter comptes, périmètres et supervision.'
              ].map(item => `
                <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:var(--text-2);line-height:1.6;">
                  <span style="width:18px;height:18px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;font-size:11px;">✓</span>
                  <span>${item}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Modules référencés</div>
            <div style="display:grid;gap:10px;">
              ${adminModuleCatalog().map(mod => `
                <div style="padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);">
                  <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
                    <div>
                      <div style="font-size:13px;font-weight:700;">${mod.label}</div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:4px;line-height:1.5;">${mod.description}</div>
                    </div>
                    ${mod.adminOnly ? '<span style="font-size:10px;padding:4px 8px;border-radius:999px;background:rgba(124,58,237,.12);color:var(--violet);border:1px solid rgba(124,58,237,.22);font-weight:700;">Admin</span>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:8px;">Dernières traces du journal</div>
            <div style="display:grid;gap:10px;">
              ${(journalRows || []).length ? (journalRows || []).map(log => `
                <div style="padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border);">
                  <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                    <div>
                      <div style="font-size:12px;font-weight:700;color:var(--text-1);">${escHtml(log.action || 'Action')}</div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:4px;">${escHtml(log.user_nom || 'Système')} · ${escHtml(log.entite || '—')}</div>
                    </div>
                    <div style="font-size:11px;color:var(--text-3);white-space:nowrap;">${fmt(log.created_at)}</div>
                  </div>
                </div>
              `).join('') : '<div style="font-size:12px;color:var(--text-3);">Aucune entrée récente disponible.</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
