package com.kurilabo.availability.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "salon_setting")
public class SalonSetting {

    @Id
    private Short id;

    @Column(name = "salon_name", nullable = false)
    private String salonName;

    @Column(nullable = false)
    private String timezone;

    @Column(name = "opening_time", nullable = false)
    private LocalTime openingTime;

    @Column(name = "closing_time", nullable = false)
    private LocalTime closingTime;

    @Column(name = "booking_increment_minutes", nullable = false)
    private int bookingIncrementMinutes;

    @Column(name = "wechat_id")
    private String wechatId;

    @Column(name = "contact_message")
    private String contactMessage;

    protected SalonSetting() {
    }

    public String getTimezone() {
        return timezone;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public int getBookingIncrementMinutes() {
        return bookingIncrementMinutes;
    }

    public String getSalonName() {
        return salonName;
    }

    public String getWechatId() {
        return wechatId;
    }

    public String getContactMessage() {
        return contactMessage;
    }
}

