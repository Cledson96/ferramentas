---
name: onboarding
description: "Apresenta o projeto para quem esta chegando agora: explica arquitetura, stack, padroes, estrutura de pastas e responde perguntas de navegacao no codigo. Use quando alguem for conhecer o repo, pedir uma visao geral tecnica ou perguntar onde uma parte do sistema funciona."
compatibility: opencode
---

# Skill: Onboarding

Use esta skill para integrar novos desenvolvedores ao projeto. Leia o contexto disponivel, apresente a arquitetura e responda perguntas de navegacao no codigo.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Quando usar

- quando alguem estiver conhecendo o repositorio pela primeira vez
- quando o usuario pedir uma visao geral tecnica, arquitetura, stack ou estrutura de pastas
- quando o usuario perguntar onde um fluxo, modulo ou parte do sistema funciona
- quando for preciso orientar proximos passos para comecar a trabalhar no projeto

## Quando nao usar

- quando a tarefa for gerar ou atualizar contexto persistente do repo; nesses casos usar `project-context`
- quando o pedido for alterar codigo em vez de explicar arquitetura ou navegacao
- quando a pergunta for extremamente pontual e puder ser respondida lendo um unico arquivo sem fluxo de onboarding

## Instrucoes

Quando esta skill for carregada, siga este fluxo:

### 1. Coletar contexto do projeto

Executar em paralelo:
- Ler `AGENTS.md` na raiz do projeto, se existir
- Ler `.context/project-context.md`, se existir
- Listar estrutura de pastas relevante: `src/`, `app/`, `modules/`, `services/`, `components/`
- Ler `package.json` ou `pyproject.toml` para entender dependencias principais
- Ler `docs/` se existir
- Ler `README.md` do projeto

Se o projeto nao tiver `AGENTS.md` nem `.context/project-context.md`, sugerir:

```
Este projeto ainda nao tem contexto leve gerado. Recomendo carregar a skill
`project-context` para gerar o contexto do projeto. Isso vai me permitir
apresentar a arquitetura com mais confianca e navegar melhor pelo codigo.

Posso continuar com o que consigo ler do codigo e do README, mas o
contexto gerado vai me dar uma visao melhor das entradas, convencoes e
arquivos-chave.
```

Se o contexto existir, use-o como fonte primaria antes de explorar o codigo bruto.

### 2. Identificar tipo e contexto do projeto

Com base nos arquivos lidos, identificar:

- **Tipo**: Backend Node.js / Python / Frontend React / EDA / Fullstack
- **Framework principal**: NestJS, Express, FastAPI, Django, Next.js, etc.
- **Banco de dados**: PostgreSQL, MongoDB, MySQL, Redis, etc.
- **Infraestrutura**: Docker, Kubernetes, AWS, Serverless, etc.
- **Filas**: SQS, RabbitMQ, Kafka, etc. (se EDA)
- **Monorepo ou single repo**

### 3. Apresentar o projeto

Se o usuario nao fez uma pergunta especifica (apenas carregou a skill), apresentar:

```
## Bem-vindo ao {nome do projeto}!

### O que e este projeto?
{descricao do servico e seu papel}

### Stack
- **Linguagem**: {TypeScript / Python / etc.}
- **Framework**: {NestJS / FastAPI / Next.js / etc.}
- **Banco**: {PostgreSQL / MongoDB / etc.}
- **Infra**: {Docker / AWS / etc.}

### Estrutura principal
{explicacao das pastas mais importantes e o que cada uma faz}

src/
├── modules/          → cada modulo e um dominio de negocio
│   ├── auth/         → autenticacao e autorizacao
│   ├── users/        → gestao de usuarios
│   └── payments/     → processamento de pagamentos
├── common/           → utilitarios e decorators compartilhados
├── config/           → configuracoes e variaveis de ambiente
└── main.ts           → ponto de entrada da aplicacao

### Como rodar localmente
{passo a passo baseado no README ou package.json}

### Padroes do time
- Commits: Conventional Commits com Jira ID (ENG-123)
- Branches: `feature/ENG-123-descricao` ou `fix/ENG-123-descricao`

### Proximos passos sugeridos
1. Configure o `.env` a partir do `.env.example`
2. Rode `npm install` e `npm run start:dev`
3. Explore o modulo `{modulo mais relevante para comecar}`

Tem alguma duvida especifica? Pode me perguntar sobre qualquer parte do projeto.
```

### 4. Responder perguntas especificas

Se o usuario fez uma pergunta:

1. Buscar nos arquivos de contexto e no codigo as informacoes relevantes:
   - `AGENTS.md`
   - `.context/project-context.md`
   - `docs/`
   - `src/modules/{modulo-relacionado}/`
   - Testes como documentacao viva: `*.spec.ts`, `*.test.ts`

2. Responder de forma didatica:
   - Explicar o fluxo em linguagem natural
   - Mostrar os arquivos principais envolvidos
   - Incluir trecho de codigo relevante quando ajudar o entendimento
   - Indicar onde encontrar mais detalhes

3. Exemplos de perguntas e como responder:

**"Como funciona o modulo de autenticacao?"**
```
O modulo de autenticacao fica em `src/modules/auth/` e funciona assim:

1. O usuario faz POST /auth/login com email e senha
2. O AuthService valida as credenciais no banco
3. Se valido, gera um JWT (access token + refresh token)
4. O JwtStrategy valida o token em cada request protegido

Arquivos principais:
- auth.controller.ts — endpoints de login, logout, refresh
- auth.service.ts — logica de validacao e geracao de tokens
- jwt.strategy.ts — validacao do JWT nos requests

Para entender melhor, leia os testes:
- auth.service.spec.ts
```

**"Onde fica a logica de pagamento?"**
```
A logica de pagamento esta distribuida em:

- src/modules/payments/ — processamento principal
- src/modules/billing/ — faturamento e cobrancas recorrentes
- src/integrations/stripe/ — integracao com o gateway de pagamento

O fluxo principal e:
1. Frontend chama POST /payments/checkout
2. PaymentsService cria a intencao de pagamento no Stripe
3. Apos confirmacao do Stripe (webhook), atualiza o status no banco
4. Evento `payment.confirmed` e publicado para outros servicos
```

**"Como rodar os testes?"**
```
npm run test          → testes unitarios
npm run test:e2e      → testes end-to-end
npm run test:coverage → relatorio de cobertura

Os testes ficam em arquivos .spec.ts ao lado do codigo que testam.
Padrao: arrange / act / assert nos describe/it blocks.
```

---

### 5. Sugerir proximas perguntas

Ao final de qualquer resposta, sugerir perguntas relacionadas:

```
Outras perguntas que posso responder:
- "Como funciona o fluxo de {modulo relacionado}?"
- "Quais sao os padroes de erro deste projeto?"
- "Como estao organizados os testes?"
- "Quais variaveis de ambiente preciso configurar?"
```

## Guardrails

- Nao depender de MCP externo.
- Nao sobrescrever arquivos do projeto.
- Nao inventar informacoes sobre a arquitetura; usar apenas o que encontrar no codigo e no contexto.
- Se nao encontrar informacao suficiente, ser transparente e sugerir onde o usuario pode procurar.
- Priorizar `AGENTS.md` e `.context/project-context.md` como ponto de entrada quando existirem.
