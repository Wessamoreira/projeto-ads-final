package com.financas.jobs;

import com.financas.entity.Categoria;
import com.financas.entity.RendaMensalRegistro;
import com.financas.entity.Transacao;
import com.financas.entity.Usuario;
import com.financas.enums.TipoTransacao;
import com.financas.repository.CategoriaRepository;
import com.financas.repository.RendaMensalRegistroRepository;
import com.financas.repository.TransacaoRepository;
import com.financas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Lancamento automatico da renda mensal.
 *
 * <p>Todo dia as 06:00 a rotina verifica se hoje e o 5o dia util do mes. Se for,
 * para cada usuario com renda configurada, lanca a renda como uma receita na
 * categoria "Salario" - uma vez por mes, sem duplicar.</p>
 *
 * @author Wesley Moreira dos Santos
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RendaMensalJobs {

    private static final String CATEGORIA_SALARIO = "Salário";
    private static final String COR_CATEGORIA_SALARIO = "#10B981"; // Verde

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final TransacaoRepository transacaoRepository;
    private final RendaMensalRegistroRepository registroRepository;

    public enum ResultadoRendaMensal {
        CRIADO,
        ATUALIZADO,
        JA_PROCESSADO,
        SEM_RENDA;

        public boolean alterouLancamento() {
            return this == CRIADO || this == ATUALIZADO;
        }
    }

    /** Roda todo dia as 06:00; so age no 5o dia util do mes. */
    @Scheduled(cron = "0 0 6 * * ?") // Todo dia as 06:00
    @Transactional
    public void processarRendaMensal() {
        LocalDate hoje = LocalDate.now();

        log.info("[RendaMensal] Iniciando verificacao - Data: {}", hoje);

        // Verifica se hoje e o 5o dia util do mes
        if (!ehQuintoDiaUtil(hoje)) {
            log.debug("[RendaMensal] Hoje nao e o 5o dia util. Encerrando.");
            return;
        }

        log.info("[RendaMensal] Hoje e o 5o dia util! Processando lancamentos...");

        List<Usuario> usuariosComRenda = buscarUsuariosComRenda();

        log.info("[RendaMensal] Usuarios com renda configurada: {}", usuariosComRenda.size());

        int lancamentos = 0;
        for (Usuario usuario : usuariosComRenda) {
            ResultadoRendaMensal resultado = processarUsuario(usuario, hoje);
            if (resultado.alterouLancamento()) lancamentos++;
        }

        log.info("[RendaMensal] Processamento concluido. Lancamentos/atualizacoes realizados: {}",
                lancamentos);
    }

    /** Cria o lancamento do mes se ainda nao existe, ou atualiza se a renda mudou. */
    private ResultadoRendaMensal processarUsuario(Usuario usuario, LocalDate data) {
        int ano = data.getYear();
        int mes = data.getMonthValue();

        return registroRepository.findByUsuarioIdAndAnoAndMes(usuario.getId(), ano, mes)
                .map(registro -> atualizarLancamentoExistente(usuario, registro, data, ano, mes))
                .orElseGet(() -> criarLancamento(usuario, data, ano, mes));
    }

    private ResultadoRendaMensal criarLancamento(Usuario usuario, LocalDate data, int ano, int mes) {
        Transacao transacao = criarTransacaoRenda(usuario, data, ano, mes);

        RendaMensalRegistro registro = RendaMensalRegistro.builder()
                .usuario(usuario)
                .ano(ano)
                .mes(mes)
                .valorLancado(usuario.getRendaMensal())
                .dataLancamento(data)
                .transacao(transacao)
                .build();

        registroRepository.save(registro);

        log.info("[RendaMensal] Lancamento realizado: Usuario={}, Valor={}, Mes={}/{}",
                usuario.getEmail(), usuario.getRendaMensal(), mes, ano);

        return ResultadoRendaMensal.CRIADO;
    }

    private ResultadoRendaMensal atualizarLancamentoExistente(
            Usuario usuario,
            RendaMensalRegistro registro,
            LocalDate data,
            int ano,
            int mes
    ) {
        BigDecimal rendaAtual = usuario.getRendaMensal();
        boolean atualizado = false;

        if (valoresDiferentes(registro.getValorLancado(), rendaAtual)) {
            registro.setValorLancado(rendaAtual);
            atualizado = true;
        }

        Transacao transacao = registro.getTransacao();
        if (transacao == null) {
            LocalDate dataTransacao = registro.getDataLancamento() != null
                    ? registro.getDataLancamento()
                    : data;
            registro.setTransacao(criarTransacaoRenda(usuario, dataTransacao, ano, mes));
            atualizado = true;
        } else if (valoresDiferentes(transacao.getValor(), rendaAtual)) {
            transacao.setValor(rendaAtual);
            transacaoRepository.save(transacao);
            atualizado = true;
        }

        if (!atualizado) {
            log.debug("[RendaMensal] Renda ja lancada para usuario {} em {}/{}",
                    usuario.getEmail(), mes, ano);
            return ResultadoRendaMensal.JA_PROCESSADO;
        }

        registroRepository.save(registro);

        log.info("[RendaMensal] Lancamento atualizado: Usuario={}, Valor={}, Mes={}/{}",
                usuario.getEmail(), rendaAtual, mes, ano);

        return ResultadoRendaMensal.ATUALIZADO;
    }

    private Transacao criarTransacaoRenda(Usuario usuario, LocalDate data, int ano, int mes) {
        Categoria categoriaSalario = buscarOuCriarCategoriaSalario(usuario);

        Transacao transacao = Transacao.builder()
                .usuario(usuario)
                .categoria(categoriaSalario)
                .tipo(TipoTransacao.RECEITA)
                .valor(usuario.getRendaMensal())
                .descricao("Salário - " + getNomeMes(mes) + "/" + ano)
                .dataTransacao(data)
                .build();

        return transacaoRepository.save(transacao);
    }

    private boolean valoresDiferentes(BigDecimal valorAtual, BigDecimal novoValor) {
        if (valorAtual == null || novoValor == null) {
            return valorAtual != novoValor;
        }
        return valorAtual.compareTo(novoValor) != 0;
    }

    /** Reaproveita a categoria de Salario/renda do usuario; cria uma se nao houver. */
    private Categoria buscarOuCriarCategoriaSalario(Usuario usuario) {
        // Busca categorias de RECEITA do usuario
        List<Categoria> categorias = categoriaRepository
                .findByUsuarioIdAndTipoOrderByNomeAsc(usuario.getId(), TipoTransacao.RECEITA);

        // Procura por uma categoria chamada "Salario" ou similar
        for (Categoria cat : categorias) {
            String nome = cat.getNome().toLowerCase();
            if (nome.contains("salário") || nome.contains("salario") || nome.contains("renda")) {
                return cat;
            }
        }

        // Se nao encontrou, cria uma nova
        log.info("[RendaMensal] Criando categoria 'Salário' para usuario {}", usuario.getEmail());

        Categoria nova = Categoria.builder()
                .usuario(usuario)
                .nome(CATEGORIA_SALARIO)
                .tipo(TipoTransacao.RECEITA)
                .corHex(COR_CATEGORIA_SALARIO)
                .descricao("Categoria criada automaticamente para lançamentos de salário")
                .build();

        return categoriaRepository.save(nova);
    }

    /** Diz se a data e o 5o dia util do mes (dias uteis = seg a sex; sem feriados). */
    public boolean ehQuintoDiaUtil(LocalDate data) {
        LocalDate primeiroDia = data.withDayOfMonth(1);
        int diasUteis = 0;
        LocalDate atual = primeiroDia;

        while (!atual.isAfter(data)) {
            if (ehDiaUtil(atual)) {
                diasUteis++;
                if (diasUteis == 5 && atual.equals(data)) {
                    return true;
                }
            }
            atual = atual.plusDays(1);
        }

        return false;
    }

    /** Dia util = segunda a sexta. */
    private boolean ehDiaUtil(LocalDate data) {
        DayOfWeek dia = data.getDayOfWeek();
        return dia != DayOfWeek.SATURDAY && dia != DayOfWeek.SUNDAY;
    }

    /** Devolve a data do 5o dia util de um mes/ano. */
    public LocalDate calcularQuintoDiaUtil(int ano, int mes) {
        LocalDate data = LocalDate.of(ano, mes, 1);
        int diasUteis = 0;

        while (diasUteis < 5) {
            if (ehDiaUtil(data)) {
                diasUteis++;
            }
            if (diasUteis < 5) {
                data = data.plusDays(1);
            }
        }

        return data;
    }

    /** Nome do mes em portugues, para a descricao da transacao. */
    private String getNomeMes(int mes) {
        return switch (mes) {
            case 1 -> "Janeiro";
            case 2 -> "Fevereiro";
            case 3 -> "Março";
            case 4 -> "Abril";
            case 5 -> "Maio";
            case 6 -> "Junho";
            case 7 -> "Julho";
            case 8 -> "Agosto";
            case 9 -> "Setembro";
            case 10 -> "Outubro";
            case 11 -> "Novembro";
            case 12 -> "Dezembro";
            default -> "Mês " + mes;
        };
    }

    /** Roda o processamento na mao para todos os usuarios (util em teste). */
    @Transactional
    public int executarManualmente(LocalDate data) {
        log.info("[RendaMensal] Execucao manual solicitada para data: {}", data);

        List<Usuario> usuariosComRenda = buscarUsuariosComRenda();

        int lancamentos = 0;
        for (Usuario usuario : usuariosComRenda) {
            ResultadoRendaMensal resultado = processarUsuario(usuario, data);
            if (resultado.alterouLancamento()) lancamentos++;
        }

        return lancamentos;
    }

    /**
     * Lanca a renda so para um usuario (no cadastro, ao salvar a renda no perfil
     * ou pelo botao manual). O registro mensal impede duplicar.
     */
    @Transactional
    public ResultadoRendaMensal executarParaUsuario(Usuario usuario, LocalDate data) {
        log.info("[RendaMensal] Execucao solicitada para usuario {} na data: {}",
                usuario.getEmail(), data);

        if (usuario.getRendaMensal() == null
                || usuario.getRendaMensal().compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("[RendaMensal] Usuario {} sem renda mensal configurada", usuario.getEmail());
            return ResultadoRendaMensal.SEM_RENDA;
        }

        return processarUsuario(usuario, data);
    }

    private List<Usuario> buscarUsuariosComRenda() {
        return usuarioRepository.findAll()
                .stream()
                .filter(u -> u.getRendaMensal() != null && u.getRendaMensal().compareTo(BigDecimal.ZERO) > 0)
                .toList();
    }
}
