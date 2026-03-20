---
name: jira-rest
description: "Use para trabalhar com Jira via API REST direta da Atlassian, sem usar MCP. Acione quando o usuario pedir para buscar, ler, criar, editar, comentar, transicionar, registrar worklog, listar projetos, descobrir tipos de issue, ver campos obrigatorios, executar JQL ou relacionar tickets do Jira. Tambem use quando o pedido mencionar Jira, Atlassian, ticket, card, bug, story, task, issue keys como ABC-123, JQL, transicao, comentario, worklog, criacao ou edicao de issue."
disable-model-invocation: false
---

# Skill: Jira REST

Use o script `jira.js` desta skill para toda integração com Jira via REST direta — sem MCP Atlassian.

## Script

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js <comando> [opcoes]
```

O script:

- lê credenciais em `~/.claude/atlassian.json` → `~/.codex/atlassian.json` como fallback
- usa `baseUrl`, `email` e `token` como formato canônico
- aceita `apiToken` apenas como compatibilidade de leitura
- nunca grava credenciais no repositório nem dentro da pasta da skill
- sempre retorna JSON

## Credenciais

O formato canônico é:

```json
{
  "baseUrl": "https://juscash.atlassian.net",
  "email": "usuario@empresa.com",
  "token": "token_atlassian"
}
```

Se o arquivo não existir:

- pedir ao usuário `baseUrl`, `email` e `token`
- salvar em `~/.claude/atlassian.json`
- nunca criar esse arquivo dentro do repositório

Compatibilidade:

- se o arquivo usar `apiToken` em vez de `token`, aceitar ambos na leitura
- se faltar `baseUrl`, `email` ou `token`, interromper com erro claro e orientar o usuário a corrigir o arquivo global

## Fluxo padrão

1. Se o pedido trouxer uma issue key como `ABC-123`, começar com `get`.
2. Se o pedido for uma busca ampla por texto, usar `search`.
3. Se o usuário pedir JQL explicitamente, usar `jql`.
4. Antes de criar issue, consultar `projects`, `issue-types` e `fields` se houver dúvida sobre metadados.
5. Antes de comentar em um card, decidir o modo de comentário: `progresso`, `resposta` ou `fechamento`.
6. Antes de responder um comentário, buscar o comentário alvo com `comments --comment-id`.
7. Antes de transicionar, chamar `transitions`.
8. Em `edit`, enviar apenas os campos pedidos.
9. Em qualquer alteração, resumir exatamente o que foi mudado.

## Padrão de comentários

### Modos

- `progresso`: usar quando houve trabalho realizado e a atualização precisa refletir critérios de aceite impactados neste ciclo
- `resposta`: usar quando o usuário quer responder um comentário anterior do Jira
- `fechamento`: usar quando o trabalho foi concluído e o comentário precisa consolidar entrega e cobertura dos critérios

### Regras de escrita

- Escrever com tom técnico detalhado, profissional e objetivo.
- Usar frases curtas e diretas.
- Sempre relacionar o comentário aos critérios de aceite ou ao comentário alvo.
- Não usar texto vago como "feito", "ajustado" ou "resolvido" sem explicar comportamento, impacto e validação.
- Se houver datas relativas, escrever também a data absoluta.

### Comentário de progresso

- Abrir com uma linha curta de contexto do ciclo atual.
- Cobrir apenas os critérios impactados pela atualização atual.
- Para cada critério impactado, informar `Criterio`, `Status` e `Detalhe tecnico`.
- Fechar sempre com os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Não repetir critérios sem mudança.

### Comentário de fechamento

- Cobrir todos os critérios de aceite do card.
- Para cada critério, informar `Criterio`, `Status final` e `Evidencia`.
- Fechar sempre com os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Em `Pendencias` e `Bloqueios`, usar explicitamente `sem pendencias` e `sem bloqueios` quando aplicável.

### Resposta a comentário

- Buscar primeiro o comentário alvo com `comments --comment-id`.
- Para buscar comentário por ID, usar o lookup REST em lote do próprio script, sem depender do endpoint individual do Jira.
- Publicar a resposta como um novo comentário contextualizado.
- Citar o assunto do comentário original e responder ponto a ponto quando houver múltiplas perguntas, cobranças ou decisões.
- Incluir também `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Se a API do Jira não resolver o comentário alvo por `comment-id`, usar `--target-summary` como fallback manual para contextualizar a resposta.

### Shape lógico antes de comentar

- `mode`: `progresso`, `resposta` ou `fechamento`
- `criteria`: critérios impactados ou todos, conforme o modo
- `realizado`: lista objetiva do que foi feito
- `pendencias`: lista objetiva do que ainda falta
- `bloqueios`: lista objetiva de impedimentos ou `sem bloqueios`
- `proximoPasso`: próximo movimento esperado
- `targetCommentId`: obrigatório apenas em `resposta`

## Comandos principais

### Leitura e busca

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js get --issue ABC-123
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js search --query "pix chargeback"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js jql --jql "project = JS ORDER BY updated DESC"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js comments --issue ABC-123
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js comments --issue ABC-123 --comment-id 42723
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js projects
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js issue-types --project JS
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js fields --project JS --issue-type-id 10001
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js transitions --issue ABC-123
```

### Alterações

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js comment --issue ABC-123 --body "Atualizacao tecnica"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js comment --issue ABC-123 --mode progresso --criteria-json '[{"title":"Investigacao da causa raiz","status":"realizado","detail":"Erro mapeado no worker de enfileiramento e validado em ambiente local"}]' --realizado-json '["Mapeada causa raiz","Ajustado tratamento do erro"]' --pendencias-json '["Validar caso com cliente duplicado"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Subir PR com evidencias"]'
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js reply --issue ABC-123 --comment-id 42723 --target-summary "Solicitacao de validacao do fluxo" --mode resposta --points-json '[{"title":"Solicitacao de validacao","status":"respondido","response":"Validacao executada no fluxo corrigido com resultado esperado"}]' --realizado-json '["Executada validacao do fluxo"]' --pendencias-json '["Consolidar evidencias no PR"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Atualizar card com fechamento tecnico"]'
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js comment --issue ABC-123 --mode fechamento --criteria-json '[{"title":"Nenhuma regressao","status":"atendido","detail":"Fluxos existentes validados sem impacto"}]' --realizado-json '["Entrega consolidada","Validacoes concluidas"]' --pendencias-json '["sem pendencias"]' --bloqueios-json '["sem bloqueios"]' --proximo-passo-json '["Card pronto para teste"]'
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js transition --issue ABC-123 --transition-id 31
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js worklog --issue ABC-123 --time-spent "30m" --comment "Investigacao"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js create --project JS --issue-type "Task" --summary "Titulo" --description "Descricao"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js edit --issue ABC-123 --summary "Novo titulo"
node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js link --inward-issue ABC-1 --outward-issue ABC-2 --type "Blocks"
```

## Regras de resposta

- Para leitura, resumir título, status, prioridade, responsável, descrição curta e próximos passos.
- Para comentários de progresso, cobrir apenas critérios impactados.
- Para comentários de fechamento, cobrir todos os critérios.
- Para resposta a comentário, buscar o comentário alvo antes e responder ponto a ponto quando necessário.
- Para buscas, mostrar itens mais relevantes com issue key, título e status.
- Para alterações, confirmar issue afetada, operação executada e retorno da API.
- Quando o usuário usar datas relativas, responder também com datas absolutas.

## Guardrails

- Não salvar credenciais no repositório.
- Não inventar campos Jira; quando houver dúvida, consultar `fields`.
- Não publicar comentário estruturado sem os blocos `Realizado`, `Pendencias`, `Bloqueios` e `Proximo passo`.
- Não responder comentário sem buscar o comentário alvo primeiro.
- Não transicionar issue sem antes consultar `transitions`.
- Não sobrescrever campos não pedidos em `edit`.
- Se a API retornar erro, repassar o status HTTP e o corpo resumido.
