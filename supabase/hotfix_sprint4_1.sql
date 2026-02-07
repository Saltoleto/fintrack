-- ============================================================
-- FinTrack - Hotfix Sprint 4.1
-- Corrige inserts no modelo normalizado mantendo colunas legadas
-- ============================================================
-- Erro corrigido:
-- 23502: null value in column "asset_class" of relation "allocation_targets"
--
-- Execute este SQL caso você já tenha rodado o schema_sprint4.sql
-- e esteja recebendo o erro acima ao salvar Concentração por Classe.

alter table public.allocation_targets alter column asset_class drop not null;
alter table public.investments alter column asset_class drop not null;
alter table public.investments alter column institution_name drop not null;
