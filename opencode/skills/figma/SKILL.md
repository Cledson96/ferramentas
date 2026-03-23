---
name: figma
description: Use como skill base tecnica de Figma MCP para setup, autenticacao, diagnostico e troubleshooting de conexao. Acione quando houver problema para conectar, autenticar, configurar ou validar ferramentas MCP do Figma. Nao use para implementar telas ou componentes de frontend.
compatibility: opencode
---

# Figma MCP Base

Esta skill e a base de infraestrutura para Figma MCP.

Para implementacao real de UI a partir de design, use a skill `figma-implement-design`.
Para detalhes de configuracao e depuracao (variaveis de ambiente, config e verificacao), veja `references/figma-mcp-config.md`.

## Quando Usar

- Falha de conexao com o servidor MCP do Figma
- Problema de login OAuth
- Ajuste de configuracao MCP (cliente remoto, endpoint, validacao)
- Verificacao de ambiente para habilitar ferramentas do Figma

## Quando Nao Usar

- Pedido de implementar componente/tela com fidelidade visual
- Pedido de traduzir frame/node para codigo de producao
- Pedido de validar paridade 1:1 com o Figma

Nesses casos, acione `figma-implement-design`.

## Fluxo Tecnico De Setup E Diagnostico

1. Verifique se o MCP do Figma esta cadastrado no `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true,
      "oauth": {}
    }
  }
}
```

2. Se nao estiver, adicione a configuracao acima ao seu `opencode.json` (projeto ou global em `~/.config/opencode/opencode.json`).
3. Execute login OAuth:

```bash
opencode mcp auth figma
```

4. Se o login ocorrer agora, avise que pode ser necessario reiniciar o OpenCode antes de retomar a tarefa.
5. Revalide chamadas MCP basicas antes de voltar ao fluxo de implementacao.

## Comandos Tecnicos Pontuais

Quando a tarefa for estritamente tecnica, esta skill pode orientar chamadas pontuais como:

- `get_metadata`
- `get_design_context`
- `get_screenshot`
- `get_variable_defs`

Sem executar fluxo de implementacao de UI dentro desta skill.

## Referencias

- `references/figma-mcp-config.md` - setup, login e troubleshooting MCP
- `references/figma-tools-and-prompts.md` - catalogo tecnico de ferramentas
