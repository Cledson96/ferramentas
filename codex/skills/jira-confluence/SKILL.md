---
name: jira-confluence
description: Use para trabalhar com Jira e Confluence via ferramentas Atlassian ja conectadas no Codex. Acione quando o usuario pedir para buscar, ler, criar, editar, comentar, transicionar ou relacionar issues do Jira; registrar worklog; pesquisar conteudo Atlassian; ou ler, criar, atualizar e comentar paginas do Confluence. Tambem use quando o pedido mencionar Atlassian, Jira, Confluence, JQL, CQL, issue keys como ABC-123, links de paginas do Confluence ou links de cards do Jira.
---

# Skill: Jira and Confluence

Use as ferramentas `mcp__jira__*` como padrao para tarefas Atlassian.

## Fluxo base

1. Identificar se o pedido e sobre Jira, Confluence ou busca geral Atlassian.
2. Se o usuario trouxe uma URL Atlassian, tentar usar o hostname como `cloudId` primeiro.
3. Se o `cloudId` nao estiver claro ou falhar, usar `getAccessibleAtlassianResources`.
4. Para buscas gerais, preferir `searchAtlassian`.
5. So usar JQL ou CQL quando o usuario pedir explicitamente ou quando a consulta precisar dessa sintaxe.

## Jira

### Ler e buscar

- Buscar issues ou conteudo relacionado: `searchAtlassian`
- Buscar com JQL explicito: `searchJiraIssuesUsingJql`
- Ler um card especifico: `getJiraIssue`
- Ver transicoes disponiveis: `getTransitionsForJiraIssue`
- Ver links remotos: `getJiraIssueRemoteIssueLinks`
- Descobrir projetos disponiveis: `getVisibleJiraProjects`
- Descobrir tipos de issue: `getJiraProjectIssueTypesMetadata`
- Descobrir campos obrigatorios de um tipo: `getJiraIssueTypeMetaWithFields`

### Alterar

- Criar issue: `createJiraIssue`
- Editar campos: `editJiraIssue`
- Adicionar comentario: `addCommentToJiraIssue`
- Registrar ou atualizar worklog: `addWorklogToJiraIssue`
- Mudar status: `transitionJiraIssue`
- Criar relacao entre issues: `createIssueLink`

### Regras uteis

- Quando o pedido citar um card como `ABC-123`, tratar isso como `issueIdOrKey`.
- Antes de criar issue, validar projeto, tipo e campos obrigatorios.
- Antes de transicionar issue, sempre consultar as transicoes disponiveis.
- Ao comentar ou editar, preservar o contexto do usuario e evitar sobrescrever campos nao solicitados.

## Confluence

### Ler e buscar

- Busca geral em Atlassian: `searchAtlassian`
- Busca com CQL explicito: `searchConfluenceUsingCql`
- Ler pagina pelo ID: `getConfluencePage`
- Listar espacos: `getConfluenceSpaces`
- Listar paginas de um espaco: `getPagesInConfluenceSpace`
- Ver descendentes: `getConfluencePageDescendants`
- Ler comentarios footer: `getConfluencePageFooterComments`
- Ler comentarios inline: `getConfluencePageInlineComments`
- Ler respostas de comentario: `getConfluenceCommentChildren`

### Alterar

- Criar pagina: `createConfluencePage`
- Atualizar pagina: `updateConfluencePage`
- Adicionar comentario footer: `createConfluenceFooterComment`
- Adicionar comentario inline: `createConfluenceInlineComment`

### Regras uteis

- Quando o usuario fornecer um link de pagina do Confluence, extrair o `pageId` da URL.
- Se precisar achar um espaco antes de criar uma pagina, usar `getConfluenceSpaces`.
- Ao atualizar pagina, manter titulo e `spaceId` atuais se o usuario nao pediu mudanca.
- Preferir `contentFormat: "markdown"` quando o pedido for textual simples; usar ADF so se precisar de estrutura rica especifica.

## Busca Atlassian

- Para pedidos como "ache o card", "encontre a pagina", "procure docs", comecar com `searchAtlassian`.
- Quando o resultado vier como ARI, usar `fetchAtlassian` para abrir o item completo.
- Se o usuario falar explicitamente em JQL, usar `searchJiraIssuesUsingJql`.
- Se o usuario falar explicitamente em CQL, usar `searchConfluenceUsingCql`.

## Respostas

- Resumir os campos mais uteis para a tarefa: titulo, status, responsavel, prioridade, descricao curta, links e proximos passos.
- Quando houver datas relativas no pedido, responder tambem com datas absolutas para evitar ambiguidade.
- Se a operacao alterar Jira ou Confluence, confirmar exatamente o que foi criado, atualizado ou transicionado.
