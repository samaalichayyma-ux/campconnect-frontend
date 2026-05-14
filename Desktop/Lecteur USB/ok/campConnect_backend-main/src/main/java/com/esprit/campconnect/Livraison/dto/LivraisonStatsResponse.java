package com.esprit.campconnect.Livraison.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LivraisonStatsResponse {
    long totalAssigned;
    long planned;
    long inProgress;
    long delivered;
    long failed;
    long returnedCount;
}