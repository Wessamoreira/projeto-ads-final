import api from './api'
import type { Categoria, CategoriaRequest, TipoTransacao } from '../types'

/**
 * Chamadas a API de categorias (/api/v1/categorias).
 */
export const categoriaService = {
  async list(tipo?: TipoTransacao): Promise<Categoria[]> {
    const params = tipo ? `?tipo=${tipo}` : ''
    const { data } = await api.get<Categoria[]>(`/api/v1/categorias${params}`)
    return data
  },

  async create(dados: CategoriaRequest): Promise<Categoria> {
    const { data } = await api.post<Categoria>('/api/v1/categorias', dados)
    return data
  },

  async update(id: string, dados: CategoriaRequest): Promise<Categoria> {
    const { data } = await api.put<Categoria>(`/api/v1/categorias/${id}`, dados)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/categorias/${id}`)
  },
}

export default categoriaService
