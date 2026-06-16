package com.financas.repository;

import com.financas.entity.MetaCasal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Consultas das metas (objetivos) compartilhadas de um casal. */
public interface MetaCasalRepository extends JpaRepository<MetaCasal, UUID> {

    /** Metas de um casal, da mais recente para a mais antiga. */
    List<MetaCasal> findByCasalIdOrderByCreatedAtDesc(UUID casalId);

    /** Busca uma meta garantindo que ela pertence ao casal informado. */
    Optional<MetaCasal> findByIdAndCasalId(UUID id, UUID casalId);
}
