package com.financas.dto;

import com.financas.enums.TipoTransacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Dados para criar/editar uma transacao. */
public record TransacaoRequest(
        @NotNull(message = "Tipo e obrigatorio")
        TipoTransacao tipo,

        @NotNull(message = "Valor e obrigatorio")
        @Positive(message = "Valor deve ser maior que zero")
        BigDecimal valor,

        String descricao,

        @NotNull(message = "Data e obrigatoria")
        LocalDate dataTransacao,

        @NotNull(message = "Categoria e obrigatoria")
        UUID categoriaId
) {}
