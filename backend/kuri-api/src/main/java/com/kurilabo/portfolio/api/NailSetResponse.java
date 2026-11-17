package com.kurilabo.portfolio.api;

import com.kurilabo.portfolio.domain.NailSet;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record NailSetResponse(
        UUID id,
        UUID clientId,
        UUID appointmentId,
        String title,
        String description,
        Instant createdAt,
        boolean favorited,
        List<NailSetImageResponse> images
) {
    public static NailSetResponse from(NailSet nailSet, boolean favorited) {
        return new NailSetResponse(
                nailSet.getId(),
                nailSet.getClient() == null ? null : nailSet.getClient().getId(),
                nailSet.getAppointment() == null ? null : nailSet.getAppointment().getId(),
                nailSet.getTitle(),
                nailSet.getDescription(),
                nailSet.getCreatedAt(),
                favorited,
                nailSet.getMedia().stream()
                        .map(link -> new NailSetImageResponse(
                                link.getMediaAsset().getId(),
                                "/api/v1/media/" + link.getMediaAsset().getId() + "/content",
                                link.getDisplayOrder()
                        ))
                        .toList()
        );
    }

    public record NailSetImageResponse(UUID id, String url, int displayOrder) {
    }
}
