package com.esprit.campconnect.siteCamping.service;

import com.esprit.campconnect.siteCamping.dto.RecommendedSiteResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RuleBasedRecommendationTextService {

    public RecommendedSiteResponse enrich(RecommendedSiteResponse site) {
        site.setRecommendationReason(buildReason(site));
        site.setSmartTags(buildTags(site));
        return site;
    }

    private String buildReason(RecommendedSiteResponse site) {

        if (site.getAverageRating() >= 4.5 && site.getTotalBookings() >= 10) {
            return "Recommended for its excellent reviews and high booking demand.";
        }

        if (site.getAverageRating() >= 4.0) {
            return "Recommended for its strong guest feedback and appealing camping experience.";
        }

        if ("AVAILABLE".equals(site.getStatutDispo())) {
            return "Recommended for its current availability and complete campsite profile.";
        }

        return "Recommended as a promising campsite with useful information for campers.";
    }

    private List<String> buildTags(RecommendedSiteResponse site) {
        List<String> tags = new ArrayList<>();

        if (site.getAverageRating() >= 4.5) {
            tags.add("top rated");
        }
        if (site.getTotalBookings() >= 10) {
            tags.add("popular");
        }
        if ("AVAILABLE".equals(site.getStatutDispo())) {
            tags.add("available");
        }
        if (site.getPrixParNuit() != null && site.getPrixParNuit() <= 50) {
            tags.add("budget friendly");
        }

        if (tags.isEmpty()) {
            tags.add("recommended");
        }

        return tags;
    }
}