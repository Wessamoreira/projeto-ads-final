package com.financas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Status do lancamento automatico de renda (GET /api/renda-mensal/status).
 *
 * @author Wesley Moreira dos Santos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendaMensalStatusResponse {

    /**
     * Valor da renda mensal configurada no perfil do usuario.
     * Null se nao configurada.
     */
    private BigDecimal rendaMensalConfigurada;

    /**
     * Indica se a renda ja foi lancada automaticamente neste mes.
     */
    private boolean lancadoEsteMes;

    /**
     * Data prevista para o proximo lancamento automatico (5o dia util).
     */
    private LocalDate proximoLancamento;

    /**
     * Total de lancamentos automaticos ja realizados (historico).
     */
    private int totalLancamentos;
}
