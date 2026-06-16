package com.financas.dto;

import com.financas.entity.CasalVinculo;
import com.financas.entity.Usuario;
import com.financas.enums.StatusVinculo;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Vinculo de casal devolvido para o frontend.
 *
 * <p>O campo {@code parceiro} e sempre a OUTRA pessoa, do ponto de vista do
 * usuario logado, e {@code euConvidei} indica se foi o usuario logado quem
 * enviou o convite (util para a tela mostrar "aguardando resposta" x "te convidou").</p>
 */
public record CasalVinculoResponse(
        UUID id,
        StatusVinculo status,
        ParceiroResponse parceiro,
        boolean euConvidei,
        LocalDateTime vinculadoEm,
        LocalDateTime createdAt
) {
    public static CasalVinculoResponse de(CasalVinculo v, UUID usuarioLogadoId) {
        boolean euConvidei = v.getUsuario1() != null
                && v.getUsuario1().getId().equals(usuarioLogadoId);
        Usuario parceiro = v.getParceiro(usuarioLogadoId);
        return new CasalVinculoResponse(
                v.getId(),
                v.getStatus(),
                ParceiroResponse.de(parceiro),
                euConvidei,
                v.getVinculadoEm(),
                v.getCreatedAt());
    }
}
