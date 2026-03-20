# Convencoes

## Skills

Padrao adotado em [codex/skills](/C:/projetos/ferramentas/codex/skills):

- uma pasta por skill: `skills/<slug>/`
- nome curto, estavel e em kebab-case
- `SKILL.md` como ponto de entrada
- `scripts/`, `references/`, `assets/` e `agents/` apenas quando a skill realmente precisar

## Curadoria

- versionar apenas conteudo customizado
- nao trazer `.system` para o repositorio
- preservar licencas e notices quando vierem com a skill
- preferir skills independentes e legiveis, sem depender de contexto oculto

## Dependencias externas

Toda dependencia operacional relevante deve aparecer na documentacao da skill ou no inventario. Exemplos:

- MCPs ja conectados no Codex
- `gh` autenticado
- `node` ou `npx`
- credenciais Atlassian
- ferramentas de navegador como Playwright

## Agents embutidos

Se a skill ja trouxer `agents/openai.yaml`, esse conteudo fica dentro da propria skill.

Racional:

- o agent faz parte do workflow da skill
- evita separar artificialmente um contrato que nasceu junto da skill
- reduz risco de divergencia entre o guia (`SKILL.md`) e a configuracao associada

## Agents globais

`codex/agents` fica reservado para agentes compartilhados entre varias skills ou fluxos.

Nao criar agents globais nesta fase sem:

- caso de uso real
- escopo reutilizavel
- documentacao minima de entrada, saida e limites

## MCPs

Nao existe pasta `mcp/` nesta v1.

Se uma skill depender de MCP, documentar primeiro:

- qual MCP e necessario
- para que ele serve
- se a skill tem fallback quando o MCP nao estiver disponivel

Versionar MCP proprio so quando houver codigo, templates ou configuracao de valor recorrente.
