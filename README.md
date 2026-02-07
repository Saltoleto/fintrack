# FinTrack — Gestão de Investimentos (React + Supabase + PWA)

FinTrack é uma aplicação de **gestão de investimentos** com foco em **experiência profissional** (web, mobile e desktop),
usando **React**, **Supabase** e **PWA**.

Este repositório é entregue por **Sprints**, sempre com código **completo e funcional**, seguindo padrões e boas práticas.

---

## Features do produto

### Autenticação
- Login
- Criar conta
- Recuperação de senha (envio de link)
- Redefinição de senha (tela dedicada)

### Cadastros
- Investimentos (podem se associar a uma meta)
- Metas
- Concentração desejada por classe

### Visão gerencial (Dashboard)
- Patrimônio total
- Concentração por classe (%)
- Concentração por liquidez (%)
- Metas: valor aportado, valor da meta e progresso

### Mensagens inteligentes
- “Este mês você ainda não realizou nenhum investimento”
- “Com X reais você atinge a meta Y deste mês”
- “Sua carteira está muito concentrada na classe X”

---

## Planejamento por Sprint

### Sprint 0 — Fundação (✅ concluída)
- Setup React + Vite + TS
- Estrutura por domínio
- Design system básico (tokens + componentes base)
- Rotas públicas/privadas + layouts
- Supabase client (infra)
- PWA instalável (manifest + service worker)
- Padronização (lint/prettier/ts strict)

### Sprint 1 — Autenticação real (✅ neste pacote)
- Login real (Supabase Auth)
- Criação de conta real
- Recuperação de senha (envio de link)
- Tela de redefinição de senha
- UX: loading, mensagens e redirecionamentos
- Remoção total de placeholders/alerts na autenticação
- README oficial (este documento)

### Sprint 2 — Modelo de dados + cadastros base (✅ neste pacote)
- SQL completo do projeto (tabelas + constraints + índices)
- RLS (isolamento por usuário)
- **Sem trigger para user_id** (user_id enviado explicitamente pela aplicação)
- CRUD de metas
- CRUD de concentração por classe

### Sprint 3 — Cadastro de investimentos (✅ neste pacote)
- CRUD de investimentos
- Validação de liquidez:
  - `diaria` → sem vencimento
  - `no_vencimento` → vencimento obrigatório
- Associação opcional com metas
- **Atualização de invested_amount da meta feita na aplicação (sem trigger)** por recálculo a partir dos investimentos vinculados
- Filtros básicos (classe e período)

### Sprint 4 — Normalização de Domínio (✅ neste pacote)
- `asset_classes` e `institutions` criadas como entidades (selecionáveis)
- Seed inicial (classes e instituições do Brasil)
- Migração segura de dados existentes:
  - investimentos: `asset_class_id`, `institution_id`
  - concentração: `asset_class_id`
- Frontend refatorado:
  - Classe selecionável (investimentos e concentração)
  - Instituição selecionável (investimentos)
- Documentação atualizada para refletir o acordo e a migração

---

## Banco de dados (Sprint 4)

Este pacote inclui o script SQL da Sprint 4:

- `supabase/schema_sprint4.sql`

### Como aplicar
1) Supabase → **SQL Editor**
2) Execute `supabase/schema_sprint4.sql`
3) Verifique:
   - Tabelas: `asset_classes`, `institutions`
   - Colunas novas:
     - `investments.asset_class_id`
     - `investments.institution_id`
     - `allocation_targets.asset_class_id`
4) A aplicação Sprint 4 passa a usar **somente IDs** (selecionáveis)

### Migração (sem perda)
- O script faz *backfill* dos IDs a partir do texto existente.
- As colunas antigas **não são removidas nesta sprint** para reduzir risco.


---

## Hotfix Sprint 4.1 (Concentração por classe)

Se ao salvar Concentração por Classe você receber:

`23502 null value in column "asset_class" of relation "allocation_targets" violates not-null constraint`

Rode no Supabase (SQL Editor):

- `supabase/hotfix_sprint4_1.sql`

Isso remove o `NOT NULL` das colunas legadas (`asset_class`, `institution_name`) para que o modelo normalizado (IDs) funcione sem bloqueios.

---
### Sprint 5 — Regra de Negócio (Concentração)
- A soma da concentração desejada **não pode ultrapassar 100%**
- Validação dupla:
  - Frontend (UX imediata)
  - RPC no banco (garantia sem trigger)


---

## Hotfix (embeds PostgREST)

Em alguns projetos Supabase/PostgREST, relações embutidas (ex.: `asset_classes(name)`) podem retornar **objeto** ou **array** dependendo da configuração de relacionamento.
Este pacote inclui um helper `embedName()` em `src/utils/embeds.ts` e tipagens mais tolerantes para evitar erros de build.


---
## Sprint 6 — Dashboard Base (✅ Entregue)
- Dashboard `/dashboard` com visão gerencial
- Patrimônio total (soma dos investimentos)
- Concentração por classe: **Real x Alvo**
- Metas com valor aportado, valor da meta e barra com % de atingimento
- Mensagens:
  - “Este mês você ainda não realizou nenhum investimento”
  - “Sua alocação alvo ainda não fecha 100%”
- Estados de UX: loading / vazio / dados
