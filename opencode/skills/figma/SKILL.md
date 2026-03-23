---
name: figma
description: Use como skill base tecnica de Figma MCP para setup, autenticacao, diagnostico e troubleshooting de conexao. Acione quando houver problema para conectar, autenticar, configurar ou validar ferramentas MCP do Figma. Nao use para implementar telas ou componentes de frontend.
compatibility: opencode
---

# Figma MCP Base

Use esta skill para setup, autenticacao e troubleshooting do Figma MCP.

## Quando usar

- falha de conexao com o servidor MCP do Figma
- problema de OAuth ou configuracao do `opencode.json`
- validacao tecnica das ferramentas MCP do Figma

## Quando nao usar

- implementar componente ou tela com fidelidade visual
- traduzir frame ou node para codigo de producao

Nesses casos, use o agent `figma-implement-design`.

## Fluxo base

1. verifique se o MCP do Figma esta configurado no `opencode.json`
2. execute `opencode mcp auth figma` quando precisar autenticar
3. reinicie o OpenCode se o login acabou de acontecer
4. teste chamadas como `get_metadata`, `get_design_context`, `get_screenshot` e `get_variable_defs`

## Referencias

- `references/figma-mcp-config.md`
- `references/figma-tools-and-prompts.md`
