---
name: docs
description: "Gera e sincroniza documentacao tecnica entre repositorio e Confluence. Acione quando precisar criar, atualizar ou importar documentacao, escolher templates tecnicos, organizar arquivos .xhtml em docs/ ou sincronizar com o Confluence."
disable-model-invocation: false
---

# Skill: Docs

Orquestra documentacao tecnica: gera docs locais em `docs/` (fonte de verdade, versionada no git) e sincroniza com o Confluence no espaco **Tech (DT)**.

Esta skill delega toda operacao REST ao Confluence para a skill `confluence-rest`. Nao duplica logica de acesso, credenciais ou comandos.

## Uso

```
/docs
```

## Dependencia operacional

Para qualquer operacao de Confluence, usar o script via skill `confluence-rest`:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js <comando> [opcoes]
```

Se a credencial nao existir, seguir o fluxo de setup da skill `confluence-rest`.

## Instruções para o Claude

Quando detectar que precisa documentar algo (invocacao direta via `/docs`, durante `/feature-done`, ou ao falar de "docs", "documentacao", "documentar"), seguir este fluxo:

### Passo 1 — Entender o que foi implementado

Executar em paralelo:
- `git branch --show-current` — branch atual
- `git diff {BASE}...HEAD --stat` — arquivos alterados
- `git diff {BASE}...HEAD` — diff completo

Se houver TASK-ID na branch (regex: letras maiusculas + hifen + numeros):
1. Usar `getAccessibleAtlassianResources` para obter o `cloudId`
2. Usar `getJiraIssue` para buscar: `summary`, `description`, `issuetype.name`
3. Extrair da descricao: o que foi implementado, contexto de negocio, criterios tecnicos

Se nao encontrar TASK-ID ou card Jira, continuar sem esse contexto.

### Passo 2 — Verificar docs existentes

1. Verificar se a pasta `docs/` existe na raiz do projeto
2. Listar arquivos `.xhtml` em `docs/`
3. Identificar quais precisam ser criados ou atualizados

**Se `docs/` nao existir ou estiver vazia:**

Perguntar ao usuario:
```
Nao encontrei docs locais em docs/.

Ja existe documentacao deste projeto no Confluence?
- Se sim, informe o link da pagina pai para eu importar a arvore.
- Se nao, vou gerar do zero usando o template mais adequado.
```

### Passo 3 — Pull do Confluence (importacao)

Se houver paginas existentes no Confluence para importar:

1. Usar `tree` para ver a hierarquia completa (metadados leves, sem body):
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js tree --page-id <PARENT_ID>
```

2. Decidir quais paginas baixar baseado no contexto da feature

3. Usar `pull-pages` para download em lote:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js pull-pages --pages-json '[{"pageId":"...","outputFile":"docs/..."}]'
```

4. O `pageId` fica no final da URL do Confluence:
```
https://juscash.atlassian.net/wiki/spaces/tech/pages/769196193/...
                                                     ^^^^^^^^^
                                                     pageId = 769196193
```

### Passo 4 — Escolher template (se criacao do zero)

Se for criar documentacao nova, escolher o template mais adequado baseado no tipo de projeto.

Pagina raiz de templates: `843415557`

| Template | pageId | Quando usar |
|----------|--------|-------------|
| Backend Node.js | `852525087` | APIs, workers, servicos e modulos Node |
| Backend Python | `851509330` | Servicos, jobs e automacoes em Python |
| Frontend | `935952386` | Apps web, interfaces, componentes, rotas |
| EDA raiz | `889520130` | Dominio ou modulo de Event-Driven Architecture |
| Fluxo EDA | `918913028` | Fluxos de eventos ponta a ponta |
| Modulo EDA visao geral | `918618121` | Visao geral de um modulo EDA |
| Modulo EDA visao especifica | `919568388` | Recorte interno de um modulo EDA |
| Servicos EDA | `918061064` | Servicos que publicam ou consomem eventos |
| Banco de Dados | `936148994` | Tabelas, relacionamentos, indices, modelagem |
| PRD Tecnico | `1022001158` | Especificacao tecnica orientada a produto |

Para escolher o template:
1. Usar `get` para puxar o template escolhido como base
2. Adaptar o conteudo XHTML para o projeto atual
3. Salvar em `docs/` com nome descritivo

### Passo 5 — Atualizar doc local com nova feature

Apos puxar o XHTML atual do Confluence (ou criar do zero):

- Adicionar novos endpoints, modulos ou secoes usando Storage Format XHTML
- Atualizar datas no painel `info` (ex: `<time datetime="2026-03-20" />`)
- Preservar toda a estrutura existente: layout de 2 colunas, macros `toc`, `info`, `code`, etc.
- **Nao remover** `ac:local-id`, `ac:macro-id` ou outros atributos internos do Confluence

### Passo 6 — Apresentar resultado e perguntar sobre Confluence

Apos atualizar os `.xhtml` locais, mostrar ao usuario:

```
Docs atualizados em docs/:
- docs/07-API-ENDPOINTS.xhtml (atualizado — novo endpoint POST /analise-ia/processos-oab)
- docs/05-MODULOS.xhtml (atualizado — secao 5.3 Modulo Analise IA)

Quer sincronizar com o Confluence?
```

Aguardar confirmacao antes de prosseguir.

### Passo 7 — Enviar para o Confluence (Push)

Para cada arquivo `.xhtml` a publicar:

**Se a pagina existir no Confluence:**
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js search --cql 'space = "DT" AND title = "Nome da Pagina"'
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js update --page-id <ID> --title "Nome da Pagina" --body-file docs/{arquivo}.xhtml
```

**Se a pagina nao existir** — perguntar ao usuario em qual pagina pai criar:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js create --title "Nome da Pagina" --body-file docs/{arquivo}.xhtml --parent-id <PARENT_ID>
```

### Passo 8 — Confirmar resultado

```
docs/07-API-ENDPOINTS.xhtml — atualizado localmente
Confluence: "7. API Endpoints SIJ" — sincronizado (versao 9)
  https://juscash.atlassian.net/wiki/spaces/tech/pages/769196193/...

Lembre-se de commitar os docs locais:
  git add docs/
  /commit
```

---

## Convencoes locais

- usar `docs/` como destino padrao
- usar extensao `.xhtml`
- preservar o corpo exatamente como veio da API quando for espelhamento
- nao prettificar, limpar ou reserializar o XHTML
- nao remover `ac:*`, `ri:*`, `data-*`, `ac:local-id` ou `ac:macro-id`

## Configuracao Confluence

- **Espaco Tech**: key `DT`, id `164069`
- **URL base**: `https://juscash.atlassian.net/wiki`
- **Auth**: lido de `~/.claude/atlassian.json` (salvo via `confluence.js setup`)
- **Script**: `${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js`

## Guardrails

- Nao duplicar cliente REST nem regras de auth — delegar para `confluence-rest`
- Nao salvar credenciais no repositorio
- Nao escolher template sem verificar aderencia ao contexto tecnico
- Nao publicar alteracoes sem antes revisar o XHTML local e obter confirmacao
- Nao converter automaticamente o corpo para Markdown ao sincronizar
- Nao puxar pagina solta sem antes verificar a arvore da pagina pai
- Nao prettificar, limpar ou reserializar o XHTML ao salvar localmente

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
