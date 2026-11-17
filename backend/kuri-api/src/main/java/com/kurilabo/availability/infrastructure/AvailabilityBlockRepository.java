package com.kurilabo.availability.infrastructure;

import com.kurilabo.availability.domain.AvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

public interface AvailabilityBlockRepository extends JpaRepository<AvailabilityBlock, UUID> {

    @Query("""
            select (count(b) > 0) from AvailabilityBlock b
            where b.startAt < :endAt
              and b.endAt > :startAt
            """)
    boolean existsOverlapping(@Param("startAt") Instant startAt, @Param("endAt") Instant endAt);

    List<AvailabilityBlock> findByStartAtLessThanAndEndAtGreaterThanOrderByStartAtAsc(
            Instant rangeEnd,
            Instant rangeStart
    );
}

