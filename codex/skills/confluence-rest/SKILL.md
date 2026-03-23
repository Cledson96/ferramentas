---
name: confluence-rest
description: Use para trabalhar com Confluence via API direta da Atlassian, sem usar MCP. Acione quando o usuario mencionar Confluence ou pedir para buscar, ler, criar, atualizar, comentar, puxar, importar ou organizar paginas, executar CQL, abrir links de paginas, descobrir pageId, criar paginas filhas com parentId, consultar espacos ou operar conteudo em Storage Format XHTML.
---

# Skill: Confluence REST

Use o script global `confluence.js` desta skill para toda integracao com Confluence.

Esta e a skill padrao de Confluence do repositorio.

- sempre use esta skill quando o pedido mencionar Confluence
- nao usar MCP para fluxos de Confluence desta skill

## Script

Depois que a skill estiver instalada em `${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest`, use:

```bash
node ${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest/scripts/confluence.js <comando> [opcoes]
```

O script:

- le credenciais globais em `$CODEX_HOME/atlassian.json`
- aceita tambem `~/.codex/atlassian.json` como fallback e `~/.claude/atlassian.json` como compatibilidade legada
- usa `baseUrl`, `email` e `token` como formato canonico
- aceita `apiToken` apenas como compatibilidade de leitura
- aceita `baseUrl` sem `/wiki` e normaliza para o endpoint correto do Confluence
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

## Delegacao para modelo mais barato

Quando os parametros editoriais ja estiverem fechados, tarefas mecanicas podem ser delegadas para `gpt-5.4-mini` com reasoning `medium`.

Delegar apenas:
- buscas CQL amplas
- leitura de arvore e metadados
- pulls em lote com `pull-pages`
- organizacao mecanica dos resultados retornados pela API
- preparacao operacional de `create` ou `update` ja decididos

Manter no agente principal:
- decisao sobre quais paginas entram no fluxo
- revisao do conteudo antes de publicar
- escolha entre criar, atualizar, puxar ou sincronizar
- qualquer decisao editorial ou estrutural sobre a documentacao

## Defaults JusCash

- usar `https://juscash.atlassian.net/wiki` como base efetiva do Confluence
- priorizar o espaco Tech `DT` quando o pedido nao informar outro espaco
- usar `164069` como `spaceId` padrao para criacao quando o usuario nao informar outro valor

## Fluxo padrao

1. Se o pedido trouxer um link do Confluence, extrair o `pageId` da URL e comecar com `get`.
2. Se o pedido for busca ampla, usar `search` com CQL.
3. Se o pedido mencionar explicitamente CQL, executar a consulta exatamente como pedida.
4. Se o pedido for resumir conteudo, chamar `get` e sintetizar o corpo retornado.
5. Se o pedido for puxar paginas para o repositorio, comecar pela pagina pai, verificar a arvore com `tree` e decidir quais paginas baixar.
6. No pull, olhar primeiro para metadados leves como `pageId`, `title`, `parentId`, `depth` e `url`.
7. Usar `pull-pages` para o download em lote e para gravar os arquivos localmente.
8. Ao salvar localmente, manter sempre o corpo exatamente como veio do Confluence em Storage Format XHTML.
9. Se o pedido for criar pagina, usar `create` com `spaceId` padrao `164069` quando o usuario nao informar outro.
10. Se o pedido for criar uma subpagina, incluir `parentId`.
11. Se o pedido for atualizar pagina, preservar o titulo esperado e deixar o script calcular a versao automaticamente.
12. Em qualquer alteracao, resumir exatamente o que foi criado ou atualizado.

Para fluxos editoriais de documentacao, templates e sincronizacao de docs tecnicas, use a skill `confluence-docs`.

## Comandos principais

### Leitura e busca

```bash
node .../confluence.js search --cql 'space = "DT" AND title ~ "API"'
node .../confluence.js get --page-id 769196193
node .../confluence.js children --page-id 770441364
node .../confluence.js tree --page-id 770441364
$pages = '[{"pageId":"769196193","outputFile":"docs/07-API-ENDPOINTS-SIJ.xhtml"}]'
node .../confluence.js pull-pages --pages-json $pages
```

### Alteracoes

```bash
node .../confluence.js create --title "Nova Pagina" --body-file "C:\temp\body.xhtml"
node .../confluence.js create --title "Subpagina" --body-file "C:\temp\body.xhtml" --parent-id 769196193
node .../confluence.js create --title "Pagina em outro espaco" --body-file "C:\temp\body.xhtml" --space-id 123456
node .../confluence.js update --page-id 769196193 --title "Pagina Atualizada" --body-file "C:\temp\body.xhtml"
```

## Regras de resposta

- Para leitura, resumir titulo, status, versao, link e conteudo util.
- Para buscas, mostrar os resultados mais relevantes com `pageId`, titulo e link.
- Para pull de paginas, buscar sempre a pagina pai, inspecionar a arvore sem carregar `body` e decidir o conjunto de paginas so por metadados.
- Ao salvar paginas no repositorio, usar extensao `.xhtml` e persistir o corpo exatamente como veio da API.
- No fluxo de pull, a IA deve escolher os nomes dos arquivos e deixar o script fazer o download e a gravacao.
- Para alteracoes, confirmar `pageId`, titulo, status, versao e link retornados pela API.
- Se o usuario usar datas relativas, responder tambem com datas absolutas.
- Se o usuario pedir apenas o conteudo bruto, devolver o necessario sem reformatar para Markdown automaticamente.

## Guardrails

- Nao usar MCP para nenhuma operacao desta skill.
- Nao encaminhar tarefas de Confluence para outra skill do repositorio.
- Nao salvar credenciais no repositorio.
- Nao assumir outro espaco se o pedido for ambiguo e `DT` fizer sentido como default.
- Nao ler o corpo XHTML das paginas quando o objetivo for apenas decidir o pull inicial.
- Nao puxar apenas uma pagina solta sem antes verificar a arvore da pagina pai quando o contexto for importacao mais ampla.
- Nao converter automaticamente o corpo da pagina para outro formato ao criar ou atualizar; usar Storage Format.
- Nao prettificar, limpar ou reserializar o XHTML ao salvar localmente.
- Nao remover atributos internos do Confluence nem reorganizar macros.
- Se a API retornar erro, repassar o status HTTP e o corpo resumido.
- Se faltar `pageId`, `title` ou `body-file` em operacoes que exigem isso, interromper com erro claro.
