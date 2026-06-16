package com.financas.dto;

import com.financas.dto.DashboardResponse.GastoCategoria;

import java.math.BigDecimal;
import java.util.List;

/**
 * Visao financeira combinada do casal (junta os dois parceiros).
 *
 * @param periodo            mes de referencia (yyyy-MM)
 * @param rendaCombinada     soma da renda mensal cadastrada dos dois
 * @param receitasMes        receitas lancadas pelos dois no mes
 * @param despesasMes        despesas lancadas pelos dois no mes
 * @param saldoMes           receitasMes - despesasMes
 * @param saldoTotal         saldo de todo o historico dos dois
 * @param gastosPorCategoria despesas do casal agrupadas por categoria
 * @param porPessoa          quanto cada parceiro lancou no mes
 * @param divisao            quem deve quanto para dividir as despesas meio a meio
 */
public record CasalFinancasResponse(
        String periodo,
        BigDecimal rendaCombinada,
        BigDecimal receitasMes,
        BigDecimal despesasMes,
        BigDecimal saldoMes,
        BigDecimal saldoTotal,
        List<GastoCategoria> gastosPorCategoria,
        List<PessoaResumo> porPessoa,
        Divisao divisao
) {

    /** Resumo do que um parceiro lancou no mes. */
    public record PessoaResumo(
            String nome,
            BigDecimal receitas,
            BigDecimal despesas
    ) {}

    /**
     * Acerto de contas para dividir as despesas do mes meio a meio.
     *
     * @param equilibrado true se ja esta empatado (ninguem deve nada)
     * @param quemDeve    nome de quem precisa transferir
     * @param quemRecebe  nome de quem vai receber
     * @param valor       quanto transferir para empatar
     */
    public record Divisao(
            boolean equilibrado,
            String quemDeve,
            String quemRecebe,
            BigDecimal valor
    ) {}
}
