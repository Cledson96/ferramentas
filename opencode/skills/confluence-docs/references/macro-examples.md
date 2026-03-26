# Confluence macro examples

Use estes exemplos como referencia rapida de Storage Format XHTML. O objetivo principal e preservar a estrutura existente do Confluence, nao reescrever o body em outro formato.

## Regras de preservacao

- nao converter automaticamente para Markdown
- nao prettificar ou reserializar o XHTML
- nao remover `ac:*`, `ri:*`, `data-*`, `ac:local-id` ou `ac:macro-id`
- se a pagina veio de um template real, editar sobre essa estrutura em vez de reconstruir do zero

## Estrutura basica

```xml
<h1>Titulo</h1>
<h2>Subtitulo</h2>
<p>Texto com <strong>negrito</strong>, <em>italico</em> e <code>inline</code>.</p>
```

## Macro: code

```xml
<ac:structured-macro ac:name="code" ac:schema-version="1">
  <ac:parameter ac:name="language">json</ac:parameter>
  <ac:plain-text-body><![CDATA[{ "success": true }]]></ac:plain-text-body>
</ac:structured-macro>
```

## Macro: info

```xml
<ac:structured-macro ac:name="info" ac:schema-version="1" ac:local-id="abc123" ac:macro-id="macro-1">
  <ac:rich-text-body>
    <p>Atualizacao: <time datetime="2026-03-20" /></p>
  </ac:rich-text-body>
</ac:structured-macro>
```

## Macro: toc

Exemplo proximo do template real de Backend Node.js:

```xml
<ac:structured-macro ac:name="toc" ac:schema-version="1" ac:local-id="toc-1" ac:macro-id="macro-toc">
  <ac:parameter ac:name="minLevel">1</ac:parameter>
  <ac:parameter ac:name="maxLevel">7</ac:parameter>
  <ac:parameter ac:name="outline">false</ac:parameter>
  <ac:parameter ac:name="style">disc</ac:parameter>
  <ac:parameter ac:name="exclude"></ac:parameter>
  <ac:parameter ac:name="type">list</ac:parameter>
  <ac:parameter ac:name="printable">true</ac:parameter>
</ac:structured-macro>
```

## Macro: expand

```xml
<ac:structured-macro ac:name="expand" ac:schema-version="1">
  <ac:parameter ac:name="title">Ver detalhes</ac:parameter>
  <ac:rich-text-body>
    <p>Conteudo expandido para troubleshooting, links ou evidencia complementar.</p>
  </ac:rich-text-body>
</ac:structured-macro>
```

## Macros: note e warning

```xml
<ac:structured-macro ac:name="note" ac:schema-version="1">
  <ac:rich-text-body><p>Observacao importante.</p></ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="warning" ac:schema-version="1">
  <ac:rich-text-body><p>Risco ou cuidado operacional.</p></ac:rich-text-body>
</ac:structured-macro>
```

No Confluence Cloud, alguns desses macros aparecem como recursos legados do legacy editor. Ainda assim, eles continuam relevantes em fluxos baseados em Storage Format e em templates reais ja existentes. Se a pagina ou o template ja usa esses macros, preserve-os.

## Tabela

```xml
<table data-layout="default">
  <tbody>
    <tr>
      <th><p>Campo</p></th>
      <th><p>Valor</p></th>
    </tr>
    <tr>
      <td><p>Servico</p></td>
      <td><p>billing-api</p></td>
    </tr>
  </tbody>
</table>
```

## Layouts

### Layout simples em duas colunas

```xml
<ac:layout>
  <ac:layout-section ac:type="two_equal">
    <ac:layout-cell><p>Coluna esquerda</p></ac:layout-cell>
    <ac:layout-cell><p>Coluna direita</p></ac:layout-cell>
  </ac:layout-section>
</ac:layout>
```

### Estrutura comum do template Backend Node.js

```xml
<ac:layout>
  <ac:layout-section ac:type="fixed-width">
    <ac:layout-cell>
      <h1>Nome do projeto</h1>
      <ac:structured-macro ac:name="info" ac:schema-version="1">
        <ac:rich-text-body><p>Ultima atualizacao deste documento</p></ac:rich-text-body>
      </ac:structured-macro>
      <ac:structured-macro ac:name="toc" ac:schema-version="1" />
    </ac:layout-cell>
  </ac:layout-section>
  <ac:layout-section ac:type="two_right_sidebar">
    <ac:layout-cell>
      <h2>Arquitetura do sistema</h2>
      <p>Conteudo principal.</p>
    </ac:layout-cell>
    <ac:layout-cell>
      <p><strong>Apoio:</strong></p>
      <ul>
        <li><p>Repositorio</p></li>
        <li><p>Produto</p></li>
        <li><p>Ambientes</p></li>
      </ul>
    </ac:layout-cell>
  </ac:layout-section>
</ac:layout>
```

## Resource identifiers

### Link para outra pagina do Confluence

```xml
<ac:link>
  <ri:page ri:content-title="Documentacao Backend Node.js" />
  <ac:plain-text-link-body><![CDATA[Abrir documentacao]]></ac:plain-text-link-body>
</ac:link>
```

### Link externo

```xml
<ac:link>
  <ri:url ri:value="https://github.com/org/repo" />
  <ac:plain-text-link-body><![CDATA[Repositorio]]></ac:plain-text-link-body>
</ac:link>
```

## Quando usar estes exemplos

- para reconhecer a estrutura correta ao revisar `docs/*.xhtml`
- para editar um snapshot local preservando o Storage Format
- para comparar a pagina atual com o template esperado antes de publicar
- para confirmar quais macros, layouts e identificadores nao devem ser removidos
