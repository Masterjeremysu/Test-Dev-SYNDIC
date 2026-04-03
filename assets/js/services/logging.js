// ── LOGGING ──
async function addLog(action, entite, entite_id, details) {
  await sb.from('journal').insert({
    user_id: user.id,
    user_nom: displayNameFromProfile(profile, user?.email),
    action, entite, entite_id, details
  });
}
