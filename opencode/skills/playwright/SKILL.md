---
name: playwright
description: Use quando a tarefa exige automatizar um navegador real via Playwright MCP — navegacao, preenchimento de formularios, screenshots, extracao de dados, debug de fluxos UI. Acione tambem para testes visuais, scraping, captura de PDFs e qualquer interacao programatica com paginas web.
compatibility: opencode
---

# Skill: Playwright (MCP)

Use esta skill quando a tarefa exigir navegador real via Playwright MCP.

## Quando usar

- navegacao automatizada em paginas reais
- preenchimento de formularios, cliques, extracao de dados, screenshots ou PDFs
- debug visual ou investigacao de fluxo UI em navegador

## Quando nao usar

- escrever testes `@playwright/test` sem automacao ao vivo
- leitura simples de HTML sem interacao real

## Fluxo recomendado

1. navegar com `browser_navigate`
2. capturar `browser_snapshot`
3. interagir com refs do snapshot atual
4. fazer novo snapshot apos mudancas relevantes de DOM
5. capturar screenshot, PDF, console ou network quando ajudar na validacao

## Guardrails

- sempre tire snapshot antes de usar refs como `e12`
- refaça snapshot quando a UI mudar ou uma ref ficar stale
- prefira tools MCP explicitas em vez de `browser_evaluate`
- use modo visual quando uma validacao manual ajudar

## Referencias

- `references/cli.md`
- `references/workflows.md`
