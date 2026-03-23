---
name: context
description: "Gera contexto do projeto usando Repomix e atualiza o CLAUDE.md. Acione com /jc:context, quando abrir um projeto pela primeira vez, quando o projeto nao tiver CLAUDE.md local, ou quando precisar atualizar o contexto."
---

# Skill: Context

Gera contexto completo de um projeto usando Repomix como motor e atualiza o CLAUDE.md automaticamente.

## Uso

```
/jc:context
```

## Instrucoes para o Claude

Quando o usuario executar `/jc:context`, siga estes passos:

### Passo 1 — Gerar contexto com Repomix

Executar o script de contexto do plugin:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/project-context.js ensure
```

O script retorna JSON. Interpretar:
- `reused: true` — contexto ja existia e esta atualizado
- `command: "ensure"` com `previousStatus` — contexto foi regenerado (era stale ou nao existia)
- `ok: false` — erro, mostrar mensagem ao usuario

Se o script falhar (ex: `npx repomix` nao disponivel), informar o usuario e orientar a instalar Node.js/npm.

O script gera automaticamente:

**Artefatos em `.context/`:**
- `.context/project-context.md` — resumo rico e primario com: visao geral, stack, database, folder map, entry points, convencoes, hot files, token hotspots
- `.context/context-meta.json` — metadata de geracao e staleness
- `.context/repomix/repomix-output.xml` — snapshot completo do repo
- `.context/repomix/repomix-compressed.xml` — versao comprimida (menos tokens)
- `.context/repomix/repomix-structure.xml` — estrutura sem conteudo de arquivos
- `.context/repomix/token-count-tree.txt` — mapa de custo em tokens

**Bloco gerenciado no CLAUDE.md:**
O script insere/atualiza automaticamente um bloco delimitado por `<!-- project-context:managed:start/end -->` no CLAUDE.md com ponteiros para `.context/`.

### Passo 2 — Mostrar resultado

Mostrar ao usuario:
- Se o contexto foi criado, reusado ou atualizado
- Quantos artefatos Repomix foram gerados
- Destaques do `.context/project-context.md` (stack, entry points, convencoes detectadas)

Se o usuario quiser, pode pedir para rodar `refresh` (forca regeneracao):
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/project-context.js refresh
```

### Passo 3 — Gitignore

Se `.context/` nao estiver no `.gitignore`, sugerir adicionar:
```
.context/
```

O `CLAUDE.md` deve ficar no git (e pequeno e util para todos).

## O que o script detecta automaticamente

O contexto gerado e rico porque o script analisa:
- **Tech stack**: Node.js, TypeScript, React, Next.js, NestJS, Prisma, Tailwind, Storybook, Docker, GitHub Actions, e dezenas de outros
- **Database**: Prisma provider/models, servicos no docker-compose (PostgreSQL, MySQL, MongoDB, Redis, etc.)
- **Convencoes**: ESLint, Prettier (com detalhes de config), TSConfig paths/aliases, strict mode, Husky, lint-staged, Conventional Commits
- **Entry points**: detecta main.ts, index.tsx, app.module.ts, etc.
- **Folder map**: mapeia proposito de cada pasta conhecida (src/, services/, hooks/, prisma/, etc.)
- **Monorepo**: npm workspaces, pnpm, Lerna, Nx, Turborepo
- **Hot files**: arquivos mais alterados nos ultimos 30 commits (areas de desenvolvimento ativo)
- **Token hotspots**: custo em tokens de cada arquivo/pasta via Repomix

## Fluxo padrao

1. Na primeira vez no projeto, `/jc:context` gera tudo.
2. Nas vezes seguintes, o script detecta se o contexto esta fresh e reaproveita.
3. Se houver mudancas em arquivos monitorados (package.json, tsconfig, CLAUDE.md, prisma/schema.prisma, etc.), regenera automaticamente.
4. Em tarefas normais, ler `.context/project-context.md` primeiro.
5. Recorrer aos artefatos Repomix apenas quando precisar de mais detalhe.

## Quando usar

- **Projeto novo**: `/jc:context` para gerar tudo do zero
- **Projeto sem CLAUDE.md**: `/jc:context` para mapear e criar
- **Atualizar contexto**: `/jc:context` novamente para regenerar
- **Automaticamente**: se o projeto nao tiver CLAUDE.md local, o Claude deve sugerir executar esta skill
