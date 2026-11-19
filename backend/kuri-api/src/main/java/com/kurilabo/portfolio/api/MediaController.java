package com.kurilabo.portfolio.api;

import com.kurilabo.portfolio.application.LocalMediaStorage;
import com.kurilabo.portfolio.domain.MediaAsset;
import com.kurilabo.portfolio.infrastructure.MediaAssetRepository;
import com.kurilabo.portfolio.infrastructure.NailSetRepository;
import com.kurilabo.shared.error.ApiException;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaAssetRepository mediaAssetRepository;
    private final LocalMediaStorage storage;

    public MediaController(
            MediaAssetRepository mediaAssetRepository,
            LocalMediaStorage storage
    ) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.storage = storage;
    }

    @GetMapping("/{mediaId}/content")
    ResponseEntity<Resource> content(@PathVariable UUID mediaId, @RequestParam(defaultValue = "false") boolean download) {
        if (!mediaAssetRepository.isVisibleMedia(mediaId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image was not found.");
        }
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Image was not found."));
        Resource resource = storage.load(asset.getObjectKey());
        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.getContentType()))
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());
        if (download) {
            String filename = asset.getOriginalFilename() == null ? mediaId + ".jpg" : asset.getOriginalFilename();
            response.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString());
        }
        return response.body(resource);
    }
}
