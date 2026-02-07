-- ============================================================
-- FinTrack (Sprint 5) - Regra de Negócio
-- Concentração por classe: soma <= 100%
-- Implementação via RPC (sem trigger)
-- ============================================================

create or replace function public.upsert_allocation_target_safe(
  p_user_id uuid,
  p_asset_class_id uuid,
  p_target_percent numeric
)
returns void
language plpgsql
security definer
as $$
declare
  v_current_sum numeric;
begin
  if p_target_percent < 0 or p_target_percent > 100 then
    raise exception 'Percentual inválido';
  end if;

  select coalesce(sum(target_percent), 0)
    into v_current_sum
  from public.allocation_targets
  where user_id = p_user_id
    and asset_class_id <> p_asset_class_id;

  if v_current_sum + p_target_percent > 100 then
    raise exception 'A soma das concentrações não pode ultrapassar 100%%';
  end if;

  insert into public.allocation_targets (user_id, asset_class_id, target_percent)
  values (p_user_id, p_asset_class_id, p_target_percent)
  on conflict (user_id, asset_class_id)
  do update set
    target_percent = excluded.target_percent,
    updated_at = now();
end;
$$;

grant execute on function public.upsert_allocation_target_safe(uuid, uuid, numeric)
to authenticated;
