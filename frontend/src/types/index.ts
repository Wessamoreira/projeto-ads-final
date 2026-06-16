/* ============================================================================
   Tipos TypeScript usados no frontend (espelham os DTOs do backend).
   ============================================================================ */

// ----------------------------------------------------------------------------
// Usuario e autenticacao
// ----------------------------------------------------------------------------
export interface Usuario {
  id: string
  nome: string
  email: string
  rendaMensal?: number
  createdAt?: string
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface RegistroRequest {
  nome: string
  email: string
  senha: string
  rendaMensal?: number
}

export interface LoginResponse {
  accessToken: string
  tokenType?: string
  expiresIn?: number
  usuario: Usuario
}

// ----------------------------------------------------------------------------
// Categoria e transacao
// ----------------------------------------------------------------------------
export type TipoTransacao = 'RECEITA' | 'DESPESA'

export interface Categoria {
  id: string
  nome: string
  icone?: string
  cor?: string
  corHex?: string
  tipo: TipoTransacao
  orcamento?: number
  descricao?: string
}

export interface CategoriaRequest {
  nome: string
  icone?: string
  cor?: string
  tipo: TipoTransacao
  orcamento?: number
  descricao?: string
}

export interface Transacao {
  id: string
  tipo: TipoTransacao
  valor: number
  descricao?: string
  dataTransacao: string
  categoria: Categoria
  createdAt?: string
}

export interface TransacaoRequest {
  tipo: TipoTransacao
  valor: number
  descricao?: string
  dataTransacao: string
  categoriaId: string
}

// ----------------------------------------------------------------------------
// Casal (vinculo entre dois usuarios)
// ----------------------------------------------------------------------------
export type StatusVinculo = 'PENDENTE' | 'ATIVO' | 'DESVINCULADO'

/** A outra pessoa do casal, do ponto de vista do usuario logado. */
export interface Parceiro {
  id: string
  nome: string
  email: string
}

export interface CasalVinculo {
  id: string
  status: StatusVinculo
  parceiro: Parceiro | null
  /** true se foi o usuario logado quem enviou o convite. */
  euConvidei: boolean
  vinculadoEm?: string
  createdAt?: string
}

/** Situacao completa do casal, devolvida por GET /api/v1/casal/status. */
export interface CasalStatus {
  vinculoAtivo: CasalVinculo | null
  convitePendenteEnviado: CasalVinculo | null
  convitesRecebidos: CasalVinculo[]
}

export interface ConvidarParceiroRequest {
  email: string
}

// ---- Visao financeira combinada do casal ----

/** Quanto cada parceiro lancou no mes. */
export interface PessoaResumo {
  nome: string
  receitas: number
  despesas: number
}

/** Acerto para dividir as despesas do mes meio a meio. */
export interface Divisao {
  equilibrado: boolean
  quemDeve: string | null
  quemRecebe: string | null
  valor: number
}

export interface CasalFinancas {
  periodo: string
  rendaCombinada: number
  receitasMes: number
  despesasMes: number
  saldoMes: number
  saldoTotal: number
  gastosPorCategoria: GastoCategoria[]
  porPessoa: PessoaResumo[]
  divisao: Divisao
}

/** Objetivo (meta) compartilhado do casal. */
export interface MetaCasal {
  id: string
  titulo: string
  valorAlvo: number
  valorAtual: number
  percentual: number
  concluida: boolean
  createdAt?: string
}

export interface MetaCasalRequest {
  titulo: string
  valorAlvo: number
}

// ----------------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------------
export interface GastoCategoria {
  categoria: string
  categoriaId?: string
  valor: number
  percentual: number
  cor: string
  icone?: string
}

export interface FluxoCaixa {
  data: string
  periodo: string
  receitas: number
  despesas: number
  saldo: number
}

export interface DashboardResponse {
  saldoAtual: number
  receitasMes: number
  despesasMes: number
  saldoMes: number
  periodo: string
  gastosPorCategoria: GastoCategoria[]
  fluxoCaixa: FluxoCaixa[]
}

// ----------------------------------------------------------------------------
// Paginacao (formato padrao do Spring Data)
// ----------------------------------------------------------------------------
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ----------------------------------------------------------------------------
// Utilitarios de UI (usados por SummaryCard/StatusBadge)
// ----------------------------------------------------------------------------
export type SemaforoStatus = 'positive' | 'warning' | 'danger'

export interface SelectOption<T = string | number> {
  label: string
  value: T
  icon?: string
  disabled?: boolean
  description?: string
}
