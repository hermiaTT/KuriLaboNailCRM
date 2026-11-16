package com.kurilabo.servicecatalog.api;

import com.kurilabo.servicecatalog.application.ServiceCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
public class AdminServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    public AdminServiceCatalogController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public List<AdminServiceDefinitionResponse> getAll() {
        return serviceCatalogService.getAllServices();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminServiceDefinitionResponse create(@Valid @RequestBody AdminServiceDefinitionRequest request) {
        return serviceCatalogService.create(request);
    }

    @PutMapping("/{serviceId}")
    public AdminServiceDefinitionResponse update(
            @PathVariable UUID serviceId,
            @Valid @RequestBody AdminServiceDefinitionRequest request
    ) {
        return serviceCatalogService.update(serviceId, request);
    }

    @DeleteMapping("/{serviceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID serviceId) {
        serviceCatalogService.deactivate(serviceId);
    }
}
