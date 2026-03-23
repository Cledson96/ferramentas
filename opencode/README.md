# OpenCode Global Kit

Este diretorio agora representa a estrutura final instalada em `~/.config/opencode/`.

## Estado atual

- `agents/` concentra os workflows e especialistas: `review`, `qa-agent`, `devops-agent`, `figma-implement-design`, `start-feature`, `feature-done`, `commit` e `pull-request`
- `tools/` concentra as integracoes e operacoes deterministicas: Jira, Confluence, Project Context e metadados de Git
- `skills/` ficou apenas com conhecimento reutilizavel e guardrails: `design-system`, `figma`, `playwright`, `confluence-docs` e `onboarding`
- `config/` substitui a antiga pasta `plugin/` para os arquivos globais de configuracao

## Estrutura

- `agents/` - agentes e subagents especializados
- `tools/` - custom tools tipadas
- `skills/` - skills reutilizaveis e enxutas
- `support/` - scripts internos usados pelas tools
- `config/` - configs globais do OpenCode
- `scripts/install-global.js` - instalador global com backup e dry-run

## O que mudou

- workflows longos e especialistas sairam de `skills/` e viraram agents
- wrappers operacionais sairam de markdown e viraram custom tools
- arquivos de configuracao foram consolidados em `config/`

## Instalar no OpenCode global

```bash
node ./opencode/scripts/install-global.js install
```

## Dry-run

```bash
node ./opencode/scripts/install-global.js install --dry-run
```

## Status

```bash
node ./opencode/scripts/install-global.js status
```

## Observacoes

- o instalador faz backup antes de sobrescrever arquivos gerenciados
- `config/opencode.jsonc` e mesclado com `~/.config/opencode/opencode.json`
- `support/` existe para manter implementacoes internas das tools fora dos prompts
- `MIGRATION-PLAN.md` registra o status da reorganizacao
