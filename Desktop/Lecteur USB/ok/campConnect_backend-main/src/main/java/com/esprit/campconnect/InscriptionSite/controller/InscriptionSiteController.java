package com.esprit.campconnect.InscriptionSite.controller;

import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteCreateRequest;
import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteResponse;
import com.esprit.campconnect.InscriptionSite.dto.InscriptionSiteUpdateRequest;
import com.esprit.campconnect.InscriptionSite.service.IInscriptionSiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Gestion Inscription Site")
@RestController
@RequiredArgsConstructor
@RequestMapping("/inscriptionsite")
public class InscriptionSiteController {

    private final IInscriptionSiteService iInscriptionSiteService;

    @Operation(description = "Récupérer une inscription site")
    @GetMapping("/{idInscription}")
    public InscriptionSiteResponse getInscriptionSite(@PathVariable Long idInscription) {
        return iInscriptionSiteService.getInscriptionSiteById(idInscription);
    }

    @Operation(description = "Ajouter une inscription site")
    @PostMapping("/add")
    public InscriptionSiteResponse addInscriptionSite(@RequestBody InscriptionSiteCreateRequest request) {
        return iInscriptionSiteService.addInscriptionSite(request);
    }

    @Operation(description = "Supprimer une inscription site")
    @DeleteMapping("/delete/{idInscription}")
    public void deleteInscriptionSite(@PathVariable Long idInscription) {
        iInscriptionSiteService.deleteInscriptionSite(idInscription);
    }

    @Operation(description = "Récupérer toutes les inscriptions site")
    @GetMapping("/getAll")
    public List<InscriptionSiteResponse> getAll() {
        return iInscriptionSiteService.getAllInscriptionSites();
    }

    @Operation(description = "Mise à jour partielle d'une inscription site")
    @PatchMapping("/update/{idInscription}")
    public InscriptionSiteResponse patchInscriptionSite(
            @PathVariable Long idInscription,
            @RequestBody InscriptionSiteUpdateRequest request) {

        return iInscriptionSiteService.patchInscriptionSite(idInscription, request);
    }

    @Operation(description = "Récupérer les inscriptions d'un site camping")
    @GetMapping("/bySite/{idSite}")
    public List<InscriptionSiteResponse> getBySite(@PathVariable Long idSite) {
        return iInscriptionSiteService.getBySiteCamping(idSite);
    }

    @Operation(description = "Confirmer une inscription site")
    @PatchMapping("/confirm/{idInscription}")
    public InscriptionSiteResponse confirmInscriptionSite(@PathVariable Long idInscription) {
        return iInscriptionSiteService.confirmInscriptionSite(idInscription);
    }

    @Operation(description = "Annuler une inscription site")
    @PatchMapping("/cancel/{idInscription}")
    public InscriptionSiteResponse cancelInscriptionSite(@PathVariable Long idInscription) {
        return iInscriptionSiteService.cancelInscriptionSite(idInscription);
    }

    @Operation(description = "Récupérer mes inscriptions")
    @GetMapping("/my-inscriptions")
    public List<InscriptionSiteResponse> getMyInscriptions() {
        return iInscriptionSiteService.getMyInscriptions();
    }
}