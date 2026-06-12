# Diagrama de Classes

O sistema segue uma arquitetura em camadas (*Controller → Service → Repository*). Este documento traz dois recortes complementares:

1. **Modelo de domínio** — as entidades persistidas (o que vira tabela no banco).
2. **Visão de camadas** — como controladores, serviços e repositórios se relacionam.

---

## 1. Modelo de domínio (entidades)

Todas as entidades herdam de `BaseEntity`, que centraliza o identificador (`UUID`) e a data de criação. O tipo de uma categoria ou transação é representado pelo enum `TipoTransacao`.

```mermaid
classDiagram
    direction LR

    class BaseEntity {
        <<abstract>>
        -UUID id
        -LocalDateTime createdAt
    }

    class Usuario {
        -String nome
        -String email
        -String senhaHash
        -BigDecimal rendaMensal
    }

    class Categoria {
        -String nome
        -String icone
        -String corHex
        -TipoTransacao tipo
        -BigDecimal orcamento
        -String descricao
    }

    class Transacao {
        -TipoTransacao tipo
        -BigDecimal valor
        -String descricao
        -LocalDate dataTransacao
    }

    class RendaMensalRegistro {
        -Integer ano
        -Integer mes
        -BigDecimal valorLancado
        -LocalDate dataLancamento
    }

    class TipoTransacao {
        <<enumeration>>
        RECEITA
        DESPESA
    }

    BaseEntity <|-- Usuario
    BaseEntity <|-- Categoria
    BaseEntity <|-- Transacao
    BaseEntity <|-- RendaMensalRegistro

    Usuario "1" --> "0..*" Categoria : possui
    Usuario "1" --> "0..*" Transacao : registra
    Usuario "1" --> "0..*" RendaMensalRegistro : controla
    Categoria "1" --> "0..*" Transacao : classifica
    RendaMensalRegistro "0..*" --> "0..1" Transacao : referencia

    Categoria ..> TipoTransacao : usa
    Transacao ..> TipoTransacao : usa
```

### Multiplicidades e regras

| Relação | Multiplicidade | Observação |
|---------|----------------|------------|
| Usuário → Categoria | 1 : 0..* | Cada usuário tem suas próprias categorias (criadas por padrão no registro). |
| Usuário → Transação | 1 : 0..* | Toda transação pertence a um usuário. |
| Categoria → Transação | 1 : 0..* | Uma categoria não pode ser excluída se tiver transações. |
| Usuário → RendaMensalRegistro | 1 : 0..* | Um registro por usuário/ano/mês (chave única). |
| RendaMensalRegistro → Transação | 0..* : 0..1 | Aponta para a receita gerada, para rastreabilidade. |

---

## 2. Visão de camadas (arquitetura)

Recorte da arquitetura para uma requisição autenticada. O `JwtAuthenticationFilter` intercepta a requisição antes de chegar ao controlador; os serviços concentram a regra de negócio e usam os repositórios para acessar o banco.

```mermaid
classDiagram
    direction TB

    class JwtAuthenticationFilter {
        +doFilterInternal(req, res, chain)
    }
    class JwtService {
        +gerarToken(email) String
        +extrairEmail(token) String
        +tokenValido(token) boolean
    }

    class TransacaoController {
        +listar(pageable) Page~TransacaoResponse~
        +criar(req) TransacaoResponse
        +atualizar(id, req) TransacaoResponse
        +excluir(id) void
    }
    class CategoriaController {
        +listar(tipo) List~CategoriaResponse~
        +criar(req) CategoriaResponse
        +atualizar(id, req) CategoriaResponse
        +excluir(id) void
    }
    class DashboardController {
        +resumo(periodo) DashboardResponse
    }
    class AuthController {
        +registrar(req) AuthResponse
        +login(req) AuthResponse
    }

    class TransacaoService {
        +listar(pageable) Page
        +criar(dados) TransacaoResponse
        +atualizar(id, dados) TransacaoResponse
        +excluir(id) void
    }
    class CategoriaService
    class DashboardService {
        +gerar(periodo) DashboardResponse
    }
    class AuthService {
        +registrar(dados) AuthResponse
        +login(dados) AuthResponse
    }
    class UsuarioService {
        +getLogado() Usuario
    }

    class TransacaoRepository {
        <<interface>>
    }
    class CategoriaRepository {
        <<interface>>
    }
    class UsuarioRepository {
        <<interface>>
    }

    JwtAuthenticationFilter ..> JwtService : valida token

    AuthController --> AuthService
    TransacaoController --> TransacaoService
    CategoriaController --> CategoriaService
    DashboardController --> DashboardService

    AuthService --> UsuarioRepository
    AuthService --> JwtService
    TransacaoService --> TransacaoRepository
    TransacaoService --> CategoriaRepository
    TransacaoService --> UsuarioService
    CategoriaService --> CategoriaRepository
    DashboardService --> TransacaoRepository
    DashboardService --> UsuarioService
    UsuarioService --> UsuarioRepository
```

> Os repositórios são interfaces Spring Data JPA — não há implementação manual: o Spring gera as consultas a partir do nome dos métodos (ex.: `findByUsuarioIdAndDataTransacaoBetween`).
