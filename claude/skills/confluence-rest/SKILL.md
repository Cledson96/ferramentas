---
name: confluence-rest
description: "Use para trabalhar com Confluence via REST API direta. Acione quando o usuario mencionar Confluence ou pedir para buscar, ler, criar, atualizar, puxar ou organizar paginas, ou quando um fluxo precisar sincronizar documentacao."
disable-model-invocation: false
---

# Skill: Confluence REST

Use o script `confluence.js` do plugin para toda integracao com Confluence via REST API direta.

- sempre usar esta skill quando o pedido mencionar Confluence
- nao usar MCP para fluxos de Confluence

## Script

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js <comando> [opcoes]
```

O script:

- le credenciais globais em `~/.claude/atlassian.json`
- aceita tambem `~/.codex/atlassian.json` como fallback
- usa `baseUrl`, `email` e `token` como formato canonico
- aceita `apiToken` apenas como compatibilidade de leitura
- aceita `baseUrl` sem `/wiki` e normaliza para o endpoint correto
- nunca grava credenciais no repositorio
- sempre retorna JSON

## Credenciais

Formato canonico:

```json
{
  "baseUrl": "https://juscash.atlassian.net",
  "email": "usuario@empresa.com",
  "token": "token_atlassian"
}
```

Se o arquivo nao existir, pedir ao usuario `baseUrl`, `email` e `token`, e salvar com:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js setup --base-url "<BASE_URL>" --email "<EMAIL>" --token "<TOKEN>"
```

Nunca criar esse arquivo dentro do repositorio.

## Defaults JusCash

- usar `https://juscash.atlassian.net/wiki` como base efetiva do Confluence
- priorizar o espaco Tech `DT` quando o pedido nao informar outro espaco
- usar `164069` como `spaceId` padrao para criacao

## Comandos

### Leitura e busca

```bash
node .../confluence.js search --cql 'space = "DT" AND title ~ "API"'
node .../confluence.js get --page-id 769196193
node .../confluence.js children --page-id 770441364
node .../confluence.js tree --page-id 770441364
node .../confluence.js pull-pages --pages-json '[{"pageId":"769196193","outputFile":"docs/07-API-ENDPOINTS.xhtml"}]'
```

### Alteracoes

```bash
node .../confluence.js create --title "Nova Pagina" --body-file body.xhtml
node .../confluence.js create --title "Subpagina" --body-file body.xhtml --parent-id 769196193
node .../confluence.js update --page-id 769196193 --title "Pagina Atualizada" --body-file body.xhtml
```

## Fluxo padrao

1. Se o pedido trouxer um link do Confluence, extrair o `pageId` da URL e comecar com `get`.
2. Se o pedido for busca ampla, usar `search` com CQL.
3. Se o pedido for puxar paginas para o repositorio, comecar pela pagina pai, verificar a arvore com `tree` e decidir quais paginas baixar.
4. No pull, olhar primeiro para metadados leves (pageId, title, parentId, depth, url) — nao carregar body so para decidir.
5. Usar `pull-pages` para o download em lote e gravar os arquivos localmente em `docs/`.
6. Ao salvar localmente, manter o corpo exatamente como veio do Confluence em Storage Format XHTML.
7. Se o pedido for criar pagina, usar `create` com `spaceId` padrao `164069`.
8. Se o pedido for criar subpagina, incluir `parentId`.
9. Se o pedido for atualizar, preservar o titulo e deixar o script calcular a versao automaticamente.
10. Em qualquer alteracao, resumir o que foi criado ou atualizado.

Para fluxos editoriais de documentacao, templates e sincronizacao de docs tecnicas, usar a skill `docs`.

## Regras de resposta

- Para leitura, resumir titulo, status, versao, link e conteudo util.
- Para buscas, mostrar os resultados mais relevantes com `pageId`, titulo e link.
- Para pull de paginas, verificar a arvore sem carregar `body` e decidir o conjunto de paginas so por metadados.
- Ao salvar paginas no repositorio, usar extensao `.xhtml` e persistir o corpo exatamente como veio da API.
- Para alteracoes, confirmar `pageId`, titulo, status, versao e link retornados pela API.

## Guardrails

- Nao usar MCP para nenhuma operacao desta skill.
- Nao salvar credenciais no repositorio.
- Nao ler o corpo XHTML das paginas quando o objetivo for apenas decidir o pull inicial.
- Nao puxar pagina solta sem antes verificar a arvore da pagina pai quando o contexto for importacao.
- Nao converter automaticamente o corpo para outro formato; usar Storage Format.
- Nao prettificar, limpar ou reserializar o XHTML ao salvar localmente.
- Nao remover atributos internos do Confluence (`ac:*`, `ri:*`, `data-*`, `ac:local-id`, `ac:macro-id`).
- Se a API retornar erro, repassar o status HTTP e o corpo resumido.
