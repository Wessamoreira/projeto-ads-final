package com.financas.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Marca que a renda mensal de um usuario ja foi lancada num mes/ano.
 * Serve para nao lancar o salario duas vezes no mesmo mes.
 *
 * @author Wesley Moreira dos Santos
 */
@Entity
@Table(
    name = "renda_mensal_registro",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_renda_usuario_ano_mes",
        columnNames = {"usuario_id", "ano", "mes"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RendaMensalRegistro extends BaseEntity {

    /** Dono do registro. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "ano", nullable = false)
    private Integer ano;

    /** Mes de 1 a 12. */
    @Column(name = "mes", nullable = false)
    private Integer mes;

    /** Valor lancado como receita. */
    @Column(name = "valor_lancado", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorLancado;

    /** Data em que o sistema fez o lancamento. */
    @Column(name = "data_lancamento", nullable = false)
    private LocalDate dataLancamento;

    /** Transacao gerada (para rastrear). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transacao_id")
    private Transacao transacao;
}
