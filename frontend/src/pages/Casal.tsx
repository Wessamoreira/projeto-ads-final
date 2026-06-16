import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dialog } from 'primereact/dialog'
import { PageHeader, GlassCard, MoneyValue, EmptyState, ConfirmDialog, toast } from '../components/common'
import { casalService } from '../services/servicoCasal'
import { formatarData } from '../utils/formato'
import type { CasalFinancas, CasalStatus, MetaCasal } from '../types'

/** Extrai a mensagem de erro vinda do backend (ou usa um texto padrao). */
function mensagemErro(error: unknown, padrao: string): string {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? padrao
}

/** Iniciais do nome para o avatar. */
function iniciais(nome?: string): string {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.charAt(0) ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''
  return (primeira + ultima).toUpperCase() || '?'
}

/** Formata um LocalDateTime (com 'T') ou data ISO como dd/MM/yyyy. */
function dataCurta(iso?: string): string {
  if (!iso) return '-'
  return formatarData(iso.slice(0, 10))
}

/**
 * Tela do Casal: convide uma pessoa pelo e-mail e, quando vinculados, veja as
 * financas dos dois juntas (renda combinada, despesas, divisao e objetivos).
 */
const Casal = () => {
  const [status, setStatus] = useState<CasalStatus | null>(null)
  const [financas, setFinancas] = useState<CasalFinancas | null>(null)
  const [metas, setMetas] = useState<MetaCasal[]>([])
  const [carregando, setCarregando] = useState(true)

  const [email, setEmail] = useState('')
  const [convidando, setConvidando] = useState(false)
  const [acaoEmId, setAcaoEmId] = useState<string | null>(null)
  const [confirmarDesfazer, setConfirmarDesfazer] = useState(false)

  // Metas
  const [dialogMeta, setDialogMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState({ titulo: '', valorAlvo: null as number | null })
  const [salvandoMeta, setSalvandoMeta] = useState(false)
  const [metaParaSomar, setMetaParaSomar] = useState<MetaCasal | null>(null)
  const [valorSomar, setValorSomar] = useState<number | null>(null)
  const [excluirMetaId, setExcluirMetaId] = useState<string | null>(null)

  const carregar = () => {
    setCarregando(true)
    casalService.status()
      .then(async (s) => {
        setStatus(s)
        if (s.vinculoAtivo) {
          const [fin, mt] = await Promise.all([
            casalService.financas().catch(() => null),
            casalService.listarMetas().catch(() => []),
          ])
          setFinancas(fin)
          setMetas(mt)
        } else {
          setFinancas(null)
          setMetas([])
        }
      })
      .catch(() => toast.error('Erro', 'Não foi possível carregar os dados do casal'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  // ---------- Convites ----------
  const convidar = async () => {
    if (!email.trim()) {
      toast.warn('Atenção', 'Informe o e-mail da pessoa que deseja convidar')
      return
    }
    setConvidando(true)
    try {
      await casalService.convidar({ email: email.trim() })
      toast.success('Convite enviado', 'Aguarde a outra pessoa aceitar')
      setEmail('')
      carregar()
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível enviar o convite'))
    } finally {
      setConvidando(false)
    }
  }

  const acaoConvite = async (id: string, fn: () => Promise<unknown>, ok: string, okMsg: string) => {
    setAcaoEmId(id)
    try {
      await fn()
      toast.success(ok, okMsg)
      carregar()
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível concluir a ação'))
    } finally {
      setAcaoEmId(null)
    }
  }

  const desfazer = async () => {
    try {
      await casalService.desvincular()
      toast.info('Vínculo desfeito', 'Vocês não estão mais vinculados')
      carregar()
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível desfazer o vínculo'))
    } finally {
      setConfirmarDesfazer(false)
    }
  }

  // ---------- Metas ----------
  const criarMeta = async () => {
    if (!novaMeta.titulo.trim() || !novaMeta.valorAlvo) {
      toast.warn('Atenção', 'Informe o título e o valor do objetivo')
      return
    }
    setSalvandoMeta(true)
    try {
      await casalService.criarMeta({ titulo: novaMeta.titulo.trim(), valorAlvo: novaMeta.valorAlvo })
      toast.success('Pronto', 'Objetivo criado')
      setDialogMeta(false)
      setNovaMeta({ titulo: '', valorAlvo: null })
      casalService.listarMetas().then(setMetas)
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível criar o objetivo'))
    } finally {
      setSalvandoMeta(false)
    }
  }

  const somarNaMeta = async () => {
    if (!metaParaSomar || !valorSomar) {
      toast.warn('Atenção', 'Informe o valor')
      return
    }
    setSalvandoMeta(true)
    try {
      await casalService.adicionarValorMeta(metaParaSomar.id, valorSomar)
      toast.success('Pronto', 'Valor adicionado ao objetivo')
      setMetaParaSomar(null)
      setValorSomar(null)
      casalService.listarMetas().then(setMetas)
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível adicionar o valor'))
    } finally {
      setSalvandoMeta(false)
    }
  }

  const excluirMeta = async () => {
    if (!excluirMetaId) return
    try {
      await casalService.excluirMeta(excluirMetaId)
      toast.success('Pronto', 'Objetivo removido')
      casalService.listarMetas().then(setMetas)
    } catch (error) {
      toast.error('Erro', mensagemErro(error, 'Não foi possível remover o objetivo'))
    } finally {
      setExcluirMetaId(null)
    }
  }

  const ativo = status?.vinculoAtivo ?? null
  const enviado = status?.convitePendenteEnviado ?? null
  const recebidos = status?.convitesRecebidos ?? []

  const acaoCabecalho = ativo ? (
    <Button label="Desfazer vínculo" icon="pi pi-times" severity="danger" outlined
      onClick={() => setConfirmarDesfazer(true)} />
  ) : undefined

  return (
    <div className="page-container">
      <PageHeader title="Casal" subtitle="Finanças compartilhadas do casal" actions={acaoCabecalho} />

      {carregando ? (
        <GlassCard noHover className="casal-loading">
          <i className="pi pi-spin pi-spinner" /> <span>Carregando...</span>
        </GlassCard>
      ) : ativo ? (
        /* ======================= VÍNCULO ATIVO ======================= */
        <>
          {/* Cabeçalho do casal */}
          <GlassCard noHover bordered className="casal-parceiro">
            <span className="casal-avatar">{iniciais(ativo.parceiro?.nome)}</span>
            <div className="casal-parceiro__info">
              <strong>Você e {ativo.parceiro?.nome}</strong>
              <span className="text-secondary text-sm">
                Vinculados desde {dataCurta(ativo.vinculadoEm)} · {ativo.parceiro?.email}
              </span>
            </div>
          </GlassCard>

          {/* Indicadores combinados */}
          {financas && (
            <>
              <div className="grid mt-3">
                {[
                  { label: 'Renda combinada', valor: financas.rendaCombinada, variant: 'default' as const },
                  { label: 'Receitas do mês', valor: financas.receitasMes, variant: 'positive' as const },
                  { label: 'Despesas do mês', valor: financas.despesasMes, variant: 'negative' as const },
                  { label: 'Saldo do mês', valor: financas.saldoMes, variant: (financas.saldoMes >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' },
                ].map((k) => (
                  <div key={k.label} className="col-12 sm:col-6 lg:col-3">
                    <GlassCard noHover className="kpi">
                      <span className="kpi__label">{k.label}</span>
                      <MoneyValue value={k.valor} size="xl" variant={k.variant} />
                    </GlassCard>
                  </div>
                ))}
              </div>

              <div className="grid mt-2">
                {/* Quem gastou quanto / divisão */}
                <div className="col-12 lg:col-6">
                  <GlassCard noHover className="bloco">
                    <h3 className="bloco__title">Quem gastou quanto</h3>
                    <div className="lista">
                      {financas.porPessoa.map((p, i) => (
                        <div key={i} className="pessoa">
                          <span className="casal-avatar casal-avatar--sm">{iniciais(p.nome)}</span>
                          <div className="pessoa__info">
                            <strong>{p.nome.split(' ')[0]}</strong>
                            <span className="text-muted text-xs">Receitas {p.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <MoneyValue value={p.despesas} size="sm" variant="negative" />
                        </div>
                      ))}
                    </div>
                    <div className={`divisao ${financas.divisao.equilibrado ? 'divisao--ok' : ''}`}>
                      {financas.divisao.equilibrado ? (
                        <span><i className="pi pi-check-circle" /> Despesas equilibradas no mês.</span>
                      ) : (
                        <span>
                          <i className="pi pi-arrow-right-arrow-left" /> {' '}
                          <strong>{financas.divisao.quemDeve}</strong> transfere{' '}
                          <strong>{financas.divisao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>{' '}
                          para <strong>{financas.divisao.quemRecebe}</strong> para dividir as despesas.
                        </span>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Gastos por categoria */}
                <div className="col-12 lg:col-6">
                  <GlassCard noHover className="bloco">
                    <h3 className="bloco__title">Gastos por categoria</h3>
                    {financas.gastosPorCategoria.length === 0 ? (
                      <EmptyState icon="pi-chart-pie" title="Sem despesas neste mês"
                        description="As despesas dos dois aparecem aqui agrupadas por categoria." />
                    ) : (
                      <div className="categorias">
                        {financas.gastosPorCategoria.map((g) => (
                          <div key={g.categoriaId} className="categoria">
                            <div className="categoria__top">
                              <span className="categoria__dot" style={{ background: g.cor }} />
                              <span className="categoria__nome">{g.categoria}</span>
                              <span className="text-secondary text-sm">
                                {g.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                            <div className="barra">
                              <div className="barra__fill" style={{ width: `${g.percentual}%`, background: g.cor }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>

              {/* Objetivos compartilhados */}
              <GlassCard noHover className="bloco mt-2">
                <div className="bloco__head">
                  <h3 className="bloco__title m-0">Objetivos do casal</h3>
                  <Button label="Novo objetivo" icon="pi pi-plus" size="small"
                    onClick={() => { setNovaMeta({ titulo: '', valorAlvo: null }); setDialogMeta(true) }} />
                </div>
                {metas.length === 0 ? (
                  <EmptyState icon="pi-flag" title="Nenhum objetivo"
                    description="Criem um objetivo de economia em conjunto e acompanhem o progresso."
                    actionLabel="Novo objetivo"
                    onAction={() => { setNovaMeta({ titulo: '', valorAlvo: null }); setDialogMeta(true) }} />
                ) : (
                  <div className="metas">
                    {metas.map((m) => (
                      <div key={m.id} className="meta">
                        <div className="meta__top">
                          <strong>{m.titulo}</strong>
                          {m.concluida && <span className="text-positive text-xs"><i className="pi pi-check" /> Concluído</span>}
                          <div className="meta__acoes">
                            <Button icon="pi pi-plus" rounded text size="small" aria-label="Adicionar valor"
                              onClick={() => { setMetaParaSomar(m); setValorSomar(null) }} />
                            <Button icon="pi pi-trash" rounded text severity="danger" size="small" aria-label="Excluir"
                              onClick={() => setExcluirMetaId(m.id)} />
                          </div>
                        </div>
                        <div className="barra">
                          <div className="barra__fill barra__fill--brand" style={{ width: `${Math.min(100, m.percentual)}%` }} />
                        </div>
                        <div className="meta__valores text-secondary text-sm">
                          <span>
                            {m.valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            {' de '}
                            {m.valorAlvo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span>{m.percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </>
      ) : (
        /* ======================= SEM VÍNCULO ======================= */
        <>
          {/* Convite enviado (aguardando) */}
          {enviado && (
            <GlassCard noHover bordered className="estado">
              <span className="casal-avatar casal-avatar--warn"><i className="pi pi-clock" /></span>
              <div className="estado__info">
                <strong>Aguardando {enviado.parceiro?.nome?.split(' ')[0]}</strong>
                <span className="text-secondary text-sm">
                  Convite enviado para {enviado.parceiro?.email}.
                </span>
              </div>
              <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined
                loading={acaoEmId === enviado.id}
                onClick={() => acaoConvite(enviado.id, () => casalService.cancelar(enviado.id), 'Cancelado', 'Convite cancelado')} />
            </GlassCard>
          )}

          {/* Convites recebidos */}
          {recebidos.length > 0 && (
            <GlassCard noHover className="bloco mt-3">
              <h3 className="bloco__title">Convites recebidos</h3>
              <div className="lista">
                {recebidos.map((c) => (
                  <div key={c.id} className="pessoa">
                    <span className="casal-avatar casal-avatar--sm">{iniciais(c.parceiro?.nome)}</span>
                    <div className="pessoa__info">
                      <strong>{c.parceiro?.nome}</strong>
                      <span className="text-muted text-xs">{c.parceiro?.email} convidou você</span>
                    </div>
                    <div className="pessoa__acoes">
                      <Button label="Aceitar" icon="pi pi-check" size="small" loading={acaoEmId === c.id}
                        onClick={() => acaoConvite(c.id, () => casalService.aceitar(c.id), 'Pronto', 'Vocês agora estão vinculados')} />
                      <Button label="Recusar" size="small" severity="secondary" text loading={acaoEmId === c.id}
                        onClick={() => acaoConvite(c.id, () => casalService.recusar(c.id), 'Recusado', 'Convite recusado')} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Formulário de convite */}
          {!enviado && (
            <GlassCard noHover className="bloco mt-3">
              <h3 className="bloco__title">Convidar parceiro(a)</h3>
              <p className="text-secondary text-sm mt-0">
                Informe o e-mail de uma conta já cadastrada. Quando o convite for aceito, a renda e os gastos
                dos dois passam a aparecer somados nesta página.
              </p>
              <div className="convite-form">
                <InputText value={email} type="email" placeholder="email@exemplo.com" className="flex-1"
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') convidar() }} />
                <Button label="Convidar" icon="pi pi-send" loading={convidando} onClick={convidar} />
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* ---------- Dialogs ---------- */}
      <Dialog header="Novo objetivo" visible={dialogMeta} onHide={() => setDialogMeta(false)}
        style={{ width: '420px' }} modal>
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-2">
            <label>Título</label>
            <InputText value={novaMeta.titulo} placeholder="Ex: Reserva de emergência"
              onChange={(e) => setNovaMeta({ ...novaMeta, titulo: e.target.value })} />
          </div>
          <div className="flex flex-column gap-2">
            <label>Valor do objetivo</label>
            <InputNumber value={novaMeta.valorAlvo} mode="currency" currency="BRL" locale="pt-BR" placeholder="R$ 0,00"
              onValueChange={(e) => setNovaMeta({ ...novaMeta, valorAlvo: e.value ?? null })} />
          </div>
          <div className="flex justify-content-end gap-2 mt-2">
            <Button label="Cancelar" text onClick={() => setDialogMeta(false)} />
            <Button label="Criar" icon="pi pi-check" loading={salvandoMeta} onClick={criarMeta} />
          </div>
        </div>
      </Dialog>

      <Dialog header={`Adicionar em "${metaParaSomar?.titulo ?? ''}"`} visible={metaParaSomar !== null}
        onHide={() => setMetaParaSomar(null)} style={{ width: '420px' }} modal>
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-2">
            <label>Valor a adicionar</label>
            <InputNumber value={valorSomar} mode="currency" currency="BRL" locale="pt-BR" placeholder="R$ 0,00"
              onValueChange={(e) => setValorSomar(e.value ?? null)} />
          </div>
          <div className="flex justify-content-end gap-2 mt-2">
            <Button label="Cancelar" text onClick={() => setMetaParaSomar(null)} />
            <Button label="Adicionar" icon="pi pi-check" loading={salvandoMeta} onClick={somarNaMeta} />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog visible={confirmarDesfazer} onHide={() => setConfirmarDesfazer(false)} onConfirm={desfazer}
        title="Desfazer vínculo" message="Tem certeza que deseja desfazer o vínculo do casal?"
        icon="pi-times" iconColor="var(--color-danger)" confirmLabel="Desfazer" confirmClass="p-button-danger" />

      <ConfirmDialog visible={excluirMetaId !== null} onHide={() => setExcluirMetaId(null)} onConfirm={excluirMeta}
        title="Excluir objetivo" message="Tem certeza que deseja remover este objetivo?"
        icon="pi-trash" iconColor="var(--color-danger)" confirmLabel="Excluir" confirmClass="p-button-danger" />

      <style>{`
        .casal-loading {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          color: var(--text-secondary); padding: var(--spacing-xl);
        }

        .casal-avatar {
          width: 44px; height: 44px; flex-shrink: 0; display: inline-flex; align-items: center;
          justify-content: center; border-radius: var(--border-radius-md);
          background: var(--bg-surface); border: 1px solid var(--border-default);
          color: var(--text-primary); font-weight: 600; font-size: 0.95rem;
        }
        .casal-avatar--sm { width: 38px; height: 38px; font-size: 0.85rem; }
        .casal-avatar--warn { color: var(--color-warning); }

        .casal-parceiro { display: flex; align-items: center; gap: var(--spacing-md); padding: 1.125rem 1.25rem; }
        .casal-parceiro__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .casal-parceiro__info strong { color: var(--text-primary); }

        .bloco { padding: 1.25rem 1.375rem; }
        .bloco__title { font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-md); }
        .bloco__head { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }

        .lista { display: flex; flex-direction: column; gap: var(--spacing-sm); }
        .pessoa { display: flex; align-items: center; gap: var(--spacing-md); }
        .pessoa__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .pessoa__info strong { color: var(--text-primary); font-size: var(--font-size-sm); }
        .pessoa__acoes { display: flex; gap: var(--spacing-sm); }

        .divisao {
          margin-top: var(--spacing-md); padding: 0.75rem 1rem; line-height: 1.5;
          background: var(--color-warning-bg); border: 1px solid var(--color-warning-border);
          border-radius: var(--border-radius-md); font-size: var(--font-size-sm); color: var(--text-secondary);
        }
        .divisao strong { color: var(--text-primary); }
        .divisao i { margin-right: 4px; }
        .divisao--ok { background: var(--color-positive-bg); border-color: var(--color-positive-border); color: var(--color-positive); }

        .categorias { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .categoria__top { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 0.4rem; }
        .categoria__dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .categoria__nome { flex: 1; color: var(--text-primary); font-size: var(--font-size-sm); }

        .barra { height: 8px; background: var(--bg-content); border-radius: var(--border-radius-full); overflow: hidden; }
        .barra__fill { height: 100%; border-radius: var(--border-radius-full); }
        .barra__fill--brand { background: var(--accent-primary); transition: width var(--transition-normal); }

        .metas { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .meta { padding: 1rem 1.125rem; border: 1px solid var(--border-subtle); border-radius: var(--border-radius-md); background: var(--bg-content); }
        .meta__top { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 0.625rem; }
        .meta__top strong { flex: 1; color: var(--text-primary); font-size: var(--font-size-sm); }
        .meta__acoes { display: flex; gap: 2px; }
        .meta__valores { display: flex; justify-content: space-between; margin-top: 0.45rem; }

        .estado { display: flex; align-items: center; gap: var(--spacing-md); padding: 1.125rem 1.25rem; }
        .estado__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .estado__info strong { color: var(--text-primary); }

        .convite-form { display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm); }

        @media (max-width: 576px) {
          .convite-form { flex-direction: column; }
          .estado, .pessoa { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  )
}

export default Casal
