package com.financas.dto;

/** Resposta do login/registro: o token e os dados do usuario. */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UsuarioResponse usuario
) {}
