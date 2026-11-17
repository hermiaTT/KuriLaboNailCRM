package com.kurilabo.portfolio.infrastructure;

import com.kurilabo.portfolio.domain.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {
}
