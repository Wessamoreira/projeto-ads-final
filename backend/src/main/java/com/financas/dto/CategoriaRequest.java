package com.financas.dto;

import com.financas.enums.TipoTransacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Dados para criar/editar uma categoria. */
public record CategoriaRequest(
        @NotBlank(message = "Nome e obrigatorio")
        String nome,

        String icone,

        /** Cor em hexadecimal (#RRGGBB). */
        String cor,

        @NotNull(message = "Tipo e obrigatorio")
        TipoTransacao tipo,

        BigDecimal orcamento,

        String descricao
) {}
