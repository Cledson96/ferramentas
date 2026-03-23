---
name: pull-request
description: "Cria PR com template padronizado e contexto do card Jira. Use quando o usuario quiser abrir PR no Codex, com base detectada automaticamente e publicacao orientada pela skill github-terminal."
---

# Skill: Pull Request

Gera Pull Requests padronizadas com contexto do Jira e fluxo de criacao sem depender de `gh` como caminho principal.

## Uso

```
$pull-request [CODIGO-DA-TASK opcional]
```

Se o codigo da task nao for informado, extraia do nome da branch atual (ex: `feature/TASK-123-descricao` -> `TASK-123`). Se nao encontrar, pergunte ao usuario.

## Instrucoes para o Codex

Quando houver intencao de abrir PR, siga estes passos na ordem:

### Passo 1 — Detectar branch base automaticamente

1. Execute `git branch -r` e detecte a base nesta ordem:
   - `origin/development` -> `development`
   - `origin/develop` -> `develop`
   - `origin/main` -> `main`
   - `origin/master` -> `master`
2. Confirme com o usuario antes de montar ou publicar a PR:
   - `Branch base detectada: {base}. Esta correto?`
3. Se o usuario informar outra base, use a base informada.

### Passo 2 — Identificar task e contexto Jira

1. Se o usuario passou argumento, use esse codigo.
2. Caso contrario, execute `git branch --show-current` e extraia `TASK-ID` por regex (`[A-Z]+-[0-9]+`).
3. Se encontrar task:
   - use `getAccessibleAtlassianResources` para obter `cloudId`
   - use `getJiraIssue` para buscar `summary`, `description`, `issuetype.name`, `status.name`, `priority.name`
4. Se nao encontrar task, continue sem Jira.

### Passo 3 — Analisar mudancas da branch

Execute em paralelo com a base confirmada:
- `git log {BASE}..HEAD --oneline`
- `git diff {BASE}...HEAD --stat`
- `git diff {BASE}...HEAD`

Com isso, monte resumo tecnico claro do que mudou.

### Passo 4 — Definir tipo da mudanca

Use prioridade:
1. Tipo do card Jira, quando existir:
   - `Bug` -> `Bug/Fix`
   - `Story` ou `Feature` -> `Nova feature`
2. Sem Jira, inferir do diff:
   - apenas docs -> `Documentacao`
   - refatoracao sem mudanca de comportamento -> `Refatoracao`
   - caso contrario -> `Nova feature`

### Passo 5 — Montar titulo e corpo da PR

Use este template:

```markdown
# {TITULO DA TASK NO JIRA} - [{CODIGO-DA-TASK}]

### Descricao:
{Descricao clara do que foi feito, baseada no diff + contexto Jira}

---

### Tipo de mudanca:
- [{X se Bug/Fix}] Bug/Fix
- [{X se Nova feature}] Nova feature
- [{X se Refatoracao}] Refatoracao
- [{X se Documentacao}] Documentacao

---

### Testes:
{Como foi validado}

---

### Documentacao:
{Status da documentacao}

---

### Imagens ou evidencias (se aplicavel)
{Screenshots ou N/A}

---

### Notas adicionais
- Base da PR: {BASE}
- Card Jira: {status atual} | Prioridade: {prioridade}
- {links relevantes}

---

[{CODIGO-DA-TASK}](https://juscash.atlassian.net/browse/{CODIGO-DA-TASK})
```

Se nao houver task Jira, remova a ultima secao de link.

### Passo 6 — Revisao com o usuario

Mostre:
- `title` final
- `body` final
- base confirmada

Pergunte se quer ajustar algo antes da criacao.

### Passo 7 — Criar PR via fluxo github-terminal

A criacao/publicacao da PR deve ser feita pelo fluxo da skill `github-terminal`, nunca assumindo `gh pr create` como padrao.

Sequencia:
1. Preparar o conteudo final (`title`, `body`, `base`, `head`).
2. Acionar o fluxo operacional da `github-terminal` para criacao/publicacao.
3. Se a publicacao automatica nao for possivel, usar fallback explicito com URL de criacao da PR no GitHub preenchida com os dados.

## Delegacao segura

Quando `title`, `body`, `base` e `head` ja estiverem definidos, tarefas mecanicas podem ser delegadas para modelo mais barato, por exemplo:
- validacao de upstream remoto
- coleta de metadados remotos da PR ou do repo
- publicacao operacional via fluxo de `github-terminal`

Manter no agente principal:
- definicao do conteudo final da PR
- decisao sobre a branch base
- revisao final com o usuario
- fallback manual quando a publicacao automatica falhar

### Guardrails

- nao criar PR sem confirmar base e conteudo com o usuario
- nao adicionar assinatura do assistente ou coautoria
- nao usar `gh` como caminho inicial
- manter foco em `title/body` claros e verificaveis
