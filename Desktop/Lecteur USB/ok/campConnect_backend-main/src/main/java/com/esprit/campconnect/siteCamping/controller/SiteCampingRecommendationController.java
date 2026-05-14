package com.esprit.campconnect.siteCamping.controller;

import com.esprit.campconnect.siteCamping.dto.RecommendedSiteResponse;
import com.esprit.campconnect.siteCamping.service.SiteRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/site-camping/recommendations")
@RequiredArgsConstructor
@Tag(name = "Site Camping Recommendations")
public class SiteCampingRecommendationController {

    private final SiteRecommendationService siteRecommendationService;

    @Operation(description = "Get recommended camping sites")
    @GetMapping("/recommended")
    public List<RecommendedSiteResponse> getRecommendedSites() {
        return siteRecommendationService.getRecommendedSites();
    }


}