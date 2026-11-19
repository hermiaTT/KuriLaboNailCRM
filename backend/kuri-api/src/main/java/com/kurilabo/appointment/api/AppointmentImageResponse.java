package com.kurilabo.appointment.api;

import com.kurilabo.appointment.domain.AppointmentReferenceMedia;
import java.util.UUID;

public record AppointmentImageResponse(UUID id, String url, int displayOrder) {
    public static AppointmentImageResponse from(AppointmentReferenceMedia image) {
        return new AppointmentImageResponse(
                image.getMediaAsset().getId(),
                "/api/v1/media/" + image.getMediaAsset().getId() + "/content",
                image.getDisplayOrder()
        );
    }
}
