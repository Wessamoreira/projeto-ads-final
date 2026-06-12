import { useEffect, useMemo, useState } from 'react'
import { Chart } from 'primereact/chart'
import { PageHeader, GlassCard, MoneyValue, ChartContainer, EmptyState } from '../components/common'
import { dashboardService } from '../services/servicoPainel'
import type { DashboardResponse } from '../types'

/**
 * Tela inicial: resumo do mes (saldo, receitas, despesas),
 * gastos por categoria (pizza) e fluxo de caixa dos ultimos meses (barras).
 */
const Painel = () => {
  const [dados, setDados] = useState<DashboardResponse | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    dashboardService
      .get()
      .then(setDados)
      .finally(() => setCarregando(false))
  }, [])

  const saldo = dados?.saldoAtual ?? 0

  // Cartoes de indicadores (KPIs)
  const kpis = [
    { label: 'Saldo atual', valor: saldo, variante: (saldo >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' },
    { label: 'Receitas do mês', valor: dados?.receitasMes ?? 0, variante: 'positive' as const },
    { label: 'Despesas do mês', valor: dados?.despesasMes ?? 0, variante: 'negative' as const },
  ]

  // Grafico de pizza (gastos por categoria)
  const dadosPizza = useMemo(() => {
    const gastos = dados?.gastosPorCategoria ?? []
    return {
      labels: gastos.map(g => g.categoria),
      datasets: [{
        data: gastos.map(g => g.valor),
        backgroundColor: gastos.map(g => g.cor),
        borderWidth: 0,
      }],
    }
  }, [dados])

  // Grafico de barras (fluxo de caixa)
  const dadosBarras = useMemo(() => {
    const fluxo = dados?.fluxoCaixa ?? []
    return {
      labels: fluxo.map(f => f.periodo),
      datasets: [
        { label: 'Receitas', data: fluxo.map(f => f.receitas), backgroundColor: '#059669', borderRadius: 6, maxBarThickness: 18 },
        { label: 'Despesas', data: fluxo.map(f => f.despesas), backgroundColor: '#DC2626', borderRadius: 6, maxBarThickness: 18 },
      ],
    }
  }, [dados])

  const opcoesBarras = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, usePointStyle: true } } },
    scales: { y: { grid: { color: 'rgba(15,23,42,0.06)' } }, x: { grid: { display: false } } },
  }
  const opcoesPizza = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, usePointStyle: true } } },
  }

  const temGastos = (dados?.gastosPorCategoria.length ?? 0) > 0

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" subtitle="Resumo financeiro do mês" />

      {/* Indicadores */}
      <div className="grid">
        {kpis.map(kpi => (
          <div key={kpi.label} className="col-12 md:col-4">
            <GlassCard noHover className="kpi">
              <span className="kpi__label">{kpi.label}</span>
              <MoneyValue value={kpi.valor} size="2xl" variant={kpi.variante} />
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Graficos */}
      <div className="grid mt-2">
        <div className="col-12 lg:col-5">
          <ChartContainer title="Gastos por categoria" subtitle="Despesas do mês"
            height={300} loading={carregando}>
            {temGastos ? (
              <Chart type="doughnut" data={dadosPizza} options={opcoesPizza} style={{ height: '100%' }} />
            ) : (
              <EmptyState title="Sem despesas neste mês"
                description="Lance uma transação para ver o gráfico." />
            )}
          </ChartContainer>
        </div>

        <div className="col-12 lg:col-7">
          <ChartContainer title="Fluxo de caixa" subtitle="Receitas x despesas (últimos 6 meses)"
            height={300} loading={carregando}>
            <Chart type="bar" data={dadosBarras} options={opcoesBarras} style={{ height: '100%' }} />
          </ChartContainer>
        </div>
      </div>

      <style>{`
        .kpi {
          padding: 1.25rem 1.375rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .kpi__label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default Painel
