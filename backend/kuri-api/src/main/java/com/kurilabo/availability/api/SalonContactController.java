package com.kurilabo.availability.api;

import com.kurilabo.availability.application.AvailabilityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/salon/contact")
public class SalonContactController {

    private final AvailabilityService availabilityService;

    public SalonContactController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public SalonContactResponse getContact() {
        return SalonContactResponse.from(availabilityService.getSettings());
    }
}
