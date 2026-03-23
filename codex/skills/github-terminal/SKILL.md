---
name: github-terminal
description: Use para trabalhar com GitHub no terminal sem `gh`; priorize PowerShell, use Git Bash apenas por caminho explicito quando for mais simples, e acione para PRs, issues, comentarios ou CI.
metadata:
  short-description: GitHub no terminal sem gh
---

# Skill: GitHub Terminal

Use esta skill para tarefas de GitHub no Windows sem depender de `gh`.

## Regra principal

- Nunca comece pelo comando `gh`.
- Use PowerShell nativo como padrao.
- Use `git` para tudo que for local.
- Use `Invoke-RestMethod` ou URLs do GitHub para informacao remota quando necessario.
- Use Git Bash so quando um comando Bash for claramente melhor, chamando o bin explicitamente.

## Caminho explicito do Git Bash

Se precisar de Bash, chame o executavel diretamente:

```powershell
$gitBash = "C:\\Program Files\\Git\\bin\\bash.exe"
& $gitBash -lc 'git status --short --branch'
```

Se o Git Bash estiver instalado em outro caminho, ajuste o bin explicitamente.

## Fluxo padrao

1. Identifique o contexto local com `git status --short --branch`, `git branch --show-current`, `git remote -v` e `git log --oneline --decorate -n 10`.
2. Para comparar trabalho, use `git diff`, `git diff --stat`, `git merge-base` e `git log main..HEAD`.
3. Para PRs, issues, comentarios e CI, colete o contexto remoto com GitHub API ou a interface web, nunca com `gh`.
4. Quando precisar ler JSON, use `ConvertFrom-Json` no PowerShell.
5. Quando precisar enviar JSON, use `ConvertTo-Json -Depth 20`.
6. Antes de alterar arquivos, explique o que vai mudar e confirme quando houver risco.
7. Ao final, resuma branch atual, base comparada, mudancas feitas e proximos passos.

## Autenticacao e acesso remoto

- Se houver token em `$env:GITHUB_TOKEN` ou `$env:GH_TOKEN`, use apenas como credencial para chamadas HTTP.
- Se nao houver token, pare e pergunte ao usuario como ele prefere autenticar.
- Nunca use `gh auth login` como passo inicial.

## Delegacao para modelo mais barato

Quando o contexto ja estiver definido e a tarefa for operacional, delegar para subagente barato usando `gpt-5.4-mini` com reasoning `medium`.

Delegar apenas tarefas mecanicas e de baixo risco, por exemplo:
- buscar e resumir comentarios extensos de PR
- coletar checks, status e logs remotos
- montar payloads HTTP ou URLs de acao do GitHub
- organizar respostas JSON grandes em tabelas ou listas operacionais

Manter no agente principal:
- estrategia de investigacao
- decisao sobre o que publicar ou responder
- interpretacao final de CI, comentarios ou conflitos
- qualquer mudanca local no repositorio

## Comandos uteis

```powershell
git status --short --branch
git branch --show-current
git remote -v
git fetch --all --prune
git log --oneline --decorate -n 20
git diff --stat origin/main...HEAD
git diff origin/main...HEAD
git worktree list
git rev-parse --abbrev-ref HEAD
git ls-remote --heads origin
```

## Exemplos de GitHub API

```powershell
$headers = @{ Authorization = "Bearer $env:GITHUB_TOKEN"; Accept = "application/vnd.github+json" }
Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/OWNER/REPO/pulls/123"
```

Use esse padrao para consultar PRs, issues, reviews e checks quando a informacao nao estiver disponivel localmente.
