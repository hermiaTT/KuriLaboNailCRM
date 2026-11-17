package com.kurilabo.portfolio.application;

import com.kurilabo.shared.error.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class LocalMediaStorage {

    private static final long MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path root;

    public LocalMediaStorage(@Value("${kuri.media.root}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    public StoredImage store(MultipartFile file) {
        String contentType = resolveContentType(file);
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Uploaded images cannot be empty.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Each image must be 10 MB or smaller.");
        }
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, WebP, and GIF images are supported.");
        }
        String objectKey = UUID.randomUUID() + extension;
        Path target = resolve(objectKey);
        try {
            Files.createDirectories(root);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredImage(objectKey, file.getOriginalFilename(), contentType, file.getSize());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store the uploaded image.");
        }
    }

    public Resource load(String objectKey) {
        Path path = resolve(objectKey);
        if (!Files.isRegularFile(path)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image was not found.");
        }
        return new FileSystemResource(path);
    }

    public void delete(String objectKey) {
        try {
            Files.deleteIfExists(resolve(objectKey));
        } catch (IOException ignored) {
            // A later cleanup job can remove an orphaned local object.
        }
    }

    private Path resolve(String objectKey) {
        Path resolved = root.resolve(objectKey).normalize();
        if (!resolved.startsWith(root)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid media key.");
        }
        return resolved;
    }

    private String resolveContentType(MultipartFile file) {
        if (EXTENSIONS.containsKey(file.getContentType())) {
            return file.getContentType();
        }
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return null;
        }
        String lower = filename.toLowerCase(java.util.Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return null;
    }

    public record StoredImage(String objectKey, String originalFilename, String contentType, long sizeBytes) {
    }
}
