package com.financas.repository;

import com.financas.entity.Transacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransacaoRepository extends JpaRepository<Transacao, UUID> {

    Page<Transacao> findByUsuarioId(UUID usuarioId, Pageable pageable);

    Optional<Transacao> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    /** Transacoes de um usuario dentro de um intervalo de datas (usado no dashboard). */
    List<Transacao> findByUsuarioIdAndDataTransacaoBetween(
            UUID usuarioId, LocalDate inicio, LocalDate fim);

    boolean existsByCategoriaId(UUID categoriaId);
}
