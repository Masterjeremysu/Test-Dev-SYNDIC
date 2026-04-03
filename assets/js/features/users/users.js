async function autoJoinTourGroup(tour) {
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
  const { error } = await sb.from('profiles').update({ tour }).eq('id', userId);
  if (error) { toast('Erreur tour', 'err'); return; }
  // Auto-rejoindre le groupe de la tour
  const { data: convs } = await sb.from('conversations').select('id,titre');
  const found = (convs||[]).find(c => c.titre.includes(tour));
  if (found) {
    await sb.from('conversation_membres').upsert(
      { conversation_id: found.id, user_id: userId },
      { onConflict: 'conversation_id,user_id' }
    );
  }
  toast('Tour assignée ✓', 'ok');
}

async function renderUsers() {
  const { data: users } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  const roleL = { administrateur:'Administrateur', syndic:'Syndic', membre_cs:'Conseil Syndical', 'copropriétaire':'Copropriétaire' };
  const roleColors = { administrateur:'#7c3aed', syndic:'#2563eb', membre_cs:'#ea580c', 'copropriétaire':'#16a34a' };
  const registerUrl = `${window.location.origin}${window.location.pathname}?register=1`;
  const avColors = ['#6366f1','#10b981','#f59e0b','#ef4444','#2563eb','#8b5cf6','#ec4899'];
  const getColor = (s) => avColors[(s||'?').charCodeAt(0) % avColors.length];

  // Stats rapides
  const total = (users||[]).length;
  const admins = (users||[]).filter(u => ['administrateur','syndic','membre_cs'].includes(u.role)).length;
  const copros = total - admins;
  const tours = COPRO.tours.map(t => ({ t, cnt: (users||[]).filter(u => u.tour === t).length }));

  $('page').innerHTML = `
  <div style="padding:16px;animation:pageIn .25s ease both;">

    <!-- HEADER ÉDITORIAL -->
    <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid var(--border);">
      <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;width:16px;height:1px;background:var(--border-strong);"></span>
        Administration
        <span style="display:inline-block;width:16px;height:1px;background:var(--border-strong);"></span>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <h1 style="font-family:var(--font-head);font-size:clamp(26px,4vw,40px);font-weight:800;letter-spacing:-1.5px;line-height:1;">Utilisateurs</h1>
        <div style="display:flex;gap:20px;align-items:center;padding-bottom:4px;">
          <div style="text-align:center;">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--accent);line-height:1;">${total}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-top:2px;">Total</div>
          </div>
          <div style="width:1px;height:32px;background:var(--border);"></div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--violet);line-height:1;">${admins}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-top:2px;">Gestionnaires</div>
          </div>
          <div style="width:1px;height:32px;background:var(--border);"></div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--green);line-height:1;">${copros}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-top:2px;">Résidents</div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR CODE HERO — sombre et moderne -->
    <div style="
      background:linear-gradient(135deg,#1a1917 0%,#2d2b28 100%);
      border-radius:20px;margin-bottom:16px;overflow:hidden;
      border:1px solid rgba(255,255,255,.08);
      box-shadow:0 8px 32px rgba(0,0,0,.2);
      position:relative;
    ">
      <!-- Grille déco -->
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;"></div>

      <div style="padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);position:relative;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></div>
          <span style="font-family:var(--font-head);font-weight:700;color:#fff;font-size:14px;">Inviter les résidents</span>
        </div>
        <button onclick="printQR()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.6);font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all .15s;font-family:var(--font-body);"
          onmouseover="this.style.background='rgba(255,255,255,.14)'"
          onmouseout="this.style.background='rgba(255,255,255,.08)'">
          🖨️ Affiche PDF
        </button>
      </div>

      <div style="padding:20px 24px;display:flex;gap:24px;align-items:center;flex-wrap:wrap;position:relative;">
        <!-- QR -->
        <div id="qr-container" style="flex-shrink:0;border-radius:12px;overflow:hidden;border:3px solid rgba(255,255,255,.1);"></div>
        <!-- Infos -->
        <div style="flex:1;min-width:180px;">
          <div style="font-family:var(--font-head);font-size:18px;font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.3px;">Scan & Rejoins</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:14px;line-height:1.6;">Les résidents scannent ce code pour créer leur compte en autonomie.</div>
          <!-- URL pill -->
          <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 12px;font-size:11px;font-family:monospace;color:rgba(255,255,255,.5);word-break:break-all;margin-bottom:14px;">${registerUrl}</div>
          <!-- Bouton copier -->
          <button onclick="navigator.clipboard.writeText('${registerUrl}').then(()=>toast('Lien copié ✓','ok'))"
            style="background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font-body);box-shadow:0 4px 14px rgba(37,99,235,.4);transition:all .2s;display:inline-flex;align-items:center;gap:6px;"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(37,99,235,.5)'"
            onmouseout="this.style.transform='';this.style.boxShadow='0 4px 14px rgba(37,99,235,.4)'">
            📋 Copier le lien
          </button>
        </div>
      </div>

      <!-- Répartition par tour -->
      <div style="padding:14px 24px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:16px;flex-wrap:wrap;">
        ${tours.map(({t,cnt}) => `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:11px;color:rgba(255,255,255,.4);font-weight:600;">${t}</div>
            <div style="background:rgba(255,255,255,.1);border-radius:10px;height:4px;width:60px;overflow:hidden;">
              <div style="background:#3b82f6;height:100%;width:${total>0?Math.min(100,cnt/total*100*3):0}%;border-radius:10px;transition:width .6s;"></div>
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,.3);">${cnt}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- LISTE UTILISATEURS — cards style équipe -->
    <div style="
      background:var(--surface);border:1px solid var(--border);
      border-radius:16px;overflow:hidden;
    ">
      <!-- Header -->
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:2fr 1.5fr 1fr auto;gap:12px;align-items:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Utilisateur</div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Rôle · Tour</div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Email</div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Inscrit</div>
      </div>

      <!-- Rows -->
      ${(users||[]).map((u,i) => {
        const initiale = (u.prenom||u.nom||u.email||'?').charAt(0).toUpperCase();
        const avColor = getColor(initiale);
        const rColor = roleColors[u.role] || '#6b6760';
        const nom = displayName(u.prenom, u.nom, u.email, 'Résident');
        return `
        <div style="
          padding:12px 16px;
          border-bottom:${i < (users||[]).length-1 ? '1px solid var(--border)' : 'none'};
          display:grid;grid-template-columns:2fr 1.5fr 1fr auto;
          gap:12px;align-items:center;
          transition:background .12s;
        "
        onmouseover="this.style.background='var(--surface-2)'"
        onmouseout="this.style.background=''">

          <!-- Avatar + nom -->
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <div style="
              width:36px;height:36px;border-radius:10px;flex-shrink:0;
              background:${avColor};color:#fff;
              display:flex;align-items:center;justify-content:center;
              font-family:var(--font-head);font-size:15px;font-weight:800;
              box-shadow:0 3px 8px ${avColor}44;
            ">${initiale}</div>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(nom)}</div>
              <div style="font-size:10px;color:${u.actif===false?'var(--red)':u.actif!==false?'var(--green)':'var(--green)'};font-weight:600;margin-top:1px;text-transform:uppercase;letter-spacing:.05em;">
                ${u.actif===false?'⊘ Suspendu':'● Actif'}
              </div>
            </div>
          </div>

          <!-- Rôle + Tour -->
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${u.id !== user.id && isAdmin() ? `
            <select class="select" style="font-size:11px;padding:4px 8px;width:auto;border-radius:8px;height:auto;" onchange="changeRole('${u.id}',this.value)">
              ${['copropriétaire','membre_cs','syndic','administrateur'].map(r=>
                `<option value="${r}" ${r===u.role?'selected':''}>${roleL[r]}</option>`
              ).join('')}
            </select>` : `<span style="
              background:${rColor}18;color:${rColor};
              border:1px solid ${rColor}33;
              font-size:10px;font-weight:700;
              padding:2px 8px;border-radius:10px;
              text-transform:uppercase;letter-spacing:.05em;
              display:inline-block;width:fit-content;
            ">${roleL[u.role]||u.role}</span>`}
            ${isAdmin() ? `
            <select class="select" style="font-size:11px;padding:3px 8px;width:auto;border-radius:8px;height:auto;" onchange="changeTour('${u.id}',this.value)">
              <option value="">— Tour</option>
              ${COPRO.tours.map(t => `<option value="${t}" ${u.tour===t?'selected':''}>${t}</option>`).join('')}
            </select>` : `<span style="font-size:11px;color:var(--text-3);">${u.tour||'—'}</span>`}
          </div>

          <!-- Email -->
          <div style="font-size:11.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.email}</div>

          <!-- Date + action ban -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <div style="font-size:11px;color:var(--text-3);white-space:nowrap;">${fmtD(u.created_at)}</div>
            ${u.id !== user.id && isAdmin() ? `
            <button onclick="toggleBan('${u.id}',${u.actif===false},'${escHtml(nom)}')" style="
              background:${u.actif===false?'var(--green-light)':'var(--red-light)'};
              color:${u.actif===false?'var(--green)':'var(--red)'};
              border:1px solid ${u.actif===false?'var(--green-border)':'var(--red-border)'};
              font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;
              cursor:pointer;white-space:nowrap;font-family:var(--font-body);
              transition:all .15s;
            ">${u.actif===false?'✓ Réactiver':'⊘ Suspendre'}</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  generateQR(registerUrl);
}

async function changeRole(userId, newRole) {
  const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) { toast('Erreur modification rôle', 'err'); return; }
  await addLog('Rôle modifié', 'user', userId, { newRole });
  toast('Rôle mis à jour', 'ok');
}

async function toggleBan(userId, isBanned, nom) {
  const newActif = isBanned; // si suspendu → réactiver (true), si actif → suspendre (false)
  const action = newActif ? 'réactiver' : 'suspendre';
  if (!confirm(`${newActif ? 'Réactiver' : 'Suspendre'} le compte de ${nom} ?`)) return;
  const { error } = await sb.from('profiles').update({ actif: newActif }).eq('id', userId);
  if (error) { toast('Erreur : ' + error.message, 'err'); return; }
  await addLog(newActif ? 'Compte réactivé' : 'Compte suspendu', 'user', userId, { nom });
  toast(`${nom} — compte ${newActif ? 'réactivé ✓' : 'suspendu ⊘'}`, newActif ? 'ok' : 'warn');
  renderUsers(); // Rafraîchit la liste
}

async function submitInvite() {
  const email = $('inv-email')?.value.trim();
  if (!email) { toast('Email requis', 'err'); return; }
  const nom    = $('inv-nom')?.value.trim();
  const prenom = $('inv-prenom')?.value.trim();
  const role   = $('inv-role')?.value;
  const lot    = $('inv-lot')?.value.trim();

  $('inv-btn').disabled = true;
  $('inv-btn').textContent = 'Création…';

  try {
    // Stocke l'invitation en attente (pas dans profiles — FK vers auth.users)
    const { error } = await sb.from('invitations').upsert({
      email,
      nom: nom || null,
      prenom: prenom || null,
      role: role || 'copropriétaire',
      lot: lot || null,
    }, { onConflict: 'email' });

    if (error) throw new Error(error.message);

    await addLog('Invitation créée', 'user', null, { email, role });
    closeModal('m-invite');
    toast(`✅ Invitation enregistrée pour ${email}`, 'ok');
    setTimeout(() => toast('💡 Envoie maintenant le magic link depuis Supabase → Auth → Users → Invite', 'warn'), 2000);

  } catch(e) {
    toast('Erreur : ' + e.message, 'err');
  } finally {
    $('inv-btn').disabled = false;
    $('inv-btn').textContent = 'Envoyer l\'invitation';
  }
}

// ── NOTIFICATIONS ──
