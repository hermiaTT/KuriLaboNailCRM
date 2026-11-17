package com.kurilabo.portfolio.infrastructure;

import com.kurilabo.portfolio.domain.NailSet;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NailSetRepository extends JpaRepository<NailSet, UUID> {

    @Override
    @EntityGraph(attributePaths = {"media", "media.mediaAsset", "client", "appointment"})
    Optional<NailSet> findById(UUID id);

    @EntityGraph(attributePaths = {"media", "media.mediaAsset", "client", "appointment"})
    List<NailSet> findByPublishedTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"media", "media.mediaAsset", "client", "appointment"})
    List<NailSet> findByClient_IdOrderByCreatedAtDesc(UUID clientId);

    boolean existsByAppointment_Id(UUID appointmentId);

    boolean existsByAppointment_IdAndIdNot(UUID appointmentId, UUID nailSetId);

    @Query("""
            select (count(n) > 0) from NailSet n join n.media m
            where n.published = true and m.mediaAsset.id = :mediaId
            """)
    boolean isPublishedMedia(@Param("mediaId") UUID mediaId);
}
