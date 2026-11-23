package com.kurilabo.portfolio.api;

import com.kurilabo.portfolio.application.NailSetService;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/nail-sets")
public class AdminNailSetController {

    private final NailSetService nailSetService;

    public AdminNailSetController(NailSetService nailSetService) {
        this.nailSetService = nailSetService;
    }

    @GetMapping
    List<NailSetResponse> listForClient(@RequestParam UUID clientId) {
        return nailSetService.getForClient(clientId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    NailSetResponse create(
            JwtAuthenticationToken authentication,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID appointmentId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam("files") List<MultipartFile> files
    ) {
        return nailSetService.create(
                UUID.fromString(authentication.getToken().getSubject()),
                clientId,
                appointmentId,
                title,
                description,
                files
        );
    }

    @PutMapping("/{nailSetId}")
    NailSetResponse update(
            JwtAuthenticationToken authentication,
            @PathVariable UUID nailSetId,
            @Valid @RequestBody UpdateNailSetRequest request
    ) {
        return nailSetService.update(
                UUID.fromString(authentication.getToken().getSubject()),
                nailSetId,
                request
        );
    }
}
