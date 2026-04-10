// ════════════════════════════════════════════════════════════════
//  UTILISATEURS & ADMINISTRATION
//  assets/js/features/users/users.js
// ════════════════════════════════════════════════════════════════

let _usersDataCache = [];
let _usersSearch = '';
let _usersFilterRole = 'all';
let _usersFilterTour = 'all';

async function autoJoinTourGroup(tour) {
  if (typeof _msgState === 'undefined' || !_msgState.conversations) return;
  
  // Trouve la conversation du groupe correspondant à la tour
  const conv = _msgState.conversations.find(c => c.titre.includes(tour));
  if (!conv) {
    // Recharge les conversations si pas encore chargées
    const { data } = await sb.from('conversations').select('*');
    const found = (data||[]).find(c => c.titre.includes(tour));
    if (!found) return;
    await sb.from('conversation_membres').upsert(
      { conversation_id: found.id, user_id: user.id },
      { onConflict: 'conversation_id,user_id' }
    );
    return;
  }
  await sb.from('conversation_membres').upsert(
    { conversation_id: conv.id, user_id: user.id },
    { onConflict: 'conversation_id,user_id' }
  );
}

async function changeTour(userId, tour) {
  if (!confirm(`Modifier la tour de ce résident vers : ${tour || 'Aucune'} ?`)) {
    renderUsersList(); // Rétablit l'UI précédente
    return;
  }
  
  try {
    const { error } = await sb.from('profiles').update({ tour }).eq('id', userId);
    if (error) throw error;
    
    // Auto-rejoindre le groupe de la tour
    if (tour) {
      const { data: convs } = await sb.from('conversations').select('id,titre');
      const found = (convs||[]).find(c => c.titre.includes(tour));
      if (found) {
        await sb.from('conversation_membres').upsert(
          { conversation_id: found.id, user_id: userId },
          { onConflict: 'conversation_id,user_id' }
        );
      }
    }
    
    // Met à jour le cache local
    const u = _usersDataCache.find(x => x.id === userId);
    if (u) u.tour = tour;
    
    toast('Tour assignée ✓', 'ok');
  } catch (err) {
    toast('Erreur lors du changement de tour', 'err');
  }
}

async function renderUsers() {
  const page = $('page');
  if (!page) return;
  
  page.innerHTML = `
  <div style="padding:24px; max-width:1100px; margin:0 auto; animation:fade-in 0.2s ease;">
    <div style="margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid var(--border);">
      <div style="font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--primary); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:24px; height:2px; background:var(--primary); border-radius:2px;"></span>
        Administration
      </div>
      <div style="display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <h1 style="font-family:var(--font-head); font-size:32px; font-weight:800; letter-spacing:-1px; line-height:1; margin:0; color:var(--text-1);">Base Résidents</h1>
        
        <div id="users-stats-header" style="display:flex; gap:24px; align-items:center;">
          <div class="spinner" style="width:24px; height:24px;"></div>
        </div>
      </div>
    </div>

    <div style="
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      border-radius:20px; margin-bottom:24px; overflow:hidden;
      border:1px solid rgba(255,255,255,0.1);
      box-shadow:0 12px 32px rgba(0,0,0,0.15);
      position:relative;
    ">
      <div style="position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size:24px 24px; pointer-events:none;"></div>

      <div style="padding:16px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.08); position:relative;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 12px #10b981;"></div>
          <span style="font-family:var(--font-head); font-weight:800; color:#fff; font-size:14px; letter-spacing:0.05em; text-transform:uppercase;">Inviter les résidents</span>
        </div>
        <button onclick="if(typeof printQR==='function') printQR()" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:12px; font-weight:700; padding:6px 16px; border-radius:20px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
          🖨️ Affiche PDF
        </button>
      </div>

      <div style="padding:24px; display:flex; gap:32px; align-items:center; flex-wrap:wrap; position:relative;">
        <div id="qr-container" style="flex-shrink:0; border-radius:16px; overflow:hidden; border:4px solid rgba(255,255,255,0.1); background:#fff; padding:8px;"></div>
        
        <div style="flex:1; min-width:200px;">
          <div style="font-family:var(--font-head); font-size:22px; font-weight:800; color:#fff; margin-bottom:8px;">Scan & Rejoins</div>
          <div style="font-size:13px; color:rgba(255,255,255,0.6); margin-bottom:16px; line-height:1.5;">Les résidents scannent ce code pour créer leur compte et rejoindre la copropriété en toute autonomie.</div>
          
          <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
            <div id="register-url-display" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 14px; font-size:12px; font-family:monospace; color:rgba(255,255,255,0.8); word-break:break-all; flex:1;">...</div>
            <button onclick="copyRegisterUrl()" style="background:var(--primary); color:#fff; border:none; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(59,130,246,0.4); flex-shrink:0;">
              📋 Copier le lien
            </button>
          </div>
        </div>
      </div>
      
      <div id="tours-distribution-bar" style="padding:16px 24px; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:20px; flex-wrap:wrap;"></div>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:16px; align-items:center; background:var(--bg-1); padding:12px; border-radius:16px; border:1px solid var(--border);">
      <div style="flex:1; min-width:240px; position:relative;">
        <span style="position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:15px; opacity:0.5;">🔍</span>
        <input type="search" class="input" placeholder="Chercher un nom, email, lot..." 
          oninput="_usersSearch = this.value.toLowerCase(); renderUsersList();"
          style="width:100%; margin:0; padding-left:40px; border-radius:10px;">
      </div>
      
      <select class="select" style="min-width:160px; margin:0; padding-top:10px; padding-bottom:10px;" onchange="_usersFilterRole = this.value; renderUsersList();">
        <option value="all">Tous les rôles</option>
        <option value="administrateur">Administrateurs</option>
        <option value="syndic">Syndics</option>
        <option value="membre_cs">Conseil Syndical</option>
        <option value="copropriétaire">Copropriétaires</option>
      </select>
      
      <select class="select" id="filter-tour-select" style="min-width:140px; margin:0; padding-top:10px; padding-bottom:10px;" onchange="_usersFilterTour = this.value; renderUsersList();">
        <option value="all">Toutes les tours</option>
        </select>
    </div>

    <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
      
      <div style="padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg-2); display:grid; grid-template-columns:2.5fr 1.5fr 1fr auto; gap:16px; align-items:center;">
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3);">Utilisateur</div>
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3);">Rôle & Tour</div>
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3);">Contact</div>
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); text-align:right;">Actions</div>
      </div>

      <div id="users-list-container">
        <div style="padding:40px; text-align:center;"><div class="spinner"></div></div>
      </div>
      
    </div>
  </div>`;

  // Construction de l'URL d'inscription
  const registerUrl = `${window.location.origin}${window.location.pathname}?register=1`;
  const urlDisplay = $('register-url-display');
  if (urlDisplay) urlDisplay.textContent = registerUrl;
  
  if (typeof generateQR === 'function') {
    setTimeout(() => generateQR(registerUrl), 100); // Petit délai pour laisser le DOM respirer
  }
  
  // Fonction locale pour le bouton copier
  window.copyRegisterUrl = () => {
    navigator.clipboard.writeText(registerUrl).then(() => {
      if (typeof toast === 'function') toast('Lien copié ✓', 'ok');
    });
  };

  // Chargement des données asynchrone
  try {
    const { data: users, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    _usersDataCache = users || [];
    
    // Injecte les options de tours dynamiquement
    const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];
    const tourSelect = $('filter-tour-select');
    if (tourSelect) {
      listeTours.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        tourSelect.appendChild(opt);
      });
    }

    // Mise à jour des stats du header
    const total = _usersDataCache.length;
    const admins = _usersDataCache.filter(u => ['administrateur','syndic','membre_cs'].includes(u.role)).length;
    const copros = total - admins;
    
    const statsHeader = $('users-stats-header');
    if (statsHeader) {
      statsHeader.innerHTML = `
        <div style="text-align:center;">
          <div style="font-family:var(--font-head); font-size:24px; font-weight:800; color:var(--text-1); line-height:1;">${total}</div>
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-top:4px; font-weight:600;">Total</div>
        </div>
        <div style="width:2px; height:24px; background:var(--border); border-radius:1px;"></div>
        <div style="text-align:center;">
          <div style="font-family:var(--font-head); font-size:24px; font-weight:800; color:var(--primary); line-height:1;">${admins}</div>
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-top:4px; font-weight:600;">Gestion</div>
        </div>
        <div style="width:2px; height:24px; background:var(--border); border-radius:1px;"></div>
        <div style="text-align:center;">
          <div style="font-family:var(--font-head); font-size:24px; font-weight:800; color:var(--green); line-height:1;">${copros}</div>
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); margin-top:4px; font-weight:600;">Résidents</div>
        </div>`;
    }

    // Mise à jour de la barre de répartition
    const toursDist = $('tours-distribution-bar');
    if (toursDist) {
      toursDist.innerHTML = listeTours.map(t => {
        const cnt = _usersDataCache.filter(u => u.tour === t).length;
        const pct = total > 0 ? Math.min(100, (cnt / total) * 100 * 2) : 0; // x2 pour rendre la barre visible
        return `
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:120px;">
          <div style="font-size:11px; color:rgba(255,255,255,0.6); font-weight:700; white-space:nowrap;">${t}</div>
          <div style="background:rgba(255,255,255,0.1); border-radius:10px; height:6px; flex:1; overflow:hidden;">
            <div style="background:var(--primary); height:100%; width:${pct}%; border-radius:10px; box-shadow:0 0 8px var(--primary);"></div>
          </div>
          <div style="font-size:11px; font-weight:800; color:#fff;">${cnt}</div>
        </div>`;
      }).join('');
    }

    renderUsersList();
    
  } catch (err) {
    const listContainer = $('users-list-container');
    if (listContainer) listContainer.innerHTML = `<div style="padding:40px; text-align:center; color:var(--red);">Erreur lors du chargement des résidents.</div>`;
  }
}

function renderUsersList() {
  const container = $('users-list-container');
  if (!container) return;

  const roleL = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
  const roleColors = { administrateur:'#7c3aed', syndic:'#2563eb', membre_cs:'#ea580c', 'copropriétaire':'#10b981' };
  const avColors = ['#6366f1','#10b981','#f59e0b','#ef4444','#2563eb','#8b5cf6','#ec4899'];
  const getColor = (s) => avColors[(s||'?').charCodeAt(0) % avColors.length];
  const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : [];

  // Filtrage mémoire
  let filtered = _usersDataCache.filter(u => {
    if (_usersFilterRole !== 'all' && u.role !== _usersFilterRole) return false;
    if (_usersFilterTour !== 'all' && u.tour !== _usersFilterTour) return false;
    if (_usersSearch) {
      const q = _usersSearch;
      return (u.nom||'').toLowerCase().includes(q) || 
             (u.prenom||'').toLowerCase().includes(q) || 
             (u.email||'').toLowerCase().includes(q) || 
             (u.lot||'').toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:60px 20px; text-align:center; color:var(--text-3); font-size:14px;">Aucun utilisateur ne correspond à votre recherche.</div>`;
    return;
  }

  const isAdminUser = typeof isAdmin === 'function' ? isAdmin() : false;

  container.innerHTML = filtered.map((u, i) => {
    const initiale = (u.prenom || u.nom || u.email || '?').charAt(0).toUpperCase();
    const avColor = getColor(initiale);
    const rColor = roleColors[u.role] || '#6b7280';
    const nomComplet = typeof displayName === 'function' ? displayName(u.prenom, u.nom, u.email, 'Anonyme') : (u.nom || u.email);
    const safeNom = typeof escHtml === 'function' ? escHtml(nomComplet) : nomComplet;
    const isMe = u.id === (typeof user !== 'undefined' ? user.id : '');

    return `
    <div style="
      padding:16px 20px;
      border-bottom:${i < filtered.length - 1 ? '1px solid var(--border)' : 'none'};
      display:grid; grid-template-columns:2.5fr 1.5fr 1fr auto;
      gap:16px; align-items:center;
      background:var(--bg-1); transition:background 0.2s;
    " onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='var(--bg-1)'">

      <div style="display:flex; align-items:center; gap:14px; min-width:0;">
        <div style="
          width:42px; height:42px; border-radius:12px; flex-shrink:0;
          background:${avColor}15; color:${avColor}; border:1px solid ${avColor}33;
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-head); font-size:18px; font-weight:800;
        ">${initiale}</div>
        
        <div style="min-width:0;">
          <div style="font-weight:800; font-size:14px; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${safeNom} ${isMe ? '<span style="font-size:10px; background:var(--bg-2); padding:2px 6px; border-radius:4px; color:var(--text-3); font-weight:600; margin-left:6px;">VOUS</span>' : ''}
          </div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:${u.actif===false?'var(--red)': 'var(--green)'};">
              ${u.actif===false ? '⊘ Suspendu' : '● Actif'}
            </span>
            ${u.lot ? `<span style="font-size:10px; color:var(--text-3); background:var(--bg-2); padding:2px 6px; border-radius:4px; font-weight:600;">Lot ${escHtml(u.lot)}</span>` : ''}
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        ${!isMe && isAdminUser ? `
        <select class="select" style="font-size:12px; font-weight:600; padding:4px 8px; border-radius:6px; width:fit-content; border-color:${rColor}44; color:${rColor}; background:${rColor}08;" onchange="changeRole('${u.id}', this.value, '${safeNom}')">
          ${['copropriétaire','membre_cs','syndic','administrateur'].map(r => `<option value="${r}" ${r===u.role?'selected':''}>${roleL[r]}</option>`).join('')}
        </select>` : `
        <span style="font-size:11px; font-weight:700; color:${rColor}; background:${rColor}15; padding:3px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.05em; width:fit-content;">${roleL[u.role]||u.role}</span>
        `}
        
        ${isAdminUser ? `
        <select class="select" style="font-size:11px; padding:3px 8px; border-radius:6px; width:fit-content; color:var(--text-2);" onchange="changeTour('${u.id}', this.value)">
          <option value="">— Sans Tour</option>
          ${listeTours.map(t => `<option value="${t}" ${u.tour===t?'selected':''}>${t}</option>`).join('')}
        </select>` : `
        <span style="font-size:12px; color:var(--text-3); font-weight:500;">${u.tour ? '🏢 '+u.tour : '—'}</span>
        `}
      </div>

      <div style="min-width:0;">
        <div style="font-size:12px; font-weight:500; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;" title="${u.email}">✉️ ${u.email}</div>
        ${u.telephone ? `<div style="font-size:12px; font-weight:500; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📞 ${escHtml(u.telephone)}</div>` : ''}
      </div>

      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <div style="font-size:11px; color:var(--text-3); font-weight:500;">
          Inscrit le ${typeof fmtD === 'function' ? fmtD(u.created_at) : new Date(u.created_at).toLocaleDateString()}
        </div>
        ${!isMe && isAdminUser ? `
        <button id="btn-ban-${u.id}" onclick="toggleBan('${u.id}', ${u.actif===false}, '${safeNom}')" style="
          background:${u.actif===false?'var(--green-light)':'transparent'};
          color:${u.actif===false?'var(--green)':'var(--red)'};
          border:1px solid ${u.actif===false?'var(--green-border)':'var(--border)'};
          font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px;
          cursor:pointer; white-space:nowrap; transition:all 0.2s;
        " onmouseover="this.style.background='${u.actif===false?'var(--green-light)':'var(--red-light)'}'; this.style.borderColor='${u.actif===false?'var(--green-border)':'var(--red-border)'}'"
          onmouseout="this.style.background='${u.actif===false?'var(--green-light)':'transparent'}'; this.style.borderColor='${u.actif===false?'var(--green-border)':'var(--border)'}'">
          ${u.actif===false ? '✓ Réactiver' : '⊘ Suspendre'}
        </button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function changeRole(userId, newRole, nomResident) {
  if (!confirm(`Modifier le rôle de ${nomResident} vers : ${newRole} ?\nCela modifiera ses permissions dans l'application.`)) {
    renderUsersList(); // Rétablit l'UI si annulé
    return;
  }
  
  try {
    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;
    
    if (typeof addLog === 'function') await addLog('Rôle modifié', 'user', userId, { newRole });
    
    // MAJ Cache
    const u = _usersDataCache.find(x => x.id === userId);
    if (u) u.role = newRole;
    
    toast('Rôle mis à jour avec succès', 'ok');
    renderUsersList();
  } catch (err) {
    toast('Erreur modification rôle', 'err');
  }
}

async function toggleBan(userId, isBanned, nom) {
  const newActif = isBanned; // si suspendu → réactiver (true), si actif → suspendre (false)
  const action = newActif ? 'réactiver' : 'suspendre';
  
  if (!confirm(`Voulez-vous vraiment ${action} l'accès de ${nom} à l'application ?`)) return;
  
  const btn = $(`btn-ban-${userId}`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  
  try {
    const { error } = await sb.from('profiles').update({ actif: newActif }).eq('id', userId);
    if (error) throw error;
    
    if (typeof addLog === 'function') await addLog(newActif ? 'Compte réactivé' : 'Compte suspendu', 'user', userId, { nom });
    
    // MAJ Cache
    const u = _usersDataCache.find(x => x.id === userId);
    if (u) u.actif = newActif;
    
    toast(`${nom} — compte ${newActif ? 'réactivé ✓' : 'suspendu ⊘'}`, newActif ? 'ok' : 'warn');
    renderUsersList();
    
  } catch (err) {
    toast('Erreur serveur : ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Erreur'; }
  }
}

async function submitInvite() {
  const email = $('inv-email')?.value.trim();
  if (!email) { toast('Adresse e-mail requise', 'err'); return; }
  
  const nom    = $('inv-nom')?.value.trim();
  const prenom = $('inv-prenom')?.value.trim();
  const role   = $('inv-role')?.value || 'copropriétaire';
  const lot    = $('inv-lot')?.value.trim();

  const btn = $('inv-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;vertical-align:middle;"></span>Création…'; }

  try {
    // Stocke l'invitation en attente
    const { error } = await sb.from('invitations').upsert({
      email,
      nom: nom || null,
      prenom: prenom || null,
      role: role,
      lot: lot || null,
    }, { onConflict: 'email' });

    if (error) throw error;

    if (typeof addLog === 'function') await addLog('Invitation créée', 'user', null, { email, role });
    
    if (typeof closeModal === 'function') closeModal('m-invite');
    
    toast(`✅ Invitation enregistrée pour ${email}`, 'ok');
    setTimeout(() => toast('💡 Vous pouvez maintenant envoyer le "Magic Link" depuis Supabase (Auth → Users)', 'warn'), 2500);

  } catch(e) {
    toast('Erreur : ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer l\'invitation'; }
  }
}