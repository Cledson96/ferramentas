# Instruções para Skills, Tools, Plugins e Agents do OpenCode

Referência oficial baseada na documentação do OpenCode (https://opencode.ai/docs/).

---

## 1. SKILLS

Skills são instruções reutilizáveis em Markdown que o OpenCode descobre automaticamente do seu repositório ou diretório home. Elas são carregadas sob demanda via a ferramenta nativa `skill`.

### 1.1 Onde colocar

Crie **uma pasta por skill** com um `SKILL.md` dentro:

| Caminho | Escopo |
|---------|--------|
| `.opencode/skills/<nome>/SKILL.md` | Projeto (local) |
| `~/.config/opencode/skills/<nome>/SKILL.md` | Global |
| `.claude/skills/<nome>/SKILL.md` | Projeto (compatível com Claude) |
| `~/.claude/skills/<nome>/SKILL.md` | Global (compatível com Claude) |
| `.agents/skills/<nome>/SKILL.md` | Projeto (compatível com agentes) |
| `~/.agents/skills/<nome>/SKILL.md` | Global (compatível com agentes) |

### 1.2 Como funciona o discovery

- Para caminhos **locais ao projeto**, o OpenCode sobe do diretório atual até a raiz do git worktree, carregando qualquer `skills/*/SKILL.md` em `.opencode/` e qualquer `.claude/skills/*/SKILL.md` ou `.agents/skills/*/SKILL.md` pelo caminho.
- Definições **globais** são carregadas de `~/.config/opencode/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md` e `~/.agents/skills/*/SKILL.md`.

### 1.3 Frontmatter obrigatório

Cada `SKILL.md` deve começar com YAML frontmatter. Campos reconhecidos:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `name` | Sim | Nome da skill (1-64 chars) |
| `description` | Sim | Quando usar a skill (1-1024 chars) |
| `license` | Não | Licença da skill |
| `compatibility` | Não | Compatibilidade (ex: `opencode`) |
| `metadata` | Não | Mapa string->string para metadados extras |

Campos desconhecidos no frontmatter são ignorados.

### 1.4 Validação do `name`

- 1 a 64 caracteres
- Lowercase alfanumérico com hífen separador único
- Não pode começar ou terminar com `-`
- Não pode ter `--` consecutivos
- **Deve bater com o nome da pasta** que contém o SKILL.md

Regex equivalente:

```
^[a-z0-9]+(-[a-z0-9]+)*$
```

### 1.5 Validação do `description`

- 1 a 1024 caracteres
- Deve ser específica o suficiente para o agente escolher a skill correta

### 1.6 Como o agente descobre as skills

O OpenCode lista skills disponíveis na descrição da ferramenta `skill`:

```xml
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

O agente carrega uma skill chamando:

```
skill({ name: "git-release" })
```

Carregamento é **on-demand**. O agente vê a lista de nomes + descrições e decide qual carregar.

### 1.7 Permissões de skills

Controle via `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Valor | Comportamento |
|-------|--------------|
| `allow` | Skill carrega imediatamente |
| `deny` | Skill fica oculta do agente, acesso rejeitado |
| `ask` | Usuário é perguntado antes de carregar |

Patterns suportam wildcards: `internal-*` combina `internal-docs`, `internal-tools`, etc.

### 1.8 Override por agente

Para agents customizados (no frontmatter do agent):

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

Para agents built-in (no `opencode.json`):

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

### 1.9 Desabilitar a skill tool

Para agents que não devem usar skills:

**Agent customizado (frontmatter):**

```yaml
---
tools:
  skill: false
---
```

**Agent built-in (opencode.json):**

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

### 1.10 Exemplo mínimo de SKILL.md

```
.opencode/skills/git-release/SKILL.md
```

```markdown
---
name: git-release
description: Create consistent releases and changelogs
---

## What I do
- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me
Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
```

### 1.11 Troubleshooting

Se a skill não aparecer:

1. Verifique se `SKILL.md` está em MAIÚSCULAS
2. Confirme que o frontmatter tem `name` e `description`
3. Garanta que os nomes das skills são únicos entre todos os locais
4. Verifique permissões — skills com `deny` ficam ocultas

---

## 2. CUSTOM TOOLS

Custom tools são funções que você cria e que o LLM pode chamar durante conversas. Funcionam junto com ferramentas built-in como `read`, `write` e `bash`.

### 2.1 Onde colocar

- **Local ao projeto:** `.opencode/tools/`
- **Global:** `~/.config/opencode/tools/`

### 2.2 Estrutura

Use o helper `tool()` para type-safety e validação:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

O **nome do arquivo** vira o **nome da ferramenta**. O exemplo acima cria a tool `database`.

### 2.3 Múltiplas tools por arquivo

```typescript
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a * args.b
  },
})
```

Isso cria duas tools: `math_add` e `math_multiply`.

### 2.4 Argumentos

Use `tool.schema` (que é Zod) para definir tipos:

```typescript
args: {
  query: tool.schema.string().describe("SQL query to execute")
}
```

Ou importe Zod diretamente:

```typescript
import { z } from "zod"

export default {
  description: "Tool description",
  args: {
    param: z.string().describe("Parameter description"),
  },
  async execute(args, context) {
    return "result"
  },
}
```

### 2.5 Contexto

Tools recebem contexto sobre a sessão atual:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Get project information",
  args: {},
  async execute(args, context) {
    const { agent, sessionID, messageID, directory, worktree } = context
    return `Agent: ${agent}, Directory: ${directory}, Worktree: ${worktree}`
  },
})
```

- `context.directory` — diretório de trabalho da sessão
- `context.worktree` — raiz do git worktree

### 2.6 Tool em Python (ou qualquer linguagem)

Crie o script Python:

```python
# .opencode/tools/add.py
import sys
a = int(sys.argv[1])
b = int(sys.argv[2])
print(a + b)
```

Crie a definição TS que invoca:

```typescript
import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Add two numbers using Python",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args, context) {
    const script = path.join(context.worktree, ".opencode/tools/add.py")
    const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
    return result.trim()
  },
})
```

### 2.7 Colisão com tools built-in

Se uma custom tool usar o mesmo nome de uma built-in, a custom tool tem precedência. Para desabilitar uma built-in sem substituí-la, use permissões.

---

## 3. PLUGINS

Plugins permitem estender o OpenCode hookando em eventos e customizando comportamento.

### 3.1 Onde colocar

- **Local ao projeto:** `.opencode/plugins/`
- **Global:** `~/.config/opencode/plugins/`
- **npm:** especifique no `opencode.json`

### 3.2 Como usar (npm)

opencode.json:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-helicone-session", "opencode-wakatime", "@my-org/custom-plugin"]
}
```

### 3.3 Ordem de carregamento

1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

### 3.4 Dependências

Plugins locais e custom tools podem usar pacotes npm externos. Adicione um `package.json` no diretório de config:

```json
// .opencode/package.json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

OpenCode executa `bun install` no startup.

### 3.5 Estrutura básica

```javascript
// .opencode/plugins/example.js
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  console.log("Plugin initialized!")

  return {
    // Hooks aqui
  }
}
```

O plugin function recebe:

- `project` — informações do projeto atual
- `directory` — diretório de trabalho atual
- `worktree` — caminho do git worktree
- `client` — SDK client do OpenCode para interagir com a IA
- `$` — Shell API do Bun para executar comandos

### 3.6 TypeScript support

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Type-safe hook implementations
  }
}
```

### 3.7 Eventos disponíveis

#### Command Events
- `command.executed`

#### File Events
- `file.edited`
- `file.watcher.updated`

#### Installation Events
- `installation.updated`

#### LSP Events
- `lsp.client.diagnostics`
- `lsp.updated`

#### Message Events
- `message.part.removed`
- `message.part.updated`
- `message.removed`
- `message.updated`

#### Permission Events
- `permission.asked`
- `permission.replied`

#### Server Events
- `server.connected`

#### Session Events
- `session.created`
- `session.compacted`
- `session.deleted`
- `session.diff`
- `session.error`
- `session.idle`
- `session.status`
- `session.updated`

#### Todo Events
- `todo.updated`

#### Shell Events
- `shell.env`

#### Tool Events
- `tool.execute.after`
- `tool.execute.before`

#### TUI Events
- `tui.prompt.append`
- `tui.command.execute`
- `tui.toast.show`

### 3.8 Exemplos de plugins

#### Proteger .env

```javascript
export const EnvProtection = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
```

#### Injetar variáveis de ambiente

```javascript
export const InjectEnvPlugin = async () => {
  return {
    "shell.env": async (input, output) => {
      output.env.MY_API_KEY = "secret"
      output.env.PROJECT_ROOT = input.cwd
    },
  }
}
```

#### Custom tools via plugin

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const CustomToolsPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "This is a custom tool",
        args: {
          foo: tool.schema.string(),
        },
        async execute(args, context) {
          const { directory, worktree } = context
          return `Hello ${args.foo} from ${directory} (worktree: ${worktree})`
        },
      }),
    },
  }
}
```

#### Logging estruturado

```typescript
export const MyPlugin = async ({ client }) => {
  await client.app.log({
    body: {
      service: "my-plugin",
      level: "info",
      message: "Plugin initialized",
      extra: { foo: "bar" },
    },
  })
}
```

#### Compaction hooks

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`## Custom Context
Include any state that should persist across compaction.`)
    },
  }
}
```

---

## 4. AGENTS

Agents são assistentes especializados configurados para tarefas específicas. Podem ser primary agents (interação direta) ou subagents (invocados por outros agents).

### 4.1 Tipos de agents

| Tipo | Descrição |
|------|-----------|
| **Primary** | Assistente principal com quem você interage. Cicla com Tab. |
| **Subagent** | Assistente especializado invocado por primary agents ou via @menção. |

### 4.2 Agents built-in

| Agent | Tipo | Descrição |
|-------|------|-----------|
| `build` | Primary | Default, com todas as ferramentas habilitadas |
| `plan` | Primary | Restrito, para planejamento sem alterações |
| `general` | Subagent | Propósito geral, acesso total exceto todo |
| `explore` | Subagent | Somente leitura, para explorar código |
| `compaction` | Primary (hidden) | Compacta contexto automaticamente |
| `title` | Primary (hidden) | Gera títulos de sessão |
| `summary` | Primary (hidden) | Cria resumos de sessão |

### 4.3 Criar agent via JSON

`opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

### 4.4 Criar agent via Markdown

Coloque arquivos `.md` em:

- **Global:** `~/.config/opencode/agents/`
- **Projeto:** `.opencode/agents/`

O nome do arquivo vira o nome do agent.

Exemplo — `~/.config/opencode/agents/review.md`:

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
---

You are in code review mode. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

### 4.5 Opções de configuração

| Opção | Descrição | Obrigatório |
|-------|-----------|-------------|
| `description` | Descrição do que o agent faz | Sim |
| `mode` | `primary`, `subagent` ou `all` (default: `all`) | Não |
| `model` | Override do modelo (formato: `provider/model-id`) | Não |
| `temperature` | 0.0-1.0, controla aleatoriedade | Não |
| `steps` | Máximo de iterações agentic | Não |
| `prompt` | System prompt customizado ou caminho `{file:./path.txt}` | Não |
| `tools` | Mapa de ferramentas habilitadas/desabilitadas (deprecated, use permission) | Não |
| `permission` | Permissões por ferramenta (`allow`, `ask`, `deny`) | Não |
| `hidden` | Oculta subagent do autocomplete @ (somente subagents) | Não |
| `color` | Cor hex ou tema para a UI | Não |
| `top_p` | Controle de diversidade (0.0-1.0) | Não |
| `disable` | `true` para desabilitar o agent | Não |

### 4.6 Permissões

```markdown
---
description: Code review without edits
mode: subagent
permission:
  edit: deny
  bash:
    "*": ask
    "git diff": allow
    "git log*": allow
    "grep *": allow
  webfetch: deny
---
```

### 4.7 Permissões de task (quais subagents pode invocar)

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "orchestrator-*": "allow",
          "code-reviewer": "ask"
        }
      }
    }
  }
}
```

### 4.8 Comando interativo para criar agent

```
opencode agent create
```

Pergunta onde salvar, descrição, gera system prompt, deixa selecionar ferramentas.

---

## 5. RESUMO — DIFERENÇA ENTRE SKILLS, TOOLS, PLUGINS E AGENTS

| Conceito | O que é | Formato | Onde fica |
|----------|---------|---------|-----------|
| **Skills** | Instruções reutilizáveis em Markdown | `SKILL.md` com frontmatter | `.opencode/skills/` ou `~/.config/opencode/skills/` |
| **Custom Tools** | Funções que o LLM pode chamar | TS/JS com `tool()` helper | `.opencode/tools/` ou `~/.config/opencode/tools/` |
| **Plugins** | Módulos que hookam em eventos do OpenCode | JS/TS com hooks | `.opencode/plugins/` ou `~/.config/opencode/plugins/` |
| **Agents** | Assistentes especializados com config própria | JSON no `opencode.json` ou `.md` em agents/ | `.opencode/agents/` ou `~/.config/opencode/agents/` |

---

Fonte: https://opencode.ai/docs/skills/ | https://opencode.ai/docs/custom-tools/ | https://opencode.ai/docs/plugins/ | https://opencode.ai/docs/agents/
