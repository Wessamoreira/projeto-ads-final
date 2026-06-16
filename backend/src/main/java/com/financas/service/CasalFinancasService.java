package com.financas.service;

import com.financas.dto.AdicionarValorMetaRequest;
import com.financas.dto.CasalFinancasResponse;
import com.financas.dto.CasalFinancasResponse.Divisao;
import com.financas.dto.CasalFinancasResponse.PessoaResumo;
import com.financas.dto.DashboardResponse.GastoCategoria;
import com.financas.dto.MetaCasalRequest;
import com.financas.dto.MetaCasalResponse;
import com.financas.entity.CasalVinculo;
import com.financas.entity.Categoria;
import com.financas.entity.MetaCasal;
import com.financas.entity.Transacao;
import com.financas.entity.Usuario;
import com.financas.enums.TipoTransacao;
import com.financas.exception.RegraNegocioException;
import com.financas.repository.CasalVinculoRepository;
import com.financas.repository.MetaCasalRepository;
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
 * Visao financeira combinada do casal e objetivos compartilhados.
 *
 * <p><b>Juncao automatica:</b> assim que os dois estao vinculados (ATIVO), esta
 * tela soma a renda dos dois e agrega TODAS as transacoes dos dois parceiros.
 * Cada um continua lancando normalmente nas suas proprias telas; aqui o casal
 * ve tudo junto.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CasalFinancasService {

    private final CasalVinculoRepository casalRepository;
    private final TransacaoRepository transacaoRepository;
    private final MetaCasalRepository metaRepository;
    private final UsuarioService usuarioService;

    // =========================================================================
    // VISAO FINANCEIRA COMBINADA
    // =========================================================================

    public CasalFinancasResponse obterFinancas(String periodo) {
        CasalVinculo casal = casalAtivo();
        Usuario u1 = casal.getUsuario1();
        Usuario u2 = casal.getUsuario2();
        List<UUID> ids = List.of(u1.getId(), u2.getId());

        YearMonth mes = (periodo == null || periodo.isBlank())
                ? YearMonth.now()
                : YearMonth.parse(periodo);

        // Transacoes do mes (dos dois)
        List<Transacao> doMes = transacaoRepository.findByUsuariosAndPeriodo(
                ids, mes.atDay(1), mes.atEndOfMonth());

        BigDecimal receitasMes = somar(doMes, TipoTransacao.RECEITA);
        BigDecimal despesasMes = somar(doMes, TipoTransacao.DESPESA);

        // Saldo de todo o historico dos dois
        List<Transacao> tudo = transacaoRepository.findByUsuariosAndPeriodo(
                ids, LocalDate.of(2000, 1, 1), mes.atEndOfMonth());
        BigDecimal saldoTotal = somar(tudo, TipoTransacao.RECEITA)
                .subtract(somar(tudo, TipoTransacao.DESPESA));

        BigDecimal rendaCombinada = nvl(u1.getRendaMensal()).add(nvl(u2.getRendaMensal()));

        List<PessoaResumo> porPessoa = List.of(
                resumoPessoa(u1, doMes),
                resumoPessoa(u2, doMes));

        return new CasalFinancasResponse(
                mes.toString(),
                rendaCombinada,
                receitasMes,
                despesasMes,
                receitasMes.subtract(despesasMes),
                saldoTotal,
                gastosPorCategoria(doMes, despesasMes),
                porPessoa,
                calcularDivisao(porPessoa));
    }

    /** Resumo (receitas/despesas do mes) de um parceiro. */
    private PessoaResumo resumoPessoa(Usuario usuario, List<Transacao> doMes) {
        BigDecimal receitas = BigDecimal.ZERO;
        BigDecimal despesas = BigDecimal.ZERO;
        for (Transacao t : doMes) {
            if (!t.getUsuario().getId().equals(usuario.getId())) continue;
            if (t.getTipo() == TipoTransacao.RECEITA) {
                receitas = receitas.add(t.getValor());
            } else {
                despesas = despesas.add(t.getValor());
            }
        }
        return new PessoaResumo(usuario.getNome(), receitas, despesas);
    }

    /** Quem deve quanto para dividir as despesas do mes meio a meio. */
    private Divisao calcularDivisao(List<PessoaResumo> pessoas) {
        PessoaResumo a = pessoas.get(0);
        PessoaResumo b = pessoas.get(1);
        // Diferenca dividida por 2: quem gastou menos transfere essa quantia.
        BigDecimal diff = a.despesas().subtract(b.despesas())
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        if (diff.signum() == 0) {
            return new Divisao(true, null, null, BigDecimal.ZERO);
        }
        if (diff.signum() > 0) {
            // A gastou mais -> B deve para A
            return new Divisao(false, b.nome(), a.nome(), diff);
        }
        // B gastou mais -> A deve para B
        return new Divisao(false, a.nome(), b.nome(), diff.abs());
    }

    /** Despesas do casal agrupadas por nome de categoria (junta categorias iguais dos dois). */
    private List<GastoCategoria> gastosPorCategoria(List<Transacao> doMes, BigDecimal totalDespesas) {
        Map<String, BigDecimal> valores = new LinkedHashMap<>();
        Map<String, Categoria> categorias = new LinkedHashMap<>();

        for (Transacao t : doMes) {
            if (t.getTipo() != TipoTransacao.DESPESA) continue;
            Categoria c = t.getCategoria();
            String chave = c.getNome().toLowerCase();
            valores.merge(chave, t.getValor(), BigDecimal::add);
            categorias.putIfAbsent(chave, c);
        }

        List<GastoCategoria> resultado = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : valores.entrySet()) {
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
        resultado.sort((x, y) -> y.valor().compareTo(x.valor()));
        return resultado;
    }

    // =========================================================================
    // OBJETIVOS (METAS) COMPARTILHADOS
    // =========================================================================

    public List<MetaCasalResponse> listarMetas() {
        CasalVinculo casal = casalAtivo();
        return metaRepository.findByCasalIdOrderByCreatedAtDesc(casal.getId())
                .stream()
                .map(MetaCasalResponse::de)
                .toList();
    }

    @Transactional
    public MetaCasalResponse criarMeta(MetaCasalRequest dados) {
        CasalVinculo casal = casalAtivo();
        MetaCasal meta = MetaCasal.builder()
                .casal(casal)
                .titulo(dados.titulo().trim())
                .valorAlvo(dados.valorAlvo())
                .valorAtual(BigDecimal.ZERO)
                .build();
        return MetaCasalResponse.de(metaRepository.save(meta));
    }

    @Transactional
    public MetaCasalResponse adicionarValor(UUID metaId, AdicionarValorMetaRequest dados) {
        MetaCasal meta = buscarMeta(metaId);
        meta.adicionar(dados.valor());
        return MetaCasalResponse.de(metaRepository.save(meta));
    }

    @Transactional
    public void excluirMeta(UUID metaId) {
        metaRepository.delete(buscarMeta(metaId));
    }

    // =========================================================================
    // APOIO
    // =========================================================================

    /** Vinculo ativo do usuario logado, ou erro se nao houver. */
    private CasalVinculo casalAtivo() {
        UUID usuarioId = usuarioService.getLogado().getId();
        return casalRepository.findAtivoByUsuario(usuarioId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado(
                        "Voce ainda nao possui um vinculo de casal ativo"));
    }

    /** Busca a meta garantindo que ela pertence ao casal ativo do usuario. */
    private MetaCasal buscarMeta(UUID metaId) {
        CasalVinculo casal = casalAtivo();
        return metaRepository.findByIdAndCasalId(metaId, casal.getId())
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Objetivo nao encontrado"));
    }

    private BigDecimal somar(List<Transacao> transacoes, TipoTransacao tipo) {
        return transacoes.stream()
                .filter(t -> t.getTipo() == tipo)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal nvl(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
