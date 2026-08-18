-- ============================================
-- SCHEMA : Plateforme résidences multi-propriétaires
-- ============================================

-- Extension pour UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE : proprietaires
-- ============================================
create table proprietaires (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid references auth.users(id) on delete cascade unique not null,
  nom text not null,
  telephone text not null,
  email text not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'actif', 'refuse')),
  created_at timestamptz default now()
);

-- ============================================
-- TABLE : admins (comptes admin de la plateforme)
-- ============================================
create table admins (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid references auth.users(id) on delete cascade unique not null,
  nom text not null,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE : residences
-- ============================================
create table residences (
  id uuid primary key default uuid_generate_v4(),
  proprietaire_id uuid references proprietaires(id) on delete cascade not null,
  titre text not null,
  description text,
  adresse text,
  prix_nuit numeric(10, 2) not null,
  capacite int default 1,
  images text[] default '{}',
  video_url text,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'en_attente_validation', 'publie', 'refuse')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE : reservations
-- ============================================
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  residence_id uuid references residences(id) on delete cascade not null,
  client_nom text not null,
  client_telephone text not null,
  client_email text,
  date_arrivee date not null,
  date_depart date not null,
  message text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'confirmee', 'refusee', 'annulee')),
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_residences_proprietaire on residences(proprietaire_id);
create index idx_residences_statut on residences(statut);
create index idx_reservations_residence on reservations(residence_id);
create index idx_reservations_statut on reservations(statut);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table proprietaires enable row level security;
alter table admins enable row level security;
alter table residences enable row level security;
alter table reservations enable row level security;

-- Fonction utilitaire : est-ce l'utilisateur connecté est admin ?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admins where auth_id = auth.uid()
  );
$$ language sql security definer;

-- --- PROPRIETAIRES ---
-- Un propriétaire voit et modifie son propre profil
create policy "Proprietaire voit son profil"
  on proprietaires for select
  using (auth_id = auth.uid() or is_admin());

create policy "Proprietaire modifie son profil"
  on proprietaires for update
  using (auth_id = auth.uid());

-- N'importe qui d'authentifié peut créer son profil propriétaire (inscription libre)
create policy "Inscription libre proprietaire"
  on proprietaires for insert
  with check (auth_id = auth.uid());

-- --- RESIDENCES ---
-- Public : tout le monde voit les résidences publiées
create policy "Public voit residences publiees"
  on residences for select
  using (statut = 'publie' or is_admin() or
    proprietaire_id in (select id from proprietaires where auth_id = auth.uid()));

-- Propriétaire actif gère SES résidences uniquement
create policy "Proprietaire actif cree ses residences"
  on residences for insert
  with check (
    proprietaire_id in (
      select id from proprietaires where auth_id = auth.uid() and statut = 'actif'
    )
  );

create policy "Proprietaire modifie ses residences"
  on residences for update
  using (
    proprietaire_id in (select id from proprietaires where auth_id = auth.uid())
    or is_admin()
  );

create policy "Proprietaire supprime ses residences"
  on residences for delete
  using (
    proprietaire_id in (select id from proprietaires where auth_id = auth.uid())
    or is_admin()
  );

-- --- RESERVATIONS ---
-- Le propriétaire de la résidence voit les résas, l'admin voit tout
create policy "Proprietaire voit reservations de ses residences"
  on reservations for select
  using (
    residence_id in (
      select r.id from residences r
      join proprietaires p on r.proprietaire_id = p.id
      where p.auth_id = auth.uid()
    )
    or is_admin()
  );

-- N'importe quel visiteur (même anonyme) peut créer une demande de réservation
create policy "Public cree une reservation"
  on reservations for insert
  with check (true);

-- Le propriétaire concerné peut mettre à jour le statut (confirmer/refuser)
create policy "Proprietaire gere statut reservations"
  on reservations for update
  using (
    residence_id in (
      select r.id from residences r
      join proprietaires p on r.proprietaire_id = p.id
      where p.auth_id = auth.uid()
    )
    or is_admin()
  );

-- --- ADMINS ---
create policy "Admin voit table admins"
  on admins for select
  using (is_admin());

-- ============================================
-- STORAGE : bucket pour images/vidéos des résidences
-- ============================================
insert into storage.buckets (id, name, public)
values ('residences-media', 'residences-media', true)
on conflict (id) do nothing;

create policy "Public lit les medias"
  on storage.objects for select
  using (bucket_id = 'residences-media');

create policy "Proprietaire connecte upload ses medias"
  on storage.objects for insert
  with check (bucket_id = 'residences-media' and auth.role() = 'authenticated');

create policy "Proprietaire connecte supprime ses medias"
  on storage.objects for delete
  using (bucket_id = 'residences-media' and auth.role() = 'authenticated');
