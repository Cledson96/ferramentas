---
name: figma
description: Use o servidor MCP do Figma para obter contexto de design, screenshots, variaveis e assets do Figma, e para traduzir nodes do Figma em codigo de producao. Acione quando a tarefa envolver URLs do Figma, node IDs, implementacao design-to-code ou configuracao e resolucao de problemas do Figma MCP.
---

# Figma MCP

Use o servidor MCP do Figma para implementacoes guiadas por Figma. Para detalhes de configuracao e depuracao (variaveis de ambiente, config, verificacao), veja `references/figma-mcp-config.md`.

## Regras De Integracao Figma MCP

Estas regras definem como traduzir entradas do Figma em codigo para este projeto e devem ser seguidas em toda mudanca guiada por Figma.

### Fluxo obrigatorio (nao pular)

1. Execute `get_design_context` primeiro para obter a representacao estruturada do node exato.
2. Se a resposta estiver grande demais ou truncada, execute `get_metadata` para obter o mapa de nodes em alto nivel e depois refaca a consulta apenas para os nodes necessarios com `get_design_context`.
3. Sempre traga `get_variable_defs` para o componente ou node que estiver sendo implementado, para reproduzir variaveis, cores, espacamentos e tokens com mais fidelidade.
4. Execute `get_screenshot` para ter uma referencia visual da variante do node que sera implementada.
5. So depois de ter `get_design_context`, `get_variable_defs` e `get_screenshot`, baixe qualquer asset necessario e comece a implementacao.
6. Traduza a saida, normalmente React + Tailwind, para as convencoes, estilos e framework deste projeto. Reaproveite tokens de cor, componentes, tipografia e variaveis do projeto sempre que possivel.
7. Valide contra o Figma para fidelidade de 1:1 em visual e comportamento antes de marcar como concluido.

### Regras De Implementacao

- Trate a saida do Figma MCP, normalmente React + Tailwind, como representacao de design e comportamento, nao como estilo final de codigo.
- Substitua classes utilitarias do Tailwind pelos tokens/utilitarios preferidos do projeto quando aplicavel.
- Reaproveite componentes existentes, como botoes, inputs, tipografia e wrappers de icone, em vez de duplicar funcionalidade.
- Use de forma consistente o sistema de cores, a escala tipografica, os tokens de espaco e as variaveis do projeto.
- Respeite os padroes de routing, state management e fetch de dados ja adotados no repo.
- Busque fidelidade visual de 1:1 com o design do Figma. Quando houver conflito, prefira os tokens do design system e ajuste espacamentos ou tamanhos minimamente para bater com o visual.
- Valide a UI final contra a screenshot do Figma tanto em aparencia quanto em comportamento.

### Tratamento De Assets

- O servidor MCP do Figma fornece um endpoint de assets que pode servir imagens e SVGs.
- IMPORTANTE: se o Figma MCP retornar uma fonte `localhost` para uma imagem ou SVG, use essa imagem ou SVG diretamente.
- IMPORTANTE: NAO importe/adicione novos pacotes de icones; todos os assets devem vir no payload do Figma.
- IMPORTANTE: nao use nem crie placeholders se uma fonte `localhost` for fornecida.

### Prompt Baseado Em Link

- O servidor e baseado em link: copie o link do frame/layer do Figma e passe essa URL para o cliente MCP quando pedir ajuda para implementacao.
- O cliente nao navega na URL, mas extrai o node ID do link; sempre garanta que o link aponte para o node/variacao exata que voce quer.

## Referencias

- `references/figma-mcp-config.md` — configuracao, verificacao, troubleshooting e lembretes de uso baseado em link.
- `references/figma-tools-and-prompts.md` — catalogo de ferramentas e padroes de prompt para selecionar frameworks/componentes e buscar metadata.
