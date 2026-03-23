---
name: pull-request
description: "Cria PR com titulo e corpo padronizados, contexto do Jira e base detectada automaticamente. Use quando o usuario quiser abrir pull request no OpenCode, revisar o conteudo da PR ou publicar a branch atual."
compatibility: opencode
---

# Skill: Pull Request

Gera pull requests padronizadas com contexto do Jira e fluxo de criacao orientado ao OpenCode.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Quando usar

- quando o usuario quiser abrir uma PR da branch atual
- quando for preciso montar titulo e corpo da PR com base no diff e no card Jira
- quando fizer sentido revisar base, head, resumo tecnico e validacao final antes de publicar

## Quando nao usar

- quando o pedido for apenas revisar codigo sem criar PR; nesse caso usar `review` ou `qa-agent`
- quando a tarefa for apenas consultar dados do Jira; nesse caso usar `jira-rest`
- quando nao houver branch pronta para publicar

## Instrucoes

Quando houver intencao de abrir PR, siga estes passos na ordem:

### Passo 1 — Detectar branch base automaticamente

1. Execute `git branch -r` e detecte a base nesta ordem:
   - `origin/development` -> `development`
   - `origin/develop` -> `develop`
   - `origin/main` -> `main`
   - `origin/master` -> `master`
2. Se a base estiver claramente detectada, siga com ela. So pergunte ao usuario se houver ambiguidade real ou se ele tiver informado outra base.

### Passo 2 — Identificar task e contexto Jira

1. Se o usuario passou argumento, use esse codigo.
2. Caso contrario, execute `git branch --show-current` e extraia `TASK-ID` por regex (`[A-Z]+-[0-9]+`).
3. Se encontrar task, use `jira-rest` para buscar:
   - `summary`
   - `description`
   - `issuetype.name`
   - `status.name`
   - `priority.name`
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

Se nao houver task Jira, remova a ultima secao de link e adapte o titulo para a branch atual.

### Passo 6 — Revisao final antes da criacao

Mostre:

- `title` final
- `body` final
- base confirmada
- branch `head`

Se a base e o conteudo estiverem claros, siga para a criacao sem interromper com pergunta de permissao. So pergunte se houver ambiguidade material ou dado faltando.

### Passo 7 — Criar PR no OpenCode

Use o fluxo operacional com `gh`:

1. Verificar se a branch atual tem upstream remoto.
2. Fazer `git push -u` se necessario.
3. Criar a PR com `gh pr create`, preservando `title`, `body`, `base` e `head`.
4. Se a criacao automatica falhar, informar o erro real e orientar o fallback mais direto disponivel.

## Politica de delegacao

Quando `title`, `body`, `base` e `head` ja estiverem definidos, tarefas mecanicas podem ser delegadas, por exemplo:

- validacao de upstream remoto
- coleta de metadados remotos da PR ou do repositorio
- publicacao operacional da PR

Manter no agente principal:

- definicao do conteudo final da PR
- decisao sobre a branch base
- revisao final do texto da PR
- fallback manual quando a publicacao automatica falhar

## Guardrails

- nao criar PR sem diff relevante entre base e head
- nao inventar contexto Jira quando o card nao estiver disponivel
- nao adicionar assinatura do assistente ou coautoria
- manter foco em `title` e `body` claros, verificaveis e coerentes com o diff real
- se a branch nao estiver pronta para publicar, deixar isso explicito antes de criar a PR
