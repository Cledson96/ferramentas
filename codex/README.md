# Codex Workspace

Esta pasta e a fonte versionada do seu ecossistema local do Codex.

Objetivos da v1:

- versionar apenas skills customizadas
- manter compatibilidade com o layout real de `C:\Users\Cledson Souza\.codex\skills`
- separar conteudo de projeto do conteudo nativo do Codex (`.system`)
- preparar uma base limpa para evoluir depois com `agents/` e, se fizer sentido, MCPs proprios

## Estrutura

```text
codex/
  agents/
  docs/
  skills/
```

- `skills/`: uma pasta por skill, com `SKILL.md` como arquivo principal
- `agents/`: reservado para agents publicados no nivel da pasta `codex`
- `docs/`: instalacao, convencoes, inventario e politica de manutencao

Importante:

- Skills nativas do Codex nao entram aqui.
- Nesta v1, nao existe pasta `mcp/` porque ainda nao ha codigo ou configuracao propria para versionar.
- Algumas skills possuem `agents/openai.yaml` dentro da propria skill. Esses arquivos foram preservados como parte da skill, nao como agents globais da pasta `codex`.

## Conteudo atual

O conjunto inicial desta pasta foi sincronizado do ambiente local em `C:\Users\Cledson Souza\.codex\skills`, excluindo `.system`.

Skills versionadas nesta v1:

- `confluence-docs`
- `confluence-rest`
- `figma`
- `figma-implement-design`
- `github-terminal`
- `commit`
- `jc-design-system`
- `jc-devops-agent`
- `jc-feature-done`
- `jc-onboarding`
- `pull-request`
- `jc-qa-agent`
- `review`
- `jc-start-feature`
- `jira-rest`
- `playwright`
- `project-context`

## Papel Das Skills Figma

- `figma`: skill base tecnica para setup, autenticacao, verificacao e troubleshooting do Figma MCP.
- `figma-implement-design`: skill principal para implementar componentes e telas com fidelidade 1:1 a partir de nodes/links do Figma.

Regra pratica:

- Se o problema for conectividade/configuracao MCP, use `figma`.
- Se o pedido for aplicar design em frontend, use `figma-implement-design`.

## Como usar

Leia primeiro:

- [install.md](/C:/projetos/ferramentas/codex/docs/install.md)
- [conventions.md](/C:/projetos/ferramentas/codex/docs/conventions.md)
- [inventory.md](/C:/projetos/ferramentas/codex/docs/inventory.md)

## Politica de curadoria

- Entram aqui skills que voce realmente usa e quer manter sob versao.
- Conteudo de sistema fica fora do repositorio.
- Ao adicionar nova skill, prefira incluir so o necessario para ela funcionar: `SKILL.md`, `scripts/`, `references/`, `assets/` e `agents/` embutidos se existirem.
- Se uma skill depender de MCP, documente a dependencia em `docs/` antes de considerar versionar qualquer artefato adicional.
- `github-terminal` e a skill GitHub unica do repositorio e substitui os fluxos anteriores baseados em `gh`.
- `commit` e a skill padrao para gerar, revisar e executar commits no repo.
