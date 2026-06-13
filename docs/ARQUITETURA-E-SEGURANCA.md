# Arquitetura, Segurança e Guia de Defesa

Documento de apoio para o estudo e a apresentação do **Controle Financeiro** à banca. Reúne a visão de arquitetura, o detalhamento da camada de segurança e um roteiro de perguntas e respostas para a defesa ao vivo.

---

## 1. Visão geral

O sistema é uma aplicação web de **controle financeiro pessoal**. O usuário cadastra **receitas** e **despesas**, organiza-as em **categorias** e acompanha o resultado em um **dashboard** (saldo, totais do mês, gastos por categoria e fluxo de caixa dos últimos 6 meses). Há ainda um **lançamento automático da renda mensal** no 5º dia útil de cada mês.

A aplicação é dividida em duas partes independentes:

- **Backend** — API REST em Java/Spring Boot, responsável pela regra de negócio, segurança e persistência.
- **Frontend** — SPA (Single Page Application) em React, que consome a API.

```
┌──────────────┐     HTTP/JSON      ┌──────────────────┐      JDBC      ┌──────────────┐
│   Frontend   │  ───────────────▶  │   Backend (API)  │  ───────────▶  │  PostgreSQL  │
│  React/Vite  │  ◀───────────────  │   Spring Boot    │  ◀───────────  │              │
│  :5173       │   Bearer <token>   │   :8080          │                │   :5432      │
└──────────────┘                    └──────────────────┘                └──────────────┘
```

---

## 2. Arquitetura do backend (camadas)

O backend segue o padrão clássico em camadas. Cada requisição autenticada percorre o caminho abaixo:

```
Requisição → [Filtro JWT] → Controller → Service → Repository → Banco
                  │             │            │           │
            valida o token   recebe/    regra de     consultas
            e identifica     devolve    negócio      JPA
            o usuário         DTO
```

| Camada | Pacote | Responsabilidade |
|--------|--------|------------------|
| **Segurança** | `security/` | Valida o token JWT a cada requisição e identifica o usuário. |
| **Controller** | `controller/` | Expõe os endpoints REST; recebe e devolve **DTOs** (nunca a entidade). |
| **Service** | `service/` | Concentra a regra de negócio; sempre opera no escopo do usuário logado. |
| **Repository** | `repository/` | Interfaces Spring Data JPA — o acesso ao banco. |
| **Entity** | `entity/` | Entidades JPA que viram tabelas. |
| **DTO** | `dto/` | `record`s de entrada/saída da API. |
| **Job** | `jobs/` | Rotinas agendadas (lançamento da renda, heartbeat). |

**Por que separar Controller / Service / Repository?** Para isolar responsabilidades: o controller cuida do protocolo HTTP, o service da regra de negócio e o repository do banco. Isso facilita teste, manutenção e troca de uma camada sem afetar as outras.

**Por que DTO em vez de devolver a entidade?** Para não expor dados sensíveis (ex.: o hash da senha do usuário nunca sai da API) e para desacoplar o formato do banco do formato da API.

---

## 3. Stack tecnológica e justificativas

| Camada | Tecnologia | Por que |
|--------|-----------|---------|
| Linguagem | **Java 21** | LTS, tipagem forte, maduro no mercado. |
| Framework | **Spring Boot 3.3** | Padrão de mercado para APIs REST; injeção de dependência, segurança e JPA integrados. |
| Segurança | **Spring Security + JWT** | Autenticação stateless, sem guardar sessão no servidor. |
| Persistência | **JPA / Hibernate** | Mapeia objetos Java para tabelas; gera SQL automaticamente. |
| Banco | **PostgreSQL** | Relacional, robusto, open-source. |
| Boilerplate | **Lombok** | Gera getters/setters/builders, reduz código repetitivo. |
| Frontend | **React 19 + TypeScript + Vite** | SPA reativa, tipada, com build rápido. |
| UI | **PrimeReact + PrimeFlex** | Biblioteca de componentes prontos (tabelas, formulários, diálogos). |
| Estado | **Zustand** | Gerência de estado simples; guarda o token autenticado. |
| Gráficos | **Chart.js** | Pizza (gastos por categoria) e barras (fluxo de caixa). |
| Formulários | **React Hook Form + Zod** | Validação declarativa dos formulários. |
| HTTP | **Axios** | Cliente HTTP com *interceptors* para anexar o token. |

---

## 4. Segurança (ponto central da defesa)

### 4.1 Autenticação por token JWT

O login **não cria sessão no servidor** — a API é *stateless*. O fluxo:

1. O usuário envia e-mail e senha para `POST /api/v1/auth/login`.
2. O Spring Security confere a senha contra o hash guardado no banco.
3. Se válida, o `JwtService` **gera um token JWT** assinado e o devolve.
4. A cada requisição seguinte, o frontend envia o token no cabeçalho `Authorization: Bearer <token>`.
5. O `JwtAuthenticationFilter` intercepta a requisição, valida o token e marca o usuário como autenticado **apenas para aquela chamada**.

**Características do token (implementação real):**

| Aspecto | Valor |
|---------|-------|
| Algoritmo de assinatura | **HMAC-SHA (HS256)** — `Keys.hmacShaKeyFor(secret)` |
| Conteúdo (claims) | `subject` = e-mail do usuário, `issuedAt`, `expiration` |
| Validade | **24 horas** (`app.jwt.expiration=86400000` ms) |
| Chave secreta | Variável `JWT_SECRET` (com valor padrão só para desenvolvimento) |
| Refresh token | **Não há** — quando expira, o usuário faz login de novo |

**O que o token NÃO contém:** a senha. Ele guarda apenas o e-mail e os horários. Como é assinado com a chave secreta, ninguém consegue forjá-lo sem conhecê-la — qualquer alteração no conteúdo invalida a assinatura.

**Validação do token** (no filtro): confere a **assinatura** (íntegra e gerada pela nossa chave) e a **expiração** (não vencido). Se qualquer uma falhar, a requisição segue sem autenticação e cai em `401`.

### 4.2 Senha: hash BCrypt — **tem salt?**

**Sim, tem salt — e é automático.** A senha é guardada com `BCryptPasswordEncoder` (Spring Security). O algoritmo **bcrypt**:

- Gera um **salt aleatório próprio para cada senha** (16 bytes), automaticamente.
- **Embute o salt dentro do próprio hash** — não precisamos guardar o salt em coluna separada.
- Aplica um **fator de custo** (padrão **10**, ou seja, 2¹⁰ = 1024 rodadas) que torna a quebra por força bruta lenta.

Formato do que fica salvo na coluna `senha_hash`:

```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 │   │  └────────────────────────────┬──────────────────────┘
 │   │       salt (22 chars)  +  hash resultante (31 chars)
 │   └── fator de custo = 10
 └────── identificador do algoritmo (bcrypt)
```

**Consequência prática:** dois usuários com a **mesma senha** terão **hashes diferentes**, porque o salt é diferente. Isso impede ataques de *rainbow table* e esconde senhas iguais.

> **Salt × Pepper:** o salt (aleatório, por senha) está presente. **Não** usamos *pepper* (um segredo extra global) nesta versão — é uma melhoria possível de citar como trabalho futuro.

A verificação no login compara a senha digitada com o hash usando `passwordEncoder.matches(...)`, que re-aplica o mesmo salt/custo e confere — **a senha original nunca é desfeita** (hash é via de mão única).

### 4.3 Autorização (rotas públicas × protegidas)

Configurado em `SecurityConfig`:

- **Públicas** (sem token): `/api/v1/auth/**` (login e registro), `/api/health`, `/api/v1/health`, Swagger e `/error`.
- **Protegidas** (exigem token válido): **todo o resto**.

Além disso, **cada usuário só enxerga os próprios dados**. Os serviços sempre filtram pelo usuário logado — ex.: `transacaoRepository.findByIdAndUsuarioId(id, usuarioId)`. Mesmo que alguém adivinhe o `id` de uma transação de outra pessoa, a consulta não retorna nada (isolamento por usuário).

### 4.4 CORS

A API libera o frontend (que roda em outra porta) via `CorsConfigurationSource`, permitindo os métodos GET/POST/PUT/PATCH/DELETE. Em produção, o ideal é restringir a origem ao domínio real do frontend.

### 4.5 Onde o token fica no frontend

O token é guardado no **localStorage** do navegador (chave `glass-finance-auth`, persistido pelo Zustand). O *interceptor* do Axios lê esse token e o injeta no cabeçalho de toda requisição. Se a API responder `401`, o frontend limpa o storage e redireciona para o login.

> **Ponto de honestidade para a banca:** guardar JWT em `localStorage` é simples e comum, mas fica exposto a ataques XSS. Alternativa mais segura: cookie `httpOnly`. Citar isso mostra domínio do assunto.

---

## 5. Frontend (organização)

SPA em React com TypeScript. Principais pastas em `frontend/src`:

| Pasta | Conteúdo |
|-------|----------|
| `pages/` | Telas: Login, Registro, Painel (dashboard), Transações, Categorias, Perfil. |
| `services/` | Funções que chamam a API (um arquivo por recurso). |
| `store/` | Estado global com Zustand (`autenticacao.ts` guarda usuário e token). |
| `components/common/` | Componentes reutilizáveis (cartões, gráficos, diálogos, rota privada). |
| `types/` | Interfaces TypeScript espelhando os DTOs da API. |
| `assets/styles/` | Tema "glass" (vidro), variáveis CSS e animações. |

**Proteção de rotas:** o componente `RotaPrivada` impede o acesso às telas internas sem autenticação. Ao abrir o app, o `checkAuth()` valida o token chamando `/usuarios/perfil`; se falhar, faz logout.

**Resiliência (cold start do Render):** o Axios tem `timeout` de 90 s e mensagens amigáveis, porque no plano gratuito do Render o backend pode estar "dormindo" e leva alguns segundos para acordar.

---

## 6. Integrações com APIs externas

**O sistema não consome nenhuma API de terceiros.** Não há gateway de pagamento, Open Finance, envio de e-mail ou serviço externo. Toda a comunicação é **frontend ↔ backend próprio**.

O único elemento "externo" é a **hospedagem no Render** (plano gratuito), que pode suspender o serviço após inatividade. Para isso existe:

- O endpoint público e leve `GET /api/health`, usado para verificar/acordar a API.
- A job `MonitoramentoJobs`, que registra um *heartbeat* no log a cada 2 minutos enquanto a aplicação está ativa.

> Se a banca perguntar sobre "APIs externas", a resposta correta é: **não há integrações externas**; a API consumida pelo frontend é a do próprio projeto. Esse é um recorte proposital da versão simplificada.

---

## 7. Regras de negócio que valem destacar

1. **Categorias padrão no cadastro** — ao criar a conta, o sistema já insere categorias (Salário, Alimentação, Transporte…) para o usuário não começar com a tela vazia.
2. **Dashboard é calculado, não armazenado** — não existe tabela de "resumo"; os números são somados a partir das transações no momento da consulta.
3. **Lançamento automático da renda mensal** — todo 5º dia útil, a renda configurada no perfil vira uma receita "Salário". Um registro por mês (`UNIQUE(usuario_id, ano, mes)`) evita duplicidade. A mesma rotina roda ao cadastrar a conta, ao salvar a renda no perfil e por um botão manual, atualizando o dashboard na hora.
4. **Integridade ao excluir** — uma categoria com transações **não** pode ser excluída (evita transações órfãs).

---

## 8. Roteiro de defesa — perguntas prováveis da banca

> A banca pode pedir alterações ao vivo (prevenção contra uso indevido de IA). Estude estas respostas e saiba **onde** mexer no código.

| Pergunta | Resposta curta | Onde está no código |
|----------|----------------|---------------------|
| Como funciona o login? | Valida senha com BCrypt e devolve um JWT assinado (HS256, 24h). | `AuthService.login`, `JwtService` |
| A senha é guardada como? | Hash bcrypt com salt aleatório embutido (custo 10); nunca em texto puro. | `Usuario.senhaHash`, `SecurityConfig.passwordEncoder` |
| O hash tem salt? | Sim, o bcrypt gera um salt único por senha automaticamente. | `BCryptPasswordEncoder` |
| Como o token é validado a cada requisição? | Um filtro lê o `Bearer`, confere assinatura e expiração e identifica o usuário. | `JwtAuthenticationFilter` |
| Um usuário vê dados de outro? | Não; toda consulta filtra pelo usuário logado. | `*Service.buscarEntidade`, `findBy...AndUsuarioId` |
| O que é stateless? | O servidor não guarda sessão; cada requisição se identifica pelo token. | `SecurityConfig` (SessionCreationPolicy.STATELESS) |
| Como o dashboard é montado? | Somando as transações do período direto do banco. | `DashboardService.gerar` |
| Como criar um novo campo/endpoint? | Entidade → DTO → Repository → Service → Controller. | seguir o fluxo das camadas |
| Por que UUID e não id sequencial? | Difícil de adivinhar (não dá para enumerar registros) e bom para sistemas distribuídos. | `BaseEntity` |

**Dica de apresentação:** mostre o sistema rodando (login → lançar uma transação → ver o dashboard mudar → categorias → perfil). Use dados fictícios rápidos. Deixe ~70% do tempo para a demonstração e o resto para explicar arquitetura/segurança.
