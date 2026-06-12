import api from './api'
import type { Usuario } from '../types'

export interface AtualizarPerfilRequest {
  nome: string
  rendaMensal?: number
}

export interface AlterarSenhaRequest {
  senhaAtual: string
  novaSenha: string
}

/**
 * Chamadas a API do perfil do usuario (/api/v1/usuarios).
 */
export const usuarioService = {
  async getMe(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/api/v1/usuarios/perfil')
    return data
  },

  async atualizarPerfil(dados: AtualizarPerfilRequest): Promise<Usuario> {
    const { data } = await api.put<Usuario>('/api/v1/usuarios/perfil', dados)
    return data
  },

  async alterarSenha(dados: AlterarSenhaRequest): Promise<void> {
    await api.put('/api/v1/usuarios/senha', dados)
  },
}

export default usuarioService
