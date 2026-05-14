package com.esprit.campconnect.SiteCampingAvis.controller;

import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisAdminResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisCreateRequest;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisResponse;
import com.esprit.campconnect.SiteCampingAvis.dto.SiteCampingAvisUpdateRequest;
import com.esprit.campconnect.SiteCampingAvis.service.ISiteCampingAvisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Gestion Site Camping Avis")
@RestController
@RequestMapping("/site-camping-avis")
@AllArgsConstructor
public class SiteCampingAvisController {

    private final ISiteCampingAvisService iSiteCampingAvisService;

    @Operation(description = "Ajouter un avis à un site camping")
    @PostMapping("/site/{siteId}")
    public SiteCampingAvisResponse createSiteCampingAvis(
            @PathVariable Long siteId,
            @RequestBody SiteCampingAvisCreateRequest request) {
        return iSiteCampingAvisService.createSiteCampingAvis(siteId, request);
    }

    @Operation(description = "Mettre à jour partiellement un avis")
    @PatchMapping("/{idAvis}")
    public SiteCampingAvisResponse patchSiteCampingAvis(
            @PathVariable Long idAvis,
            @RequestBody SiteCampingAvisUpdateRequest request) {
        return iSiteCampingAvisService.patchSiteCampingAvis(idAvis, request);
    }

    @Operation(description = "Supprimer un avis")
    @DeleteMapping("/{idAvis}")
    public void deleteSiteCampingAvis(@PathVariable Long idAvis) {
        iSiteCampingAvisService.deleteSiteCampingAvis(idAvis);
    }

    @Operation(description = "Récupérer tous les avis d'un site camping")
    @GetMapping("/site/{siteId}")
    public List<SiteCampingAvisResponse> getAvisBySite(@PathVariable Long siteId) {
        return iSiteCampingAvisService.getAvisBySite(siteId);
    }

    @Operation(description = "Récupérer tous les avis pour l'administration")
    @GetMapping("/admin/site-camping-avis")
    public List<SiteCampingAvisAdminResponse> getAllAvisForAdmin() {
        return iSiteCampingAvisService.getAllAvisForAdmin();
    }
}