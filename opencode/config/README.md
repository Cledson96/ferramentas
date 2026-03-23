# OpenCode Global Config

## Configs inclusas

### 1. Dynamic Context Pruning (DCP)

Reduz automaticamente o uso de tokens no OpenCode.

| Comando | Descrição |
|---------|-----------|
| `/dcp` | Lista comandos disponíveis |
| `/dcp context` | Mostra uso de tokens por categoria |
| `/dcp stats` | Estatísticas acumuladas de pruning |
| `/dcp sweep` | Limpa tools desde última mensagem |
| `/dcp compress` | Força compressão manual |
| `/dcp manual on/off` | Ativa/desativa modo manual |

Mais info: https://github.com/Opencode-DCP/opencode-dynamic-context-pruning

### 2. Antigravity Auth

Autenticação OAuth para usar modelos do Google Antigravity via OpenCode.

**Modelos disponíveis:**
- `antigravity-claude-opus-4-6-thinking` — Claude Opus 4.6 com extended thinking
- `antigravity-claude-sonnet-4-6` — Claude Sonnet 4.6
- `antigravity-gemini-3-pro` / `3.1-pro` / `3-flash` — Gemini com thinking
- `gemini-2.5-flash` / `2.5-pro` / `3-flash-preview` — via Gemini CLI quota

**Primeiro uso:** rodar `opencode auth login` para autenticar com Google.

Mais info: https://github.com/NoeFabris/opencode-antigravity-auth

---

## Instalacao

Use o instalador do pacote para copiar estes arquivos para `~/.config/opencode/` e mesclar `opencode.jsonc` com seguranca.

```jsonc
{
    "plugin": [
        "opencode-antigravity-auth@latest",
        "@tarquinen/opencode-dcp@latest"
    ]
}
```

> **Importante:** O `antigravity-auth` deve vir **antes** do DCP na lista.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `opencode.jsonc` | Config completa com plugins + modelos |
| `opencode-dcp.jsonc` | Config avançada do DCP |
| `opencode-antigravity.jsonc` | Config avançada do Antigravity Auth |

O instalador copia os configs avancados para `~/.config/opencode/`.
