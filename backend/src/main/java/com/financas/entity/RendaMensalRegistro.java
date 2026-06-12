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
 * Registro de renda mensal processada automaticamente.
 *
 * <p>Controla se a renda mensal do usuario ja foi lancada como receita
 * em um determinado mes/ano. Evita duplicidade de lancamentos.</p>
 *
 * <p><b>Regra de negocio:</b> A renda e lancada automaticamente no 5o dia util
 * de cada mes, simulando o dia tipico de pagamento de salario.</p>
 *
 * @author Sistema Financas
 * @since 1.0
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

    /**
     * Usuario dono deste registro de renda.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Ano do registro (ex: 2026).
     */
    @Column(name = "ano", nullable = false)
    private Integer ano;

    /**
     * Mes do registro (1 a 12).
     */
    @Column(name = "mes", nullable = false)
    private Integer mes;

    /**
     * Valor da renda que foi lancada como receita.
     */
    @Column(name = "valor_lancado", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorLancado;

    /**
     * Data em que o lancamento foi realizado pelo sistema.
     */
    @Column(name = "data_lancamento", nullable = false)
    private LocalDate dataLancamento;

    /**
     * Referencia a transacao criada (para rastreabilidade).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transacao_id")
    private Transacao transacao;
}
