# Diagramas de Sequência

Os diagramas a seguir mostram a troca de mensagens entre os participantes ao longo do tempo. Foram escolhidos quatro fluxos que, juntos, exercitam toda a arquitetura: autenticação, escrita autenticada, leitura agregada e processamento agendado.

---

## 1. Registro de conta

Ao registrar, o sistema valida o e-mail, grava o usuário com senha em hash, cria as categorias padrão, já lança a renda do mês (se informada) e devolve o token.

```mermaid
sequenceDiagram
    actor V as Visitante
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UsuarioRepository
    participant PE as PasswordEncoder
    participant CR as CategoriaRepository
    participant RJ as RendaMensalJobs
    participant JWT as JwtService

    V->>AC: POST /api/v1/auth/registro
    AC->>AS: registrar(dados)
    AS->>UR: existsByEmail(email)
    alt e-mail já cadastrado
        UR-->>AS: true
        AS-->>AC: RegraNegocioException (409)
        AC-->>V: 409 Conflito
    else e-mail disponível
        UR-->>AS: false
        AS->>PE: encode(senha)
        PE-->>AS: senhaHash
        AS->>UR: save(usuario)
        UR-->>AS: usuario
        AS->>CR: saveAll(categorias padrão)
        AS->>RJ: executarParaUsuario(usuario, hoje)
        AS->>JWT: gerarToken(email)
        JWT-->>AS: token
        AS-->>AC: AuthResponse(token, usuário)
        AC-->>V: 201 Created
    end
```

---

## 2. Login

A autenticação delega ao `AuthenticationManager` do Spring Security, que compara a senha informada com o hash. Se válida, gera o token JWT.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant AC as AuthController
    participant AS as AuthService
    participant AM as AuthenticationManager
    participant UR as UsuarioRepository
    participant JWT as JwtService

    U->>AC: POST /api/v1/auth/login
    AC->>AS: login(dados)
    AS->>AM: authenticate(email, senha)
    alt credenciais inválidas
        AM-->>AS: BadCredentialsException
        AS-->>AC: 401
        AC-->>U: 401 Não autorizado
    else credenciais válidas
        AM-->>AS: ok
        AS->>UR: findByEmail(email)
        UR-->>AS: usuario
        AS->>JWT: gerarToken(email)
        JWT-->>AS: token
        AS-->>AC: AuthResponse(token, usuário)
        AC-->>U: 200 OK
    end
```

---

## 3. Criar transação (requisição autenticada)

Mostra o ciclo completo de uma escrita protegida: o filtro JWT autentica a requisição **antes** do controlador, e o serviço garante que a categoria pertence ao usuário logado.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as JwtAuthenticationFilter
    participant JWT as JwtService
    participant TC as TransacaoController
    participant TS as TransacaoService
    participant US as UsuarioService
    participant CR as CategoriaRepository
    participant TR as TransacaoRepository

    U->>F: POST /api/v1/transacoes (Bearer token)
    F->>JWT: tokenValido(token)
    JWT-->>F: true
    F->>JWT: extrairEmail(token)
    JWT-->>F: email
    Note over F: coloca usuário no SecurityContext
    F->>TC: encaminha requisição
    TC->>TS: criar(dados)
    TS->>US: getLogado()
    US-->>TS: usuario
    TS->>CR: findByIdAndUsuarioId(categoriaId, usuarioId)
    alt categoria não pertence ao usuário
        CR-->>TS: vazio
        TS-->>TC: RegraNegocioException (404)
        TC-->>U: 404 Não encontrado
    else categoria válida
        CR-->>TS: categoria
        TS->>TR: save(transacao)
        TR-->>TS: transacao
        TS-->>TC: TransacaoResponse
        TC-->>U: 201 Created
    end
```

---

## 4. Visualizar dashboard (leitura agregada)

O dashboard não tem tabela própria: ele é calculado a partir das transações do usuário no período escolhido.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant DC as DashboardController
    participant DS as DashboardService
    participant US as UsuarioService
    participant TR as TransacaoRepository

    U->>DC: GET /api/v1/dashboard?periodo=yyyy-MM
    DC->>DS: gerar(periodo)
    DS->>US: getLogado()
    US-->>DS: usuario
    DS->>TR: findByUsuarioIdAndDataTransacaoBetween(mês)
    TR-->>DS: transações do mês
    DS->>TR: findByUsuarioIdAndDataTransacaoBetween(histórico)
    TR-->>DS: transações acumuladas
    DS->>TR: findByUsuarioIdAndDataTransacaoBetween(6 meses)
    TR-->>DS: transações dos 6 meses
    Note over DS: soma receitas/despesas,<br/>agrupa por categoria,<br/>monta fluxo de caixa
    DS-->>DC: DashboardResponse
    DC-->>U: 200 OK
```

---

## 5. Lançamento automático da renda mensal (job agendado)

Todo dia às 06:00 o agendador dispara a rotina; ela só age se a data for o 5º dia útil do mês. Para cada usuário com renda configurada, lança a receita uma única vez por mês.

```mermaid
sequenceDiagram
    participant SCH as Agendador (cron 06:00)
    participant RJ as RendaMensalJobs
    participant UR as UsuarioRepository
    participant RR as RendaMensalRegistroRepository
    participant CR as CategoriaRepository
    participant TR as TransacaoRepository

    SCH->>RJ: processarRendaMensal()
    RJ->>RJ: ehQuintoDiaUtil(hoje)?
    alt não é o 5º dia útil
        RJ-->>SCH: encerra
    else é o 5º dia útil
        RJ->>UR: findAll() (filtra renda > 0)
        UR-->>RJ: usuários com renda
        loop para cada usuário
            RJ->>RR: findByUsuarioIdAndAnoAndMes(...)
            alt ainda não lançado no mês
                RR-->>RJ: vazio
                RJ->>CR: buscar/criar categoria "Salário"
                CR-->>RJ: categoria
                RJ->>TR: save(transação RECEITA)
                TR-->>RJ: transacao
                RJ->>RR: save(registro do mês)
            else já lançado
                RR-->>RJ: registro existente
                Note over RJ: atualiza valor se a renda mudou
            end
        end
        RJ-->>SCH: concluído
    end
```

> O mesmo método `executarParaUsuario(...)` é chamado fora do agendador — no registro da conta, ao salvar a renda no perfil e pelo botão **Lançar renda do mês** — garantindo que o dashboard reflita a renda imediatamente, sem esperar o próximo dia 5.
