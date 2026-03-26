---
name: confluence-docs
description: Use para fluxos editoriais de documentacao tecnica no Confluence. Acione quando o usuario pedir para escolher templates, importar docs para o repositorio, atualizar arquivos `.xhtml` locais, organizar `docs/` ou sincronizar documentacao tecnica entre repositorio e Confluence.
compatibility: opencode
---

# Skill: Confluence Docs

Use esta skill para fluxos editoriais de documentacao tecnica no Confluence.

Ela nao substitui as custom tools de Confluence. Use `confluence_get`, `confluence_search`, `confluence_tree`, `confluence_versions`, `confluence_pull_pages`, `confluence_create`, `confluence_update` e `confluence_restore_version` como base operacional.

## Quando usar

- quando o pedido for sobre templates de documentacao tecnica
- quando o usuario quiser importar docs do Confluence para o repositorio
- quando o usuario quiser atualizar arquivos `.xhtml` locais
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

- `confluence_get`
- `confluence_pull_pages`
- `confluence_versions`
- `confluence_create`
- `confluence_update`
- `confluence_restore_version`
- mapeamento de `pageId` para arquivos locais
- organizacao mecanica de arquivos `.xhtml` em `docs/`
- sincronizacao final ja definida entre repositorio e Confluence

Manter no agente principal:

- entendimento da intencao do usuario
- escolha de template
- decisao de quais paginas entram no fluxo
- decisao de quando listar versoes ou restaurar uma versao anterior
- analise editorial da pagina atual antes de atualizar
- comparacao entre estado atual, template esperado e mudanca desejada
- decisao sobre reformatacao estrutural antes de publicar
- revisao do conteudo local
- validacao antes de publicar

Regras de delegacao:

- delegar apenas quando os parametros ja estiverem fechados
- para `update` de pagina existente, delegar o pull inicial da versao atual e o snapshot local por ser tarefa mecanica e de baixo risco
- nao delegar quando houver ambiguidade editorial, falta de contexto ou decisao estrutural
- apos a delegacao, revisar o resultado antes de confirmar publicacao ou sincronizacao

## Fluxo recomendado

1. Entender se o trabalho e de importacao, edicao local, sincronizacao ou criacao do zero.
2. Se existir pagina no Confluence, comecar pela pagina pai e usar `confluence_tree` para decidir o conjunto de paginas relevantes.
3. Se a tarefa for documentacao tecnica, escolher o template mais aderente antes de criar ou reorganizar conteudo.
4. Quando a pagina ja existir, puxar obrigatoriamente a versao atual do Confluence antes de qualquer publicacao e salvar um snapshot local em `docs/` com extensao `.xhtml`.
5. Quando a documentacao estiver distribuida em pagina mae e paginas filhas, puxar e revisar a pagina mae e tambem as filhas relevantes antes de editar.
6. Atualizar os arquivos locais preservando exatamente o Storage Format XHTML.
7. Antes de publicar um `update`, analisar a pagina atual, identificar o que realmente precisa mudar e validar se a estrutura continua aderente ao template esperado.
8. Se a pagina atual estiver fora do template esperado, perguntar ao usuario se ele quer apenas atualizar o conteudo atual ou reformatar a pagina para alinhamento estrutural antes de publicar.
9. So publicar com `confluence_create` ou `confluence_update` depois de revisar o XHTML local.
10. Se for necessario investigar historico ou recuperar uma publicacao incorreta, usar `confluence_versions` e `confluence_restore_version`.

Use `references/doc-workflow.md` como guia detalhado para update seguro, validacao contra template, pagina mae/filhas e rollback.

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

### Backend Node.js

Ao usar o template `Backend Node.js` (`852525087`), tratar como blocos estruturais obrigatorios quando eles fizerem parte da pagina:

- titulo com nome do projeto
- data do primeiro deploy
- data do ultimo deploy
- data da atualizacao do documento
- sumario
- area de apoio com links uteis

Regras especificas para esse template:

- preservar o layout base com blocos `fixed-width` e a secao lateral `two_right_sidebar` quando eles ja existirem
- preservar os macros `info` e `toc`, incluindo parametros e identificadores existentes
- manter a area de apoio visivel; nao remover a sidebar so porque o conteudo principal mudou
- se a documentacao estiver grande demais, usar pagina mae com visao geral e distribuir o detalhamento em paginas filhas
- quando o template estiver replicado em pagina mae e filhas, manter em ambas o cabecalho minimo com titulo, datas e area de apoio
- quando houver paginas filhas, manter na pagina mae o sumario com links para as filhas e revisar o conjunto antes de publicar

Checklist operacional detalhado em `references/doc-workflow.md`.

## Convencoes locais

- usar `docs/` como destino padrao
- usar extensao `.xhtml`
- para pagina existente, sempre puxar e salvar primeiro a versao atual do Confluence antes de qualquer publicacao
- usar o snapshot local como base obrigatoria de revisao e edicao em atualizacoes
- quando houver pagina mae e paginas filhas, puxar e revisar todas as paginas relevantes do conjunto antes de publicar
- preservar o corpo exatamente como veio da API quando o objetivo for espelhamento
- nao prettificar, limpar ou reserializar o XHTML
- nao remover `ac:*`, `ri:*`, `data-*`, `ac:local-id` ou `ac:macro-id`

## Guardrails

- nao duplicar cliente REST nem regras de auth dentro desta skill
- nao salvar credenciais no repositorio
- nao tratar a delegacao barata como substituto para decisao editorial
- nao escolher template sem verificar aderencia ao contexto tecnico
- nao publicar alteracoes sem antes revisar o XHTML local
- nao atualizar pagina existente sem antes puxar e salvar a versao atual localmente
- nao decidir sozinho por reformatacao estrutural quando a pagina atual estiver fora do template esperado
- nao restaurar versao sem `pageId` e `versionNumber` explicitamente definidos
- nao remover do template Node os blocos visiveis de titulo, datas, sumario e apoio sem uma decisao editorial explicita
- nao converter automaticamente o corpo para Markdown ao sincronizar com o Confluence

## Referencias

- `references/doc-workflow.md`
- `references/macro-examples.md`
