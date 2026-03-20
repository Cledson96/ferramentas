---
name: docs
description: "Gera documentacao tecnica em docs/ e sincroniza com Confluence (espaco Tech) via REST API com Storage Format XHTML. Usar apos implementar uma feature."
disable-model-invocation: true
---

# Skill: Docs

Gera ou atualiza documentação técnica na pasta `docs/` do projeto (fonte de verdade, versionada no git) e sincroniza com o Confluence no espaço **Tech (DT)** usando a REST API diretamente.

**Formato dos docs locais: `.xhtml` (Confluence Storage Format exato)**

> Os arquivos locais são salvos no mesmo formato que o Confluence usa internamente (Storage Format XHTML). Isso garante que o conteúdo publicado no Confluence seja sempre idêntico ao que está no repositório — sem perdas de formatação, macros ou layout.

## Uso

```
/docs
```

---

## Instruções para o Claude

Quando o usuário executar `/docs`, siga estes passos:

### Passo 0 — Verificar credenciais Confluence

Verificar se as credenciais estão configuradas:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js search --cql 'space = "DT" AND title = "API SIJ"'
```

**Se retornar erro de credenciais** (saída contiver `"error"` com mensagem sobre credenciais):

Perguntar ao usuário:
```
Para sincronizar com o Confluence preciso das suas credenciais Atlassian (são salvas globalmente em ~/.claude/atlassian.json — nunca no repositório).

1. Seu email Atlassian:
2. Seu API token (gerar em: https://id.atlassian.com/manage-profile/security/api-tokens):
```

Após o usuário fornecer, salvar com:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js setup --email <EMAIL> --token <TOKEN>
```

Confirmar e prosseguir. **Não armazenar as credenciais em nenhum arquivo do projeto.**

---

### Passo 1 — Entender o que foi implementado

Execute em paralelo:
- `git branch --show-current` — branch atual
- `git diff {BASE}...HEAD --stat` — arquivos alterados
- `git diff {BASE}...HEAD` — diff completo

Se houver TASK-ID na branch (regex: letras maiúsculas + hífen + números, ex: `ENG-123`):
1. Usar `getAccessibleAtlassianResources` para obter o `cloudId`
2. Usar `getJiraIssue` para buscar o card: `summary`, `description`, `issuetype.name`
3. Extrair da descrição: o que foi implementado, contexto de negócio, critérios técnicos

Se não encontrar TASK-ID ou card Jira, continuar sem esse contexto.

---

### Passo 2 — Verificar docs existentes

1. Verificar se a pasta `docs/` existe na raiz do projeto
2. Listar arquivos `.xhtml` em `docs/` — estes são os docs sincronizados com o Confluence
3. Identificar quais arquivos precisam ser criados ou atualizados com base no diff

**Se `docs/` não existir ou não tiver `.xhtml`:**

Perguntar ao usuário:
```
Não encontrei docs locais em docs/.

Já existe documentação deste projeto no Confluence?
- Se sim, informe o link da página (ou das páginas) para eu importar.
- Se não, vou gerar a documentação do zero.
```

---

### Passo 3 — Puxar documentação do Confluence (Pull)

**Sempre usar a REST API diretamente para obter o Storage Format exato.**

Para cada página do Confluence a sincronizar, usar o script Node.js do plugin:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js get --page-id <PAGE_ID>
```

O output retorna JSON com o campo `body` em Confluence Storage Format (XHTML). Salvar esse conteúdo como arquivo `.xhtml` local:

```
docs/{prefixo}-{NOME}.xhtml
```

Exemplos de nomes:
- `docs/07-API-ENDPOINTS.xhtml`
- `docs/05-MODULOS.xhtml`
- `docs/08-SISTEMA-FILAS.xhtml`

**Não converter para Markdown.** O XHTML é o formato de trabalho — é legível, versionável e pode ser enviado de volta ao Confluence sem perdas.

O `pageId` fica no final da URL do Confluence:
```
https://juscash.atlassian.net/wiki/spaces/tech/pages/769196193/...
                                                     ^^^^^^^^^
                                                     pageId = 769196193
```

---

### Passo 4 — Atualizar doc local com nova feature

Após puxar o XHTML atual do Confluence, editar o arquivo `.xhtml` para incluir as mudanças da feature:

- Adicionar novos endpoints, módulos ou seções usando Storage Format XHTML
- Atualizar datas no painel `info` (ex: `<time datetime="2026-03-17" />`)
- Preservar toda a estrutura existente: layout de 2 colunas, macros `toc`, `info`, `code`, etc.
- **Não remover** `ac:local-id`, `ac:macro-id` ou outros atributos internos do Confluence — eles são necessários para a renderização correta

---

### Passo 5 — Apresentar resultado e perguntar sobre Confluence

Após atualizar os `.xhtml` locais, mostrar ao usuário:

```
Docs atualizados em docs/:
- docs/07-API-ENDPOINTS.xhtml (atualizado — novo endpoint POST /analise-ia/processos-oab)
- docs/05-MODULOS.xhtml (atualizado — seção 5.3 Módulo Análise IA)

Quer sincronizar com o Confluence?
```

Aguardar confirmação antes de prosseguir.

---

### Passo 6 — Enviar para o Confluence (Push)

**Sempre usar a REST API diretamente. O arquivo `.xhtml` local é enviado sem nenhuma conversão.**

Para cada arquivo `.xhtml` a publicar:

#### 6.1 — Buscar pageId e versão atual

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js search --cql 'space = "DT" AND title = "Nome da Página"'
```

#### 6.2 — Enviar o XHTML diretamente

**Se a página existir:**
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js update --page-id <ID> --title "Nome da Página" --body-file docs/{arquivo}.xhtml
```

**Se a página não existir** → perguntar ao usuário em qual seção/página pai criar:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js create --title "Nome da Página" --body-file docs/{arquivo}.xhtml --parent-id <PARENT_ID>
```

> O script `confluence.js` lê o arquivo `.xhtml` e envia como `body.storage.representation = "storage"` via REST API. Nenhuma conversão é feita.

---

### Passo 7 — Confirmar resultado

```
docs/07-API-ENDPOINTS.xhtml — atualizado localmente
Confluence: "7. API Endpoints SIJ" — sincronizado (versão 9)
  https://juscash.atlassian.net/wiki/spaces/tech/pages/769196193/...

Lembre-se de commitar os docs locais:
  git add docs/
  /commit
```

---

## Configuração Confluence

- **Espaço Tech**: key `DT`, id `164069`
- **URL base**: `https://juscash.atlassian.net/wiki`
- **Auth**: lido de `~/.claude/atlassian.json` (salvo via `confluence.js setup`) ou env vars `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN`
- **Nunca salvar credenciais no repositório do projeto**
- **Script**: `${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js`
- **REST API pull**: `GET /wiki/rest/api/content/{pageId}?expand=body.storage`
- **REST API push**: `PUT /wiki/rest/api/content/{pageId}` com `body.storage`

---

## Referência: Confluence Storage Format

O Confluence Storage Format é XHTML com macros proprietários da Atlassian. Os arquivos `.xhtml` locais usam este formato exatamente como vem da API REST.

### Elementos comuns

```xml
<!-- Headings -->
<h1>Título Principal</h1>
<h2>Subtítulo</h2>

<!-- Parágrafos -->
<p>Texto com <strong>negrito</strong> e <em>itálico</em>.</p>

<!-- Código inline -->
<code>valor</code>

<!-- Link externo -->
<a href="https://example.com">Texto</a>

<!-- Separador -->
<hr />

<!-- Data -->
<time datetime="2026-03-17" />
```

### Layout 2 colunas

```xml
<ac:layout>
  <ac:layout-section ac:type="two_equal" ac:breakout-mode="wide">
    <ac:layout-cell>
      <!-- coluna esquerda -->
    </ac:layout-cell>
    <ac:layout-cell>
      <!-- coluna direita -->
    </ac:layout-cell>
  </ac:layout-section>
  <ac:layout-section ac:type="fixed-width">
    <ac:layout-cell>
      <!-- conteúdo principal -->
    </ac:layout-cell>
  </ac:layout-section>
</ac:layout>
```

### Macro: Painel Info

```xml
<ac:structured-macro ac:name="info" ac:schema-version="1">
  <ac:rich-text-body>
    <p>Atualização: <time datetime="2026-03-17" /></p>
  </ac:rich-text-body>
</ac:structured-macro>
```

### Macro: TOC

```xml
<ac:structured-macro ac:name="toc" ac:schema-version="1">
  <ac:parameter ac:name="maxLevel">2</ac:parameter>
  <ac:parameter ac:name="minLevel">1</ac:parameter>
  <ac:parameter ac:name="exclude">Sumário</ac:parameter>
  <ac:parameter ac:name="style">none</ac:parameter>
  <ac:parameter ac:name="type">list</ac:parameter>
  <ac:parameter ac:name="printable">true</ac:parameter>
</ac:structured-macro>
```

### Macro: Bloco de Código

```xml
<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">json</ac:parameter>
  <ac:plain-text-body><![CDATA[
{
  "success": true,
  "data": {}
}
  ]]></ac:plain-text-body>
</ac:structured-macro>
```

### Macro: Warning / Note / Panel

```xml
<ac:structured-macro ac:name="warning" ac:schema-version="1">
  <ac:parameter ac:name="title">Atenção</ac:parameter>
  <ac:rich-text-body><p>Mensagem de alerta.</p></ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="note" ac:schema-version="1">
  <ac:rich-text-body><p>Observação.</p></ac:rich-text-body>
</ac:structured-macro>
```

### Tabelas

```xml
<table data-layout="default">
  <tbody>
    <tr>
      <th><p>Coluna 1</p></th>
      <th><p>Coluna 2</p></th>
    </tr>
    <tr>
      <td><p>Valor 1</p></td>
      <td><p>Valor 2</p></td>
    </tr>
  </tbody>
</table>
```

### Listas

```xml
<ul>
  <li><p>Item 1</p></li>
  <li><p>Item 2</p></li>
</ul>

<ol>
  <li><p>Primeiro</p></li>
  <li><p>Segundo</p></li>
</ol>
```
