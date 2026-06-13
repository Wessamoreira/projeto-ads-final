# Guia de Breakpoints — Demonstração ao Vivo

Roteiro para depurar (*debug*) o backend na frente da banca e mostrar o sistema funcionando "por dentro". Para cada cenário há **onde** colocar o breakpoint, **o que** inspecionar e **o que dizer**.

> Caminhos a partir de `backend/src/main/java/com/financas`.

---

## Como iniciar o modo debug

**IntelliJ IDEA / VS Code:**
1. Abra a classe `FinancasApplication`.
2. Rode em modo **Debug** (ícone do inseto / `Run > Debug`), em vez de Run normal.
3. Coloque os breakpoints clicando na margem esquerda (na linha indicada).
4. Faça a ação no frontend (ou no Postman) e a execução vai **parar** no breakpoint.
5. Use **Step Over (F8)** para avançar linha a linha e **Resume (F9)** para continuar.

**Dica:** mantenha aberta a aba *Variables* (ou *Debugger*) para mostrar os valores em tempo real (e-mail, token, hash da senha etc.).

---

## Cenário 0 — A "espinha dorsal": toda requisição passa pelo filtro

Este é o breakpoint mais importante para o professor de segurança. Mostra que **toda** chamada protegida passa pela validação do token **antes** de chegar ao controller.

**Breakpoint:** `security/JwtAuthenticationFilter.java`

| Linha | O que mostrar |
|-------|---------------|
| **37** | `request.getHeader("Authorization")` — o token chegando no header. |
| **42** | `jwtService.tokenValido(token)` — entre aqui (Step Into) para mostrar a checagem de assinatura + expiração. |
| **45** | `jwtService.extrairEmail(token)` — o e-mail é lido de dentro do token. |
| **46** | `loadUserByUsername(email)` — o usuário é carregado do banco. |
| **51** | `setAuthentication(auth)` — a partir daqui o usuário está autenticado para esta requisição. |

**O que dizer:** *"Cada requisição a uma rota protegida para aqui primeiro. Se o token for inválido ou expirado, `tokenValido` devolve false, não autenticamos, e o Spring Security responde 401. Repare que o servidor não guarda sessão — a identidade vem inteira do token."*

**Demonstração extra:** edite o token no Postman (troque um caractere) e refaça a requisição → mostre `tokenValido` retornando **false**.

---

## Cenário 1 — Criar uma conta nova (registro)

**Fluxo:** `AuthController.registrar` → `AuthService.registrar`

**Breakpoints:** `service/AuthService.java`

| Linha | O que mostrar |
|-------|---------------|
| **42** | `existsByEmail(...)` — verificação de e-mail duplicado. |
| **49** | `passwordEncoder.encode(dados.senha())` — **a senha virando hash bcrypt**. Inspecione o retorno: começa com `$2a$10$...`. Compare com `dados.senha()` (texto puro que entrou). |
| **52** | `save(usuario)` — o usuário é persistido (com o hash, nunca a senha pura). |
| **54** | `criarCategoriasPadrao(usuario)` — as 6 categorias iniciais. |
| **55** | `executarParaUsuario(...)` — já lança a renda do mês, se houver. |
| **57** | `montarResposta(usuario)` — entra no `gerarToken` (Cenário 4). |

**O que dizer:** *"No cadastro, a senha digitada é transformada em hash bcrypt na linha 49. O que vai para o banco é o hash com salt embutido — a senha original é descartada. Em seguida já criamos categorias padrão e devolvemos um token, então o usuário entra logado."*

**Demonstração de salt:** cadastre **dois** usuários com a mesma senha e mostre, parando na linha 49, que os hashes gerados são **diferentes**.

---

## Cenário 2 — Cadastrar um gasto (transação)

**Fluxo:** filtro JWT (Cenário 0) → `TransacaoController.criar` → `TransacaoService.criar`

**Breakpoints:** `service/TransacaoService.java`

| Linha | O que mostrar |
|-------|---------------|
| **45** | `usuarioService.getLogado()` — entre aqui para mostrar que o usuário vem do `SecurityContext` (preenchido pelo filtro), não do corpo da requisição. |
| **46** | `buscarCategoria(dados.categoriaId(), usuario.getId())` — **isolamento**: a categoria é buscada amarrada ao `usuarioId`. Se não for dele, dá 404. |
| **48-55** | Montagem da entidade `Transacao` (tipo, valor, descrição, data). |
| **57** | `transacaoRepository.save(transacao)` — grava no banco e devolve o DTO. |

**O que dizer:** *"Quem é o dono do gasto não vem do front — vem do token, via `getLogado()`. E a categoria é validada contra o usuário logado, então ninguém lança gasto em categoria de outra pessoa."*

---

## Cenário 3 — Criar uma categoria

**Fluxo:** filtro JWT → `CategoriaController.criar` → `CategoriaService.criar`

**Breakpoints:** `service/CategoriaService.java`

| Linha | O que mostrar |
|-------|---------------|
| **44** | `usuarioService.getLogado()` — o dono da categoria. |
| **45** | `existsByNomeAndUsuarioId(...)` — regra: não pode repetir nome **para aquele usuário**. |
| **49-57** | Montagem da `Categoria` (nome, ícone, cor, tipo, orçamento). |
| **59** | `categoriaRepository.save(categoria)` — persiste. |

**O que dizer:** *"A unicidade do nome é por usuário: dois usuários diferentes podem ter, cada um, a categoria 'Alimentação'. A verificação na linha 45 usa o id do usuário logado."*

---

## Cenário 4 — Onde o token é criado (após login ou registro)

**Breakpoints:** `security/JwtService.java`

| Linha | O que mostrar |
|-------|---------------|
| **34-35** | `agora` e `expira` — a janela de validade (24h). |
| **36-41** | A construção do JWT: `subject(email)`, `expiration`, `signWith(chave)`. |
| **40** | `signWith(chave)` — **a assinatura HMAC-SHA**. Explique que sem a chave secreta ninguém forja um token válido. |

**Para o login**, coloque também: `service/AuthService.java:63` (`authenticationManager.authenticate(...)`). Faça **Step Into** para mostrar que é aí que o Spring compara a senha digitada com o hash (bcrypt `matches`).

**O que dizer:** *"O token nasce aqui, no `gerarToken`. Ele carrega só o e-mail e a expiração, e é assinado com nossa chave secreta na linha 40. O conteúdo é público, mas a assinatura impede adulteração."*

---

## Cenário 5 — Alterar a renda mensal no perfil

**Fluxo:** filtro JWT → `UsuarioController.atualizarPerfil` → `UsuarioService.atualizarPerfil`

**Breakpoints:** `service/UsuarioService.java`

| Linha | O que mostrar |
|-------|---------------|
| **44** | `getLogado()` — pega o usuário do token. |
| **45-46** | `setNome(...)` e `setRendaMensal(...)` — os novos valores chegando. |
| **47** | `save(usuario)` — persiste a nova renda. |
| **48** | `rendaMensalJobs.executarParaUsuario(usuario, hoje)` — **entre aqui (Step Into)** para mostrar o efeito colateral: a renda do mês é (re)lançada/atualizada como receita, e o dashboard muda na hora. |

**O que dizer:** *"Quando salvo a renda, além de gravar no perfil, disparo a rotina de renda mensal na linha 48. Ela atualiza a receita 'Salário' do mês corrente — por isso o dashboard reflete a mudança imediatamente, sem esperar o dia 5."*

**Aprofundar (opcional):** breakpoint em `jobs/RendaMensalJobs.executarParaUsuario` e em `processarUsuario` para mostrar a checagem de duplicidade (um lançamento por usuário/mês).

---

## Bônus — Trocar a senha (mostra o `matches`)

**Breakpoint:** `service/UsuarioService.java:57`

```java
if (!passwordEncoder.matches(dados.senhaAtual(), usuario.getSenhaHash())) {
```

Mostre que, para trocar a senha, o sistema **confere a senha atual** com `matches` (bcrypt reaplica o salt do hash guardado). Senha atual errada → exceção e **400**, sem trocar nada. Na linha 61, a nova senha vira um **novo hash** (com salt novo).

---

## Tabela-resumo dos breakpoints

| Cenário | Arquivo | Linha(s) | Conceito demonstrado |
|---------|---------|----------|----------------------|
| Toda requisição | `JwtAuthenticationFilter` | 37, 42, 45, 46, 51 | Validação de token / autenticação stateless |
| Registro | `AuthService` | 42, 49, 52, 57 | Hash da senha + criação da conta |
| Gasto | `TransacaoService` | 45, 46, 57 | Isolamento por usuário |
| Categoria | `CategoriaService` | 44, 45, 59 | Unicidade por usuário |
| Criação do token | `JwtService` | 34, 40 | Assinatura HMAC / expiração |
| Login (senha) | `AuthService` | 63 | Comparação bcrypt (`matches`) |
| Renda mensal | `UsuarioService` | 44, 47, 48 | Efeito colateral / job |
| Troca de senha | `UsuarioService` | 57, 61 | `matches` + novo hash |
