# Inventario Atual

Este inventario registra o estado atual das skills versionadas em [codex/skills](/C:/projetos/ferramentas/codex/skills).

## Resumo do lote

- total de skills: 17
- skills de sistema copiadas: 0
- skills com `scripts/`: 5
- skills com `references/`: 2
- skills com `assets/`: 8
- skills com `agents/openai.yaml` embutido: 18

## Skills versionadas

| Skill | Papel principal | Por que entrou na v1 | Dependencias externas | Reuso futuro |
| --- | --- | --- | --- | --- |
| `confluence-docs` | Fluxo editorial de docs no Confluence | separa templates e sincronizacao da integracao base | `confluence-rest`, credenciais Atlassian, Node | Codex primeiro, possivel em Claude/OpenCode |
| `confluence-rest` | Operacoes diretas no Confluence via REST | cobre leitura e escrita fora do MCP | Atlassian REST, credenciais Confluence, Node | Codex primeiro, possivel em Claude/OpenCode |
| `figma` | Setup e diagnostico do Figma MCP | separa infraestrutura tecnica da implementacao de UI | Figma MCP | Alto potencial de reuso |
| `figma-implement-design` | Implementacao fiel de design em frontend | skill principal de design-to-code com validacao 1:1 | Figma MCP | Alto potencial de reuso |
| `github-terminal` | GitHub no terminal sem gh | unifica o fluxo de uso do GitHub com PowerShell como padrao | PowerShell, `git`, GitHub API/URLs | Alto potencial de reuso |
| `commit` | Commit padronizado da JusCash | padrao local recorrente | Git, naming da branch | Mais especifica de Codex/JusCash |
| `jc-design-system` | Regras do design system JusCash | importante para UI consistente | design system do projeto, eventualmente Figma | Mais especifica de Codex/JusCash |
| `jc-devops-agent` | Checklist de deploy e risco | apoio forte no fim da feature | contexto do repo, infra do projeto | Mais especifica de Codex/JusCash |
| `jc-feature-done` | Workflow completo de encerramento | encadeia review, docs, commit e PR | Git, GitHub, Jira, Confluence | Mais especifica de Codex/JusCash |
| `jc-onboarding` | Onboarding tecnico | acelera leitura de projeto | contexto local do repo | Pode ser adaptada depois |
| `pull-request` | Abertura de PR padronizada | operacionaliza PR com contexto Jira e base dinamica | `github-terminal`, Jira | Pode ser adaptada depois |
| `jc-qa-agent` | QA profundo pre-PR | valida aceite, testes e riscos | diff do Git, contexto Jira | Mais especifica de Codex/JusCash |
| `jc-review` | Review completo da branch | reforca padroes e qualidade | diff do Git, contexto Jira | Mais especifica de Codex/JusCash |
| `jc-start-feature` | Inicio de feature por card Jira | prepara branch, contexto e plano | Jira, Git, eventualmente Context7 | Mais especifica de Codex/JusCash |
| `jira-rest` | Operacoes Jira via REST | fallback util fora do MCP | Atlassian REST, credenciais Jira, Node | Alto potencial de reuso |
| `playwright` | Automacao de navegador | skill utilitaria de alto valor | Playwright/browser tools | Alto potencial de reuso |
| `project-context` | Geracao e manutencao de contexto leve | melhora onboarding e economia de tokens | Node, `npx`, Repomix | Alto potencial de reuso |

## Observacoes de curadoria

- O lote inicial replica o conjunto atual de skills customizadas mantidas no seu ambiente local.
- `.system` ficou explicitamente de fora.
- `confluence-rest` passa a ser a skill base de Confluence neste repositorio.
- `confluence-docs` concentra templates e fluxo editorial de documentacao usando `confluence-rest` como base operacional.
- `figma` fica restrita a setup e troubleshooting MCP; `figma-implement-design` concentra fluxo completo de implementacao de interface.
- `github-terminal` concentra o uso de GitHub no terminal sem depender de `gh`, com PowerShell como padrao.
- As skills da familia `jc-*` representam seu fluxo mais especifico de trabalho e foram preservadas como pacote.
- Skills mais genericas como `playwright`, `project-context`, `jira-*`, `confluence-rest`, `figma*` e `github-terminal` ficam bem posicionadas para reaproveitamento futuro em `claude/` e `opencode`.
