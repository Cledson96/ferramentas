# JusCash — Plugin `jc` para Claude Code

Plugin com skills, agents e regras globais para o workflow padrão da JusCash no Claude Code.

## Instalação

```bash
git clone https://github.com/Juscash/claude.git
cd claude
node install.js          # instala globalmente (user scope)
# ou: node install.js --scope project  (só para o projeto atual)
```

**Windows:**
```powershell
git clone https://github.com/Juscash/claude.git
cd claude
.\install.ps1
```

Reinicie o Claude Code após instalar.

### Alternativa — sessão temporária

```bash
claude --plugin-dir /caminho/para/claude
```

### Atualizar

```bash
cd claude && git pull && node install.js
```

### Após instalar

Skills ficam disponíveis com prefixo `/jc:` e agents carregam automaticamente:

```
/jc:commit
/jc:pr
/jc:start-feature ENG-123
@qa-agent
@devops-agent
```

## MCP Servers incluídos

O plugin auto-configura via `.mcp.json`:

| Server | Uso |
|--------|-----|
| `@upstash/context7-mcp` | Documentação atualizada de bibliotecas (React, Next.js, NestJS, Prisma, etc.) |

O Context7 é usado automaticamente pelo `/jc:start-feature` para buscar docs das bibliotecas do projeto, e proativamente durante implementação de código.

## Skills

| Comando | O que faz |
|---------|-----------|
| `/jc:start-feature [TASK-ID]` | Inicia feature — Jira → branch → contexto → Context7 docs → plano |
| `/jc:feature-done` | Workflow completo pos-feature: review → docs → commit → PR |
| `/jc:commit` | Gera commit no padrao Conventional Commits com Jira ID da branch |
| `/jc:pr [TASK-ID]` | Cria PR com template padronizado e contexto do card Jira |
| `/jc:review` | Code review completo da branch — padroes, imports, testes e requisitos do Jira |
| `/jc:docs` | Gera docs em MD na pasta `docs/` e sincroniza com o Confluence (espaco Tech) |
| `/jc:context` | Gera contexto do projeto (CLAUDE.md + .context/) |
| `/jc:onboarding [pergunta]` | Apresenta o projeto ao dev novo e responde duvidas de arquitetura |
| Design System | Ativo automaticamente ao criar UI — usa `@juscash/design-system` |

## Agents

| Agent | O que faz |
|-------|-----------|
| `@qa-agent` | Review profundo — cobertura de testes, criterios do Jira, qualidade e seguranca |
| `@devops-agent` | Checklist de deploy — env vars, migrations, breaking changes e plano de rollback |

## Regras globais (CLAUDE.md)

- Commits: `type(scope): descricao (TASK-ID)`
- PRs: template com Jira
- UI: sempre importar de `@juscash/design-system`
- Icones: `LucideIcons` (nunca `@ant-design/icons`)
- Idioma: portugues
- Sem assinatura do Claude em nada

## Estrutura

```
claude/                          # Raiz do plugin jc
├── .claude-plugin/
│   └── plugin.json              # Manifesto do plugin
├── .mcp.json                    # MCP servers (Context7)
├── CLAUDE.md                    # Regras globais
├── skills/
│   ├── start-feature/SKILL.md   # /jc:start-feature
│   ├── feature-done/SKILL.md    # /jc:feature-done
│   ├── commit/SKILL.md          # /jc:commit
│   ├── pr/SKILL.md              # /jc:pr
│   ├── review/SKILL.md          # /jc:review
│   ├── docs/SKILL.md            # /jc:docs
│   ├── context/SKILL.md         # /jc:context
│   ├── onboarding/SKILL.md      # /jc:onboarding
│   └── design-system/SKILL.md   # regras de UI (auto-ativo)
└── agents/
    ├── qa-agent.md              # @qa-agent
    └── devops-agent.md          # @devops-agent
```
