# Confluence doc workflow

Use este guia como referencia operacional para importacao, update seguro, validacao contra template e rollback.

## Fluxo por tipo de trabalho

### Importacao ou espelhamento local

1. Identificar a pagina pai ou o `pageId` inicial.
2. Usar `confluence_tree` para mapear pagina mae e filhas relevantes.
3. Fazer `confluence_pull_pages` para salvar snapshots em `docs/*.xhtml`.
4. Preservar o body exatamente como veio da API se o objetivo for apenas espelhar.

### Update de pagina existente

Seguir sempre esta ordem:

1. identificar o `pageId` alvo e o template esperado
2. puxar a versao atual com `confluence_get` ou `confluence_pull_pages`
3. salvar a versao atual localmente em `docs/*.xhtml`
4. revisar o estado atual da pagina antes de editar
5. comparar a estrutura atual com o template esperado
6. decidir o que realmente precisa ser alterado
7. perguntar ao usuario antes de reformatar a pagina quando houver desalinhamento estrutural
8. editar o XHTML preservando layout, macros, identificadores e blocos obrigatorios existentes
9. publicar a nova versao

`update` nao e apenas subir um arquivo. O agente deve primeiro entender como a pagina esta hoje, o que precisa mudar e se a estrutura atual ainda esta compativel com o template adotado.

### Criacao do zero

1. Escolher o template tecnico correto.
2. Se necessario, buscar o template real com `confluence_get` para usar a estrutura como base.
3. Criar o arquivo local em `docs/*.xhtml` preservando a estrutura de layout e macros do template.
4. Publicar com `confluence_create` somente depois de revisar o XHTML local.

### Historico e recuperacao

1. Usar `confluence_versions` para listar versoes recentes.
2. Confirmar `pageId` e `versionNumber` antes de qualquer rollback.
3. Usar `confluence_restore_version` apenas quando a versao alvo estiver fechada.
4. Lembrar que restaurar uma versao anterior cria uma nova versao com o conteudo restaurado.

## Validacao contra template antes de publicar

Antes de publicar um `update`, validar pelo menos:

- se a pagina ainda segue o template tecnico correto para o contexto
- se a hierarquia de headings continua coerente
- se layouts, sidebars, blocos de apoio e secoes fixas foram preservados quando ja existirem
- se macros como `toc`, `info`, `note`, `warning`, `expand` e `code` continuam corretas quando aplicaveis
- se `ac:local-id`, `ac:macro-id`, `ri:*` e `data-*` foram preservados
- se a pagina foi preenchida sobre a estrutura existente, e nao reconstruida de forma destrutiva

Se a pagina atual nao estiver aderente ao template esperado, nao decidir sozinho por uma reformatacao estrutural.

## Pergunta padrao quando a pagina estiver fora do template

Use esta formulacao:

```text
A pagina atual nao esta aderente ao template esperado (`<nome do template>`). Deseja que eu:
1. atualize apenas o conteudo, preservando a estrutura atual; ou
2. reformate a pagina para alinhamento ao template antes de publicar?
```

## Pagina mae e paginas filhas

Quando a documentacao estiver segmentada:

- revisar a pagina mae antes de atualizar filhas
- verificar se o sumario da pagina mae aponta para as paginas filhas corretas
- verificar se links de navegacao e contexto geral continuam coerentes
- puxar e revisar todas as paginas relevantes do conjunto antes de publicar

Nao trate uma pagina filha como edicao isolada se a estrutura do template distribuir contexto entre mae e filhas.

## Checklist do template Backend Node.js

Template base: `852525087`.

Blocos que normalmente precisam continuar visiveis:

- titulo com nome do projeto
- data do primeiro deploy
- data do ultimo deploy
- data da atualizacao do documento
- sumario
- area de apoio com links uteis

Pontos de validacao especificos:

- preservar layout `fixed-width`
- preservar layout `two_right_sidebar` quando a pagina usar sidebar
- preservar macros `info` e `toc`, incluindo parametros e identificadores existentes
- manter a area de apoio visivel
- em docs extensas, usar pagina mae para visao geral e filhas para detalhamento
- quando o template estiver replicado em pagina mae e filhas, manter em ambas o cabecalho minimo com titulo, datas e area de apoio
- na pagina mae, manter sumario com links para as filhas

## Delegacao recomendada

Delegar para agente mais barato apenas operacoes mecanicas e com parametros fechados, por exemplo:

- `confluence_get`
- `confluence_pull_pages`
- `confluence_versions`
- `confluence_create`
- `confluence_update`
- `confluence_restore_version`
- mapeamento de `pageId` para arquivos locais

Manter no agente principal:

- escolha de template
- decisao sobre pagina mae e filhas
- comparacao entre pagina atual, template esperado e mudanca desejada
- decisao sobre reformatacao estrutural
- validacao final antes de publicar

## Exemplos de uso das tools

```js
confluence_pull_pages({
  pages: [
    { pageId: "852525087", outputFile: "docs/template-node.xhtml" },
  ],
})

confluence_versions({
  pageId: "852525087",
  limit: "10",
})

confluence_restore_version({
  pageId: "852525087",
  versionNumber: "34",
  message: "Rollback apos upload incorreto",
  restoreTitle: true,
})
```
