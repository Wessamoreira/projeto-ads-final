# Testes Automatizados (JUnit)

O projeto tem testes automatizados que provam, sem intervenção manual, que a segurança e o fluxo principal funcionam. São de dois tipos: **unitário** e **integração**.

## Como rodar

```bash
cd backend
mvn test
```

Os testes usam um banco **H2 em memória** (configurado em `backend/src/test/resources/application.properties`), então **não é preciso ter o PostgreSQL rodando**. Ao final, o Maven mostra algo como:

```
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## O que cada teste prova

### 1. Teste UNITÁRIO — `JwtServiceTest`
Arquivo: `backend/src/test/java/com/financas/security/JwtServiceTest.java`

Testa o `JwtService` isolado (sem subir o Spring, sem banco). Casos:

| Teste | O que garante |
|-------|---------------|
| `gerarToken_eExtrairEmail` | O e-mail colocado no token é o mesmo que se lê de volta. |
| `tokenRecemCriado_eValido` | Token dentro da validade é aceito. |
| `tokenExpirado_eInvalido` | Token vencido é rejeitado. |
| `tokenComOutraChave_eInvalido` | Token assinado com **outra chave** é rejeitado (anti-falsificação). |
| `textoQualquer_naoEValido` | Texto que não é um JWT é tratado como inválido, sem quebrar. |

> O caso `tokenComOutraChave_eInvalido` é ótimo para a banca de segurança: prova na prática que, sem a chave secreta, **não dá para forjar um token válido**.

### 2. Teste de INTEGRAÇÃO — `AuthFlowIntegrationTest`
Arquivo: `backend/src/test/java/com/financas/integracao/AuthFlowIntegrationTest.java`

Sobe a aplicação inteira (com H2) e exercita o caminho real via `MockMvc`. Casos:

| Teste | O que garante |
|-------|---------------|
| `fluxoCompletoDeAutenticacao` | Registrar (201) → Login (200, devolve token) → acessar `/usuarios/perfil` **com** token (200) → **sem** token (**401**). |
| `loginComSenhaErrada_eRejeitado` | Login com senha errada devolve **401**. |
| `registroComEmailDuplicado_eRejeitado` | Cadastrar e-mail repetido devolve **409**. |

## Tipos de teste — a diferença (para explicar na banca)

| | Unitário | Integração |
|--|----------|------------|
| **Escopo** | Uma classe isolada (`JwtService`). | Várias camadas juntas (Controller → Service → Repository → Banco). |
| **Sobe o Spring?** | Não. | Sim (`@SpringBootTest`). |
| **Usa banco?** | Não. | Sim (H2 em memória). |
| **Velocidade** | Muito rápido. | Mais lento (sobe o contexto). |
| **Prova** | A lógica de uma peça. | Que as peças funcionam **juntas**. |

## Nota técnica: por que 401 e não 403

Durante a escrita dos testes, identificamos que o Spring Security, por padrão, devolvia **403 (Forbidden)** para requisições **sem token** em rotas protegidas. O correto, segundo o HTTP, é:

- **401 Unauthorized** → não autenticado (sem token / token inválido);
- **403 Forbidden** → autenticado, mas sem permissão.

Ajustamos o `SecurityConfig` para devolver **401** quando não há autenticação (via `authenticationEntryPoint`). Isso, além de semanticamente correto, **alinha o backend com o frontend**, cujo interceptor do Axios trata o 401 para redirecionar ao login quando o token expira. O teste `fluxoCompletoDeAutenticacao` trava esse comportamento (se alguém quebrar, o teste falha).
