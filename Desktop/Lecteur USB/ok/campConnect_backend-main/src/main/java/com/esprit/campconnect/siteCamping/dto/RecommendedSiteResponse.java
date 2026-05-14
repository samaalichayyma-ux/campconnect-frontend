package com.esprit.campconnect.siteCamping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendedSiteResponse {
    private Long siteId;
    private String nom;
    private String localisation;
    private Integer capacite;
    private Integer remainingCapacity;
    private Double prixParNuit;
    private String description;
    private String imageUrl;
    private String statutDispo;

    private Double averageRating;
    private Long totalRatings;
    private Long totalBookings;

    private Integer recommendationScore;

    private String recommendationReason;
    private List<String> smartTags;
}