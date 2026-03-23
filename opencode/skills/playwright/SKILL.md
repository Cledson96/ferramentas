---
name: playwright
description: Use quando a tarefa exige automatizar um navegador real via Playwright MCP — navegacao, preenchimento de formularios, screenshots, extracao de dados, debug de fluxos UI. Acione tambem para testes visuais, scraping, captura de PDFs e qualquer interacao programatica com paginas web.
---

# Skill: Playwright (MCP)

Automatize navegadores reais a partir do terminal usando o Playwright MCP server integrado ao OpenCode.

Esta skill usa a abordagem MCP (Model Context Protocol) em vez de scripts wrapper. O OpenCode gerencia a conexao com o servidor MCP automaticamente.

## Instalacao

### 1. Instalar o pacote MCP

```bash
npm install -g @playwright/mcp
```

### 2. Instalar navegadores (primeira vez, ~100MB cada)

```bash
npx playwright install chromium
# Opcional:
npx playwright install firefox
npx playwright install webkit
```

### 3. Dependencias do sistema (Linux/Debian)

```bash
sudo npx playwright install-deps chromium
```

No Windows e macOS, as dependencias sao resolvidas automaticamente.

## Configuracao

Adicione o Playwright MCP no seu `opencode.json` do projeto ou global (`~/.config/opencode/opencode.json`):

```jsonc
{
  "plugin": [],
  "mcp": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {}
    }
  }
}
```

### Opcoes de inicializacao

Para passar opcoes ao servidor MCP, ajuste os `args`:

```jsonc
{
  "mcp": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp",
        "--headless",
        "--viewport-size", "1280,720",
        "--timeout", "30000"
      ]
    }
  }
}
```

| Opcao | Descricao | Default |
|-------|-----------|---------|
| `--headless` | Executar sem interface grafica | false (visor visivel) |
| `--browser` | `chromium`, `firefox` ou `webkit` | chromium |
| `--viewport-size` | Tamanho da viewport `W,H` | 1280,720 |
| `--timeout` | Timeout de acoes (ms) | 30000 |
| `--output-dir` | Pasta para screenshots/outputs | atual |
| `--allowed-hosts` | Hosts permitidos (virgula-separado) | todos |
| `--blocked-origins` | Origens bloqueadas | nenhuma |

## Ferramentas MCP disponiveis

Apos configurado, o OpenCode expoe estas ferramentas:

| Ferramenta | Descricao |
|------------|-----------|
| `browser_navigate` | Abre uma URL no navegador |
| `browser_snapshot` | Captura o estado atual do DOM com refs de elementos |
| `browser_click` | Clica em um elemento por ref |
| `browser_type` | Digita texto em um campo |
| `browser_fill` | Preenche um campo de formulario |
| `browser_select_option` | Seleciona opcao em dropdown |
| `browser_press` | Pressiona uma tecla (Enter, Tab, etc.) |
| `browser_hover` | Passa o mouse sobre um elemento |
| `browser_drag` | Arrasta de um elemento para outro |
| `browser_get_text` | Extrai texto de um elemento |
| `browser_evaluate` | Executa JavaScript na pagina |
| `browser_screenshot` | Captura screenshot (pagina ou elemento) |
| `browser_pdf` | Gera PDF da pagina |
| `browser_close` | Fecha a aba atual |
| `browser_tab_list` | Lista abas abertas |
| `browser_tab_new` | Abre nova aba |
| `browser_tab_select` | Seleciona aba por indice |
| `browser_console` | Captura mensagens do console |
| `browser_network` | Monitora atividade de rede |

## Fluxo padrao

1. Navegar para a URL desejada com `browser_navigate`.
2. Capturar snapshot com `browser_snapshot` para obter refs de elementos.
3. Interagir usando refs do snapshot mais recente.
4. Re-snapshot apos navegacoes ou mudancas significativas no DOM.
5. Capturar artefatos (screenshot, PDF) quando util.

### Loop minimo

```
1. browser_navigate -> https://example.com
2. browser_snapshot
3. browser_click -> e3
4. browser_snapshot
```

## Quando dar snapshot novamente

Dar novo snapshot apos:
- navegacao para nova pagina
- clique que altera substancialmente a UI
- abertura/fechamento de modais ou menus
- troca de abas

Refs podem ficar stale. Se um comando falhar por ref inexistente, dar snapshot novamente.

## Padroes recomendados

### Preenchimento e envio de formulario

```
1. browser_navigate -> https://example.com/form
2. browser_snapshot
3. browser_fill -> e1 "user@example.com"
4. browser_fill -> e2 "password123"
5. browser_click -> e3
6. browser_snapshot
7. browser_screenshot
```

### Extracao de dados

```
1. browser_navigate -> https://example.com
2. browser_snapshot
3. browser_evaluate -> "document.title"
4. browser_get_text -> e12
```

### Debug de fluxo UI com traces

```
1. browser_navigate -> https://example.com
2. [executar fluxo suspeito]
3. browser_console -> warning
4. browser_network
5. browser_screenshot
```

### Trabalho multi-aba

```
1. browser_tab_new -> https://example.com/page2
2. browser_tab_list
3. browser_tab_select -> 0
4. browser_snapshot
```

## Referencias abertas sob demanda

- Referencia completa de ferramentas: `references/cli.md`
- Workflows praticos e troubleshooting: `references/workflows.md`

## Guardrails

- Sempre dar snapshot antes de referenciar ids de elementos como `e12`.
- Re-snapshot quando refs parecerem stale.
- Prefirir ferramentas MCP explicitas em vez de `eval` quando possivel.
- Usar `--headed` (remover `--headless`) quando uma verificacao visual ajudar.
- Ao capturar artefatos neste repo, usar `output/playwright/` e evitar criar pastas de artefatos no nivel raiz.
- Nao assumir que refs persistem entre snapshots diferentes.
- Em caso de erro de conexao MCP, verificar se o servidor esta rodando e se o `opencode.json` esta configurado corretamente.
