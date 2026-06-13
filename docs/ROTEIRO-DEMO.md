# Roteiro de Demonstração — Postman + Breakpoints

Para **cada cenário** do sistema: o **método + URL completa**, o **JSON pronto** para colar no Postman e **onde colocar o breakpoint** para vê-lo disparar quando a requisição chega.

> **Base da API:** `http://localhost:8080`
> Caminhos de breakpoint a partir de `backend/src/main/java/com/financas`.

---

## Antes de começar

1. Rode o backend em modo **Debug** (na classe `FinancasApplication`).
2. No Postman, para rotas **protegidas**, adicione o header:
   `Authorization: Bearer SEU_TOKEN` (o token vem do registro/login).
3. Para corpos JSON, no Postman use a aba **Body → raw → JSON**.

### ⭐ Breakpoint que vale deixar SEMPRE ligado
`security/JwtAuthenticationFilter.java` — **linha 42** (`jwtService.tokenValido(token)`).
Toda requisição a uma rota protegida para aqui primeiro. É a prova visual de que o token é checado **antes** de qualquer controller. Faça **Step Into** para entrar na validação (assinatura + expiração).

---

## 1. Health check (público) — testar se a API está no ar

```
GET  http://localhost:8080/api/health
```
Sem corpo, sem token. **Breakpoint:** não precisa (rota pública e simples).

---

## 2. Criar conta (registro)

```
POST  http://localhost:8080/api/v1/auth/registro
```
**Body (JSON):**
```json
{
  "nome": "Maria Teste",
  "email": "maria@teste.com",
  "senha": "123456",
  "rendaMensal": 3000.00
}
```
**Breakpoint:** `service/AuthService.java`
- **linha 42** — `existsByEmail(...)`: verifica e-mail duplicado.
- **linha 49** — `passwordEncoder.encode(dados.senha())`: **a senha virando hash bcrypt**. Inspecione o valor de retorno (`$2a$10$...`) e compare com `dados.senha()` (texto puro). 👉 *Para mostrar o salt: cadastre dois usuários com a mesma senha e veja que os hashes saem diferentes.*
- **linha 52** — `save(usuario)`: grava no banco (com o hash).
- **linha 57** — `montarResposta(...)`: aqui o token é gerado.

Resposta esperada: **201 Created** com `accessToken`.

---

## 3. Login

```
POST  http://localhost:8080/api/v1/auth/login
```
**Body (JSON):**
```json
{
  "email": "maria@teste.com",
  "senha": "123456"
}
```
**Breakpoint:** `service/AuthService.java`
- **linha 63** — `authenticationManager.authenticate(...)`: faça **Step Into** para mostrar que é aqui que o Spring compara a senha digitada com o hash (bcrypt `matches`). Senha errada → `BadCredentialsException` → **401**.
- **linha 73** (`montarResposta`) → entra em `JwtService.gerarToken` (ver cenário 12).

Resposta esperada: **200 OK** com `accessToken`. **Copie esse token** para as próximas requisições.

---

## 4. Ver perfil (protegido) — prova do filtro de token

```
GET  http://localhost:8080/api/v1/usuarios/perfil
Header:  Authorization: Bearer SEU_TOKEN
```
Sem corpo. **Breakpoint:**
- `security/JwtAuthenticationFilter.java` **linha 42, 45, 46, 51** — token validado, e-mail extraído, usuário carregado, autenticação registrada.
- `service/UsuarioService.java` **linha 35-36** — `getLogado()` lê o e-mail do `SecurityContext` (preenchido pelo filtro), não do corpo.

Resposta esperada: **200 OK** com os dados do usuário.

---

## 5. Editar perfil / alterar renda mensal

```
PUT  http://localhost:8080/api/v1/usuarios/perfil
Header:  Authorization: Bearer SEU_TOKEN
```
**Body (JSON):**
```json
{
  "nome": "Maria Teste",
  "rendaMensal": 3500.00
}
```
**Breakpoint:** `service/UsuarioService.java`
- **linha 44** — `getLogado()`: usuário do token.
- **linha 45-46** — `setNome(...)` / `setRendaMensal(...)`: os novos valores.
- **linha 47** — `save(usuario)`: persiste.
- **linha 48** — `rendaMensalJobs.executarParaUsuario(...)`: faça **Step Into** para mostrar que a receita "Salário" do mês é (re)lançada/atualizada — por isso o dashboard muda na hora.

Resposta esperada: **200 OK**.

---

## 6. Trocar a senha

```
PUT  http://localhost:8080/api/v1/usuarios/senha
Header:  Authorization: Bearer SEU_TOKEN
```
**Body (JSON):**
```json
{
  "senhaAtual": "123456",
  "novaSenha": "novaSenha789"
}
```
**Breakpoint:** `service/UsuarioService.java`
- **linha 57** — `passwordEncoder.matches(senhaAtual, senhaHash)`: confere a senha atual (bcrypt reaplica o salt). Senha errada → **400**, sem trocar nada.
- **linha 61** — `encode(novaSenha)`: a nova senha vira um **novo hash** (com salt novo).

Resposta esperada: **204 No Content**.

---

## 7. Listar categorias (protegido)

```
GET  http://localhost:8080/api/v1/categorias
Header:  Authorization: Bearer SEU_TOKEN
```
Filtro opcional por tipo:
```
GET  http://localhost:8080/api/v1/categorias?tipo=DESPESA
```
**Breakpoint:** `service/CategoriaService.java` no método `listar` (mostra que a busca é amarrada ao `usuarioId`).

Resposta: **200 OK** com a lista (já vem com as categorias padrão criadas no registro). 👉 *Anote o `id` de uma categoria para usar nas transações.*

---

## 8. Criar categoria

```
POST  http://localhost:8080/api/v1/categorias
Header:  Authorization: Bearer SEU_TOKEN
```
**Body (JSON):**
```json
{
  "nome": "Educação",
  "icone": "book",
  "cor": "#2563EB",
  "tipo": "DESPESA",
  "orcamento": 500.00,
  "descricao": "Cursos e livros"
}
```
> `tipo` deve ser **`RECEITA`** ou **`DESPESA`**.

**Breakpoint:** `service/CategoriaService.java`
- **linha 44** — `getLogado()`: dono da categoria.
- **linha 45** — `existsByNomeAndUsuarioId(...)`: regra de nome único **por usuário**.
- **linha 59** — `save(categoria)`: persiste.

Resposta esperada: **201 Created**.

---

## 9. Editar categoria

```
PUT  http://localhost:8080/api/v1/categorias/{id}
Header:  Authorization: Bearer SEU_TOKEN
```
Troque `{id}` pelo id de uma categoria sua. **Body (JSON):**
```json
{
  "nome": "Educação e Cursos",
  "icone": "book",
  "cor": "#1D4ED8",
  "tipo": "DESPESA",
  "orcamento": 800.00,
  "descricao": "Atualizada"
}
```
**Breakpoint:** `service/CategoriaService.java` método `atualizar` (linha 63) — `buscarEntidade(id)` garante que a categoria é do usuário logado.

Resposta: **200 OK**.

---

## 10. Excluir categoria

```
DELETE  http://localhost:8080/api/v1/categorias/{id}
Header:  Authorization: Bearer SEU_TOKEN
```
Sem corpo. **Breakpoint:** `service/CategoriaService.java` método `excluir` — na verificação `existsByCategoriaId(id)`: se a categoria tiver transações, lança erro **409** (não deixa excluir). 👉 *Bom para mostrar integridade dos dados.*

Resposta: **204 No Content** (ou **409** se houver transações).

---

## 11. Listar transações (protegido, paginado)

```
GET  http://localhost:8080/api/v1/transacoes?page=0&size=20
Header:  Authorization: Bearer SEU_TOKEN
```
**Breakpoint:** `service/TransacaoService.java` método `listar` — `findByUsuarioId(usuarioId, pageable)`: só as transações do usuário.

Resposta: **200 OK** com página de transações.

---

## 12. Cadastrar um gasto (transação)

```
POST  http://localhost:8080/api/v1/transacoes
Header:  Authorization: Bearer SEU_TOKEN
```
**Body (JSON):** (troque `categoriaId` por um id real vindo do cenário 7)
```json
{
  "tipo": "DESPESA",
  "valor": 89.90,
  "descricao": "Mercado",
  "dataTransacao": "2026-06-12",
  "categoriaId": "COLE_AQUI_O_ID_DA_CATEGORIA"
}
```
Exemplo de **receita**:
```json
{
  "tipo": "RECEITA",
  "valor": 1500.00,
  "descricao": "Freelance",
  "dataTransacao": "2026-06-10",
  "categoriaId": "COLE_AQUI_O_ID_DA_CATEGORIA"
}
```
**Breakpoint:** `service/TransacaoService.java`
- **linha 45** — `getLogado()`: o dono vem do **token**, não do corpo.
- **linha 46** — `buscarCategoria(categoriaId, usuario.getId())`: **isolamento** — a categoria é validada contra o usuário logado (categoria de outro → 404).
- **linha 57** — `save(transacao)`: persiste.

Resposta esperada: **201 Created**.

---

## 13. Editar transação

```
PUT  http://localhost:8080/api/v1/transacoes/{id}
Header:  Authorization: Bearer SEU_TOKEN
```
**Body (JSON):**
```json
{
  "tipo": "DESPESA",
  "valor": 99.90,
  "descricao": "Mercado (corrigido)",
  "dataTransacao": "2026-06-12",
  "categoriaId": "COLE_AQUI_O_ID_DA_CATEGORIA"
}
```
**Breakpoint:** `service/TransacaoService.java` método `atualizar` (linha 61) — `buscarEntidade(id)` confere que a transação é do usuário.

Resposta: **200 OK**.

---

## 14. Excluir transação

```
DELETE  http://localhost:8080/api/v1/transacoes/{id}
Header:  Authorization: Bearer SEU_TOKEN
```
Sem corpo. **Breakpoint:** `service/TransacaoService.java` método `excluir` — `buscarEntidade(id)` (isolamento por usuário) antes do `delete`.

Resposta: **204 No Content**.

---

## 15. Dashboard (resumo do mês)

```
GET  http://localhost:8080/api/v1/dashboard?periodo=2026-06
Header:  Authorization: Bearer SEU_TOKEN
```
Sem `periodo`, usa o mês atual. **Breakpoint:** `service/DashboardService.java` método `gerar` — mostre as três consultas (`findByUsuarioIdAndDataTransacaoBetween`): mês atual, histórico (saldo) e 6 meses (fluxo). Bom para explicar que **o dashboard é calculado, não armazenado**.

Resposta: **200 OK** com saldo, receitas/despesas, gastos por categoria e fluxo de caixa.

---

## 16. Renda mensal — status

```
GET  http://localhost:8080/api/renda-mensal/status
Header:  Authorization: Bearer SEU_TOKEN
```
Sem corpo. **Breakpoint:** `controller/RendaMensalController.java` método `getStatus` — mostra se já lançou no mês e calcula o próximo 5º dia útil.

Resposta: **200 OK** com `lancadoEsteMes`, `proximoLancamento`, etc.

---

## 17. Renda mensal — executar manualmente

```
POST  http://localhost:8080/api/renda-mensal/executar
Header:  Authorization: Bearer SEU_TOKEN
```
Sem corpo (ou `?data=2026-06-13` para simular uma data). **Breakpoint:** `jobs/RendaMensalJobs.java`
- método `executarParaUsuario` — checa se a renda é > 0.
- método `processarUsuario` — decide entre **criar** ou **atualizar** o lançamento (um por mês, via registro). 👉 *Mostra a regra de não duplicar o salário no mês.*

Resposta: **200 OK** com a mensagem do resultado.

---

## 18. ⛔ Requisição SEM token (prova de segurança)

```
GET  http://localhost:8080/api/v1/transacoes
```
**Sem** o header `Authorization`. **Breakpoint:** `security/JwtAuthenticationFilter.java` **linha 39** — o `if` do header é **falso** (não há "Bearer "), então o filtro **não autentica** e a requisição é barrada.

Resposta esperada: **401 Unauthorized** (não autenticado). 👉 *Este é o teste mais importante para o professor de segurança.*

**Variação:** mande um token adulterado (`Authorization: Bearer abc.def.ghi`) e pare na **linha 42** para ver `tokenValido` retornar **false**.

---

## Tabela-resumo (todos os cenários)

| # | Método | URL | Auth | Breakpoint principal |
|---|--------|-----|------|----------------------|
| 1 | GET | `/api/health` | não | — |
| 2 | POST | `/api/v1/auth/registro` | não | AuthService:49 (hash) |
| 3 | POST | `/api/v1/auth/login` | não | AuthService:63 (matches) |
| 4 | GET | `/api/v1/usuarios/perfil` | sim | JwtAuthenticationFilter:42 |
| 5 | PUT | `/api/v1/usuarios/perfil` | sim | UsuarioService:48 (renda) |
| 6 | PUT | `/api/v1/usuarios/senha` | sim | UsuarioService:57 (matches) |
| 7 | GET | `/api/v1/categorias` | sim | CategoriaService.listar |
| 8 | POST | `/api/v1/categorias` | sim | CategoriaService:45 |
| 9 | PUT | `/api/v1/categorias/{id}` | sim | CategoriaService:63 |
| 10 | DELETE | `/api/v1/categorias/{id}` | sim | CategoriaService.excluir |
| 11 | GET | `/api/v1/transacoes` | sim | TransacaoService.listar |
| 12 | POST | `/api/v1/transacoes` | sim | TransacaoService:46 (isolamento) |
| 13 | PUT | `/api/v1/transacoes/{id}` | sim | TransacaoService:61 |
| 14 | DELETE | `/api/v1/transacoes/{id}` | sim | TransacaoService.excluir |
| 15 | GET | `/api/v1/dashboard` | sim | DashboardService.gerar |
| 16 | GET | `/api/renda-mensal/status` | sim | RendaMensalController.getStatus |
| 17 | POST | `/api/renda-mensal/executar` | sim | RendaMensalJobs.processarUsuario |
| 18 | GET | `/api/v1/transacoes` (sem token) | — | JwtAuthenticationFilter:39 → 401 |
