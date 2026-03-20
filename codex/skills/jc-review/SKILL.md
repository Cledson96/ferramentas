---
name: jc-review
description: "Faz code review completo da branch — padroes, imports do design system, testes e requisitos do Jira. Usar antes de abrir PR.. Use quando o usuario mencionar /jc:review, pedir esse workflow da JusCash ou quiser o comportamento equivalente do plugin jc no Codex."
---

## Uso No Codex

Skill global adaptada do plugin `jc`.

Invocacao original no Claude: `/jc:review`

Invocacao equivalente no Codex: `$jc-review`


# Skill: Review

Faz code review completo da branch antes de abrir PR — verifica padrões, imports do design system, testes e valida contra os requisitos do card Jira.

## Uso

```
/review
```

## Instruções para o Claude

Quando o usuário executar `/review`, siga estes passos:

### Passo 1 — Identificar a branch base

1. Execute `git branch -r` para listar as branches remotas
2. Detecte a branch base automaticamente nesta ordem de prioridade:
   - `origin/development` → usar `development`
   - `origin/develop` → usar `develop`
   - `origin/main` → usar `main`
   - `origin/master` → usar `master`
3. Confirme com o usuário antes de prosseguir:
   ```
   Branch base detectada: `development`. Está correto? (ou informe outra)
   ```
4. Após confirmação, execute em paralelo:
   - `git branch --show-current` — branch atual
   - `git diff {BASE}...HEAD --stat` — arquivos alterados
   - `git diff {BASE}...HEAD` — diff completo
   - `git log {BASE}..HEAD --oneline` — commits da branch

Se o diff estiver vazio, avisar: "Nenhuma diferença encontrada em relação à `{BASE}`."

### Passo 2 — Buscar requisitos no Jira

1. Extraia o TASK-ID da branch atual (regex: letras maiúsculas + hífen + números — ex: `ENG-123`, `JUS-456`)
2. Se encontrar, use `getAccessibleAtlassianResources` para obter o `cloudId`, depois `getJiraIssue` para buscar:
   - `summary` — título da task
   - `description` — descrição com requisitos e critérios de aceite
   - `issuetype.name` — Bug, Story, Task, etc.
3. Analise a descrição do card para extrair critérios de aceite (geralmente listados como bullets ou checkboxes)
4. Se não encontrar TASK-ID ou card, continue sem contexto Jira — não é bloqueador

### Passo 3 — Executar checks em paralelo

Analise o diff completo verificando os seguintes pontos:

**Check A — Design System e Imports**
- Importações diretas de `antd`? → Bloqueador — deve ser `@juscash/design-system`
- Importações de `@ant-design/icons`? → Bloqueador — deve ser `LucideIcons` de `@juscash/design-system`
- Imports relativos com `../../../` muito longos? → Sugerir alias

**Check B — Padrões de código**
- Naming conventions condizentes com o restante do projeto (camelCase, PascalCase, etc.)?
- Funções com mais de 50 linhas? → Sugerir extração
- `console.log`, `console.error`, `debugger` esquecidos? → Remover antes da PR
- Código comentado (blocos de código morto)? → Remover
- Lógica duplicada em mais de um lugar? → Sugerir extração

**Check C — Testes**
- Arquivos de lógica de negócio foram modificados sem testes correspondentes (`*.test.*`, `*.spec.*`)? → Atenção
- Novos fluxos ou funções públicas sem testes? → Atenção
- Testes existentes quebrados pelas mudanças? → Bloqueador

**Check D — Segurança e qualidade**
- Tokens, senhas, chaves de API hardcoded? → Bloqueador
- Variáveis de ambiente acessadas diretamente sem `process.env` ou sem fallback? → Atenção
- Try/catch ausente em operações assíncronas críticas? → Atenção
- Inputs sem validação? → Atenção

### Passo 4 — Validar contra requisitos do Jira

Se o card Jira foi encontrado:
- Para cada critério de aceite identificado na descrição do card, verifique no diff se foi implementado
- Marque `[x]` se encontrar evidência no código, `[ ]` se não encontrar

### Passo 5 — Montar relatório

Apresente o resultado neste formato:

```
## Review — `{nome-da-branch}`
Base: `{branch-base}` | {N} arquivos alterados | {N} commits

### Card Jira: {TASK-ID} — {título} ({tipo})

#### Requisitos do card
- [x] {critério 1 — encontrado no código}
- [ ] {critério 2 — NÃO encontrado no diff}

---

### Aprovado
- Imports todos de `@juscash/design-system`
- Naming conventions consistentes
- {outros checks aprovados}

### Atenção (não bloqueiam PR mas merecem correção)
- `src/components/Form.tsx` linha 45: `console.log` esquecido
- `src/hooks/useUser.ts`: função `handleSubmit` com 60 linhas — considere extrair
- {outros itens}

### Bloqueadores (corrigir antes da PR)
- `src/pages/Login.tsx` linha 12: import direto de `antd` — usar `@juscash/design-system`
- {outros bloqueadores}

---
Pronto para PR? {Sim | Não — corrija os bloqueadores acima}
Após corrigir: execute `$pull-request` para criar a PR.
```

### Passo 6 — Sugerir correções

Para cada item de atenção e bloqueador, ofereça a correção diretamente. Exemplo:

```
Para corrigir o import bloqueador em `src/pages/Login.tsx`:

// Antes
import { Button } from 'antd'

// Depois
import { Button } from '@juscash/design-system'
```

Pergunte ao usuário: "Quer que eu aplique essas correções automaticamente?"
