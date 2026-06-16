package com.financas.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Objetivo de economia compartilhado pelo casal (ex: "Juntar R$ 5.000 para a viagem").
 *
 * <p>Pertence a um vinculo de casal. Cada parceiro pode adicionar valor ao objetivo,
 * e o progresso e calculado a partir de {@code valorAtual / valorAlvo}.</p>
 */
@Entity
@Table(
        name = "meta_casal",
        indexes = @Index(name = "idx_meta_casal_vinculo", columnList = "casal_vinculo_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetaCasal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "casal_vinculo_id", nullable = false)
    private CasalVinculo casal;

    @Column(name = "titulo", nullable = false, length = 120)
    private String titulo;

    @Column(name = "valor_alvo", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorAlvo;

    @Builder.Default
    @Column(name = "valor_atual", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorAtual = BigDecimal.ZERO;

    /** Adiciona um valor ao objetivo (nao deixa passar do alvo). */
    public void adicionar(BigDecimal valor) {
        if (valor == null || valor.signum() <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero");
        }
        BigDecimal novo = this.valorAtual.add(valor);
        this.valorAtual = novo.compareTo(valorAlvo) > 0 ? valorAlvo : novo;
    }

    /** Progresso de 0 a 100 (%). */
    public double getPercentual() {
        if (valorAlvo == null || valorAlvo.signum() == 0) {
            return 0;
        }
        return valorAtual
                .multiply(BigDecimal.valueOf(100))
                .divide(valorAlvo, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
