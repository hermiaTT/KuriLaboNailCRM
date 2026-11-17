package com.kurilabo.portfolio.api;

import com.kurilabo.portfolio.application.NailSetService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class NailSetController {

    private final NailSetService nailSetService;

    public NailSetController(NailSetService nailSetService) {
        this.nailSetService = nailSetService;
    }

    @GetMapping("/inspiration")
    List<NailSetResponse> inspiration(JwtAuthenticationToken authentication) {
        return nailSetService.getInspiration(userId(authentication));
    }

    @GetMapping("/nail-sets/mine")
    List<NailSetResponse> mine(JwtAuthenticationToken authentication) {
        return nailSetService.getMine(userId(authentication));
    }

    @PostMapping("/inspiration/{nailSetId}/favorite")
    NailSetResponse favorite(
            JwtAuthenticationToken authentication,
            @PathVariable UUID nailSetId
    ) {
        return nailSetService.favorite(userId(authentication), nailSetId);
    }

    @DeleteMapping("/inspiration/{nailSetId}/favorite")
    NailSetResponse unfavorite(
            JwtAuthenticationToken authentication,
            @PathVariable UUID nailSetId
    ) {
        return nailSetService.unfavorite(userId(authentication), nailSetId);
    }

    private UUID userId(JwtAuthenticationToken authentication) {
        return UUID.fromString(authentication.getToken().getSubject());
    }
}
