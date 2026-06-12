package com.financas.service;

import com.financas.dto.DashboardResponse;
import com.financas.dto.DashboardResponse.FluxoCaixa;
import com.financas.dto.DashboardResponse.GastoCategoria;
import com.financas.entity.Categoria;
import com.financas.entity.Transacao;
import com.financas.enums.TipoTransacao;
import com.financas.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Monta o resumo financeiro do dashboard a partir das transacoes.
 *
 * <p>Tudo aqui e soma simples: separa receitas de despesas, agrupa por
 * categoria e monta o historico dos ultimos meses.</p>
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String[] MESES_CURTOS = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

    private final TransacaoRepository transacaoRepository;
    private final UsuarioService usuarioService;

    @Transactional(readOnly = true)
    public DashboardResponse gerar(String periodo) {
        UUID usuarioId = usuarioService.getLogado().getId();
        YearMonth mes = (periodo == null || periodo.isBlank())
                ? YearMonth.now()
                : YearMonth.parse(periodo);

        // Transacoes do mes escolhido
        List<Transacao> doMes = transacaoRepository.findByUsuarioIdAndDataTransacaoBetween(
                usuarioId, mes.atDay(1), mes.atEndOfMonth());

        BigDecimal receitasMes = somar(doMes, TipoTransacao.RECEITA);
        BigDecimal despesasMes = somar(doMes, TipoTransacao.DESPESA);

        // Saldo de todo o historico (desde sempre ate o fim do mes escolhido)
        List<Transacao> ateAgora = transacaoRepository.findByUsuarioIdAndDataTransacaoBetween(
                usuarioId, LocalDate.of(2000, 1, 1), mes.atEndOfMonth());
        BigDecimal saldoAtual = somar(ateAgora, TipoTransacao.RECEITA)
                .subtract(somar(ateAgora, TipoTransacao.DESPESA));

        return new DashboardResponse(
                saldoAtual,
                receitasMes,
                despesasMes,
                receitasMes.subtract(despesasMes),
                mes.toString(),
                gastosPorCategoria(doMes, despesasMes),
                fluxoCaixa(usuarioId, mes));
    }

    /** Soma os valores de um tipo (receita ou despesa). */
    private BigDecimal somar(List<Transacao> transacoes, TipoTransacao tipo) {
        return transacoes.stream()
                .filter(t -> t.getTipo() == tipo)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Agrupa as despesas do mes por categoria e calcula o percentual de cada uma. */
    private List<GastoCategoria> gastosPorCategoria(List<Transacao> doMes, BigDecimal totalDespesas) {
        Map<UUID, BigDecimal> porCategoria = new LinkedHashMap<>();
        Map<UUID, Categoria> categorias = new LinkedHashMap<>();

        for (Transacao t : doMes) {
            if (t.getTipo() != TipoTransacao.DESPESA) continue;
            Categoria c = t.getCategoria();
            porCategoria.merge(c.getId(), t.getValor(), BigDecimal::add);
            categorias.putIfAbsent(c.getId(), c);
        }

        List<GastoCategoria> resultado = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : porCategoria.entrySet()) {
            Categoria c = categorias.get(entry.getKey());
            double percentual = totalDespesas.signum() == 0
                    ? 0
                    : entry.getValue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalDespesas, 1, RoundingMode.HALF_UP)
                        .doubleValue();

            resultado.add(new GastoCategoria(
                    c.getNome(),
                    c.getId().toString(),
                    entry.getValue(),
                    percentual,
                    c.getCorHex(),
                    c.getIcone()));
        }

        // Maiores gastos primeiro
        resultado.sort((a, b) -> b.valor().compareTo(a.valor()));
        return resultado;
    }

    /** Receitas x despesas dos ultimos 6 meses (incluindo o mes escolhido). */
    private List<FluxoCaixa> fluxoCaixa(UUID usuarioId, YearMonth ate) {
        YearMonth inicio = ate.minusMonths(5);
        List<Transacao> transacoes = transacaoRepository.findByUsuarioIdAndDataTransacaoBetween(
                usuarioId, inicio.atDay(1), ate.atEndOfMonth());

        List<FluxoCaixa> fluxo = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            YearMonth m = inicio.plusMonths(i);
            BigDecimal receitas = BigDecimal.ZERO;
            BigDecimal despesas = BigDecimal.ZERO;
            for (Transacao t : transacoes) {
                if (!YearMonth.from(t.getDataTransacao()).equals(m)) continue;
                if (t.getTipo() == TipoTransacao.RECEITA) {
                    receitas = receitas.add(t.getValor());
                } else {
                    despesas = despesas.add(t.getValor());
                }
            }
            fluxo.add(new FluxoCaixa(
                    m.toString(),
                    MESES_CURTOS[m.getMonthValue() - 1],
                    receitas,
                    despesas,
                    receitas.subtract(despesas)));
        }
        return fluxo;
    }
}
