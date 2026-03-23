# Dynamic Context Pruning (DCP)

Plugin que reduz automaticamente o uso de tokens no OpenCode.

## Instalação rápida

Adicione no seu `opencode.jsonc` do projeto:

```jsonc
{
    "plugin": ["@tarquinen/opencode-dcp@latest"]
}
```

## Configuração avançada

Copie o arquivo `opencode-dcp.jsonc` para `~/.config/opencode/dcp.jsonc` ou para `.opencode/dcp.jsonc` no seu projeto.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `/dcp` | Lista comandos disponíveis |
| `/dcp context` | Mostra uso de tokens por categoria |
| `/dcp stats` | Estatísticas acumuladas de pruning |
| `/dcp sweep` | Limpa tools desde última mensagem |
| `/dcp compress` | Força compressão manual |
| `/dcp manual on/off` | Ativa/desativa modo manual |
| `/dcp decompress <n>` | Restaura compressão por ID |
| `/dcp recompress <n>` | Reaplica compressão |

## Estratégias

- **Compress** — Compressão inteligente de trechos da conversa
- **Deduplication** — Remove chamadas de tools repetidas
- **Purge Errors** — Remove inputs de tools com erro após X turns

Mais info: https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
