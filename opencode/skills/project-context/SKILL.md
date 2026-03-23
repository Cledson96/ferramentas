---
name: project-context
description: Use para gerar, reutilizar e atualizar contexto leve de qualquer repositorio usando Repomix como motor principal. Acione quando abrir um projeto pela primeira vez, quando quiser economizar tokens ao trabalhar no repo, quando precisar criar ou atualizar `.context/project-context.md`, quando quiser verificar se o contexto do projeto esta stale, ou quando precisar criar ou atualizar o `AGENTS.md` com ponteiros para o contexto do projeto.
compatibility: opencode
---

# Skill: Project Context

Use o script versionado desta skill para criar e manter o contexto leve do projeto.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Quando usar

- quando abrir um repositorio pela primeira vez e quiser um resumo leve antes de explorar o codigo
- quando precisar economizar tokens reaproveitando um contexto consolidado do projeto
- quando quiser verificar se `.context/project-context.md` esta stale ou precisa ser regenerado
- quando precisar criar ou atualizar o bloco gerenciado em `AGENTS.md` com ponteiros para o contexto do projeto

## Quando nao usar

- quando a tarefa for apenas ler 1 ou 2 arquivos especificos sem necessidade de contexto persistente
- quando o usuario quiser exploracao pontual do repo sem gerar artefatos locais
- quando a tarefa nao envolver repositorio local ou nao se beneficiar de contexto persistente

## Script

No repo versionado desta skill, o script fica em:

```bash
opencode/skills/project-context/scripts/project-context.js
```

Quando a skill estiver instalada no OpenCode, execute:

```bash
node ~/.config/opencode/skills/project-context/scripts/project-context.js <comando> [opcoes]
```

Comandos principais:

```bash
node .../project-context.js status
node .../project-context.js ensure
node .../project-context.js refresh
```

## Objetivo

Esta skill deve:

- criar o contexto do projeto na primeira vez
- reaproveitar esse contexto para economizar tokens
- atualizar o contexto automaticamente quando ficar stale
- manter o `AGENTS.md` apontando para o contexto gerado sem sobrescrever instrucoes manuais fora do bloco gerenciado

## Artefatos gerados

Usar sempre esta estrutura:

- `.context/project-context.md` — resumo leve e primario
- `.context/context-meta.json` — metadata de geracao e sinais de staleness
- `.context/repomix/repomix-output.xml` — snapshot completo do repo
- `.context/repomix/repomix-compressed.xml` — referencia expandida mais barata
- `.context/repomix/repomix-structure.xml` — estrutura sem conteudo
- `.context/repomix/token-count-tree.txt` — mapa de custo em tokens

## Resultado esperado do CLI

O script retorna JSON. Interpretar assim:

- `command: "status"` — informa se o contexto existe, se esta stale e qual foi o motivo
- `reused: true` em `ensure` — o contexto ja existia e foi reaproveitado
- `previousStatus` em `ensure` — o contexto precisou ser regenerado porque estava ausente ou stale
- `agentsUpdate.action` — mostra se o bloco gerenciado em `AGENTS.md` foi criado, atualizado, anexado ou reaproveitado
- `ok: false` — falha operacional; mostrar o erro e nao fingir que o contexto foi atualizado

## Fluxo padrao

1. Na primeira vez no projeto, chamar `ensure`.
2. Se o contexto ja existir, usar `status` ou `ensure` para verificar se esta stale.
3. Se estiver stale ou o usuario pedir explicitamente, usar `refresh`.
4. Em tarefas normais, ler primeiro `.context/project-context.md`.
5. So recorrer aos artefatos em `.context/repomix/` quando precisar de mais detalhe.

## Regras de uso no OpenCode

- preferir `ensure` como ponto de entrada padrao
- usar `status` para diagnostico rapido antes de regenerar contexto
- usar `refresh` apenas quando o contexto estiver stale ou quando o usuario pedir explicitamente
- tratar `.context/project-context.md` como fonte primaria e os artefatos Repomix como referencia expandida

## O que o resumo deve consolidar

O `.context/project-context.md` deve consolidar:

- visao geral do projeto
- stack principal
- database e monorepo quando houver
- top-level structure e folder map
- entry points
- comandos uteis
- arquivos-chave
- convencoes e padroes
- hot files dos ultimos commits
- token hotspots

Preferir um resumo curto, navegavel e estavel. Nao despejar o conteudo bruto do repo nesse arquivo.

## Regras para AGENTS.md

- Se `AGENTS.md` existir, inserir ou atualizar apenas um bloco gerenciado da skill.
- Se nao existir, criar um `AGENTS.md` minimo.
- O bloco deve apontar para:
  - `.context/project-context.md`
  - `.context/repomix/token-count-tree.txt`
  - `.context/repomix/repomix-compressed.xml`
- O texto deve deixar claro que o resumo leve e a fonte primaria e que o Repomix e a referencia expandida.

## Guardrails

- Nao depender de MCP externo.
- Nao regenerar contexto sem necessidade.
- Nao sobrescrever instrucoes manuais do `AGENTS.md` fora do bloco gerenciado.
- Nao usar os artefatos Repomix como contexto primario quando `.context/project-context.md` estiver atualizado.
- Se `npx repomix` falhar, informar claramente que o projeto ficou sem contexto atualizado e expor o erro retornado pelo CLI.
- Nao editar manualmente o bloco gerenciado em `AGENTS.md`; deixar o script reconciliar esse trecho.
