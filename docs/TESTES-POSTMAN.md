# Guia de Testes da API (Postman / curl)

Como testar a API manualmente na apresentação, mostrando autenticação, CRUD e o bloqueio de quem não tem token.

## Importar a coleção no Postman

1. Abra o Postman → **Import**.
2. Selecione `docs/postman/ControleFinanceiro.postman_collection.json`.
3. A coleção já vem com a variável `baseUrl = http://localhost:8080`.
4. Rode na ordem numerada. Os scripts de teste **salvam o token automaticamente** na variável `{{token}}` após o registro/login — as demais requisições já o usam.

## Ordem recomendada (roteiro de demonstração)

| # | Requisição | Espera-se | Mostra |
|---|-----------|-----------|--------|
| 0 | GET `/api/health` | 200 | API no ar (rota pública). |
| 1 | POST `/api/v1/auth/registro` | 201 + token | Criação de conta; token salvo. |
| 2 | POST `/api/v1/auth/login` | 200 + token | Autenticação; token salvo. |
| 3 | GET `/api/v1/usuarios/perfil` | 200 | Token funcionando (rota protegida). |
| 4 | GET `/api/v1/categorias` | 200 + lista | Categorias padrão criadas no registro. |
| 5 | POST `/api/v1/categorias` | 201 | Criar categoria. |
| 6 | POST `/api/v1/transacoes` | 201 | Lançar um gasto. |
| 7 | GET `/api/v1/transacoes?page=0&size=20` | 200 | Listagem paginada. |
| 8 | GET `/api/v1/dashboard?periodo=2026-06` | 200 | Resumo financeiro calculado. |
| 9 | PUT `/api/v1/usuarios/perfil` | 200 | Alterar renda mensal. |
| 10 | GET `/api/v1/transacoes` **sem** token | **401** | Prova de que a rota é protegida. |

> A requisição **10** é a mais importante para o professor de segurança: ela mostra que, sem o cabeçalho `Authorization`, o `JwtAuthenticationFilter` não autentica e o Spring Security responde **401**.

## Tabela completa de endpoints

| Método | Rota | Auth | Corpo (exemplo) |
|--------|------|------|-----------------|
| GET | `/api/health` | não | — |
| POST | `/api/v1/auth/registro` | não | `{ nome, email, senha, rendaMensal? }` |
| POST | `/api/v1/auth/login` | não | `{ email, senha }` |
| GET | `/api/v1/usuarios/perfil` | sim | — |
| PUT | `/api/v1/usuarios/perfil` | sim | `{ nome, rendaMensal }` |
| PUT | `/api/v1/usuarios/senha` | sim | `{ senhaAtual, novaSenha }` |
| GET | `/api/v1/categorias?tipo=` | sim | — |
| POST | `/api/v1/categorias` | sim | `{ nome, icone, cor, tipo, orcamento?, descricao? }` |
| PUT | `/api/v1/categorias/{id}` | sim | igual ao POST |
| DELETE | `/api/v1/categorias/{id}` | sim | — |
| GET | `/api/v1/transacoes?page=&size=` | sim | — |
| POST | `/api/v1/transacoes` | sim | `{ tipo, valor, descricao, dataTransacao, categoriaId }` |
| PUT | `/api/v1/transacoes/{id}` | sim | igual ao POST |
| DELETE | `/api/v1/transacoes/{id}` | sim | — |
| GET | `/api/v1/dashboard?periodo=yyyy-MM` | sim | — |

## Testando por linha de comando (curl)

Caso prefira o terminal:

```bash
# 1) Login e captura do token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@teste.com","senha":"123456"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

echo "Token: $TOKEN"

# 2) Rota protegida usando o token
curl -s http://localhost:8080/api/v1/usuarios/perfil \
  -H "Authorization: Bearer $TOKEN"

# 3) Criar um gasto (troque o categoriaId por um id real vindo de /categorias)
curl -s -X POST http://localhost:8080/api/v1/transacoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tipo":"DESPESA","valor":89.90,"descricao":"Mercado","dataTransacao":"2026-06-12","categoriaId":"COLE_AQUI"}'

# 4) Prova de bloqueio: sem token deve responder 401
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080/api/v1/transacoes
```

## Alternativa: Swagger UI

A API também expõe documentação interativa (já testável no navegador) em:

```
http://localhost:8080/swagger-ui.html
```

No Swagger, use o botão **Authorize** e cole `Bearer <token>` para testar as rotas protegidas direto pela tela.
