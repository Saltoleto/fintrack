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

### Sprint 3 — Cadastro de investimentos
- CRUD de investimentos
- Associação opcional a metas
- Listagem e filtros básicos

### Sprint 4 — Dashboard gerencial
- Patrimônio, concentrações, progresso de metas
- UI profissional e responsiva

### Sprint 5 — Mensagens inteligentes
- Regras e insights acionáveis

### Sprint 6 — Polimento e release
- Refinos de UX
- PWA avançado
- Performance e checklist de release

---

## Acordos de projeto (obrigatórios)

1) **Código sempre funcional e completo**
- Toda entrega contém 100% dos arquivos necessários (inclui `.env`, configs, assets e README).
- Projeto deve rodar seguindo apenas as instruções deste README.

2) **Melhores práticas e padrões**
- Arquitetura consistente, separação de responsabilidades e código legível.
- UX consistente (loading/erro/vazio).
- Segurança explícita no Supabase (RLS e regras claras).

3) **Entregar o que foi esperado na sprint**
- Não entregar menos do que o combinado.
- Não ampliar escopo se comprometer estabilidade.
- Mudanças de escopo só com alinhamento explícito.

4) **QA no final de cada sprint (obrigatório)**
Rodar sempre:
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run preview`
Além disso:
- navegação manual nas telas afetadas
- verificação de console sem erros críticos

5) **Antes de iniciar cada sprint, validar o que será entregue**
- objetivo, escopo e entregáveis devem ser aprovados explicitamente antes de codar.

---

## Requisitos
- Node.js 18+ (recomendado 20+)

---

## Como rodar (desenvolvimento)

1) Instale dependências:
```bash
npm install
```

2) Variáveis de ambiente:
- O repositório já acompanha um `.env` com valores placeholder.
- Para usar Supabase real, edite `.env` com os dados do seu projeto:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

3) Rode:
```bash
npm run dev
```

Acesse: http://localhost:5173

---

## PWA
Em dev, o PWA está habilitado.

Em produção:
```bash
npm run build
npm run preview
```

---

## Recuperação e redefinição de senha (Supabase)

O fluxo funciona assim:
1) Em **/forgot**, o sistema envia um link usando `resetPasswordForEmail`.
2) O link redireciona para **/reset-password**, onde o usuário define a nova senha.

### Configuração necessária no Supabase (produção)
No painel do Supabase:
- Auth → URL Configuration
  - **Site URL**: seu domínio (ex.: https://app.seudominio.com)
  - **Redirect URLs**: inclua:
    - `https://seu-dominio.com/reset-password`
    - e/ou a URL do seu ambiente de staging

---

---

## Banco de dados (Sprint 2)

Este pacote inclui o script SQL completo da Sprint 2:

- `supabase/schema_sprint2.sql`

### Como aplicar no Supabase
1) Acesse o painel do Supabase → **SQL Editor**
2) Cole e execute o conteúdo de `supabase/schema_sprint2.sql`
3) Confirme que as tabelas foram criadas:
   - `goals`
   - `allocation_targets`
   - `investments`

### Importante sobre RLS e user_id
- RLS está habilitado e bloqueia acessos fora do próprio usuário.
- **A aplicação envia `user_id` explicitamente** em inserts e updates.
- Se você tentar inserir sem `user_id`, receberá erro de RLS (comportamento esperado).


## Checklist de QA (use para aceite da sprint)

Executar:
```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run preview
```

Validar manualmente:
- `/login` → login com credenciais válidas e inválidas
- `/signup` → criar conta e validar mensagem (com/sem confirmação)
- `/forgot` → solicitar link
- `/reset-password` → atualizar senha via link do e-mail
- rotas privadas redirecionam corretamente para `/login`

Console:
- sem erros críticos
- sem loops de renderização

---

## Scripts úteis
- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run preview`
