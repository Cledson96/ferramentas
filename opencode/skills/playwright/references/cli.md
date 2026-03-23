# Playwright MCP — Referencia de Ferramentas

Ferramentas disponiveis apos a configuracao do Playwright MCP no OpenCode.

## Navegacao

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_navigate` | `url` | Abre uma URL no navegador |
| `browser_go_back` | — | Volta para a pagina anterior |
| `browser_go_forward` | — | Avanca para a proxima pagina |
| `browser_reload` | — | Recarrega a pagina atual |

## Interacao com elementos

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_snapshot` | — | Captura estado do DOM com refs de elementos |
| `browser_click` | `ref` | Clica em um elemento |
| `browser_dblclick` | `ref` | Duplo clique em um elemento |
| `browser_hover` | `ref` | Passa o mouse sobre um elemento |
| `browser_fill` | `ref`, `value` | Preenche campo de formulario |
| `browser_type` | `ref`, `value` | Digita texto caractere por caractere |
| `browser_select_option` | `ref`, `value` | Seleciona opcao em dropdown |
| `browser_check` | `ref` | Marca checkbox |
| `browser_uncheck` | `ref` | Desmarca checkbox |
| `browser_drag` | `sourceRef`, `targetRef` | Arrasta de um elemento para outro |
| `browser_upload` | `ref`, `filePath` | Faz upload de arquivo |

## Teclado

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_press` | `key` | Pressiona uma tecla (Enter, Tab, Escape, ArrowDown, etc.) |
| `browser_keydown` | `key` | Segura uma tecla pressionada |
| `browser_keyup` | `key` | Solta uma tecla |

## Mouse

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_mousemove` | `x`, `y` | Move o mouse para coordenadas |
| `browser_mousedown` | `button` | Pressiona botao do mouse (left, right, middle) |
| `browser_mouseup` | `button` | Solta botao do mouse |
| `browser_mousewheel` | `deltaX`, `deltaY` | Rola a pagina |

## Extracao e execucao

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_get_text` | `ref` | Extrai texto de um elemento |
| `browser_evaluate` | `expression` | Executa JavaScript na pagina |
| `browser_evaluate` | `expression`, `ref` | Executa JS em um elemento especifico |

## Captura de artefatos

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_screenshot` | — | Screenshot da pagina inteira |
| `browser_screenshot` | `ref` | Screenshot de um elemento especifico |
| `browser_pdf` | — | Gera PDF da pagina |

## Abas

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_tab_list` | — | Lista abas abertas |
| `browser_tab_new` | `url?` | Abre nova aba (com URL opcional) |
| `browser_tab_select` | `index` | Seleciona aba por indice |
| `browser_tab_close` | `index?` | Fecha aba atual ou por indice |

## Debugging

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_console` | — | Captura mensagens do console |
| `browser_console` | `level` | Filtra por nivel (error, warning, info) |
| `browser_network` | — | Monitora atividade de rede |

## Dialogs

| Ferramenta | Argumentos | Descricao |
|------------|------------|-----------|
| `browser_dialog_accept` | `text?` | Aceita dialog (alert, confirm, prompt) |
| `browser_dialog_dismiss` | — | Rejeita dialog |

## Sessoes

Use a opcao `--output-dir` na configuracao MCP para isolar artefatos por projeto:

```jsonc
{
  "mcp": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "--output-dir", "./output/playwright"]
    }
  }
}
```

## Configuracao avancada

### Arquivo de configuracao

O CLI le `playwright-cli.json` do diretorio atual. Use para configurar viewport, browser e outras opcoes:

```json
{
  "browser": {
    "launchOptions": {
      "headless": true
    },
    "contextOptions": {
      "viewport": { "width": 1280, "height": 720 },
      "locale": "pt-BR"
    }
  }
}
```

### Seguranca

```jsonc
{
  "args": [
    "@playwright/mcp",
    "--allowed-hosts", "example.com,api.example.com",
    "--blocked-origins", "malicious.com"
  ]
}
```
