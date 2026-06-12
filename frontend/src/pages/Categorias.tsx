import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { ColorPicker } from 'primereact/colorpicker'
import { PageHeader, GlassCard, EmptyState, ConfirmDialog, toast } from '../components/common'
import { categoriaService } from '../services/servicoCategoria'
import type { Categoria, CategoriaRequest, TipoTransacao } from '../types'

const TIPOS = [
  { label: 'Receita', value: 'RECEITA' as TipoTransacao },
  { label: 'Despesa', value: 'DESPESA' as TipoTransacao },
]

const formVazio = {
  nome: '',
  tipo: 'DESPESA' as TipoTransacao,
  cor: '7C3AED',          // sem o '#': o ColorPicker trabalha assim
  descricao: '',
  orcamento: null as number | null,
}

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)

  const [excluirId, setExcluirId] = useState<string | null>(null)

  const carregar = () => {
    setCarregando(true)
    categoriaService.list()
      .then(setCategorias)
      .catch(() => toast.error('Erro', 'Não foi possível carregar as categorias'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  const abrirNova = () => {
    setEditandoId(null)
    setForm(formVazio)
    setDialogAberto(true)
  }

  const abrirEdicao = (c: Categoria) => {
    setEditandoId(c.id)
    setForm({
      nome: c.nome,
      tipo: c.tipo,
      cor: (c.corHex ?? c.cor ?? '#7C3AED').replace('#', ''),
      descricao: c.descricao ?? '',
      orcamento: c.orcamento ?? null,
    })
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast.warn('Atenção', 'Informe o nome da categoria')
      return
    }

    const dados: CategoriaRequest = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cor: '#' + form.cor,
      descricao: form.descricao,
      orcamento: form.orcamento ?? undefined,
    }

    setSalvando(true)
    try {
      if (editandoId) {
        await categoriaService.update(editandoId, dados)
        toast.success('Pronto', 'Categoria atualizada')
      } else {
        await categoriaService.create(dados)
        toast.success('Pronto', 'Categoria criada')
      }
      setDialogAberto(false)
      carregar()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error('Erro', msg ?? 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluirId) return
    try {
      await categoriaService.remove(excluirId)
      toast.success('Pronto', 'Categoria excluída')
      carregar()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error('Erro', msg ?? 'Não foi possível excluir')
    } finally {
      setExcluirId(null)
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Categorias"
        subtitle="Organize suas receitas e despesas"
        actions={<Button label="Nova categoria" icon="pi pi-plus" onClick={abrirNova} />}
      />

      {!carregando && categorias.length === 0 ? (
        <EmptyState title="Nenhuma categoria"
          description="Crie sua primeira categoria para classificar as transações."
          actionLabel="Nova categoria" onAction={abrirNova} />
      ) : (
        <div className="grid">
          {categorias.map(c => {
            const cor = c.corHex ?? c.cor ?? '#6B7280'
            const temOrcamento = c.orcamento !== null && c.orcamento !== undefined && c.orcamento > 0
            return (
              <div key={c.id} className="col-12 md:col-6 lg:col-4">
                <GlassCard className="cat-card">
                  <div className="cat-card__header">
                    <div className="cat-card__icon" style={{ backgroundColor: cor }}>
                      <i className={c.tipo === 'RECEITA' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'} />
                    </div>
                    <div className="cat-card__title-area">
                      <span className="cat-card__name">{c.nome}</span>
                      <span className={`cat-pill cat-pill--${c.tipo.toLowerCase()}`}>
                        {c.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                    <div className="cat-card__actions">
                      <Button icon="pi pi-pencil" rounded text severity="secondary"
                        aria-label="Editar" onClick={() => abrirEdicao(c)} />
                      <Button icon="pi pi-trash" rounded text severity="danger"
                        aria-label="Excluir" onClick={() => setExcluirId(c.id)} />
                    </div>
                  </div>

                  {(c.descricao || temOrcamento) && (
                    <div className="cat-card__body">
                      {c.descricao && (
                        <p className="cat-card__desc">{c.descricao}</p>
                      )}
                      {temOrcamento && (
                        <div className="cat-card__budget">
                          <i className="pi pi-wallet" />
                          <span>Orçamento: </span>
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.orcamento!)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog de criar/editar */}
      <Dialog
        header={editandoId ? 'Editar categoria' : 'Nova categoria'}
        visible={dialogAberto}
        onHide={() => setDialogAberto(false)}
        style={{ width: '440px' }}
        modal
      >
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-2">
            <label>Nome</label>
            <InputText value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Alimentação" />
          </div>

          <div className="flex flex-column gap-2">
            <label>Tipo</label>
            <Dropdown value={form.tipo} options={TIPOS}
              onChange={e => setForm({ ...form, tipo: e.value })} />
          </div>

          <div className="flex flex-column gap-2">
            <label>Cor</label>
            <div className="flex align-items-center gap-2">
              <ColorPicker value={form.cor}
                onChange={e => setForm({ ...form, cor: String(e.value) })} />
              <span style={{ color: 'var(--text-muted)' }}>{('#' + form.cor).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex flex-column gap-2">
            <label>Orçamento mensal (opcional)</label>
            <InputNumber value={form.orcamento}
              onValueChange={e => setForm({ ...form, orcamento: e.value ?? null })}
              mode="currency" currency="BRL" locale="pt-BR" placeholder="R$ 0,00" />
          </div>

          <div className="flex flex-column gap-2">
            <label>Descrição (opcional)</label>
            <InputText value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>

          <div className="flex justify-content-end gap-2 mt-2">
            <Button label="Cancelar" text onClick={() => setDialogAberto(false)} />
            <Button label="Salvar" icon="pi pi-check" loading={salvando} onClick={salvar} />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        visible={excluirId !== null}
        onHide={() => setExcluirId(null)}
        onConfirm={confirmarExclusao}
        title="Excluir categoria"
        message="Tem certeza que deseja excluir esta categoria?"
        icon="pi-trash"
        iconColor="var(--color-danger)"
        confirmLabel="Excluir"
        confirmClass="p-button-danger"
      />

      <style>{`
        .cat-card {
          padding: 0;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .cat-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .cat-card__header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
        }
        .cat-card__icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          font-size: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .cat-card__title-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .cat-card__name {
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cat-pill {
          align-self: flex-start;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--border-radius-full);
          letter-spacing: 0.02em;
        }
        .cat-pill--receita {
          background: var(--color-positive-bg);
          color: var(--color-positive);
          border: 1px solid var(--color-positive-border);
        }
        .cat-pill--despesa {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger-border);
        }
        .cat-card__actions {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .cat-card:hover .cat-card__actions { opacity: 1; }
        .cat-card__body {
          padding: 0 1.25rem 1rem 1.25rem;
          border-top: 1px solid var(--border-subtle);
          margin-top: -0.25rem;
          padding-top: 0.75rem;
        }
        .cat-card__desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cat-card__budget {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-content);
          border-radius: var(--border-radius-md);
        }
        .cat-card__budget i {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .cat-card__budget strong {
          color: var(--text-primary);
          font-family: var(--font-mono);
        }
        @media (max-width: 520px) {
          .cat-card__actions { opacity: 1; }
          .cat-card__header { padding: 0.875rem 1rem; }
          .cat-card__body { padding: 0 1rem 0.875rem 1rem; }
        }
      `}</style>
    </div>
  )
}

export default Categorias
