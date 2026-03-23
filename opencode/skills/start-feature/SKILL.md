---
name: start-feature
description: "Inicia uma task a partir do Jira: resume o card, prepara a branch, carrega o contexto local do projeto e sugere um plano de implementacao antes de comecar."
---

# Skill: Start Feature

Prepara o ambiente para iniciar uma task: busca o card no Jira, sugere a branch com TASK-ID, carrega o contexto do projeto e monta um plano inicial de implementacao.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Instrucoes

Quando esta skill for carregada, seguir este fluxo:

### Passo 1 — Obter o TASK-ID

Se o usuario passou o ID ou link como argumento, extrair o TASK-ID com regex `[A-Z]+-\d+`.

Se nao passou argumento, perguntar pelo ID ou link do card Jira.

### Passo 2 — Buscar card no Jira

Usar a skill `jira-rest` para buscar o card com `get --issue TASK-ID`:
- `summary`
- `description`
- `issuetype.name`
- `priority.name`
- `assignee`
- `status.name`

Mostrar um resumo curto do card:

```
{TASK-ID} — {titulo}
Tipo: {Story/Bug/Task/Spike} | Prioridade: {prioridade} | Status: {status}

{descricao resumida nas primeiras linhas}
```

### Passo 3 — Verificar branch atual e sugerir a nova branch

Executar em paralelo:
- `git branch --show-current`
- `git status --short`
- `git branch -r`

Detectar a branch base nesta ordem:
- `origin/development`
- `origin/develop`
- `origin/main`
- `origin/master`

Gerar o nome sugerido da branch com estas regras:
- `Story` ou `Task` → `feature/`
- `Bug` → `fix/`
- `Spike` → `spike/`
- outros tipos → `chore/`
- sempre incluir o TASK-ID
- slug do titulo em lowercase, com `-`, sem caracteres especiais e limitado a 40 caracteres

Exemplo:
- `feature/ENG-123-autenticacao-jwt`

Apresentar ao usuario:

```
Branch atual: `{branch-atual}`
Base detectada: `{branch-base}`

Nome sugerido: `{tipo}/{TASK-ID}-{slug}`

Confirma criar essa branch ou quer ajustar o nome?
```

Se houver mudancas nao commitadas, avisar antes de qualquer criacao de branch:

```
Ha mudancas nao commitadas na branch atual.
Quer resolver isso antes de criar a nova branch?
```

### Passo 4 — Criar a branch, se confirmado

Se o usuario confirmar a criacao, executar:

```bash
git checkout -b {nome-da-branch} {branch-base}
```

Confirmar o resultado:

```
Branch `{nome-da-branch}` criada a partir de `{branch-base}`.
```

Se o usuario optar por nao criar branch, continuar com a branch atual.

### Passo 5 — Carregar contexto do projeto

Verificar se existe `.context/project-context.md`:
- se existir e estiver utilizavel, ler e usar como contexto principal
- se nao existir, carregar a skill `project-context` e executar `ensure`
- se existir mas estiver stale, carregar a skill `project-context` e executar `ensure` para atualizar

Quando houver `.context/`, priorizar:
- `.context/project-context.md`
- `.context/repomix/token-count-tree.txt`
- `.context/repomix/repomix-compressed.xml`

Tambem detectar a stack principal do projeto lendo `package.json` ou `pyproject.toml`, com foco nas bibliotecas realmente relevantes para a task atual.

### Passo 6 — Sugerir plano de implementacao

Montar um plano com base no card Jira, no contexto local do projeto e na leitura do codigo:

```
## Plano: {TASK-ID} — {titulo}

### Entendimento
{resumo do que precisa ser feito}

### Criterios de aceite
- [ ] {criterio 1}
- [ ] {criterio 2}

### Stack relevante para esta task
- {biblioteca ou framework} — {papel na implementacao}

### Arquivos a criar ou alterar
- `src/...` — {motivo}
- `src/...spec.ts` — testes esperados

### Ordem sugerida
1. {primeiro passo}
2. {segundo passo}
3. {terceiro passo}
4. {testes}

### Pontos de atencao
- {risco ou dependencia}
- {padrao do projeto a seguir}
```

Nao incluir busca de documentacao externa neste fluxo.

### Passo 7 — Encerramento

Fechar com um check-in curto:

```
Quer ajustar algum ponto do plano antes de comecar?

Quando terminar a implementacao, faca um review da branch para seguir com commit e PR.
```

## Guardrails

- Nao depender de MCP externo.
- Nao criar branches sem confirmacao do usuario.
- Nao inventar informacoes sobre o card Jira; usar apenas o que a API retornar.
- Nao sobrescrever contexto do projeto existente sem necessidade.
- Nao executar implementacao automaticamente; apenas sugerir o plano.
