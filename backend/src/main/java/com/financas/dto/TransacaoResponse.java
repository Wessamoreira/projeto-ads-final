package com.financas.dto;

import com.financas.entity.Transacao;
import com.financas.enums.TipoTransacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Transacao devolvida para o frontend (com a categoria completa). */
public record TransacaoResponse(
        UUID id,
        TipoTransacao tipo,
        BigDecimal valor,
        String descricao,
        LocalDate dataTransacao,
        CategoriaResponse categoria,
        LocalDateTime createdAt
) {
    public static TransacaoResponse de(Transacao t) {
        return new TransacaoResponse(
                t.getId(),
                t.getTipo(),
                t.getValor(),
                t.getDescricao(),
                t.getDataTransacao(),
                CategoriaResponse.de(t.getCategoria()),
                t.getCreatedAt());
    }
}
