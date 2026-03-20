# Instalacao E Sincronizacao

Esta pasta foi organizada para espelhar o formato esperado pelo Codex em `.codex/skills`.

## Origem e destino

- origem versionada: [codex/skills](/C:/projetos/ferramentas/codex/skills)
- destino local padrao: `C:\Users\Cledson Souza\.codex\skills`

## Regra principal

Sincronize apenas as skills customizadas desta pasta para o ambiente local. Nao copie `.system` do ambiente local para ca, nem daqui para la.

## PowerShell

Para copiar uma skill especifica:

```powershell
Copy-Item -Path "C:\projetos\ferramentas\codex\skills\project-context" `
  -Destination "C:\Users\Cledson Souza\.codex\skills\project-context" `
  -Recurse -Force
```

Para sincronizar todas as skills versionadas desta pasta:

```powershell
$source = "C:\projetos\ferramentas\codex\skills"
$dest = "C:\Users\Cledson Souza\.codex\skills"

Get-ChildItem -Directory $source | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination (Join-Path $dest $_.Name) -Recurse -Force
}
```

## Fluxo recomendado

1. Editar ou adicionar a skill dentro de [codex/skills](/C:/projetos/ferramentas/codex/skills)
2. Revisar documentacao e dependencias da skill
3. Sincronizar a skill para `.codex/skills`
4. Testar o gatilho no Codex
5. So depois replicar o que fizer sentido para `claude/` ou `opencode/`

## Checklist rapido

- a skill tem `SKILL.md`
- o nome da pasta esta em kebab-case
- scripts auxiliares foram copiados junto
- assets e references so existem se forem realmente usados
- a skill nao depende implicitamente de arquivos fora da propria pasta sem isso estar documentado
