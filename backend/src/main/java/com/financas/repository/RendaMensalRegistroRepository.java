package com.financas.repository;

import com.financas.entity.RendaMensalRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio para gerenciar registros de renda mensal processada.
 *
 * <p>Permite verificar se a renda de um usuario ja foi lancada
 * em um determinado mes/ano, evitando duplicidade.</p>
 *
 * @author Sistema Financas
 * @since 1.0
 */
public interface RendaMensalRegistroRepository extends JpaRepository<RendaMensalRegistro, UUID> {

    /**
     * Verifica se ja existe registro de renda para o usuario no mes/ano especificado.
     *
     * @param usuarioId ID do usuario
     * @param ano       Ano (ex: 2026)
     * @param mes       Mes (1-12)
     * @return true se ja foi processado, false caso contrario
     */
    boolean existsByUsuarioIdAndAnoAndMes(UUID usuarioId, Integer ano, Integer mes);

    /**
     * Busca o registro de renda de um usuario em um mes/ano especifico.
     *
     * @param usuarioId ID do usuario
     * @param ano       Ano
     * @param mes       Mes
     * @return Optional com o registro, se existir
     */
    Optional<RendaMensalRegistro> findByUsuarioIdAndAnoAndMes(UUID usuarioId, Integer ano, Integer mes);

    /**
     * Lista todos os registros de renda de um usuario (historico).
     *
     * @param usuarioId ID do usuario
     * @return Lista de registros ordenados por data
     */
    List<RendaMensalRegistro> findByUsuarioIdOrderByAnoDescMesDesc(UUID usuarioId);
}
