---
name: start-feature
description: "Inicia uma feature — busca card Jira, cria branch, carrega contexto do projeto, busca docs via Context7 e gera plano de implementacao. Use com TASK-ID ou link Jira."
mode: all
---

# Agent: Start Feature

Prepara o ambiente para iniciar uma feature: busca card no Jira, cria branch, carrega contexto e sugere plano de implementação.

## Uso

```
@start-feature
@start-feature ENG-123
@start-feature https://juscash.atlassian.net/browse/ENG-123
```

## Instruções

### 1. Obter TASK-ID

Se argumento passado: extrair via regex `[A-Z]+-\d+`.
Se não: perguntar "Qual é o ID ou link do card Jira?"

### 2. Buscar card no Jira

Executar: `node ${CLAUDE_PLUGIN_ROOT}/scripts/jira.js get <TASK-ID>`

Mostrar resumo:
```
{TASK-ID} — {título}
Tipo: {Story/Bug/Task} | Prioridade: {Alta/Média} | Status: {To Do/In Progress}

{descrição resumida}
```

### 3. Verificar branch e propor nova

Executar em paralelo:
- `git branch --show-current`
- `git status --short`
- `git branch -r` — detectar base (`development` → `develop` → `main` → `master`)

Regras para nome da branch:
- `Story` / `Task` → `feature/`
- `Bug` → `fix/`
- `Spike` → `spike/`
- Outros → `chore/`
- TASK-ID sempre presente
- Slug do título: lowercase, espaços → `-`, sem caracteres especiais, máx 40 chars
- Exemplo: `feature/ENG-123-autenticacao-jwt`

Perguntar:
```
Branch atual: `{atual}` | Base: `{base}`
Nome sugerido: `{tipo}/{TASK-ID}-{slug}`

Confirma ou informe outro?
```

Se houver mudanças não commitadas: avisar antes de criar branch.

### 4. Criar branch (se confirmado)

```bash
git checkout -b {nome} {base}
```

### 5. Carregar contexto do projeto

- Se `CLAUDE.md` existir: ler e usar
- Se não existir `CLAUDE.md` nem `.context/`: executar `/jc:context` automaticamente
- Detectar tech stack via `package.json` ou `pyproject.toml`

### 5.5. Buscar docs via Context7

Usar MCP Context7 para buscar docs das bibliotecas relevantes para a feature:

1. Consolidar bibliotecas relevantes:
   - Do `package.json`: frameworks principais
   - Do card Jira: tecnologias mencionadas
   - Limitar a **3-4 bibliotecas mais relevantes**

2. Para cada biblioteca:
   - `resolve-library-id` → ID do Context7
   - `query-docs` com query específica baseada na feature

3. Se Context7 não disponível: pular silenciosamente.

### 6. Sugerir plano de implementação

```
## Plano: {TASK-ID} — {título}

### Entendimento
{o que precisa ser feito}

### Critérios de aceite
- [ ] {critério 1}
- [ ] {critério 2}

### Tech stack relevante
- {biblioteca} v{versão} — {uso nesta feature}

### Referência de APIs/Bibliotecas
{snippets do Context7, organizados por biblioteca}

### Arquivos a criar/modificar
- `src/{modulo}/` — {o que criar/alterar}
- `src/{modulo}/{arquivo}.spec.ts` — testes

### Ordem de implementação
1. {passo 1}
2. {passo 2}
3. {passo 3}

### Pontos de atenção
- {riscos ou dependências}
- {padrões do projeto a seguir}
```

Perguntar: "Quer ajustar algo antes de começar?"

## Guardrails

- Não criar branch sem confirmação explícita do usuário
- Não fabricar dados do Jira — se o card não existir, informar
- Não editar código neste workflow — parar na preparação e planejamento
- Quando terminar: "Execute `@feature-done` ao finalizar a implementação"
