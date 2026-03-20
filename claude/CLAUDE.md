# JusCash — Regras Globais do Claude Code

Este arquivo configura o Claude Code para todos os projetos da JusCash.
Faz parte do plugin `jc` — instale com `claude --plugin-dir /caminho/para/claude`.

---

## Idioma
- Responder sempre em **portugues**

## Autonomia
- Executar diretamente sem pedir confirmação: commits, edição de arquivos, rodar scripts, instalar dependências, criar branches
- Só interromper quando houver decisão real de negócio/arquitetura ou risco de perda de dados irreversível
- Sem frases como "posso fazer X?", "quer que eu faça Y?" — apenas fazer

## Identidade
- Nunca adicionar `Co-Authored-By`, assinatura do Claude ou qualquer menção ao Claude em commits, PRs, código ou comentários
- O output deve parecer inteiramente do desenvolvedor

## Git — Commits
Padrão: **Conventional Commits** com Jira ID

```
type(scope): descrição curta (TASK-ID)
```

- **Tipos**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`
- **scope**: inferido dos arquivos alterados (pasta/módulo principal)
- **TASK-ID**: extraído da branch atual (ex: `feature/ENG-123-desc` → `ENG-123`). Omitir se não encontrar.
- **Descrição**: imperativo em português ("adiciona", "corrige", "remove"), máx 72 chars

## Git — Pull Requests
Usar template padronizado com contexto do Jira. Executar `/pr` para gerar automaticamente.

## Design System
- Componentes UI: importar de `@juscash/design-system` (NUNCA do `antd` direto)
- Ícones: `LucideIcons` de `@juscash/design-system` (NUNCA `@ant-design/icons`)
- Storybook: https://juscash.github.io/design-system/
- Ao receber link do Figma, usar MCP Figma para extrair o design e mapear para componentes da biblioteca

## Jira
- Organização: https://juscash.atlassian.net
- Usar MCP Atlassian para buscar cards quando disponível
- Link de card: `https://juscash.atlassian.net/browse/{TASK-ID}`

## Contexto de projeto
- Se o projeto não tiver `CLAUDE.md` local, executar `/jc:context` automaticamente para gerar
- O MCP ai-coders-context está disponível para análises profundas

## Documentação de bibliotecas (Context7)
- MCP Context7 (`@upstash/context7-mcp`) disponível automaticamente via plugin `jc`
- Ao implementar código com bibliotecas externas, buscar docs atualizados:
  1. `resolve-library-id` para resolver nome da biblioteca → ID do Context7
  2. `query-docs` para buscar documentação e exemplos de código atualizados
- Usar para: React, Next.js, NestJS, Prisma, e qualquer biblioteca referenciada no card Jira ou package.json
- Não bloquear se Context7 não estiver disponível — usar conhecimento próprio como fallback

## Skills disponíveis (plugin `jc`)
- `/jc:start-feature` — inicia feature: Jira → branch → contexto → Context7 docs → plano
- `/jc:feature-done` — workflow completo pós-feature: review → docs → commit → PR
- `/jc:commit` — gera mensagem de commit padronizada com Jira ID
- `/jc:pr` — cria PR com template e contexto do Jira
- `/jc:review` — code review completo da branch antes de abrir PR
- `/jc:docs` — gera docs locais em `docs/` e sincroniza com Confluence
- `/jc:context` — gera contexto do projeto (CLAUDE.md + .context/)
- `/jc:onboarding` — apresenta o projeto e responde dúvidas de arquitetura
- Design System — ativo automaticamente ao criar componentes UI

## Agents disponíveis (plugin `jc`)
- `@qa-agent` — review profundo, cobertura de testes e critérios do Jira
- `@devops-agent` — checklist de deploy: env vars, migrations, breaking changes, rollback
