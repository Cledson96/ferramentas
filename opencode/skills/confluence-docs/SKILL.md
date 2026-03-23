---
name: confluence-docs
description: Use para fluxos editoriais de documentacao tecnica no Confluence. Acione quando o usuario pedir para escolher templates, importar docs para o repositorio, atualizar arquivos `.xhtml` locais, organizar `docs/` ou sincronizar documentacao tecnica entre repositorio e Confluence.
compatibility: opencode
---

# Skill: Confluence Docs

Use esta skill para fluxos editoriais de documentacao tecnica no Confluence.

Ela nao substitui as custom tools de Confluence. Use as tools `confluence_get`, `confluence_search`, `confluence_tree`, `confluence_pull_pages`, `confluence_create` e `confluence_update` como base operacional.

## Quando usar

- quando o pedido for sobre templates de documentacao tecnica
- quando o usuario quiser importar docs do Confluence para o repositorio
- quando o usuario quiser atualizar docs locais em `.xhtml`
- quando o usuario quiser publicar ou sincronizar docs locais de volta ao Confluence
- quando a tarefa envolver naming, estrutura e organizacao de arquivos em `docs/`

## Quando nao usar

- quando o pedido for apenas buscar, ler, criar, atualizar, comentar, executar CQL ou descobrir `pageId` sem fluxo editorial; nesses casos usar as tools `confluence_*`
- quando a tarefa for uma operacao REST pontual sem necessidade de template, organizacao documental ou sincronizacao

## Dependencia operacional

Se a credencial global nao existir, pedir ao usuario:

1. `baseUrl`
2. `email`
3. `token`

Depois orientar o setup global da integracao Atlassian antes de seguir.

## Delegacao mecanica

Delegar apenas tarefas mecanicas e de baixo risco, por exemplo:

- `confluence_pull_pages`
- `confluence_create`
- `confluence_update`
- mapeamento de `pageId` para arquivos locais
- organizacao mecanica de arquivos `.xhtml` em `docs/`
- sincronizacao final ja definida entre repositorio e Confluence

Manter no agente principal:

- entendimento da intencao do usuario
- escolha de template
- decisao de quais paginas entram no fluxo
- revisao do conteudo local
- validacao antes de publicar

Regras de delegacao:

- delegar apenas quando os parametros ja estiverem fechados
- nao delegar quando houver ambiguidade editorial, falta de contexto ou decisao estrutural
- apos a delegacao, revisar o resultado antes de confirmar publicacao ou sincronizacao

## Fluxo padrao

1. Entender se o trabalho e de importacao, edicao local, sincronizacao ou criacao do zero.
2. Se existir pagina no Confluence, comecar pela pagina pai e usar `confluence_tree` para decidir o conjunto de paginas relevantes.
3. Fazer pull das paginas escolhidas com `confluence_pull_pages`, salvando em `docs/` com extensao `.xhtml`.
4. Atualizar os arquivos locais preservando exatamente o Storage Format XHTML.
5. Se a tarefa for documentacao tecnica, escolher o template mais aderente antes de criar ou reorganizar conteudo.
6. So publicar com `confluence_create` ou `confluence_update` depois de revisar o XHTML local.

## Templates tecnicos

Considere a pagina raiz de templates:

- pagina raiz: `843415557`
- titulo: `Padrao de templates de documentacao tecnica`
- link: `https://juscash.atlassian.net/wiki/spaces/Interno/pages/843415557/Padr+o+de+templates+de+documenta+o+t+cnica`

Mapeamento inicial:

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
- usar `PRD Tecnico` quando o pedido for uma especificacao tecnica orientada a produto ou entrega

## Convencoes locais

- usar `docs/` como destino padrao
- usar extensao `.xhtml`
- preservar o corpo exatamente como veio da API quando o objetivo for espelhamento
- nao prettificar, limpar ou reserializar o XHTML
- nao remover `ac:*`, `ri:*`, `data-*`, `ac:local-id` ou `ac:macro-id`

## Guardrails

- nao duplicar cliente REST nem regras de auth dentro desta skill
- nao salvar credenciais no repositorio
- nao tratar a delegacao barata como substituto para decisao editorial
- nao escolher template sem verificar aderencia ao contexto tecnico
- nao publicar alteracoes sem antes revisar o XHTML local
- nao converter automaticamente o corpo para Markdown ao sincronizar com o Confluence
