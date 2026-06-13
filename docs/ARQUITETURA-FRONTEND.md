# Arquitetura do Frontend

Como a interface web é organizada, em camadas, e como cada parte se conecta com a API. Caminhos a partir de `frontend/src`.

## 1. Visão em camadas

O frontend é uma **SPA** (Single Page Application): uma única página HTML que troca de tela sem recarregar, conversando com a API por JSON.

```
┌──────────────────────────────────────────────────────────────┐
│  PAGES (telas)         pages/                                  │
│  Login, Registro, Painel, Transacoes, Categorias, Perfil      │
│      │  usam                                                   │
│      ▼                                                         │
│  COMPONENTS (UI reutilizável)   components/common/            │
│  Cartões, Gráficos, Diálogos, RotaPrivada, Layout            │
│      │  disparam ações                                         │
│      ▼                                                         │
│  STORE (estado global)   store/autenticacao.ts (Zustand)     │
│  usuário, token, isAuthenticated                              │
│      │                                                         │
│      ▼                                                         │
│  SERVICES (acesso à API)   services/*.ts                      │
│  servicoTransacao, servicoCategoria, servicoPainel...        │
│      │  usam                                                   │
│      ▼                                                         │
│  API CLIENT   services/api.ts (Axios + interceptors)         │
│      │  HTTP + Bearer token                                    │
└──────┼────────────────────────────────────────────────────────┘
       ▼
   Backend  (http://localhost:8080)
```

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Pages** | `pages/` | As telas do sistema (uma por rota). |
| **Components** | `components/common/` | Peças de UI reaproveitadas (cartões, gráficos, diálogos, layout, rota privada). |
| **Store** | `store/` | Estado global com **Zustand** — guarda usuário e token, persistidos no `localStorage`. |
| **Services** | `services/` | Funções que chamam a API (uma por recurso). Isolam o componente da URL/HTTP. |
| **API client** | `services/api.ts` | Instância única do **Axios** com *interceptors* que anexam o token e tratam erros/401. |
| **Types** | `types/` | Interfaces TypeScript que espelham os DTOs da API (tipagem ponta a ponta). |
| **Hooks** | `hooks/` | Lógica reutilizável (ex.: notificação/toast). |
| **Styles** | `assets/styles/` | Tema visual "glass" (vidro), variáveis e animações CSS. |

**Por que separar `services` das `pages`?** Para que a tela não saiba *como* a API é chamada — ela só pede `transacaoService.create(...)`. Se a URL ou o formato mudar, muda-se em um lugar só. É o mesmo princípio do backend (Controller × Service).

## 2. Roteamento e proteção de telas

Arquivo: `App.tsx`

- Usa **React Router**. Rotas públicas: `/login` e `/registro`. As demais ficam **dentro** de `<PrivateRoute>`.
- `RotaPrivada.tsx` (`components/common`) decide:
  - ainda verificando token → mostra tela de carregamento;
  - não autenticado → redireciona para `/login`;
  - autenticado → libera a tela (`<Outlet/>`).
- **Code splitting:** cada página é carregada sob demanda (`lazy(() => import(...))`), deixando o carregamento inicial mais leve.
- Ao abrir o app, um `useEffect` chama `checkAuth()`: se houver token salvo, confirma no backend (`GET /usuarios/perfil`) se ainda é válido.

## 3. Autenticação no front (o ciclo do token)

Arquivo: `store/autenticacao.ts` (Zustand com `persist`)

1. **Login/registro:** `authStore.login()` chama `POST /api/v1/auth/login`, recebe `accessToken` e guarda no estado.
2. **Persistência:** o middleware `persist` salva `token` e `user` no `localStorage` (chave `glass-finance-auth`). Assim, ao recarregar a página, o usuário continua logado.
3. **Envio automático:** o *interceptor de request* do Axios (`services/api.ts`) lê o token do `localStorage` e injeta `Authorization: Bearer <token>` em **toda** requisição.
4. **Expiração/erro:** o *interceptor de response* detecta **401**, limpa o storage e redireciona para `/login`.
5. **Logout:** remove o token do estado e do header do Axios.

```
Login → token no Zustand → persistido no localStorage
                                  │
   cada requisição ──► interceptor Axios lê o token ──► header Bearer
                                  │
              resposta 401 ──► limpa storage ──► volta ao /login
```

## 4. Fluxo completo de uma ação (ex.: lançar um gasto)

```
Tela Transacoes (pages/Transacoes.tsx)
   │  usuário preenche o formulário (React Hook Form + Zod valida)
   ▼
transacaoService.create(dados)        (services/servicoTransacao.ts)
   │
   ▼
api.post('/api/v1/transacoes', dados) (services/api.ts)
   │  interceptor anexa  Authorization: Bearer <token>
   ▼
Backend valida o token e grava ──► devolve a transação criada
   │
   ▼
Tela atualiza a lista e mostra um toast de sucesso
```

## 5. Bibliotecas principais e o papel de cada uma

| Biblioteca | Papel |
|-----------|-------|
| **React 19 + TypeScript** | Base da SPA, com tipagem estática. |
| **Vite** | Servidor de desenvolvimento e *build* de produção (rápido). |
| **React Router** | Navegação entre telas sem recarregar a página. |
| **Zustand** | Estado global simples (usuário/token), com persistência. |
| **Axios** | Cliente HTTP com *interceptors* (token e tratamento de 401). |
| **React Hook Form + Zod** | Formulários e validação declarativa dos campos. |
| **PrimeReact + PrimeFlex** | Componentes de UI (tabelas, inputs, diálogos) e layout. |
| **Chart.js** | Gráficos do dashboard (pizza de gastos, barras de fluxo). |
| **lucide-react / primeicons** | Ícones. |

## 6. Resiliência a *cold start* (deploy gratuito)

O Axios usa `timeout: 90000` (90s) e mensagens amigáveis quando o backend está "acordando" no Render gratuito. Se o servidor demora, o usuário vê *"O servidor pode estar iniciando..."* em vez de um erro seco.

## 7. Pontos para a banca

- **Onde fica o token?** No `localStorage` (via Zustand `persist`). É simples; a alternativa mais segura contra XSS seria cookie `httpOnly`.
- **Quem protege as telas?** O componente `RotaPrivada` no front (UX) **e** o backend (segurança real). O front nunca é a única defesa — o backend valida o token em toda requisição.
- **Como o token chega na API?** Sempre pelo *interceptor* do Axios, nunca manualmente em cada chamada.
