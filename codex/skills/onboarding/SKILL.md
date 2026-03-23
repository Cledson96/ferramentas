---
name: onboarding
description: "Apresenta o projeto para quem esta chegando agora: explica arquitetura, stack, padroes, estrutura de pastas e responde perguntas de navegacao no codigo. Use quando alguem for conhecer o repo, pedir uma visao geral tecnica ou perguntar onde uma parte do sistema funciona."
---

# Skill: Onboarding

Use esta skill para integrar novos desenvolvedores ao projeto. Leia o contexto disponivel, apresente a arquitetura e responda perguntas de navegacao no codigo sem depender de contexto legado de Claude.

## Uso

```
$onboarding
$onboarding "como funciona o modulo de autenticacao?"
$onboarding "onde fica a logica de pagamento?"
```

## Instrucoes para o Codex

Quando `$onboarding` for invocado, siga este fluxo:

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
Este projeto ainda nao tem contexto leve gerado. Recomendo executar
`$project-context` para eu conseguir te apresentar o projeto com mais
confianca e navegar melhor pela arquitetura.

Posso continuar com o que consigo ler do codigo e do README, mas o
contexto gerado vai me dar uma visao melhor das entradas, convencoes e
arquivos-chave.
```

### 2. Identificar tipo e contexto do projeto

Com base nos arquivos lidos, identificar:

- **Tipo**: Backend Node.js / Python / Frontend React / EDA / Fullstack
- **Framework principal**: NestJS, Express, FastAPI, Django, Next.js, etc.
- **Banco de dados**: PostgreSQL, MongoDB, MySQL, Redis, etc.
- **Infraestrutura**: Docker, Kubernetes, AWS, Serverless, etc.
- **Filas**: SQS, RabbitMQ, Kafka, etc. (se EDA)
- **Monorepo ou single repo**

### 3. Apresentar o projeto

Se o usuario nao fez uma pergunta especifica (apenas `$onboarding`), apresentar:

```
## Bem-vindo ao {nome do projeto}!

### O que é este projeto?
{descrição do serviço e seu papel no contexto da JusCash}

### Stack
- **Linguagem**: {TypeScript / Python / etc.}
- **Framework**: {NestJS / FastAPI / Next.js / etc.}
- **Banco**: {PostgreSQL / MongoDB / etc.}
- **Infra**: {Docker / AWS / etc.}

### Estrutura principal
{explicação das pastas mais importantes e o que cada uma faz}

src/
├── modules/          → cada módulo é um domínio de negócio
│   ├── auth/         → autenticação e autorização
│   ├── users/        → gestão de usuários
│   └── payments/     → processamento de pagamentos
├── common/           → utilitários e decorators compartilhados
├── config/           → configurações e variáveis de ambiente
└── main.ts           → ponto de entrada da aplicação

### Como rodar localmente
{passo a passo baseado no README ou package.json}

### Padrões do time
- Commits: Conventional Commits com Jira ID (ENG-123)
- UI: sempre `@juscash/design-system`, nunca `antd` direto
- Branches: `feature/ENG-123-descricao` ou `fix/ENG-123-descricao`

### Proximos passos sugeridos
1. Configure o `.env` a partir do `.env.example`
2. Rode `npm install` e `npm run start:dev`
3. Explore o modulo `{modulo mais relevante para comecar}`
4. Para iniciar sua primeira task: `$start-feature ENG-{seu-id}`

Tem alguma dúvida específica? Pode me perguntar sobre qualquer parte do projeto.
```

### 4. Responder perguntas específicas

Se o usuario fez uma pergunta (`$onboarding "como funciona X?"`):

1. Buscar nos arquivos de contexto e no codigo as informacoes relevantes:
   - `AGENTS.md`
   - `.context/project-context.md`
   - `docs/`
   - `src/modules/{modulo-relacionado}/`
   - Testes como documentacao viva: `*.spec.ts`, `*.test.ts`

2. Responder de forma didática:
   - Explicar o fluxo em linguagem natural
   - Mostrar os arquivos principais envolvidos
   - Incluir trecho de código relevante quando ajudar o entendimento
   - Indicar onde encontrar mais detalhes

3. Exemplos de perguntas e como responder:

**"Como funciona o módulo de autenticação?"**
```
O módulo de autenticação fica em `src/modules/auth/` e funciona assim:

1. O usuário faz POST /auth/login com email e senha
2. O AuthService valida as credenciais no banco
3. Se válido, gera um JWT (access token + refresh token)
4. O JwtStrategy valida o token em cada request protegido

Arquivos principais:
- auth.controller.ts — endpoints de login, logout, refresh
- auth.service.ts — lógica de validação e geração de tokens
- jwt.strategy.ts — validação do JWT nos requests

Para entender melhor, leia os testes:
- auth.service.spec.ts
```

**"Onde fica a lógica de pagamento?"**
```
A lógica de pagamento está distribuída em:

- src/modules/payments/ — processamento principal
- src/modules/billing/ — faturamento e cobranças recorrentes
- src/integrations/stripe/ — integração com o gateway de pagamento

O fluxo principal é:
1. Frontend chama POST /payments/checkout
2. PaymentsService cria a intenção de pagamento no Stripe
3. Após confirmação do Stripe (webhook), atualiza o status no banco
4. Evento `payment.confirmed` é publicado para outros serviços
```

**"Como rodar os testes?"**
```
npm run test          → testes unitários
npm run test:e2e      → testes end-to-end
npm run test:coverage → relatório de cobertura

Os testes ficam em arquivos .spec.ts ao lado do código que testam.
Padrão: arrange / act / assert nos describe/it blocks.
```

---

### 5. Sugerir proximas perguntas

Ao final de qualquer resposta, sugerir perguntas relacionadas:

```
Outras perguntas que posso responder:
- "Como funciona o fluxo de {módulo relacionado}?"
- "Quais são os padrões de erro deste projeto?"
- "Como estão organizados os testes?"
- "Quais variáveis de ambiente preciso configurar?"
```
