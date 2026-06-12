package com.financas.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/** Dados que o usuario pode editar no seu perfil. */
public record AtualizarPerfilRequest(
        @NotBlank(message = "Nome e obrigatorio")
        String nome,

        BigDecimal rendaMensal
) {}
