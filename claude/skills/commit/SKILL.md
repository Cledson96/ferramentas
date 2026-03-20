---
name: commit
description: "Gera mensagens de commit no padrao Conventional Commits com deteccao de scope e Jira ID da branch"
argument-hint: "[mensagem opcional]"
disable-model-invocation: true
---

# Skill: Commit

Gera mensagens de commit no padrão Conventional Commits, com ID do Jira quando disponível.

## Uso

```
/commit [mensagem opcional]
```

## Template

```
type(scope): descrição curta (TASK-ID)
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

**Exemplos:**
```
feat(auth): adiciona login com Google (ENG-123)
fix(api): corrige timeout nas requisições (ENG-456)
refactor(dashboard): extrai componente de gráfico
docs(readme): atualiza instruções de instalação (ENG-789)
```

> O `(TASK-ID)` é omitido se não houver card identificado.

## Instruções para o Claude

Quando o usuário executar `/commit`, siga estes passos:

### Passo 1 — Verificar o que está staged

Execute em paralelo:
- `git diff --cached --stat` — lista de arquivos no stage
- `git diff --cached` — diff completo do que será commitado

Se não houver nada staged (`git diff --cached` retornar vazio):
- Execute `git status` para mostrar o estado atual
- Pergunte ao usuário: "Não há arquivos staged. Quais arquivos quer adicionar ao commit?"
- Execute `git add` conforme a resposta e continue

### Passo 2 — Identificar o TASK-ID do Jira

Execute `git branch --show-current` e extraia o código da task usando regex:
- Padrão: sequência de letras maiúsculas + hífen + números (ex: `ENG-123`, `TASK-456`, `JUS-789`)
- Exemplos de branches: `feature/ENG-123-descricao`, `fix/JUS-456`, `ENG-789-nova-feature`
- Se não encontrar, o TASK-ID será omitido da mensagem (não é obrigatório)

### Passo 3 — Inferir os campos da mensagem

Analise o diff e os arquivos alterados para determinar:

**type** — use a seguinte lógica:
- Arquivos novos com lógica de negócio → `feat`
- Correção em código existente → `fix`
- Mudança de código sem alterar comportamento → `refactor`
- Apenas arquivos de teste (`*.test.*`, `*.spec.*`, `__tests__/`) → `test`
- Apenas arquivos de documentação (`*.md`, `docs/`) → `docs`
- Configurações, dependências, tooling → `chore`
- Apenas formatação/lint sem mudança de lógica → `style`
- Em caso de dúvida entre `feat` e `fix`, prefira `fix` se for correção, `feat` se for adição

**scope** — pasta/módulo principal dos arquivos alterados:
- `src/auth/` → `auth`
- `src/components/Button/` → `button` ou `components`
- `api/routes/user.js` → `user` ou `api`
- Se os arquivos estão em módulos muito diferentes, omita o scope
- Use sempre minúsculas e kebab-case

**descrição** — resumo objetivo em português:
- Use imperativo: "adiciona", "corrige", "remove", "atualiza", "extrai"
- Máximo 72 caracteres na linha inteira
- Sem ponto final
- Seja específico: "corrige validação de CPF" é melhor que "corrige bug"

### Passo 4 — Se o usuário passou uma mensagem como argumento

Se o usuário escreveu `/commit "minha mensagem"` ou `/commit adiciona autenticação`:
- Use a mensagem do usuário como base para a **descrição**
- Ainda infira o **type** e **scope** automaticamente pelo diff
- Monte a mensagem final no formato correto

### Passo 5 — Mostrar e confirmar

Mostre a mensagem gerada:

```
Mensagem de commit gerada:

  feat(auth): adiciona validação de CPF no cadastro (ENG-123)

Quer confirmar, ajustar ou cancelar?
```

Aguarde a resposta:
- **Confirmar / sim / ok**: execute `git commit -m "mensagem"`
- **Ajustar**: aplique os ajustes solicitados e mostre novamente
- **Cancelar**: não faça nada

### Passo 6 — Executar o commit

Após confirmação, execute:

```bash
git commit -m "type(scope): descrição (TASK-ID)"
```

**Importante:** nunca adicionar `Co-Authored-By`, assinatura do Claude ou qualquer metadado além da mensagem do commit. O commit deve conter apenas a mensagem gerada.

Mostre o resultado do commit (hash e arquivos incluídos).
