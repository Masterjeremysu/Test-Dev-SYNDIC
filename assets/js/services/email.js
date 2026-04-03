// ── EMAIL (via Supabase Edge Function ou notification en DB) ──
// ── EMAIL VIA EDGE FUNCTION RESEND ──
const EDGE_URL = 'https://sifjbqtnrfydxcemhsnz.supabase.co/functions/v1/send-email';
const INVITE_URL = 'https://sifjbqtnrfydxcemhsnz.supabase.co/functions/v1/invite-user';

async function sendEmailNotif(type, data) {
  try {
    // 1. Détermine les destinataires selon le type
    let recipients = [];

    if (type === 'nouveau_ticket' || type === 'ticket_critique') {
      // → Tous les managers (admin + CS + syndic)
      const { data: managers } = await sb.from('profiles')
        .select('id, email, nom, prenom')
        .in('role', ['administrateur', 'syndic', 'membre_cs'])
        .eq('actif', true);
      recipients = (managers || []).map(m => m.email).filter(Boolean);

    } else if (type === 'statut_change' || type === 'commentaire') {
      // → L'auteur du ticket (si ce n'est pas soi-même)
      const ticket = cache.tickets.find(t => t.id === data.id);
      if (ticket?.auteur_id && ticket.auteur_id !== user.id) {
        const { data: auteur } = await sb.from('profiles')
          .select('email').eq('id', ticket.auteur_id).single();
        if (auteur?.email) recipients = [auteur.email];
      }
    }

    if (!recipients.length) return;

    // 2. Insère les notifs en base (cloche in-app)
    const notifType = type === 'ticket_critique' ? 'nouveau_ticket' : type;
    const { data: managers2 } = await sb.from('profiles')
      .select('id').in('role', ['administrateur','syndic','membre_cs']).eq('actif', true);
    const notifs = (managers2 || []).filter(m => m.id !== user.id).map(m => ({
      destinataire_id: m.id,
      sujet: { nouveau_ticket:`🚨 Nouveau signalement : ${data.titre}`, ticket_critique:`🔴 URGENT : ${data.titre}`,
               statut_change:`📋 Mis à jour : ${data.titre}`, commentaire:`💬 Commentaire : ${data.titre}` }[type] || type,
      type: notifType, reference_id: data.id, lu: false
    }));
    if (notifs.length) await sb.from('notifications').insert(notifs);

    // 3. Appelle l'Edge Function pour envoyer les vrais emails
    fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPA_KEY}`,
      },
      body: JSON.stringify({
        type: type === 'ticket_critique' ? 'nouveau_ticket' : type,
        to: recipients,
        data: {
          ...data,
          auteur_nom: displayNameFromProfile(profile, user?.email),
        }
      })
    }).then(r => r.json()).then(r => { if (!r.ok) console.warn('[email]', r.error); })
      .catch(e => console.warn('[email]', e.message));

  } catch(e) { console.warn('[sendEmailNotif]', e.message); }
}

async function sendEmailDirect(type, to, data) {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPA_KEY}`,
      },
      body: JSON.stringify({ type, to, data })
    });
    const result = await res.json();
    if (!result.ok) console.warn('[sendEmailDirect]', result.error);
    return result;
  } catch(e) { console.warn('[sendEmailDirect]', e.message); }
}
