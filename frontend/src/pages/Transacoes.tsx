import { useEffect, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Calendar } from 'primereact/calendar'
import { Tag } from 'primereact/tag'
import { PageHeader, ConfirmDialog, toast } from '../components/common'
import { transacaoService } from '../services/servicoTransacao'
import { categoriaService } from '../services/servicoCategoria'
import type { Categoria, Transacao, TipoTransacao, TransacaoRequest } from '../types'
import { formatarData, formatarMoeda, paraISO } from '../utils/formato'

const TIPOS = [
  { label: 'Receita', value: 'RECEITA' as TipoTransacao },
  { label: 'Despesa', value: 'DESPESA' as TipoTransacao },
]

/** Estado inicial do formulario. */
const formVazio = {
  tipo: 'DESPESA' as TipoTransacao,
  valor: null as number | null,
  descricao: '',
  data: new Date(),
  categoriaId: '',
}

const Transacoes = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)

  // Dialog de criar/editar
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)

  // Confirmacao de exclusao
  const [excluirId, setExcluirId] = useState<string | null>(null)

  // Carrega transacoes e categorias
  const carregar = () => {
    setCarregando(true)
    Promise.all([transacaoService.list({ size: 100 }), categoriaService.list()])
      .then(([pagina, cats]) => {
        setTransacoes(pagina.content)
        setCategorias(cats)
      })
      .catch(() => toast.error('Erro', 'Não foi possível carregar as transações'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  // Categorias filtradas pelo tipo escolhido no formulario
  const categoriasDoTipo = categorias.filter(c => c.tipo === form.tipo)

  const abrirNova = () => {
    setEditandoId(null)
    setForm(formVazio)
    setDialogAberto(true)
  }

  const abrirEdicao = (t: Transacao) => {
    setEditandoId(t.id)
    setForm({
      tipo: t.tipo,
      valor: t.valor,
      descricao: t.descricao ?? '',
      data: new Date(t.dataTransacao + 'T00:00:00'),
      categoriaId: String(t.categoria.id),
    })
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!form.valor || form.valor <= 0) {
      toast.warn('Atenção', 'Informe um valor maior que zero')
      return
    }
    if (!form.categoriaId) {
      toast.warn('Atenção', 'Escolha uma categoria')
      return
    }

    const dados: TransacaoRequest = {
      tipo: form.tipo,
      valor: form.valor,
      descricao: form.descricao,
      dataTransacao: paraISO(form.data),
      categoriaId: form.categoriaId,
    }

    setSalvando(true)
    try {
      if (editandoId) {
        await transacaoService.update(editandoId, dados)
        toast.success('Pronto', 'Transação atualizada')
      } else {
        await transacaoService.create(dados)
        toast.success('Pronto', 'Transação criada')
      }
      setDialogAberto(false)
      carregar()
    } catch {
      toast.error('Erro', 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluirId) return
    try {
      await transacaoService.remove(excluirId)
      toast.success('Pronto', 'Transação excluída')
      carregar()
    } catch {
      toast.error('Erro', 'Não foi possível excluir')
    } finally {
      setExcluirId(null)
    }
  }

  // Colunas da tabela
  const colunaTipo = (t: Transacao) => (
    <Tag value={t.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
      severity={t.tipo === 'RECEITA' ? 'success' : 'danger'} />
  )
  const colunaCategoria = (t: Transacao) => t.categoria?.nome
  const colunaData = (t: Transacao) => formatarData(t.dataTransacao)
  const colunaValor = (t: Transacao) => (
    <span style={{ color: t.tipo === 'RECEITA' ? 'var(--color-positive)' : 'var(--color-danger)', fontWeight: 600 }}>
      {formatarMoeda(t.valor)}
    </span>
  )
  const colunaAcoes = (t: Transacao) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" rounded text severity="secondary"
        aria-label="Editar" onClick={() => abrirEdicao(t)} />
      <Button icon="pi pi-trash" rounded text severity="danger"
        aria-label="Excluir" onClick={() => setExcluirId(t.id)} />
    </div>
  )

  return (
    <div className="page-container">
      <PageHeader
        title="Transações"
        subtitle="Suas receitas e despesas"
        actions={<Button label="Nova transação" icon="pi pi-plus" onClick={abrirNova} />}
      />

      <DataTable value={transacoes} loading={carregando} paginator rows={10}
        emptyMessage="Nenhuma transação cadastrada" stripedRows removableSort>
        <Column header="Tipo" body={colunaTipo} style={{ width: '120px' }} />
        <Column header="Descrição" field="descricao" sortable />
        <Column header="Categoria" body={colunaCategoria} sortable />
        <Column header="Data" body={colunaData} sortable field="dataTransacao" style={{ width: '130px' }} />
        <Column header="Valor" body={colunaValor} sortable field="valor" style={{ width: '150px' }} />
        <Column header="" body={colunaAcoes} style={{ width: '110px' }} />
      </DataTable>

      {/* Dialog de criar/editar */}
      <Dialog
        header={editandoId ? 'Editar transação' : 'Nova transação'}
        visible={dialogAberto}
        onHide={() => setDialogAberto(false)}
        style={{ width: '440px' }}
        modal
      >
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-2">
            <label>Tipo</label>
            <Dropdown value={form.tipo} options={TIPOS}
              onChange={e => setForm({ ...form, tipo: e.value, categoriaId: '' })} />
          </div>

          <div className="flex flex-column gap-2">
            <label>Valor</label>
            <InputNumber value={form.valor}
              onValueChange={e => setForm({ ...form, valor: e.value ?? null })}
              mode="currency" currency="BRL" locale="pt-BR" placeholder="R$ 0,00" />
          </div>

          <div className="flex flex-column gap-2">
            <label>Descrição</label>
            <InputText value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Mercado, Salário..." />
          </div>

          <div className="flex flex-column gap-2">
            <label>Data</label>
            <Calendar value={form.data} onChange={e => setForm({ ...form, data: (e.value as Date) ?? new Date() })}
              dateFormat="dd/mm/yy" showIcon />
          </div>

          <div className="flex flex-column gap-2">
            <label>Categoria</label>
            <Dropdown value={form.categoriaId} options={categoriasDoTipo}
              optionLabel="nome" optionValue="id"
              onChange={e => setForm({ ...form, categoriaId: e.value })}
              placeholder="Escolha uma categoria"
              emptyMessage="Crie uma categoria deste tipo primeiro" />
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
        title="Excluir transação"
        message="Tem certeza que deseja excluir esta transação?"
        icon="pi-trash"
        iconColor="var(--color-danger)"
        confirmLabel="Excluir"
        confirmClass="p-button-danger"
      />
    </div>
  )
}

export default Transacoes
