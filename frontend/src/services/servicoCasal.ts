import api from './api'
import type {
  CasalFinancas,
  CasalStatus,
  CasalVinculo,
  ConvidarParceiroRequest,
  MetaCasal,
  MetaCasalRequest,
} from '../types'

/**
 * Chamadas a API do casal (/api/v1/casal).
 *
 * Fluxo: convidar uma pessoa pelo e-mail -> ela aceita/recusa -> vinculo ativo.
 */
export const casalService = {
  /** Situacao completa: vinculo ativo + convites enviados/recebidos. */
  async status(): Promise<CasalStatus> {
    const { data } = await api.get<CasalStatus>('/api/v1/casal/status')
    return data
  },

  /** Convida uma pessoa pelo e-mail. */
  async convidar(dados: ConvidarParceiroRequest): Promise<CasalVinculo> {
    const { data } = await api.post<CasalVinculo>('/api/v1/casal/convites', dados)
    return data
  },

  /** Aceita um convite recebido. */
  async aceitar(conviteId: string): Promise<CasalVinculo> {
    const { data } = await api.post<CasalVinculo>(`/api/v1/casal/convites/${conviteId}/aceitar`, {})
    return data
  },

  /** Recusa um convite recebido. */
  async recusar(conviteId: string): Promise<void> {
    await api.post(`/api/v1/casal/convites/${conviteId}/recusar`, {})
  },

  /** Cancela um convite que o proprio usuario enviou. */
  async cancelar(conviteId: string): Promise<void> {
    await api.delete(`/api/v1/casal/convites/${conviteId}`)
  },

  /** Desfaz o vinculo ativo. */
  async desvincular(): Promise<void> {
    await api.delete('/api/v1/casal')
  },

  // ---- Visao financeira combinada ----

  /** Resumo financeiro do casal no mes (renda combinada, despesas, divisao...). */
  async financas(periodo?: string): Promise<CasalFinancas> {
    const params = periodo ? `?periodo=${periodo}` : ''
    const { data } = await api.get<CasalFinancas>(`/api/v1/casal/financas${params}`)
    return data
  },

  // ---- Objetivos (metas) compartilhados ----

  async listarMetas(): Promise<MetaCasal[]> {
    const { data } = await api.get<MetaCasal[]>('/api/v1/casal/metas')
    return data
  },

  async criarMeta(dados: MetaCasalRequest): Promise<MetaCasal> {
    const { data } = await api.post<MetaCasal>('/api/v1/casal/metas', dados)
    return data
  },

  async adicionarValorMeta(metaId: string, valor: number): Promise<MetaCasal> {
    const { data } = await api.post<MetaCasal>(`/api/v1/casal/metas/${metaId}/adicionar`, { valor })
    return data
  },

  async excluirMeta(metaId: string): Promise<void> {
    await api.delete(`/api/v1/casal/metas/${metaId}`)
  },
}

export default casalService
