# Jira comment templates

Use estes templates como composicao de blocos. Monte `adfDoc = { type: "doc", version: 1, content: [...] }` e envie com `JSON.stringify(adfDoc)` em `bodyAdfJson`.

## Template: progresso

Ordem recomendada do `content`:

1. `heading` nivel 2 com `Atualizacao de progresso`
2. `panel` `info` com o contexto do ciclo atual
3. `table` com colunas `Criterio | Status | Detalhe tecnico`
4. `rule`
5. `heading` + `bulletList` para `Realizado`
6. `heading` + `bulletList` para `Pendencias`
7. `heading` + `bulletList` para `Bloqueios`
8. `heading` + `bulletList` para `Proximo passo`

Use quando o comentario precisa mostrar avancos parciais e o status dos criterios impactados.

## Template: resposta

Ordem recomendada do `content`:

1. `panel` `note` ou `warning` com `Comentario alvo`, `Autor original` e `Resumo`
2. `heading` nivel 2 com `Resposta tecnica`
3. `panel` `info` opcional com contexto adicional
4. `table` com colunas `Ponto | Status | Resposta`
5. `rule`
6. `heading` + `bulletList` para `Realizado`
7. `heading` + `bulletList` para `Pendencias`
8. `heading` + `bulletList` para `Bloqueios`
9. `heading` + `bulletList` para `Proximo passo`

Use quando estiver respondendo um comentario existente e precisar atacar duvidas ou cobrancas ponto a ponto.

## Template: fechamento

Ordem recomendada do `content`:

1. `heading` nivel 2 com `Fechamento tecnico`
2. `panel` `success` com contexto final da entrega
3. `table` com colunas `Criterio | Status final | Evidencia`
4. `expand` opcional para logs, links ou evidencias extras
5. `rule`
6. `heading` + `bulletList` para `Realizado`
7. `heading` + `bulletList` para `Pendencias`
8. `heading` + `bulletList` para `Bloqueios`
9. `heading` + `bulletList` para `Proximo passo`

Use quando o card estiver pronto para validacao final, QA ou encerramento tecnico.

## Template: bloqueio

Ordem recomendada do `content`:

1. `heading` nivel 2 com `Bloqueio tecnico`
2. `panel` `warning` com a descricao do impedimento
3. `table` com colunas `Origem | Impacto | Acao necessaria`
4. `rule`
5. `heading` + `bulletList` para `Ja realizado`
6. `heading` + `bulletList` para `Dependencias`
7. `heading` + `bulletList` para `Riscos`
8. `heading` + `bulletList` para `Proximo passo`

Use quando o objetivo for explicitar dependencia externa, risco ou impedimento real.

## Template: validacao

Ordem recomendada do `content`:

1. `heading` nivel 2 com `Validacao executada`
2. `panel` `success` ou `note` com escopo da checagem
3. `table` com colunas `Cenario | Resultado | Evidencia`
4. `codeBlock` opcional para comando, query ou payload validado
5. `rule`
6. `heading` + `bulletList` para `Cobertura`
7. `heading` + `bulletList` para `Achados`
8. `heading` + `bulletList` para `Proximo passo`

Use quando o comentario principal for sobre testes, homologacao, smoke, reproducoes ou evidencias.

## Heuristicas de escolha

- Se a informacao principal e uma matriz de criterio/status, prefira `table`
- Se o bloco tem papel de alerta ou contexto, prefira `panel`
- Se ha muita evidencia complementar, prefira `expand`
- Se a resposta e curta, remova blocos vazios em vez de publicar secoes artificiais
- Se houver link importante, aplique `link` mark no texto em vez de colar URL solta em uma linha sem contexto
