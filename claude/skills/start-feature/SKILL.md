---
name: start-feature
description: "Inicia uma feature — busca card Jira, cria branch com o ID, carrega contexto e sugere plano de implementacao"
argument-hint: "[TASK-ID ou URL Jira]"
disable-model-invocation: true
---

# Skill: Start Feature

Prepara o ambiente para iniciar uma feature: busca o card no Jira, cria a branch com o ID da task no nome, carrega o contexto do projeto e sugere um plano de implementação.

## Uso

```
/start-feature
/start-feature ENG-123
/start-feature https://juscash.atlassian.net/browse/ENG-123
```

### Passo 1 — Obter o TASK-ID

Se o usuário passou o ID ou link como argumento, extrair o TASK-ID (regex: `[A-Z]+-\d+`).

Se não passou nenhum argumento, perguntar:
```
Qual é o ID ou link do card Jira que vai trabalhar?
(ex: ENG-123 ou https://juscash.atlassian.net/browse/ENG-123)
```

### Passo 2 — Buscar card no Jira

1. Usar `getAccessibleAtlassianResources` para obter o `cloudId`
2. Usar `getJiraIssue` para buscar:
   - `summary` — título do card
   - `description` — descrição completa com requisitos e critérios de aceite
   - `issuetype.name` — Bug, Story, Task, Spike, etc.
   - `priority.name` — prioridade
   - `assignee` — responsável atual
   - `status.name` — status atual

Mostrar resumo do card:
```
{TASK-ID} — {título}
Tipo: {Story/Bug/Task} | Prioridade: {Alta/Média/Baixa} | Status: {To Do/In Progress}

{descrição resumida — primeiras linhas}
```

### Passo 3 — Verificar branch atual e perguntar sobre nova branch

Executar em paralelo:
- `git branch --show-current` — branch atual
- `git status --short` — se há mudanças não commitadas
- `git branch -r` — branches remotas (para detectar base)

Detectar branch base na ordem: `origin/development` → `origin/develop` → `origin/main` → `origin/master`

Perguntar ao usuário:
```
Branch atual: `{branch-atual}`
Base detectada: `{branch-base}`

Quer criar uma nova branch para esta task?
Nome sugerido: `{tipo}/{TASK-ID}-{slug-do-titulo}`

Confirma este nome ou informe outro?
```

**Regras para gerar o nome da branch:**
- Prefixo baseado no tipo do card:
  - `Story` / `Task` → `feature/`
  - `Bug` → `fix/`
  - `Spike` → `spike/`
  - Outros → `chore/`
- TASK-ID sempre presente: `feature/ENG-123`
- Slug do título: lowercase, espaços → `-`, remover caracteres especiais, máx 40 chars
- Exemplo: `feature/ENG-123-autenticacao-jwt`

Se houver mudanças não commitadas, avisar:
```
Há mudanças não commitadas na branch atual.
Quer commitar ou descartar antes de criar a nova branch?
```

### Passo 4 — Criar a branch (se confirmado)

Após confirmação do nome:

```bash
git checkout -b {nome-da-branch} {branch-base}
```

Confirmar criação:
```
Branch `feature/ENG-123-autenticacao-jwt` criada a partir de `development`
```

Se o usuário optou por não criar branch, continuar na branch atual.

### Passo 5 — Carregar contexto do projeto

Verificar se existe `CLAUDE.md` na raiz do projeto:
- **Se existir**: ler e usar como contexto — mencionar ao usuário que o contexto foi carregado
- **Se não existir CLAUDE.md nem `.context/`**: executar `/jc:context` automaticamente para gerar (seguir regra de autonomia)
- **Se existir CLAUDE.md mas não `.context/`**: usar CLAUDE.md e continuar

Se existir `.context/docs/` (gerado pelo MCP ai-coders-context), ler os docs relevantes para a feature:
- `architecture.md` — entender onde encaixar a implementação
- `patterns.md` — convenções a seguir
- `modules/` — módulos relacionados ao que será implementado

**Detectar tech stack do projeto:**
- Ler `package.json` (campos `dependencies` e `devDependencies`) ou `pyproject.toml`
- Identificar frameworks e bibliotecas principais (React, Next.js, NestJS, Prisma, TypeORM, Zod, etc.)
- Guardar lista para uso no Passo 5.5

### Passo 5.5 — Buscar documentação atualizada via Context7

Usar as ferramentas do Context7 (MCP) para buscar docs relevantes das bibliotecas que serão usadas na feature.

1. **Consolidar bibliotecas relevantes:**
   - Do `package.json`: frameworks e bibliotecas principais do projeto
   - Do card Jira: tecnologias mencionadas no título/descrição (ex: "JWT", "Passport", "Stripe", "Redis", "GraphQL")
   - Limitar a **3-4 bibliotecas mais relevantes** para esta feature específica (filtrar utilitários como lodash, uuid, etc.)

2. **Para cada biblioteca relevante:**
   - Usar `resolve-library-id` do Context7 para resolver o nome da biblioteca para um ID
   - Usar `query-docs` do Context7 com uma query específica baseada no que a feature precisa
     - Exemplo: se o card é sobre autenticação e o projeto usa Passport → query: "authentication middleware setup"
     - Exemplo: se o card é sobre validação e o projeto usa Zod → query: "schema validation with transform"
   - Guardar os snippets de código e exemplos retornados

3. **Se Context7 não estiver disponível** (MCP não registrado, npx falha, rede offline): pular este passo silenciosamente e continuar. Não bloquear o fluxo.

### Passo 6 — Sugerir plano de implementação

Com base no card Jira + contexto do projeto + docs do Context7, sugerir um plano de implementação:

```
## Plano: {TASK-ID} — {título}

### Entendimento
{o que precisa ser feito, baseado na descrição do card}

### Critérios de aceite
- [ ] {critério 1}
- [ ] {critério 2}
- [ ] {critério 3}

### Tech stack relevante para esta feature
- {biblioteca 1} v{versão} — {para que será usada nesta feature}
- {biblioteca 2} v{versão} — {para que será usada nesta feature}

### Referência de APIs/Bibliotecas
{snippets relevantes do Context7, organizados por biblioteca}
{se Context7 não esteve disponível, omitir esta seção}

### Arquivos a criar/modificar (estimativa)
- `src/{modulo}/` — {o que criar/alterar}
- `src/{modulo}/{arquivo}.ts` — {motivo}
- `src/{modulo}/{arquivo}.spec.ts` — testes

### Ordem de implementação sugerida
1. {primeiro passo — ex: criar entidade/model}
2. {segundo passo — ex: criar service com lógica}
3. {terceiro passo — ex: criar controller/route}
4. {quarto passo — ex: adicionar testes}
5. {quinto passo — ex: atualizar docs se necessário}

### Pontos de atenção
- {riscos ou dependências identificados}
- {padrões específicos do projeto a seguir}
- {versões de bibliotecas e possíveis incompatibilidades}
```

Perguntar ao usuário:
```
Quer ajustar algum ponto do plano antes de começar?
Quando terminar a implementação, execute `/feature-done` para review → docs → commit → PR.
```

---

## Resumo do ciclo completo

```
/start-feature ENG-123  →  implementação  →  /feature-done
```
