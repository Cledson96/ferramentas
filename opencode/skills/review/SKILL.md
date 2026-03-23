---
name: review
description: "Faz code review completo da branch com foco em padroes, design system, testes e requisitos do Jira. Use quando o usuario pedir revisao tecnica antes de merge."
compatibility: opencode
---

# Skill: Review

Faz code review completo da branch com foco em qualidade e risco: verifica padroes, imports do design system, testes e validacao contra requisitos do card Jira.

## Quando usar

- quando o usuario pedir code review tecnico antes de merge, PR ou deploy
- quando for preciso revisar diff da branch com foco em qualidade, risco e aderencia a padroes
- quando fizer sentido validar implementacao contra requisitos do Jira

## Quando nao usar

- quando o pedido for apenas resumir mudancas sem emitir achados ou recomendacao
- quando a tarefa for corrigir codigo diretamente sem etapa de review
- quando nao houver diff relevante para revisar

## Instruções

Quando houver intenção de review, siga estes passos:

### Passo 1 — Identificar a branch base

1. Execute `git branch -r` para listar as branches remotas
2. Detecte a branch base automaticamente nesta ordem de prioridade:
   - `origin/development` → usar `development`
   - `origin/develop` → usar `develop`
   - `origin/main` → usar `main`
   - `origin/master` → usar `master`
3. Se houver uma base claramente detectada, siga com ela sem interromper o fluxo. So perguntar ao usuario se houver ambiguidade real ou se ele tiver informado outra base.
4. Execute em paralelo:
   - `git branch --show-current` — branch atual
   - `git diff {BASE}...HEAD --stat` — arquivos alterados
   - `git diff {BASE}...HEAD` — diff completo
   - `git log {BASE}..HEAD --oneline` — commits da branch

Se o diff estiver vazio, avisar: "Nenhuma diferença encontrada em relação à `{BASE}`."

### Passo 2 — Buscar requisitos no Jira

1. Extraia o TASK-ID da branch atual (regex: letras maiúsculas + hífen + números — ex: `ENG-123`, `JUS-456`)
2. Se encontrar, use a skill `jira-rest` para buscar o card com `get --issue TASK-ID`:
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
Recomendacao final: {Aprovado | Aprovado com ressalvas | Reprovado}
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

## Politica de delegacao

Mantenha no agente principal:

- sintese final dos findings
- classificacao de severidade
- validacao contra requisitos do Jira
- recomendacao final de merge

Delegar apenas tarefas mecanicas e de baixo risco, como:

- inventario de arquivos alterados
- mapeamento de testes existentes por caminho
- enumeracao inicial de imports, `console.log` e sinais obvios de risco
- levantamento objetivo de arquivos sem cobertura aparente

## Guardrails

- nao aprovar algo sem olhar o diff real da branch
- nao inventar requisito de Jira quando o card nao estiver disponivel
- nao transformar atencao em bloqueador sem evidencia concreta no diff
- nao delegar a redacao final dos findings nem a recomendacao de merge
- se o diff estiver vazio, encerrar cedo e informar que nao ha mudancas para revisar
