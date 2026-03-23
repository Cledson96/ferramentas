# Playwright MCP — Workflows e Troubleshooting

Workflows praticos para automacao de navegadores via Playwright MCP no OpenCode.

## Loop de interacao padrao

1. `browser_navigate` — abre a pagina
2. `browser_snapshot` — captura refs dos elementos
3. Interage usando refs do snapshot
4. Re-snapshot apos mudancas no DOM

## Workflow: Formulario

```
1. browser_navigate    -> https://example.com/form
2. browser_snapshot
3. browser_fill        -> e1 "user@example.com"
4. browser_fill        -> e2 "password123"
5. browser_click       -> e3 (botao submit)
6. browser_snapshot    (captura resultado)
7. browser_screenshot  (comprovacao visual)
```

## Workflow: Extracao de dados

```
1. browser_navigate    -> https://example.com
2. browser_snapshot
3. browser_evaluate    -> "document.title"
4. browser_get_text    -> e12 (extrai texto de tabela)
5. browser_evaluate    -> "el => el.getAttribute('href')" -> e5
```

## Workflow: Debug de fluxo UI

Capture mensagens do console e atividade de rede apos reproduzir um problema:

```
1. browser_navigate    -> https://example.com
2. browser_snapshot
3. [reproduzir o problema: cliques, preenchimentos, navegacao]
4. browser_console     -> warning
5. browser_network
6. browser_screenshot
```

Para gravar trace ao redor de um fluxo suspeito, use `browser_evaluate` para iniciar/parar trace via Playwright API.

## Workflow: Multi-aba

```
1. browser_navigate    -> https://example.com
2. browser_snapshot
3. browser_tab_new     -> https://example.com/page2
4. browser_tab_list
5. browser_tab_select  -> 0
6. browser_snapshot
```

## Workflow: Upload de arquivo

```
1. browser_navigate    -> https://example.com/upload
2. browser_snapshot
3. browser_click       -> e1 (abre seletor de arquivo)
4. browser_upload      -> e1 "/path/to/document.pdf"
5. browser_snapshot
```

## Workflow: Pagina com scroll

```
1. browser_navigate    -> https://example.com/long-page
2. browser_snapshot
3. browser_mousewheel  -> 0 500 (rola para baixo)
4. browser_snapshot    (refs atualizados apos scroll)
```

## Workflow: Captura de PDF

```
1. browser_navigate    -> https://example.com/report
2. browser_snapshot    (espera carregar)
3. browser_pdf         (gera PDF da pagina)
```

## Configuracao por projeto

No `opencode.json` do projeto, configure opcoes especificas:

```jsonc
{
  "mcp": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp",
        "--headless",
        "--browser", "chromium",
        "--viewport-size", "1920,1080",
        "--output-dir", "./output/playwright"
      ]
    }
  }
}
```

## Troubleshooting

### Ref de elemento falhou

O ref ficou stale apos mudanca no DOM. Execute `browser_snapshot` novamente e tente o comando com o novo ref.

### Pagina parece errada

Abra sem `--headless` para ver o navegador e redimensione a janela com a opcao `--viewport-size`.

### Fluxo depende de estado anterior

Navegue manualmente ate o ponto de partida antes de comecar a automacao.

### Erro de conexao MCP

1. Verifique se `@playwright/mcp` esta instalado: `npm list -g @playwright/mcp`
2. Verifique a configuracao no `opencode.json`
3. Teste manualmente: `npx @playwright/mcp --help`
4. Reinicie o OpenCode apos alterar `opencode.json`

### Navegadores nao instalados

```bash
npx playwright install chromium
# Se falhar no Linux:
sudo npx playwright install-deps chromium
```

### Timeout em paginas lentas

Aumente o timeout na configuracao:

```jsonc
{
  "mcp": {
    "playwright": {
      "args": ["@playwright/mcp", "--timeout", "60000"]
    }
  }
}
```
