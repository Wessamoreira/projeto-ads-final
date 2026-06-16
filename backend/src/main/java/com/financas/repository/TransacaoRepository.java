package com.financas.repository;

import com.financas.entity.Transacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransacaoRepository extends JpaRepository<Transacao, UUID> {

    Page<Transacao> findByUsuarioId(UUID usuarioId, Pageable pageable);

    Optional<Transacao> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    /** Transacoes de um usuario dentro de um intervalo de datas (usado no dashboard). */
    List<Transacao> findByUsuarioIdAndDataTransacaoBetween(
            UUID usuarioId, LocalDate inicio, LocalDate fim);

    /**
     * Transacoes de varios usuarios num intervalo (usado na visao do casal:
     * junta os lancamentos dos dois parceiros). Faz JOIN FETCH da categoria e do
     * usuario para o calculo agregado nao disparar consultas extras.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT t FROM Transacao t " +
            "JOIN FETCH t.categoria JOIN FETCH t.usuario " +
            "WHERE t.usuario.id IN :usuarioIds " +
            "AND t.dataTransacao BETWEEN :inicio AND :fim")
    List<Transacao> findByUsuariosAndPeriodo(
            @org.springframework.data.repository.query.Param("usuarioIds") Collection<UUID> usuarioIds,
            @org.springframework.data.repository.query.Param("inicio") LocalDate inicio,
            @org.springframework.data.repository.query.Param("fim") LocalDate fim);

    boolean existsByCategoriaId(UUID categoriaId);
}
