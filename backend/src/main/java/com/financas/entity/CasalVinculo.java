package com.financas.entity;

import com.financas.enums.StatusVinculo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Vinculo entre dois usuarios (casal).
 *
 * <p>Ciclo de vida:</p>
 * <ol>
 *   <li>Usuario1 convida o Usuario2 (pelo e-mail) -> status PENDENTE.</li>
 *   <li>Usuario2 aceita o convite -> status ATIVO.</li>
 *   <li>Qualquer um desfaz / recusa / cancela -> status DESVINCULADO.</li>
 * </ol>
 */
@Entity
@Table(
        name = "casal_vinculo",
        indexes = {
                @Index(name = "idx_casal_usuario_1", columnList = "usuario_1_id"),
                @Index(name = "idx_casal_usuario_2", columnList = "usuario_2_id"),
                @Index(name = "idx_casal_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CasalVinculo extends BaseEntity {

    /** Quem enviou o convite. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_1_id", nullable = false)
    private Usuario usuario1;

    /** Quem recebeu o convite. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_2_id", nullable = false)
    private Usuario usuario2;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusVinculo status = StatusVinculo.PENDENTE;

    /** Momento em que o convite foi aceito (vinculo ficou ATIVO). */
    @Column(name = "vinculado_em")
    private LocalDateTime vinculadoEm;

    // =========================================================================
    // METODOS DE DOMINIO
    // =========================================================================

    public boolean isPendente() {
        return this.status == StatusVinculo.PENDENTE;
    }

    public boolean isAtivo() {
        return this.status == StatusVinculo.ATIVO;
    }

    /** Verifica se um usuario faz parte deste vinculo. */
    public boolean contemUsuario(UUID usuarioId) {
        if (usuarioId == null) {
            return false;
        }
        return (usuario1 != null && usuarioId.equals(usuario1.getId()))
                || (usuario2 != null && usuarioId.equals(usuario2.getId()));
    }

    /** Retorna o parceiro de um usuario (a outra pessoa do vinculo). */
    public Usuario getParceiro(UUID usuarioId) {
        if (usuario1 != null && usuario1.getId().equals(usuarioId)) {
            return usuario2;
        }
        if (usuario2 != null && usuario2.getId().equals(usuarioId)) {
            return usuario1;
        }
        return null;
    }

    /** Aceita o convite e ativa o vinculo. */
    public void aceitar() {
        if (!isPendente()) {
            throw new IllegalStateException("Convite nao esta mais disponivel");
        }
        this.status = StatusVinculo.ATIVO;
        this.vinculadoEm = LocalDateTime.now();
    }

    /** Marca o vinculo como desfeito (recusado / cancelado / desvinculado). */
    public void desvincular() {
        this.status = StatusVinculo.DESVINCULADO;
    }
}
