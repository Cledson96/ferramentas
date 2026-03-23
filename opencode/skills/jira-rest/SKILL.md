---
name: jira-rest
description: Use para operacoes REST diretas no Jira, sem MCP. Acione quando o usuario pedir para buscar, ler, criar, editar, comentar, transicionar, registrar worklog, executar JQL, consultar metadados, relacionar tickets ou operar issues como `ABC-123` via API da Atlassian.
compatibility: opencode
---

# Skill: Jira REST

Use o script global `jira.js` desta skill para toda integracao com Jira via REST direta.

Esta e a skill padrao de Jira do repositorio.

- sempre use esta skill quando o pedido mencionar Jira
- nao usar MCP para fluxos de Jira desta skill

## Quando usar

- quando o pedido envolver busca, leitura, criacao, edicao, comentario, transicao, worklog ou relacionamento de issues no Jira
- quando o usuario mencionar Jira, Atlassian, ticket, card, bug, story, task, JQL ou issue keys como `ABC-123`
- quando for preciso consultar `projects`, `issue-types`, `fields` ou `transitions` antes de operar um card

## Quando nao usar

- quando a tarefa depender de MCP; para esta skill, MCP nao e permitido
- quando a acao nao for sobre Jira ou nao exigir API REST direta da Atlassian

## Script

Depois que a skill estiver instalada em `~/.config/opencode/skills/jira-rest`, use:

```bash
node ~/.config/opencode/skills/jira-rest/scripts/jira.js <comando> [opcoes]
```

O script:

- le credenciais globais em `~/.config/opencode/atlassian.json`
- aceita tambem `~/.codex/atlassian.json` como fallback e `~/.claude/atlassian.json` como compatibilidade legada
- usa `baseUrl`, `email` e `token` como formato canonico
- aceita `apiToken` apenas como compatibilidade de leitura
- nunca grava credenciais no repositorio nem dentro da pasta da skill
- sempre retorna JSON

## Credenciais

O formato canonico e:

```json
{
  "baseUrl": "https://juscash.atlassian.net",
  "email": "usuario@empresa.com",
  "token": "token_atlassian"
}
```

Se o arquivo nao existir:

- pedir ao usuario `baseUrl`, `email` e `token`
- salvar globalmente com `setup`
- nunca criar esse arquivo dentro do repositorio

Compatibilidade:

- se o arquivo usar `apiToken` em vez de `token`, aceitar ambos na leitura
- se faltar `baseUrl`, `email` ou `token`, interromper com erro claro e orientar o usuario a corrigir o arquivo global

## Delegacao mecanica

Quando os parametros da operacao ja estiverem fechados, tarefas mecanicas podem ser delegadas para um subagente mais barato.

Delegar apenas:

- buscas amplas
- leituras em lote
- export de comentarios
- consultas de metadados como `projects`, `issue-types`, `fields` e `transitions`
- preparacao mecanica de payloads ja decididos

Manter no agente principal:

- escolha do modo de comentario
- interpretacao de criterio de aceite
- decisao de transicao, edicao, criacao ou resposta
- confirmacao final de alteracoes

Regras:

- delegar apenas quando nao houver ambiguidade de card, projeto, campo, comentario alvo ou proxima transicao
- revisar o retorno antes de confirmar comentario, edicao, criacao, worklog ou transicao

## Fluxo padrao

1. Se o pedido trouxer uma issue key como `ABC-123`, comecar com `get`.
2. Se o pedido for uma busca ampla por texto, usar `search`.
3. Se o usuario pedir JQL explicitamente, usar `jql`.
4. Antes de criar issue, consultar `projects`, `issue-types` e `fields` se houver duvida sobre metadados.
5. Antes de comentar em um card, decidir o modo de comentario: `progresso`, `resposta` ou `fechamento`.
6. Antes de responder um comentario, buscar o comentario alvo com `comments --comment-id`.
7. Antes de transicionar, chamar `transitions`.
8. Em `edit`, enviar apenas os campos pedidos.
9. Em qualquer alteracao, resumir exatamente o que foi mudado.

## Padrao de comentarios

### Modos

- `progresso`: usar quando houve trabalho realizado e a atualizacao precisa refletir criterios de aceite impactados neste ciclo
- `resposta`: usar quando o usuario quer responder um comentario anterior do Jira
- `fechamento`: usar quando o trabalho foi concluido e o comentario precisa consolidar entrega e cobertura dos criterios

### Regras de escrita

- Escrever com tom tecnico detalhado, profissional e objetivo.
- Usar frases curtas e diretas.
- Sempre relacionar o comentario aos criterios de aceite ou ao comentario alvo.
- Nao usar texto vago como "feito", "ajustado" ou "resolvido" sem explicar comportamento, impacto e validacao.
- Se houver datas relativas, escrever tambem a data absoluta.

### Comentario de progresso

- Abrir com uma linha curta de contexto do ciclo atual.
- Cobrir apenas os criterios impactados pela atualizacao atual.
- Para cada criterio impactado, informar `Criterio`, `Status` e `Detalhe tecnico`.
- Fechar sempre com os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Nao repetir criterios sem mudanca.

### Comentario de fechamento

- Cobrir todos os criterios de aceite do card.
- Para cada criterio, informar `Criterio`, `Status final` e `Evidencia`.
- Fechar sempre com os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Em `Pendencias` e `Bloqueios`, usar explicitamente `sem pendencias` e `sem bloqueios` quando aplicavel.

### Resposta a comentario

- Buscar primeiro o comentario alvo com `comments --comment-id`.
- Para buscar comentario por ID, usar o lookup REST em lote do proprio script, sem depender do endpoint individual do Jira.
- Publicar a resposta como um novo comentario contextualizado.
- Citar o assunto do comentario original e responder ponto a ponto quando houver multiplas perguntas, cobrancas ou decisoes.
- Incluir tambem `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Se a API do Jira nao resolver o comentario alvo por `comment-id`, usar `--target-summary` como fallback manual para contextualizar a resposta.

### Shape logico antes de comentar

- `mode`: `progresso`, `resposta` ou `fechamento`
- `criteria`: criterios impactados ou todos, conforme o modo
- `realizado`: lista objetiva do que foi feito
- `pendencias`: lista objetiva do que ainda falta
- `bloqueios`: lista objetiva de impedimentos ou `sem bloqueios`
- `proximoPasso`: proximo movimento esperado
- `targetCommentId`: obrigatorio apenas em `resposta`

## Comandos principais

### Setup

```bash
node ~/.config/opencode/skills/jira-rest/scripts/jira.js setup --base-url "https://juscash.atlassian.net" --email "usuario@empresa.com" --token "TOKEN"
```

### Leitura e busca

```bash
node ~/.config/opencode/skills/jira-rest/scripts/jira.js get --issue ABC-123
node ~/.config/opencode/skills/jira-rest/scripts/jira.js search --query "pix chargeback"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js jql --jql "project = JS ORDER BY updated DESC"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js comments --issue ABC-123
node ~/.config/opencode/skills/jira-rest/scripts/jira.js comments --issue ABC-123 --comment-id 42723
node ~/.config/opencode/skills/jira-rest/scripts/jira.js projects
node ~/.config/opencode/skills/jira-rest/scripts/jira.js issue-types --project JS
node ~/.config/opencode/skills/jira-rest/scripts/jira.js fields --project JS --issue-type-id 10001
node ~/.config/opencode/skills/jira-rest/scripts/jira.js transitions --issue ABC-123
```

### Alteracoes

```bash
node ~/.config/opencode/skills/jira-rest/scripts/jira.js comment --issue ABC-123 --body "Atualizacao tecnica"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js comment --issue ABC-123 --mode progresso --criteria-json '[{"title":"Investigacao da causa raiz","status":"realizado","detail":"Erro mapeado no worker de enfileiramento e validado em ambiente local"}]' --realizado-json '["Mapeada causa raiz","Ajustado tratamento do erro"]' --pendencias-json '["Validar caso com cliente duplicado"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Subir PR com evidencias"]'
node ~/.config/opencode/skills/jira-rest/scripts/jira.js reply --issue ABC-123 --comment-id 42723 --target-summary "Solicitacao de validacao do fluxo" --mode resposta --points-json '[{"title":"Solicitacao de validacao","status":"respondido","response":"Validacao executada no fluxo corrigido com resultado esperado"}]' --realizado-json '["Executada validacao do fluxo"]' --pendencias-json '["Consolidar evidencias no PR"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Atualizar card com fechamento tecnico"]'
node ~/.config/opencode/skills/jira-rest/scripts/jira.js comment --issue ABC-123 --mode fechamento --criteria-json '[{"title":"Nenhuma regressao","status":"atendido","detail":"Fluxos existentes validados sem impacto"}]' --realizado-json '["Entrega consolidada","Validacoes concluidas"]' --pendencias-json '["sem pendencias"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Card pronto para teste"]'
node ~/.config/opencode/skills/jira-rest/scripts/jira.js transition --issue ABC-123 --transition-id 31
node ~/.config/opencode/skills/jira-rest/scripts/jira.js worklog --issue ABC-123 --time-spent "30m" --comment "Investigacao"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js create --project JS --issue-type "Task" --summary "Titulo" --description "Descricao"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js edit --issue ABC-123 --summary "Novo titulo"
node ~/.config/opencode/skills/jira-rest/scripts/jira.js link --inward-issue ABC-1 --outward-issue ABC-2 --type "Blocks"
```

## Regras de resposta

- Para leitura, resumir titulo, status, prioridade, responsavel, descricao curta e proximos passos.
- Para comentarios de progresso, cobrir apenas criterios impactados.
- Para comentarios de fechamento, cobrir todos os criterios.
- Para resposta a comentario, buscar o comentario alvo antes e responder ponto a ponto quando necessario.
- Para buscas, mostrar itens mais relevantes com issue key, titulo e status.
- Para alteracoes, confirmar issue afetada, operacao executada e retorno da API.
- Quando o usuario usar datas relativas, responder tambem com datas absolutas.

## Guardrails

- Nao salvar credenciais no repositorio.
- Nao inventar campos Jira; quando houver duvida, consultar `fields`.
- Nao publicar comentario estruturado sem os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Nao responder comentario sem buscar o comentario alvo primeiro.
- Nao transicionar issue sem antes consultar `transitions`.
- Nao sobrescrever campos nao pedidos em `edit`.
- Se a API retornar erro, repassar o status HTTP e o corpo resumido.
