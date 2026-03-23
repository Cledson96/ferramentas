---
name: design-system
description: "Regras de uso do @juscash/design-system para UI: componentes, icones LucideIcons e implementacao a partir de Figma. Use ao criar ou alterar telas, componentes React ou qualquer fluxo de interface."
compatibility: opencode
---

# Skill: Design System

Use esta skill quando a tarefa envolver UI React dentro do ecossistema JusCash.

## Quando usar

- criar ou ajustar telas, paginas e componentes React
- implementar UI a partir de Figma
- decidir qual componente ou icone usar no `@juscash/design-system`

## Quando nao usar

- setup ou troubleshooting do MCP do Figma; use `figma`
- tarefas sem interface ou fora do design system da JusCash

## Heuristicas principais

- importar componentes sempre de `@juscash/design-system`
- usar `LucideIcons` em vez de `@ant-design/icons`
- reaproveitar componentes existentes antes de criar novos
- se o Figma trouxer algo que nao exista no design system, criar extensao local coerente com os tokens do projeto
- validar a paridade visual com screenshot ou referencia do Figma antes de encerrar

## Guardrails

- nunca importar `antd` diretamente quando houver reexport ou equivalente no design system
- nunca adicionar `@ant-design/icons`
- nao duplicar componente que ja exista no design system
- manter fidelidade ao Figma sem quebrar tokens e convencoes do projeto

## Referencias

- Storybook: https://juscash.github.io/design-system/
- Pacote: `@juscash/design-system`
- Base visual: Ant Design 6 + tokens JusCash
