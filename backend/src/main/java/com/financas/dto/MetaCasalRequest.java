package com.financas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Dados para criar um objetivo compartilhado do casal. */
public record MetaCasalRequest(
        @NotBlank(message = "Informe um titulo para o objetivo")
        String titulo,

        @NotNull(message = "Informe o valor do objetivo")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        BigDecimal valorAlvo
) {}
