# Controle Financeiro — Versão Simples (TCC)

Versão **enxuta** do projeto de finanças, feita para ser **fácil de explicar na banca**.
Mantém o mesmo visual (design system idêntico) e o mesmo estilo de arquitetura do projeto
original, mas com bem menos código e sem os módulos avançados (simulador, Open Finance,
casal, metas, auditoria, notificações, WebSocket, cache, etc).

## O que o sistema faz

1. **Login / Registro** com autenticação por **token JWT**.
2. **Categorias** (CRUD) para classificar o dinheiro — ex: Alimentação, Salário.
3. **Transações** (CRUD): lançar **receitas** e **despesas** — o coração do controle financeiro.
4. **Dashboard**: resumo do mês (saldo, receitas, despesas), gastos por categoria (pizza)
   e fluxo de caixa dos últimos 6 meses (barras).

Ao criar a conta, o sistema já cadastra **algumas categorias padrão** para não começar vazio.

## Tecnologias

| Camada   | Tecnologia                                                        |
|----------|-------------------------------------------------------------------|
| Backend  | Java 21, Spring Boot 3.3, Spring Security (JWT), JPA/Hibernate, Lombok |
| Frontend | React 19, TypeScript, Vite, PrimeReact, Zustand, Chart.js         |
| Banco    | PostgreSQL                                                        |

## Estrutura

```
financa-simnples-ADS-FINAL/
├── backend/    → API REST (Spring Boot)
└── frontend/   → Interface web (React)
```

### Backend (`backend/src/main/java/com/financas`)

```
entity/      → BaseEntity, Usuario, Categoria, Transacao   (tabelas do banco)
enums/       → TipoTransacao (RECEITA / DESPESA)
repository/  → interfaces JPA (acesso ao banco)
dto/         → records de entrada/saída da API
security/    → JWT (geração, filtro e UserDetails)
service/     → regras de negócio
controller/  → endpoints REST
exception/   → tratamento de erros centralizado
config/      → SecurityConfig
```

## Como rodar

### 1. Banco de dados (PostgreSQL)

Crie um banco chamado `financas_simples`:

```bash
createdb financas_simples
# ou dentro do psql:  CREATE DATABASE financas_simples;
```

As credenciais padrão estão em `backend/src/main/resources/application.yml`
(`postgres` / `postgres`). Ajuste se o seu PostgreSQL usar outro usuário/senha.
O Hibernate cria as tabelas sozinho na primeira execução (`ddl-auto: update`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

A API sobe em **http://localhost:8080**.
Documentação (Swagger): **http://localhost:8080/swagger-ui.html**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

A interface abre em **http://localhost:5173**.

> O endereço da API fica em `frontend/.env` (`VITE_API_URL=http://localhost:8080`).

## Endpoints da API

| Método | Rota                          | Descrição                          | Auth |
|--------|-------------------------------|------------------------------------|------|
| GET    | `/api/health`                 | Verificar se a API está online     | não  |
| GET    | `/api/v1/health`              | Verificar se a API está online     | não  |
| POST   | `/api/v1/auth/registro`       | Criar conta                        | não  |
| POST   | `/api/v1/auth/login`          | Entrar (retorna o token)           | não  |
| GET    | `/api/v1/usuarios/perfil`     | Dados do usuário logado            | sim  |
| GET    | `/api/v1/categorias`          | Listar categorias (`?tipo=`)       | sim  |
| POST   | `/api/v1/categorias`          | Criar categoria                    | sim  |
| PUT    | `/api/v1/categorias/{id}`     | Editar categoria                   | sim  |
| DELETE | `/api/v1/categorias/{id}`     | Excluir categoria                  | sim  |
| GET    | `/api/v1/transacoes`          | Listar transações (paginado)       | sim  |
| POST   | `/api/v1/transacoes`          | Criar transação                    | sim  |
| PUT    | `/api/v1/transacoes/{id}`     | Editar transação                   | sim  |
| DELETE | `/api/v1/transacoes/{id}`     | Excluir transação                  | sim  |
| GET    | `/api/v1/dashboard`           | Resumo do mês (`?periodo=yyyy-MM`) | sim  |

> Nas rotas protegidas, envie o cabeçalho `Authorization: Bearer <token>`.

## Deploy no Render gratuito

O Render gratuito pode colocar o backend em modo de espera após um período sem acessos.
Para esse cenário, o projeto tem um endpoint público e leve:

```bash
GET /api/health
```

O frontend também espera até 90 segundos por uma resposta da API, ajudando quando o
backend está acordando depois de um cold start.

Também existe uma job interna em `backend/src/main/java/com/financas/jobs/MonitoramentoJobs.java`
que registra um heartbeat no log a cada 2 minutos enquanto a aplicação estiver ativa.
No plano gratuito do Render, se a plataforma colocar o serviço para dormir, o processo Java
é pausado e nenhuma job interna continua executando até a próxima requisição acordar a API.

## Fluxo de uma requisição (para explicar na banca)

```
Frontend  →  Controller  →  Service  →  Repository  →  Banco
                  ↑ valida o token JWT (JwtAuthenticationFilter)
                  ↓ converte Entidade ↔ DTO (record)
```

1. O usuário faz login; o backend confere a senha (BCrypt) e devolve um **token JWT**.
2. A cada requisição, o `JwtAuthenticationFilter` lê o token e identifica o usuário.
3. O **Controller** recebe um **DTO**, chama o **Service** (regra de negócio),
   que usa o **Repository** para ler/gravar no banco.
4. A resposta volta como **DTO**, nunca expondo a entidade direto (ex: a senha fica de fora).
