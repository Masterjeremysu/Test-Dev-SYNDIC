// ════════════════════════════════════════════════════════════════
//  PROFIL UTILISATEUR FEATURE
//  assets/js/features/profile/profile.js
// ════════════════════════════════════════════════════════════════

function renderProfile() {
  const initial = (profile?.prenom || profile?.nom || profile?.email || '?').charAt(0).toUpperCase();
  
  // Sécurisation de l'accès au cache
  const allTickets = (typeof cache !== 'undefined' && cache.tickets) ? cache.tickets : [];
  const mesTickets = allTickets.filter(x => x.auteur_id === user.id);
  const mesOuverts = mesTickets.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const mesResolus = mesTickets.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  
  const roleLabels = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
  const roleColors = { administrateur:'#7c3aed', syndic:'#2563eb', membre_cs:'#ea580c', 'copropriétaire':'#10b981' };
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#2563eb','#8b5cf6','#ec4899'];
  
  const avColor = colors[(initial.charCodeAt(0)) % colors.length] || colors[0];
  const roleColor = roleColors[profile?.role] || '#2563eb';
  
  // Fonction globale displayNameFromProfile présumée existante (helpers.js)
  const nom = typeof displayNameFromProfile === 'function' ? displayNameFromProfile(profile, user?.email) : (profile?.prenom || profile?.nom || 'Utilisateur');
  const taux = mesTickets.length > 0 ? Math.round(mesResolus.length / mesTickets.length * 100) : 0;

  // Sécurisation de la variable globale COPRO
  const listeTours = (typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours : ['Tour 13', 'Tour 15', 'Tour 17', 'Tour 19'];

  $('page').innerHTML = `
  <div style="padding:16px;max-width:560px;margin:0 auto;animation:fade-in .25s ease both;">

    <div style="
      border-radius:20px; overflow:hidden; margin-bottom:20px;
      border:1px solid var(--border);
      background:var(--surface);
      box-shadow:0 8px 24px rgba(0,0,0,.04);
    ">
      <div style="
        background: linear-gradient(135deg, ${avColor}15 0%, ${roleColor}15 100%);
        border-bottom:1px solid var(--border);
        padding:28px 24px 24px;
        position:relative; overflow:hidden;
      ">
        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:${avColor};opacity:.08;filter:blur(10px);"></div>
        <div style="position:absolute;bottom:-20px;left:40px;width:90px;height:90px;border-radius:50%;background:${roleColor};opacity:.08;filter:blur(10px);"></div>

        <div style="display:flex;align-items:center;gap:18px;position:relative;z-index:1;">
          <div style="
            width:76px;height:76px;border-radius:20px;
            background:${avColor};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:32px;font-weight:800;font-family:var(--font-head);
            flex-shrink:0;
            box-shadow:0 8px 24px ${avColor}44;
          ">${initial}</div>
          
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-1);">
              ${escHtml(nom)}
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="
                background:${roleColor}22;color:${roleColor};
                border:1px solid ${roleColor}44;
                font-size:11px;font-weight:700;
                padding:4px 10px;border-radius:20px;
                text-transform:uppercase;letter-spacing:.06em;
              ">${roleLabels[profile?.role] || profile?.role}</span>
              ${profile?.tour ? `<span style="font-size:12px;color:var(--text-2);background:var(--bg-2);border:1px solid var(--border);padding:3px 8px;border-radius:8px;font-weight:500;">🏢 ${escHtml(profile.tour)}</span>` : ''}
              ${profile?.lot ? `<span style="font-size:12px;color:var(--text-2);background:var(--bg-2);border:1px solid var(--border);padding:3px 8px;border-radius:8px;font-weight:500;">🔑 Lot ${escHtml(profile.lot)}</span>` : ''}
            </div>
            <div style="font-size:13px;color:var(--text-3);margin-top:8px;display:flex;align-items:center;gap:4px;">
              ✉️ ${escHtml(user.email)}
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);background:var(--surface);">
        <div style="padding:16px 8px;text-align:center;border-right:1px solid var(--border);">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--orange);line-height:1;margin-bottom:4px;">${mesOuverts.length}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:700;">En cours</div>
        </div>
        <div style="padding:16px 8px;text-align:center;border-right:1px solid var(--border);">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--green);line-height:1;margin-bottom:4px;">${mesResolus.length}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:700;">Résolus</div>
        </div>
        <div style="padding:16px 8px;text-align:center;">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--primary);line-height:1;margin-bottom:4px;">${taux}%</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:700;">Résolution</div>
        </div>
      </div>

      ${mesTickets.length > 0 ? `
      <div style="background:var(--surface);padding:0 24px 16px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:8px;">
          <span>Efficacité globale</span>
          <span>${mesResolus.length} / ${mesTickets.length} tickets</span>
        </div>
        <div style="background:var(--bg-2);border-radius:6px;height:8px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.05);">
          <div style="background:linear-gradient(90deg, var(--primary), var(--accent));height:100%;width:${taux}%;border-radius:6px;transition:width 1s cubic-bezier(.4,0,.2,1);"></div>
        </div>
      </div>` : ''}
    </div>

    <div class="card" style="margin-bottom:20px; border-radius:16px;">
      <div class="card-header" style="padding:16px 20px; border-bottom:1px solid var(--border);">
        <span style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:800;">Mes informations</span>
      </div>
      <div class="card-body" style="padding:20px;">
        
        <div class="fg-row">
          <div class="fg"><label class="label">Prénom</label><input type="text" id="p-prenom" class="input" value="${escHtml(profile?.prenom||'')}" placeholder="Votre prénom"></div>
          <div class="fg"><label class="label">Nom</label><input type="text" id="p-nom" class="input" value="${escHtml(profile?.nom||'')}" placeholder="Votre nom"></div>
        </div>
        
        <div class="fg">
          <label class="label">Téléphone</label>
          <input type="tel" id="p-tel" class="input" value="${escHtml(profile?.telephone||'')}" placeholder="Ex: 06 12 34 56 78">
        </div>
        
        <div class="fg">
          <label class="label">Email <span style="font-weight:400;color:var(--text-3);">(Identifiant)</span></label>
          <input type="email" class="input" value="${escHtml(user.email)}" disabled style="background:var(--bg-2); color:var(--text-3); cursor:not-allowed;">
        </div>
        
        <div class="fg-row" style="margin-top:16px;">
          <div class="fg" style="flex:2;">
            <label class="label">Ma tour 🏢</label>
            <select id="p-tour" class="select" style="width:100%;">
              <option value="">— Choisir —</option>
              ${listeTours.map(t => `<option value="${t}" ${profile?.tour===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="fg" style="flex:1;">
            <label class="label">Lot 🔑</label>
            <input type="text" id="p-lot" class="input" value="${escHtml(profile?.lot||'')}" placeholder="Ex: 148">
          </div>
        </div>
        <div style="font-size:11.5px;color:var(--text-3);margin:-6px 0 16px;background:var(--bg-2);padding:8px 12px;border-radius:8px;">
          💡 En renseignant votre Tour, vous accédez automatiquement au groupe de discussion de votre bâtiment.
        </div>

        <button id="btn-save-profile" class="btn btn-primary" style="width:100%;justify-content:center;height:48px;font-size:15px;border-radius:12px;margin-top:8px;" onclick="saveProfile()">
          Enregistrer les modifications
        </button>
      </div>
    </div>

    <div style="text-align:center;padding:8px 0 24px;display:flex;flex-direction:column;gap:12px;align-items:center;">

      <button class="btn btn-ghost" style="color:var(--text-2); font-weight:600;"
      onclick="localStorage.removeItem('coprosync-feature-tour'); if(typeof showFeatureTour === 'function') showFeatureTour();">
        🎯 Revoir la visite guidée
      </button>

      <button class="btn btn-ghost" style="color:var(--red); font-weight:600; background:var(--red-light); border:1px solid var(--red-border);"
      onclick="if(confirm('Êtes-vous sûr de vouloir vous déconnecter ?')){ sb.auth.signOut().then(() => location.reload()); }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Se déconnecter
      </button>
      
      <div style="font-size:11px; color:var(--text-3); margin-top:16px;">
        CoproSync v2.0 · Résidence Connectée
      </div>
    </div>
    
  </div>`;
}

async function saveProfile() {
  const btn = $('btn-save-profile');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span> Enregistrement...`;
  }

  try {
    const tour = $('p-tour')?.value || profile?.tour || null;
    const lot  = $('p-lot')?.value.trim() || profile?.lot || null;
    const prenom = $('p-prenom')?.value.trim() || null;
    const nom = $('p-nom')?.value.trim() || profile?.nom; // Nom est requis historiquement
    const telephone = $('p-tel')?.value.trim() || null;

    const { error } = await sb.from('profiles').update({
      prenom,
      nom,
      telephone,
      tour,
      lot,
    }).eq('id', user.id);

    if (error) throw error;

    // Auto-rejoindre le groupe de la tour choisie (si la fonction existe)
    if (tour && typeof autoJoinTourGroup === 'function') {
      await autoJoinTourGroup(tour);
    }
    
    // Met à jour l'objet profil global et rafraîchit l'interface de navigation
    if (typeof loadProfile === 'function') await loadProfile();
    if (typeof initUI === 'function') initUI();
    
    toast('Profil mis à jour avec succès ✓', 'ok');
    
    // Re-rendre la page pour refléter les nouveaux noms/tours visuellement
    renderProfile();

  } catch (err) {
    console.error('[Profile Save Error]', err);
    toast('Erreur lors de la sauvegarde : ' + (err.message || 'Réseau indisponible'), 'err');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Enregistrer les modifications';
    }
  }
}