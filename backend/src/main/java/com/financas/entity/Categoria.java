package com.financas.entity;

import com.financas.enums.TipoTransacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Categoria usada para classificar uma transacao (ex: Alimentacao, Salario).
 * Cada categoria pertence a um usuario e tem um tipo (RECEITA ou DESPESA).
 */
@Entity
@Table(name = "categoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categoria extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    /** Nome do icone exibido no frontend (opcional). */
    @Column(name = "icone", length = 50)
    private String icone;

    /** Cor em hexadecimal usada na interface (ex: #047857). */
    @Builder.Default
    @Column(name = "cor_hex", nullable = false, length = 7)
    private String corHex = "#6B7280";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoTransacao tipo = TipoTransacao.DESPESA;

    /** Limite de gasto planejado para a categoria (opcional). */
    @Column(name = "orcamento", precision = 15, scale = 2)
    private BigDecimal orcamento;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
