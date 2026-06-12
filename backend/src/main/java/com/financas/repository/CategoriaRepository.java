package com.financas.repository;

import com.financas.entity.Categoria;
import com.financas.enums.TipoTransacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    List<Categoria> findByUsuarioIdOrderByNomeAsc(UUID usuarioId);

    List<Categoria> findByUsuarioIdAndTipoOrderByNomeAsc(UUID usuarioId, TipoTransacao tipo);

    Optional<Categoria> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    boolean existsByNomeAndUsuarioId(String nome, UUID usuarioId);
}
