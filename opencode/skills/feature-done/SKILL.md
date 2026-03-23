---
name: feature-done
description: "Workflow final pos-feature: revisa a branch, atualiza documentacao, fecha commit e prepara PR com pausas apenas nos pontos de decisao real."
---

# Skill: Feature Done

Workflow completo para finalizar uma feature. Encadeia `qa-agent` → `confluence-docs` → `commit` → PR em sequencia, com pausas apenas onde existe risco, bloqueio ou decisao do usuario.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Instrucoes

Quando esta skill for carregada, seguir este fluxo:

### Setup inicial — coletar contexto compartilhado

Executar em paralelo antes de iniciar qualquer fase:
- `git branch -r`
- `git branch --show-current`

Detectar a branch base nesta ordem:
- `origin/development`
- `origin/develop`
- `origin/main`
- `origin/master`

Confirmar a base com o usuario antes de continuar.

Depois da confirmacao, executar em paralelo:
- `git diff {BASE}...HEAD --stat`
- `git diff {BASE}...HEAD`
- `git log {BASE}..HEAD --oneline`
- se houver TASK-ID na branch, usar a skill `jira-rest` para buscar o card com `get --issue TASK-ID` (summary, description, issuetype.name, status.name, priority.name)

Se o diff estiver vazio, avisar que nao ha diferencas em relacao a `{BASE}` e encerrar.

### Fase 1/4 — Review com `qa-agent`

Carregar a skill `qa-agent` com o contexto ja coletado.

Objetivo desta fase:
- validar cobertura de testes
- conferir criterios de aceite do Jira
- identificar blockers de qualidade, seguranca e design system
- produzir recomendacao final da revisao

**Pausa essencial:** se houver blockers ou se o usuario quiser que o proprio `qa-agent` aplique correcoes.

Se nao houver blockers, seguir automaticamente para a fase de docs.

### Fase 2/4 — Documentacao com `confluence-docs`

Nao reimplementar a logica editorial dentro desta skill.

Fluxo esperado:
- verificar se o diff sugere atualizacao de documentacao tecnica
- resumir quais areas de docs parecem afetadas
- perguntar se o usuario quer:
  - atualizar apenas docs locais
  - atualizar e sincronizar com Confluence
  - pular a etapa

Se o usuario quiser seguir com docs, carregar a skill `confluence-docs`, repassando:
- diff da branch
- contexto Jira
- decisao sobre docs locais vs sincronizacao

**Pausa essencial:** apenas para a decisao do usuario sobre atualizar docs e sincronizar ou nao com Confluence.

### Fase 3/4 — Commit com `commit`

Antes do commit:
- verificar `git diff --cached --stat`
- se houver arquivos relevantes alterados fora do staged, chamar atencao do usuario
- se docs foram atualizadas e nao estao staged, perguntar se devem entrar no commit

Depois disso, carregar a skill `commit` para:
- gerar a mensagem no padrao correto
- revisar a mensagem com o usuario
- executar o commit so apos confirmacao

**Pausa essencial:** confirmacao da mensagem final de commit.

### Fase 4/4 — PR

Se a branch ainda nao tiver upstream remoto, perguntar se deve fazer push antes da PR.

Para criar a PR:
- detectar e confirmar a base
- montar `title` e `body` com resumo da feature
- revisar o conteudo com o usuario
- publicar usando `gh pr create`

**Pausa essencial:** confirmacao da criacao/publicacao da PR.

### Passo opcional — Deploy readiness com `devops-agent`

Depois que a PR estiver pronta, avaliar se vale sugerir a skill `devops-agent`.

Sugerir essa etapa apenas quando houver sinais como:
- migrations
- novas env vars
- breaking changes
- impacto em infraestrutura
- preparacao para staging ou producao

Nao tornar este passo obrigatorio. Se nao houver sinal claro de deploy sensivel, apenas nao sugerir.

### Politica de pausas

O fluxo deve seguir automatico entre fases quando nao houver risco real.

Parar apenas nestes pontos:
- confirmacao da branch base inicial
- blockers ou correcoes na fase de review
- decisao sobre docs e sincronizacao com Confluence
- confirmacao da mensagem de commit
- confirmacao da criacao/publicacao da PR
- eventual passo opcional de deploy readiness

Nao pausar apenas para dizer que uma fase foi concluida com sucesso.

### Resumo final

Apresentar o encerramento neste formato:

```
Feature Done!

Fase 1 — Review: {aprovado | aprovado com ressalvas | reprovado}
Fase 2 — Docs: {atualizadas localmente | sincronizadas com Confluence | puladas}
Fase 3 — Commit: {mensagem final ou pulado}
Fase 4 — PR: {url da PR ou pulado}

Card Jira: {link ou TASK-ID}

Proximo passo sugerido:
- {usar devops-agent, quando aplicavel}
```

## Guardrails

- Nao reimplementar dentro desta skill o fluxo que ja pertence a `confluence-docs`, `commit` ou `review`.
- Nao criar PR sem confirmacao do usuario.
- Nao adicionar assinatura do assistente, `Co-Authored-By` ou mencoes ao assistente.
- Nao depender de MCP externo.
- Nao pausar para celebrar conclusao de fases — seguir automatico quando seguro.
