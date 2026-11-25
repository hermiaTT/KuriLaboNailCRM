package com.kurilabo.portfolio.infrastructure;

import com.kurilabo.portfolio.domain.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {
    @org.springframework.data.jpa.repository.Query(value = """
            select exists (
                select 1 from nail_set_media nsm join nail_set ns on ns.id = nsm.nail_set_id
                where nsm.media_asset_id = :mediaId and ns.published = true
            ) or exists (
                select 1 from appointment_reference_media arm where arm.media_asset_id = :mediaId
            ) or exists (
                select 1 from client c where c.avatar_media_id = :mediaId
            ) or exists (
                select 1 from admin_profile ap where ap.avatar_media_id = :mediaId
            )
            """, nativeQuery = true)
    boolean isVisibleMedia(@org.springframework.data.repository.query.Param("mediaId") UUID mediaId);
}
