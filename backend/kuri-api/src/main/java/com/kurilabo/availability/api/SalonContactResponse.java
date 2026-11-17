package com.kurilabo.availability.api;

import com.kurilabo.availability.domain.SalonSetting;

public record SalonContactResponse(
        String salonName,
        String wechatId,
        String contactMessage
) {
    public static SalonContactResponse from(SalonSetting settings) {
        return new SalonContactResponse(
                settings.getSalonName(),
                settings.getWechatId(),
                settings.getContactMessage()
        );
    }
}
