import api from './api'
import type { DashboardResponse } from '../types'

/**
 * Chamadas a API do dashboard (/api/v1/dashboard).
 */
export const dashboardService = {
  /**
   * @param periodo mes no formato yyyy-MM (opcional; padrao = mes atual)
   */
  async get(periodo?: string): Promise<DashboardResponse> {
    const params = periodo ? `?periodo=${periodo}` : ''
    const { data } = await api.get<DashboardResponse>(`/api/v1/dashboard${params}`)
    return data
  },
}

export default dashboardService
