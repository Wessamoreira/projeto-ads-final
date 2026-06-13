# Documento de Requisitos

Sistema: **Controle Financeiro Pessoal**
Tipo: Aplicação web (API REST + SPA)

## 1. Objetivo

Permitir que uma pessoa registre suas **receitas** e **despesas**, organize-as em **categorias** e acompanhe sua situação financeira por meio de um **painel** com indicadores e gráficos. O sistema também lança automaticamente a **renda mensal** do usuário como receita.

## 2. Escopo

O sistema cobre o controle financeiro individual: cada usuário acessa apenas os próprios dados. Está **fora do escopo** desta versão: contas compartilhadas, integração bancária (Open Finance), metas, simuladores, importação de extratos e notificações por e-mail.

## 3. Requisitos Funcionais (RF)

| Código | Requisito | Descrição |
|--------|-----------|-----------|
| **RF01** | Cadastrar usuário | O sistema deve permitir criar uma conta com nome, e-mail, senha e renda mensal (opcional). |
| **RF02** | Autenticar usuário | O sistema deve autenticar por e-mail e senha, retornando um token de acesso. |
| **RF03** | Impedir e-mail duplicado | O sistema não deve permitir duas contas com o mesmo e-mail. |
| **RF04** | Categorias padrão | Ao criar a conta, o sistema deve cadastrar categorias iniciais automaticamente. |
| **RF05** | Gerenciar categorias | O usuário deve poder criar, listar, editar e excluir categorias (receita ou despesa). |
| **RF06** | Proteger exclusão de categoria | O sistema não deve excluir categoria que possua transações vinculadas. |
| **RF07** | Gerenciar transações | O usuário deve poder criar, listar (paginado), editar e excluir receitas e despesas. |
| **RF08** | Vincular transação a categoria | Toda transação deve pertencer a uma categoria do próprio usuário. |
| **RF09** | Visualizar dashboard | O sistema deve exibir saldo atual, receitas e despesas do mês, gastos por categoria e fluxo de caixa de 6 meses. |
| **RF10** | Filtrar dashboard por período | O usuário deve poder consultar o resumo de um mês específico (yyyy-MM). |
| **RF11** | Gerenciar perfil | O usuário deve poder visualizar e editar nome e renda mensal. |
| **RF12** | Alterar senha | O usuário deve poder trocar a senha, confirmando a senha atual. |
| **RF13** | Lançar renda mensal automaticamente | O sistema deve lançar a renda do usuário como receita no 5º dia útil de cada mês. |
| **RF14** | Evitar renda duplicada | O sistema deve garantir um único lançamento de renda por usuário/mês. |
| **RF15** | Consultar status da renda | O usuário deve poder ver se a renda do mês já foi lançada e a próxima data prevista. |

## 4. Requisitos Não Funcionais (RNF)

| Código | Requisito | Descrição |
|--------|-----------|-----------|
| **RNF01** | Segurança da senha | As senhas devem ser armazenadas com hash **BCrypt** (salt automático), nunca em texto puro. |
| **RNF02** | Autenticação stateless | A autenticação deve usar **JWT**, sem manter sessão no servidor. |
| **RNF03** | Isolamento de dados | Cada usuário deve acessar exclusivamente os próprios dados. |
| **RNF04** | Validação de entrada | As requisições devem ser validadas (campos obrigatórios, formatos) antes do processamento. |
| **RNF05** | Documentação da API | A API deve expor documentação interativa (Swagger/OpenAPI). |
| **RNF06** | Portabilidade | O sistema deve rodar em qualquer ambiente com Java 21, Node e PostgreSQL. |
| **RNF07** | Usabilidade | A interface deve ser responsiva e exibir mensagens de erro claras ao usuário. |
| **RNF08** | Disponibilidade em nuvem | O backend deve tolerar *cold start* em hospedagem gratuita (espera e endpoint de health). |
| **RNF09** | Desempenho de listagem | A listagem de transações deve ser paginada para suportar grande volume. |

## 5. Regras de Negócio (RN)

| Código | Regra |
|--------|-------|
| **RN01** | O saldo atual é a soma de todas as receitas menos todas as despesas do histórico. |
| **RN02** | O lançamento automático de renda ocorre no 5º dia útil (segunda a sexta; feriados não considerados). |
| **RN03** | A renda mensal só é lançada se for maior que zero. |
| **RN04** | Se a renda mudar no perfil, o lançamento do mês corrente é atualizado. |
| **RN05** | O percentual de cada categoria no dashboard é calculado sobre o total de despesas do mês. |
| **RN06** | O fluxo de caixa considera os 6 meses até o período selecionado. |

## 6. Atores

| Ator | Papel |
|------|-------|
| **Visitante** | Usuário não autenticado; acessa apenas cadastro e login. |
| **Usuário** | Usuário autenticado; gerencia categorias, transações e perfil. |
| **Agendador** | Componente de sistema que dispara o lançamento automático da renda. |
