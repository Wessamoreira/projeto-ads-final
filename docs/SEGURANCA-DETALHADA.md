# Segurança — Documento Técnico Detalhado

Documento aprofundado da camada de segurança do **Controle Financeiro**, preparado para defesa diante de banca especializada. Cada mecanismo é descrito com o **arquivo**, o **método**, o **algoritmo** e o **porquê** da decisão.

> Todos os caminhos abaixo partem de `backend/src/main/java/com/financas`.

---

## 1. Panorama: o que protege o quê

| Camada | Componente | Protege contra |
|--------|-----------|----------------|
| Armazenamento de senha | `BCryptPasswordEncoder` | Vazamento de senhas se o banco for comprometido. |
| Autenticação | `AuthenticationManager` + `UsuarioDetailsService` | Login com credenciais inválidas. |
| Emissão de identidade | `JwtService.gerarToken` | Necessidade de re-enviar senha a cada requisição. |
| Verificação por requisição | `JwtAuthenticationFilter` | Acesso sem token / com token forjado ou expirado. |
| Autorização | `SecurityConfig` (filter chain) | Acesso a endpoints protegidos sem autenticação. |
| Isolamento de dados | Consultas `...AndUsuarioId(...)` | Um usuário acessar dados de outro (IDOR). |
| Transporte | CORS + (HTTPS em produção) | Origem não autorizada; interceptação. |

---

## 2. Senha: hash, salt e algoritmo

### 2.1 Onde o hash é gerado

Arquivo: `config/SecurityConfig.java`

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

Esse bean é injetado em quem precisa lidar com senha:
- `AuthService.registrar` → `passwordEncoder.encode(dados.senha())` (linha 49) — ao criar a conta.
- `UsuarioService.alterarSenha` → `passwordEncoder.encode(dados.novaSenha())` (linha 61) — ao trocar a senha.
- `UsuarioService.alterarSenha` → `passwordEncoder.matches(...)` (linha 57) — confere a senha atual.

### 2.2 Algoritmo: bcrypt

A senha **nunca** é guardada em texto puro. Usamos **bcrypt**, um algoritmo de hash projetado especificamente para senhas (família *Blowfish*). Características:

- **Função de mão única (one-way):** dado o hash, não há como voltar à senha original.
- **Lento de propósito (key stretching):** aplica um **fator de custo** (padrão **10** → 2¹⁰ = 1024 iterações). Isso torna a força bruta cara, mesmo com GPU.
- **Salt embutido e automático:** ver abaixo.

### 2.3 Onde o salt entra — "o valor aleatório na frente do hash"

**Você não chama o salt manualmente — o bcrypt gera e gerencia.** A cada `encode(...)`, o bcrypt:

1. Sorteia um **salt aleatório de 16 bytes** (via `SecureRandom`).
2. Combina salt + senha e roda as 1024 iterações.
3. **Grava o salt dentro da própria string do hash**, logo "na frente" do resultado.

Formato armazenado na coluna `usuario.senha_hash`:

```
$2a$10$Q9mZ3kP1nW8vY2cR4tU6e8XyZ...restante
└┬┘ └┬┘ └──────────┬──────────┘└────┬────┘
 │   │             │                 │
 │   │             │                 └─ hash final (31 chars)
 │   │             └─ SALT aleatório (22 chars Base64)  ← "o valor da frente"
 │   └─ fator de custo = 10
 └─ versão do algoritmo (bcrypt, $2a$)
```

**Por isso o hash muda toda vez:** se você cadastrar dois usuários com a senha `123456`, os hashes serão **diferentes**, porque o salt é diferente em cada um. Demonstre isso na banca cadastrando dois usuários com a mesma senha e olhando a tabela `usuario`.

**Salt × Pepper:**
- **Salt (presente):** aleatório, **único por senha**, guardado junto ao hash. Derrota *rainbow tables* e esconde senhas iguais.
- **Pepper (ausente nesta versão):** seria um segredo **global** somado à senha antes do hash, guardado **fora** do banco (ex.: variável de ambiente). É uma melhoria possível — citar como trabalho futuro.

### 2.4 Como o sistema confere se a senha está correta

No bcrypt **não se descriptografa**. A verificação reaplica o mesmo processo:

1. `matches(senhaDigitada, hashGuardado)` lê o **salt** e o **custo** de dentro do `hashGuardado`.
2. Reprocessa a `senhaDigitada` com esse mesmo salt/custo.
3. Compara o resultado com o hash guardado. Igual → senha correta.

No **login**, isso acontece dentro do `AuthenticationManager` (Spring Security), que usa o `UsuarioDetailsService` para carregar o hash e o `BCryptPasswordEncoder` para comparar — ver seção 4.

---

## 3. Token JWT: o que é, onde nasce, o que carrega

Arquivo: `security/JwtService.java`

### 3.1 O que é um JWT

Um **JSON Web Token** tem três partes separadas por ponto: `header.payload.signature`.

- **Header:** algoritmo da assinatura (aqui, **HS256** = HMAC-SHA256).
- **Payload (claims):** dados não secretos. No nosso caso: `sub` (e-mail), `iat` (emitido em), `exp` (expira em).
- **Signature:** HMAC-SHA256 de `header.payload` usando a **chave secreta** do servidor.

> O payload **não é criptografado**, só assinado. Por isso **não guardamos senha nem dados sensíveis** ali — apenas o e-mail. A assinatura garante **integridade** (ninguém altera o conteúdo sem invalidar o token), não sigilo.

### 3.2 Onde o token é criado

`JwtService.gerarToken(String email)` — linhas 33-42:

```java
public String gerarToken(String email) {
    Date agora = new Date();
    Date expira = new Date(agora.getTime() + expiracaoMs);  // +24h
    return Jwts.builder()
            .subject(email)          // sub = e-mail do usuário
            .issuedAt(agora)         // iat
            .expiration(expira)      // exp
            .signWith(chave)         // assina com HMAC-SHA (HS256)
            .compact();
}
```

Quem chama: `AuthService.montarResposta` (linha 73), tanto no **registro** quanto no **login**. O token volta no corpo da resposta (`AuthResponse.accessToken`).

### 3.3 A chave secreta e o algoritmo

Construtor do `JwtService` (linhas 25-30):

```java
this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
```

- `secret` vem de `app.jwt.secret` (variável `JWT_SECRET`, com fallback só para desenvolvimento).
- `Keys.hmacShaKeyFor(...)` cria uma chave **HMAC-SHA**. Como a chave do nosso secret tem ≥ 256 bits, a biblioteca (JJWT) assina em **HS256**.
- **HMAC** = *Hash-based Message Authentication Code*: combina a mensagem com a chave secreta e aplica SHA-256. Só quem tem a chave consegue gerar/validar a assinatura.

### 3.4 Validade

`app.jwt.expiration=86400000` ms = **24 horas**. Não há *refresh token*: ao expirar, o usuário faz login de novo. (Trade-off consciente: simplicidade × conveniência.)

---

## 4. Fluxo de LOGIN (passo a passo, com algoritmos)

Arquivos: `controller/AuthController.java` → `service/AuthService.java`

```
POST /api/v1/auth/login   { email, senha }
        │
        ▼
AuthController.login(dados)                         AuthController.java
        │
        ▼
AuthService.login(dados)                            AuthService.java:61
        │
        ├─► authenticationManager.authenticate(            linha 63
        │       new UsernamePasswordAuthenticationToken(email, senha))
        │        │
        │        ├─ chama UsuarioDetailsService.loadUserByUsername(email)
        │        │     → carrega Usuario e devolve User(email, senhaHash, [])   UsuarioDetailsService.java:25
        │        │
        │        └─ DaoAuthenticationProvider usa BCryptPasswordEncoder.matches(
        │              senhaDigitada, senhaHash)
        │              • senha errada → lança BadCredentialsException
        │
        ├─► (se passou) usuarioRepository.findByEmail(email)            linha 66
        │
        └─► montarResposta(usuario) → jwtService.gerarToken(email)      linha 73
                 │
                 ▼
            AuthResponse { accessToken, tokenType="Bearer", expiresIn, usuario }
```

**Senha errada:** o `AuthenticationManager` lança `BadCredentialsException`, capturada pelo `GlobalExceptionHandler` (linha 29-31), que devolve **HTTP 401** com a mensagem genérica *"E-mail ou senha inválidos"* (mensagem genérica de propósito, para não revelar se o e-mail existe).

---

## 5. Fluxo de toda REQUISIÇÃO autenticada (o "filter chain")

Arquivos: `config/SecurityConfig.java` + `security/JwtAuthenticationFilter.java`

### 5.1 Configuração do filtro (quem é público × protegido)

`SecurityConfig.securityFilterChain` define:

- **Stateless:** `SessionCreationPolicy.STATELESS` — o servidor **não guarda sessão**; cada requisição se identifica sozinha pelo token.
- **Públicos:** `/api/v1/auth/**`, `/api/health`, `/api/v1/health`, Swagger, `/error`.
- **Protegidos:** `anyRequest().authenticated()` — todo o resto exige autenticação.
- O `JwtAuthenticationFilter` é inserido **antes** do `UsernamePasswordAuthenticationFilter`:
  ```java
  .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
  ```
- **Resposta a não autenticado = 401:** configuramos um `authenticationEntryPoint` que devolve **401 Unauthorized** quando falta token (em vez do **403** padrão do Spring). Assim distinguimos *não autenticado* (401) de *autenticado sem permissão* (403), como manda o HTTP — e isso é verificado pelo teste de integração (ver `docs/TESTES-AUTOMATIZADOS.md`).

### 5.2 O filtro, linha a linha — `JwtAuthenticationFilter.doFilterInternal`

```java
String header = request.getHeader("Authorization");           // linha 37
if (header != null && header.startsWith("Bearer ")) {          // linha 39
    String token = header.substring(7);                        // linha 40  (tira "Bearer ")
    if (jwtService.tokenValido(token)                          // linha 42  (assinatura + expiração)
            && SecurityContextHolder.getContext().getAuthentication() == null) {
        String email = jwtService.extrairEmail(token);         // linha 45  (lê o "sub")
        UserDetails usuario =
            usuarioDetailsService.loadUserByUsername(email);   // linha 46  (carrega do banco)
        var auth = new UsernamePasswordAuthenticationToken(
                usuario, null, usuario.getAuthorities());      // linha 48-49 (authorities = papéis)
        auth.setDetails(...);                                  // linha 50
        SecurityContextHolder.getContext()
            .setAuthentication(auth);                          // linha 51 (marca como autenticado)
    }
}
filterChain.doFilter(request, response);                       // linha 55 (segue o fluxo)
```

### 5.3 Como o token é validado — `JwtService.tokenValido` / `lerClaims`

```java
public boolean tokenValido(String token) {                    // linha 50
    try {
        return lerClaims(token).getExpiration().after(new Date()); // não expirou?
    } catch (Exception e) {
        return false;                                         // assinatura inválida/malformado → false
    }
}

private Claims lerClaims(String token) {                      // linha 58
    return Jwts.parser()
            .verifyWith(chave)        // confere a assinatura HMAC com a NOSSA chave
            .build()
            .parseSignedClaims(token) // lança exceção se a assinatura não bater
            .getPayload();
}
```

Ou seja, a validação cobre **duas coisas**: (1) **assinatura** — o token foi assinado pela nossa chave e não foi adulterado; (2) **expiração** — ainda está dentro das 24h. Qualquer falha → o filtro **não autentica** e a requisição cai em **401** ao tentar acessar rota protegida.

### 5.4 Tipo de permissão do usuário (authorities)

Hoje, `UsuarioDetailsService.loadUserByUsername` cria o usuário com **lista de papéis vazia** (`List.of()`, linha 30). Ou seja, **não há perfis diferenciados** (admin/comum) nesta versão: a autorização é binária — *autenticado* × *não autenticado* — e o isolamento por usuário (seção 6) faz o resto.

> Pergunta provável da banca: *"E se quisesse um admin?"* — Resposta: bastaria popular as authorities (ex.: `List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))`) e proteger endpoints com `@PreAuthorize("hasRole('ADMIN')")`. A estrutura já suporta; só não foi necessário no escopo.

---

## 6. Autorização de dados — isolamento por usuário (anti-IDOR)

Mesmo autenticado, o usuário só acessa o que é dele. Isso é garantido **na consulta**, não só na URL:

- `UsuarioService.getLogado()` (linha 35-38) lê o e-mail do `SecurityContext` e busca o `Usuario` atual.
- As consultas sempre amarram o `usuarioId`:
  - `transacaoRepository.findByIdAndUsuarioId(id, usuarioId)`
  - `categoriaRepository.findByIdAndUsuarioId(id, usuarioId)`

**Efeito:** se o usuário A tentar `GET /api/v1/transacoes/{id}` com o `id` de uma transação do usuário B, a consulta retorna vazio → **404**, não os dados de B. Isso previne **IDOR** (*Insecure Direct Object Reference*), uma falha clássica que a banca pode testar.

---

## 7. Outras decisões e pontos de honestidade

| Tema | Situação atual | Observação para a banca |
|------|----------------|-------------------------|
| Transporte | HTTP em dev | Em produção, **HTTPS/TLS** obrigatório (o token viaja no header). |
| Armazenamento do token no front | `localStorage` | Simples, porém exposto a **XSS**. Alternativa: cookie `httpOnly`. |
| CORS | `allowedOriginPatterns("*")` | Em produção, restringir ao domínio real do frontend. |
| Segredo JWT | Variável `JWT_SECRET` | O fallback do código é só para dev; em produção, segredo forte e fora do código. |
| Revogação de token | Não há lista de revogação | Como é stateless, um token válido vale até expirar. Mitigação: expiração curta / blacklist (trabalho futuro). |
| Força da senha | Validação básica no DTO | Pode-se reforçar política de senha (tamanho, complexidade). |
| Proteção de força bruta no login | Não há rate limit | Citar como melhoria (ex.: bloqueio após N tentativas). |

Demonstrar consciência desses limites **conta a favor** na defesa — mostra que você entende segurança, não só implementou.

---

## 8. Resumo de algoritmos e bibliotecas

| Função | Algoritmo / Tecnologia | Biblioteca |
|--------|------------------------|-----------|
| Hash de senha | **bcrypt** (custo 10, salt aleatório) | Spring Security Crypto |
| Assinatura do token | **HMAC-SHA256 (HS256)** | JJWT (`io.jsonwebtoken` 0.12.5) |
| Geração de salt | `SecureRandom` (dentro do bcrypt) | Spring Security Crypto |
| Identidade/sessão | **JWT stateless** | JJWT + Spring Security |
| Controle de acesso | Filter chain + `SecurityContext` | Spring Security 6 |
