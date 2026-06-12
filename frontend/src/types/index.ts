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
