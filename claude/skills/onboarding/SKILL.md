---
name: onboarding
description: "Apresenta o projeto ao dev novo — explica arquitetura, padroes, estrutura de pastas e responde duvidas. Usar quando um dev novo chegar ao projeto."
argument-hint: "[pergunta sobre o projeto]"
disable-model-invocation: true
---

# Skill: Onboarding

Agente especializado em integrar novos desenvolvedores ao projeto. Lê o contexto do projeto (CLAUDE.md, .context/, docs/, código), apresenta a arquitetura, explica os padrões do time e responde perguntas sobre como as coisas funcionam.

## Uso

```
/onboarding
/onboarding "como funciona o módulo de autenticação?"
/onboarding "onde fica a lógica de pagamento?"
```

## Instruções para o Claude

Quando o `/onboarding` for invocado, executar o seguinte fluxo:

### 1. Coletar contexto do projeto

Executar em paralelo:
- Ler `CLAUDE.md` na raiz do projeto (se existir)
- Listar estrutura de pastas: `src/`, `app/`, `modules/`, `services/`, `components/`
- Ler `package.json` ou `pyproject.toml` para entender dependências principais
- Ler `docs/` se existir
- Ler `.context/docs/` se existir (gerado pelo MCP ai-coders-context)
- Ler `README.md` do projeto

Se o projeto **não tiver CLAUDE.md nem .context/**, sugerir:
```
Este projeto ainda não tem contexto gerado. Recomendo executar /context
para eu conseguir te apresentar o projeto de forma mais completa.

Posso continuar com o que consigo ler do código, mas o contexto gerado
pelo /context vai me dar muito mais informações sobre a arquitetura.
```

---

### 2. Identificar tipo e contexto do projeto

Com base nos arquivos lidos, identificar:

- **Tipo**: Backend Node.js / Python / Frontend React / EDA / Fullstack
- **Framework principal**: NestJS, Express, FastAPI, Django, Next.js, etc.
- **Banco de dados**: PostgreSQL, MongoDB, MySQL, Redis, etc.
- **Infraestrutura**: Docker, Kubernetes, AWS, Serverless, etc.
- **Filas**: SQS, RabbitMQ, Kafka, etc. (se EDA)
- **Monorepo ou single repo**

---

### 3. Apresentar o projeto

Se o usuário não fez uma pergunta específica (apenas `/onboarding`), apresentar:

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

### Próximos passos sugeridos
1. Configure o `.env` a partir do `.env.example`
2. Rode `npm install` e `npm run start:dev`
3. Explore o módulo `{módulo mais relevante para começar}`
4. Para iniciar sua primeira task: `/start-feature ENG-{seu-id}`

Tem alguma dúvida específica? Pode me perguntar sobre qualquer parte do projeto.
```

---

### 4. Responder perguntas específicas

Se o usuário fez uma pergunta (`/onboarding "como funciona X?"`):

1. Buscar nos arquivos de contexto e no código as informações relevantes:
   - `.context/docs/` — documentação gerada
   - `docs/` — docs locais
   - `src/modules/{modulo-relacionado}/` — código-fonte
   - Testes como documentação viva: `*.spec.ts`, `*.test.ts`

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

### 5. Sugerir próximas perguntas

Ao final de qualquer resposta, sugerir perguntas relacionadas:

```
Outras perguntas que posso responder:
- "Como funciona o fluxo de {módulo relacionado}?"
- "Quais são os padrões de erro deste projeto?"
- "Como estão organizados os testes?"
- "Quais variáveis de ambiente preciso configurar?"
```
