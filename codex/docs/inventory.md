# Inventario Inicial

Este inventario registra o primeiro lote de skills versionadas em [codex/skills](/C:/projetos/ferramentas/codex/skills).

## Resumo do lote

- total de skills: 19
- skills de sistema copiadas: 0
- skills com `scripts/`: 7
- skills com `references/`: 2
- skills com `assets/`: 5
- skills com `agents/openai.yaml` embutido: 19

## Skills versionadas

| Skill | Papel principal | Por que entrou na v1 | Dependencias externas | Reuso futuro |
| --- | --- | --- | --- | --- |
| `confluence-rest` | Operacoes diretas no Confluence via REST | cobre leitura e escrita fora do MCP | Atlassian REST, credenciais Confluence, Node | Codex primeiro, possivel em Claude/OpenCode |
| `figma` | Base de trabalho com Figma MCP | da contexto de design e assets | Figma MCP | Alto potencial de reuso |
| `figma-implement-design` | Implementacao fiel de design | workflow focado em design-to-code | Figma MCP | Alto potencial de reuso |
| `gh-address-comments` | Tratar comentarios em PR | fluxo operacional recorrente de review | `gh` autenticado | Alto potencial de reuso |
| `gh-fix-ci` | Diagnostico de CI em PR | cobre investigacao de falhas em Actions | `gh` autenticado, GitHub Actions | Alto potencial de reuso |
| `jc-commit` | Commit padronizado da JusCash | padrao local recorrente | Git, naming da branch | Mais especifica de Codex/JusCash |
| `jc-design-system` | Regras do design system JusCash | importante para UI consistente | design system do projeto, eventualmente Figma | Mais especifica de Codex/JusCash |
| `jc-devops-agent` | Checklist de deploy e risco | apoio forte no fim da feature | contexto do repo, infra do projeto | Mais especifica de Codex/JusCash |
| `jc-docs` | Documentacao tecnica e Confluence | fecha ciclo de documentacao | Node, Confluence, Atlassian | Mais especifica de Codex/JusCash |
| `jc-feature-done` | Workflow completo de encerramento | encadeia review, docs, commit e PR | Git, GitHub, Jira, Confluence | Mais especifica de Codex/JusCash |
| `jc-onboarding` | Onboarding tecnico | acelera leitura de projeto | contexto local do repo | Pode ser adaptada depois |
| `jc-pr` | Abertura de PR padronizada | operacionaliza PR com contexto Jira | `gh`, Jira | Pode ser adaptada depois |
| `jc-qa-agent` | QA profundo pre-PR | valida aceite, testes e riscos | diff do Git, contexto Jira | Mais especifica de Codex/JusCash |
| `jc-review` | Review completo da branch | reforca padroes e qualidade | diff do Git, contexto Jira | Mais especifica de Codex/JusCash |
| `jc-start-feature` | Inicio de feature por card Jira | prepara branch, contexto e plano | Jira, Git, eventualmente Context7 | Mais especifica de Codex/JusCash |
| `jira-confluence` | Operacoes Atlassian via ferramentas conectadas | caminho padrao quando MCP esta disponivel | Jira/Confluence tools conectadas | Alto potencial de reuso |
| `jira-rest` | Operacoes Jira via REST | fallback util fora do MCP | Atlassian REST, credenciais Jira, Node | Alto potencial de reuso |
| `playwright` | Automacao de navegador | skill utilitaria de alto valor | Playwright/browser tools | Alto potencial de reuso |
| `project-context` | Geracao e manutencao de contexto leve | melhora onboarding e economia de tokens | Node, `npx`, Repomix | Alto potencial de reuso |

## Observacoes de curadoria

- O lote inicial replica o conjunto atual de skills customizadas mantidas no seu ambiente local.
- `.system` ficou explicitamente de fora.
- As skills da familia `jc-*` representam seu fluxo mais especifico de trabalho e foram preservadas como pacote.
- Skills mais genericas como `playwright`, `project-context`, `jira-*`, `confluence-rest`, `figma*` e `gh-*` ficam bem posicionadas para reaproveitamento futuro em `claude/` e `opencode`.
