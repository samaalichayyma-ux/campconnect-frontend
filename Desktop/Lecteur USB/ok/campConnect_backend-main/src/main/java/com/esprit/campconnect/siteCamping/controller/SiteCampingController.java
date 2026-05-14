package com.esprit.campconnect.siteCamping.controller;

import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.siteCamping.dto.SiteCampingCreateRequest;
import com.esprit.campconnect.siteCamping.dto.SiteCampingResponse;
import com.esprit.campconnect.siteCamping.dto.SiteCampingUpdateRequest;
import com.esprit.campconnect.siteCamping.service.ISiteCampingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Gestion Site Camping")
@RestController
@RequestMapping("/site-camping")
@AllArgsConstructor
public class SiteCampingController {
    private final ISiteCampingService iSiteCampingService;
    private final UtilisateurRepository utilisateurRepository;

    @GetMapping("/getsite/{idSite}")
    public SiteCampingResponse retrieveSiteCamping(@PathVariable Long idSite) {
        return iSiteCampingService.getSiteCampingById(idSite);
    }

    @PostMapping(value = "/addSite", consumes = "multipart/form-data")
    public SiteCampingResponse addSiteCamping(@ModelAttribute SiteCampingCreateRequest request) {
        return iSiteCampingService.addSiteCamping(request);
    }

    @GetMapping("/getAll")
    public List<SiteCampingResponse> getAllSiteCampings() {
        return iSiteCampingService.getAllSiteCampings();
    }

    @PatchMapping(value = "/updateSite/{idSite}", consumes = "multipart/form-data")
    public SiteCampingResponse patchSiteCamping(
            @PathVariable Long idSite,
            @ModelAttribute SiteCampingUpdateRequest updatedData) {

        return iSiteCampingService.patchSiteCamping(idSite, updatedData);
    }

    @PatchMapping("/close/{idSite}")
    public SiteCampingResponse closeSiteCamping(@PathVariable Long idSite) {
        return iSiteCampingService.closeSiteCamping(idSite);
    }

    @GetMapping("/my-sites")
    public List<SiteCampingResponse> getMySites() {
        return iSiteCampingService.getMySites();
    }

}
