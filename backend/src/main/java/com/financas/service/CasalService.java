package com.financas.service;

import com.financas.dto.CasalStatusResponse;
import com.financas.dto.CasalVinculoResponse;
import com.financas.dto.ConvidarParceiroRequest;
import com.financas.entity.CasalVinculo;
import com.financas.entity.Usuario;
import com.financas.enums.StatusVinculo;
import com.financas.exception.RegraNegocioException;
import com.financas.repository.CasalVinculoRepository;
import com.financas.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de negocio do vinculo de casal: convidar uma pessoa, aceitar/recusar
 * convites e desfazer o vinculo. Tudo no escopo do usuario logado.
 *
 * <p>Fluxo simples (pensado para uso real e demonstracao):</p>
 * <ol>
 *   <li>Usuario A convida B pelo e-mail -> convite PENDENTE.</li>
 *   <li>B ve o convite recebido e aceita -> vinculo ATIVO.</li>
 *   <li>Qualquer um pode desfazer o vinculo (ou cancelar/recusar o convite).</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CasalService {

    private final CasalVinculoRepository casalRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    /** Retrato completo da situacao do usuario: vinculo ativo, convite enviado e recebidos. */
    public CasalStatusResponse obterStatus() {
        UUID usuarioId = usuarioService.getLogado().getId();

        CasalVinculoResponse ativo = casalRepository.findAtivoByUsuario(usuarioId)
                .map(v -> CasalVinculoResponse.de(v, usuarioId))
                .orElse(null);

        CasalVinculoResponse enviado = casalRepository.findPendenteEnviadoByUsuario(usuarioId)
                .map(v -> CasalVinculoResponse.de(v, usuarioId))
                .orElse(null);

        List<CasalVinculoResponse> recebidos = casalRepository.findPendentesRecebidosByUsuario(usuarioId)
                .stream()
                .map(v -> CasalVinculoResponse.de(v, usuarioId))
                .toList();

        return new CasalStatusResponse(ativo, enviado, recebidos);
    }

    /** Convida uma pessoa (pelo e-mail) para formar um casal. Cria um convite PENDENTE. */
    @Transactional
    public CasalVinculoResponse convidar(ConvidarParceiroRequest dados) {
        Usuario remetente = usuarioService.getLogado();

        if (casalRepository.existsAtivoByUsuario(remetente.getId())) {
            throw RegraNegocioException.conflito("Voce ja possui um vinculo ativo. Desfaca o atual antes de convidar outra pessoa.");
        }

        if (casalRepository.findPendenteEnviadoByUsuario(remetente.getId()).isPresent()) {
            throw RegraNegocioException.conflito("Voce ja tem um convite pendente aguardando resposta.");
        }

        String email = dados.email().trim().toLowerCase();
        if (email.equalsIgnoreCase(remetente.getEmail())) {
            throw new RegraNegocioException("Voce nao pode convidar a si mesmo", 400);
        }

        Usuario destinatario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado(
                        "Nao encontramos nenhuma conta com este e-mail"));

        if (casalRepository.existsAtivoByUsuario(destinatario.getId())) {
            throw RegraNegocioException.conflito("Esta pessoa ja possui um vinculo ativo com outra conta.");
        }

        if (casalRepository.existsPendenteEntre(remetente.getId(), destinatario.getId())) {
            throw RegraNegocioException.conflito("Ja existe um convite pendente entre voces.");
        }

        CasalVinculo vinculo = CasalVinculo.builder()
                .usuario1(remetente)
                .usuario2(destinatario)
                .status(StatusVinculo.PENDENTE)
                .build();

        CasalVinculo salvo = casalRepository.save(vinculo);
        return CasalVinculoResponse.de(salvo, remetente.getId());
    }

    /** Aceita um convite recebido (so o destinatario pode). Ativa o vinculo. */
    @Transactional
    public CasalVinculoResponse aceitar(UUID conviteId) {
        UUID usuarioId = usuarioService.getLogado().getId();
        CasalVinculo vinculo = buscarConvitePendente(conviteId);

        // So o destinatario (usuario2) pode aceitar
        if (!vinculo.getUsuario2().getId().equals(usuarioId)) {
            throw new RegraNegocioException("Voce nao e o destinatario deste convite", 403);
        }

        if (casalRepository.existsAtivoByUsuario(usuarioId)) {
            throw RegraNegocioException.conflito("Voce ja possui um vinculo ativo.");
        }

        vinculo.aceitar();
        CasalVinculo salvo = casalRepository.save(vinculo);
        return CasalVinculoResponse.de(salvo, usuarioId);
    }

    /** Recusa um convite recebido (so o destinatario pode). */
    @Transactional
    public void recusar(UUID conviteId) {
        UUID usuarioId = usuarioService.getLogado().getId();
        CasalVinculo vinculo = buscarConvitePendente(conviteId);

        if (!vinculo.getUsuario2().getId().equals(usuarioId)) {
            throw new RegraNegocioException("Voce nao e o destinatario deste convite", 403);
        }

        vinculo.desvincular();
        casalRepository.save(vinculo);
    }

    /** Cancela um convite que o proprio usuario enviou (so o remetente pode). */
    @Transactional
    public void cancelar(UUID conviteId) {
        UUID usuarioId = usuarioService.getLogado().getId();
        CasalVinculo vinculo = buscarConvitePendente(conviteId);

        if (!vinculo.getUsuario1().getId().equals(usuarioId)) {
            throw new RegraNegocioException("Voce nao enviou este convite", 403);
        }

        vinculo.desvincular();
        casalRepository.save(vinculo);
    }

    /** Desfaz o vinculo ativo do usuario logado. */
    @Transactional
    public void desvincular() {
        UUID usuarioId = usuarioService.getLogado().getId();
        CasalVinculo vinculo = casalRepository.findAtivoByUsuario(usuarioId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado(
                        "Voce nao possui um vinculo ativo para desfazer"));

        vinculo.desvincular();
        casalRepository.save(vinculo);
    }

    /** Busca um convite que precisa estar PENDENTE, ou erro 404/409. */
    private CasalVinculo buscarConvitePendente(UUID conviteId) {
        CasalVinculo vinculo = casalRepository.findById(conviteId)
                .orElseThrow(() -> RegraNegocioException.naoEncontrado("Convite nao encontrado"));
        if (!vinculo.isPendente()) {
            throw RegraNegocioException.conflito("Este convite nao esta mais disponivel");
        }
        return vinculo;
    }
}
