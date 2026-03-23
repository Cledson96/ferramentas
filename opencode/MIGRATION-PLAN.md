# Migration Plan

## Concluido

- [x] Criar estrutura final com `agents/`, `tools/`, `skills/`, `config/`, `support/` e `scripts/`
- [x] Separar configs globais em `config/`
- [x] Criar installer global com backup, status e dry-run
- [x] Converter Jira, Confluence e Project Context em custom tools
- [x] Criar tools utilitarias para branch base e TASK-ID
- [x] Migrar `review`, `qa-agent`, `devops-agent`, `figma-implement-design`, `start-feature` e `feature-done` para agents
- [x] Migrar `commit` e `pull-request` para agents
- [x] Enxugar skills remanescentes e atualizar referencias para tools/agents

## Proximos passos

- [ ] Adicionar testes automatizados para o instalador e merge de config
- [ ] Adicionar opcao `--clean` ou `uninstall` no instalador
