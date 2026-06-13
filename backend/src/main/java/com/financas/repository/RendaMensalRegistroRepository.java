package com.financas.repository;

import com.financas.entity.RendaMensalRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Acesso aos registros de renda mensal ja lancada (evita lancar duas vezes no mesmo mes).
 *
 * @author Wesley Moreira dos Santos
 */
public interface RendaMensalRegistroRepository extends JpaRepository<RendaMensalRegistro, UUID> {

    /** Diz se a renda do usuario ja foi lancada naquele mes/ano. */
    boolean existsByUsuarioIdAndAnoAndMes(UUID usuarioId, Integer ano, Integer mes);

    /** Busca o registro de renda do usuario num mes/ano. */
    Optional<RendaMensalRegistro> findByUsuarioIdAndAnoAndMes(UUID usuarioId, Integer ano, Integer mes);

    /** Historico de lancamentos do usuario, mais recentes primeiro. */
    List<RendaMensalRegistro> findByUsuarioIdOrderByAnoDescMesDesc(UUID usuarioId);
}
