---
name: qa-agent
description: "Agente de QA especializado em qualidade de codigo. Faz review profundo com cobertura de testes, validacao de criterios de aceite e analise de riscos de qualidade. Use antes de abrir PR, para validar uma feature, revisar cobertura de testes ou encontrar blockers tecnicos."
compatibility: opencode
---

# Skill: QA Agent

Agente especializado em qualidade de codigo. Vai alem do review: analisa cobertura de testes, valida criterios de aceite do Jira contra o codigo implementado e sugere melhorias com exemplos concretos.

No OpenCode, esta skill e carregada on-demand via a ferramenta `skill`.

## Quando usar

- quando o usuario pedir uma validacao profunda de QA antes de PR ou merge
- quando for preciso revisar cobertura de testes, criterios de aceite e riscos de qualidade da branch
- quando fizer sentido gerar recomendacoes concretas de testes faltantes ou correcoes de blockers

## Quando nao usar

- quando o pedido for apenas um code review mais leve; nesse caso usar `review`
- quando a tarefa for implementar feature sem etapa de validacao de QA
- quando nao houver diff relevante para validar

## Instrucoes

Quando esta skill for carregada, executar o seguinte fluxo autonomo:

### 1. Coletar contexto

Executar em paralelo:
- `git branch --show-current`
- `git branch -r` — detectar base (`development` → `develop` → `main` → `master`)
- `git diff {BASE}...HEAD` — diff completo
- `git diff {BASE}...HEAD --stat` — arquivos alterados
- Listar arquivos de teste existentes no projeto: `rg --files -g "*.{spec,test}.*" -g "!node_modules"`

Se TASK-ID disponivel (argumento ou branch): usar a skill `jira-rest` para buscar o card com `get --issue TASK-ID`:
- `summary`, `description`, criterios de aceite, `issuetype.name`

### 2. Mapeamento de cobertura de testes

Para cada arquivo alterado no diff:

1. Verificar se existe arquivo de teste correspondente:
   - `src/modules/auth/auth.service.ts` → `src/modules/auth/auth.service.spec.ts`
   - `src/controllers/user.controller.ts` → `src/controllers/user.controller.spec.ts`
   - `app/services/payment.py` → `tests/test_payment.py`

2. Para os testes existentes: ler o conteudo e verificar se cobrem os novos fluxos adicionados no diff

3. Classificar cada arquivo alterado:
   - ✅ **Coberto** — tem testes que cobrem os novos fluxos
   - ⚠️ **Parcialmente coberto** — tem testes mas nao cobrem todos os novos casos
   - ❌ **Sem cobertura** — arquivo de logica sem testes correspondentes

4. Para funcoes/metodos publicos adicionados sem testes, gerar sugestao de teste:

```typescript
// Exemplo sugerido para AuthService.validateToken()
describe('AuthService', () => {
  describe('validateToken', () => {
    it('deve retornar o payload quando token e valido', async () => {
      // arrange
      const token = 'valid.jwt.token'
      // act
      const result = await authService.validateToken(token)
      // assert
      expect(result).toBeDefined()
      expect(result.userId).toBeTruthy()
    })

    it('deve lancar UnauthorizedException quando token e invalido', async () => {
      // arrange
      const token = 'invalid.token'
      // act & assert
      await expect(authService.validateToken(token))
        .rejects.toThrow(UnauthorizedException)
    })
  })
})
```

### 3. Validacao dos criterios de aceite

Se card Jira encontrado, extrair todos os criterios de aceite da descricao (buscar por padroes como "criterios de aceite", "acceptance criteria", listas com `-` ou `*` na descricao).

Para cada criterio, analisar o diff e determinar:

| Status | Significado |
|--------|-------------|
| ✅ Implementado | Codigo que atende o criterio foi encontrado no diff |
| ⚠️ Parcial | Parte do criterio foi implementada |
| ❌ Nao encontrado | Nenhuma evidencia no codigo |
| ❓ Nao verificavel | Criterio de negocio/UX que nao e verificavel via codigo |

### 4. Analise de qualidade profunda

Alem dos checks basicos de review, analisar:

**Complexidade ciclomatica**
- Funcoes com muitos `if/else` aninhados (>3 niveis) → sugerir refatoracao com early return ou strategy pattern

**Tratamento de erros**
- Operacoes async sem try/catch?
- Erros sendo silenciados (`catch (e) {}`)?
- Mensagens de erro informativas para o usuario final?

**Performance**
- N+1 queries em loops?
- Chamadas de API dentro de loops?
- Falta de paginacao em listagens?

**Design System (Frontend)**
- Imports diretos de `antd` → ❌ Blocker
- Imports de `@ant-design/icons` → ❌ Blocker (usar `LucideIcons` de `@juscash/design-system`)
- Estilos inline que deveriam usar tokens do design system?

**Seguranca**
- Dados sensiveis logados?
- Validacao de inputs ausente?
- SQL/NoSQL injection possivel?
- Tokens ou secrets hardcoded → ❌ Blocker

### 5. Gerar relatorio completo

```
## QA Report — {TASK-ID} — {titulo}
Analisado em: {timestamp}

---

### 📋 Criterios de Aceite
- ✅ {criterio 1}
- ✅ {criterio 2}
- ❌ {criterio 3} — nao encontrado no codigo
- ❓ {criterio 4} — verificacao manual necessaria

---

### 🧪 Cobertura de Testes

✅ Cobertos:
- auth.service.ts → auth.service.spec.ts (validateToken, refreshToken)

⚠️ Parcialmente cobertos:
- user.service.ts → user.service.spec.ts (faltam testes para updateProfile)

❌ Sem cobertura:
- jwt.strategy.ts → nenhum teste encontrado

---

### ✅ Aprovado
- {item aprovado}

### ⚠️ Atencao (nao bloqueiam PR)
- {arquivo}:{linha} — {problema e sugestao}

### ❌ Blockers (corrigir antes do PR)
- {arquivo}:{linha} — {problema}

---

### 📊 Resumo
Criterios de aceite: {N}/{total} implementados
Cobertura: {N} arquivos cobertos, {M} sem cobertura
Blockers: {N}
Warnings: {N}

Recomendacao final: {Aprovado | Aprovado com ressalvas | Reprovado}
```

### 6. Oferecer acoes

Apos o relatorio, perguntar ao usuario:

```
Quer que eu:
1. Gere os testes faltantes automaticamente?
2. Aplique as correcoes dos blockers?
3. Ambos?
```

Se o usuario confirmar, aplicar as correcoes/gerar testes e informar os arquivos alterados.

## Politica de delegacao

Mantenha no agente principal:

- validacao dos criterios de aceite
- classificacao de cobertura de testes
- severidade dos achados
- recomendacao final de QA

Delegar apenas tarefas mecanicas, como:

- localizar arquivos de teste correspondentes
- listar funcoes novas sem testes obvios
- mapear sinais repetitivos de imports proibidos, logs ou secrets
- levantar arquivos alterados sem cobertura aparente

## Guardrails

- Nao depender de MCP externo.
- Nao sobrescrever arquivos sem confirmacao do usuario.
- Nao inventar informacoes sobre criterios de aceite; usar apenas o que encontrar no Jira.
- Nao gerar testes sem analisar primeiro a cobertura existente.
- Nao pular a analise de seguranca mesmo quando a feature e pequena.
- Nao delegar a conclusao final de QA nem a classificacao dos blockers.
