package com.financas.dto;

import com.financas.entity.Categoria;
import com.financas.enums.TipoTransacao;

import java.math.BigDecimal;
import java.util.UUID;

/** Categoria devolvida para o frontend. */
public record CategoriaResponse(
        UUID id,
        String nome,
        String icone,
        String corHex,
        String cor,
        TipoTransacao tipo,
        BigDecimal orcamento,
        String descricao
) {
    public static CategoriaResponse de(Categoria c) {
        return new CategoriaResponse(
                c.getId(),
                c.getNome(),
                c.getIcone(),
                c.getCorHex(),
                c.getCorHex(),   // 'cor' e 'corHex' levam o mesmo valor (compatibilidade do front)
                c.getTipo(),
                c.getOrcamento(),
                c.getDescricao());
    }
}
