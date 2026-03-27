# Jira comment ADF subset

Use este subconjunto como padrao para comentarios e replies no Jira.

## Envelope obrigatorio

```json
{
  "type": "doc",
  "version": 1,
  "content": []
}
```

Sempre envie o documento serializado em `bodyAdfJson`.

## Blocos recomendados

- `paragraph`: texto base e observacoes curtas
- `heading`: separacao visual de secoes; prefira niveis 2 e 3
- `bulletList`: listas de realizado, pendencias, bloqueios e proximos passos
- `orderedList`: respostas ponto a ponto quando fizer mais sentido que tabela
- `panel`: destaque contextual com `info`, `note`, `warning`, `success`, `error`
- `table`: estrutura principal para criterio/status/evidencia; uso liberado mesmo sem suporte mobile
- `expand`: detalhamento colapsavel para evidencias longas
- `codeBlock`: payloads, comandos e trechos de log
- `rule`: separador entre bloco principal e secoes finais

## Inline permitido

- `text`
- `status`
- `hardBreak`

## Marks permitidos

- `strong`
- `em`
- `code`
- `link`

## Padroes uteis

### Heading

```json
{
  "type": "heading",
  "attrs": { "level": 2 },
  "content": [{ "type": "text", "text": "Atualizacao de progresso" }]
}
```

### Panel

```json
{
  "type": "panel",
  "attrs": { "panelType": "info" },
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Contexto do ciclo atual" }]
    }
  ]
}
```

### Status inline

```json
{
  "type": "paragraph",
  "content": [
    {
      "type": "status",
      "attrs": { "text": "realizado", "color": "green" }
    }
  ]
}
```

### Table skeleton

```json
{
  "type": "table",
  "content": [
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableHeader",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Criterio", "marks": [{ "type": "strong" }] }]
            }
          ]
        },
        {
          "type": "tableHeader",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Status", "marks": [{ "type": "strong" }] }]
            }
          ]
        }
      ]
    }
  ]
}
```

### Expand

```json
{
  "type": "expand",
  "attrs": { "title": "Evidencias complementares" },
  "content": [
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Link para video de validacao" }]
            }
          ]
        }
      ]
    }
  ]
}
```

### Link mark

```json
{
  "type": "text",
  "text": "Abrir PR",
  "marks": [
    {
      "type": "link",
      "attrs": { "href": "https://github.com/org/repo/pull/123" }
    }
  ]
}
```

## Evite

- Nodes fora deste subset, mesmo que existam no schema completo da Atlassian
- Markdown cru esperando renderizar como heading ou table
- Comentarios longos em um unico `paragraph`
- Texto sem estrutura quando existir mais de um topico
