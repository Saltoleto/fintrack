-- ============================================================
-- FinTrack (Sprint 4) - Normalização de Domínio + Migração
-- ============================================================
-- Objetivo:
-- - Transformar "classe" e "instituição" em entidades (selecionáveis)
-- - Migrar dados existentes (sem perda)
-- - Manter colunas antigas por compatibilidade (não remover nesta sprint)
--
-- Execução:
-- 1) Rode este SQL no Supabase (SQL Editor)
-- 2) A aplicação (Sprint 4) passa a usar as FKs:
--    - investments.asset_class_id
--    - investments.institution_id
--    - allocation_targets.asset_class_id
--
-- Observação:
-- - Sem triggers
-- - RLS de goals/investments/allocation_targets já existe na Sprint 2
-- - Aqui adicionamos RLS para as tabelas de referência (leitura para usuários autenticados)

create extension if not exists pgcrypto;

-- =========================
-- 1) Tabelas de referência
-- =========================
create table if not exists public.asset_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  risk_level text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create index if not exists idx_asset_classes_active on public.asset_classes(active);
create index if not exists idx_institutions_active on public.institutions(active);

-- =========================
-- 2) RLS (somente leitura para authenticated)
-- =========================
alter table public.asset_classes enable row level security;
alter table public.institutions enable row level security;

drop policy if exists "asset_classes_select_all" on public.asset_classes;
create policy "asset_classes_select_all"
on public.asset_classes
for select
to authenticated
using (true);

drop policy if exists "institutions_select_all" on public.institutions;
create policy "institutions_select_all"
on public.institutions
for select
to authenticated
using (true);

-- =========================
-- 3) Seed (Brasil) - idempotente
-- =========================
insert into public.asset_classes (name, risk_level)
values
  ('Renda Fixa','baixo'),
  ('Ações','alto'),
  ('FIIs','medio'),
  ('Fundos','medio'),
  ('Cripto','alto')
on conflict (name) do nothing;

insert into public.institutions (name, type)
values
  ('Itaú','banco'),
  ('Bradesco','banco'),
  ('Nubank','digital'),
  ('BTG','corretora'),
  ('XP','corretora'),
  ('Caixa','banco'),
  ('Banco do Brasil','banco')
on conflict (name) do nothing;

-- =========================
-- 4) Migração: adicionar colunas FK
-- =========================
alter table public.investments add column if not exists asset_class_id uuid;
alter table public.investments add column if not exists institution_id uuid;
alter table public.allocation_targets add column if not exists asset_class_id uuid;


-- =========================
-- 4.1) Compatibilidade (legado): remover NOT NULL das colunas antigas
-- =========================
-- A aplicação a partir da Sprint 4 usa asset_class_id / institution_id.
-- Mantemos as colunas antigas por compatibilidade, mas elas NÃO devem bloquear inserts.
-- Isso resolve o erro: 23502 null value in column "asset_class" (allocation_targets).
alter table public.allocation_targets alter column asset_class drop not null;
alter table public.investments alter column asset_class drop not null;
alter table public.investments alter column institution_name drop not null;

-- =========================
-- 5) Backfill: texto -> entidade
-- =========================
-- INVESTMENTS.asset_class -> asset_class_id
update public.investments i
set asset_class_id = ac.id
from public.asset_classes ac
where i.asset_class_id is null
  and i.asset_class is not null
  and ac.name = i.asset_class;

-- ALLOCATION_TARGETS.asset_class -> asset_class_id
update public.allocation_targets a
set asset_class_id = ac.id
from public.asset_classes ac
where a.asset_class_id is null
  and a.asset_class is not null
  and ac.name = a.asset_class;

-- INVESTMENTS.institution_name -> institution_id
update public.investments i
set institution_id = inst.id
from public.institutions inst
where i.institution_id is null
  and i.institution_name is not null
  and inst.name = i.institution_name;

-- =========================
-- 6) FKs (idempotentes)
-- =========================
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'investments_asset_class_fk'
  ) then
    alter table public.investments
      add constraint investments_asset_class_fk
      foreign key (asset_class_id) references public.asset_classes(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'investments_institution_fk'
  ) then
    alter table public.investments
      add constraint investments_institution_fk
      foreign key (institution_id) references public.institutions(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'allocation_asset_class_fk'
  ) then
    alter table public.allocation_targets
      add constraint allocation_asset_class_fk
      foreign key (asset_class_id) references public.asset_classes(id);
  end if;
end$$;

-- =========================
-- 7) Unicidade para allocation_targets por classe (novo modelo)
-- =========================
-- Mantemos o unique antigo (user_id, asset_class) da Sprint 2 como legado,
-- mas adicionamos um novo unique no modelo normalizado.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'allocation_targets_user_asset_class_id_uniq'
  ) then
    alter table public.allocation_targets
      add constraint allocation_targets_user_asset_class_id_uniq unique (user_id, asset_class_id);
  end if;
end$$;

-- =========================
-- 8) Próximo passo (não executar nesta sprint)
-- =========================
-- Após confirmar que tudo foi migrado e o app está usando IDs,
-- você poderá remover as colunas antigas:
--   alter table public.investments drop column asset_class, drop column institution_name;
--   alter table public.allocation_targets drop column asset_class;
