---
name: jc-feature-done
description: "Workflow completo pos-feature — review via @qa-agent, docs, commit e PR em sequencia. Use quando o usuario mencionar /jc:feature-done, pedir esse workflow da JusCash ou quiser o comportamento equivalente do plugin jc no Codex."
---

## Uso No Codex

Skill global adaptada do plugin `jc`.

Invocacao original no Claude: `/jc:feature-done`

Invocacao equivalente no Codex: `$jc-feature-done`


# Skill: Feature Done

Workflow completo para finalizar uma feature. Encadeia `@qa-agent` → `/docs` → `$commit` → `$pull-request` em sequencia, pausando nos pontos que precisam de decisao do usuario.

## Uso

```
/feature-done
```

## Instruções para o Claude

Quando o usuário executar `/feature-done`, siga estes passos:

### Setup inicial — coletar contexto compartilhado

Execute em paralelo antes de iniciar qualquer fase:
- `git branch -r` — listar branches remotas
- `git branch --show-current` — branch atual

Detectar branch base na ordem de prioridade:
- `origin/development` → usar `development`
- `origin/develop` → usar `develop`
- `origin/main` → usar `main`
- `origin/master` → usar `master`

Confirmar com o usuário:
```
Branch base detectada: `development`. Está correto? (ou informe outra)
```

Após confirmação, executar em paralelo:
- `git diff {BASE}...HEAD --stat` — arquivos alterados
- `git diff {BASE}...HEAD` — diff completo
- `git log {BASE}..HEAD --oneline` — commits da branch
- Se houver TASK-ID na branch (regex: `[A-Z]+-\d+`): usar `getAccessibleAtlassianResources` + `getJiraIssue` para buscar `summary`, `description`, `issuetype.name`

Se o diff estiver vazio: avisar "Nenhuma diferença em relação à `{BASE}`. Nada a fazer." e encerrar.

---

### Fase 1/4 — Review (via @qa-agent)

Invocar o `@qa-agent` passando o contexto já coletado (diff, branch, card Jira).

O `@qa-agent` irá:
- Verificar cobertura de testes por arquivo
- Validar cada critério de aceite do Jira contra o código
- Checar Design System, padrões, segurança e qualidade profunda
- Gerar relatório completo com sugestões de correção

**Ponto de pausa — se houver blockers:**
```
--- Fase 1/4: Review ---
[relatório do @qa-agent]

{N} blocker(s) encontrado(s). Corrija-os antes de continuar.
Quer que o @qa-agent aplique as correções automaticamente?
Quando terminar, responda "continuar".
```

**Se não houver blockers:**
```
Review aprovado — nenhum blocker.
Prosseguindo para Docs...
```

---

### Fase 2/4 — Docs

1. Detectar tipo do projeto pelos arquivos:
   - **Node.js/TypeScript**: `package.json` com NestJS/Express + arquivos `.ts`
   - **Python**: `requirements.txt`, `pyproject.toml`, arquivos `.py`
   - **Frontend**: `package.json` com React/Next.js + `src/components/`
   - **EDA**: filas (SQS, RabbitMQ, Kafka), consumers, producers

2. Verificar se `docs/` existe na raiz; listar `.md` existentes

3. Gerar/atualizar os arquivos MD afetados pelo diff, seguindo os templates da JusCash (Node.js, Python, EDA). Sempre:
   - Manter conteúdo existente, atualizar apenas o que mudou
   - Adicionar entrada no `docs/changelog.md` com o que foi implementado nesta feature (referenciar TASK-ID)
   - Linguagem técnica em português

**Ponto de pausa — Confluence:**
```
--- Fase 2/4: Docs ---

Docs atualizadas localmente:
- docs/modules/{modulo}.md (criado/atualizado)
- docs/changelog.md (atualizado)

Quer sincronizar com o Confluence?
Se sim, informe qual página do Confluence cada arquivo deve atualizar
(ou "nova" para criar uma nova página).
Se não, responda "pular".
```

Se confirmar: sincronizar via script `confluence.js` empacotado na skill global `confluence-rest`.

1. Converter o Markdown para Confluence Storage Format (XHTML com macros nativos — ver referência na skill `confluence-docs`)
2. Salvar o XHTML em arquivo temporário
3. Buscar página: `node ${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest/scripts/confluence.js search --cql 'space = "DT" AND title = "..."'`
4. Atualizar: `node ${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest/scripts/confluence.js update --page-id <ID> --title "..." --body-file <temp>`
5. Ou criar: `node ${CODEX_HOME:-$HOME/.codex}/skills/confluence-rest/scripts/confluence.js create --title "..." --body-file <temp> --parent-id <ID>`

---

### Fase 3/4 — Commit

1. Verificar staged: `git diff --cached --stat`

2. Se `docs/` foi alterada mas não está staged, perguntar:
   ```
   Os arquivos de docs/ não estão staged. Quer incluí-los no commit?
   ```

3. Extrair TASK-ID da branch, inferir `type` e `scope` pelos arquivos alterados, gerar mensagem:
   - `feat` — nova funcionalidade
   - `fix` — correção de bug
   - `refactor` — refatoração sem nova funcionalidade
   - `docs` — apenas documentação
   - `test` — apenas testes
   - `chore` / `style` — configuração, formatação

**Ponto de pausa:**
```
--- Fase 3/4: Commit ---

Mensagem sugerida:
  feat(auth): adiciona autenticação JWT com refresh token (ENG-123)

Confirma? (ou informe outra mensagem)
```

Após confirmação: executar `git commit -m "..."`.
- **Nunca adicionar Co-Authored-By, assinatura do assistente ou qualquer menção ao assistente**

---

### Fase 4/4 — PR

1. Verificar se branch tem remote:
   - `git status -sb` — se não tiver upstream, perguntar: "Branch sem remote. Quer fazer push agora?"
   - Se confirmar: `git push -u origin {branch}`

2. Gerar título e body do PR com template JusCash (contexto Jira já disponível do setup):

```markdown
## Descrição
{o que foi implementado — baseado no diff e na descrição do Jira}

## Tipo de mudança
- [ ] Bug fix
- [x] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como testar
{passos para testar a mudança}

## Checklist
- [x] Código revisado
- [x] Testes adicionados/atualizados
- [x] Documentação atualizada
- [ ] Aprovação do time

## Jira
[{TASK-ID}](https://juscash.atlassian.net/browse/{TASK-ID})
```

**Ponto de pausa:**
```
--- Fase 4/4: PR ---

Título: feat(auth): adiciona autenticação JWT com refresh token (ENG-123)

[preview do body acima]

Confirma a criação do PR?
```

 Apos confirmacao: usar o fluxo da skill `github-terminal` para criar/publicar a PR com `title`, `body`, `base` e `head`.
- **Nunca adicionar Co-Authored-By, assinatura do assistente ou qualquer menção ao assistente**

---

### Resumo final

```
Feature Done!

Fase 1 — Review: aprovado ({N} warnings)
Fase 2 — Docs: atualizadas localmente + Confluence sincronizado
             (ou: Confluence pulado)
Fase 3 — Commit: feat(auth): adiciona autenticação JWT (ENG-123)
Fase 4 — PR: https://github.com/{org}/{repo}/pull/{N}

Card Jira: https://juscash.atlassian.net/browse/{TASK-ID}
```
