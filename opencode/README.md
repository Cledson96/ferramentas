# OpenCode Global Kit

Este diretorio agora representa a estrutura final instalada em `~/.config/opencode/`.

## Estrutura

- `agents/` - agentes e subagents especializados
- `tools/` - custom tools tipadas
- `skills/` - skills reutilizaveis e enxutas
- `support/` - scripts internos usados pelas tools
- `config/` - configs globais do OpenCode
- `scripts/install-global.js` - instalador global com backup e dry-run

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
