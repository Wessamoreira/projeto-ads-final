# Lançamento Automático de Renda Mensal

## Visão Geral

Esta funcionalidade implementa o **lançamento automático da renda mensal** cadastrada no perfil do usuário como uma transação de **RECEITA** no **5º dia útil** de cada mês, simulando o dia típico de recebimento de salário.

Além da execução agendada, a mesma rotina também pode ser disparada quando o usuário cria a conta com renda mensal, salva a renda no perfil ou clica no botão **Lançar renda do mês** na tela **Meu perfil**. Isso permite atualizar o Dashboard imediatamente sem esperar o próximo agendamento.

---

## Regra de Negócio

| Aspecto | Descrição |
|---------|-----------|
| **Quando executa** | Todo 5º dia útil do mês, às 06:00 |
| **Dias úteis** | Segunda a sexta-feira (sábado e domingo não contam) |
| **Condição** | Usuário deve ter `rendaMensal > 0` configurada no perfil |
| **Categoria** | Criada automaticamente como "Salário" (tipo RECEITA) |
| **Controle** | Registra cada lançamento para evitar duplicidade |
| **Atualização** | Se a renda mudar no perfil, atualiza a transação automática do mês |
| **Execução manual** | Botão no perfil chama a rotina apenas para o usuário logado |

---

## Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO LANÇAMENTO                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────────────┐     ┌────────────────┐  │
│  │  Scheduler   │────▶│   RendaMensalJobs    │────▶│  Verifica se   │  │
│  │  (06:00)     │     │   package jobs       │     │  é 5º dia útil │  │
│  └──────────────┘     └──────────────────────┘     └───────┬────────┘  │
│                                                            │           │
│                                                     SIM    ▼    NÃO    │
│                                              ┌─────────────────────┐   │
│                                              │   Para cada usuário │   │
│                                              │   com renda > 0     │   │
│                                              └──────────┬──────────┘   │
│                                                         │              │
│                                                         ▼              │
│                                              ┌─────────────────────┐   │
│                                              │ Já lançou este mês? │   │
│                                              └──────────┬──────────┘   │
│                                                         │              │
│                                                  NÃO    ▼    SIM       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     CRIA TRANSAÇÃO                               │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  • Tipo: RECEITA                                                 │  │
│  │  • Valor: rendaMensal do usuário                                 │  │
│  │  • Descrição: "Salário - Mês/Ano"                                │  │
│  │  • Categoria: "Salário" (cria se não existir)                    │  │
│  │  • Data: 5º dia útil do mês                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                         │              │
│                                                         ▼              │
│                                              ┌─────────────────────┐   │
│                                              │ Registra lançamento │   │
│                                              │ (evita duplicidade) │   │
│                                              └─────────────────────┘   │
│                                                                        │
│  Se já existir registro do mês e o valor mudou, atualiza a transação   │
│  automática vinculada ao RendaMensalRegistro.                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos Criados/Modificados

### 1. Entidade: `RendaMensalRegistro.java`

**Caminho:** `backend/src/main/java/com/financas/entity/RendaMensalRegistro.java`

**Propósito:** Controlar se a renda mensal já foi lançada em um determinado mês/ano.

**Atributos:**

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `id` | UUID | Identificador único (herdado de BaseEntity) |
| `usuario` | Usuario | Usuário dono do registro |
| `ano` | Integer | Ano do lançamento (ex: 2026) |
| `mes` | Integer | Mês do lançamento (1-12) |
| `valorLancado` | BigDecimal | Valor que foi lançado |
| `dataLancamento` | LocalDate | Data em que o lançamento foi feito |
| `transacao` | Transacao | Referência à transação criada |

**Constraint:** `uk_renda_usuario_ano_mes` - Garante unicidade por usuário/ano/mês

---

### 2. Repository: `RendaMensalRegistroRepository.java`

**Caminho:** `backend/src/main/java/com/financas/repository/RendaMensalRegistroRepository.java`

**Métodos:**

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `existsByUsuarioIdAndAnoAndMes(UUID, Integer, Integer)` | boolean | Verifica se já existe lançamento no mês |
| `findByUsuarioIdAndAnoAndMes(UUID, Integer, Integer)` | Optional | Busca registro específico |
| `findByUsuarioIdOrderByAnoDescMesDesc(UUID)` | List | Lista histórico do usuário |

---

### 3. Job: `RendaMensalJobs.java`

**Caminho:** `backend/src/main/java/com/financas/jobs/RendaMensalJobs.java`

**Métodos principais:**

| Método | Descrição |
|--------|-----------|
| `processarRendaMensal()` | Rotina agendada (cron: `0 0 6 * * ?`) |
| `executarParaUsuario(Usuario, LocalDate)` | Cria ou atualiza o lançamento somente para um usuário |
| `ehQuintoDiaUtil(LocalDate)` | Verifica se a data é o 5º dia útil |
| `calcularQuintoDiaUtil(int, int)` | Calcula o 5º dia útil de um mês |
| `executarManualmente(LocalDate)` | Execução manual geral para todos os usuários com renda |
| `buscarOuCriarCategoriaSalario(Usuario)` | Cria categoria "Salário" se não existir |

**Resultados possíveis da rotina:**

| Resultado | Significado |
|-----------|-------------|
| `CRIADO` | Não havia lançamento do mês e uma nova transação foi criada |
| `ATUALIZADO` | Já havia lançamento do mês e o valor da transação foi atualizado |
| `JA_PROCESSADO` | Já havia lançamento do mês com o mesmo valor |
| `SEM_RENDA` | Usuário não tem renda mensal maior que zero |

**Anotações utilizadas:**
- `@Component` - Declara o job como componente Spring
- `@Scheduled(cron = "0 0 6 * * ?")` - Agenda execução diária às 06:00
- `@Transactional` - Garante atomicidade das operações
- `@Slf4j` - Habilita logs (Lombok)

---

### 4. Controller: `RendaMensalController.java`

**Caminho:** `backend/src/main/java/com/financas/controller/RendaMensalController.java`

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/renda-mensal/status` | Status do lançamento automático |
| POST | `/api/renda-mensal/executar` | Cria ou atualiza lançamento para o usuário logado |
| GET | `/api/renda-mensal/historico` | Lista histórico de lançamentos |

---

### 5. DTO: `RendaMensalStatusResponse.java`

**Caminho:** `backend/src/main/java/com/financas/dto/RendaMensalStatusResponse.java`

**Atributos:**

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `rendaMensalConfigurada` | BigDecimal | Valor configurado no perfil |
| `lancadoEsteMes` | boolean | Se já foi lançado este mês |
| `proximoLancamento` | LocalDate | Data do próximo 5º dia útil |
| `totalLancamentos` | int | Total de lançamentos realizados |

---

### 6. Modificação: `FinancasApplication.java`

**Adicionado:** `@EnableScheduling`

```java
@SpringBootApplication
@EnableScheduling  // <-- ADICIONADO
public class FinancasApplication {
```

**Propósito:** Habilita o agendamento de tarefas no Spring Boot.

---

### 7. Integração com Cadastro e Perfil

**Arquivos relacionados:**

| Arquivo | Responsabilidade |
|---------|------------------|
| `backend/src/main/java/com/financas/service/AuthService.java` | Ao criar a conta, chama `RendaMensalJobs.executarParaUsuario(...)` se houver renda |
| `backend/src/main/java/com/financas/service/UsuarioService.java` | Ao salvar o perfil, chama `RendaMensalJobs.executarParaUsuario(...)` |
| `frontend/src/pages/Perfil.tsx` | Exibe o botão **Lançar renda do mês** |
| `frontend/src/services/servicoRendaMensal.ts` | Chama `POST /api/renda-mensal/executar` |

O lançamento continua idempotente: se a renda já foi lançada no mês, a rotina não cria outra transação. Quando o valor da renda mensal muda no perfil, a rotina atualiza o `valor` do `RendaMensalRegistro` e da `Transacao` automática vinculada.

---

## Cálculo do 5º Dia Útil

### Algoritmo

```java
public LocalDate calcularQuintoDiaUtil(int ano, int mes) {
    LocalDate data = LocalDate.of(ano, mes, 1);
    int diasUteis = 0;

    while (diasUteis < 5) {
        if (ehDiaUtil(data)) {
            diasUteis++;
        }
        if (diasUteis < 5) {
            data = data.plusDays(1);
        }
    }

    return data;
}

private boolean ehDiaUtil(LocalDate data) {
    DayOfWeek dia = data.getDayOfWeek();
    return dia != DayOfWeek.SATURDAY && dia != DayOfWeek.SUNDAY;
}
```

### Exemplos

| Mês/Ano | 5º Dia Útil | Explicação |
|---------|-------------|------------|
| Janeiro/2026 | 07/01/2026 | Dia 1 (qui), 2 (sex), 5 (seg), 6 (ter), 7 (qua) |
| Fevereiro/2026 | 06/02/2026 | Dia 2 (seg), 3 (ter), 4 (qua), 5 (qui), 6 (sex) |
| Março/2026 | 05/03/2026 | Dia 2 (seg), 3 (ter), 4 (qua), 5 (qui), 6 (sex) - ajustado |

---

## Diagrama de Entidades

```
┌─────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│    Usuario      │       │ RendaMensalRegistro │       │   Transacao  │
├─────────────────┤       ├─────────────────────┤       ├──────────────┤
│ id              │◀──────│ usuario_id (FK)     │       │ id           │
│ nome            │       │ id                  │       │ tipo         │
│ email           │       │ ano                 │       │ valor        │
│ senhaHash       │       │ mes                 │       │ descricao    │
│ rendaMensal     │       │ valorLancado        │       │ dataTransacao│
└─────────────────┘       │ dataLancamento      │       │ categoria_id │
                          │ transacao_id (FK)   │──────▶│ usuario_id   │
                          └─────────────────────┘       └──────────────┘
```

---

## Logs Gerados

A rotina gera logs detalhados para monitoramento:

```
[RendaMensal] Iniciando verificacao - Data: 2026-06-05
[RendaMensal] Hoje e o 5o dia util! Processando lancamentos...
[RendaMensal] Usuarios com renda configurada: 3
[RendaMensal] Lancamento realizado: Usuario=joao@email.com, Valor=5000.00, Mes=6/2026
[RendaMensal] Lancamento atualizado: Usuario=joao@email.com, Valor=5500.00, Mes=6/2026
[RendaMensal] Renda ja lancada para usuario maria@email.com em 6/2026
[RendaMensal] Processamento concluido. Lancamentos/atualizacoes realizados: 1
[RendaMensal] Execucao solicitada para usuario joao@email.com na data: 2026-06-05
```

---

## Como Testar

### 1. Via API (Postman/Swagger)

```bash
# Ver status
GET http://localhost:8080/api/renda-mensal/status

# Executar manualmente para o usuário logado
POST http://localhost:8080/api/renda-mensal/executar

# Executar para uma data específica para o usuário logado
POST http://localhost:8080/api/renda-mensal/executar?data=2026-07-07

# Ver histórico
GET http://localhost:8080/api/renda-mensal/historico
```

### 2. Via Frontend

Na tela **Meu perfil**, informe uma renda mensal maior que zero e clique em **Lançar renda do mês**.

Se o salário já estiver lançado no mês e você alterar a renda no perfil, a transação automática em **Transações** também terá o valor atualizado.

### 3. Verificar no Dashboard

Após executar, a receita aparecerá:
- No Dashboard como "Receita do Mês"
- Na lista de Transações com descrição "Salário - Mês/Ano"

---

## Integração com o Frontend

O frontend exibe a renda mensal no **Painel (Dashboard)** como parte das receitas do mês. Após o lançamento automático, salvamento do perfil, cadastro com renda ou clique no botão do perfil:

1. A transação é criada ou atualizada no banco de dados
2. O Dashboard calcula receitas/despesas do período
3. O valor da renda aparece como receita

**Arquivos relacionados:** `frontend/src/pages/Painel.tsx`, `frontend/src/pages/Perfil.tsx`, `frontend/src/services/servicoRendaMensal.ts`

---

## Considerações Técnicas

### Fuso Horário
- O scheduler usa o fuso horário do servidor
- Recomendado configurar `TZ=America/Sao_Paulo` em produção

### Feriados
- Esta versão **não considera feriados nacionais**
- Apenas sábados e domingos são ignorados
- Possível melhoria futura: integrar API de feriados

### Performance
- A rotina executa uma vez por dia (06:00)
- Processa apenas usuários com `rendaMensal > 0`
- Usa índice único para evitar duplicidade
- Atualiza apenas a transação vinculada ao `RendaMensalRegistro`; receitas manuais não são alteradas

---

## Resumo dos Arquivos

| Arquivo | Tipo | Ação |
|---------|------|------|
| `RendaMensalRegistro.java` | Entity | **CRIADO** |
| `RendaMensalRegistroRepository.java` | Repository | **CRIADO** |
| `RendaMensalJobs.java` | Job | **CRIADO/MOVIDO** |
| `RendaMensalController.java` | Controller | **CRIADO** |
| `RendaMensalStatusResponse.java` | DTO | **CRIADO** |
| `FinancasApplication.java` | Application | **MODIFICADO** (adicionado @EnableScheduling) |
| `AuthService.java` | Service | **MODIFICADO** (dispara job no cadastro) |
| `UsuarioService.java` | Service | **MODIFICADO** (dispara job ao salvar perfil) |
| `Perfil.tsx` | Frontend | **MODIFICADO** (botão para lançar renda do mês) |
| `servicoRendaMensal.ts` | Frontend Service | **CRIADO** |

---

## Autor

Sistema Finanças Simples - TCC 2026
