import api from './api'

/**
 * Chamadas da API de renda mensal automatica.
 */
export const rendaMensalService = {
  async executarAgora(): Promise<string> {
    const { data } = await api.post<string>('/api/renda-mensal/executar')
    return data
  },
}

export default rendaMensalService
