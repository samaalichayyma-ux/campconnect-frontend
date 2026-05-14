package com.esprit.campconnect.SiteCampingAvis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SiteCampingRatingResponse {
    private Long siteId;
    private Double averageRating;
    private Long totalRatings;
}