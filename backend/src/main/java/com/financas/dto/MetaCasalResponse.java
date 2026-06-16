package com.financas.dto;

import com.financas.entity.MetaCasal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Objetivo compartilhado do casal devolvido para o frontend. */
public record MetaCasalResponse(
        UUID id,
        String titulo,
        BigDecimal valorAlvo,
        BigDecimal valorAtual,
        double percentual,
        boolean concluida,
        LocalDateTime createdAt
) {
    public static MetaCasalResponse de(MetaCasal m) {
        double pct = m.getPercentual();
        return new MetaCasalResponse(
                m.getId(),
                m.getTitulo(),
                m.getValorAlvo(),
                m.getValorAtual(),
                pct,
                pct >= 100,
                m.getCreatedAt());
    }
}
