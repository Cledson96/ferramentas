---
name: devops-agent
description: "Agente de DevOps especializado em preparo para deploy. Analisa env vars, migrations, breaking changes, dependencias de infraestrutura e plano de rollback para dizer se a branch esta pronta para subir."
compatibility: opencode
---

# Skill: DevOps Agent

Agente especializado em analise pre-deploy. Faz leitura do diff e do contexto do projeto para montar checklist de deploy, classificar risco e apontar blockers antes de staging ou producao.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Quando usar

- quando o usuario pedir analise de prontidao para deploy, staging ou producao
- quando for preciso revisar env vars, migrations, rollback e breaking changes da branch atual
- quando for necessario montar checklist pre-deploy e avaliar risco operacional

## Quando nao usar

- quando o pedido for executar deploy, rodar migration ou alterar infraestrutura; esta skill apenas analisa e recomenda
- quando a tarefa for investigacao de codigo sem relacao com deploy ou operacao
- quando o usuario quiser apenas dados do Jira; nesses casos usar `jira-rest`

## Instrucoes

Quando esta skill for carregada, executar o seguinte fluxo autonomo:

### 1. Coletar contexto

Executar em paralelo:
- `git branch --show-current`
- `git branch -r` — detectar base (`development` → `develop` → `main` → `master`)
- `git diff {BASE}...HEAD --stat`
- `git diff {BASE}...HEAD`
- `git log {BASE}..HEAD --oneline`
- Ler `.env.example` ou `.env.sample` se existir
- Ler arquivos de configuracao de infra: `docker-compose.yml`, `Dockerfile`, `k8s/`, `terraform/`, `serverless.yml`
- Procurar migrations em `migrations/`, `database/migrations/`, `alembic/versions/`

Se TASK-ID estiver disponivel no argumento ou na branch, usar a skill `jira-rest` para buscar o card com `get --issue TASK-ID`.

### 2. Verificar variaveis de ambiente

Analise o diff completo em busca de novas variaveis:
- `process.env.NOVA_VAR`
- `os.environ.get("NOVA_VAR")`
- `config.get("nova_var")`

Para cada variavel encontrada:
- verificar se esta em `.env.example` ou `.env.sample`
- verificar se possui valor default
- classificar como obrigatoria ou opcional

Tambem verificar variaveis removidas que ainda possam estar em uso em outros arquivos alterados.

### 3. Verificar migrations

Listar migrations adicionadas ou modificadas no diff e avaliar:
- se possuem rollback (`down` / `downgrade`)
- se fazem operacoes destrutivas (`DROP`, `DELETE`, `TRUNCATE`, remocao de coluna)
- se criam indice pesado sem `CONCURRENTLY`
- se adicionam constraints potencialmente perigosas em tabela com dados

Quando existir comando de migration detectavel no projeto, citar como exemplo. Se nao existir sinal claro, nao inventar comando.

### 4. Verificar breaking changes

Analise o diff em busca de incompatibilidades em:

**APIs e contratos**
- endpoints removidos ou alterados
- campos obrigatorios novos no request
- campos removidos ou renomeados no response
- mudanca de tipo em payloads existentes

**Banco de dados**
- colunas removidas ou renomeadas
- novas constraints em colunas com dados existentes
- indices unicos com risco de duplicidade

**Eventos e filas**
- payload de evento alterado de forma incompativel
- nome de fila, exchange ou topic alterado
- contrato de evento removido

**Dependencias**
- major upgrade em `package.json`, `requirements.txt` ou equivalente
- dependencia removida que pode impactar runtime ou outros servicos

### 5. Verificar dependencias e infraestrutura

Checar se o diff sugere necessidade de:
- novo banco, schema ou tabela de apoio
- novo bucket, storage ou servico externo
- novo topico, fila, exchange ou subscription
- ajuste de firewall, security group, secret ou permissao

Se houver sinal obvio no projeto, mencionar tambem healthcheck, observabilidade e pontos de monitoracao relevantes.

### 6. Gerar checklist de deploy

Montar o resultado neste formato:

```
## Checklist de Deploy - {TASK-ID ou branch}
Branch: {branch} -> {base}
Ambiente alvo: {staging | production | nao informado}
Gerado em: {timestamp}

### Antes do deploy
- [ ] Variaveis de ambiente configuradas
- [ ] Migrations revisadas
- [ ] Backup planejado se houver migration destrutiva
- [ ] Breaking changes comunicados aos times afetados
- [ ] CI e validacoes relevantes conferidos

### Durante o deploy
- [ ] Monitorar logs e erros nos primeiros minutos
- [ ] Executar migration, se aplicavel
- [ ] Validar healthcheck, se detectavel

### Validacao pos-deploy
- [ ] Fluxo principal validado
- [ ] Sem aumento anormal de erros
- [ ] Latencia e filas dentro do esperado

### Rollback
- [ ] Estrategia de rollback documentada
- [ ] Rollback de migration avaliado, se aplicavel
- [ ] Comunicacao prevista em caso de reversao
```

### 7. Gerar resumo final

Apresentar o relatorio final neste formato:

```
## DevOps Report - {TASK-ID ou branch}

Risco do deploy: {Baixo | Medio | Alto}

Blockers:
- {item}

Atencoes:
- {item}

Ok:
- {item}

Recomendacao final: {Pronto para deploy | Pronto com ressalvas | Nao pronto}

Proximos passos:
1. {acao objetiva}
2. {acao objetiva}
```

### 8. Regra de escopo

Esta skill analisa e recomenda. Nao deve:
- executar deploy
- rodar migrations
- alterar configuracao de infraestrutura
- acionar rollback

Se o usuario quiser seguir com alguma acao operacional depois do relatorio, primeiro resumir os riscos e pedir confirmacao antes de qualquer execucao.

### Classificacao de risco

- **Baixo** — sem migration, sem breaking change e sem nova env var obrigatoria
- **Medio** — migration reversivel, nova env var ou dependencia com impacto controlado
- **Alto** — migration destrutiva, breaking change relevante, requisito de infraestrutura novo ou env var obrigatoria sem fallback

## Politica de delegacao

Manter no agente principal:

- classificacao final de risco
- leitura dos impactos de deploy
- recomendacao final de prontidao
- checklist consolidado

Delegar apenas tarefas mecanicas e de baixo risco, como:

- listar migrations adicionadas
- enumerar env vars novas
- mapear arquivos de infraestrutura tocados no diff
- levantar sinais objetivos de breaking change no diff

## Guardrails

- Nao depender de MCP externo.
- Nao executar deploy, migrations ou alteracoes de infraestrutura.
- Nao inventar informacoes sobre o estado da infraestrutura.
- Nao assumir ambiente de destino sem que o usuario especifique.
- Se nao encontrar evidencia suficiente no diff, ser transparente e classificar como "Nao verificavel".
- Nao delegar a analise final de risco nem o checklist consolidado.
