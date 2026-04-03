-- ================================================================
-- COPROSYNC — Schéma Supabase complet
-- Coller dans SQL Editor > New Query > Run
-- ================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ================================================================
-- TABLE PROFILES (liée à auth.users)
-- ================================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nom text not null,
  prenom text,
  telephone text,
  role text not null default 'copropriétaire' check (role in ('administrateur', 'syndic', 'membre_cs', 'copropriétaire')),
  lot text,                          -- numéro de lot
  batiment text,                     -- bâtiment du copropriétaire
  avatar_url text,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index
create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);

-- RLS
alter table public.profiles enable row level security;

-- Tout utilisateur connecté peut voir les profils (nom, role) - nécessaire pour affichage
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Chacun peut modifier son propre profil
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Seul admin peut créer/supprimer des profils
create policy "profiles_insert_admin" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur')
    or auth.uid() = id  -- allow own profile creation on signup
  );

-- ================================================================
-- TABLE TICKETS
-- ================================================================
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  reference text generated always as ('TK-' || substr(id::text, 1, 6)) stored,
  titre text not null,
  description text,
  batiment text not null,
  zone text,                          -- étage, cage, local...
  urgence text not null default 'normal' check (urgence in ('critique', 'important', 'normal')),
  statut text not null default 'nouveau' check (statut in ('nouveau', 'en_cours', 'transmis_syndic', 'attente_intervention', 'résolu', 'clos')),
  categorie text default 'autre' check (categorie in ('fuite', 'electricite', 'ascenseur', 'securite', 'proprete', 'serrurerie', 'espaces_verts', 'autre')),
  photo_url text,
  lat float8,
  lng float8,
  auteur_id uuid references public.profiles(id),
  assigne_a uuid references public.profiles(id),
  date_echeance date,
  note_interne text,                  -- visible syndic + admin seulement
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index tickets_statut_idx on public.tickets(statut);
create index tickets_urgence_idx on public.tickets(urgence);
create index tickets_auteur_idx on public.tickets(auteur_id);
create index tickets_batiment_idx on public.tickets(batiment);

alter table public.tickets enable row level security;

-- SELECT: tous les connectés voient tous les tickets
create policy "tickets_select" on public.tickets
  for select using (auth.role() = 'authenticated');

-- INSERT: tout utilisateur connecté peut créer
create policy "tickets_insert" on public.tickets
  for insert with check (auth.uid() = auteur_id);

-- UPDATE: auteur, admin, syndic, membre_cs
create policy "tickets_update" on public.tickets
  for update using (
    auth.uid() = auteur_id
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
  );

-- DELETE: admin seulement
create policy "tickets_delete" on public.tickets
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur')
  );

-- ================================================================
-- TABLE COMMENTAIRES
-- ================================================================
create table public.commentaires (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  auteur_id uuid references public.profiles(id) not null,
  texte text not null,
  prive boolean default false,       -- si true: visible syndic/admin seulement
  created_at timestamptz default now()
);

alter table public.commentaires enable row level security;

create policy "commentaires_select" on public.commentaires
  for select using (
    auth.role() = 'authenticated'
    and (
      prive = false
      or exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
    )
  );

create policy "commentaires_insert" on public.commentaires
  for insert with check (auth.uid() = auteur_id);

create policy "commentaires_delete" on public.commentaires
  for delete using (
    auth.uid() = auteur_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur')
  );

-- ================================================================
-- TABLE CONTRATS
-- ================================================================
create table public.contrats (
  id uuid default uuid_generate_v4() primary key,
  fournisseur text not null,
  type_contrat text not null,
  description text,
  date_debut date,
  date_echeance date not null,
  contact_nom text,
  contact_tel text,
  contact_email text,
  montant_annuel numeric(12,2),
  document_url text,
  notes text,
  alerte_jours int default 90,       -- alerter X jours avant échéance
  actif boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contrats enable row level security;

create policy "contrats_select" on public.contrats
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
  );

create policy "contrats_all_admin" on public.contrats
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic'))
  );

-- ================================================================
-- TABLE CLÉS
-- ================================================================
create table public.cles (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  description text,
  statut text default 'disponible' check (statut in ('disponible', 'sortie', 'perdue')),
  detenteur_id uuid references public.profiles(id),
  detenteur_nom text,                -- fallback si non-inscrit
  date_sortie timestamptz,
  date_retour_prevue date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.cles_historique (
  id uuid default uuid_generate_v4() primary key,
  cle_id uuid references public.cles(id) on delete cascade,
  action text not null,              -- 'sortie' | 'retour' | 'perte'
  personne_id uuid references public.profiles(id),
  personne_nom text,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.cles enable row level security;
alter table public.cles_historique enable row level security;

create policy "cles_select" on public.cles
  for select using (auth.role() = 'authenticated');

create policy "cles_manage" on public.cles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
  );

create policy "cles_hist_select" on public.cles_historique
  for select using (auth.role() = 'authenticated');

create policy "cles_hist_insert" on public.cles_historique
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
  );

-- ================================================================
-- TABLE JOURNAL (audit log immuable)
-- ================================================================
create table public.journal (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  user_nom text,
  action text not null,
  entite text,                       -- 'ticket' | 'contrat' | 'cle' | 'auth'
  entite_id text,
  details jsonb,
  ip text,
  created_at timestamptz default now()
);

alter table public.journal enable row level security;

-- Journal: insert pour tous, select pour admin/syndic/membre_cs, jamais de update/delete
create policy "journal_insert" on public.journal
  for insert with check (true);

create policy "journal_select" on public.journal
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'syndic', 'membre_cs'))
  );

-- ================================================================
-- TABLE NOTIFICATIONS (queue pour emails)
-- ================================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  destinataire_id uuid references public.profiles(id),
  destinataire_email text not null,
  sujet text not null,
  corps text not null,
  type text,                         -- 'nouveau_ticket' | 'statut_change' | 'commentaire' | etc.
  reference_id uuid,                 -- id du ticket/contrat concerné
  lu boolean default false,
  envoye boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "notif_own" on public.notifications
  for select using (destinataire_id = auth.uid());

create policy "notif_insert" on public.notifications
  for insert with check (true);

create policy "notif_update_own" on public.notifications
  for update using (destinataire_id = auth.uid());

-- ================================================================
-- STORAGE BUCKET pour photos
-- ================================================================
insert into storage.buckets (id, name, public) values ('tickets', 'tickets', true) on conflict do nothing;

create policy "tickets_storage_select" on storage.objects
  for select using (bucket_id = 'tickets');

create policy "tickets_storage_insert" on storage.objects
  for insert with check (bucket_id = 'tickets' and auth.role() = 'authenticated');

create policy "tickets_storage_delete" on storage.objects
  for delete using (bucket_id = 'tickets' and auth.role() = 'authenticated');

-- ================================================================
-- FUNCTION: mise à jour automatique updated_at
-- ================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at before update on public.tickets for each row execute function update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();
create trigger contrats_updated_at before update on public.contrats for each row execute function update_updated_at();

-- ================================================================
-- FUNCTION: création profil automatique à l'inscription
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nom, prenom, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'prenom',
    coalesce(new.raw_user_meta_data->>'role', 'copropriétaire')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- VIEWS UTILES
-- ================================================================

-- Vue tickets avec infos auteur
create or replace view public.v_tickets as
select
  t.*,
  p.nom as auteur_nom,
  p.prenom as auteur_prenom,
  p.lot as auteur_lot,
  a.nom as assigne_nom
from public.tickets t
left join public.profiles p on t.auteur_id = p.id
left join public.profiles a on t.assigne_a = a.id;

-- Vue stats dashboard
create or replace view public.v_stats as
select
  count(*) filter (where statut != 'résolu' and statut != 'clos') as ouverts,
  count(*) filter (where urgence = 'critique' and statut != 'résolu' and statut != 'clos') as critiques,
  count(*) filter (where statut = 'transmis_syndic') as en_attente_syndic,
  count(*) filter (where statut = 'résolu' or statut = 'clos') as resolus,
  count(*) as total
from public.tickets;

-- ================================================================
-- DONNÉES INITIALES — Bâtiments (optionnel, adapter à votre résidence)
-- ================================================================
-- Vous pouvez ajouter votre premier admin directement dans Supabase Auth
-- puis mettre à jour son rôle :
-- UPDATE public.profiles SET role = 'administrateur' WHERE email = 'votre@email.com';
