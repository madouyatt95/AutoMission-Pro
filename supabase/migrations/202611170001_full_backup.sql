begin;

create table if not exists public.documents (
  id uuid primary key,
  nom text not null,
  type text not null check (type in ('carte_grise', 'assurance', 'bon_mission', 'facture', 'autre')),
  data_url text,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  mission_id uuid,
  vehicule_plaque text,
  client_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text primary key check (id = 'global'),
  company_name text not null,
  tva numeric not null check (tva >= 0 and tva <= 100),
  auto_alert_days_facturation integer not null check (auto_alert_days_facturation >= 0),
  auto_alert_days_relance integer not null check (auto_alert_days_relance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_expense_types (
  id text primary key,
  nom text not null check (length(btrim(nom)) > 0),
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.app_settings enable row level security;
alter table public.custom_expense_types enable row level security;

-- Preserve the project's shared, no-login access model selected by its owner.
-- Do not put service-role credentials in the application.
do $$
declare target_table text;
begin
  foreach target_table in array array['documents', 'app_settings', 'custom_expense_types'] loop
    if not exists (
      select 1 from pg_policies where schemaname = 'public'
        and tablename = target_table and policyname = 'app_shared_access'
    ) then
      execute format('create policy app_shared_access on public.%I for all to anon, authenticated using (true) with check (true)', target_table);
    end if;
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', target_table);
  end loop;
end $$;

notify pgrst, 'reload schema';
commit;
