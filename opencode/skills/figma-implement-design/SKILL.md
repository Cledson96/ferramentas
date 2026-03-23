---
name: "figma-implement-design"
description: "Skill principal para implementar frontend a partir de designs do Figma com fidelidade visual de 1:1. Acione para qualquer pedido de criar ou ajustar componentes/telas com base em URL ou node ID do Figma, traduzindo para codigo de producao nas convencoes do projeto. Requer conexao funcional com o servidor Figma MCP."
compatibility: opencode
---


# Implementar Design

## Visao Geral

Esta skill fornece um fluxo estruturado para traduzir designs do Figma em codigo pronto para producao com precisao pixel-perfect. Ela garante integracao consistente com o servidor Figma MCP, uso adequado de tokens de design e paridade visual de 1:1 com os designs.

Esta e a skill dona de implementacao de UI baseada em Figma.
Se houver problema de setup, autenticacao ou conectividade MCP, use primeiro a skill `figma` para resolver a infraestrutura e depois retome aqui.

## Quando Usar

- Pedido de implementar componente, tela ou fluxo com base em URL ou node ID do Figma
- Pedido de ajustar frontend existente para bater visualmente com o Figma
- Pedido de traduzir frame, node ou screenshot do Figma em codigo de producao
- Pedido de validar paridade visual 1:1 entre implementacao e design

## Quando Nao Usar

- Problema de configuracao, autenticacao OAuth ou conectividade MCP do Figma; nesses casos usar `figma`
- Pedido apenas de setup, troubleshooting ou validacao tecnica do MCP
- Pedido sem necessidade de implementar UI a partir de design

## Pre-Requisitos

- O servidor Figma MCP precisa estar conectado e acessivel
- O usuario deve fornecer uma URL do Figma no formato: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - `:fileKey` e a chave do arquivo
  - `1-2` e o node ID, isto e, o componente ou frame especifico a implementar
- **OU**, quando usar o MCP local de desktop, o usuario pode selecionar um node diretamente no app desktop do Figma, sem URL
- O projeto deve ter um design system ou biblioteca de componentes estabelecida, de preferencia

## Fluxo Obrigatorio

**Siga estes passos na ordem. Nao pule etapas.**

### Passo 0: Configurar o Figma MCP, se necessario

Se qualquer chamada MCP falhar porque o Figma MCP nao esta conectado, pare e configure:

1. Adicione ao `opencode.json` (projeto ou global em `~/.config/opencode/opencode.json`):

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

2. Entre com OAuth:

```bash
opencode mcp auth figma
```

Depois do login bem-sucedido, o usuario vai precisar reiniciar o OpenCode. Voce deve encerrar sua resposta e avisar isso, para que na proxima tentativa ele continue do Passo 1.

### Passo 1: Obter o Node ID

#### Opcao A: Extrair da URL do Figma

Quando o usuario fornecer uma URL do Figma, extraia a file key e o node ID para passar como argumentos para as ferramentas MCP.

**Formato da URL:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**Extrair:**

- **File key:** `:fileKey` (o segmento depois de `/design/`)
- **Node ID:** `1-2` (o valor do parametro de consulta `node-id`)

**Observacao:** ao usar o MCP local de desktop, `fileKey` nao e passado como parametro nas chamadas. O servidor usa automaticamente o arquivo aberto no momento, entao apenas `nodeId` e necessario.

**Exemplo:**

- URL: `https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key: `kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID: `42-15`

#### Opcao B: Usar a selecao atual do app desktop do Figma, apenas no MCP local

Ao usar um MCP de desktop e o usuario NAO tiver fornecido uma URL, as ferramentas usam automaticamente o node atualmente selecionado no arquivo aberto do Figma no app desktop.

**Observacao:** o prompt baseado em selecao so funciona com servidores MCP locais. O servidor remoto exige um link para um frame ou layer para extrair contexto. O usuario precisa ter o app desktop do Figma aberto com um node selecionado.

### Passo 2: Buscar o Contexto de Design

Execute `get_design_context` com a file key e o node ID extraidos.

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

Isso fornece os dados estruturados, incluindo:

- Propriedades de layout (Auto Layout, constraints, sizing)
- Especificacoes tipograficas
- Valores de cor e tokens de design
- Estrutura do componente e variantes
- Espacamento e padding

**Se a resposta estiver grande demais ou truncada:**

1. Execute `get_metadata(fileKey=":fileKey", nodeId="1-2")` para obter o mapa de nodes em alto nivel
2. Identifique os child nodes especificos necessarios a partir da metadata
3. Busque os child nodes individualmente com `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`

### Passo 3: Buscar Variaveis Do Componente

Execute `get_variable_defs` com a mesma file key e o mesmo node ID para capturar variaveis, cores, espacamentos e tokens.

```
get_variable_defs(fileKey=":fileKey", nodeId="1-2")
```

Use esse retorno para reduzir hardcode e manter fidelidade ao design.

### Passo 4: Capturar a Referencia Visual

Execute `get_screenshot` com a mesma file key e o mesmo node ID para ter uma referencia visual.

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

Essa screenshot serve como fonte de verdade para a validacao visual. Mantenha-a acessivel durante toda a implementacao.

### Passo 5: Baixar os Assets Necessarios

Baixe quaisquer assets, como imagens, icones e SVGs, retornados pelo servidor Figma MCP.

**IMPORTANTE:** siga estas regras para assets:

- Se o Figma MCP retornar uma fonte `localhost` para uma imagem ou SVG, use essa fonte diretamente
- NAO importe nem adicione novos pacotes de icones; todos os assets devem vir do payload do Figma
- NAO use nem crie placeholders se uma fonte `localhost` for fornecida
- Os assets sao servidos pelo endpoint de assets embutido do Figma MCP

### Passo 6: Traduzir para as Convencoes do Projeto

Traduza a saida do Figma para o framework, os estilos e as convencoes deste projeto.

**Principios principais:**

- Trate a saida do Figma MCP, normalmente React + Tailwind, como representacao de design e comportamento, nao como estilo final de codigo
- Substitua classes utilitarias do Tailwind pelos utilitarios ou tokens do design system preferidos do projeto
- Reaproveite componentes existentes, como botoes, inputs, tipografia e wrappers de icone, em vez de duplicar funcionalidade
- Use de forma consistente o sistema de cores, a escala tipografica e os tokens de espaco do projeto
- Respeite os padroes existentes de routing, state management e fetch de dados

### Passo 7: Atingir Paridade Visual de 1:1

Busque paridade visual pixel-perfect com o design do Figma.

**Diretrizes:**

- Priorize a fidelidade ao Figma para bater com o design exatamente
- Evite valores hardcoded; use tokens de design do Figma quando houver
- Quando houver conflito entre tokens do design system e as especificacoes do Figma, prefira os tokens do design system, mas ajuste espacamentos ou tamanhos minimamente para bater com o visual
- Siga os requisitos WCAG de acessibilidade
- Adicione documentacao de componente quando necessario

### Passo 8: Validar Contra o Figma

Antes de marcar como concluido, valide a UI final contra a screenshot do Figma.

**Checklist de validacao:**

- [ ] O layout bate com o Figma em espacamento, alinhamento e tamanho
- [ ] A tipografia bate em fonte, tamanho, peso e line height
- [ ] As cores batem exatamente
- [ ] Os estados interativos funcionam como desenhado, como hover, active e disabled
- [ ] O comportamento responsivo segue as constraints do Figma
- [ ] Os assets renderizam corretamente
- [ ] Os padroes de acessibilidade foram atendidos

## Regras De Implementacao

### Organizacao De Componentes

- Coloque os componentes de UI no diretorio do design system designado pelo projeto
- Siga as convencoes de nomeacao de componentes do projeto
- Evite estilos inline, a menos que sejam realmente necessarios para valores dinamicos

### Integracao Com O Design System

- SEMPRE use componentes do design system do projeto quando possivel
- Mapeie tokens de design do Figma para os tokens de design do projeto
- Quando existir um componente equivalente, estenda-o em vez de criar um novo
- Documente qualquer componente novo adicionado ao design system

### Qualidade De Codigo

- Evite valores hardcoded; extraia para constantes ou tokens de design
- Mantenha componentes compostos e reutilizaveis
- Adicione tipos TypeScript para as props dos componentes
- Inclua comentarios JSDoc para componentes exportados

## Guardrails

- nao pular o fluxo obrigatorio antes de implementar
- nao implementar UI por suposicao sem `get_design_context` e `get_screenshot`
- nao adicionar bibliotecas de icones ou placeholders quando o MCP fornecer assets
- nao tratar a saida bruta do Figma como codigo final sem adaptar para as convencoes do projeto
- nao usar a skill `figma` para implementar UI; ela e apenas base tecnica de MCP

## Exemplos

### Exemplo 1: Implementar um Componente de Botao

Usuario diz: "Implemente este componente de botao do Figma: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**Acoes:**

1. Extrair da URL `fileKey=kL9xQn2VwM8pYrTb4ZcHjF` e `nodeId=42-15`
2. Execute `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. Execute `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` para referencia visual
4. Baixar quaisquer icones de botao pelo endpoint de assets
5. Verificar se o projeto ja tem um componente de botao
6. Se tiver, extender com uma nova variante; se nao tiver, criar um novo componente usando as convencoes do projeto
7. Mapear as cores do Figma para tokens de design do projeto, como `primary-500` e `primary-hover`
8. Validar contra a screenshot quanto a padding, border radius e tipografia

**Resultado:** componente de botao igual ao design do Figma, integrado ao design system do projeto.

### Exemplo 2: Construir um Layout de Dashboard

Usuario diz: "Construa este dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**Acoes:**

1. Extrair da URL `fileKey=pR8mNv5KqXzGwY2JtCfL4D` e `nodeId=10-5`
2. Executar `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` para entender a estrutura da pagina
3. Identificar as secoes principais a partir da metadata, como header, sidebar, area de conteudo e cards, e seus child node IDs
4. Execute `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` para cada secao principal
5. Execute `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` para a pagina inteira
6. Baixar todos os assets, como logos, icones e graficos
7. Construir o layout usando os primitives de layout do projeto
8. Implementar cada secao usando componentes existentes quando possivel
9. Validar o comportamento responsivo contra as constraints do Figma

**Resultado:** dashboard completo igual ao design do Figma, com layout responsivo.

## Boas Praticas

### Sempre Comecar Pelo Contexto

Nunca implemente com base em suposicoes. Sempre busque `get_design_context` e `get_screenshot` primeiro.

### Validacao Incremental

Valide com frequencia durante a implementacao, e nao so no final. Isso pega problemas cedo.

### Documentar Desvios

Se for preciso desviar do design do Figma, por exemplo por acessibilidade ou restricoes tecnicas, documente o motivo em comentarios de codigo.

### Reusar Em Vez De Recriar

Sempre verifique componentes existentes antes de criar novos. Consistencia no codigo e mais importante do que replicacao literal do Figma.

### Design System Primeiro

Quando estiver em duvida, prefira os padroes do design system do projeto em vez da translacao literal do Figma.

## Problemas Comuns E Solucoes

### Problema: a saida do Figma esta truncada

**Causa:** o design e muito complexo ou tem camadas demais para retornar em uma unica resposta.
**Solucao:** use `get_metadata` para obter a estrutura do node e depois busque nodes especificos individualmente com `get_design_context`.

### Problema: o design nao bate depois da implementacao

**Causa:** discrepancias visuais entre o codigo implementado e o design original do Figma.
**Solucao:** compare lado a lado com a screenshot do Passo 3. Verifique espacamento, cores e valores tipograficos nos dados de contexto de design.

### Problema: os assets nao carregam

**Causa:** o endpoint de assets do servidor Figma MCP nao esta acessivel ou as URLs estao sendo modificadas.
**Solucao:** verifique se o endpoint de assets do servidor Figma MCP esta acessivel. O servidor serve assets em URLs `localhost`. Use essas URLs diretamente, sem modificacao.

### Problema: os valores dos tokens de design divergem do Figma

**Causa:** os tokens do design system do projeto tem valores diferentes dos especificados no design do Figma.
**Solucao:** quando os tokens do projeto divergirem do Figma, prefira os tokens do projeto para manter consistencia, mas ajuste espacamento e tamanho para preservar a fidelidade visual.

## Entendendo A Implementacao De Design

O fluxo de implementacao do Figma estabelece um processo confiavel para traduzir designs em codigo:

**Para designers:** confianca de que as implementacoes vao bater com os designs com precisao pixel-perfect.
**Para desenvolvedores:** uma abordagem estruturada que elimina achismo e reduz retrabalho.
**Para times:** implementacoes consistentes e de alta qualidade que preservam a integridade do design system.

Seguindo este fluxo, voce garante que cada design do Figma seja implementado com o mesmo nivel de cuidado e atencao aos detalhes.

## Recursos Adicionais

- [Documentacao do Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/)
- [Ferramentas e Prompts do Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Variaveis e Tokens de Design do Figma](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
