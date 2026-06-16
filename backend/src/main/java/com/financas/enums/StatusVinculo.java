package com.financas.enums;

/**
 * Estado do vinculo entre dois usuarios (casal).
 *
 * <ul>
 *   <li>{@code PENDENTE} - convite enviado, aguardando o outro usuario aceitar.</li>
 *   <li>{@code ATIVO} - convite aceito, o casal esta vinculado.</li>
 *   <li>{@code DESVINCULADO} - convite recusado/cancelado ou casal desfeito.</li>
 * </ul>
 */
public enum StatusVinculo {
    PENDENTE,
    ATIVO,
    DESVINCULADO
}
