---
name: pr
description: "Cria PR com template padronizado e contexto do card Jira"
argument-hint: "[TASK-ID]"
disable-model-invocation: true
---

# Skill: Pull Request

Gera Pull Requests padronizadas com contexto do Jira automaticamente.

## Uso

```
/pr [CÓDIGO-DA-TASK]
```

Se o código da task não for informado, extrair do nome da branch atual (ex: `feature/TASK-123-descricao` → `TASK-123`). Se não encontrar, perguntar ao usuário.

## Instruções para o Claude

Quando o usuário executar `/pr`, siga estes passos na ordem:

### Passo 1 — Identificar o código da task

1. Se o usuário passou como argumento (ex: `/pr ENG-456`), use esse código
2. Caso contrário, execute `git branch --show-current` e extraia o código da task usando regex (padrão: letras maiúsculas + hífen + números, ex: `TASK-123`, `ENG-456`)
3. Se não encontrar em nenhum dos dois, pergunte ao usuário qual é o código da task

### Passo 2 — Buscar contexto no Jira

1. Use `getAccessibleAtlassianResources` para obter o `cloudId`
2. Use `getJiraIssue` com o `cloudId` e o código da task para obter:
   - `summary` (título da task)
   - `description` (descrição completa com critérios de aceite)
   - `issuetype.name` (tipo: Bug, Story, Task, etc.)
   - `status.name` (status atual)
   - `priority.name` (prioridade)
3. Extraia os critérios de aceite da descrição (buscar por bullets, checkboxes ou seção "critérios de aceite" / "acceptance criteria")

### Passo 3 — Detectar branch base e analisar mudanças

Execute `git branch -r` e detecte a branch base nesta ordem de prioridade:
- `origin/development` → usar `development`
- `origin/develop` → usar `develop`
- `origin/main` → usar `main`
- `origin/master` → usar `master`

Em seguida, execute em paralelo:
- `git log {BASE}..HEAD --oneline` — lista de commits da branch
- `git diff {BASE}...HEAD --stat` — arquivos alterados com resumo
- `git diff {BASE}...HEAD` — diff completo para entender o que mudou

Analise os diffs para gerar uma descrição técnica clara do que foi alterado e para validar os critérios de aceite.

### Passo 4 — Determinar o tipo de mudança

Infira automaticamente com base no tipo do card no Jira:
- **Bug** no Jira → marcar `Bug/Fix`
- **Story/Feature** no Jira → marcar `Nova feature`
- **Task** genérica → analisar os commits para decidir (refatoração, docs, etc.)

### Passo 5 — Montar o corpo da PR

Use EXATAMENTE este template, preenchendo com as informações coletadas:

```markdown
# {TÍTULO DA TASK NO JIRA} - [{CÓDIGO-DA-TASK}]

### Descrição:
{Descrição clara do que foi feito, baseada na análise do código + contexto do Jira. Seja objetivo e técnico.}

---

### Tipo de mudança:
- [{X se Bug/Fix}] Bug/Fix
- [{X se Nova feature}] Nova feature
- [{X se Refatoração}] Refatoração
- [{X se Documentação}] Documentação

---

### Testes:
{Descreva como a funcionalidade foi testada ou validada. Se houver testes automatizados, mencione. Se foi teste manual, descreva os passos.}

---

### Documentação:
{Indique se houve necessidade de atualização de documentação ou não.}

---

### Notas adicionais
- Card Jira: {status atual} | Prioridade: {prioridade}
- {Links para issues ou subtarefas relacionadas, se houver}

#### Critérios de aceite
{Se o card Jira foi encontrado, listar cada critério com status:}
- [x] {critério implementado — evidência encontrada no diff}
- [ ] {critério não implementado} _(motivo ou explicação, ex: "será implementado na próxima sprint")_

{Se não houver card Jira, omitir esta subseção.}

---

[{CÓDIGO-DA-TASK}](https://juscash.atlassian.net/browse/{CÓDIGO-DA-TASK})
```

### Passo 6 — Confirmar com o usuário

Antes de criar a PR, mostre o corpo montado e pergunte:

```
Quer ajustar algo antes de criar a PR? (confirme para criar ou informe os ajustes)
```

Aguarde a resposta. Se pedir ajustes, aplique e mostre novamente. Se confirmar, avance para o Passo 7.

### Passo 7 — Criar a PR

Após confirmação do usuário, execute:

```bash
gh pr create --title "{TÍTULO DA TASK} - [{CÓDIGO-DA-TASK}]" --body "$(cat <<'EOF'
{CORPO DA PR}
EOF
)" --base {BASE}
```

**Importante:** nunca adicionar menção ao Claude, co-autoria ou qualquer assinatura na PR. O conteúdo deve ser inteiramente do usuário.

## Exemplo

```
/pr ENG-123
```

Resultado: busca o card ENG-123 no Jira, detecta branch base, analisa os commits e diffs, monta a PR com template + checklist de critérios de aceite, e cria via `gh pr create`.
