package com.financas.dto;

import com.financas.entity.Usuario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Dados do usuario devolvidos para o frontend (sem a senha!). */
public record UsuarioResponse(
        UUID id,
        String nome,
        String email,
        BigDecimal rendaMensal,
        LocalDateTime createdAt
) {
    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(
                u.getId(), u.getNome(), u.getEmail(), u.getRendaMensal(), u.getCreatedAt());
    }
}
