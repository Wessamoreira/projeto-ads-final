package com.financas.repository;

import com.financas.entity.CasalVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Consultas dos vinculos de casal.
 *
 * <p>As buscas usam {@code JOIN FETCH} para ja trazer os usuarios envolvidos
 * (evita consultas extras quando montamos o DTO de resposta).</p>
 */
public interface CasalVinculoRepository extends JpaRepository<CasalVinculo, UUID> {

    /** Vinculo ATIVO do usuario (ele pode ser usuario1 ou usuario2). */
    @Query("SELECT cv FROM CasalVinculo cv " +
            "JOIN FETCH cv.usuario1 JOIN FETCH cv.usuario2 " +
            "WHERE cv.status = 'ATIVO' " +
            "AND (cv.usuario1.id = :usuarioId OR cv.usuario2.id = :usuarioId)")
    Optional<CasalVinculo> findAtivoByUsuario(@Param("usuarioId") UUID usuarioId);

    /** Convite PENDENTE que o usuario enviou (ele e o usuario1). */
    @Query("SELECT cv FROM CasalVinculo cv " +
            "JOIN FETCH cv.usuario1 JOIN FETCH cv.usuario2 " +
            "WHERE cv.status = 'PENDENTE' AND cv.usuario1.id = :usuarioId")
    Optional<CasalVinculo> findPendenteEnviadoByUsuario(@Param("usuarioId") UUID usuarioId);

    /** Convites PENDENTES que o usuario recebeu (ele e o usuario2). */
    @Query("SELECT cv FROM CasalVinculo cv " +
            "JOIN FETCH cv.usuario1 JOIN FETCH cv.usuario2 " +
            "WHERE cv.status = 'PENDENTE' AND cv.usuario2.id = :usuarioId " +
            "ORDER BY cv.createdAt DESC")
    List<CasalVinculo> findPendentesRecebidosByUsuario(@Param("usuarioId") UUID usuarioId);

    /** Verifica se o usuario ja possui um vinculo ATIVO. */
    @Query("SELECT COUNT(cv) > 0 FROM CasalVinculo cv " +
            "WHERE cv.status = 'ATIVO' " +
            "AND (cv.usuario1.id = :usuarioId OR cv.usuario2.id = :usuarioId)")
    boolean existsAtivoByUsuario(@Param("usuarioId") UUID usuarioId);

    /** Verifica se ja existe convite PENDENTE entre os dois usuarios (em qualquer direcao). */
    @Query("SELECT COUNT(cv) > 0 FROM CasalVinculo cv " +
            "WHERE cv.status = 'PENDENTE' " +
            "AND ((cv.usuario1.id = :usuarioA AND cv.usuario2.id = :usuarioB) " +
            "  OR (cv.usuario1.id = :usuarioB AND cv.usuario2.id = :usuarioA))")
    boolean existsPendenteEntre(@Param("usuarioA") UUID usuarioA, @Param("usuarioB") UUID usuarioB);
}
