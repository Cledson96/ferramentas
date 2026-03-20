# Figma MCP config reference

Use this snippet to register the Figma MCP server in your `opencode.json` as a remote server with OAuth authentication.

## opencode.json configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true,
      "oauth": {}
    }
  }
}
```

Place this in either:
- Project-level: `opencode.json` (in your repo root)
- Global: `~/.config/opencode/opencode.json`

## Authentication

After adding the config, authenticate with:

```bash
opencode mcp auth figma
```

This opens your browser for OAuth authorization. After you authorize, OpenCode stores tokens securely for future requests.

Manage auth:
```bash
opencode mcp list          # List all MCP servers and auth status
opencode mcp auth figma    # Authenticate with Figma
opencode mcp logout figma  # Remove stored credentials
```

## Region header (optional)

If your Figma org uses a specific region, you can add headers:

```json
{
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true,
      "oauth": {},
      "headers": {
        "X-Figma-Region": "us-east-1"
      }
    }
  }
}
```

## Env var authentication (alternative to OAuth)

If you prefer to use a pre-existing FIGMA_OAUTH_TOKEN instead of OAuth flow:

```json
{
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true,
      "oauth": false,
      "headers": {
        "Authorization": "Bearer {env:FIGMA_OAUTH_TOKEN}"
      }
    }
  }
}
```

Then set the env var:
- One-time: `export FIGMA_OAUTH_TOKEN="<token>"`
- Persist: add the export to your shell profile (`~/.zshrc` or `~/.bashrc`)

## Timeout (optional)

```json
{
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true,
      "oauth": {},
      "timeout": 30000
    }
  }
}
```

Default timeout is 5000ms (5 seconds). Increase if needed.

## Troubleshooting

- Token not picked up: Run `opencode mcp auth figma` again, or check env var is exported in the same shell
- OAuth errors: Verify the bearer token is valid. Tokens copied from Figma should not include surrounding quotes
- Connection issues: Check `opencode mcp debug figma` for connection and OAuth flow diagnosis
- Server not found: Verify `opencode.json` has the correct `type: "remote"` and URL

## Usage reminders
- The server is link-based: copy the Figma frame or layer link, then ask the agent to implement that URL
- If output feels generic, restate the project-specific rules from the main skill and ensure you follow the required flow (get_design_context -> get_metadata if needed -> get_screenshot)
