---
name: project-context
description: Use para gerar, reutilizar e atualizar contexto leve de qualquer repositorio usando Repomix como motor principal. Acione quando abrir um projeto pela primeira vez, quando quiser economizar tokens ao trabalhar no repo, quando precisar criar ou atualizar `.context/project-context.md`, quando quiser verificar se o contexto do projeto esta stale, quando precisar criar/atualizar o `AGENTS.md` com ponteiros para o contexto do projeto, ou quando o usuario mencionar `/jc:context`, `jc-context` ou pedir o workflow equivalente de contexto da JusCash no Codex.
---

# Skill: Project Context

Use o script global `project-context.js` desta skill para criar e manter o contexto leve do projeto.

## Compatibilidade JusCash

Invocacao original no Claude: `/jc:context`

Invocacao equivalente no Codex: `$project-context`

## Script

No Codex, use:

```bash
node ${CODEX_HOME:-$HOME/.codex}/skills/project-context/scripts/project-context.js <comando> [opcoes]
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
- reaproveitar esse contexto depois para economizar tokens
- atualizar o contexto automaticamente quando ficar stale
- manter o `AGENTS.md` apontando para o contexto gerado

## Artefatos gerados

Usar sempre esta estrutura:

- `.context/project-context.md` — resumo leve e primario
- `.context/context-meta.json` — metadata de geracao e sinais de staleness
- `.context/repomix/repomix-output.xml` — snapshot principal
- `.context/repomix/repomix-compressed.xml` — versao mais barata
- `.context/repomix/repomix-structure.xml` — estrutura sem conteudo
- `.context/repomix/token-count-tree.txt` — mapa de custo em tokens

## Fluxo padrao

1. Na primeira vez no projeto, chamar `ensure`.
2. Se o contexto ja existir, usar `status` ou `ensure` para verificar se esta stale.
3. Se estiver stale ou o usuario pedir explicitamente, usar `refresh`.
4. Em tarefas normais, ler primeiro `.context/project-context.md`.
5. So recorrer aos artefatos em `.context/repomix/` quando precisar de mais detalhe.

## Uso do Repomix

O Repomix e o motor principal desta skill. Executar via `npx`, nunca assumir instalacao global.

Comandos que a skill deve conhecer:

```bash
npx --yes repomix --output .context/repomix/repomix-output.xml --ignore ".context/**"
npx --yes repomix --compress --output .context/repomix/repomix-compressed.xml --ignore ".context/**"
npx --yes repomix --no-files --output .context/repomix/repomix-structure.xml --ignore ".context/**"
npx --yes repomix --token-count-tree 100 --ignore ".context/**"
```

O `token-count-tree` deve ser salvo em `.context/repomix/token-count-tree.txt`.

## Regras de resumo

O `.context/project-context.md` deve consolidar:

- visao geral do projeto
- stack principal
- pastas-chave
- comandos uteis
- convencoes
- arquivos-chave
- pistas de navegacao para a IA

Preferir um resumo curto e estavel. Nao despejar o conteudo bruto do repo nesse arquivo.

## Regras para AGENTS.md

- Se `AGENTS.md` existir, inserir ou atualizar apenas um bloco gerenciado da skill.
- Se nao existir, criar um `AGENTS.md` minimo.
- O bloco deve apontar para:
  - `.context/project-context.md`
  - `.context/repomix/token-count-tree.txt`
  - `.context/repomix/repomix-compressed.xml`
- O texto deve deixar claro que o resumo leve e a fonte primaria e o Repomix e referencia expandida.

## Guardrails

- Nao depender de MCP externo.
- Nao regenerar contexto sem necessidade.
- Nao sobrescrever instrucoes manuais do `AGENTS.md` fora do bloco gerenciado.
- Nao usar os artefatos Repomix como contexto primario quando `.context/project-context.md` estiver atualizado.
- Se `npx repomix` falhar, informar claramente que o projeto ficou sem contexto atualizado e orientar a dependencia.
