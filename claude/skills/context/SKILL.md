---
name: context
description: "Gera contexto completo do projeto via MCP ai-coders-context e condensa num CLAUDE.md"
disable-model-invocation: true
---

# Skill: Context

Gera contexto completo de um projeto usando o MCP ai-coders-context e condensa num CLAUDE.md.

## Uso

```
/context
```

## Instruções para o Claude

Quando o usuário executar `/context`, siga estes passos:

### Passo 1 — Inicializar contexto via MCP ai-coders-context

Use os gateways do MCP na seguinte ordem:

1. Chamar o gateway `context` com ação `init` — escaneia o projeto e cria a estrutura `.context/`
2. Chamar o gateway `context` com ação `fill` — preenche todos os docs automaticamente (project-overview, architecture, patterns, decisions, data-flow, etc.)
3. Chamar o gateway `agent` com ação `discover` — descobre quais agents são relevantes para o tipo de projeto

Isso gera a pasta `.context/` completa:
```
.context/
├── docs/      → project-overview, architecture, patterns, decisions, data-flow, etc.
├── agents/    → playbooks dos 14 agents especializados
├── plans/     → workflow PREVC
└── skills/    → expertise sob demanda
```

### Passo 2 — Condensar no CLAUDE.md

Disparar 1 agent com modelo Haiku (`model: "haiku"`) para ler os docs em `.context/docs/` e gerar um `CLAUDE.md` conciso na raiz do projeto.

O agent Haiku deve ler estes arquivos (se existirem):
- `.context/docs/project-overview.md`
- `.context/docs/architecture.md`
- `.context/docs/patterns.md`
- `.context/docs/decisions.md`
- `.context/docs/data-flow.md`
- `.context/docs/tooling.md`
- `.context/docs/testing-strategy.md`

E produzir o CLAUDE.md no seguinte formato:

```markdown
# Contexto do Projeto

## Visão geral
{Resumo do project-overview: nome, propósito, o que o projeto faz}

## Tech stack
- Linguagem: {ex: TypeScript}
- Framework: {ex: NestJS}
- Banco: {ex: PostgreSQL com Prisma}
- Testes: {ex: Jest}
- {Outras ferramentas relevantes}

## Arquitetura
{Resumo do architecture: como o sistema está organizado, camadas, módulos}

## Estrutura de pastas
{Árvore principal com descrição de cada pasta-chave, ex:}
- `src/` — código principal
- `src/modules/` — módulos de domínio
- `src/shared/` — utilitários compartilhados
- `tests/` — testes

## Padrões e convenções
{Resumo do patterns:}
- Naming: {camelCase, snake_case, etc.}
- Commits: Conventional Commits com Jira ID (usar skill /commit)
- PRs: template padronizado (usar skill /pr)
- Imports: {absolutos, relativos, aliases}
- {Outros padrões}

## Arquivos-chave
- `src/main.ts` — entry point
- `src/app.module.ts` — módulo raiz
- {outros arquivos importantes com descrição}

## Comandos úteis
- `npm run dev` — dev server
- `npm test` — testes
- `npm run build` — build
- {outros scripts do package.json}

## Decisões técnicas
{Resumo do decisions: escolhas importantes e seus motivos}

## Design System (se o projeto usar @juscash/design-system)
- Importar componentes de `@juscash/design-system` (NUNCA do `antd` direto)
- Ícones: usar `LucideIcons` de `@juscash/design-system`
- Storybook: https://juscash.github.io/design-system/
- Quando receber link do Figma, usar MCP Figma para extrair o design e mapear para componentes da biblioteca
- Ver skill `/design-system` para lista completa de componentes

## Skills disponíveis
- `/commit` — commit padronizado com Conventional Commits + Jira ID
- `/pr` — PR com template e contexto do Jira
- `/context` — regenerar este arquivo

## Workflow de desenvolvimento (MCP ai-coders-context)

Ao receber uma tarefa de código, SEMPRE usar o MCP:

1. **Antes de codar**: gateway `plan` com ação `scaffoldPlan` — criar plano PREVC
2. **Escolher agent**: gateway `agent` com ação `getSequence` — sequência de agents recomendada
3. **Buscar contexto**: gateway `agent` com ação `getDocs` — docs relevantes para o agent
4. **Durante execução**: gateway `plan` com ação `updatePhase` — atualizar fase
5. **Ao finalizar**: gateway `plan` com ação `commitPhase` — registrar no git

Escala adaptativa:
- **Fix simples**: Execution → Validation (pular Planning e Review)
- **Feature pequena**: Planning → Execution → Validation
- **Feature média**: Planning → Review → Execution → Validation
- **Sistema complexo**: Planning → Review → Execution → Validation → Confirmation
```

### Passo 3 — Mostrar resumo e confirmar

Mostre ao usuário:
- Quantos docs foram gerados no `.context/`
- Quais agents foram criados
- Um resumo do CLAUDE.md gerado

Pergunte: "Quer ajustar algo antes de salvar o CLAUDE.md?"

Após confirmação, salvar o `CLAUDE.md` na raiz do projeto.

### Passo 4 — Adicionar ao .gitignore (se necessário)

Se o usuário quiser manter `.context/` fora do git (é grande), sugerir adicionar ao `.gitignore`:
```
.context/
```

O `CLAUDE.md` deve sempre ficar no git (é pequeno e útil para todos).

## Quando usar

- **Projeto novo**: executar `/context` para gerar tudo do zero
- **Projeto existente sem contexto**: executar `/context` para mapear
- **Atualizar contexto**: executar `/context` novamente para regenerar com mudanças
