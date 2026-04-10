// ════════════════════════════════════════════════════════════════════════════
//  REGISTRE — COUCHE DATA SUPABASE
//  assets/js/features/registre/registre-data.js
//
//  Importe ce fichier AVANT registre.js
//  `sb` = ton client Supabase déjà initialisé (createClient)
// ════════════════════════════════════════════════════════════════════════════
 
// ── ZONES ────────────────────────────────────────────────────────────────────
 
async function dbGetZones(copro_id) {
  const { data, error } = await sb
    .from('zones')
    .select('*')
    .eq('copro_id', copro_id)
    .eq('actif', true)
    .order('created_at');
  if (error) throw error;
  return data;
}
 
async function dbCreateZone(copro_id, { nom, icone }) {
  const { data, error } = await sb
    .from('zones')
    .insert({ copro_id, nom, icone })
    .select()
    .single();
  if (error) throw error;
  return data;
}
 
async function dbUpdateZone(id, { nom, icone }) {
  const { data, error } = await sb
    .from('zones')
    .update({ nom, icone })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
 
async function dbDeleteZone(id) {
  const { error } = await sb
    .from('zones')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw error;
}
 
// ── PRESTATAIRES ─────────────────────────────────────────────────────────────
 
async function dbGetPrestataires(copro_id) {
  const { data, error } = await sb
    .from('prestataires')
    .select(`
      *,
      missions (
        *,
        missions_zones ( zone_id )
      )
    `)
    .eq('copro_id', copro_id)
    .eq('actif', true)
    .order('nom');
  if (error) throw error;
  // Normalise missions_zones → zones: ['z1', 'z2']
  return data.map(p => ({
    ...p,
    missions: (p.missions || []).map(m => ({
      ...m,
      zones: (m.missions_zones || []).map(mz => mz.zone_id),
      missions_zones: undefined,
    })),
  }));
}
 
async function dbUpsertPrestataire(copro_id, presta) {
  const { missions, ...fields } = presta;
  const isNew = !fields.id;
 
  // 1. Upsert prestataire
  const { data: saved, error } = await sb
    .from('prestataires')
    .upsert({ ...fields, copro_id })
    .select()
    .single();
  if (error) throw error;
 
  // 2. Sync missions si fournies
  if (missions) {
    // Supprime les anciennes missions (cascade supprime missions_zones)
    await sb.from('missions').delete().eq('prestataire_id', saved.id);
 
    for (const m of missions) {
      const { zones, ...mFields } = m;
      const { data: savedM, error: mErr } = await sb
        .from('missions')
        .insert({ ...mFields, prestataire_id: saved.id, id: undefined })
        .select()
        .single();
      if (mErr) throw mErr;
 
      // Liaison zones
      if (zones?.length) {
        const links = zones.map(zone_id => ({ mission_id: savedM.id, zone_id }));
        const { error: zErr } = await sb.from('missions_zones').insert(links);
        if (zErr) throw zErr;
      }
    }
  }
 
  return saved;
}
 
async function dbDeletePrestataire(id) {
  const { error } = await sb
    .from('prestataires')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw error;
}
 
// ── PASSAGES ─────────────────────────────────────────────────────────────────
 
// Récupère le registre enrichi via la vue v_registre
async function dbGetPassages(copro_id, { limit = 100, status = null } = {}) {
  let q = sb
    .from('v_registre')
    .select('*')
    .eq('copro_id', copro_id)
    .order('arrivee', { ascending: false })
    .limit(limit);
 
  if (status) q = q.eq('status', status);
 
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
 
// Enregistre une arrivée (scan QR — côté page publique via Edge Function)
async function dbScanArrivee({ copro_id, prestataire_id, mission_id, zone_id, nom_intervenant }) {
  // Vérifie qu'il n'y a pas déjà un passage en cours sur cette zone
  const { data: existing } = await sb
    .from('passages')
    .select('id')
    .eq('zone_id', zone_id)
    .eq('status', 'en_cours')
    .maybeSingle();
 
  if (existing) throw new Error('Un passage est déjà en cours sur cette zone.');
 
  const { data, error } = await sb
    .from('passages')
    .insert({ copro_id, prestataire_id, mission_id, zone_id, nom_intervenant, status: 'en_cours' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
 
// Enregistre un départ (scan QR)
async function dbScanDepart(zone_id) {
  const { data: passage, error: findErr } = await sb
    .from('passages')
    .select('id')
    .eq('zone_id', zone_id)
    .eq('status', 'en_cours')
    .order('arrivee', { ascending: false })
    .limit(1)
    .maybeSingle();
 
  if (findErr) throw findErr;
  if (!passage) throw new Error('Aucun passage en cours sur cette zone.');
 
  const { data, error } = await sb
    .from('passages')
    .update({ depart: new Date().toISOString() })
    .eq('id', passage.id)
    .select()
    .single();
  // Note : le trigger detect_anomalie() calcule le statut automatiquement
  if (error) throw error;
  return data;
}
 
// Saisie manuelle d'un passage complet (syndic / membre CS)
async function dbPointageManuel({ copro_id, prestataire_id, mission_id, zone_id, arrivee, depart, nom_intervenant, note }) {
  const { data, error } = await sb
    .from('passages')
    .insert({
      copro_id, prestataire_id, mission_id, zone_id,
      arrivee, depart,
      nom_intervenant,
      note,
      status: 'termine',
      valide_par:       (await sb.auth.getUser()).data.user?.id,
      valide_at:        new Date().toISOString(),
      motif_validation: 'saisie_manuelle',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
 
// Validation manuelle d'un passage manquant / anomalie
async function dbValiderPassage(passage_id, { heure_arrivee, heure_depart, motif, note }) {
  // Recalcule les timestamps en gardant la date du passage original
  const { data: original } = await sb
    .from('passages')
    .select('arrivee')
    .eq('id', passage_id)
    .single();
 
  const base = original.arrivee.slice(0, 10); // YYYY-MM-DD
  const newArrivee = `${base}T${heure_arrivee}:00`;
  const newDepart  = `${base}T${heure_depart}:00`;
 
  const { data, error } = await sb
    .from('passages')
    .update({
      arrivee:          newArrivee,
      depart:           newDepart,
      status:           'termine',
      valide_par:       (await sb.auth.getUser()).data.user?.id,
      valide_at:        new Date().toISOString(),
      motif_validation: motif,
      note,
    })
    .eq('id', passage_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
 
// ── RÉSOLUTION QR TOKEN → ZONE (page publique) ───────────────────────────────
// À appeler depuis une Edge Function (service_role) pour contourner RLS
// Ici version client pour les tests
 
async function dbGetZoneByToken(token) {
  const { data, error } = await sb
    .from('zones')
    .select(`
      *,
      passages (
        id, status, arrivee
      )
    `)
    .eq('qr_token', token)
    .eq('actif', true)
    .single();
  if (error) return null;
  return data;
}
 
// ── REALTIME : écoute les nouveaux passages (pour rafraîchir le tableau) ──────
 
function subscribePassages(copro_id, onUpdate) {
  return sb
    .channel('passages-' + copro_id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'passages', filter: `copro_id=eq.${copro_id}` },
      payload => onUpdate(payload)
    )
    .subscribe();
}
 
// Désabonnement propre
function unsubscribePassages(channel) {
  if (channel) sb.removeChannel(channel);
}
