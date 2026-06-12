package com.financas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO com o status do lancamento automatico de renda mensal.
 *
 * <p>Retornado pelo endpoint GET /api/renda-mensal/status</p>
 *
 * @author Sistema Financas
 * @since 1.0
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
