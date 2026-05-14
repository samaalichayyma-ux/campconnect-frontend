package com.esprit.campconnect.siteCamping.service;

import com.esprit.campconnect.InscriptionSite.entity.StatutInscription;
import com.esprit.campconnect.InscriptionSite.repository.InscriptionSiteRepository;
import com.esprit.campconnect.SiteCampingAvis.repository.SiteCampingAvisRepository;
import com.esprit.campconnect.siteCamping.dto.RecommendedSiteResponse;
import com.esprit.campconnect.siteCamping.entity.SiteCamping;
import com.esprit.campconnect.siteCamping.repository.SiteCampingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteRecommendationService {

    private final SiteCampingRepository siteCampingRepository;
    private final SiteCampingAvisRepository siteCampingAvisRepository;
    private final InscriptionSiteRepository inscriptionSiteRepository;
    private final RuleBasedRecommendationTextService ruleBasedRecommendationTextService;


    public List<RecommendedSiteResponse> getRecommendedSites() {
        List<RecommendedSiteResponse> sites = siteCampingRepository.findAllVisibleSites()
                .stream()
                .map(this::buildRecommendationBase)
                .sorted(Comparator.comparing(RecommendedSiteResponse::getRecommendationScore).reversed())
                .limit(6)
                .toList();

        return enrichSites(sites);
    }

    private List<RecommendedSiteResponse> enrichSites(List<RecommendedSiteResponse> sites) {
        return sites.stream()
                .map(ruleBasedRecommendationTextService::enrich)
                .toList();
    }

    private RecommendedSiteResponse buildRecommendationBase(SiteCamping site) {
        Double averageRating = siteCampingAvisRepository.getAverageRatingBySiteId(site.getIdSite());
        Long totalRatings = siteCampingAvisRepository.countRatingsBySiteId(site.getIdSite());
        Long totalBookings = inscriptionSiteRepository.countConfirmedBookingsBySiteId(site.getIdSite());

        averageRating = averageRating != null ? averageRating : 0.0;
        totalRatings = totalRatings != null ? totalRatings : 0L;
        totalBookings = totalBookings != null ? totalBookings : 0L;

        int score = 0;
        score += (int) Math.round((averageRating / 5.0) * 35.0);
        score += (int) Math.min(totalRatings, 15);
        score += (int) Math.min(totalBookings, 20);
        score += availabilityScore(site);
        score += completenessScore(site);


        return new RecommendedSiteResponse(
                site.getIdSite(),
                site.getNom(),
                site.getLocalisation(),
                site.getCapacite(),
                calculateRemainingCapacity(site),
                site.getPrixParNuit(),
                site.getDescription(),
                site.getImageUrl(),
                site.getStatutDispo() != null ? site.getStatutDispo().name() : null,
                roundOneDecimal(averageRating),
                totalRatings,
                totalBookings,
                score,
                null,
                null
        );
    }

    private int calculateRemainingCapacity(SiteCamping site) {
        Integer confirmedGuests = inscriptionSiteRepository
                .sumGuestsBySiteAndStatut(site.getIdSite(), StatutInscription.CONFIRMED);

        if (confirmedGuests == null) {
            confirmedGuests = 0;
        }

        return site.getCapacite() - confirmedGuests;
    }

    private int availabilityScore(SiteCamping site) {
        if (site.getStatutDispo() == null) {
            return 0;
        }

        return switch (site.getStatutDispo()) {
            case AVAILABLE -> 10;
            case FULL -> 3;
            case CLOSED -> 0;
        };
    }

    private int completenessScore(SiteCamping site) {
        int score = 0;
        if (site.getNom() != null && !site.getNom().isBlank()) score += 2;
        if (site.getDescription() != null && !site.getDescription().isBlank()) score += 2;
        if (site.getLocalisation() != null && !site.getLocalisation().isBlank()) score += 2;
        if (site.getImageUrl() != null && !site.getImageUrl().isBlank()) score += 2;
        if (site.getPrixParNuit() > 0) score += 1;
        if (site.getCapacite() != null && site.getCapacite() > 0) score += 1;
        return score;
    }

    private double roundOneDecimal(Double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}