package com.financas.controller;

import com.financas.dto.RendaMensalStatusResponse;
import com.financas.entity.RendaMensalRegistro;
import com.financas.entity.Usuario;
import com.financas.jobs.RendaMensalJobs;
import com.financas.jobs.RendaMensalJobs.ResultadoRendaMensal;
import com.financas.repository.RendaMensalRegistroRepository;
import com.financas.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller para gerenciar e consultar lancamentos automaticos de renda mensal.
 *
 * <p>Permite ao usuario visualizar o status dos lancamentos automaticos
 * e, para fins de teste, executar o processamento manualmente.</p>
 *
 * @author Sistema Financas
 * @since 1.0
 */
@Tag(name = "Renda Mensal", description = "Gerenciamento do lancamento automatico de renda")
@RestController
@RequestMapping("/api/renda-mensal")
@RequiredArgsConstructor
public class RendaMensalController {

    private final RendaMensalJobs rendaMensalJobs;
    private final RendaMensalRegistroRepository registroRepository;
    private final UsuarioService usuarioService;

    /**
     * Retorna o status do lancamento automatico de renda do usuario logado.
     *
     * <p>Inclui informacoes sobre o proximo lancamento previsto e historico.</p>
     */
    @Operation(summary = "Status da renda mensal",
               description = "Retorna informacoes sobre o lancamento automatico de renda do usuario")
    @GetMapping("/status")
    public ResponseEntity<RendaMensalStatusResponse> getStatus() {
        Usuario usuario = usuarioService.getLogado();
        LocalDate hoje = LocalDate.now();
        int anoAtual = hoje.getYear();
        int mesAtual = hoje.getMonthValue();

        // Verifica se ja foi lancado este mes
        boolean lancadoEsteMes = registroRepository
                .existsByUsuarioIdAndAnoAndMes(usuario.getId(), anoAtual, mesAtual);

        // Calcula o proximo 5o dia util
        LocalDate proximoLancamento;
        if (lancadoEsteMes) {
            // Proximo mes
            LocalDate proximoMes = hoje.plusMonths(1);
            proximoLancamento = rendaMensalJobs.calcularQuintoDiaUtil(
                    proximoMes.getYear(), proximoMes.getMonthValue());
        } else {
            proximoLancamento = rendaMensalJobs.calcularQuintoDiaUtil(anoAtual, mesAtual);
            if (proximoLancamento.isBefore(hoje)) {
                // Ja passou o 5o dia util deste mes sem lancar (renda configurada depois)
                LocalDate proximoMes = hoje.plusMonths(1);
                proximoLancamento = rendaMensalJobs.calcularQuintoDiaUtil(
                        proximoMes.getYear(), proximoMes.getMonthValue());
            }
        }

        // Busca historico
        List<RendaMensalRegistro> historico = registroRepository
                .findByUsuarioIdOrderByAnoDescMesDesc(usuario.getId());

        return ResponseEntity.ok(RendaMensalStatusResponse.builder()
                .rendaMensalConfigurada(usuario.getRendaMensal())
                .lancadoEsteMes(lancadoEsteMes)
                .proximoLancamento(proximoLancamento)
                .totalLancamentos(historico.size())
                .build());
    }

    /**
     * Executa manualmente o lancamento da renda do usuario logado.
     *
     * <p>Usado pelo botao do perfil para atualizar o dashboard imediatamente
     * quando a conta ou a renda mensal acabou de ser cadastrada.</p>
     *
     * @param data Data para simular o lancamento (opcional, default = hoje)
     * @return Mensagem com o resultado do lancamento
     */
    @Operation(summary = "Executar lancamento manual",
               description = "Executa o lancamento da renda mensal do usuario logado")
    @PostMapping("/executar")
    public ResponseEntity<String> executarManualmente(
            @RequestParam(required = false) LocalDate data) {

        Usuario usuario = usuarioService.getLogado();
        LocalDate dataLancamento = data != null ? data : LocalDate.now();
        ResultadoRendaMensal resultado = rendaMensalJobs.executarParaUsuario(usuario, dataLancamento);

        if (resultado == ResultadoRendaMensal.CRIADO) {
            return ResponseEntity.ok("Lancamento da renda mensal realizado com sucesso.");
        }

        if (resultado == ResultadoRendaMensal.ATUALIZADO) {
            return ResponseEntity.ok("Renda mensal atualizada nas transacoes e no dashboard.");
        }

        if (resultado == ResultadoRendaMensal.SEM_RENDA) {
            return ResponseEntity.ok("Configure uma renda mensal maior que zero no perfil.");
        }

        return ResponseEntity.ok("Nenhum lancamento necessario. " +
                "A renda mensal deste mes ja esta lancada no dashboard.");
    }

    /**
     * Retorna o historico de lancamentos automaticos do usuario.
     */
    @Operation(summary = "Historico de lancamentos",
               description = "Lista todos os lancamentos automaticos de renda do usuario")
    @GetMapping("/historico")
    public ResponseEntity<List<RendaMensalRegistro>> getHistorico() {
        Usuario usuario = usuarioService.getLogado();
        List<RendaMensalRegistro> historico = registroRepository
                .findByUsuarioIdOrderByAnoDescMesDesc(usuario.getId());
        return ResponseEntity.ok(historico);
    }
}
