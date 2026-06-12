import { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { PageHeader, GlassCard, toast } from '../components/common'
import { useAuthStore } from '../store/autenticacao'
import { usuarioService } from '../services/servicoUsuario'
import { rendaMensalService } from '../services/servicoRendaMensal'
import { formatApiError } from '../services/api'

/**
 * Tela de perfil (versao enxuta): mostra os dados da conta,
 * permite editar nome/renda e trocar a senha.
 */
const Perfil = () => {
  const { user, updateUser } = useAuthStore()

  // Formulario de dados
  const [nome, setNome] = useState(user?.nome ?? '')
  const [rendaMensal, setRendaMensal] = useState<number | null>(user?.rendaMensal ?? null)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [executandoRenda, setExecutandoRenda] = useState(false)

  // Formulario de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const inicial = (user?.nome || user?.email || 'U').trim().charAt(0).toUpperCase()

  const salvarDadosPerfil = async () => {
    if (!nome.trim()) {
      toast.warn('Atenção', 'Informe seu nome')
      return null
    }

    const atualizado = await usuarioService.atualizarPerfil({
      nome: nome.trim(),
      rendaMensal: rendaMensal ?? undefined,
    })
    updateUser(atualizado)   // atualiza o nome no cabeçalho e na lateral
    return atualizado
  }

  const salvarPerfil = async () => {
    setSalvandoPerfil(true)
    try {
      const atualizado = await salvarDadosPerfil()
      if (atualizado) toast.success('Pronto', 'Perfil atualizado')
    } catch (error) {
      toast.error('Erro', formatApiError(error))
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const forcarLancamentoRenda = async () => {
    if (!rendaMensal || rendaMensal <= 0) {
      toast.warn('Atenção', 'Informe uma renda mensal maior que zero')
      return
    }

    setExecutandoRenda(true)
    try {
      const rendaAlterada = rendaMensal !== (user?.rendaMensal ?? null)
      const perfilAlterado = nome.trim() !== (user?.nome ?? '') || rendaAlterada
      if (perfilAlterado) {
        const atualizado = await salvarDadosPerfil()
        if (!atualizado) return
        if (rendaAlterada) {
          toast.success('Pronto', 'Renda mensal salva nas transações do mês')
          return
        }
      }

      const mensagem = await rendaMensalService.executarAgora()
      toast.success('Pronto', mensagem)
    } catch (error) {
      toast.error('Erro', formatApiError(error))
    } finally {
      setExecutandoRenda(false)
    }
  }

  const trocarSenha = async () => {
    if (!senhaAtual || !novaSenha) {
      toast.warn('Atenção', 'Preencha a senha atual e a nova senha')
      return
    }
    if (novaSenha.length < 6) {
      toast.warn('Atenção', 'A nova senha deve ter no mínimo 6 caracteres')
      return
    }
    setSalvandoSenha(true)
    try {
      await usuarioService.alterarSenha({ senhaAtual, novaSenha })
      setSenhaAtual('')
      setNovaSenha('')
      toast.success('Pronto', 'Senha alterada')
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error('Erro', msg ?? 'Não foi possível alterar a senha')
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Meu perfil" subtitle="Seus dados e segurança" />

      {/* Faixa de identificacao */}
      <GlassCard noHover className="flex align-items-center gap-3 p-3 mb-3">
        <span className="perfil-avatar">{inicial}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{user?.nome}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{user?.email}</div>
        </div>
      </GlassCard>

      <div className="grid">
        {/* Dados pessoais */}
        <div className="col-12 lg:col-6">
          <GlassCard noHover className="p-4">
            <h3 style={{ marginTop: 0 }}>Dados pessoais</h3>
            <div className="flex flex-column gap-3">
              <div className="flex flex-column gap-2">
                <label>Nome</label>
                <InputText value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="flex flex-column gap-2">
                <label>E-mail</label>
                <InputText value={user?.email ?? ''} disabled />
                <small style={{ color: 'var(--text-muted)' }}>O e-mail não pode ser alterado.</small>
              </div>
              <div className="flex flex-column gap-2">
                <label>Renda mensal</label>
                <InputNumber value={rendaMensal}
                  onValueChange={e => setRendaMensal(e.value ?? null)}
                  mode="currency" currency="BRL" locale="pt-BR" placeholder="R$ 0,00" />
              </div>
              <div className="flex flex-wrap justify-content-end gap-2">
                <Button label="Lançar renda do mês" icon="pi pi-refresh" outlined
                  loading={executandoRenda} disabled={salvandoPerfil} onClick={forcarLancamentoRenda} />
                <Button label="Salvar dados" icon="pi pi-check"
                  loading={salvandoPerfil} disabled={executandoRenda} onClick={salvarPerfil} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Seguranca / trocar senha */}
        <div className="col-12 lg:col-6">
          <GlassCard noHover className="p-4">
            <h3 style={{ marginTop: 0 }}>Segurança</h3>
            <div className="flex flex-column gap-3">
              <div className="flex flex-column gap-2">
                <label>Senha atual</label>
                <InputText type="password" value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="flex flex-column gap-2">
                <label>Nova senha</label>
                <InputText type="password" value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)} autoComplete="new-password" />
                <small style={{ color: 'var(--text-muted)' }}>Mínimo de 6 caracteres.</small>
              </div>
              <div className="flex justify-content-end">
                <Button label="Alterar senha" icon="pi pi-lock"
                  loading={salvandoSenha} onClick={trocarSenha} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <style>{`
        .perfil-avatar {
          width: 56px;
          height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--brand-soft);
          color: var(--brand);
          border: 1px solid rgba(16, 185, 129, 0.20);
          font-size: 1.35rem;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}

export default Perfil
