import api from './api'
import type { PageResponse, Transacao, TransacaoRequest } from '../types'

export interface TransacaoFiltros {
  page?: number
  size?: number
  sort?: string
}

/**
 * Chamadas a API de transacoes (/api/v1/transacoes).
 */
export const transacaoService = {
  async list(filtros: TransacaoFiltros = {}): Promise<PageResponse<Transacao>> {
    const params = new URLSearchParams()
    if (filtros.page !== undefined) params.append('page', String(filtros.page))
    if (filtros.size !== undefined) params.append('size', String(filtros.size))
    if (filtros.sort) params.append('sort', filtros.sort)

    const { data } = await api.get<PageResponse<Transacao>>(`/api/v1/transacoes?${params}`)
    return data
  },

  async create(dados: TransacaoRequest): Promise<Transacao> {
    const { data } = await api.post<Transacao>('/api/v1/transacoes', dados)
    return data
  },

  async update(id: string, dados: TransacaoRequest): Promise<Transacao> {
    const { data } = await api.put<Transacao>(`/api/v1/transacoes/${id}`, dados)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/transacoes/${id}`)
  },
}

export default transacaoService
