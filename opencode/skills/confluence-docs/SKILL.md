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
3. Quando a pagina ja existir, puxar obrigatoriamente a versao atual antes de editar e usar esse snapshot como base local.
4. Fazer pull das paginas escolhidas com `confluence_pull_pages`, salvando em `docs/` com extensao `.xhtml`.
5. Atualizar os arquivos locais preservando exatamente o Storage Format XHTML.
6. Se a tarefa for documentacao tecnica, escolher o template mais aderente antes de criar ou reorganizar conteudo.
7. Validar se a pagina e uma pagina indice/pai de secao ou uma pagina filha de detalhamento tecnico; isso muda a forma correta de aplicar o template.
8. So publicar com `confluence_create` ou `confluence_update` depois de revisar o XHTML local.

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

Ao usar o template `Backend Node.js` (`852525087`), tratar como obrigatorios os blocos visiveis de:

- titulo
- datas do documento/deploy
- area de apoio
- sumario

Regras praticas para evitar erros comuns de layout e semantica:

- quando a pagina usar cabecalho em layout, preferir no topo um bloco `two_equal` com `info` na esquerda e `Apoio` na direita
- colocar o `toc` em uma secao propria logo abaixo desse cabecalho, e nao misturado dentro do mesmo bloco lateral
- evitar duplicar o bloco de datas em outra secao depois do cabecalho
- preservar `ac:layout`, `ac:layout-section`, `ac:layout-cell`, macros e parametros existentes quando o objetivo for alinhar o conteudo ao template sem quebrar o render
- para paginas filhas de secao/indice (ex.: uma pagina mae de "5. Modulos"), nao forcar uma secao generica de `Introducao ao Projeto` se a semantica correta for de indice da secao
- em paginas filhas de secao/indice, organizar o conteudo conforme a natureza da secao; por exemplo, em `Modulos`, privilegiar estruturas como `5.1 Visao Geral`, `5.2 Estrutura Padrao de Modulo` e `5.3 Modulos Disponiveis`
- em paginas filhas de detalhamento tecnico de um modulo, manter a descricao detalhada do modulo/fluxo, contratos, persistencia, filas, riscos e observacoes operacionais
- se a pagina atual estiver fora do template esperado, decidir conscientemente entre: (a) preservar o estilo atual da arvore por compatibilidade visual ou (b) reformatar para aderencia estrita ao template; quando houver ambiguidade editorial, confirmar com o usuario

## Convencoes locais

- usar `docs/` como destino padrao
- usar extensao `.xhtml`
- para pagina existente, sempre puxar e salvar primeiro a versao atual do Confluence antes de qualquer publicacao
- usar o snapshot local como base obrigatoria de revisao e edicao em atualizacoes
- quando houver pagina mae e paginas filhas, revisar a funcao editorial de cada pagina antes de replicar secoes do template literalmente
- preservar o corpo exatamente como veio da API quando o objetivo for espelhamento
- nao prettificar, limpar ou reserializar o XHTML
- nao remover `ac:*`, `ri:*`, `data-*`, `ac:local-id` ou `ac:macro-id`

## Guardrails

- nao duplicar cliente REST nem regras de auth dentro desta skill
- nao salvar credenciais no repositorio
- nao tratar a delegacao barata como substituto para decisao editorial
- nao escolher template sem verificar aderencia ao contexto tecnico
- nao publicar alteracoes sem antes revisar o XHTML local
- nao assumir que toda pagina filha deve receber uma `Introducao ao Projeto`; primeiro validar se ela e pagina indice de secao ou pagina de detalhamento
- nao inverter a hierarquia visual do cabecalho do template Node quando a intencao for seguir o padrao aprovado: `info` com datas na esquerda, `Apoio` na direita e `Sumario` abaixo
- nao duplicar bloco de `info`/datas em mais de um ponto do cabecalho sem necessidade editorial explicita
- nao converter automaticamente o corpo para Markdown ao sincronizar com o Confluence

## Referencia rapida: Confluence Storage Format

```xml
<!-- Headings -->
<h1>Titulo</h1>
<h2>Subtitulo</h2>

<!-- Paragrafos -->
<p>Texto com <strong>negrito</strong> e <em>italico</em>.</p>

<!-- Codigo inline -->
<code>valor</code>

<!-- Macro: Bloco de Codigo -->
<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">json</ac:parameter>
  <ac:plain-text-body><![CDATA[{ "success": true }]]></ac:plain-text-body>
</ac:structured-macro>

<!-- Macro: Painel Info -->
<ac:structured-macro ac:name="info" ac:schema-version="1">
  <ac:rich-text-body><p>Atualizacao: <time datetime="2026-03-20" /></p></ac:rich-text-body>
</ac:structured-macro>

<!-- Macro: TOC -->
<ac:structured-macro ac:name="toc" ac:schema-version="1">
  <ac:parameter ac:name="maxLevel">2</ac:parameter>
</ac:structured-macro>

<!-- Tabela -->
<table data-layout="default">
  <tbody>
    <tr><th><p>Coluna</p></th></tr>
    <tr><td><p>Valor</p></td></tr>
  </tbody>
</table>

<!-- Layout 2 colunas -->
<ac:layout>
  <ac:layout-section ac:type="two_equal">
    <ac:layout-cell><!-- esquerda --></ac:layout-cell>
    <ac:layout-cell><!-- direita --></ac:layout-cell>
  </ac:layout-section>
</ac:layout>
```
