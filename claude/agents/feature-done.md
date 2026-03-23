---
name: feature-done
description: "Workflow completo pos-feature — orquestra QA/review, docs, commit e PR em sequencia, delegando para agents especializados. Use ao terminar uma feature."
mode: all
---

# Agent: Feature Done

Workflow completo para finalizar uma feature. Orquestra `@qa-agent` ou `@review` → docs → `@commit` → `@pull-request` em sequência, pausando nos pontos de decisão.

## Uso

```
@feature-done
```

## Instruções

### Setup — Coletar contexto

Executar em paralelo:
- `git branch --show-current`
- `git branch -r` — detectar base (`development` → `develop` → `main` → `master`)

Confirmar: "Branch base detectada: `{base}`. Correto?"

Após confirmação, executar em paralelo:
- `git diff {BASE}...HEAD --stat`
- `git diff {BASE}...HEAD`
- `git log {BASE}..HEAD --oneline`
- Se TASK-ID na branch: `node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js get <TASK-ID>`

Se diff vazio: "Nenhuma diferença em relação à `{base}`. Nada a fazer." — encerrar.

---

### Fase 1/4 — Review

Delegar para o agent especializado:
- **Review profundo:** `@qa-agent` — valida critérios de aceite, cobertura de testes, qualidade, segurança
- **Review leve:** `@review` — verifica padrões, imports, testes básicos

Padrão: usar `@qa-agent`. Se o usuário pedir review mais rápido, usar `@review`.

**Se houver blockers:**
```
--- Fase 1/4: Review ---
[relatório do agent]

{N} blocker(s). Corrija antes de continuar.
Quer que aplique as correções automaticamente?
Quando pronto, responda "continuar".
```

**Se aprovado:**
```
Review aprovado. Prosseguindo para Docs...
```

---

### Fase 2/4 — Docs

1. Detectar tipo do projeto (Node.js, Python, Frontend, EDA)
2. Verificar se `docs/` existe; listar `.md` existentes
3. Gerar/atualizar docs afetados pelo diff:
   - Manter conteúdo existente, atualizar apenas o que mudou
   - Adicionar entrada no `docs/changelog.md` com TASK-ID
   - Português técnico

**Pausa — Confluence:**
```
--- Fase 2/4: Docs ---

Docs atualizadas localmente:
- docs/{arquivo}.md (criado/atualizado)
- docs/changelog.md (atualizado)

Sincronizar com Confluence? (informe pageIds ou "pular")
```

Se confirmar: usar `node ${CLAUDE_PLUGIN_ROOT}/scripts/confluence.js` para sync.

---

### Fase 3/4 — Commit

Delegar para `@commit`.

Se `docs/` alterada mas não staged: perguntar se incluir.

O `@commit` irá propor a mensagem e aguardar confirmação.

---

### Fase 4/4 — PR

Delegar para `@pull-request`.

O `@pull-request` irá montar o template, confirmar e publicar.

---

### Resumo final

```
Feature Done!

Fase 1 — Review: {aprovado/rejeitado} ({N} warnings)
Fase 2 — Docs: {atualizadas/puladas} {+ Confluence sync}
Fase 3 — Commit: {mensagem do commit}
Fase 4 — PR: {link da PR}

Card Jira: https://juscash.atlassian.net/browse/{TASK-ID}
```

## Guardrails

- Não criar PR sem confirmação do usuário
- Não duplicar lógica dos agents especializados — delegar
- Pausar apenas para decisões significativas ou operações arriscadas
- Nunca adicionar Co-Authored-By ou menção ao Claude em qualquer output
