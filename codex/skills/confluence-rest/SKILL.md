---
name: confluence-rest
description: Use para trabalhar com Confluence via REST API direta da Atlassian, sem usar MCP. Acione quando o usuario pedir para buscar, ler, criar ou atualizar paginas do Confluence, executar CQL, abrir links de paginas, consultar conteudo do espaco Tech/DT, descobrir pageId, criar paginas filhas com parentId ou operar conteudo em Storage Format.
---

# Skill: Confluence REST

Use o script global `confluence.js` desta skill para toda integracao com Confluence via REST direta.

## Script

No Codex, use:

```bash
node ${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest/scripts/confluence.js <comando> [opcoes]
```

O script:

- le credenciais do arquivo global `C:\Users\Cledson Souza\.codex\atlassian.json`
- aceita tambem os formatos equivalentes em `$CODEX_HOME/atlassian.json`, `~/.codex/atlassian.json` e `~/.claude/atlassian.json`
- aceita `apiToken` ou `token`
- aceita `baseUrl` sem `/wiki` e normaliza para o endpoint correto do Confluence
- nunca grava credenciais no repositorio
- sempre retorna JSON

## Credenciais

Esperar este formato minimo:

```json
{
  "baseUrl": "https://juscash.atlassian.net",
  "email": "usuario@empresa.com",
  "apiToken": "token_atlassian"
}
```

Compatibilidade:

- se o arquivo usar `token` em vez de `apiToken`, aceitar ambos
- se faltar `baseUrl`, `email` ou token, interromper e orientar o usuario a corrigir `atlassian.json`

## Defaults JusCash

- usar `https://juscash.atlassian.net/wiki` como base efetiva do Confluence
- priorizar o espaco Tech `DT` quando o pedido nao informar outro espaco
- usar `164069` como `spaceId` padrao para criacao quando o usuario nao informar outro valor

## Padrao de templates tecnicos

Quando o pedido envolver criacao, atualizacao ou importacao de documentacao tecnica, usar como referencia a pagina raiz de templates:

- pagina raiz: `843415557`
- titulo: `Padrao de templates de documentacao tecnica`
- link: `https://juscash.atlassian.net/wiki/spaces/Interno/pages/843415557/Padr+o+de+templates+de+documenta+o+t+cnica`

Antes de criar ou atualizar uma documentacao tecnica:

1. Consultar a arvore dessa pagina com `tree --page-id 843415557`.
2. Identificar o template mais aderente ao tipo de documentacao.
3. Seguir a estrutura e o padrao do template correspondente.
4. Se for puxar o template para o repositorio, salvar o XHTML bruto sem alterar a estrutura.

Mapeamento padrao dos templates:

- Backend Node.js: `852525087`
- Backend Python: `851509330`
- Frontend: `935952386`
- EDA raiz: `889520130`
- Fluxo EDA: `918913028`
- Modulo EDA visao geral: `918618121`
- Modulo EDA visao especifica: `919568388`
- Servicos EDA: `918061064`
- Banco de Dados: `936148994`
- PRD Tecnico: `1022001158`

Heuristica de selecao:

- usar `Backend Node.js` para APIs, workers, servicos e modulos Node
- usar `Backend Python` para servicos, jobs e automacoes em Python
- usar `Frontend` para apps web, interfaces, componentes, rotas e estados
- usar `Banco de Dados` para tabelas, relacionamentos, indices, regras e modelagem
- usar `Fluxo EDA` para descrever fluxos de eventos ponta a ponta
- usar `Modulo EDA visao geral` para dominios ou modulos de EDA
- usar `Modulo EDA visao especifica` para um recorte interno de um modulo EDA
- usar `Servicos EDA` para servicos individuais que publicam ou consomem eventos
- usar `PRD Tecnico` quando o pedido for uma especificacao tecnica orientada a produto/entrega

## Fluxo padrao

1. Se o pedido trouxer um link do Confluence, extrair o `pageId` da URL e comecar com `get`.
2. Se o pedido for busca ampla, usar `search` com CQL.
3. Se o pedido mencionar explicitamente CQL, executar a consulta exatamente como pedida.
4. Se o pedido for resumir conteudo, chamar `get` e sintetizar o corpo retornado.
5. Se o pedido for puxar documentacao para o repositorio, comecar sempre pela pagina pai, verificar a arvore com `tree` e decidir quais paginas devem ser baixadas.
6. Ao puxar documentacao para o repositorio, usar sempre a pasta `docs/` como destino padrao.
7. Antes do download, ver apenas metadados leves da arvore, como `pageId`, `title`, `parentId`, `depth` e `url`.
8. Deixar a IA decidir apenas quais paginas baixar e qual nome cada arquivo deve ter em `docs/`, sem ler o corpo da pagina.
9. Usar `pull-pages` para o download em lote e para gravar os arquivos localmente.
10. Se a tarefa for documentacao tecnica, consultar antes a pagina raiz de templates `843415557` e escolher o template aderente ao contexto.
11. Ao salvar localmente, manter sempre o corpo exatamente como veio do Confluence em Storage Format XHTML, sem formatar, normalizar ou converter.
12. Preservar todos os atributos, macros e configuracoes da pagina, incluindo `ac:*`, `ri:*`, `data-*`, `ac:local-id` e `ac:macro-id`.
13. Se o pedido for criar pagina, usar `create` com `spaceId` padrao `164069` quando o usuario nao informar outro.
14. Se o pedido for criar uma subpagina, incluir `parentId`.
15. Se o pedido for atualizar pagina, preservar o titulo esperado e deixar o script calcular a versao automaticamente.
16. Em qualquer alteracao, resumir exatamente o que foi criado ou atualizado.

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
- Para pull de documentacao, buscar sempre a pagina pai, inspecionar a arvore sem carregar `body` e decidir o conjunto de paginas so por metadados.
- Para documentacao tecnica, indicar explicitamente qual template da raiz `843415557` foi escolhido e por qual motivo.
- Ao salvar paginas no repositorio, usar extensao `.xhtml` e persistir o corpo exatamente como veio da API.
- No fluxo de pull, a IA deve escolher os nomes dos arquivos e deixar o script fazer o download e a gravacao.
- Para alteracoes, confirmar `pageId`, titulo, status, versao e link retornados pela API.
- Se o usuario usar datas relativas, responder tambem com datas absolutas.
- Se o usuario pedir apenas o conteudo bruto, devolver o necessario sem reformatar para Markdown automaticamente.

## Guardrails

- Nao usar MCP para nenhuma operacao desta skill.
- Nao salvar credenciais no repositorio.
- Nao assumir outro espaco se o pedido for ambiguo e `DT` fizer sentido como default.
- Nao ler o corpo XHTML das paginas quando o objetivo for apenas importar documentacao para o repositorio.
- Nao puxar apenas uma pagina solta de documentacao sem antes verificar a arvore da pagina pai.
- Nao criar ou atualizar documentacao tecnica sem antes verificar se existe um template aplicavel na raiz `843415557`.
- Nao converter automaticamente o corpo da pagina para outro formato ao criar ou atualizar; usar Storage Format.
- Nao prettificar, limpar ou reserializar o XHTML ao salvar localmente.
- Nao remover atributos internos do Confluence nem reorganizar macros.
- Se a API retornar erro, repassar o status HTTP e o corpo resumido.
- Se faltar `pageId`, `title` ou `body-file` em operacoes que exigem isso, interromper com erro claro.
