function renderProfile() {
  const initial = (profile?.prenom||profile?.nom||profile?.email||'?').charAt(0).toUpperCase();
  const mesTickets = cache.tickets.filter(x => x.auteur_id === user.id);
  const mesOuverts = mesTickets.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const mesResolus = mesTickets.filter(x => x.statut === 'résolu' || x.statut === 'clos');
  const roleLabels = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
  const roleColors = { administrateur:'#7c3aed', syndic:'#2563eb', membre_cs:'#ea580c', 'copropriétaire':'#16a34a' };
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#2563eb','#8b5cf6','#ec4899'];
  const avColor = colors[(initial.charCodeAt(0)) % colors.length];
  const roleColor = roleColors[profile?.role] || '#2563eb';
  const nom = displayNameFromProfile(profile, user?.email);
  const taux = mesTickets.length > 0 ? Math.round(mesResolus.length / mesTickets.length * 100) : 0;

  $('page').innerHTML = `
  <div style="padding:16px;max-width:540px;animation:pageIn .25s ease both;">

    <!-- HERO CARD IMMERSIF -->
    <div style="
      border-radius:20px; overflow:hidden; margin-bottom:16px;
      border:1px solid var(--border);
      box-shadow:0 8px 32px rgba(0,0,0,.08);
    ">
      <!-- Fond héro avec dégradé personnalisé -->
      <div style="
        background: linear-gradient(135deg, ${avColor}22 0%, ${roleColor}18 100%);
        border-bottom:1px solid var(--border);
        padding:28px 24px 24px;
        position:relative; overflow:hidden;
      ">
        <!-- Cercles décoratifs -->
        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:${avColor};opacity:.06;"></div>
        <div style="position:absolute;bottom:-20px;left:60px;width:80px;height:80px;border-radius:50%;background:${roleColor};opacity:.08;"></div>

        <!-- Avatar + nom -->
        <div style="display:flex;align-items:center;gap:16px;position:relative;z-index:1;">
          <div style="
            width:72px;height:72px;border-radius:18px;
            background:${avColor};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:30px;font-weight:800;font-family:var(--font-head);
            flex-shrink:0;
            box-shadow:0 8px 24px ${avColor}55;
          ">${initial}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(nom)}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="
                background:${roleColor}22;color:${roleColor};
                border:1px solid ${roleColor}44;
                font-size:11px;font-weight:700;
                padding:3px 10px;border-radius:20px;
                text-transform:uppercase;letter-spacing:.06em;
              ">${roleLabels[profile?.role]||profile?.role}</span>
              ${profile?.tour ? `<span style="font-size:12px;color:var(--text-3);background:var(--surface-2);border:1px solid var(--border);padding:2px 8px;border-radius:10px;">🏢 ${profile.tour}</span>` : ''}
              ${profile?.lot ? `<span style="font-size:12px;color:var(--text-3);background:var(--surface-2);border:1px solid var(--border);padding:2px 8px;border-radius:10px;">🔑 Lot ${profile.lot}</span>` : ''}
            </div>
            <div style="font-size:11.5px;color:var(--text-3);margin-top:6px;">${user.email}</div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);background:var(--surface);">
        <div style="padding:16px;text-align:center;border-right:1px solid var(--border);">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--orange);line-height:1;margin-bottom:4px;">${mesOuverts.length}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:600;">En cours</div>
        </div>
        <div style="padding:16px;text-align:center;border-right:1px solid var(--border);">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--green);line-height:1;margin-bottom:4px;">${mesResolus.length}</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:600;">Résolus</div>
        </div>
        <div style="padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--accent);line-height:1;margin-bottom:4px;">${taux}%</div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:600;">Résolution</div>
        </div>
      </div>

      <!-- Barre de progression -->
      ${mesTickets.length > 0 ? `
      <div style="background:var(--surface);padding:0 20px 14px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">
          <span>Taux de résolution</span>
          <span>${mesResolus.length}/${mesTickets.length}</span>
        </div>
        <div style="background:var(--surface-2);border-radius:4px;height:6px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,var(--green),#34d399);height:100%;width:${taux}%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1);"></div>
        </div>
      </div>` : ''}
    </div>

    <!-- FORMULAIRE -->
    <div class="card" style="margin-bottom:12px;">
      <div class="card-header" style="padding:14px 16px;">
        <span class="card-title" style="font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);font-weight:700;">Mes informations</span>
      </div>
      <div class="card-body">
        <div class="fg-row">
          <div class="fg"><label class="label">Prénom</label><input type="text" id="p-prenom" class="input" value="${escHtml(profile?.prenom||'')}" placeholder="Prénom"></div>
          <div class="fg"><label class="label">Nom</label><input type="text" id="p-nom" class="input" value="${escHtml(profile?.nom||'')}" placeholder="Nom"></div>
        </div>
        <div class="fg"><label class="label">Téléphone</label><input type="tel" id="p-tel" class="input" value="${escHtml(profile?.telephone||'')}" placeholder="+33 6 ..."></div>
        <div class="fg">
          <label class="label">Email</label>
          <input type="email" class="input" value="${user.email}" disabled style="opacity:.5;cursor:not-allowed;">
          <div style="font-size:11px;color:var(--text-3);margin-top:4px;">Non modifiable</div>
        </div>
        <div class="fg">
          <label class="label">Ma tour 🏠</label>
          <select id="p-tour" class="select" style="width:100%;">
            <option value="">— Choisir ma tour —</option>
            ${COPRO.tours.map(t => `<option value="${t}" ${profile?.tour===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <div style="font-size:11px;color:var(--text-3);margin-top:4px;">Vous rejoindrez le groupe de messagerie de votre tour</div>
        </div>
        <div class="fg">
          <label class="label">Numéro de lot</label>
          <input type="text" id="p-lot" class="input" value="${escHtml(profile?.lot||'')}" placeholder="Ex: 148">
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px;height:46px;font-size:14px;border-radius:12px;" onclick="saveProfile()">
          Enregistrer les modifications
        </button>
      </div>
    </div>

    <!-- ACTIONS -->
    <div style="text-align:center;padding:8px 0 4px;display:flex;flex-direction:column;gap:8px;align-items:center;">

      <!-- Visite guidée -->
      <button style="
        background:none;border:1px solid var(--border);
        color:var(--text-2);font-size:13px;font-weight:600;
        padding:10px 20px;border-radius:10px;cursor:pointer;
        transition:all .15s;font-family:var(--font-body);
        display:inline-flex;align-items:center;gap:8px;
      "
      onmouseover="this.style.background='var(--surface-2)';this.style.borderColor='var(--border-strong)'"
      onmouseout="this.style.background='none';this.style.borderColor='var(--border)'"
      onclick="localStorage.removeItem('coprosync-feature-tour');showFeatureTour();">
        🎯 Revoir la visite guidée
      </button>

      <!-- Déconnexion -->
      <button style="
        background:none;border:1px solid var(--border);
        color:var(--red);font-size:13px;font-weight:600;
        padding:10px 20px;border-radius:10px;cursor:pointer;
        transition:all .15s;font-family:var(--font-body);
        display:inline-flex;align-items:center;gap:8px;
      "
      onmouseover="this.style.background='var(--red-light)';this.style.borderColor='var(--red-border)'"
      onmouseout="this.style.background='none';this.style.borderColor='var(--border)'"
      onclick="if(confirm('Se déconnecter ?')){sb.auth.signOut().then(()=>location.reload())}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Se déconnecter
      </button>
    </div>
  </div>`;
}

async function saveProfile() {
  const tour = $('p-tour')?.value || profile?.tour || null;
  const lot  = $('p-lot')?.value.trim() || profile?.lot || null;
  const { error } = await sb.from('profiles').update({
    prenom:    $('p-prenom')?.value.trim() || null,
    nom:       $('p-nom')?.value.trim() || profile?.nom,
    telephone: $('p-tel')?.value.trim() || null,
    tour, lot,
  }).eq('id', user.id);
  if (error) { toast('Erreur sauvegarde', 'err'); return; }
  // Auto-rejoindre le groupe de la tour choisie
  if (tour) await autoJoinTourGroup(tour);
  await loadProfile();
  initUI();
  toast('Profil mis à jour ✓', 'ok');
}

// ── QR CODE & INSCRIPTION ──
