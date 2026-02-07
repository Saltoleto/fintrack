-- ============================================================
-- FinTrack (Sprint 2) - Schema + RLS (Sem trigger para user_id)
-- ============================================================
-- Premissas:
-- - Supabase Auth habilitado (auth.users)
-- - user_id SEMPRE enviado explicitamente pela aplicação
-- - RLS garante isolamento total por usuário (auth.uid())

create extension if not exists pgcrypto;

-- =========================
-- TABELA: goals (metas)
-- =========================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_amount numeric(14,2) not null check (target_amount >= 0),
  invested_amount numeric(14,2) not null default 0 check (invested_amount >= 0),
  priority integer not null default 3 check (priority between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goals_created_at on public.goals(created_at);

-- =========================
-- TABELA: allocation_targets
-- =========================
create table if not exists public.allocation_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_class text not null,
  target_percent numeric(5,2) not null check (target_percent >= 0 and target_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_class)
);

create index if not exists idx_allocation_targets_user_id on public.allocation_targets(user_id);

-- =========================
-- TABELA: investments
-- =========================
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  invested_at date not null,
  amount numeric(14,2) not null check (amount > 0),

  asset_class text not null,
  liquidity_type text not null check (liquidity_type in ('diaria', 'no_vencimento')),
  maturity_date date null,
  institution_name text null,

  goal_id uuid null references public.goals (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_maturity_date_required
    check (
      (liquidity_type = 'diaria' and maturity_date is null)
      or
      (liquidity_type = 'no_vencimento' and maturity_date is not null)
    )
);

create index if not exists idx_investments_user_id on public.investments(user_id);
create index if not exists idx_investments_invested_at on public.investments(invested_at);
create index if not exists idx_investments_goal_id on public.investments(goal_id);

-- =========================
-- RLS
-- =========================
alter table public.goals enable row level security;
alter table public.allocation_targets enable row level security;
alter table public.investments enable row level security;

-- GOALS
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
for delete to authenticated
using (auth.uid() = user_id);

-- ALLOCATION_TARGETS
drop policy if exists "allocation_targets_select_own" on public.allocation_targets;
create policy "allocation_targets_select_own" on public.allocation_targets
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "allocation_targets_insert_own" on public.allocation_targets;
create policy "allocation_targets_insert_own" on public.allocation_targets
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "allocation_targets_update_own" on public.allocation_targets;
create policy "allocation_targets_update_own" on public.allocation_targets
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "allocation_targets_delete_own" on public.allocation_targets;
create policy "allocation_targets_delete_own" on public.allocation_targets
for delete to authenticated
using (auth.uid() = user_id);

-- INVESTMENTS
drop policy if exists "investments_select_own" on public.investments;
create policy "investments_select_own" on public.investments
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "investments_insert_own" on public.investments;
create policy "investments_insert_own" on public.investments
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "investments_update_own" on public.investments;
create policy "investments_update_own" on public.investments
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_delete_own" on public.investments
for delete to authenticated
using (auth.uid() = user_id);

-- Observação: sem triggers nesta Sprint.
