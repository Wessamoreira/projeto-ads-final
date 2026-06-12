package com.financas.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Resumo financeiro mostrado na tela inicial (Dashboard).
 */
public record DashboardResponse(
        BigDecimal saldoAtual,        // receitas - despesas (todo o historico)
        BigDecimal receitasMes,       // total de receitas do mes
        BigDecimal despesasMes,       // total de despesas do mes
        BigDecimal saldoMes,          // receitas do mes - despesas do mes
        String periodo,               // mes de referencia (yyyy-MM)
        List<GastoCategoria> gastosPorCategoria,
        List<FluxoCaixa> fluxoCaixa
) {

    /** Quanto foi gasto em cada categoria (para o grafico de pizza). */
    public record GastoCategoria(
            String categoria,
            String categoriaId,
            BigDecimal valor,
            double percentual,
            String cor,
            String icone
    ) {}

    /** Receitas x despesas de um mes (para o grafico de barras/linha). */
    public record FluxoCaixa(
            String data,        // yyyy-MM
            String periodo,     // rotulo curto (ex: "Mai")
            BigDecimal receitas,
            BigDecimal despesas,
            BigDecimal saldo
    ) {}
}
