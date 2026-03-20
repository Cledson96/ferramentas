# Agents

Esta pasta esta reservada para agents publicados no nivel de `codex/agents`.

## Escopo desta v1

- nao publicar agents globais ainda
- manter apenas a convencao e a documentacao
- deixar agents especificos embutidos dentro das skills quando fizerem parte da skill

## Quando criar um agent aqui

Crie um agent global em `codex/agents` apenas quando ele:

- nao pertencer naturalmente a uma skill especifica
- for reutilizado por mais de um workflow
- tiver contrato de uso claro e manutencao propria

## O que nao entra aqui

- `agents/openai.yaml` que ja fazem parte de uma skill
- exemplos descartaveis
- configuracoes temporarias de experimento

Quando aparecer o primeiro caso real, esta pasta pode ganhar:

- um README por agent
- arquivos de configuracao versionados
- documentacao de gatilhos, entradas, saidas e guardrails
