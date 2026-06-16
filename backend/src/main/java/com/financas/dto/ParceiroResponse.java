package com.financas.dto;

import com.financas.entity.Usuario;

import java.util.UUID;

/** Dados resumidos da outra pessoa do casal (sem informacoes sensiveis). */
public record ParceiroResponse(
        UUID id,
        String nome,
        String email
) {
    public static ParceiroResponse de(Usuario u) {
        return u == null ? null : new ParceiroResponse(u.getId(), u.getNome(), u.getEmail());
    }
}
