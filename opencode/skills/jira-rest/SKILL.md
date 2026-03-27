---
name: jira-rest
description: Use para comentar e responder no Jira via custom tools do OpenCode, sempre em ADF. Acione quando o pedido mencionar Jira, issue keys como ENG-123, comentario tecnico, resposta em thread, atualizacao de card, fechamento, bloqueio ou validacao.
compatibility: opencode
---

# Jira REST

Use esta skill quando o trabalho envolver comentarios Jira com rich text em ADF.

## Regra principal

- Para publicar comentario novo, use `jira_comment` com `bodyAdfJson`
- Para responder uma thread, busque primeiro com `jira_comments` e depois use `jira_reply` com `bodyAdfJson`
- Use `body` apenas como fallback legado quando nao for viavel montar ADF
- Nao dependa de Markdown para heading, table, panel ou destaque no Jira Cloud REST

## Ferramentas

- `jira_get` para ler contexto do card antes de escrever
- `jira_comments` para listar comentarios ou buscar um comentario especifico por `commentId`
- `jira_comment` para criar novo comentario
- `jira_reply` para responder comentario existente

## Fluxo recomendado

1. Se houver issue key, chame `jira_get` para recuperar contexto e criterios
2. Se for resposta, chame `jira_comments({ issue, commentId })` antes de redigir
3. Monte o documento ADF usando o subset desta skill
4. Envie `bodyAdfJson: JSON.stringify(adfDoc)`
5. Resuma na resposta final o que foi publicado no Jira

## Padrao de escrita

- Escreva com tom tecnico, objetivo e verificavel
- Relacione a atualizacao aos criterios, validacoes, impacto ou comentario alvo
- Evite texto vago como `feito`, `ajustado` ou `resolvido` sem explicar comportamento e evidencia
- Se houver datas relativas, inclua tambem a data absoluta
- Prefira estruturas faceis de escanear: `heading`, `panel`, `table`, `bulletList`, `orderedList`, `rule`
- `table` esta liberada por decisao de produto, mesmo com tradeoff de renderizacao no mobile

## Como chamar

```js
jira_comment({
  issue: "ENG-123",
  bodyAdfJson: JSON.stringify(adfDoc),
})

jira_comments({
  issue: "ENG-123",
  commentId: "42723",
})

jira_reply({
  issue: "ENG-123",
  commentId: "42723",
  bodyAdfJson: JSON.stringify(adfDoc),
})
```

## Escolha rapida de template

- `progresso`: avancos parciais do ciclo atual
- `resposta`: resposta ponto a ponto a um comentario existente
- `fechamento`: consolidacao final e evidencia de entrega
- `bloqueio`: impedimento, dependencia ou risco
- `validacao`: evidencias de teste, homologacao ou checagem tecnica

## Referencias

- `references/adf-subset.md`
- `references/comment-templates.md`
