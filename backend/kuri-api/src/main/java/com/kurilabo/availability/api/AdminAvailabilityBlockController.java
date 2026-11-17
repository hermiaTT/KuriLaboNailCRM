package com.kurilabo.availability.api;

import com.kurilabo.availability.application.AvailabilityBlockService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/availability-blocks")
public class AdminAvailabilityBlockController {

    private final AvailabilityBlockService blockService;

    public AdminAvailabilityBlockController(AvailabilityBlockService blockService) {
        this.blockService = blockService;
    }

    @GetMapping
    List<AvailabilityBlockResponse> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return blockService.list(from, to);
    }

    @PostMapping
    AvailabilityBlockResponse create(
            JwtAuthenticationToken authentication,
            @Valid @RequestBody CreateAvailabilityBlockRequest request
    ) {
        return blockService.create(
                UUID.fromString(authentication.getToken().getSubject()),
                request
        );
    }

    @DeleteMapping("/{blockId}")
    ResponseEntity<Void> delete(@PathVariable UUID blockId) {
        blockService.delete(blockId);
        return ResponseEntity.noContent().build();
    }
}

